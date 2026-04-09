# Delightful Dogs

<p align="center">
  Local Electron-based algorithm practice platform with problem curation, judge tooling, and an optional desktop AI assistant.
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <img src="./docs/assets/delightful-dogs.png" alt="Delightful Dogs banner" width="720" />
</p>

## Overview

This repository started as the CS732 group project from Team Delightful Dogs.

The current branch is a personal redevelopment line maintained by:

- Chen Lu (`lupanpan`) - `clu396@aucklanduni.ac.nz`

This branch extends the original course-project baseline. It should not be read as a claim that the entire current codebase reflects equal involvement from every original team member.

Original team members:

- Manling Chen - `mche600@aucklanduni.ac.nz`
- Xinyang Guo - `xguo339@aucklanduni.ac.nz`
- Yimei Zhang - `byhz331@aucklanduni.ac.nz`
- Zhuyu Liu - `zliu770@aucklanduni.ac.nz`
- Junxiao Liao - `jila469@aucklanduni.ac.nz`
- Chen Lu - `clu396@aucklanduni.ac.nz`

The current product goal is still local-first desktop practice, not an online judge or a cloud platform. The main workflow is:

- browse and curate practice problems
- write, run, and submit solutions locally
- review per-testcase results and submission history
- manage local language presets
- optionally use a page-aware AI assistant inside the app

## Current Status

This branch is currently usable for local development, packaging, and demo use on the verified environment below.

Verified on the current development machine:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `source scripts/use-dev-node.sh && npm run package`
- packaged-app smoke tests on macOS arm64 for startup, problem listing, language admin, problem detail rendering, run, and submit

Current packaged output on the verified machine:

```text
out/algo-platform-darwin-arm64/algo-platform.app
```

What is working now:

- local Electron desktop startup
- embedded Express + TSOA backend bootstrap
- problem browsing and locale-aware detail rendering
- Monaco-based editing with per-language draft persistence
- run / submit / submission-history flows
- problem CRUD and testcase CRUD
- language preset CRUD
- packaged-app startup with packaged SQLite seed bootstrap
- optional page-aware AI assistant with mock fallback

What is not fully validated yet:

- Windows packaging on a Windows machine
- Linux packaging on a Linux machine
- broader manual UI regression coverage beyond the smoke pass
- long-running or adversarial judge execution scenarios

Important limits:

- code execution is local child-process execution, not a hardened sandbox
- execution isolation, diagnostics, and resource controls still need work
- SQLite portability and backup/restore flows are still incomplete
- packaging is verified on one target platform, not across the full Forge matrix

The active redevelopment roadmap is tracked in [docs/ROADMAP.md](./docs/ROADMAP.md).

## What Changed In This Branch

Compared with the tagged course-project state, this branch focuses on reliability and maintainability rather than only assignment delivery:

- stabilised the desktop runtime and packaged database bootstrap flow
- completed run, submit, and submission-history review in the detail-page workflow
- preserved Monaco drafts per language with starter-code recovery
- expanded problem administration to cover imported metadata, tags, starter code, and testcase curation
- repaired production packaging for the current platform
- added an optional global AI assistant layer that does not block the core local workflow

## Key Features

- Local desktop execution with Electron
- Problem list, detail page, and submission history
- Monaco-based editor with local draft persistence
- Problem CRUD and testcase CRUD in the desktop UI
- Bilingual English/Chinese problem content support
- Language preset management for the local judge
- Local LeetCode CN importer for building a personal dataset
- Optional page-aware AI assistant

## Tech Stack

- Desktop: Electron, Electron Forge
- Frontend: React, MUI, Monaco Editor, Webpack
- Backend: Express, TSOA, Prisma, SQLite
- Testing: Vitest, Testing Library, Supertest

## Quick Start

### Prerequisites

- Node `22.x` LTS is recommended
- `npm`
- Conda is optional, but the repository includes a pinned local environment in [`environment.yml`](./environment.yml)

### Development Setup

```bash
cp .env.example .env
npm install
```

If you use the provided conda environment:

```bash
conda env create -f environment.yml
conda activate delightful-dogs-dev
```

### Start The App

Standard development startup:

```bash
npm start
```

If your shell still resolves `node` to Homebrew instead of the conda environment:

```bash
source scripts/use-dev-node.sh
npm start
```

Or use the repo-local Node 22 helper directly:

```bash
npm run start:node22
```

### Optional AI Provider Setup

To enable the real OpenAI-backed assistant:

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="your_key_here"
AI_MODEL="gpt-5-mini"
```

If `AI_PROVIDER` stays `mock`, the assistant still works in preview mode without network calls.

## Common Commands

Run the backend API only:

```bash
npm run dev
```

Run all checks:

```bash
npm run lint
npm run typecheck
npm run test
```

Run individual test suites:

```bash
npm run test:front
npm run test:back
```

Regenerate backend routes and OpenAPI output:

```bash
npx tsoa spec-and-routes
```

Initialize the local development database:

```bash
npm run db:init
```

Reset and reseed the local development database:

```bash
npm run db:reset
```

Prepare the packaged seed database:

```bash
npm run db:prepare-package-db
```

Import LeetCode CN problems from a local checkout:

```bash
npm run import:leetcode-cn -- --source /path/to/leetcode-problemset/leetcode-cn/originData --limit 20 --dry-run --verbose
npm run import:leetcode-cn -- --source /path/to/leetcode-problemset/leetcode-cn/originData --limit 20
```

Package the current platform:

```bash
npm run package
```

## Packaging Notes

- Packaging is platform-specific, not one artifact for every OS
- the current repository state has been verified on macOS arm64
- `npm run package` prepares the seed database, regenerates Prisma Client, runs `npm run typecheck`, and then invokes Electron Forge
- Windows packaging is configured in Forge, but still needs validation on a Windows machine

## Documentation

- Documentation index: [docs/README.md](./docs/README.md)
- Architecture overview: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Current verification and support status: [docs/STATUS.md](./docs/STATUS.md)
- Redevelopment roadmap: [docs/ROADMAP.md](./docs/ROADMAP.md)
- Development guide: [docs/development.md](./docs/development.md)
- Product and implementation plans: [docs/plans/](./docs/plans)

## Repository Layout

```text
.
├── src/                 # Electron main process, backend, frontend, shared code, tests
├── scripts/             # Local helper scripts such as the Node 22 launcher helpers
├── docs/                # Roadmap, development guide, plans, and static documentation assets
├── build-resources/     # Generated packaging resources such as seed.db
├── backups/             # Local backup artifacts
├── package.json         # npm scripts and dependency manifest
├── forge.config.js      # Electron Forge packaging configuration
└── README.md            # English repository overview
```

## Why Some Files Still Belong In The Repository Root

Not everything should be moved into `docs/`.

These files are supposed to stay at the root because tools expect them there:

- `package.json`, `package-lock.json`
- `forge.config.js`
- `tsconfig.json`
- `tsoa.json`
- `vitest.config.ts`
- `webpack.*.js`
- `.gitignore`, `.env.example`
- `environment.yml`

In short:

- documentation and planning material belong under `docs/`
- build, runtime, package-manager, and tool-entry files should stay at the root
