"""
키움증권 일일 동기화 스크립트
pre-market / post-market 두 가지 Job을 지원.

실행:
    python3 scripts/daily_sync_kiwoom.py --job pre-market
    python3 scripts/daily_sync_kiwoom.py --job post-market

의존성:
    pip install httpx
"""

import argparse
import httpx
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from discord_notifier import send_batch_notification


# --- 설정 ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUTH_FILE = PROJECT_ROOT / '.claude/auth/kiwoom.env'
SUPABASE_ENV_FILE = PROJECT_ROOT / 'apps/pharos-lab/.env.local'
BASE_URL = 'https://api.kiwoom.com'
DELAY_SEC = 0.8  # 200종목 대응: 0.5→0.8초 (rate limit 안전 마진)
TOP_N = 200


# --- 유틸리티 ---

def load_env(path: str) -> dict[str, str]:
    """env 파일 파싱"""
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


def parse_price(v: str) -> int:
    """가격 문자열 파싱 (+186200, -3000 -> 절대값 int)"""
    if not v:
        return 0
    v = v.strip().replace('+', '').replace('-', '').replace(',', '')
    try:
        return abs(int(v))
    except ValueError:
        return 0


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


def kiwoom_post(token: str, api_id: str, url: str, body: dict) -> dict:
    """키움 REST API 공통 호출"""
    headers = {
        'Content-Type': 'application/json;charset=UTF-8',
        'api-id': api_id,
        'authorization': f'Bearer {token}',
    }
    resp = httpx.post(f'{BASE_URL}{url}', headers=headers, json=body, timeout=30)
    result = resp.json()
    if result.get('return_code') != 0:
        raise Exception(f"[{api_id}] {result.get('return_msg')}")
    return result


# --- Supabase 헬퍼 ---

def trading_headers(service_key: str, prefer: str = '') -> dict[str, str]:
    """trading 스키마 접근용 공통 헤더"""
    h = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
        'Accept-Profile': 'trading',
        'Content-Profile': 'trading',
    }
    if prefer:
        h['Prefer'] = prefer
    return h


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


def supabase_upsert(url: str, service_key: str, records: list[dict], on_conflict: str = '') -> int:
    """Supabase REST UPSERT (trading 스키마)"""
    if not records:
        return 0
    headers = trading_headers(service_key, prefer='resolution=merge-duplicates,return=minimal')
    target = f'{url}?on_conflict={on_conflict}' if on_conflict else url
    resp = httpx.post(target, headers=headers, json=records, timeout=60)
    if resp.status_code not in (200, 201):
        raise Exception(f'Supabase UPSERT 실패: {resp.status_code} {resp.text[:200]}')
    return len(records)


def supabase_patch(url: str, service_key: str, data: dict) -> None:
    """Supabase REST PATCH (trading 스키마)"""
    headers = trading_headers(service_key, prefer='return=minimal')
    resp = httpx.patch(url, headers=headers, json=data, timeout=30)
    if resp.status_code not in (200, 204):
        raise Exception(f'Supabase PATCH 실패: {resp.status_code} {resp.text[:200]}')


def log_sync(supabase_url: str, service_key: str, job_name: str, status: str, rows: int) -> None:
    """sync_log 기록"""
    headers = trading_headers(service_key, prefer='return=minimal')
    try:
        httpx.post(f'{supabase_url}/rest/v1/sync_log', headers=headers, json=[{
            'job_name': job_name,
            'status': status,
            'rows_affected': rows,
            'finished_at': datetime.now().isoformat(),
        }], timeout=30)
    except Exception as e:
        print(f'[WARN] sync_log 기록 실패: {e}')


# --- pre-market Job ---

def run_pre_market(token: str, supabase_url: str, service_key: str) -> int:
    """
    장 시작 전:
    1. ka10023 거래량급증 -> watch_universe UPSERT (Top50)
    2. ka10001 기본정보 -> stock_fundamentals UPSERT
    """
    print('[pre-market] 시작')
    total_rows = 0

    # 1. 거래량급증 (ka10023) — 페이지네이션으로 TOP_N개 수집
    print(f'  [1/2] ka10023 거래량급증 조회 (Top{TOP_N})...')
    ranking: list[dict] = []
    next_key = ''
    page = 0

    while len(ranking) < TOP_N:
        headers = {
            'Content-Type': 'application/json;charset=UTF-8',
            'api-id': 'ka10023',
            'authorization': f'Bearer {token}',
        }
        if next_key:
            headers['cont-yn'] = 'Y'
            headers['next-key'] = next_key

        resp = httpx.post(f'{BASE_URL}/api/dostk/rkinfo', headers=headers, json={
            'mrkt_tp': '001',
            'sort_tp': '1',
            'tm_tp': '2',
            'trde_qty_tp': '5',
            'tm': '',
            'stk_cnd': '0',
            'pric_tp': '0',
            'stex_tp': '1',
        }, timeout=30)
        result = resp.json()
        if result.get('return_code') != 0:
            break

        batch = result.get('trde_qty_sdnin', [])
        if not batch:
            break
        ranking.extend(batch)
        page += 1
        print(f'    페이지 {page}: {len(batch)}종목 (누적 {len(ranking)})')

        cont = resp.headers.get('cont-yn', 'N')
        if cont != 'Y':
            break
        next_key = resp.headers.get('next-key', '')
        if not next_key:
            break
        time.sleep(DELAY_SEC)

    ranking = ranking[:TOP_N]
    print(f'  거래량급증 {len(ranking)}종목 수신')

    # watch_universe UPSERT
    wu_records = []
    for i, item in enumerate(ranking):
        stock_code = item.get('stk_cd', '').strip()
        if not stock_code:
            continue
        wu_records.append({
            'stock_code': stock_code,
            'corp_name': item.get('stk_nm', '').strip(),
            'market': 'KOSPI',
            'universe_type': 'volume_top200',
            'rank': i + 1,
            'is_active': True,
            'selected_at': datetime.now().isoformat(),
        })

    if wu_records:
        cnt = supabase_upsert(f'{supabase_url}/rest/v1/watch_universe', service_key, wu_records, on_conflict='stock_code,market,universe_type')
        print(f'  watch_universe UPSERT: {cnt}건')
        total_rows += cnt

    # 2. 기본정보 (ka10001) - 50종목
    stock_codes = [r['stock_code'] for r in wu_records]
    print(f'  [2/2] ka10001 기본정보 {len(stock_codes)}종목 조회...')
    fund_records = []
    failed: list[str] = []

    for i, code in enumerate(stock_codes):
        try:
            info = kiwoom_post(token, 'ka10001', '/api/dostk/stkinfo', {'stk_cd': code})
            detail = info.get('stk_info', {})
            fund_records.append({
                'stock_code': code,
                'corp_name': detail.get('stk_nm', '').strip(),
                'market': 'KOSPI',
                'fetch_date': datetime.now().strftime('%Y-%m-%d'),
                'cur_price': parse_price(detail.get('cur_prc', '')),
                'per': _safe_float(detail.get('per')),
                'pbr': _safe_float(detail.get('pbr')),
                'eps': parse_price(detail.get('eps', '')),
                'bps': parse_price(detail.get('bps', '')),
                'roe': _safe_float(detail.get('roe')),
                'market_cap': parse_price(detail.get('mkt_cap', '')),
                'volume': parse_price(detail.get('trde_qty', '')),
                'source': 'kiwoom',
            })
        except Exception as e:
            print(f'    [{i+1:02d}] ERROR {code}: {e}')
            failed.append(code)

        if i < len(stock_codes) - 1:
            time.sleep(DELAY_SEC)

    if fund_records:
        cnt = supabase_upsert(f'{supabase_url}/rest/v1/stock_fundamentals', service_key, fund_records, on_conflict='stock_code,market,fetch_date')
        print(f'  stock_fundamentals UPSERT: {cnt}건')
        total_rows += cnt

    if failed:
        print(f'  실패 종목: {failed}')

    # sync_log
    log_sync(supabase_url, service_key, 'pre-market-kiwoom', 'success', total_rows)
    print(f'[pre-market] 완료 (총 {total_rows}건)')
    return total_rows


# --- post-market Job ---

def run_post_market(token: str, supabase_url: str, service_key: str) -> int:
    """
    장 마감 후:
    1. watch_universe 활성 종목 조회
    2. ka10081 일봉차트 -> ohlcv_daily INSERT (최근 3일)
    3. ka10001 기본정보 -> stock_fundamentals UPDATE (종가)
    """
    print('[post-market] 시작')
    total_rows = 0

    # 1. watch_universe 활성 종목 조회
    print('  [1/3] watch_universe 조회...')
    universe = supabase_get(
        f'{supabase_url}/rest/v1/watch_universe',
        service_key,
        'is_active=eq.true&order=rank&select=stock_code,corp_name',
    )
    print(f'  활성 종목: {len(universe)}개')

    if not universe:
        print('  활성 종목 없음, 종료')
        log_sync(supabase_url, service_key, 'post-market-kiwoom', 'success', 0)
        return

    stock_codes = [item['stock_code'] for item in universe]
    today = datetime.now().strftime('%Y%m%d')

    # 2. ka10081 일봉차트 (최근 3일)
    print(f'  [2/3] ka10081 일봉차트 {len(stock_codes)}종목...')
    ohlcv_records: list[dict] = []
    failed_ohlcv: list[str] = []
    cutoff = (datetime.now() - timedelta(days=5)).strftime('%Y%m%d')  # 여유 두고 5일전

    for i, code in enumerate(stock_codes):
        try:
            rows = kiwoom_post(token, 'ka10081', '/api/dostk/chart', {
                'stk_cd': code,
                'base_dt': today,
                'upd_stkpc_tp': '1',
            }).get('stk_dt_pole_chart_qry', [])

            count = 0
            for r in rows:
                dt = r.get('dt', '').strip()
                if not dt or len(dt) != 8 or dt < cutoff:
                    continue
                if count >= 3:
                    break

                close_p = parse_price(r.get('cur_prc', ''))
                if close_p == 0:
                    continue

                trade_date = f'{dt[:4]}-{dt[4:6]}-{dt[6:8]}'
                ohlcv_records.append({
                    'stock_code': code,
                    'market': 'KOSPI',
                    'trade_date': trade_date,
                    'open_price': parse_price(r.get('open_pric', '')),
                    'high_price': parse_price(r.get('high_pric', '')),
                    'low_price': parse_price(r.get('low_pric', '')),
                    'close_price': close_p,
                    'volume': parse_price(r.get('trde_qty', '')),
                    'trading_value': parse_price(r.get('trde_prica', '')) or None,
                })
                count += 1

            print(f'    [{i+1:02d}/{len(stock_codes)}] {code} - {count}건')
        except Exception as e:
            print(f'    [{i+1:02d}/{len(stock_codes)}] ERROR {code}: {e}')
            failed_ohlcv.append(code)

        if i < len(stock_codes) - 1:
            time.sleep(DELAY_SEC)

    if ohlcv_records:
        cnt = supabase_upsert(f'{supabase_url}/rest/v1/ohlcv_daily', service_key, ohlcv_records, on_conflict='stock_code,market,trade_date')
        print(f'  ohlcv_daily UPSERT: {cnt}건')
        total_rows += cnt

    # 3. ka10001 기본정보 -> stock_fundamentals UPDATE (종가)
    print(f'  [3/3] ka10001 종가 업데이트 {len(stock_codes)}종목...')
    update_count = 0
    failed_fund: list[str] = []

    for i, code in enumerate(stock_codes):
        try:
            info = kiwoom_post(token, 'ka10001', '/api/dostk/stkinfo', {'stk_cd': code})
            detail = info.get('stk_info', {})
            close_price = parse_price(detail.get('cur_prc', ''))

            if close_price > 0:
                patch_url = (
                    f'{supabase_url}/rest/v1/stock_fundamentals'
                    f'?stock_code=eq.{code}&fetch_date=eq.{datetime.now().strftime("%Y-%m-%d")}'
                )
                supabase_patch(patch_url, service_key, {
                    'cur_price': close_price,
                    'per': _safe_float(detail.get('per')),
                    'pbr': _safe_float(detail.get('pbr')),
                    'volume': parse_price(detail.get('trde_qty', '')),
                })
                update_count += 1
        except Exception as e:
            print(f'    [{i+1:02d}] ERROR {code}: {e}')
            failed_fund.append(code)

        if i < len(stock_codes) - 1:
            time.sleep(DELAY_SEC)

    print(f'  stock_fundamentals UPDATE: {update_count}건')
    total_rows += update_count

    if failed_ohlcv or failed_fund:
        print(f'  실패 (ohlcv): {failed_ohlcv}')
        print(f'  실패 (fund): {failed_fund}')

    # sync_log
    log_sync(supabase_url, service_key, 'post-market-kiwoom', 'success', total_rows)
    print(f'[post-market] 완료 (총 {total_rows}건)')
    return total_rows


# --- 헬퍼 ---

def _safe_float(v: object) -> float | None:
    """안전한 float 변환"""
    if v is None:
        return None
    try:
        val = float(str(v).strip().replace(',', ''))
        return val if val != 0 else None
    except (ValueError, TypeError):
        return None


# --- 메인 ---

def main() -> None:
    parser = argparse.ArgumentParser(description='키움증권 일일 동기화')
    parser.add_argument('--job', required=True, choices=['pre-market', 'post-market'],
                        help='실행할 Job (pre-market | post-market)')
    args = parser.parse_args()

    # 환경 변수 로드
    kiwoom_env = load_env(AUTH_FILE)
    sb_env = load_env(SUPABASE_ENV_FILE)

    api_key = kiwoom_env.get('KIWOOM_REST_API_KEY')
    api_secret = kiwoom_env.get('KIWOOM_REST_API_SECRET')
    if not api_key or not api_secret:
        print('[ERROR] 키움 API 키 없음 (~/.claude/auth/kiwoom.env)')
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

    # Job 실행
    started = datetime.now()
    try:
        if args.job == 'pre-market':
            rows = run_pre_market(token, supabase_url, service_key)
        else:
            rows = run_post_market(token, supabase_url, service_key)
        elapsed = (datetime.now() - started).total_seconds()
        send_batch_notification(f'{args.job}-kiwoom', 'success', rows, elapsed)
    except Exception as e:
        elapsed = (datetime.now() - started).total_seconds()
        print(f'[FATAL] {e}')
        send_batch_notification(f'{args.job}-kiwoom', 'error', 0, elapsed, error_msg=str(e))
        log_sync(supabase_url, service_key, f'{args.job}-kiwoom', 'error', 0)
        sys.exit(1)

    print(f'소요 시간: {elapsed:.1f}초')


if __name__ == '__main__':
    main()
