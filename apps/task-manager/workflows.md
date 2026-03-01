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

## Phase 5: MCP & Antigravity Integration

1. **MCP Client Setup:** Implement the MCP client logic in `src/shared/api` to communicate with the local Antigravity server.
2. **State Synchronization:** Connect the MCP data streams to the React state/context to reflect real-time Multi-Agent task progress on the UI.
3. **Action Triggers:** Ensure UI actions (like task creation) are correctly formatted and sent to the Antigravity system via MCP.

## Phase 6: Zustand State Management

1. **Store Creation:** Create entity-specific Zustand stores in `src/entities/*/model/store.ts` (e.g., `useTaskStore`, `useAgentStore`). Ensure `subscribeWithSelector` is used, and state/actions are separated.
2. **State Integration:** Connect UI components (features and widgets) to Zustand stores using individual selectors to prevent unnecessary re-renders.
3. **MCP Synchronization:** Update the MCP mock client to dispatch updates directly to the Zustand store, ensuring a unidirectional data flow.
