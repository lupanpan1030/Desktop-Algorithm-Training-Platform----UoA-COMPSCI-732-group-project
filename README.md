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
- cleaning up tests, docs, and engineering basics

## Key Features
- Local execution with a desktop GUI.
- Configuring any programming language (as long as it exists in the local environment).
- Real-time code execution and submission evaluation.
- Integrated code editor.
- Algorithm problem list with difficulty levels.

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

- To start project for development:
  - Ensure Node.js and npm are properly set up.
  - Run in the project root directory.
      ```bash
      npm start
      ```
- To run backend only:
  - Run in the project root directory.
      ```bash
      npm run dev
      ```
- To run tests:
  - Run in the project root directory.
      ```bash
      npm run test
      ```
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
- To compile an executable for the current platform:
  - Run in the project root directory.
      ```bash
      npm run package
      ```
