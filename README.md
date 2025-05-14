# CS732 project - Team Delightful Dogs

Team members:

- Manling Chen _(mche600@aucklanduni.ac.nz)_
- Xinyang Guo _(xguo339@aucklanduni.ac.nz)_
- Yimei Zhang _(byhz331@aucklanduni.ac.nz)_
- Zhuyu Liu _(zliu770@aucklanduni.ac.nz)_
- Junxiao Liao _(jila469@aucklanduni.ac.nz)_
- Chen Lu _(clu396@aucklanduni.ac.nz)_

![](./Delightful%20Dogs.png)

# Project Overview
An algorithm puzzle ([Competitive programming](https://en.wikipedia.org/wiki/Competitive_programming)) training platform that runs on desktop in a completely local environment.

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

# Run Project

## Download Published Executable
TODO: Link to GitHub Releases page

## Run Source Code for Development
More details for development are provided in [dev-doc.md](./dev-doc.md).

- To start project for development:
  - Ensure Node.js and npm are properly set up.
  - Run in the project root directory.
      ```bash
      npm start
      ```
- To run tests:
  - Run in the project root directory.
      ```bash
      npm run test
      ```
- To compile an executable for the current platform:
  - Run in the project root directory.
      ```bash
      npm run package
      ```
