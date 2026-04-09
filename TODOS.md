# TODOS

## P2 — UX 개선

### ScoreExplanation 빈 상태 카운트다운 로직
**What:** 빈 상태 카드의 "다음 업데이트까지 {N}시간" 계산을 실제 DB 갱신 스케줄 기반으로 동적 처리.
**Why:** 현재 17:30 KST 하드코딩은 분석 스크립트 실행 시간이 변경될 경우 깨짐. DB의 `updated_at` 기준으로 다음 갱신 예상 시간을 표시하면 신뢰도 향상.
**Pros:** 실제 갱신 시간 반영, 사용자 신뢰 증가.
**Cons:** API 엔드포인트 또는 클라이언트 로직 추가 필요.
**Context:** MVP에서는 17:30 KST 하드코딩으로 구현. PMF 검증 후 개선.
**Effort:** S (CC+gstack ~30분)
**Priority:** P2
**Depends on:** ScoreExplanation PR 완료

## P1 — 봇 런타임 의존성

### requirements-analysis.txt에 python-telegram-bot 추가
**What:** `scripts/requirements-analysis.txt`에 `python-telegram-bot>=20.0` 추가.
**Why:** GitHub Actions `daily-bot.yml`이 동일 파일을 `pip install`하는데, 패키지 누락 시 ImportError가 런타임에 발생. CI에서 잡히지 않고 첫 실행 시 터짐.
**Pros:** GitHub Actions 첫 실행 성공 보장.
**Cons:** 분석 스크립트 환경에 봇 패키지가 같이 설치됨 (용량 소폭 증가).
**Context:** `daily-bot.yml` 작성과 동시에 반드시 처리. httpx는 이미 있음, telegram 패키지만 추가.
**Effort:** XS (1줄 추가)
**Priority:** P1
**Depends on:** 없음

## P3 — 코드 안정성

### score_descriptions text[] → jsonb 변환
**What:** `public.stock_scores.score_descriptions` 컬럼을 `text[]`에서 `jsonb`로 변환. scoring.py 출력을 JSON 객체로 변경, 프론트엔드 파서도 JSON 우선 + 문자열 폴백으로 업데이트.
**Why:** 현재 `"시그널: strong_buy"` 문자열 파싱은 취약함. 타이틀/값 구분자(`:`)가 값에 포함되면 파싱 깨짐. JSON 구조로 바꾸면 타입 안전성 확보.
**Pros:** 봇 + 대시보드 양쪽에서 안전한 구조화 데이터 사용. TypeScript 타입 레벨에서 signal 값 보장.
**Cons:** DB migration 필요 (`ALTER COLUMN`). 양방향 파서(JSON 우선, 문자열 폴백) 전환 기간 관리.
**Context:** 봇 + ScoreExplanation PR에서 제외됨 (MVP 스코프). 문자열 파서가 현재 작동하므로 즉각 긴급하지 않음.
**Effort:** M (인간 팀) → S (CC+gstack, ~1시간)
**Priority:** P3
**Depends on:** 봇 + ScoreExplanation PR 완료

## P2 — 공유 확산 개선

### og:image 메타태그 (대시보드)
**What:** `?stock=005930` URL 공유 시 카카오톡/텔레그램에서 링크 프리뷰 이미지 표시.
**Why:** 봇 메시지 공유 시 시각적 신뢰도 향상. 새 사용자 클릭률 증가.
**Pros:** 바이럴 효과 향상, 브랜드 인식 강화.
**Cons:** Vercel OG Image API 또는 정적 이미지 구현 필요, 상대적으로 시간 투자.
**Context:** PMF 검증 후 공유 확산이 확인되면 우선순위 높아짐. 이번 봇 + 대시보드 PR에서는 스킵.
**Effort:** M (인간 팀) → S (CC+gstack)
**Priority:** P2
**Depends on:** 봇 + ScoreExplanation PR 완료 + PMF 시그널 (사용자 자발적 공유)
