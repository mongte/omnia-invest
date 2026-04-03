# API Routes (BE 영역)

- Next.js Route Handlers 패턴 사용
- DB 접근: `@/shared/api/local-db`의 `getDb`, `saveDb` 사용
- 에러 응답: 400(검증실패), 404(미존재), 500(서버에러)
- `projectId` 필수 파라미터 검증 필수
- 데이터 변경 후 SSE(`/api/stream`) notify 호출
