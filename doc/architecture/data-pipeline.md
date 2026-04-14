# 데이터 파이프라인 아키텍처

KOSPI Top200 종목 데이터 수집 → Supabase 저장 → 분석 → 대시보드

## 데이터 흐름

```
[키움증권 API]          [OpenDART API]
      │                      │
      ▼                      ▼
 OHLCV 수집           공시/재무제표 수집
(daily_sync_kiwoom.py) (backfill_*.py)
      │                      │
      └──────────┬───────────┘
                 ▼
         [Supabase DB]
                 │
                 ▼
        run_analysis.py
                 │
                 ▼
      3-Layer 스코어링 → QUALITY_SCORE
                 │
                 ▼
        pharos-lab 대시보드
```

## 실행 스케줄

| 시각 (KST) | 스크립트 | 트리거 |
|-----------|---------|--------|
| 07:50 | `daily_sync_kiwoom.py` (pre-market) | launchd |
| 16:30 | `daily_sync_kiwoom.py` (post-market) | launchd |
| 17:30 (UTC 08:30) | `run_analysis.py` | GitHub Actions |

## 주요 스크립트

| 파일 | 역할 |
|------|------|
| `scripts/daily_sync_kiwoom.py` | 메인 일일 동기화 (21KB) |
| `scripts/collect_ohlcv_daily.py` | OHLCV 수집 |
| `scripts/run_analysis.py` | 분석 실행 |
| `scripts/generate_summaries.py` | LLM 요약 생성 |
| `scripts/discord_notifier.py` | 디스코드 알림 |

## launchd 설치

```bash
bash scripts/launchd/install.sh
```
