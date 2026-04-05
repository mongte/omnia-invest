"""
Trading Data Pipeline 검증 스크립트
public.check_trading_pipeline() RPC로 전체 인프라 상태 확인.

실행:
    python3 .claude/skills/trading-data-pipeline/setup_trading_pipeline.py
"""

import httpx
import json
import sys
import os


def load_env(path: str) -> dict[str, str]:
    env: dict[str, str] = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return env


def find_env_file() -> str:
    d = os.path.dirname(os.path.abspath(__file__))
    for _ in range(6):
        candidate = os.path.join(d, 'apps', 'pharos-lab', '.env.local')
        if os.path.exists(candidate):
            return candidate
        d = os.path.dirname(d)
    return ''


def main() -> None:
    env_path = find_env_file()
    sb = load_env(env_path) if env_path else {}
    url = sb.get('NEXT_PUBLIC_SUPABASE_URL', '')
    key = sb.get('SUPABASE_SERVICE_ROLE_KEY', '')

    if not url or not key:
        print('[ERROR] SUPABASE 환경변수 누락')
        sys.exit(1)

    # check_trading_pipeline() RPC 호출
    resp = httpx.post(
        f'{url}/rest/v1/rpc/check_trading_pipeline',
        headers={
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
        },
        json={},
        timeout=15,
    )

    if resp.status_code != 200:
        print(f'[ERROR] RPC 호출 실패: {resp.status_code} {resp.text[:200]}')
        sys.exit(1)

    data = resp.json()

    print('=' * 60)
    print('  Trading Data Pipeline - 인프라 검증')
    print('=' * 60)

    # 1. 테이블
    print('\n[1] 테이블 현황')
    tables = data.get('tables', {})
    for tbl, cnt in sorted(tables.items()):
        status = 'OK' if cnt > 0 else 'EMPTY'
        print(f'  trading.{tbl:25s} {status:5s} {cnt:>8,}건')

    # 2. DB 함수
    print('\n[2] DB 함수')
    functions = data.get('functions', []) or []
    for fn in functions:
        print(f'  trading.{fn:35s} OK')
    if not functions:
        print('  (없음)')

    # 3. pg_cron
    print('\n[3] pg_cron 스케줄')
    cron_jobs = data.get('cron_jobs', []) or []
    for job in cron_jobs:
        active = 'active' if job.get('active') else 'inactive'
        print(f'  {job["name"]:30s} {job["schedule"]:18s} {active}')
    if not cron_jobs:
        print('  (없음)')

    # 4. OHLCV 범위
    print('\n[4] OHLCV 데이터 범위')
    ohlcv = data.get('ohlcv_range', {})
    if ohlcv:
        print(f'  종목 수: {ohlcv.get("stocks", 0)}개')
        print(f'  기간:    {ohlcv.get("min", "?")} ~ {ohlcv.get("max", "?")}')

    # 5. 최근 sync_log
    print('\n[5] 최근 실행 로그')
    logs = data.get('recent_sync', []) or []
    if logs:
        for log in logs:
            print(f'  {log["job"]:25s} {log["status"]:8s} {log.get("rows", 0):>6}건  {log.get("at", "")}')
    else:
        print('  (실행 이력 없음 — Edge Function Secrets 설정 후 첫 실행 대기)')

    # 6. 환경변수
    print('\n[6] 환경변수')
    kw = load_env(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'auth', 'kiwoom.env'))
    dart = load_env(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'auth', 'opendart.env'))
    checks = [
        ('KIWOOM_REST_API_KEY', bool(kw.get('KIWOOM_REST_API_KEY'))),
        ('KIWOOM_REST_API_SECRET', bool(kw.get('KIWOOM_REST_API_SECRET'))),
        ('DART_API_KEY', bool(dart.get('DART_API_KEY'))),
        ('SUPABASE_URL', bool(url)),
        ('SERVICE_ROLE_KEY', bool(key)),
    ]
    for name, ok in checks:
        print(f'  {name:25s} {"OK" if ok else "MISSING"}')

    print('\n' + '=' * 60)
    total_rows = sum(tables.values()) if tables else 0
    fn_count = len(functions)
    cron_count = len(cron_jobs)
    print(f'  총 {total_rows:,}건 | 함수 {fn_count}개 | 크론 {cron_count}개')
    print('=' * 60)


if __name__ == '__main__':
    main()
