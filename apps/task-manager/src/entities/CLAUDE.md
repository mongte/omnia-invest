# Entities (공유 영역 — 소유권 규칙 준수)

Zustand with `subscribeWithSelector`. state/actions 분리.
스토어: `task/model/store.ts`, `agent/model/store.ts`, `project/model/store.ts`

## 소유권

- `types.ts`, `model/store.ts`, `api/` → BE 소유. FE는 import만 가능
- `ui/` → FE 소유. BE는 접근 불가
