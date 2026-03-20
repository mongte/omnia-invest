# Task Manager Development Workflows

## Overview

This document defines the step-by-step workflow for the Multi-Agent system to build the Task Manager application and connect it to the Antigravity MCP (Model Context Protocol).
Agents MUST complete each phase sequentially and verify success before proceeding to the next.

## Phase 1: Environment & Project Scaffolding

1. **Verify Nx Setup:** Ensure the Next.js app is correctly configured within the Nx workspace under `apps/task-manager`.
2. **Initialize Styling:** Verify Tailwind CSS configuration (`tailwind.config.js`, `postcss.config.js`, global CSS).
3. **FSD Scaffolding:** Create the base directory structure for FSD (`src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`).

## Phase 2: Design System & Shared Layer Setup

1. **shadcn/ui Initialization:** Install and configure the base components via `shadcn/ui` into the `src/shared/ui` directory.
2. **Icon Setup:** Integrate Lucide and Icones libraries. Create a generic Icon wrapper component in `src/shared/ui` if necessary.
3. **Layout Base:** Create the base application layout in `src/app/layout.tsx`.

## Phase 3: Core Entities and Features Implementation

1. **Define Entities:** Create TypeScript interfaces and mock data for `Task` and `Agent` within the `src/entities` layer.
2. **Develop Features:** Implement core user actions in `src/features`:
   - Task creation and assignment.
   - Real-time agent status monitoring logic.
3. **Build Widgets:** Assemble features and entities into reusable UI blocks in `src/widgets` (e.g., `AgentStatusDashboard`, `TaskKanbanBoard`).

## Phase 4: Page Assembly and Routing

1. **Assemble Pages:** Combine widgets into complete views within the `src/pages` layer.
2. **Configure Routes:** Map the pages to Next.js App Router paths in `src/app`.

## Phase 5: Agent HTTP API & SSE Integration

1. **REST API Core Setup:** Implement local Next.js Route Handlers (`GET/POST /api/tasks`, `/api/agents`) that write to JSON files.
2. **SSE Implementation:** Create a Server-Sent Events endpoint (`/api/stream`) that pushes updates to the frontend using file watchers (`fs.watch`) on the JSON files.
3. **Agent Integration (`curl`):** CLI Agents must use `curl` to POST to the REST API when their status or task progress changes. MCP is not required.

## Phase 6: Zustand State Management

1. **Store Creation:** Create entity-specific Zustand stores in `src/entities/*/model/store.ts` (e.g., `useTaskStore`, `useAgentStore`). Ensure `subscribeWithSelector` is used, and state/actions are separated.
2. **State Integration:** Connect UI components (features and widgets) to Zustand stores using individual selectors to prevent unnecessary re-renders.
3. **Flicker-Free Updates:** Ensure SSE message handlers trigger silent state updates (not clearing current state briefly) so the UI refreshes smoothly without flashing.
