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
| qa | E2E 테스트 �� 통과/반려 |
| database | Supabase DB 관리, 데이터 파이프라인 |
| strategy | 전략 리서치, 스킬 생성, 스키마 설계 |

## 데이터 파이프라인

코스피 Top200 종목 데이터를 자동 수집하여 Supabase에 적재합니다.

```
[로컬 PC — launchd]              [Supabase — pg_cron]
 키움증권 API                      OpenDART API
 07:50 pre-market                 08:00 공시 수집
 16:30 post-market                매월 15일 재무제표
                                  매주 일요일 정리
       │                                │
       └──────────┬─────────���───────────┘
                  ▼
         Supabase PostgreSQL
         trading 스키마 → public 스��마
```

상세: `.claude/skills/trading-data-pipeline/README.md`

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 모노레포 | Nx |
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript strict |
| 스타일 | Tailwind CSS + shadcn/ui |
| DB | Supabase (PostgreSQL) |
| 차트 | lightweight-charts, Recharts |
| 테스트 | Playwright (E2E) |
| ���이터 수집 | Python (키움 REST API, OpenDART API) |

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
│   ���── task-manager/            # AI 칸반 태스크 관리
├── scripts/                     # 데이터 수집 스크립트
│   ├── daily_sync_kiwoom.py     # 키움 일일 수집 (launchd)
│   ├── collect_ohlcv_daily.py   # OHLCV 1년치 백필
│   └── launchd/                 # macOS 스케줄러 plist
└── .claude/
    ├── agents/                  # AI 에이전트 정의 (6개)
    └── skills/                  # 에���전트 스킬 (20+)
        ├── trading-data-pipeline/   # ETL 파이프라인 스킬
        ├── kiwoom-api/              # 키움증권 API 참조
        ├── opendart-api/            # OpenDART API 참조
        └── ...
```
