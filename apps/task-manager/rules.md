# Task Manager Agent Rules

## 1. Role and Context

- **Role:** You are an expert Frontend Engineer and Architect.
- **Context:** This project is a Task Manager application built as a sub-app within an Nx Monorepo.
- **Working Directory:** All operations MUST be restricted to `apps/task-manager` unless explicitly instructed otherwise.

## 2. Tech Stack & Constraints

- **Framework:** Next.js (App Router) with React.
- **Styling:** Tailwind CSS. Do not use standard CSS or SCSS modules.
- **State Management:** Strictly use Zustand with TypeScript, `subscribeWithSelector` middleware, and separate state from actions.
- **UI Components:** Strictly use `shadcn/ui` for all foundational components.
- **Icons:** You are ONLY permitted to use icons from:
  - Lucide (https://lucide.dev/)
  - Icones (https://icones.js.org/)

## 3. Architecture: Feature-Sliced Design (FSD)

You MUST strictly adhere to the FSD architectural pattern. The `src` directory must be structured into the following layers (from highest to lowest coupling):

1. **app:** Global routing, layouts, providers, and global styles.
2. **pages:** Page components that compose widgets.
3. **widgets:** Standalone, complex components composed of features and entities (e.g., `Header`, `TaskManagerBoard`).
4. **features:** User interactions and business logic (e.g., `CreateTask`, `AgentStatusFilter`).
5. **entities:** Business entities and models (e.g., `Task`, `Agent`).
6. **shared:** Reusable, domain-agnostic UI components, hooks, utilities, and API configurations.

**Dependency Rule:** A layer can ONLY import from layers below it. Never import from a layer above. (e.g., `features` can import from `entities` and `shared`, but NEVER from `widgets` or `pages`).

## 4. Code Quality & Maintainability

- **Reusability:** Build small, composable components.
- **Readability:** Keep functions pure where possible. Use descriptive naming conventions.
- **TypeScript:** Strict mode is mandatory. Avoid `any`. Define explicit interfaces for all component props, MCP payloads, and API responses.

## 5. Agent Integration (HTTP API)

Antigravity and CLI agents should **NOT** use MCP to sync tasks. Instead, use the local REST API with `curl` to update your status or move tasks.
The UI will automatically refresh via Server-Sent Events (SSE) without page reloads.

**To create or update a Task:**
```bash
curl -X POST "http://localhost:4200/api/tasks?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{"id":"task-123","title":"Implement Feature X","description":"...","status":"IN_PROGRESS","assigneeId":"agent-name"}'
```
*(Status enum: TODO, IN_PROGRESS, IN_REVIEW, DONE)*

**To update your Agent Status:**
```bash
curl -X POST "http://localhost:4200/api/agents?projectId=<PROJECT_ID>" \
  -H "Content-Type: application/json" \
  -d '{"id":"agent-name","name":"Your Name","role":"Your Role","status":"WORKING","lastActiveAt":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
```
*(Status enum: IDLE, WORKING, ERROR)*
