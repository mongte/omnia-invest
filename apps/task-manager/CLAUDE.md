# Task Manager

AI Agent 태스크 관리 대시보드.

## Commands

```bash
npm run dev:task-manager    # 개발 서버 (localhost:4200)
npm run build:task-manager  # 프로덕션 빌드
npx tsc --noEmit            # 타입 체크
```

## FSD Architecture

`src/` 아래 엄격한 Feature-Sliced Design 레이어 구조:

```
app/       → 라우팅, 레이아웃, API routes, providers
views/     → 페이지 수준 컴포넌트
widgets/   → 복합 UI (board, sidebar, task-list 등)
features/  → 비즈니스 로직 (task-management, project-management)
entities/  → 데이터 모델 + Zustand 스토어 (task, agent, project)
shared/    → 공통 UI (shadcn/ui), utils, API 클라이언트
```

**의존성 규칙**: 상위만 하위 import 가능. 역방향 절대 금지.

## Path Aliases

```
@/app/*, @/views/*, @/widgets/*, @/features/*, @/entities/*, @/shared/*
```

## Data

- JSON 파일 DB: `data/projects/{projectId}.json`
- REST API: `/api/tasks`, `/api/projects`, `/api/agents`, `/api/stream`
- SSE: `/api/stream` (실시간 UI 업데이트)
