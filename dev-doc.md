# Algo Platform Development Notes

This document reflects the current personal redevelopment state of the repository.

## Setup

Run commands from the project root.

Recommended local environment:

```bash
conda env create -f environment.yml
conda activate delightful-dogs-dev
npm install
```

Recommended runtime:

- Node `22.x` LTS for the quietest Electron Forge development flow
- Node `24.x` still works, but emits noisy TypeScript-config parsing warnings

## Common Commands

Start the full desktop app in development:

```bash
npm start
```

If your shell still resolves `node` to Homebrew after `conda activate delightful-dogs-dev`, use one of these repo-local helpers:

```bash
source scripts/use-dev-node.sh
npm start
```

or launch directly with:

```bash
npm run start:node22
```

Run the backend API only:

```bash
npm run dev
```

Run all tests:

```bash
npm run test
```

Run only the frontend or backend suite:

```bash
npm run test:front
npm run test:back
```

Lint the repository:

```bash
npm run lint
```

Regenerate TSOA routes and OpenAPI output:

```bash
npx tsoa spec-and-routes
```

Swagger UI in local development:

- `http://localhost:6785/docs`

## Database Commands

Initialize the local development database:

```bash
npm run db:init
```

Reset and reseed the local development database:

```bash
npm run db:reset
```

Prepare the packaged seed database used by production builds:

```bash
npm run db:prepare-package-db
```

Import LeetCode CN problems from a local checkout:

```bash
npm run import:leetcode-cn -- --source /path/to/leetcode-problemset/leetcode-cn/originData --limit 20 --dry-run --verbose
npm run import:leetcode-cn -- --source /path/to/leetcode-problemset/leetcode-cn/originData --limit 20
```

Notes:

- imported problems are content-first entries
- imported sample references and starter code are preserved as metadata
- imported problems still need testcase completion before they become fully judge-ready

## Build Commands

Package the current platform:

```bash
npm run package
```

Create distributables:

```bash
npm run make
```

## Current Runtime Shape

Main process:

- `src/index.ts`
- `src/preload.ts`
- `src/backendManager.ts`

Backend API:

- `src/backend/api/app.ts`
- `src/backend/api/server.ts`
- `src/backend/api/routes.ts`

Frontend app:

- `src/frontend/App.jsx`
- `src/frontend/pages/ListPage.jsx`
- `src/frontend/pages/DetailPage.jsx`
- `src/frontend/pages/ProblemAdmin.tsx`
- `src/frontend/pages/LanguageAdmin.tsx`

Database and import tooling:

- `src/backend/db/prisma/schema.prisma`
- `src/backend/db/prisma/initialize-database.ts`
- `src/backend/db/importers/import-leetcode-cn.ts`

Judge pipeline:

- `src/backend/services/judge/executor.ts`

## Current Product Areas

Problem detail flow:

- localized problem content
- Monaco editor with per-language drafts
- run / submit
- submission history review
- starter-code reset support

Problem administration:

- problem CRUD
- testcase CRUD
- imported sample-reference inspection
- tags / starter-code metadata review
- locale-aware problem curation filters

Language management:

- CRUD for execution language presets

## Current Gaps

The most important remaining engineering work is:

- hardening judge execution and diagnostics
- improving portability and backup/restore story for local SQLite data
- cleaning up mixed JS/TS patterns in the frontend
- deciding the next major product direction, including potential AI-assisted workflows
