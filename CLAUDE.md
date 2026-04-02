# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run dev:task-manager        # task-manager 개발 서버 (localhost:4200)

# Build & Lint
npm run build:task-manager      # 프로덕션 빌드
npm run lint:task-manager       # ESLint 실행

# Database utilities
npm run db:archive              # DB를 JSON으로 아카이브
npm run db:load                 # JSON에서 DB 로드

# Nx direct commands
npx nx run task-manager:dev
npx nx run task-manager:build
npx nx run task-manager:lint

# pharos-lab (독립 package.json, apps/pharos-lab에서 실행)
cd apps/pharos-lab && npm run dev
```

## Architecture Overview

**Nx monorepo** with two Next.js apps. 공유 패키지 없이 앱 단위로 구성.

### Apps

- **task-manager** — AI Agent 태스크 관리 대시보드. 칸반 보드, 멀티 프로젝트, 실시간 SSE 업데이트 지원. Next.js 16 + React 19 + Zustand + shadcn/ui.
- **pharos-lab** — 한국 주식 투자 분석 연구용 앱. 키움증권 REST API, OpenDART API 연동. Next.js 16 + Tailwind CSS 4.

### task-manager: Feature-Sliced Design (FSD)

`apps/task-manager/src/` 아래 엄격한 FSD 레이어 구조를 따름:

```
app/          → 라우팅, 레이아웃, API routes, providers
views/        → 페이지 수준 컴포넌트
widgets/      → 복합 UI (board, sidebar, task-list 등)
features/     → 비즈니스 로직 (task-management, project-management)
entities/     → 데이터 모델 + Zustand 스토어 (task, agent, project)
shared/       → 공통 UI (shadcn/ui), utils, API 클라이언트
```

**의존성 규칙**: 상위 레이어만 하위 레이어를 import 가능. 역방향 import 금지.
- `widgets` → `features` → `entities` → `shared` (OK)
- `entities` → `features` (FORBIDDEN)

### Path Aliases (task-manager)

```
@/app/*       → src/app/*
@/views/*     → src/views/*
@/widgets/*   → src/widgets/*
@/features/*  → src/features/*
@/entities/*  → src/entities/*
@/shared/*    → src/shared/*
```

### Data Layer

- JSON 파일 기반 DB (`apps/task-manager/data/projects/{projectId}.json`)
- SQL/ORM 없음. `fs/promises`로 직접 파일 I/O
- SSE (`/api/stream`)로 실시간 UI 업데이트
- REST API routes: `/api/tasks`, `/api/projects`, `/api/agents`, `/api/stream`

### State Management

Zustand with `subscribeWithSelector` middleware. 엔티티별 분리된 스토어:
- `entities/task/model/store.ts`
- `entities/agent/model/store.ts`
- `entities/project/model/store.ts`

## Tech Stack Constraints (task-manager)

- **Styling**: Tailwind CSS only. CSS/SCSS 모듈 사용 금지.
- **UI**: shadcn/ui 컴포넌트만 사용.
- **Icons**: Lucide 또는 Icones.js.org만 허용.
- **TypeScript**: strict mode. `any` 사용 금지. 모든 props/payload에 명시적 interface 정의.
- **State**: Zustand + `subscribeWithSelector`. state와 actions 분리.

## Agent Integration

외부 에이전트는 MCP 대신 REST API + curl로 태스크 업데이트:

```bash
# Task 생성/업데이트
curl -X POST "http://localhost:4200/api/tasks?projectId=<ID>" \
  -H "Content-Type: application/json" \
  -d '{"id":"task-123","title":"...","status":"IN_PROGRESS","assigneeId":"agent-name"}'

# Agent 상태 업데이트
curl -X POST "http://localhost:4200/api/agents?projectId=<ID>" \
  -H "Content-Type: application/json" \
  -d '{"id":"agent-name","name":"...","status":"WORKING","lastActiveAt":"..."}'
```

Status enums: Task=`TODO|IN_PROGRESS|IN_REVIEW|DONE`, Agent=`IDLE|WORKING|ERROR`

## Formatting

- Prettier: `singleQuote: true`
- EditorConfig: 2 spaces, UTF-8, LF
