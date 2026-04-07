"""
trading.ohlcv_daily 수집 스크립트
watch_universe Top50 종목에 대해 키움 ka10005 일봉 API로 데이터 수집 후 Supabase에 적재.

실행:
    python3 scripts/collect_ohlcv_daily.py
"""

import httpx
import json
import time
import os
import sys
from datetime import datetime
from pathlib import Path

# --- 설정 ---
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUTH_FILE = _PROJECT_ROOT / '.claude/auth/kiwoom.env'
SUPABASE_ENV_FILE = _PROJECT_ROOT / 'apps/pharos-lab/.env.local'
BASE_URL = 'https://api.kiwoom.com'
DELAY_SEC = 0.7  # rate limit 대응
MARKET = 'KOSPI'


def load_env(path: str) -> dict:
    """env 파일 파싱"""
    env = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    except FileNotFoundError:
        print(f"[WARN] env 파일 없음: {path}")
    return env


def parse_price(v: str) -> int:
    """가격 문자열 파싱 (+186200, -3000 -> int)"""
    if not v:
        return 0
    v = v.strip().replace('+', '').replace(',', '')
    try:
        return int(v)
    except ValueError:
        return 0


def get_token(api_key: str, api_secret: str) -> str:
    """OAuth 토큰 발급"""
    resp = httpx.post(f'{BASE_URL}/oauth2/token', json={
        'grant_type': 'client_credentials',
        'appkey': api_key,
        'secretkey': api_secret
    }, timeout=30)
    result = resp.json()
    if result.get('return_code') != 0:
        raise Exception(f"토큰 발급 실패: {result.get('return_msg')}")
    return result['token']


def fetch_ohlcv(token: str, stock_code: str) -> list[dict]:
    """
    ka10005로 일봉 데이터 조회.
    반환: [{stock_code, trade_date, open, high, low, close, volume, ...}, ...]
    """
    headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'api-id': 'ka10005',
        'authorization': f'Bearer {token}'
    }
    resp = httpx.post(
        f'{BASE_URL}/api/dostk/mrkcond',
        headers=headers,
        json={'stk_cd': stock_code},
        timeout=30
    )
    result = resp.json()

    if result.get('return_code') != 0:
        raise Exception(f"ka10005 오류 [{stock_code}]: {result.get('return_msg')}")

    rows = result.get('stk_ddwkmm', [])
    records = []
    for r in rows:
        date_str = r.get('date', '')
        if not date_str or len(date_str) != 8:
            continue

        open_p = parse_price(r.get('open_pric', ''))
        high_p = parse_price(r.get('high_pric', ''))
        low_p = parse_price(r.get('low_pric', ''))
        close_p = parse_price(r.get('close_pric', ''))
        volume = parse_price(r.get('trde_qty', ''))
        trading_value = parse_price(r.get('trde_prica', ''))

        # 유효성 검사: 가격이 0이면 스킵
        if close_p == 0:
            continue

        # 전일대비 / 등락률
        pre_val = r.get('pre', '')
        flu_rt = r.get('flu_rt', '')
        prev_close = 0
        change_rate = None
        if pre_val and close_p:
            pre_int = parse_price(pre_val)
            prev_close = close_p - pre_int if pre_int != 0 else 0
        if flu_rt:
            try:
                change_rate = float(flu_rt.replace('%', '').strip())
            except ValueError:
                change_rate = None

        # trade_date: YYYYMMDD -> YYYY-MM-DD
        trade_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

        records.append({
            'stock_code': stock_code,
            'market': MARKET,
            'trade_date': trade_date,
            'open_price': open_p,
            'high_price': high_p,
            'low_price': low_p,
            'close_price': close_p,
            'volume': volume,
            'trading_value': trading_value if trading_value > 0 else None,
            'change_rate': change_rate,
            'prev_close': prev_close if prev_close > 0 else None,
            'source': 'kiwoom',
        })

    return records


def insert_to_supabase(records: list[dict], supabase_url: str, service_key: str) -> int:
    """Supabase REST API로 ohlcv_daily에 upsert"""
    if not records:
        return 0

    url = f"{supabase_url}/rest/v1/ohlcv_daily"
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates,return=minimal',
        'X-Schema': 'trading',
    }

    resp = httpx.post(url, headers=headers, json=records, timeout=60)
    if resp.status_code not in (200, 201):
        raise Exception(f"Supabase insert 실패: {resp.status_code} {resp.text[:200]}")

    return len(records)


def main():
    # 1. 환경 변수 로드
    kiwoom_env = load_env(AUTH_FILE)
    sb_env = load_env(SUPABASE_ENV_FILE)

    api_key = kiwoom_env.get('KIWOOM_REST_API_KEY')
    api_secret = kiwoom_env.get('KIWOOM_REST_API_SECRET')

    if not api_key or not api_secret:
        print("[ERROR] 키움 API 키 없음")
        sys.exit(1)

    supabase_url = sb_env.get('NEXT_PUBLIC_SUPABASE_URL')
    service_key = sb_env.get('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not service_key:
        print("[ERROR] Supabase 환경변수 없음")
        sys.exit(1)

    # 2. 토큰 발급
    print("토큰 발급 중...")
    token = get_token(api_key, api_secret)
    print("토큰 발급 완료")

    # 3. watch_universe 종목 목록 조회 (직접 MCP가 아닌 REST API 사용)
    # MCP를 사용할 수 없으므로 Supabase REST API로 조회
    wu_url = f"{supabase_url}/rest/v1/watch_universe?is_active=eq.true&order=rank&select=stock_code,corp_name"
    wu_headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Accept': 'application/json',
        'X-Schema': 'trading',
    }
    wu_resp = httpx.get(wu_url, headers=wu_headers, timeout=30)
    if wu_resp.status_code != 200:
        print(f"[ERROR] watch_universe 조회 실패: {wu_resp.status_code}")
        sys.exit(1)

    universe = wu_resp.json()
    print(f"수집 대상: {len(universe)}개 종목")

    # 4. 종목별 일봉 수집 및 적재
    total_inserted = 0
    total_skipped = 0
    failed = []

    for i, item in enumerate(universe):
        stock_code = item['stock_code']
        corp_name = item['corp_name']

        # ETF/ETN 코드 필터: 6자리 숫자가 아닌 코드는 스킵 가능하지만 일단 시도
        if len(stock_code) != 6:
            print(f"  [{i+1:02d}/{len(universe)}] SKIP {stock_code} ({corp_name}) - 비표준 코드")
            total_skipped += 1
            continue

        try:
            records = fetch_ohlcv(token, stock_code)
            if not records:
                print(f"  [{i+1:02d}/{len(universe)}] EMPTY {stock_code} ({corp_name})")
                total_skipped += 1
            else:
                # Supabase REST API를 통해 INSERT
                ins_url = f"{supabase_url}/rest/v1/ohlcv_daily"
                ins_headers = {
                    'apikey': service_key,
                    'Authorization': f'Bearer {service_key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=ignore-duplicates,return=minimal',
                    'Accept-Profile': 'trading',
                    'Content-Profile': 'trading',
                }
                ins_resp = httpx.post(ins_url, headers=ins_headers, json=records, timeout=60)
                if ins_resp.status_code in (200, 201):
                    print(f"  [{i+1:02d}/{len(universe)}] OK {stock_code} ({corp_name}) - {len(records)}건")
                    total_inserted += len(records)
                else:
                    print(f"  [{i+1:02d}/{len(universe)}] DB ERR {stock_code}: {ins_resp.status_code} {ins_resp.text[:100]}")
                    failed.append(stock_code)

        except Exception as e:
            print(f"  [{i+1:02d}/{len(universe)}] ERROR {stock_code} ({corp_name}): {e}")
            failed.append(stock_code)

        # rate limit 대응
        if i < len(universe) - 1:
            time.sleep(DELAY_SEC)

    # 5. 결과 요약
    print()
    print("=" * 50)
    print(f"수집 완료")
    print(f"  삽입: {total_inserted}건")
    print(f"  스킵: {total_skipped}개 종목")
    print(f"  실패: {len(failed)}개 종목 {failed}")
    print("=" * 50)


if __name__ == '__main__':
    main()
