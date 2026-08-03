---
title: 데이터 파이프라인과 Supabase
tags: [pharos-lab, pipeline, supabase, database]
status: done
updated: 2026-07-30
---

# 데이터 파이프라인과 Supabase

> 키움/OpenDART 수집 → trading 스키마 → public 동기화 → pharos-lab 대시보드. 분석 엔진은 점수·시그널을 DB에 기록한다.

## 데이터 흐름

```
[키움증권 API]          [OpenDART API]
      │                      │
      ▼                      ▼
 OHLCV·기본정보            공시·재무제표
(daily_sync_kiwoom.py)   (Edge/backfill)
      │                      │
      └──────────┬───────────┘
                 ▼
         [Supabase trading]
                 │
         public 동기화 + run_analysis
                 ▼
         [public 스키마] → pharos-lab
```

## 스케줄

### 로컬 (launchd, 키움 — IP 제한)
| 시각 (KST) | 작업 |
|-----------|------|
| 07:50 | `daily_sync_kiwoom.py --job pre-market` — Top50 갱신 + 기본정보 |
| 16:30 | `daily_sync_kiwoom.py --job post-market` — 일봉 + 종가 |

### Supabase (pg_cron / Edge, OpenDART — IP 제한 없음)
| 시각 | 작업 |
|------|------|
| 08:00 KST | 공시 수집·분류 + public 동기화 (`daily-sync-opendart`) |
| 매월 15일 | 분기 재무제표 (`monthly-financial-sync`) |
| 일요일 0시 | 정리 — ohlcv 1년, 공시 6개월 초과 삭제 (`weekly-cleanup`) |

### 분석
| 시각 | 작업 |
|------|------|
| 17:30 KST (문서상 GitHub Actions) | `run_analysis.py` — 3-Layer 스코어링 |

## 주요 스크립트 (모노레포 `scripts/`)

| 파일 | 역할 |
|------|------|
| `daily_sync_kiwoom.py` | 일일 키움 동기화 |
| `collect_ohlcv_daily.py` | OHLCV 수집 |
| `run_analysis.py` | 분석 실행 |
| `generate_summaries.py` | LLM 요약 |
| `backfill_*.py` | 공시/재무/투자자/OHLCV 백필 |
| `discord_notifier.py` | 알림 |

## public 스키마 (앱 직접 접근)

| 테이블 | 용도 |
|--------|------|
| `stocks` | 종목 기본정보 + `quant_score` 등 |
| `stock_scores` | 레이어별/종합 점수 |
| `ranking_history` | 순위 변동 |
| `disclosures` | 공시 (trading에서 동기화) |
| `llm_summaries` | LLM 공시 요약 |
| `holdings` / `favorites` | 실보유·관심 |
| `virtual_positions` / `virtual_orders` / `virtual_equity` | 가상 투자 |
| `auto_trade_rules` | 자동 매매 규칙 |

## trading 스키마 (파이프라인 원천)

| 테이블 | 용도 |
|--------|------|
| `ohlcv_daily` | 일봉 롤링 윈도우 |
| `stock_fundamentals` | PER/PBR/ROE/시총 등 |
| `financial_statements` | 분기 재무 |
| `disclosures` | 원천 공시 |
| `watch_universe` | 관찰 종목 (예: volume_top200) |
| `strategy_signals` | 분석 시그널 |
| `sync_log` | 파이프라인 로그 |

## 앱 측 Supabase 클라이언트

```
src/shared/api/supabase.ts              # 공통
src/shared/api/supabase-server.ts       # Server Component (cookies)
src/shared/api/supabase-browser.ts      # Client Component
src/shared/api/supabase-auth-server.ts  # Auth 미들웨어
src/shared/types/supabase.ts            # Database 타입
```

환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(서버 전용).

## 3-Layer 스코어링 (요약)

README 기준 가중치 예: 팩터 30% / 타이밍 30% / ML 40%. 시그널 구간 Strong Buy(85+) … Strong Sell(<25). 상세 아키텍처 문서와 구현 가중치는 시장·전략에 따라 동적일 수 있음. 결과는 `stock_scores` / `stocks.quant_score` 등으로 대시보드에 노출.

## 데이터 현황 (앱 CLAUDE/도메인 스킬 기준)

- `trading.ohlcv_daily`: 관찰 종목 × 약 1년치 (문서상 ~50×1년 ~8,000건 등, 시점 변동)
- `public.stocks` / `public.disclosures` 동기화 완료 상태 문서화됨
- Mock 잔존 시 실 API로 교체

## 관련

- [[제품 개요와 스택]]
- [[FSD 앱 구조]]
- [[투자 도메인 규칙]]
- [[인덱스 (MOC)]]
