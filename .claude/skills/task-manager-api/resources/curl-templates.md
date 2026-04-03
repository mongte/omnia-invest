# Task Manager API - curl 명령어 템플릿

**Base URL**: `http://localhost:4200`  
**플레이스홀더**: `<PROJECT_ID>`, `<TASK_ID>`, `<AGENT_ID>` 등을 실제 값으로 교체하세요.

---

## 프로젝트 관리

### 프로젝트 목록 조회
```bash
curl -s "http://localhost:4200/api/projects" | jq .
```

**응답 예시:**
```json
[
  { "id": "proj-1773998802853", "title": "Omnia Invest", "color": "blue", "icon": "Folder" }
]
```

### 프로젝트 생성
```bash
curl -s -X POST "http://localhost:4200/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"title": "새 프로젝트", "color": "green", "icon": "Folder"}'
```

### 프로젝트 삭제
```bash
curl -s -X DELETE "http://localhost:4200/api/projects/<PROJECT_ID>"
```

---

## 태스크 조회

### 태스크 전체 목록 조회
```bash
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" | jq .
```

### 상태별 태스크 필터링 (jq 활용)
```bash
# TODO 태스크만
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" | jq '[.[] | select(.status == "TODO")]'

# IN_PROGRESS 태스크만
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" | jq '[.[] | select(.status == "IN_PROGRESS")]'

# IN_REVIEW 태스크만
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" | jq '[.[] | select(.status == "IN_REVIEW")]'

# 특정 에이전트에 할당된 태스크
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" | jq '[.[] | select(.assigneeId == "<AGENT_ID>")]'

# [BE] 태그 TODO 태스크
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" | jq '[.[] | select(.status == "TODO" and (.title | contains("[BE]")))]'

# [FE] 태그 TODO 태스크
curl -s "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" | jq '[.[] | select(.status == "TODO" and (.title | contains("[FE]")))]'
```

---

## 태스크 생성 (PM 전용)

### 새 태스크 생성
```bash
curl -s -X POST "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "task-<TIMESTAMP>",
    "title": "[BE] API 엔드포인트 구현",
    "description": "**목표**:\n기능 X를 위한 REST API를 구현합니다.\n\n**요구사항**:\n1. GET /api/resource 엔드포인트 추가\n2. 응답 타입 정의\n\n**FSD 아키텍처 위치**:\n- `apps/task-manager/src/app/api/resource/route.ts`\n\n**수락 기준**:\n- 200 응답 확인\n- TypeScript 타입 오류 없음",
    "status": "TODO",
    "comments": [],
    "createdAt": "<ISO_TIMESTAMP>",
    "updatedAt": "<ISO_TIMESTAMP>"
  }'
```

**타임스탬프 생성 방법:**
```bash
# TIMESTAMP (숫자)
date +%s%3N

# ISO_TIMESTAMP
date -u +"%Y-%m-%dT%H:%M:%S.000Z"
```

---

## 태스크 상태 업데이트 (BE/FE 에이전트)

### ⚠️ 중요: title과 description을 절대 포함하지 마세요 (덮어쓰기 방지)

### TODO → IN_PROGRESS (작업 시작)
```bash
curl -s -X POST "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<TASK_ID>",
    "status": "IN_PROGRESS",
    "assigneeId": "<AGENT_ID>",
    "updatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

### IN_PROGRESS → IN_REVIEW (작업 완료, QA 요청)
```bash
curl -s -X POST "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<TASK_ID>",
    "status": "IN_REVIEW",
    "updatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

---

## 태스크 상태 업데이트 (QA 에이전트)

### IN_REVIEW → DONE (테스트 통과)
```bash
curl -s -X POST "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<TASK_ID>",
    "status": "DONE",
    "updatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

### IN_REVIEW → IN_PROGRESS (테스트 실패, 반려)
```bash
curl -s -X POST "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<TASK_ID>",
    "status": "IN_PROGRESS",
    "updatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

---

## 댓글 추가

### 기본 댓글 추가
```bash
curl -s -X POST "http://localhost:4200/api/tasks/comments?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<TASK_ID>",
    "agentId": "<AGENT_ID>",
    "content": "댓글 내용"
  }'
```

### BE/FE - 작업 시작 댓글
```bash
curl -s -X POST "http://localhost:4200/api/tasks/comments?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<TASK_ID>",
    "agentId": "<AGENT_ID>",
    "content": "[작업 시작] 태스크를 IN_PROGRESS로 전환합니다. 작업 계획: <간단한 구현 계획>"
  }'
```

### BE/FE - 작업 완료 댓글
```bash
curl -s -X POST "http://localhost:4200/api/tasks/comments?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<TASK_ID>",
    "agentId": "<AGENT_ID>",
    "content": "[작업 완료] 구현 완료. 변경 요약: <변경 내용 요약>. QA 검증 요청합니다."
  }'
```

### QA - 반려 댓글 (구조화된 버그 리포트)
```bash
curl -s -X POST "http://localhost:4200/api/tasks/comments?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<TASK_ID>",
    "agentId": "agent-qa",
    "content": "[QA 반려] \n\n**버그 제목**: <버그 제목>\n**심각도**: HIGH|MEDIUM|LOW\n**재현 단계**:\n1. <단계 1>\n2. <단계 2>\n**기대 결과**: <기대 동작>\n**실제 결과**: <실제 동작>\n**에러 로그**:\n```\n<에러 메시지>\n```\n**테스트 파일**: <테스트 파일 경로>"
  }'
```

### QA - 통과 댓글
```bash
curl -s -X POST "http://localhost:4200/api/tasks/comments?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<TASK_ID>",
    "agentId": "agent-qa",
    "content": "[QA 통과] 모든 테스트 통과. 테스트 파일: <경로>. 검증 항목: <검증 내용 요약>"
  }'
```

---

## 에이전트 상태 관리

### 에이전트 등록 (최초 1회)
```bash
curl -s -X POST "http://localhost:4200/api/agents?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<AGENT_ID>",
    "name": "<에이전트 표시 이름>",
    "role": "<역할 설명>",
    "status": "IDLE",
    "lastActiveAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

### 에이전트 상태 → WORKING (작업 시작)
```bash
curl -s -X POST "http://localhost:4200/api/agents?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<AGENT_ID>",
    "name": "<에이전트 표시 이름>",
    "role": "<역할 설명>",
    "status": "WORKING",
    "currentTaskId": "<TASK_ID>",
    "lastActiveAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

### 에이전트 상태 → IDLE (작업 완료)
```bash
curl -s -X POST "http://localhost:4200/api/agents?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<AGENT_ID>",
    "name": "<에이전트 표시 이름>",
    "role": "<역할 설명>",
    "status": "IDLE",
    "lastActiveAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

### 에이전트 상태 → ERROR
```bash
curl -s -X POST "http://localhost:4200/api/agents?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<AGENT_ID>",
    "name": "<에이전트 표시 이름>",
    "role": "<역할 설명>",
    "status": "ERROR",
    "lastActiveAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

---

## 완료 태스크 정리

### DONE 태스크 일괄 삭제
```bash
curl -s -X POST "http://localhost:4200/api/tasks/clear-completed?projectId=<PROJECT_ID>"
```

---

## 에이전트별 ID 참조표

| 에이전트 | ID | 역할 |
|----------|----|------|
| PM | `agent-pm` | Product Manager |
| BE | `agent-be-1` | Backend Architect |
| FE | `agent-fe-1` | Frontend Developer |
| QA | `agent-qa` | Quality Assurance |
