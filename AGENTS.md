# AGENTS.md

This file records the working agreement for this repository.

## Stack

- Desktop shell: Electron Forge
- Frontend: React, MUI, Monaco Editor, Webpack
- Backend API: Express + TSOA
- Data layer: Prisma + SQLite
- Local judge: child-process based execution pipeline
- Tests: Vitest, Testing Library, Supertest

## Verification

Run these from the repository root before closing out behavior changes:

```bash
npm run lint
npm run typecheck
npm run test
```

For release-sensitive changes, also run:

```bash
source scripts/use-dev-node.sh
npm run package
```

If an API contract changes, regenerate the committed TSOA outputs:

```bash
npx tsoa spec-and-routes
```

## Repository Shape

- `src/index.ts`: Electron main-process entrypoint
- `src/backendManager.ts`: backend bootstrap and readiness coordination
- `src/backend/api/`: TSOA controllers, DTOs, services, and DAO layers
- `src/backend/services/judge/`: local code-execution pipeline
- `src/backend/services/ai/`: AI provider selection, settings, and credential handling
- `src/backend/db/`: Prisma schema, seeds, reconciliation scripts, and importers
- `src/frontend/`: routes, pages, components, editor integration, and assistant shell
- `src/shared/`: cross-process configuration shared by Electron and the renderer
- `src/__tests__/`: backend and frontend test surfaces
- `docs/`: architecture, status, roadmap, and longer-form project material

## Working Agreement

- Prefer small, reviewable changes over broad rewrites.
- Keep docs aligned with the current product state, not the aspirational state.
- When behavior changes, update the relevant tests in the same change.
- When API routes or schemas change, regenerate `src/backend/api/routes.ts` and `src/backend/api/swagger.json`.
- Keep build and tool entry files in the repository root; keep explanatory material under `docs/`.
- Use Node `22.x` for the most reliable local development and packaging flow.
