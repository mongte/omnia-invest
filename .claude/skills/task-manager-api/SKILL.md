---
name: task-manager-api
description: "Task Manager kanban API: task CRUD, status transitions, comments, agent state. Used by PM/BE/FE/QA agents via bash script."
user-invocable: false
allowed-tools:
  - Bash
---

# Task Manager API Skill

## 개요

이 스킬은 `http://localhost:4200`에서 실행되는 Task Manager 칸반 보드 API와의 모든 상호작용을 정의합니다. PM, BE, FE, QA 에이전트가 이 스킬을 통해 동일한 API 계약 위에서 일관되게 협업합니다.

**서버 주소**: `http://localhost:4200`  
**데이터 범위**: 모든 태스크/에이전트 작업은 반드시 `projectId` 쿼리 파라미터로 프로젝트를 지정해야 합니다.

---

## When to use

- 칸반 보드에서 태스크 목록 조회 및 상태 확인이 필요할 때
- 새로운 태스크를 생성하거나 기존 태스크 상태를 변경할 때
- 태스크에 댓글(작업 히스토리, 버그 리포트, 진행 메모)을 추가할 때
- 에이전트 자신의 상태(IDLE/WORKING/ERROR)를 등록하거나 갱신할 때
- 프로젝트 목록을 조회하거나 관리할 때

## When NOT to use

- Task Manager 앱 자체의 소스 코드를 수정할 때 (이는 FE/BE 에이전트의 역할)
- 로컬 파일을 직접 읽거나 쓸 때 (API를 통해서만 데이터 접근)

---

## 스크립트 사용법 (권장)

`${CLAUDE_SKILL_DIR}/assets/task-api.sh` 스크립트를 사용하면 **한 줄**로 API를 호출할 수 있습니다.

```bash
SCRIPT="${CLAUDE_SKILL_DIR}/assets/task-api.sh"
```

### 명령어 레퍼런스

| 명령어 | 사용법 | 설명 |
|--------|--------|------|
| `list-tasks` | `bash $SCRIPT list-tasks <projectId>` | 태스크 전체 조회 |
| `get-task` | `bash $SCRIPT get-task <projectId> <taskId>` | 단일 태스크 조회 |
| `update-status` | `bash $SCRIPT update-status <projectId> <taskId> <status> [assigneeId]` | 태스크 상태 변경 |
| `create-task` | `bash $SCRIPT create-task <projectId> <taskId> <title> <desc> [status]` | 태스크 생성 (PM) |
| `add-comment` | `bash $SCRIPT add-comment <projectId> <taskId> <agentId> "<content>"` | 댓글 추가 |
| `clear-completed` | `bash $SCRIPT clear-completed <projectId>` | DONE 태스크 삭제 |
| `list-agents` | `bash $SCRIPT list-agents <projectId>` | 에이전트 목록 |
| `register-agent` | `bash $SCRIPT register-agent <projectId> <agentId> <name> <role> [status]` | 에이전트 등록 |
| `update-agent` | `bash $SCRIPT update-agent <projectId> <agentId> <status> [taskId]` | 에이전트 상태 변경 |
| `list-projects` | `bash $SCRIPT list-projects` | 프로젝트 목록 |
| `create-project` | `bash $SCRIPT create-project <title> [color] [icon]` | 프로젝트 생성 |
| `delete-project` | `bash $SCRIPT delete-project <projectId>` | 프로젝트 삭제 |

> **참고**: `updatedAt`, `lastActiveAt`, `createdAt` 타임스탬프는 스크립트가 자동 생성합니다.  
> **참고**: 댓글 내용에 공백이나 특수문자가 있으면 반드시 큰따옴표로 감싸세요.

---

## Critical Rules

### 1. POST /api/tasks는 Upsert다
`id`가 일치하는 태스크가 있으면 전송한 필드만 덮어씁니다(부분 업데이트). 없으면 새로 생성합니다.
- **부분 업데이트 시**: `id`와 변경할 필드만 전송하세요. 나머지 필드는 서버가 기존 값을 유지합니다.
- **신규 생성 시**: `id`, `title`, `description`, `status`, `createdAt`, `updatedAt` 모두 포함해야 합니다.

### 2. title과 description은 불변이다
PM 에이전트가 최초 작성한 `title`과 `description`은 **어떤 에이전트도 수정할 수 없습니다**. BE/FE/QA가 POST 시 이 필드를 전송하지 않거나 빈 값으로 보내면 덮어써져 데이터가 손실됩니다. 반드시 이 두 필드는 POST 본문에 포함하지 않거나, 포함 시 원본 값 그대로 유지해야 합니다.

### 3. 댓글은 에이전트 간 유일한 커뮤니케이션 채널이다
태스크 본문(`title`, `description`)은 기획 스펙이고, 모든 작업 진행 상황·버그 리포트·반려 사유·결정 근거는 반드시 댓글로 남겨야 합니다. 댓글은 누적되어 히스토리가 됩니다.

### 4. 에이전트 상태를 항상 동기화하라
작업 시작 시 `WORKING`, 완료 시 `IDLE`, 오류 시 `ERROR`로 즉시 갱신해야 합니다.

---

## 참조 리소스

- 완전한 API 엔드포인트 및 curl 예시: [curl-templates.md](resources/curl-templates.md)
- TypeScript 타입 정의 (Task, Agent, Project): [type-definitions.md](resources/type-definitions.md)
- 역할별 워크플로우 패턴 (PM/BE/FE/QA): [workflow-patterns.md](resources/workflow-patterns.md)
- 에러 대응 플레이북: [error-playbook.md](resources/error-playbook.md)
