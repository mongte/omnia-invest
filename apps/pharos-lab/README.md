# Pharos Lab

퀀트 기반 투자 분석 플랫폼. 코스피 Top50 종목의 실시간 데이터를 대시보드로 시각화하고, 가상 투자 시뮬레이션을 제공합니다.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript strict (`any` 금지) |
| 스타일 | Tailwind CSS 4 + shadcn/ui (Radix) |
| 차트 | lightweight-charts (캔들), Recharts (레이더/라인/에어리어) |
| DB | Supabase (PostgreSQL) |
| 아이콘 | Lucide React |

## 시작하기

```bash
# 환경변수 설정
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 등 입력

# 개발 서버 (localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 타입 체크
npx tsc --noEmit
```

## 프로젝트 구조

```
apps/pharos-lab/
└── src/
    ├── app/                           # Next.js App Router
    │   └── (shell)/                   # 공통 레이아웃 그룹
    │       ├── dashboard/             # 대시보드 페이지
    │       └── virtual-trading/       # 가상투자 페이지
    ├── views/                         # 페이지 수준 컴포넌트
    │   ├── dashboard/                 # 대시보드 뷰
    │   └── virtual-trading/           # 가상투자 뷰
    ├── widgets/                       # 복합 UI 위젯
    │   ├── app-shell/                 # 헤더, 사이드바, 모바일 내비
    │   ├── dashboard/                 # 대시보드 위젯
    │   │   ├── price-chart            #   캔들 차트 (lightweight-charts)
    │   │   ├── score-radar            #   종목 점수 레이더 차트
    │   │   ├── ranking-list           #   순위 테이블
    │   │   ├── ranking-chart          #   순위 변동 차트
    │   │   ├── disclosure-timeline    #   공시 타임라인
    │   │   └── llm-summary            #   LLM 공시 요약
    │   └── virtual-trading/           # 가상투자 위젯
    │       ├── account-summary        #   계좌 요약
    │       ├── portfolio-table        #   포트폴리오 테이블
    │       ├── trade-form             #   매매 폼
    │       ├── ai-signals             #   AI 매매 신호
    │       └── backtest-chart         #   백테스트 차트
    ├── features/                      # 비즈니스 로직 (확장 예정)
    ├── entities/                      # 데이터 모델
    │   └── stock/                     # 종목 타입 정의
    ├── shared/                        # 공통 모듈
    │   ├── api/                       # Supabase 클라이언트
    │   ├── ui/                        # shadcn/ui 컴포넌트
    │   │   └── charts/                # 차트 컴포넌트 (area, bar, candlestick, line, radar)
    │   ├── lib/                       # 유틸리티, mock 데이터
    │   └── types/                     # Supabase 타입 정의
```

## FSD 아키텍처

Feature-Sliced Design 레이어 구조를 따릅니다.

```
app → views → widgets → features → entities → shared
```

상위 레이어만 하위 레이어를 import 할 수 있습니다. **역방향 import 금지.**

## 페이지

| 경로 | 설명 |
|------|------|
| `/dashboard` | 종목 대시보드 — 캔들차트, 점수 레이더, 순위, 공시, LLM 요약 |
| `/virtual-trading` | 가상 투자 — 계좌, 포트폴리오, 매매, AI 신호, 백테스트 |

## 데이터 파이프라인

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

상세: `.claude/skills/trading-data-pipeline/` 참조

## DB 스키마

### public 스키마 (앱에서 직접 접근)

| 테이블 | 건수 | 설명 |
|--------|------|------|
| stocks | ~100 | 종목 기본정보 (코드, 이름, 시장, 가격, 변동률) |
| stock_scores | ~50 | 종목 점수 (펀더멘털, 모멘텀, 공시, 기관, 종합) |
| ranking_history | ~70 | 순위 변동 이력 |
| disclosures | ~666 | 공시 데이터 (trading에서 자동 동기화) |
| llm_summaries | ~7 | LLM 공시 요약 |

### trading 스키마 (파이프라인 원천 데이터)

| 테이블 | 건수 | 설명 |
|--------|------|------|
| ohlcv_daily | ~8,000 | 50종목 x 1년 일봉 (롤링 윈도우) |
| stock_fundamentals | ~50 | PER/PBR/ROE/시총/외국인비율 |
| financial_statements | - | 분기 재무제표 |
| disclosures | - | 원천 공시 데이터 |
| watch_universe | ~50 | 관찰 종목 리스트 |
| sync_log | - | 파이프라인 실행 로그 |

## 환경변수

`.env.local`에 다음 키가 필요합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key    # 서버사이드 전용
```

## 현재 상태

- **1단계 (데이터 수집) 완료** — trading 스키마에 실제 데이터 적재됨 (12,500건+)
- **public 동기화 완료** — trading → public.stocks, public.disclosures 자동 동기화
- **Mock → 실제 DB 교체 필요** — views/widgets가 아직 `shared/lib/mock-data.ts` 참조 중
