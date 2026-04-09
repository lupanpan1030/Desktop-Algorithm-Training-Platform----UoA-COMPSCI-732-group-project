# Architecture Overview

This document explains the current runtime shape of the personal redevelopment line.

It exists for the same reason strong architecture notes exist in repositories like `claw-code-main`: the codebase should make its execution boundaries, verification surface, and known constraints explicit.

## Design Goals

- keep the project fully local for day-to-day use
- make the core practice loop reliable: read problem, write code, run, submit, inspect results
- keep the desktop app self-contained enough to package for personal use
- isolate AI-assisted features so the app still works without a live provider

## Runtime Topology

The app is a single packaged Electron desktop application with four main runtime layers:

1. Electron main process
   - Entry: `src/index.ts`
   - Creates the browser window, applies CSP headers, initializes packaged runtime state, and starts the embedded backend.
2. Embedded backend API
   - Bootstrap: `src/backendManager.ts`
   - Server entry: `src/backend/api/server.ts`
   - App factory: `src/backend/api/app.ts`
   - Runs Express + TSOA locally on `localhost:6785` by default.
3. Renderer app
   - Entry: `src/frontend/index.tsx`
   - Root app: `src/frontend/App.jsx`
   - Uses `HashRouter` so packaged navigation does not depend on a separate web server.
4. Local data and execution services
   - Prisma + SQLite for problem data, languages, submissions, and settings
   - child-process based judge execution
   - optional OpenAI-backed assistant provider with a mock fallback

## Startup Flow

### Development

1. Electron starts through Forge.
2. `src/index.ts` calls `startBackend()`.
3. `src/backendManager.ts` spawns `ts-node-dev src/backend/api/server.ts`.
4. The main process waits for `/problems` to respond before creating the main window.

### Production

1. Electron starts the packaged app.
2. `src/index.ts` calls `initProdEnv()` before booting the backend.
3. `src/prodEnvInit.ts` copies the packaged `seed.db` into the user data directory if needed.
4. The main process points `DATABASE_URL` at the user-local SQLite file.
5. `src/backendManager.ts` starts Express directly in-process instead of spawning `ts-node-dev`.
6. The renderer loads after backend bootstrap succeeds.

This split is one of the repository's most important design decisions: the packaged app remains local-first, while development keeps a faster backend iteration loop.

## Backend Structure

The backend is organized by resource area with a repeating shape:

- controller: HTTP surface and DTO wiring
- service: business logic and orchestration
- DAO: Prisma access

Current API domains:

- `problem`
- `submission`
- `testcase`
- `language`
- `settings/ai`
- `ai`
- `problem-ai`

This is simpler than the crate-level modularization used in `claw-code-main`, but the same architectural lesson applies: make capability boundaries visible. In this project, the boundaries are resource-oriented instead of workspace-oriented.

## Core Product Flows

### Problem Browsing And Editing

- `ProblemsService` maps database records into locale-aware summaries and details.
- The frontend list and detail pages read the same local API surface the packaged app uses.
- Imported metadata, tags, starter code, and testcase counts are exposed through the same problem domain rather than a separate import-only subsystem.

### Run And Submit

- `SubmissionService` orchestrates language lookup, testcase selection, judge execution, and submission persistence.
- `src/backend/services/judge/executor.ts` handles compile and run phases, timeout enforcement, and best-effort memory sampling.
- `runCode()` executes a small testcase subset for fast feedback.
- `submitCode()` evaluates the full testcase set and persists the result tree.

This is currently the most critical reliability surface in the repository.

### AI Assistant

- Backend provider selection lives under `src/backend/services/ai/`.
- `createAiProvider()` resolves runtime settings and chooses a real OpenAI provider only when it is configured correctly.
- Otherwise the app falls back to a mock provider so the UI remains usable without network credentials.
- The renderer keeps a global assistant shell through `GlobalAiAssistantProvider`.
- Page-aware prompts are registered from route-level context via `useAiPageContext()`.
- Conversation state is stored locally per route.

The important boundary here is that AI features are optional overlays, not a dependency of the core practice workflow.

## Data And Packaging Model

There are three data concerns in the repository:

1. Development database state
   - Local iteration and tests
2. Packaged seed database
   - Prepared by `src/backend/db/prepare-package-db.ts`
   - Shipped in `build-resources/seed.db`
3. User-local packaged database
   - Materialized into the Electron user data directory on first launch

This is a useful pattern to keep: seed data and real user data are related, but they are not the same lifecycle.

## Frontend Structure

The frontend is organized by route, shared component groups, and assistant support modules:

- `pages/`: route-level screens
- `components/`: reusable UI surfaces grouped by feature
- `ai/`: assistant state, page context, prompt cards, launcher behavior
- `hooks/`, `utils/`, `i18n/`: supporting modules

The renderer currently mixes `.jsx`, `.tsx`, and a few legacy JS utilities. That is workable, but it is also a clear place for future cleanup.

## Tests And Verification

The repository keeps backend and frontend tests under `src/__tests__/`:

- backend integration tests cover the local API surface
- backend unit tests cover services, importers, and judge behavior
- frontend unit tests cover routes, editor behavior, assistant state, and admin flows

CI should mirror the same contract the docs describe:

- lint
- typecheck
- tests
- TSOA generation drift check

This explicit verification surface is one of the strongest ideas to borrow from `claw-code-main`.

## What We Borrow From `claw-code-main`

- Document the real runtime shape, not just project marketing.
- Separate "how it is built" from "what it still lacks."
- Keep a tight working-agreement document near the repository root.
- Treat verification as part of architecture, not an afterthought.

## What We Intentionally Do Not Borrow

- We do not need multi-crate or multi-runtime decomposition yet.
- We do not need parity-audit machinery against another codebase.
- We do not need community or sponsorship-oriented repository structure.

The right lesson is not "copy that repository's layout." The right lesson is "make this repository's boundaries and obligations obvious."
