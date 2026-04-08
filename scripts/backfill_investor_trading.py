"""
투자자 매매동향 6개월 백필 스크립트 (ka10059 사용)

watch_universe에서 is_active=true 종목을 조회하고,
ka10059 API로 투자자별 매매동향을 수집하여 investor_trading 테이블에 UPSERT.

실행:
    python3 scripts/backfill_investor_trading.py
    python3 scripts/backfill_investor_trading.py --months 3
    python3 scripts/backfill_investor_trading.py --start-date 20241001 --end-date 20250101

의존성:
    pip install httpx python-dotenv

=== ka10059 과거 데이터 지원 여부 ===
ka10059(투자자기관별 동향) API는 'dt' 파라미터로 기준일을 지정하고
응답의 각 행에 'dt' 필드가 포함됩니다.

daily_sync_kiwoom.py에서 오늘 날짜로 호출 시 여러 날짜 행이 반환되는 것을
확인한 바 있으며, 이는 과거 데이터 범위 조회를 지원함을 시사합니다.

단, ka10081(일봉차트)처럼 1회 호출에 수백 일치 데이터를 반환하는지,
또는 단일 날짜만 반환하는지는 실제 API 응답으로 확인해야 합니다.

제한 사항:
- API가 당일 데이터만 반환하는 경우: 과거 날짜로 dt를 바꿔가며 호출 필요
  (이 스크립트는 해당 방식으로 구현하여 양쪽 모두 대응)
- 6개월 x 200종목 x 영업일(~130일) = 최대 26,000 API 호출 가능성
  → API가 범위 반환 지원 시 200 호출로 완료, 미지원 시 장시간 소요
"""

import argparse
import httpx
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

try:
    from dotenv import load_dotenv
    import os as _os
    _HAS_DOTENV = True
except ImportError:
    _HAS_DOTENV = False

# --- 설정 ---
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUTH_FILE = _PROJECT_ROOT / '.claude/auth/kiwoom.env'
SUPABASE_ENV_FILE = _PROJECT_ROOT / 'apps/pharos-lab/.env.local'
BASE_URL = 'https://api.kiwoom.com'
DELAY_SEC = 0.8  # 키움 rate limit 대응 (200종목 기준 안전 마진)
DEFAULT_MONTHS = 6


# --- 유틸리티 ---

def load_env(path: str) -> dict[str, str]:
    """env 파일 파싱 (dotenv 라이브러리 우선, 없으면 직접 파싱)"""
    env: dict[str, str] = {}
    p = Path(path)

    if _HAS_DOTENV and p.exists():
        load_dotenv(str(p), override=False)
        # dotenv로 로드한 값도 dict에 반영
        with open(p) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
        return env

    try:
        with open(p) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    except FileNotFoundError:
        print(f'[WARN] env 파일 없음: {path}')
    return env


def parse_invsr_int(v: object) -> int:
    """투자자 순매수 금액 문자열 → int (+/-부호 포함)"""
    if v is None:
        return 0
    try:
        return int(str(v).strip().replace(',', ''))
    except (ValueError, TypeError):
        return 0


def business_dates_range(start: datetime, end: datetime) -> list[str]:
    """시작일~종료일 사이의 날짜 목록 (주말 제외, YYYYMMDD 형식)"""
    dates: list[str] = []
    cur = start
    while cur <= end:
        # 월(0)~금(4): weekday() 0~4
        if cur.weekday() < 5:
            dates.append(cur.strftime('%Y%m%d'))
        cur += timedelta(days=1)
    return dates


# --- 키움 API ---

def get_token(api_key: str, api_secret: str) -> str:
    """OAuth 토큰 발급"""
    resp = httpx.post(f'{BASE_URL}/oauth2/token', json={
        'grant_type': 'client_credentials',
        'appkey': api_key,
        'secretkey': api_secret,
    }, timeout=30)
    result = resp.json()
    if result.get('return_code') != 0:
        raise Exception(f"토큰 발급 실패: {result.get('return_msg')}")
    return result['token']


def fetch_investor_trading(
    token: str,
    stock_code: str,
    dt: str,
) -> list[dict]:
    """
    ka10059 투자자기관별 동향 조회.

    Args:
        token: Bearer 토큰
        stock_code: 종목코드 (6자리)
        dt: 기준일 (YYYYMMDD)

    Returns:
        행 목록. 각 행은 trade_date가 포함된 dict.
        API가 범위 데이터를 반환하면 여러 날짜 행을 포함할 수 있음.
    """
    headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'api-id': 'ka10059',
        'authorization': f'Bearer {token}',
    }
    resp = httpx.post(
        f'{BASE_URL}/api/dostk/stkinfo',
        headers=headers,
        json={
            'dt': dt,
            'stk_cd': stock_code,
            'amt_qty_tp': '1',   # 금액
            'trde_tp': '0',      # 순매수
            'unit_tp': '1000',   # 천원 단위
        },
        timeout=30,
    )
    result = resp.json()
    if result.get('return_code') != 0:
        raise Exception(f"ka10059 오류: {result.get('return_msg')}")

    rows = result.get('stk_invsr_orgn', [])
    records: list[dict] = []
    for r in rows:
        dt_str = r.get('dt', '').strip()
        if not dt_str or len(dt_str) != 8:
            continue
        trade_date = f'{dt_str[:4]}-{dt_str[4:6]}-{dt_str[6:8]}'
        records.append({
            'stock_code': stock_code,
            'trade_date': trade_date,
            'ind_invsr':   parse_invsr_int(r.get('ind_invsr')),
            'frgnr_invsr': parse_invsr_int(r.get('frgnr_invsr')),
            'orgn':        parse_invsr_int(r.get('orgn')),
            'fnnc_invt':   parse_invsr_int(r.get('fnnc_invt')),
            'insrnc':      parse_invsr_int(r.get('insrnc')),
            'invtrt':      parse_invsr_int(r.get('invtrt')),
            'etc_fnnc':    parse_invsr_int(r.get('etc_fnnc')),
            'bank':        parse_invsr_int(r.get('bank')),
            'penfnd_etc':  parse_invsr_int(r.get('penfnd_etc')),
            'samo_fund':   parse_invsr_int(r.get('samo_fund')),
            'natn':        parse_invsr_int(r.get('natn')),
            'etc_corp':    parse_invsr_int(r.get('etc_corp')),
            'natfor':      parse_invsr_int(r.get('natfor')),
        })
    return records


# --- Supabase 헬퍼 ---

def supabase_get(url: str, service_key: str, params: str = '') -> list[dict]:
    """Supabase REST GET (trading 스키마)"""
    full_url = f'{url}?{params}' if params else url
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Accept': 'application/json',
        'Accept-Profile': 'trading',
    }
    resp = httpx.get(full_url, headers=headers, timeout=30)
    if resp.status_code != 200:
        raise Exception(f'Supabase GET 실패: {resp.status_code} {resp.text[:200]}')
    return resp.json()


def supabase_upsert(
    url: str,
    service_key: str,
    records: list[dict],
    on_conflict: str = '',
    batch_size: int = 200,
) -> int:
    """Supabase REST UPSERT (trading 스키마). 배치 분할 지원."""
    if not records:
        return 0
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
        'Accept-Profile': 'trading',
        'Content-Profile': 'trading',
    }
    target = f'{url}?on_conflict={on_conflict}' if on_conflict else url
    inserted = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        resp = httpx.post(target, headers=headers, json=batch, timeout=60)
        if resp.status_code not in (200, 201):
            raise Exception(f'Supabase UPSERT 실패: {resp.status_code} {resp.text[:200]}')
        inserted += len(batch)
    return inserted


def deduplicate(records: list[dict]) -> list[dict]:
    """배치 내 중복 제거 (같은 stock_code+trade_date → 마지막 값 유지)"""
    seen: dict[tuple[str, str], int] = {}
    for idx, rec in enumerate(records):
        seen[(rec['stock_code'], rec['trade_date'])] = idx
    return [records[i] for i in sorted(seen.values())]


# --- 백필 모드 판별 ---

def detect_api_range_support(
    token: str,
    sample_code: str,
    today_str: str,
) -> bool:
    """
    ka10059가 기준일 이전의 다중 날짜 데이터를 반환하는지 탐지.

    오늘 날짜로 1회 호출 후 반환된 행 수가 2 이상이면 범위 지원으로 판단.
    """
    try:
        rows = fetch_investor_trading(token, sample_code, today_str)
        is_range = len(rows) > 1
        print(f'  [API 탐지] ka10059 기준일 호출 → {len(rows)}행 반환 → '
              f'{"범위 지원" if is_range else "단일 날짜 (날짜별 루프 필요)"}')
        return is_range
    except Exception as e:
        print(f'  [API 탐지] 실패 ({e}), 날짜별 루프 모드로 진행')
        return False


# --- 백필 실행 ---

def run_backfill_range_mode(
    token: str,
    supabase_url: str,
    service_key: str,
    stock_codes: list[str],
    stock_names: dict[str, str],
    start_dt: str,
    end_dt: str,
) -> tuple[int, list[str]]:
    """
    범위 지원 모드: 종목별 1회 호출 (오늘 기준, API가 과거 데이터를 함께 반환).
    반환된 rows에서 start_dt~end_dt 범위만 필터링하여 저장.
    """
    print(f'[백필] 범위 모드 — {len(stock_codes)}종목, {start_dt}~{end_dt}')
    total = 0
    failed: list[str] = []
    today_str = datetime.now().strftime('%Y%m%d')

    for i, code in enumerate(stock_codes):
        name = stock_names.get(code, '')
        try:
            rows = fetch_investor_trading(token, code, today_str)
            # 날짜 범위 필터 (YYYY-MM-DD 형식)
            start_iso = f'{start_dt[:4]}-{start_dt[4:6]}-{start_dt[6:8]}'
            end_iso = f'{end_dt[:4]}-{end_dt[4:6]}-{end_dt[6:8]}'
            filtered = [r for r in rows if start_iso <= r['trade_date'] <= end_iso]

            if filtered:
                filtered = deduplicate(filtered)
                cnt = supabase_upsert(
                    f'{supabase_url}/rest/v1/investor_trading',
                    service_key,
                    filtered,
                    on_conflict='stock_code,trade_date',
                )
                total += cnt
                print(f'  [{i+1:03d}/{len(stock_codes)}] {code} {name} — {cnt}건')
            else:
                print(f'  [{i+1:03d}/{len(stock_codes)}] {code} {name} — 0건 (범위 내 없음)')
        except Exception as e:
            print(f'  [{i+1:03d}/{len(stock_codes)}] {code} {name} — ERROR: {e}')
            failed.append(code)

        if i < len(stock_codes) - 1:
            time.sleep(DELAY_SEC)

    return total, failed


def run_backfill_date_loop_mode(
    token: str,
    supabase_url: str,
    service_key: str,
    stock_codes: list[str],
    stock_names: dict[str, str],
    start_dt: str,
    end_dt: str,
) -> tuple[int, list[str]]:
    """
    날짜별 루프 모드: API가 당일 데이터만 반환할 때 사용.
    날짜 × 종목 순으로 호출하며, 종목 단위로 실패를 추적.

    주의: 6개월 × 200종목 × 영업일(~130일) = 약 26,000 API 호출.
    DELAY_SEC=0.8 기준 약 6시간 소요.
    """
    start = datetime.strptime(start_dt, '%Y%m%d')
    end = datetime.strptime(end_dt, '%Y%m%d')
    dates = business_dates_range(start, end)
    print(f'[백필] 날짜별 루프 모드 — {len(stock_codes)}종목 × {len(dates)}일 = '
          f'{len(stock_codes) * len(dates)}회 호출 예상')
    print(f'  예상 소요: {len(stock_codes) * len(dates) * DELAY_SEC / 3600:.1f}시간')

    total = 0
    failed_set: set[str] = set()
    call_count = 0

    for date_str in dates:
        date_iso = f'{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}'
        date_records: list[dict] = []

        for code in stock_codes:
            name = stock_names.get(code, '')
            try:
                rows = fetch_investor_trading(token, code, date_str)
                # 해당 날짜 행만 필터
                day_rows = [r for r in rows if r['trade_date'] == date_iso]
                date_records.extend(day_rows)
            except Exception as e:
                print(f'  ERROR {date_str} {code} {name}: {e}')
                failed_set.add(code)

            call_count += 1
            if call_count % 50 == 0:
                print(f'  진행: {date_str} ({call_count}회 호출, {total}건 적재)')

            time.sleep(DELAY_SEC)

        # 날짜 단위 UPSERT
        if date_records:
            date_records = deduplicate(date_records)
            try:
                cnt = supabase_upsert(
                    f'{supabase_url}/rest/v1/investor_trading',
                    service_key,
                    date_records,
                    on_conflict='stock_code,trade_date',
                )
                total += cnt
                print(f'  {date_str}: {cnt}건 UPSERT')
            except Exception as e:
                print(f'  {date_str}: UPSERT 실패 — {e}')

    return total, list(failed_set)


# --- 메인 ---

def main() -> None:
    parser = argparse.ArgumentParser(description='투자자 매매동향 6개월 백필')
    parser.add_argument(
        '--months', type=int, default=DEFAULT_MONTHS,
        help=f'백필 기간 (개월). 기본값: {DEFAULT_MONTHS}',
    )
    parser.add_argument(
        '--start-date', type=str, default='',
        help='시작일 YYYYMMDD (--months 무시)',
    )
    parser.add_argument(
        '--end-date', type=str, default='',
        help='종료일 YYYYMMDD (기본: 오늘)',
    )
    parser.add_argument(
        '--force-date-loop', action='store_true',
        help='API 탐지 없이 날짜별 루프 모드로 강제 실행',
    )
    args = parser.parse_args()

    # 날짜 범위 계산
    today = datetime.now()
    end_dt = args.end_date if args.end_date else today.strftime('%Y%m%d')
    if args.start_date:
        start_dt = args.start_date
    else:
        start = today - timedelta(days=args.months * 30)
        start_dt = start.strftime('%Y%m%d')

    print(f'백필 범위: {start_dt} ~ {end_dt} ({args.months}개월)')

    # 환경 변수 로드
    kiwoom_env = load_env(str(AUTH_FILE))
    sb_env = load_env(str(SUPABASE_ENV_FILE))

    api_key = kiwoom_env.get('KIWOOM_REST_API_KEY')
    api_secret = kiwoom_env.get('KIWOOM_REST_API_SECRET')
    if not api_key or not api_secret:
        print('[ERROR] 키움 API 키 없음 (.claude/auth/kiwoom.env)')
        sys.exit(1)

    supabase_url = sb_env.get('NEXT_PUBLIC_SUPABASE_URL')
    service_key = sb_env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_url or not service_key:
        print('[ERROR] Supabase 환경변수 없음 (apps/pharos-lab/.env.local)')
        sys.exit(1)

    # 토큰 발급
    print('토큰 발급 중...')
    token = get_token(api_key, api_secret)
    print('토큰 발급 완료')

    # watch_universe 조회
    print('watch_universe 조회...')
    universe = supabase_get(
        f'{supabase_url}/rest/v1/watch_universe',
        service_key,
        'is_active=eq.true&order=rank&select=stock_code,corp_name',
    )
    if not universe:
        print('[WARN] 활성 종목 없음. watch_universe is_active=true 종목을 확인하세요.')
        sys.exit(0)

    stock_codes = [item['stock_code'] for item in universe]
    stock_names = {item['stock_code']: item.get('corp_name', '') for item in universe}
    print(f'백필 대상: {len(stock_codes)}종목')

    # API 범위 지원 탐지
    use_range_mode: bool
    if args.force_date_loop:
        use_range_mode = False
        print('[모드] 날짜별 루프 모드 (강제 지정)')
    else:
        print('ka10059 API 범위 지원 여부 탐지 중...')
        use_range_mode = detect_api_range_support(token, stock_codes[0], today.strftime('%Y%m%d'))
        time.sleep(DELAY_SEC)

    # 백필 실행
    started = datetime.now()
    if use_range_mode:
        total, failed = run_backfill_range_mode(
            token, supabase_url, service_key,
            stock_codes, stock_names, start_dt, end_dt,
        )
    else:
        total, failed = run_backfill_date_loop_mode(
            token, supabase_url, service_key,
            stock_codes, stock_names, start_dt, end_dt,
        )

    elapsed = (datetime.now() - started).total_seconds()

    print(f'\n{"="*60}')
    print(f'백필 완료: {total}건 UPSERT, {len(failed)}종목 에러')
    print(f'소요 시간: {elapsed:.1f}초 ({elapsed/60:.1f}분)')
    if failed:
        print(f'실패 종목: {failed}')


if __name__ == '__main__':
    main()
