---
name: trading-data-pipeline
description: 코스피 Top200 종목의 OHLCV, 기본정보, 공시, 재무제표 데이터를 키움증권/OpenDART API로 수집하여 Supabase에 적재하는 ETL 파이프라인. 데이터 수집, 스케줄링, 백필, 동기화 작업 시 사용.
version: 1.0.0
tags: [etl, trading, kiwoom, opendart, supabase, pipeline, kospi]
---

# Trading Data Pipeline

## Overview

코스피 거래량 Top200 종목을 대상으로 키움증권 REST API와 OpenDART API에서 데이터를 수집하여 Supabase(PostgreSQL)에 적재하는 자동화 파이프라인.

## 아키텍처

```
[로컬 PC — launchd]           [Supabase — pg_cron]
키움증권 REST API              OpenDART REST API
  ka10023 (Top200)               /list.json (공시)
  ka10001 (기본정보)             /fnlttSinglAcntAll.json (재무)
  ka10081 (일봉차트)
  ※ IP 등록 필수                 ※ IP 제한 없음
       │                              │
       ▼                              ▼
┌─────────────────────────────────────────────┐
│  trading 스키마 (원천 데이터)                  │
│  watch_universe │ stock_fundamentals          │
│  ohlcv_daily    │ disclosures                 │
│  financial_statements │ sync_log              │
└──────────────────┬──────────────────────────┘
                   │ sync_to_public_stocks()
                   │ sync_to_public_disclosures()
                   ▼
┌─────────────────────────────────────────────┐
│  public 스키마 (서비스 레이어)                 │
│  stocks │ disclosures │ stock_scores          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
              pharos-lab UI
```

**키움증권 API는 지정단말기 IP 등록 필수 (에러 8050).** Supabase Edge Function은 동적 IP라 사용 불가 → 로컬 PC에서 실행.

## DB 스키마 (trading)

| 테이블 | 건수 | 보존 | 용도 |
|--------|------|------|------|
| watch_universe | 200 | 최신만 | 거래량 Top200 감시 종목 |
| stock_fundamentals | 200 | 최신 1건/종목 | PER, PBR, EPS, ROE, 시가총액 |
| ohlcv_daily | ~8,000 | 1년 롤링 | 일봉 OHLCV (시가/고가/저가/종가/거래량) |
| ohlcv_snapshot | 0 | - | 기술지표 스냅샷 (MA/RSI/MACD) — 미사용 |
| disclosures | ~700 | 6개월 | OpenDART 공시 (자동 유형 분류) |
| financial_statements | ~3,500 | 2년 | IFRS 재무제표 (계정과목별) |
| sync_log | - | - | ETL 실행 로그 |

## Edge Functions (Supabase)

### pre-market-sync (v2) — 장 시작 전

**스케줄**: 평일 07:50 KST (cron: `50 22 * * 0-4` UTC)

| 단계 | API | 대상 테이블 |
|------|-----|-----------|
| 1 | ka10023 거래량급증 | trading.watch_universe |
| 2 | ka10001 기본정보 (200종목) | trading.stock_fundamentals |
| 3 | OpenDART /list.json (어제~오늘) | trading.disclosures |
| 4 | sync_to_public_stocks() | public.stocks |
| 5 | sync_to_public_disclosures() | public.disclosures |

### post-market-sync — 장 마감 후

**스케줄**: 평일 16:30 KST (cron: `30 7 * * 1-5` UTC)

| 단계 | API | 대상 테이블 |
|------|-----|-----------|
| 1 | ka10081 일봉차트 (200종목, 최근 3일) | trading.ohlcv_daily |
| 2 | ka10001 기본정보 (종가 업데이트) | trading.stock_fundamentals |

### monthly-financial-sync — 월간 재무제표

**스케줄**: 매월 15일 09:00 KST (cron: `0 0 15 * *` UTC)

| 단계 | API | 대상 테이블 |
|------|-----|-----------|
| 1 | OpenDART /fnlttSinglAcntAll.json (연결, 직전분기) | trading.financial_statements |

### weekly-cleanup — 주간 데이터 정리

**스케줄**: 일요일 00:00 KST (cron: `0 15 * * 6` UTC)

실행: `SELECT trading.cleanup_old_data();`

## 스케줄

### 로컬 PC (launchd) — 키움증권 API

| plist | 시간 (KST) | 스크립트 | 대상 |
|-------|-----------|---------|------|
| com.omnia.pre-market | 평일 07:50 | `daily_sync_kiwoom.py --job pre-market` | Top200 + 기본정보 |
| com.omnia.post-market | 평일 16:30 | `daily_sync_kiwoom.py --job post-market` | 일봉 + 종가 업데이트 |

설치: `bash scripts/launchd/install.sh`

### Supabase (pg_cron) — OpenDART + SQL

| jobname | cron (UTC) | KST | 대상 |
|---------|-----------|-----|------|
| daily-sync-opendart | `0 23 * * 0-4` | 평일 08:00 | 공시 수집 + 분류 + public 동기화 |
| monthly-financial-sync | `0 0 15 * *` | 매월 15일 09:00 | 분기 재무제표 |
| weekly-cleanup | `0 15 * * 6` | 일요일 00:00 | 보존기간 초과 삭제 |

## DB Functions

| 함수 | 인자 | 용도 |
|------|------|------|
| `trading.exec_sql(query text)` | SQL 문자열 | Edge Function → trading 스키마 접근 (SECURITY DEFINER) |
| `trading.get_active_universe()` | 없음 | is_active=TRUE 종목 목록 반환 |
| `trading.cleanup_old_data()` | 없음 | ohlcv 1년, 공시 6개월, 재무 2년 초과 삭제 |
| `trading.classify_disclosure_type(text)` | report_name | 공시 유형 자동 분류 → earnings/dividend/capital/buyback/ownership/etc |
| `trading.sync_to_public_stocks()` | 없음 | trading.watch_universe + fundamentals → public.stocks |
| `trading.sync_to_public_disclosures()` | 없음 | trading.disclosures → public.disclosures (stocks.code 매핑) |

## API 레퍼런스

### 키움증권

| API ID | 이름 | URL | 용도 | 특징 |
|--------|------|-----|------|------|
| ka10001 | 주식기본정보 | `/api/dostk/stkinfo` | fundamentals | 종목당 1회 |
| ka10023 | 거래량급증 | `/api/dostk/rkinfo` | Top200 선정 | 코스피 거래량순 |
| ka10081 | 주식일봉차트 | `/api/dostk/chart` | OHLCV 수집 | 600건/회, 연속조회 지원 |

### OpenDART

| 엔드포인트 | 용도 | 파라미터 |
|-----------|------|---------|
| `/list.json` | 공시 목록 | crtfc_key, corp_code, bgn_de, end_de |
| `/fnlttSinglAcntAll.json` | 재무제표 | crtfc_key, corp_code, bsns_year, reprt_code, fs_div |

## 환경변수

### Edge Function Secrets (Supabase 대시보드에서 설정)

| 변수 | 설명 | 자동 주입 |
|------|------|---------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role 키 | Yes |
| `KIWOOM_REST_API_KEY` | 키움 API Key | **No — 수동 설정** |
| `KIWOOM_REST_API_SECRET` | 키움 API Secret | **No — 수동 설정** |
| `DART_API_KEY` | OpenDART API Key | **No — 수동 설정** |

### 로컬 환경 (스크립트 실행용)

- `~/.claude/auth/kiwoom.env` — KIWOOM_REST_API_KEY, KIWOOM_REST_API_SECRET
- `~/.claude/auth/opendart.env` — DART_API_KEY
- `apps/pharos-lab/.env.local` — NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

## 데이터 보존 정책

| 테이블 | 보존 기간 | 삭제 기준 | 실행 주기 |
|--------|---------|---------|---------|
| ohlcv_daily | 365일 | trade_date < 1년 전 | 매주 일요일 |
| disclosures | 180일 | rcept_date < 6개월 전 | 매주 일요일 |
| financial_statements | 2년 | bsns_year < 올해-2 | 매주 일요일 |
| stock_fundamentals | 최신 1건 | 종목당 최신 fetch_date만 유지 | 매주 일요일 |

## 백필 (수동)

1년치 OHLCV 백필 스크립트: `scripts/collect_ohlcv_daily.py`

```bash
python3 scripts/collect_ohlcv_daily.py
```

- ka10081 사용 (600건/회, 1년치 1회 호출로 충분)
- 200종목 × ~245거래일 = ~49,000건
- Supabase REST API로 INSERT (ON CONFLICT ignore)

## Troubleshooting

### sync_log 확인
```sql
SELECT * FROM trading.sync_log ORDER BY started_at DESC LIMIT 10;
```

### pg_cron 실행 이력
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

### Edge Function Secrets 미설정
sync_log에 `error` 상태 + `Token failed` 메시지 → Supabase 대시보드에서 Secrets 설정 필요

### Rate Limit (키움 API)
- 증상: return_code=5
- 대응: 요청 간 delay 0.5~1초 (이미 적용됨)

### trading 스키마 접근 불가
- REST API: `Accept-Profile: trading`, `Content-Profile: trading` 헤더 + service_role key 필요
- Edge Function: `trading.exec_sql()` RPC 사용

## Resources

### api/
**kiwoom.py** — 키움증권 REST API 래퍼. OAuth 토큰 캐싱, ka10001/ka10023/ka10081 구현.

**dart.py** — OpenDART API 래퍼. 공시 목록, 재무제표 조회.

### etl/
**template.py** — ETL 작업 베이스 클래스. extract/transform/load 패턴 + sync_log 자동 기록.

### 루트
**setup_trading_pipeline.py** — 파이프라인 검증 스크립트. 스키마/테이블/함수/크론 존재 확인 + 데이터 건수 출력.
