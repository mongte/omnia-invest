---
paths:
  - "apps/pharos-lab/**/*.{ts,tsx}"
---

# TypeScript Strict

- `any` 금지 → `unknown` + 타입 가드
- 모든 함수 파라미터/반환값에 명시적 타입
- props에는 반드시 `interface` 정의
- 완료 후 `npx tsc --noEmit` 에러 없음 확인
