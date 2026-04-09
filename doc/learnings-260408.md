# Project Learnings

> gstack이 자동 캡처한 패턴, 함정, 아키텍처 인사이트.
> 마지막 업데이트: 2026-04-08

## Patterns

- **bot-first-validation**: 데이터 파이프라인이 있는 pre-product 스타트업은 텔레그램/카카오톡 봇으로 수요 검증이 가장 빠름 (1-2일). 봇 메시지 스크린샷 단톡방 공유 = 강한 PMF 시그널. (confidence: 7/10)

## Pitfalls

- **github-actions-cron-timing-dependency**: 분석 스크립트와 봇 발송 스크립트가 다른 시간에 실행되면 별도 workflow 필수. 동일 workflow에 step을 추가하면 발송 시간 목표 달성 불가. daily-analysis(17:30 KST)와 daily-bot(09:00 KST)은 분리. (confidence: 9/10)

## Architecture

- **nextjs-searchparams-uuid-mismatch**: Next.js App Router에서 URL 파라미터(stock_code)와 내부 상태(UUID)가 불일치할 때, server component(DashboardPage)에서 code→id 매핑을 처리하는 게 clean함. initialStocks가 이미 로드되어 있으므로 추가 DB 쿼리 없음. (confidence: 9/10)

- **score-explanation-ux**: 이 제품의 진짜 차별점은 3-layer 스코어링 모델이 아니라 스코어를 초보자 언어로 설명하는 UX. 레이더 차트는 초보자에게 직관적이지 않음. 구체적인 한 문장 이유 카드가 더 효과적. (confidence: 8/10)

