# Task Manager API - 타입 정의

## 열거형 (Enums)

```typescript
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
type AgentStatus = 'IDLE' | 'WORKING' | 'OFFLINE' | 'ERROR';
```

## 인터페이스

```typescript
interface TaskComment {
  id: string;          // 자동 생성: "comment-<timestamp>"
  agentId: string;     // 댓글 작성 에이전트 ID
  content: string;     // 댓글 내용
  createdAt: string;   // ISO 8601 형식
}

interface Task {
  id: string;          // 태스크 고유 ID (upsert key)
  title: string;       // PM이 작성한 제목 — 절대 수정 불가
  description: string; // PM이 작성한 상세 스펙 — 절대 수정 불가
  status: TaskStatus;
  assigneeId?: string; // 담당 에이전트 ID
  comments?: TaskComment[];
  createdAt: string;   // ISO 8601 형식
  updatedAt: string;   // ISO 8601 형식
}

interface Agent {
  id: string;           // 에이전트 고유 ID (upsert key)
  name: string;         // 표시 이름
  role: string;         // 역할 설명
  status: AgentStatus;
  currentTaskId?: string;
  lastActiveAt: string; // ISO 8601 형식
}

interface Project {
  id: string;   // "proj-<timestamp>"
  title: string;
  color: string;
  icon?: string;
}
```

## 에이전트 ID 참조표

| 에이전트 | ID | 역할 |
|----------|----|------|
| PM | `agent-pm` | Product Manager |
| BE | `agent-be-1` | Backend Architect |
| FE | `agent-fe-1` | Frontend Developer |
| QA | `agent-qa` | Quality Assurance |
