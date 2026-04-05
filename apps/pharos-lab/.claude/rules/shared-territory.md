---
paths:
  - "apps/pharos-lab/src/entities/**"
  - "apps/pharos-lab/src/features/**"
  - "apps/pharos-lab/src/shared/lib/**"
---

# 공유 영역 — 충돌 방지

BE/FE 모두 접근하는 영역. 소유권 규칙 준수 필수.

## entities/
- `types.ts`, `api/` → BE 소유. FE는 import만
- `ui/` → FE 소유. BE 접근 불가

## features/
- `api/`, `model/` → BE 소유
- `ui/` → FE 소유

## shared/lib/
- 생성자가 소유 (git blame 확인)
