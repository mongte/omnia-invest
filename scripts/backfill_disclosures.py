"""
OpenDART 공시 6개월 백필 스크립트

trading.watch_universe의 is_active=true 종목에 대해
OpenDART list.json API로 공시 목록을 조회하고
trading.disclosures 테이블에 UPSERT한다.

실행:
    python3 scripts/backfill_disclosures.py
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
DELAY_SEC = 0.5          # OpenDART rate limit
PAGE_COUNT = 100         # 1회 요청당 최대 공시 수
BGN_DE = '20251007'      # 6개월 전
END_DE = '20260407'      # 오늘


def load_env(path: Path) -> dict:
    env = {}
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


def fmt_date(d: str) -> str:
    """'YYYYMMDD' → 'YYYY-MM-DD'"""
    if not d or len(d) != 8:
        return d or ''
    return f'{d[:4]}-{d[4:6]}-{d[6:8]}'


def fetch_disclosures_page(
    dart_key: str,
    corp_code: str,
    bgn_de: str,
    end_de: str,
    page_no: int,
    page_count: int,
) -> dict:
    """OpenDART list.json 단일 페이지 조회."""
    url = (
        f'{DART_BASE_URL}/list.json'
        f'?crtfc_key={dart_key}'
        f'&corp_code={corp_code}'
        f'&bgn_de={bgn_de}'
        f'&end_de={end_de}'
        f'&page_no={page_no}'
        f'&page_count={page_count}'
    )
    resp = httpx.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_all_disclosures(
    dart_key: str,
    corp_code: str,
    bgn_de: str,
    end_de: str,
) -> list[dict]:
    """페이지네이션을 처리하여 전체 공시 목록 반환."""
    all_items: list[dict] = []
    page_no = 1

    while True:
        data = fetch_disclosures_page(dart_key, corp_code, bgn_de, end_de, page_no, PAGE_COUNT)
        status = data.get('status')

        # 공시 없음 또는 조회 오류
        if status == '013':   # 공시 없음
            break
        if status != '000':
            raise RuntimeError(f'OpenDART 오류 (status={status}): {data.get("message", "")}')

        items = data.get('list') or []
        all_items.extend(items)

        total_count = int(data.get('total_count', 0))
        total_pages = int(data.get('total_page', 1))

        if page_no >= total_pages or len(all_items) >= total_count:
            break

        page_no += 1
        time.sleep(DELAY_SEC)

    return all_items


def build_records(items: list[dict], stock_code: str, corp_code: str) -> list[dict]:
    """OpenDART 응답 항목을 disclosures 레코드로 변환."""
    records = []
    for item in items:
        rcept_no = (item.get('rcept_no') or '').strip()
        if not rcept_no:
            continue

        rcept_dt = fmt_date((item.get('rcept_dt') or '').strip())
        if not rcept_dt:
            continue

        records.append({
            'rcept_no': rcept_no,
            'stock_code': stock_code,
            'corp_code': corp_code,
            'corp_name': (item.get('corp_name') or '').strip(),
            'market': 'KOSPI',
            'report_name': (item.get('report_nm') or '').strip(),
            'filer_name': (item.get('flr_nm') or '').strip(),
            'rcept_date': rcept_dt,
            # raw_data는 원본 보존
            'raw_data': item,
        })
    return records


def upsert_disclosures(supabase_url: str, service_key: str, records: list[dict]) -> int:
    """trading.disclosures에 UPSERT (rcept_no 기준 중복 방지)."""
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

    batch_size = 200
    inserted = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        resp = httpx.post(
            f'{supabase_url}/rest/v1/disclosures?on_conflict=rcept_no',
            headers=headers,
            json=batch,
            timeout=60,
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f'Supabase UPSERT 실패: {resp.status_code} {resp.text[:200]}')
        inserted += len(batch)

    return inserted


def main() -> None:
    # 환경변수 로드
    dart_env = load_env(OPENDART_ENV_FILE)
    sb_env = load_env(SUPABASE_ENV_FILE)

    dart_key = dart_env.get('OPENDART_API_KEY') or dart_env.get('DART_API_KEY')
    if not dart_key:
        print('[ERROR] OPENDART_API_KEY 없음 (.claude/auth/opendart.env 확인)')
        sys.exit(1)

    supabase_url = sb_env.get('NEXT_PUBLIC_SUPABASE_URL')
    service_key = sb_env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_url or not service_key:
        print('[ERROR] Supabase 환경변수 없음 (apps/pharos-lab/.env.local 확인)')
        sys.exit(1)

    # watch_universe 조회 (corp_code 포함)
    print('watch_universe 조회...')
    wu_resp = httpx.get(
        f'{supabase_url}/rest/v1/watch_universe'
        '?is_active=eq.true&select=stock_code,corp_code,corp_name&order=rank',
        headers={
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Accept': 'application/json',
            'Accept-Profile': 'trading',
        },
        timeout=30,
    )
    if wu_resp.status_code != 200:
        print(f'[ERROR] watch_universe 조회 실패: {wu_resp.status_code} {wu_resp.text[:200]}')
        sys.exit(1)

    universe = wu_resp.json()
    total = len(universe)

    # corp_code 없는 종목 필터링
    skipped_no_corp = [u for u in universe if not u.get('corp_code')]
    active = [u for u in universe if u.get('corp_code')]

    print(f'대상: {total}종목 (corp_code 없어 스킵: {len(skipped_no_corp)}종목)')
    print(f'백필 기간: {BGN_DE} ~ {END_DE}')
    print()

    total_inserted = 0
    failed: list[str] = []

    for i, item in enumerate(active):
        code = item['stock_code']
        corp_code = item['corp_code']
        name = item.get('corp_name', '')

        try:
            items = fetch_all_disclosures(dart_key, corp_code, BGN_DE, END_DE)
            records = build_records(items, code, corp_code)
            cnt = upsert_disclosures(supabase_url, service_key, records)
            total_inserted += cnt
            print(f'  [{i+1:03d}/{len(active)}] {code} {name} — {cnt}건')
        except Exception as e:
            print(f'  [{i+1:03d}/{len(active)}] {code} {name} — ERROR: {e}')
            failed.append(code)

        if i < len(active) - 1:
            time.sleep(DELAY_SEC)

    print()
    print('=' * 50)
    print(f'백필 완료: {total_inserted}건 적재, {len(failed)}종목 실패')
    if skipped_no_corp:
        skipped_codes = [u['stock_code'] for u in skipped_no_corp]
        print(f'corp_code 없어 스킵: {skipped_codes}')
    if failed:
        print(f'실패 종목: {failed}')


if __name__ == '__main__':
    main()
