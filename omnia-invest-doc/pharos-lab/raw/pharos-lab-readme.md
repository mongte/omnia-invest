# Pharos Lab

퀀트 기반 투자 분석 플랫폼. 코스피 Top200 종목의 데이터를 대시보드로 시각화하고, 가상 투자 시뮬레이션을 제공합니다.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 언어 | TypeScript strict (`any` 금지) |
| 스타일 | Tailwind CSS 4 + shadcn/ui (Radix) |
| 차트 | lightweight-charts (캔들), Recharts (레이더/라인/에어리어) |
| DB | Supabase (PostgreSQL) |
| 아이콘 | Lucide React |
| 배포 | Vercel |

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
    │   ├── (shell)/                   # 공통 레이아웃 그룹
    │   │   ├── dashboard/             # 대시보드 페이지
    │   │   └── virtual-trading/       # 가상투자 페이지
    │   └── api/                       # Route Handlers
    │       └── stocks/                # 종목 API
    ├── views/                         # 페이지 수준 컴포넌트
    │   ├── dashboard/                 # 대시보드 뷰 (실 DB 연동)
    │   ├── virtual-trading/           # 가상투자 뷰
    │   └── landing/                   # 랜딩 페이지 뷰
    ├── widgets/                       # 복합 UI 위젯
    │   ├── app-shell/                 # 헤더, 사이드바, 모바일 내비
    │   ├── dashboard/                 # 대시보드 위젯
    │   │   ├── price-chart            #   캔들 차트 (lightweight-charts)
    │   │   ├── score-radar            #   종목 점수 레이더 차트
    │   │   ├── ranking-list           #   순위 테이블 (무한 스크롤)
    │   │   ├── ranking-chart          #   순위 변동 차트
    │   │   ├── disclosure-timeline    #   공시 타임라인
    │   │   └── llm-summary            #   LLM 공시 요약
    │   ├── virtual-trading/           # 가상투자 위젯
    │   │   ├── account-summary        #   계좌 요약
    │   │   ├── portfolio-table        #   포트폴리오 테이블
    │   │   ├── trade-form             #   매매 폼
    │   │   ├── ai-signals             #   AI 매매 신호
    │   │   └── backtest-chart         #   백테스트 차트
    │   └── landing/                   # 랜딩 페이지 위젯
    │       ├── hero-section           #   히어로 섹션
    │       ├── features-section       #   기능 소개
    │       ├── preview-section        #   대시보드 미리보기
    │       ├── data-stats-section     #   데이터 통계
    │       ├── cta-section            #   CTA
    │       ├── landing-nav            #   랜딩 네비게이션
    │       └── landing-footer         #   랜딩 푸터
    ├── features/                      # 비즈니스 로직 (확장 예정)
    ├── entities/                      # 데이터 모델
    │   └── stock/                     # 종목 타입 정의
    └── shared/                        # 공통 모듈
        ├── api/                       # Supabase 클라이언트 + 페칭 함수
        │   ├── dashboard.ts           # 서버사이드 fetch
        │   ├── dashboard-client.ts    # 클라이언트사이드 fetch
        │   ├── supabase.ts            # Supabase 클라이언트
        │   └── ranking-utils.ts       # 순위 매핑 유틸
        ├── ui/                        # shadcn/ui 컴포넌트
        │   └── charts/                # 차트 컴포넌트
        ├── lib/                       # 유틸리티
        └── types/                     # Supabase 타입 정의
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
| `/` | 랜딩 페이지 — 서비스 소개, 기능 미리보기 |
| `/dashboard` | 종목 대시보드 — 캔들차트, 점수 레이더, 순위, 공시, LLM 요약 |
| `/virtual-trading` | 가상 투자 — 계좌, 포트폴리오, 매매, AI 신호, 백테스트 (Coming Soon) |

## 3-Layer 스코어링

종목 점수는 Python 분석 엔진에서 계산되어 `stock_scores` 테이블에 저장됩니다.

| Layer | 가중치 | 주기 | 구성 요소 |
|-------|--------|------|-----------|
| 팩터 (품질) | 30% | 월간 | PER·PBR 역수, ROE, 매출성장률, 공시활동 |
| 타이밍 (기술적) | 30% | 매일 | RSI14, MACD, 볼린저밴드, 이격도, MA 크로스 |
| ML 예측 | 40% | 주간 | XGBoost/LightGBM — 5거래일 상승 확률 |

시그널: Strong Buy(85+) → Buy(65+) → Hold(45+) → Sell(25+) → Strong Sell(<25)

## DB 스키마

### public 스키마 (앱에서 직접 접근)

| 테이블 | 설명 |
|--------|------|
| stocks | 종목 기본정보 (코드, 이름, 시장, 가격, 변동률) |
| stock_scores | 종목 점수 (펀더멘털, 모멘텀, 공시, 기관, 종합) |
| ranking_history | 순위 변동 이력 |
| disclosures | 공시 데이터 (trading에서 자동 동기화) |
| llm_summaries | LLM 공시 요약 |

### trading 스키마 (파이프라인 원천 데이터)

| 테이블 | 설명 |
|--------|------|
| ohlcv_daily | 200종목 x 1년 일봉 (롤링 윈도우) |
| stock_fundamentals | PER/PBR/ROE/시총/외국인비율 |
| financial_statements | 분기 재무제표 |
| disclosures | 원천 공시 데이터 |
| watch_universe | 관찰 종목 리스트 (volume_top200) |
| strategy_signals | 분석 엔진 상세 시그널 |
| sync_log | 파이프라인 실행 로그 |

## 환경변수

`.env.local`에 다음 키가 필요합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key    # 서버사이드 전용
```

## 현재 상태

- **데이터 수집 완료** — trading 스키마에 실제 데이터 적재됨
- **public 동기화 완료** — trading → public.stocks, public.disclosures 자동 동기화
- **실 DB 연동 완료** — 대시보드가 Supabase에서 직접 데이터 조회 (Mock 미사용)
- **3-Layer 스코어링 가동** — GitHub Actions 평일 17:30 자동 실행
- **가상투자** — UI 구현 완료, 백엔드 연동 예정 (Coming Soon)
