# Trading Data Pipeline

코스피 Top50 종목 ETL 파이프라인 — 키움증권 + OpenDART → Supabase

## 아키텍처

```
[로컬 PC — launchd]              [Supabase — pg_cron]
 키움증권 API (IP 등록 필수)       OpenDART API (IP 제한 없음)
 07:50 pre-market                 08:00 공시 수집 + 동기화
 16:30 post-market                매월 15일 재무제표
                                  매주 일요일 데이터 정리
       │                                │
       └──────────┬─────────────────────┘
                  ▼
         Supabase PostgreSQL
         trading 스키마 (원천) → public 스키마 (서비스)
```

## 수집 데이터

| 데이터 | 소스 | API | 실행 위치 | 주기 |
|--------|------|-----|---------|------|
| Top50 종목 | 키움 | ka10023 | 로컬 | 평일 07:50 |
| 기본정보 (PER/PBR/시총) | 키움 | ka10001 | 로컬 | 평일 07:50 + 16:30 |
| OHLCV 일봉 | 키움 | ka10081 | 로컬 | 평일 16:30 |
| 공시 | OpenDART | /list.json | Supabase | 평일 08:00 |
| 재무제표 | OpenDART | /fnlttSinglAcntAll.json | Supabase | 매월 15일 |

## 새 환경 세팅 가이드

### 사전 준비

- Python 3.10+ (`pip install httpx`)
- Supabase 프로젝트 (무료 티어 OK)
- 키움증권 REST API 키 (openapi.kiwoom.com)
- OpenDART API 키 (opendart.fss.or.kr)
- 키움 지정단말기 IP 등록 (`curl ifconfig.me`로 확인 후 등록)

### Step 1: 환경변수 설정

```bash
# 키움증권 인증
mkdir -p ~/.claude/auth
cat > ~/.claude/auth/kiwoom.env << 'EOF'
TRADING_ENV=prod
KIWOOM_REST_API_KEY=your_api_key
KIWOOM_REST_API_SECRET=your_api_secret
KIWOOM_ACCOUNT_NO=your_account_no
EOF

# OpenDART 인증
cat > ~/.claude/auth/opendart.env << 'EOF'
DART_API_KEY=your_dart_api_key
EOF

# Supabase (pharos-lab 앱)
cat > apps/pharos-lab/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EOF
```

### Step 2: DB 마이그레이션

Supabase 대시보드 > SQL Editor에서 `migrations/trading_schema.sql` 전체 실행.

또는 MCP 사용:
```
mcp__supabase__apply_migration(name: "trading_schema", query: <파일 내용>)
```

생성되는 것:
- `trading` 스키마 + 테이블 7개
- 인덱스 7개
- DB 함수 7개 (exec_sql, get_active_universe, cleanup_old_data, classify_disclosure_type, sync_to_public_stocks, sync_to_public_disclosures, check_trading_pipeline)
- pg_cron, pg_net 확장

### Step 3: pg_cron 스케줄 등록

SQL Editor에서 실행:

```sql
-- OpenDART 공시 (평일 08:00 KST = Sun-Thu 23:00 UTC)
SELECT cron.schedule('daily-sync-opendart', '0 23 * * 0-4', $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/daily-sync-opendart',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
$$);

-- 재무제표 (매월 15일 09:00 KST)
SELECT cron.schedule('monthly-financial-sync', '0 0 15 * *', $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/monthly-financial-sync',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
$$);

-- 데이터 정리 (일요일 00:00 KST)
SELECT cron.schedule('weekly-cleanup', '0 15 * * 6', $$
  SELECT trading.cleanup_old_data();
$$);
```

### Step 4: Edge Function 배포

```bash
# Supabase CLI 설치 후
supabase functions deploy daily-sync-opendart
supabase functions deploy monthly-financial-sync

# Secrets 설정
supabase secrets set DART_API_KEY=your_dart_api_key
```

또는 MCP `deploy_edge_function`으로 `edge-functions/` 디렉토리의 코드 배포.

### Step 5: OHLCV 1년치 백필

```bash
python3 scripts/collect_ohlcv_daily.py
```

약 50종목 × 245거래일 = ~12,000건, 소요시간 ~40초.

### Step 6: 로컬 스케줄러 등록 (macOS launchd)

```bash
# plist를 launchd에 심볼릭 링크 + 등록
bash scripts/launchd/install.sh
```

등록 확인:
```bash
launchctl list | grep omnia
```

### Step 7: 검증

```bash
python3 .claude/skills/trading-data-pipeline/setup_trading_pipeline.py
```

기대 결과:
```
[1] 테이블 현황
  trading.watch_universe            OK          50건
  trading.stock_fundamentals        OK          50건
  trading.ohlcv_daily               OK       8,205건
  ...
[2] DB 함수                         6개 OK
[3] pg_cron 스케줄                  3개 active
[6] 환경변수                        5개 OK
```

### Step 8: 수동 테스트

```bash
# 키움 수집 테스트 (로컬)
python3 scripts/daily_sync_kiwoom.py --job pre-market
python3 scripts/daily_sync_kiwoom.py --job post-market

# OpenDART 수집 테스트 (Supabase 대시보드 > Edge Functions > Run)
# daily-sync-opendart 실행

# 결과 확인
# SQL Editor: SELECT * FROM trading.sync_log ORDER BY started_at DESC;
```

## 디렉토리 구조

```
trading-data-pipeline/
├── SKILL.md                        # 상세 문서 (아키텍처, DB, API, 보존정책)
├── README.md                       # 이 파일 (세팅 가이드)
├── setup_trading_pipeline.py       # 검증 스크립트
├── migrations/
│   └── trading_schema.sql          # 전체 DDL + 함수 (1회 실행)
├── edge-functions/
│   ├── daily-sync-opendart.ts      # OpenDART 공시 + 동기화
│   └── monthly-financial-sync.ts   # 분기 재무제표
├── scripts/
│   ├── daily_sync_kiwoom.py        # 키움 일일 수집 (--job pre-market/post-market)
│   ├── collect_ohlcv_daily.py      # OHLCV 1년치 백필
│   └── launchd/
│       ├── com.omnia.pre-market.plist   # 평일 07:50
│       ├── com.omnia.post-market.plist  # 평일 16:30
│       └── install.sh                   # launchd 등록
├── api/
│   ├── kiwoom.py                   # KiwoomClient 래퍼
│   └── dart.py                     # DartClient 래퍼
└── etl/
    └── template.py                 # ETLJob 베이스 클래스
```

## 데이터 보존 정책

| 데이터 | 보존 기간 | 정리 주기 |
|--------|---------|---------|
| ohlcv_daily | 1년 (365일) | 매주 일요일 |
| disclosures | 6개월 (180일) | 매주 일요일 |
| financial_statements | 2년 | 매주 일요일 |
| stock_fundamentals | 최신 1건/종목 | 매주 일요일 |

## 트러블슈팅

### 키움 API 8050 에러 (지정단말기)
- `curl ifconfig.me`로 현재 IP 확인
- openapi.kiwoom.com에서 IP 등록
- Supabase Edge Function에서는 키움 API 사용 불가 (동적 IP)

### sync_log에 에러 기록
```sql
SELECT * FROM trading.sync_log WHERE status = 'error' ORDER BY started_at DESC;
```

### 데이터가 안 쌓이는 경우
1. Edge Function Secrets 설정 확인 (DART_API_KEY)
2. launchd 등록 확인: `launchctl list | grep omnia`
3. 로그 확인: `cat scripts/logs/pre-market.log`

## 상세 문서

아키텍처, DB 스키마 컬럼, API 파라미터, Edge Function 상세 등은 `SKILL.md` 참조.
