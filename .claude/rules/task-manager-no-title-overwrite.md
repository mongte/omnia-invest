---
paths:
  - "apps/task-manager/src/app/api/**/*.ts"
---

# 태스크 업데이트 시 title/description 덮어쓰기 방지

POST `/api/tasks`로 태스크 상태만 변경할 때, `title`이나 `description` 필드를 절대 포함하지 말 것.
상태 변경 시에는 `id`, `status`, `updatedAt`만 전송할 것.

PM이 작성한 description이 빈 문자열로 덮어씌워지는 사고가 발생한 적 있음.
