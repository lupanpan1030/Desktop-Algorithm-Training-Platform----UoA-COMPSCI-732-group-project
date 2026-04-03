# Delightful Dogs

This repository started as the CS732 group project from Team Delightful Dogs.

It is now being independently redeveloped and maintained by:

- Chen Lu _(clu396@aucklanduni.ac.nz)_ / `lupanpan`

Original team members:

- Manling Chen _(mche600@aucklanduni.ac.nz)_
- Xinyang Guo _(xguo339@aucklanduni.ac.nz)_
- Yimei Zhang _(byhz331@aucklanduni.ac.nz)_
- Zhuyu Liu _(zliu770@aucklanduni.ac.nz)_
- Junxiao Liao _(jila469@aucklanduni.ac.nz)_
- Chen Lu _(clu396@aucklanduni.ac.nz)_

![](./Delightful%20Dogs.png)

## Project Overview
An algorithm puzzle ([Competitive programming](https://en.wikipedia.org/wiki/Competitive_programming)) training platform that runs on desktop in a completely local environment.

This branch/version is the personal secondary-development edition of the original project. The current maintenance focus is:

- stabilising the local desktop + backend runtime
- making database/bootstrap flow reproducible
- improving the judge execution pipeline
- turning the project into a maintainable local training platform with import and curation workflows

The current redevelopment plan is tracked in [ROADMAP.md](./ROADMAP.md).

## Key Features
- Local execution with a desktop GUI.
- Configurable programming-language presets.
- Run / submit evaluation with submission history review.
- Monaco-based code editor with per-language local drafts and starter-code reset support.
- Problem administration UI for problem CRUD, testcase CRUD, and imported metadata inspection.
- Bilingual problem content support with English/Chinese locale switching.
- Local LeetCode CN importer for building a personal practice dataset.

## Technology
- Desktop: [electron.js](https://www.electronjs.org/), [electron-forge](https://www.electronforge.io/)
- Frontend: [react.js](https://react.dev/), [MUI](https://mui.com/), [monaco editor](https://microsoft.github.io/monaco-editor/), [webpack](https://webpack.js.org/)
- Backend: [express.js](https://expressjs.com/), [TSOA](https://tsoa-community.github.io/docs/), [prisma](https://www.prisma.io/)

## Run Project

### Download & Run the Published Executable
1. Download the compiled portable from [Release Page](https://github.com/UOA-CS732-S1-2025/group-project-delightful-dogs/releases).
2. To start the application, run the `./out/start_application` script.

### Run Source Code for Development
More details for development are provided in [dev-doc.md](./dev-doc.md).

- Recommended environment isolation:
  - This repository now includes [environment.yml](./environment.yml) for a dedicated conda environment.
  - Create it with `conda env create -f environment.yml`
  - Activate it with `conda activate delightful-dogs-dev`
  - The recommended Node runtime is currently `22.x` LTS. Node `24.x` can still run the project, but it emits noisy TypeScript-config parsing warnings in Electron Forge development mode.
  - Copy `.env.example` to `.env` before your first run.

- To start project for development:
  - Ensure Node.js and npm are properly set up.
  - Run in the project root directory.
      ```bash
      cp .env.example .env
      npm start
      ```
  - This launches the Electron shell and the webpack-based renderer dev server.
- To enable the real OpenAI-backed global assistant:
  - Set these in your local `.env`.
      ```bash
      AI_PROVIDER="openai"
      OPENAI_API_KEY="your_key_here"
      AI_MODEL="gpt-5-mini"
      ```
  - If `AI_PROVIDER` stays `mock`, the assistant still works, but it uses the local preview provider instead of the network API.
- To run backend only:
  - Run in the project root directory.
      ```bash
      npm run dev
      ```
  - The API server listens on `http://localhost:6785`.
- To run tests:
  - Run in the project root directory.
      ```bash
      npm run test
      ```
  - Individual suites are available as `npm run test:front` and `npm run test:back`.
- To regenerate backend routes and OpenAPI output after changing TSOA controllers or DTOs:
  - Run in the project root directory.
      ```bash
      npx tsoa spec-and-routes
      ```
- Swagger UI debug page is available at:
  - `http://localhost:6785/docs`
- To initialize the local development database:
  - Run in the project root directory.
      ```bash
      npm run db:init
      ```
- To reset and reseed the local development database:
  - Run in the project root directory.
      ```bash
      npm run db:reset
      ```
- To import LeetCode CN problems from a local `leetcode-problemset` checkout:
  - Dry-run the importer first.
      ```bash
      npm run import:leetcode-cn -- --source /Users/ethan/Documents/GitHub/leetcode-problemset/leetcode-cn/originData --limit 20 --dry-run --verbose
      ```
  - Then run the real import.
      ```bash
      npm run import:leetcode-cn -- --source /Users/ethan/Documents/GitHub/leetcode-problemset/leetcode-cn/originData --limit 20
      ```
  - Imported problems are stored as content-first entries.
  - The importer keeps your later testcase/judge work intact by preserving `judge_ready` and existing testcase rows.
  - Imported LeetCode problems will still need manual testcase completion before they become fully runnable in the local judge.
- Current notable UI areas:
  - `Problem List`: browse localized problems and difficulty/completion filters.
  - `Detail Page`: read the problem, code, run, submit, and inspect submission history.
  - `Problem Admin`: curate problems, testcases, imported sample references, tags, and starter-code metadata.
  - `Languages`: manage execution language presets.
  - `Global AI Assistant`: open the floating assistant button from any page to get page-aware help and suggested questions.
- To compile an executable for the current platform:
  - Run in the project root directory.
      ```bash
      npm run package
      ```
