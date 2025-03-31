# CS732 project - Team Delightful Dogs

Welcome to the CS732 project. We look forward to seeing the amazing things you create this semester! This is your team's repository.

Your team members are:
- Manling Chen _(mche600@aucklanduni.ac.nz)_
- Xinyang Guo _(xguo339@aucklanduni.ac.nz)_
- Yimei Zhang _(byhz331@aucklanduni.ac.nz)_
- Zhuyu Liu _(zliu770@aucklanduni.ac.nz)_
- Junxiao Liao _(jila469@aucklanduni.ac.nz)_
- Chen Lu _(clu396@aucklanduni.ac.nz)_

You have complete control over how you run this repo. All your members will have admin access. The only thing setup by default is branch protections on `main`, requiring a PR with at least one code reviewer to modify `main` rather than direct pushes.

Please use good version control practices, such as feature branching, both to make it easier for markers to see your group's history and to lower the chances of you tripping over each other during development

![](./Delightful%20Dogs.png)

# Algo-Platform

## Setup & Run

> The following command should be executed in the project root directory.

### [Run (Development)](https://www.electronforge.io/#starting-your-app)

```bash
npm start
```

### [Building Distributables](https://www.electronforge.io/#building-distributables)

```bash
npm run make
```

## Architecture

```
src/
├── electron/                # Electron-specific code
│   ├── main.ts              # Main process entry point
│   ├── preload.ts           # Limited preload script (if needed)
│   └── window.ts            # Window management functions
│
├── frontend/                # React.js application
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared UI elements (buttons, inputs)
│   │   ├── layout/          # Layout components (header, sidebar)
│   │   └── problems/        # Problem-specific components
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── ProblemList.tsx  # Puzzles list (from MVP)
│   │   ├── ProblemDetail.tsx # View specific puzzle (from MVP)
│   │   └── Submission.tsx   # Submit solutions (from MVP)
│   ├── hooks/               # Custom React hooks
│   │   └── useApi.ts        # Hook for API communication
│   ├── styles/              # CSS/styling
│   ├── App.tsx              # Main React component
│   └── index.tsx            # React entry point
│
├── backend/                 # Backend services
│   ├── api/                 # Express router setup
│   │   ├── routes/          # API route definitions
│   │   │   ├── problems.ts
│   │   │   ├── languages.ts
│   │   │   ├── testcases.ts
│   │   │   └── submissions.ts
│   │   ├── middleware/      # Express middleware
│   │   └── index.ts         # Express app setup
│   │
│   ├── db/                  # Database layer
│   │   ├── prisma/          # Prisma ORM
│   │   │   ├── schema.prisma  # DB schema definition
│   │   │   └── migrations/    # DB migrations
│   │   │
│   │   └── crud/            # Database operations
│   │       ├── problems.ts
│   │       ├── users.ts
│   │       ├── testcases.ts
│   │       ├── languages.ts
│   │       └── submissions.ts
│   │
│   ├── services/            # Business logic
│   │   └── judge/           # Code execution engine (key MVP component)
│   │       ├── executor.ts   # Code execution
│   │       ├── comparator.ts # Output comparison
│   │       └── languages/    # Language-specific runners
│   │
│   └── utils/               # Utility functions
│
└── shared/                  # Shared code
    ├── types/               # TypeScript type definitions
    └── constants.ts         # Shared constants
```
