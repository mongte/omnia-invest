"""
재무제표 백필 스크립트 (fnlttSinglAcntAll 사용)

trading.watch_universe의 is_active=true 종목(corp_code 보유)에 대해
OpenDART fnlttSinglAcntAll API로 2024Q1 ~ 2025Q3 재무제표를 수집하여
trading.financial_statements에 UPSERT한다.

대상 기간:
    2024년: 1Q(11011), 반기(11012), 3Q(11013), 연간(11014)
    2025년: 1Q(11011), 반기(11012), 3Q(11013)

실행:
    python3 scripts/backfill_financials.py
"""

import httpx
import sys
import time
from pathlib import Path

# --- 설정 ---
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
OPENDART_ENV_FILE = _PROJECT_ROOT / '.claude/auth/opendart.env'
SUPABASE_ENV_FILE = _PROJECT_ROOT / 'apps/pharos-lab/.env.local'

DART_BASE_URL = 'https://opendart.fss.or.kr/api'
DELAY_SEC = 0.5

# 수집 대상: (bsns_year, reprt_code) 쌍
# reprt_code: 11011=1Q, 11012=반기, 11013=3Q, 11014=연간
TARGET_PERIODS = [
    ('2024', '11011'),  # 2024 1Q
    ('2024', '11012'),  # 2024 반기
    ('2024', '11013'),  # 2024 3Q
    ('2024', '11014'),  # 2024 연간
    ('2025', '11011'),  # 2025 1Q
    ('2025', '11012'),  # 2025 반기
    ('2025', '11013'),  # 2025 3Q
]

REPRT_CODE_LABEL = {
    '11011': '1Q',
    '11012': '반기',
    '11013': '3Q',
    '11014': '연간',
}


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    except FileNotFoundError:
        print(f'[WARN] env 파일 없음: {path}')
    return env


def fetch_watch_universe(supabase_url: str, service_key: str) -> list[dict]:
    """trading.watch_universe에서 is_active=true 종목 조회."""
    resp = httpx.get(
        f'{supabase_url}/rest/v1/watch_universe'
        '?is_active=eq.true'
        '&order=rank'
        '&select=stock_code,corp_code,corp_name,market',
        headers={
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Accept': 'application/json',
            'Accept-Profile': 'trading',
        },
        timeout=30,
    )
    if resp.status_code != 200:
        raise RuntimeError(f'watch_universe 조회 실패: {resp.status_code} {resp.text[:200]}')
    return resp.json()  # type: ignore[return-value]


def fetch_financial_statements(
    dart_api_key: str,
    corp_code: str,
    bsns_year: str,
    reprt_code: str,
) -> list[dict]:
    """OpenDART fnlttSinglAcntAll API 호출. CFS(연결) 우선, 없으면 OFS(개별)."""
    results: list[dict] = []

    for fs_div in ('CFS', 'OFS'):
        resp = httpx.get(
            f'{DART_BASE_URL}/fnlttSinglAcntAll.json',
            params={
                'crtfc_key': dart_api_key,
                'corp_code': corp_code,
                'bsns_year': bsns_year,
                'reprt_code': reprt_code,
                'fs_div': fs_div,
            },
            timeout=30,
        )
        data = resp.json()
        status = data.get('status', '')

        if status == '013':
            # 조회된 데이터 없음 — 이 fs_div에 데이터 없음, 계속
            continue
        if status != '000':
            raise RuntimeError(
                f'OpenDART 오류 [corp={corp_code} year={bsns_year} reprt={reprt_code} fs={fs_div}]'
                f' status={status} msg={data.get("message", "")}'
            )

        items: list[dict] = data.get('list', [])
        if items:
            results.extend(items)
            break  # CFS 데이터 확보 → OFS 불필요

    return results


def parse_amount(val: str | None) -> int | None:
    """금액 문자열 → int. 빈 값이나 파싱 불가 시 None."""
    if val is None or val.strip() in ('', '-'):
        return None
    cleaned = val.strip().replace(',', '').replace(' ', '')
    try:
        return int(cleaned)
    except ValueError:
        return None


def build_records(
    raw_items: list[dict],
    stock_code: str,
    market: str,
    bsns_year: str,
    reprt_code: str,
    fs_div: str,
) -> list[dict]:
    """OpenDART 응답 항목을 financial_statements 스키마로 변환."""
    records: list[dict] = []
    for item in raw_items:
        account_id = (item.get('account_id') or '').strip()
        account_nm = (item.get('account_nm') or '').strip()
        if not account_id and not account_nm:
            continue

        records.append({
            'corp_code': item.get('corp_code', '').strip(),
            'stock_code': stock_code,
            'market': market,
            'bsns_year': bsns_year,
            'reprt_code': reprt_code,
            'fs_div': item.get('fs_div') or fs_div,
            'sj_div': (item.get('sj_div') or '').strip(),
            'account_id': account_id or account_nm,
            'account_name': account_nm,
            'current_amount': parse_amount(item.get('thstrm_amount')),
            'prev_amount': parse_amount(item.get('frmtrm_amount')),
            'prev2_amount': parse_amount(item.get('bfefrmtrm_amount')),
            'currency': (item.get('currency') or 'KRW').strip(),
            'rcept_no': (item.get('rcept_no') or '').strip() or None,
            'source': 'opendart',
        })
    return records


def upsert_financial_statements(
    supabase_url: str,
    service_key: str,
    records: list[dict],
) -> int:
    """financial_statements UPSERT. conflict 기준: corp_code,bsns_year,reprt_code,fs_div,sj_div,account_id."""
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
    conflict_cols = 'corp_code,bsns_year,reprt_code,fs_div,sj_div,account_id'
    url = f'{supabase_url}/rest/v1/financial_statements?on_conflict={conflict_cols}'

    # 배치 내 conflict key 기준 중복 제거 (같은 배치 내 동일 키 2개 이상이면 UPSERT 실패)
    CONFLICT_KEYS = ('corp_code', 'bsns_year', 'reprt_code', 'fs_div', 'sj_div', 'account_id')
    seen: set[tuple] = set()
    deduped: list[dict] = []
    for r in records:
        key = tuple(r.get(k) for k in CONFLICT_KEYS)
        if key not in seen:
            seen.add(key)
            deduped.append(r)
    records = deduped

    batch_size = 200
    inserted = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        resp = httpx.post(url, headers=headers, json=batch, timeout=60)
        if resp.status_code not in (200, 201):
            raise RuntimeError(f'Supabase UPSERT 실패: {resp.status_code} {resp.text[:300]}')
        inserted += len(batch)
    return inserted


def main() -> None:
    dart_env = load_env(OPENDART_ENV_FILE)
    sb_env = load_env(SUPABASE_ENV_FILE)

    dart_api_key = dart_env.get('DART_API_KEY') or dart_env.get('OPENDART_API_KEY')
    if not dart_api_key:
        print('[ERROR] DART_API_KEY 없음 (.claude/auth/opendart.env 확인)')
        sys.exit(1)

    supabase_url = sb_env.get('NEXT_PUBLIC_SUPABASE_URL')
    service_key = sb_env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_url or not service_key:
        print('[ERROR] Supabase 환경변수 없음 (apps/pharos-lab/.env.local 확인)')
        sys.exit(1)

    # 유니버스 조회
    print('watch_universe 조회...')
    universe = fetch_watch_universe(supabase_url, service_key)
    print(f'전체 활성 종목: {len(universe)}개')

    # corp_code 없는 종목 사전 필터링
    valid = [u for u in universe if u.get('corp_code')]
    skipped_no_corp = [u for u in universe if not u.get('corp_code')]
    if skipped_no_corp:
        print(f'[SKIP] corp_code 없음 ({len(skipped_no_corp)}종목):')
        for u in skipped_no_corp:
            print(f'  - {u["stock_code"]} {u.get("corp_name", "")}')

    print(f'수집 대상: {len(valid)}종목 × {len(TARGET_PERIODS)}분기 = 최대 {len(valid) * len(TARGET_PERIODS)}건 API 호출\n')

    total_inserted = 0
    total_skipped = 0  # 데이터 없는 기간
    failed: list[str] = []

    for stock_idx, item in enumerate(valid):
        stock_code: str = item['stock_code']
        corp_code: str = item['corp_code']
        corp_name: str = item.get('corp_name', '')
        market: str = item.get('market', 'KOSPI')

        stock_total = 0

        for period_idx, (bsns_year, reprt_code) in enumerate(TARGET_PERIODS):
            label = REPRT_CODE_LABEL.get(reprt_code, reprt_code)

            try:
                raw_items = fetch_financial_statements(dart_api_key, corp_code, bsns_year, reprt_code)

                if not raw_items:
                    total_skipped += 1
                else:
                    # fs_div는 응답 항목 내에 포함되어 있으나 빌드 함수에 기본값으로도 전달
                    records = build_records(raw_items, stock_code, market, bsns_year, reprt_code, 'CFS')
                    cnt = upsert_financial_statements(supabase_url, service_key, records)
                    total_inserted += cnt
                    stock_total += cnt

            except RuntimeError as e:
                print(f'  [ERROR] {stock_code} {corp_name} {bsns_year}{label}: {e}')
                failed.append(f'{stock_code}:{bsns_year}{label}')

            # rate limit 대응: 마지막 호출 제외
            is_last_call = (stock_idx == len(valid) - 1) and (period_idx == len(TARGET_PERIODS) - 1)
            if not is_last_call:
                time.sleep(DELAY_SEC)

        print(
            f'[{stock_idx+1:03d}/{len(valid)}] {stock_code} {corp_name} — {stock_total}건 적재'
        )

    print(f'\n{"="*55}')
    print(f'백필 완료: {total_inserted}건 적재')
    print(f'데이터 없는 기간: {total_skipped}건 스킵')
    print(f'오류 발생: {len(failed)}건')
    if failed:
        print(f'실패 목록: {failed}')


if __name__ == '__main__':
    main()
