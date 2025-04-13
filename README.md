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

## Backend Server

### Run Backend Server

```bash
npm run dev
```

### Regenerate Backend Routes.ts

```bash
npm npx tsoa routes
```

### Regenerate OpenApi Swagger.json

Swagger UI debug page: `localhost:6785/docs`

```bash
npm npx tsoa spec
```

### Run Unit Tests

```bash
npm test
```

## DB initialization

Run the following commands

- Create Tables

  ```bash
  npx prisma migrate dev --schema=src/backend/db/prisma/schema.prisma
  ```

- Insert Predefined Data
  -- First-time Database Setup
  `bash
    npx ts-node src/backend/db/seeds/init-db_first.ts
    `
- Insert Predefined Data
  -- Reset and Reinitialize the Database
  `bash
    npx ts-node src/backend/db/seeds/init-db+drop.ts
    `

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
│   │       ├── testcases.ts
│   │       ├── languages.ts
│   │       └── submissions.ts
│   │
│   ├── services/            # Business logic
│   │   └── judge/           # Code execution engine (key MVP component)
│   │       └── executor.ts   # Code execution
│   │
│   └── utils/               # Utility functions
│
├── shared/                  # Shared code
│   ├── types/               # TypeScript type definitions
│   └── constants.ts         # Shared constants
│
└── tests/                 # Test suite
    ├── unit/               # Unit tests
    └── integration/        # Integration tests
```

---

### RESTful API Design for Delightful Dogs (Revised)

---

#### 1. CRUD Endpoints

---

---

**Problems**

| Method | Path             | Description                    | Request Body (Types & Validation)                                                                                                                                                     | Response Format (Types & Status Codes)                                                                                                                                                                              |
| ------ | ---------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/problems`      | List all problems              | _None_                                                                                                                                                                                | **200 OK:** Array of problem summaries<br>`Array<{ problemId: number, title: string, difficulty: "EASY" \| "MEDIUM" \| "HARD", tags: string[] }>`                                                                   |
| GET    | `/problems/{id}` | Retrieve problem details by ID | _None_                                                                                                                                                                                | **200 OK:** Detailed problem object<br>`{ problemId: number, title: string, description: string, difficulty: enum, tags: string[], createdAt: ISO8601 }`<br>**404 Not Found:** `{ "message": "Problem not found" }` |
| POST   | `/problems`      | Create a new problem           | **Required:**<br>`{ title: string, description: string, difficulty: enum, tags: string[] }`<br>• `title` must be 5–100 characters<br>• `description` must be 10–2000 characters       | **201 Created:** Detailed problem object (same as GET details)<br>**422 Validation Failed:** `{ "message": "Validation Failed", "details": { ... } }`                                                               |
| PUT    | `/problems/{id}` | Update an existing problem     | **Optional:**<br>`{ title?: string, description?: string, difficulty?: enum, tags?: string[] }`<br>If provided, `title` must be 5–100 characters and `description` 10–2000 characters | **200 OK:** Updated detailed problem object<br>**404 Not Found:** `{ "message": "Problem not found" }`<br>**422 Validation Failed:** `{ "message": "Validation Failed", "details": { ... } }`                       |
| DELETE | `/problems/{id}` | Delete a problem by ID         | _None_                                                                                                                                                                                | **204 No Content:** _No body_                                                                                                                                                                                       |

---

**Programming Languages**
| Method | Path | Description | Request Body (Types) | Response Format (Types) |
|--------|------|-------------|-----------------------|--------------------------|
| `GET` | `/languages` | List languages | - | `Array<{languageId: number, name: string, compilerCmd: string, runtimeCmd: string}>` |
| `POST` | `/languages` | Add language | `{name: string, compilerCmd: string, runtimeCmd: string}` | `201` + created language object |
| `PUT` | `/languages/{id}` | Update language | `{name?: string, compilerCmd?: string, runtimeCmd?: string}` | `200` + updated language object |
| `DELETE` | `/languages/{id}` | Remove language | - | `204` |

---

**Test Cases**
| Method | Path | Description | Request Body (Types) | Response Format (Types) |
|--------|------|-------------|-----------------------|--------------------------|
| `GET` | `/problems/{id}/testcases` | List test cases | - | **200 OK:** `Array<{testcaseId: number, input: string, expectedOutput: string, timeLimit: number, memoryLimit: number}>` <br>**404 Not Found:** `{ "message": "Problem not found" }` |
| `POST` | `/problems/{id}/testcases` | Add test case | `{input: string, expectedOutput: string, timeLimit: number, memoryLimit: number}` | **201 Created:**  Detailed testcase object `{testcaseId: number, input: string, expectedOutput: string, timeLimit: number, memoryLimit: number}` <br>**404 Not Found:**`{ "message": "Problem not found" }`<br>**422 Validation Failed:** `{ "message": "Validation Failed", "details": { ... } }`    |
|`DELETE`|`/problems/{id}/testcases/{id}`| Delete test case | - |**204 No Content:** _No body_ <br>**404 Not Found:**`{ "message": "Problem not found" }` |

---

**Submissions**
| Method | Path | Description | Request Body (Types) | Response Format (Types) |
|--------|------|-------------|-----------------------|--------------------------|
| `GET` | `/submissions` | List submissions | - | `{ Array<submissionId: number, code: string, languageId: number, status: string, submittedAt: ISO8601> }` |
| `GET` | `/submissions/{id}` | Get submission | - | `{ submissionId: number, code: string, languageId: number, status: string, submittedAt: ISO8601, results: Array<[success: boolean, executionTime: number, result: string]> }` |

---

#### 2. Execution Endpoints

| Method | Path                     | Description                                                           | Request Body                                 | Response Format                                                                                                                       |
| ------ | ------------------------ | --------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/problems/{id}/run`     | Execute code against a subset of test cases (e.g. the first 3 cases)    | `{ code: string, languageId: number }`       | `{ status: string, results: Array<[success: boolean, executionTime: number, result: string]> }`                                         |
| `POST` | `/problems/{id}/submit`  | Submit code for full evaluation using the judge engine                | `{ code: string, languageId: number }`       | `{ submissionId: number, overallStatus: string, results: Array<[success: boolean, executionTime: number, result: string]> }`              |
