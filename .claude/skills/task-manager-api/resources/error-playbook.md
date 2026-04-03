# Task Manager API - 에러 대응 플레이북

## 전제 조건 확인

API 호출 전 항상 확인:
1. Task Manager 서버가 `http://localhost:4200`에서 실행 중인지 확인
2. 유효한 `projectId`를 가지고 있는지 확인 (`GET /api/projects`로 조회)

---

## HTTP 에러 코드별 대응

### 400 Bad Request
**원인**: 필수 파라미터 누락 또는 잘못된 형식
```
{"error": "projectId is required"}
{"error": "taskId, agentId, and content are required"}
```

**대응**:
- `projectId` 쿼리 파라미터가 URL에 포함되어 있는지 확인
- 댓글 API: `taskId`, `agentId`, `content` 모두 body에 포함되어 있는지 확인
- JSON body 형식 오류 → `Content-Type: application/json` 헤더 확인

**예방**: curl 명령어 작성 시 `?projectId=<PROJECT_ID>` 항상 포함

---

### 404 Not Found
**원인**: 존재하지 않는 태스크에 댓글 추가 시도
```
{"error": "Task not found"}
```

**대응**:
1. `GET /api/tasks?projectId=<PROJECT_ID>`로 실제 태스크 ID 확인
2. taskId 오타 여부 확인
3. 다른 projectId의 태스크에 접근하지 않는지 확인

---

### 500 Internal Server Error
**원인**: 서버 내부 오류 (파일 I/O 실패, JSON 파싱 오류 등)

**대응**:
1. Task Manager 서버 터미널 로그 확인
2. `data/projects/<projectId>.json` 파일의 JSON 형식 유효성 확인
3. 서버 재시작: `npm run dev:task-manager`

---

## 연결 에러 대응

### Connection Refused
```
curl: (7) Failed to connect to localhost port 4200: Connection refused
```

**대응**:
1. Task Manager 서버 시작 여부 확인
2. 프로젝트 루트에서 실행: `npm run dev:task-manager`
3. 포트 4200이 다른 프로세스에 의해 사용 중인지 확인: `lsof -i :4200`

---

### 응답 없음 (Timeout)
**대응**:
1. 서버가 실행 중인지 확인: `curl -s http://localhost:4200/api/projects`
2. Next.js 개발 서버가 초기 빌드 중일 수 있음 → 잠시 대기 후 재시도

---

## 데이터 무결성 주의사항

### title/description 덮어쓰기 방지
POST /api/tasks는 upsert 동작을 하며 `{...existingTask, ...incomingBody}` 방식으로 병합합니다. body에 `title: ""` 또는 `description: ""`을 보내면 PM의 원본 스펙이 삭제됩니다.

**안전한 상태 업데이트 패턴**:
```bash
# 올바른 방법 - status와 updatedAt만 전송
curl -X POST "http://localhost:4200/api/tasks?projectId=<ID>" \
  -H "Content-Type: application/json" \
  -d '{"id": "<TASK_ID>", "status": "IN_PROGRESS", "updatedAt": "..."}'

# 위험한 방법 - title/description을 빈 값으로 보내면 원본 삭제됨
# -d '{"id": "<TASK_ID>", "title": "", "status": "IN_PROGRESS"}'  ← 금지
```

### 동시성 주의사항
- 이 API는 파일 기반 DB를 사용하며 동시 쓰기 잠금 기능이 없습니다.
- 두 에이전트가 동시에 같은 태스크를 업데이트하면 마지막 쓰기가 이깁니다.
- **권장**: 에이전트는 자신이 할당된 태스크만 수정합니다.

---

## 디버깅 유용한 명령어

```bash
# 서버 상태 확인
curl -s http://localhost:4200/api/projects | jq length

# 특정 태스크의 전체 데이터 확인 (comments 포함)
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" \
  | jq '.[] | select(.id == "<TASK_ID>")'

# 태스크 상태별 카운트
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" \
  | jq 'group_by(.status) | map({status: .[0].status, count: length})'

# 에이전트 상태 확인
curl -s "http://localhost:4200/api/agents?projectId=<PROJECT_ID>" | jq .
```
