"""
OHLCV 1년치 백필 스크립트 (ka10081 사용)

daily_sync_kiwoom.py의 검증된 ka10081 API로 1년치 일봉 수집.
ka10081은 1회 호출에 최대 600건 반환 → 1년(250일) 충분.

실행:
    python3 scripts/backfill_ohlcv.py
"""

import httpx
import sys
import time
from datetime import datetime
from pathlib import Path

# --- 설정 ---
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUTH_FILE = _PROJECT_ROOT / '.claude/auth/kiwoom.env'
SUPABASE_ENV_FILE = _PROJECT_ROOT / 'apps/pharos-lab/.env.local'
BASE_URL = 'https://api.kiwoom.com'
DELAY_SEC = 0.8


def load_env(path: str) -> dict:
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


def parse_price(v: str) -> int:
    if not v:
        return 0
    v = v.strip().replace('+', '').replace('-', '').replace(',', '')
    try:
        return abs(int(v))
    except ValueError:
        return 0


def get_token(api_key: str, api_secret: str) -> str:
    resp = httpx.post(f'{BASE_URL}/oauth2/token', json={
        'grant_type': 'client_credentials',
        'appkey': api_key,
        'secretkey': api_secret,
    }, timeout=30)
    result = resp.json()
    if result.get('return_code') != 0:
        raise Exception(f"토큰 발급 실패: {result.get('return_msg')}")
    return result['token']


def fetch_ohlcv_ka10081(token: str, stock_code: str, base_dt: str) -> list[dict]:
    """ka10081 일봉차트 조회. 최대 600건/회."""
    headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'api-id': 'ka10081',
        'authorization': f'Bearer {token}',
    }
    resp = httpx.post(f'{BASE_URL}/api/dostk/chart', headers=headers, json={
        'stk_cd': stock_code,
        'base_dt': base_dt,
        'upd_stkpc_tp': '1',
    }, timeout=30)
    result = resp.json()
    if result.get('return_code') != 0:
        raise Exception(f"ka10081 오류: {result.get('return_msg')}")

    rows = result.get('stk_dt_pole_chart_qry', [])
    records = []
    for r in rows:
        dt = r.get('dt', '').strip()
        if not dt or len(dt) != 8:
            continue
        close_p = parse_price(r.get('cur_prc', ''))
        if close_p == 0:
            continue

        trade_date = f'{dt[:4]}-{dt[4:6]}-{dt[6:8]}'
        records.append({
            'stock_code': stock_code,
            'market': 'KOSPI',
            'trade_date': trade_date,
            'open_price': parse_price(r.get('open_pric', '')),
            'high_price': parse_price(r.get('high_pric', '')),
            'low_price': parse_price(r.get('low_pric', '')),
            'close_price': close_p,
            'volume': parse_price(r.get('trde_qty', '')),
            'trading_value': parse_price(r.get('trde_prica', '')) or None,
            'source': 'kiwoom',
        })
    return records


def upsert_ohlcv(supabase_url: str, service_key: str, records: list[dict]) -> int:
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
    # 배치 크기 제한 (Supabase POST 제한 대응)
    batch_size = 200
    inserted = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        resp = httpx.post(
            f'{supabase_url}/rest/v1/ohlcv_daily?on_conflict=stock_code,market,trade_date',
            headers=headers, json=batch, timeout=60,
        )
        if resp.status_code not in (200, 201):
            raise Exception(f'Supabase UPSERT 실패: {resp.status_code} {resp.text[:200]}')
        inserted += len(batch)
    return inserted


def main():
    kiwoom_env = load_env(AUTH_FILE)
    sb_env = load_env(SUPABASE_ENV_FILE)

    api_key = kiwoom_env.get('KIWOOM_REST_API_KEY')
    api_secret = kiwoom_env.get('KIWOOM_REST_API_SECRET')
    if not api_key or not api_secret:
        print('[ERROR] 키움 API 키 없음')
        sys.exit(1)

    supabase_url = sb_env.get('NEXT_PUBLIC_SUPABASE_URL')
    service_key = sb_env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_url or not service_key:
        print('[ERROR] Supabase 환경변수 없음')
        sys.exit(1)

    # 토큰
    print('토큰 발급 중...')
    token = get_token(api_key, api_secret)
    print('토큰 발급 완료')

    # watch_universe 조회
    print('watch_universe 조회...')
    wu_resp = httpx.get(
        f'{supabase_url}/rest/v1/watch_universe?is_active=eq.true&order=rank&select=stock_code,corp_name',
        headers={
            'apikey': service_key,
            'Authorization': f'Bearer {service_key}',
            'Accept': 'application/json',
            'Accept-Profile': 'trading',
        },
        timeout=30,
    )
    if wu_resp.status_code != 200:
        print(f'[ERROR] watch_universe 조회 실패: {wu_resp.status_code}')
        sys.exit(1)

    universe = wu_resp.json()
    print(f'백필 대상: {len(universe)}종목')

    # 종목별 1년치 수집
    today = datetime.now().strftime('%Y%m%d')
    total_inserted = 0
    failed = []

    for i, item in enumerate(universe):
        code = item['stock_code']
        name = item.get('corp_name', '')

        try:
            records = fetch_ohlcv_ka10081(token, code, today)
            if records:
                cnt = upsert_ohlcv(supabase_url, service_key, records)
                total_inserted += cnt
                print(f'  [{i+1:03d}/{len(universe)}] {code} {name} — {cnt}건')
            else:
                print(f'  [{i+1:03d}/{len(universe)}] {code} {name} — 0건 (데이터 없음)')
        except Exception as e:
            print(f'  [{i+1:03d}/{len(universe)}] {code} {name} — ERROR: {e}')
            failed.append(code)

        if i < len(universe) - 1:
            time.sleep(DELAY_SEC)

    print(f'\n{"="*50}')
    print(f'백필 완료: {total_inserted}건 적재, {len(failed)}종목 실패')
    if failed:
        print(f'실패 종목: {failed}')


if __name__ == '__main__':
    main()
