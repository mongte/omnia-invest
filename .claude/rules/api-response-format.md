---
paths:
  - "apps/*/src/app/api/**/*.ts"
---

# API 응답 형식 통일

- 성공: `NextResponse.json(data)` (200)
- 생성: `NextResponse.json(data, { status: 201 })`
- 클라이언트 에러: `NextResponse.json({ error: "메시지" }, { status: 400 })`
- 미존재: `NextResponse.json({ error: "Not found" }, { status: 404 })`
- 서버 에러: `NextResponse.json({ error: "Internal server error" }, { status: 500 })`
- `projectId` 필수 파라미터 검증을 모든 route에 포함
