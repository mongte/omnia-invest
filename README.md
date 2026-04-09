# Omnia Invest

AI 에이전트 기반 퀀트 투자 분석 플랫폼. Nx 모노레포로 구성되어 있습니다.

## Apps

| 앱 | 설명 | 포트 |
|----|------|------|
| [pharos-lab](apps/pharos-lab/) | 퀀트 투자 분석 대시보드 — 종목 점수, 캔들차트, 공시, 가상투자 | 3000 |
| [task-manager](apps/task-manager/) | AI Agent 칸반 태스크 관리 대시보드 | 4200 |

## AI 에이전트

`.claude/agents/`에 정의된 전문 에이전트 팀:

| 에이전트 | 역할 |
|----------|------|
| pm | 요구사항 분석 → 칸반 태스크 생성 |
| backend | [BE] 태스크 픽업 → API/DB 구현 |
| frontend | [FE] 태스크 픽업 → UI 구현 |
| qa | E2E 테스트 → 통과/반려 |
| database | Supabase DB 관리, 데이터 파이프라인 |
| strategy | 전략 리서치, 스킬 생성, 스키마 설계 |

## 데이터 파이프라인

코스피 Top200 종목 데이터를 자동 수집하여 Supabase에 적재합니다.

```
[로컬 PC — launchd]              [Supabase — pg_cron]           [GitHub Actions]
 키움증권 API (IP 등록 필수)       OpenDART API                   Python 분석 엔진
 07:50 pre-market                 08:00 공시 수집 + 동기화         17:30 스코어링
 16:30 post-market                매월 15일 재무제표               + Discord 알림
                                  매주 일요일 정리
       │                                │                              │
       └──────────┬─────────────────────┼──────────────────────────────┘
                  ▼
         Supabase PostgreSQL
         trading 스키마 (원천) → public 스키마 (서비스)
```

| # | 스케줄 | 시간 (KST) | 실행 위치 | 역할 |
|---|--------|-----------|----------|------|
| 1 | pre-market | 평일 07:50 | 로컬 (launchd) | 키움 API → Top200 갱신 + 기본정보 |
| 2 | post-market | 평일 16:30 | 로컬 (launchd) | 키움 API → 일봉 + 종가 업데이트 |
| 3 | daily-sync-opendart | 평일 08:00 | Supabase (pg_cron) | OpenDART → 공시 수집/분류/동기화 |
| 4 | monthly-financial-sync | 매월 15일 09:00 | Supabase (pg_cron) | OpenDART → 분기 재무제표 |
| 5 | weekly-cleanup | 일요일 00:00 | Supabase (pg_cron) | ohlcv 1년/공시 6개월 초과 삭제 |
| 6 | Daily Stock Analysis | 평일 17:30 | GitHub Actions | 3-Layer 스코어링 + Discord 알림 |

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 모노레포 | Nx |
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript strict |
| 스타일 | Tailwind CSS 4 + shadcn/ui (Radix) |
| DB | Supabase (PostgreSQL) |
| 차트 | lightweight-charts (캔들), Recharts (레이더/라인) |
| 데이터 수집 | Python (키움 REST API, OpenDART API) |
| 분석 엔진 | Python (XGBoost/LightGBM, 3-Layer 스코어링) |
| CI/CD | GitHub Actions (분석), Vercel (배포) |

## 시작하기

```bash
# 의존성 설치
npm install

# pharos-lab 개발 서버
npm run dev --prefix apps/pharos-lab

# task-manager 개발 서버
npm run dev:task-manager

# 타입 체크
npx tsc --noEmit
```

## 프로젝트 구조

```
omnia-invest/
├── apps/
│   ├── pharos-lab/              # 퀀트 투자 분석 플랫폼
│   └── task-manager/            # AI 칸반 태스크 관리
├── scripts/                     # 데이터 수집/분석 스크립트
│   ├── daily_sync_kiwoom.py     # 키움 일일 수집 (launchd)
│   ├── run_analysis.py          # 3-Layer 스코어링 (GitHub Actions)
│   ├── train_ml_model.py        # ML 모델 학습
│   ├── backfill_ohlcv.py        # OHLCV 백필
│   ├── backfill_disclosures.py  # 공시 백필
│   ├── backfill_financials.py   # 재무제표 백필
│   ├── backfill_investor_trading.py  # 투자자별 매매 백필
│   ├── discord_notifier.py      # Discord 알림
│   └── launchd/                 # macOS 스케줄러 plist
├── .github/
│   └── workflows/
│       └── daily-analysis.yml   # 평일 17:30 자동 분석
└── .claude/
    ├── agents/                  # AI 에이전트 정의 (6개)
    └── skills/                  # 에이전트 스킬 (20+)
        ├── trading-data-pipeline/   # ETL 파이프라인 스킬
        ├── data-analysis/           # 3-Layer 스코어링 스킬
        ├── kiwoom-api/              # 키움증권 API 참조
        ├── opendart-api/            # OpenDART API 참조
        └── ...
```
