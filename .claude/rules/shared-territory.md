---
paths:
  - "apps/task-manager/src/entities/**"
  - "apps/task-manager/src/features/**"
  - "apps/task-manager/src/shared/lib/**"
---

# 공유 영역 — 충돌 방지 규칙

BE와 FE 모두 접근하는 영역. 소유권 규칙을 반드시 준수하세요.

## entities/

- `types.ts`, `model/`, `api/` → BE 소유. FE는 import만 가능
- `ui/` → FE 소유. BE는 접근 불가

## features/

- `api/`, `model/` 하위 파일 → BE 소유
- `ui/` 하위 파일 → FE 소유

## shared/lib/

- 서버 전용 유틸 → BE 생성/수정
- 클라이언트 전용 유틸 → FE 생성/수정
- 기존 유틸 수정 → 생성자가 소유 (git blame으로 확인)
