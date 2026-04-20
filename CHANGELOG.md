# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.2.0] - 2026-04-20

### Added
- **가상 투자 허브 오픈**: `/virtual-trading` 페이지가 Coming Soon에서 실제 동작하는 가상매매 허브로 전환됨
- **가상 포트폴리오**: 회원가입 시 가상 자금 10,000,000원 자동 지급 (`virtual_portfolios` 테이블)
- **시장가 매수/매도**: TradeForm에서 종목 검색 후 즉시 체결 가능, 잔고 실시간 반영
- **자동매매 규칙**: take_profit / stop_loss / limit_buy / signal_buy / signal_sell 5종 규칙 설정 (`auto_trade_rules` 테이블)
- **자산 추이 차트**: 30일 일별 포트폴리오 총자산 변화 AreaChart (`virtual_equity_snapshots`)
- **포지션 테이블**: 보유 종목별 수량·평균단가·평가손익·수익률 실시간 표시
- **포트폴리오 리셋**: 가상 자금 초기화 기능 (포지션·규칙·주문 전체 삭제)
- **가상 투자 DB 스키마**: 5개 신규 테이블(portfolios, positions, orders, rules, equity_snapshots) + RLS + 트리거

### Changed
- 가상 투자 네비게이션 메뉴 `disabled` 해제
- AI 시그널 위젯: Mock → 실제 `fetchRankingListClient` 상위 5종목 연결
- backtest-chart 위젯 → equity-chart 위젯으로 대체 (실 스냅샷 데이터 기반)
- account-summary 위젯 → portfolio-summary 위젯으로 대체

### Fixed
- `virtual_portfolios.cash_balance >= 0` DB 제약 추가 (동시 주문 시 음수 잔고 방지)
- vitest가 e2e/ 디렉토리를 잘못 포함하던 설정 수정

### Removed
- `mock-data.ts`의 가상투자 관련 Mock 데이터 전체 제거 (MOCK_PORTFOLIO, MOCK_AI_SIGNALS, MOCK_EQUITY_CURVE, MOCK_BACKTEST_TRADES)
- `backtest-chart.tsx` 위젯 삭제
