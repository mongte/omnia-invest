# widgets — 재사용 UI 블록

## 역할
- props만 받아서 렌더링하는 순수 UI 컴포넌트
- 데이터 페칭 금지 — views 레이어에서 주입
- 내부 상태는 UI 전용 (정렬, 토글, 호버 등)

## 규칙
- `'use client'` 필요한 경우만 (차트, 인터랙션)
- shadcn/ui 컴포넌트 우선 사용
- Tailwind CSS만 (inline style, CSS module 금지)
- 로딩/에러/빈 상태 처리 포함

## dashboard/
| 위젯 | 차트 라이브러리 | 핵심 props |
|------|----------------|------------|
| ranking-list | - | stocks[], selectedStockId, onSelectStock |
| score-radar | Recharts RadarChart | stock: StockData |
| ranking-chart | Recharts LineChart | data: RankingHistory[], stocks[] |
| disclosure-timeline | - | disclosures[], selectedDisclosureId, onSelectDisclosure |
| llm-summary | - | disclosure, summary: LlmSummaryData |
| price-chart | lightweight-charts | ohlcv[], disclosures[], selectedDisclosureId |

## virtual-trading/
| 위젯 | 차트 라이브러리 | 비고 |
|------|----------------|------|
| account-summary | - | Mock 하드코딩 |
| portfolio-table | - | Mock + 정렬 |
| trade-form | - | 검색/주문 폼 |
| ai-signals | lightweight-charts | Mock AI 신호 |
| backtest-chart | Recharts AreaChart | Mock 백테스트 |
