---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript Strict 규칙

- `any` 타입 사용 금지. `unknown` + 타입 가드 사용
- 모든 함수 파라미터와 반환값에 명시적 타입 지정
- props/payload에는 반드시 `interface` 정의
- 구현 완료 후 `npx tsc --noEmit`으로 타입 에러 없음 확인
