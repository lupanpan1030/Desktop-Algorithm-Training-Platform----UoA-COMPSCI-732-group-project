# Secondary Development Roadmap

This roadmap is for the personal redevelopment line maintained by Chen Lu (`lupanpan`).

## P0: Stabilise the Practice Loop

Goal: make the core "read problem -> write code -> run -> submit -> review result" flow reliable and pleasant.

Current status:
- foundational runtime/database fixes are complete
- submission history UI is now the first active product-facing upgrade

Tasks:
- surface submission history and per-attempt result review in the detail page
- reduce noisy result-state coupling in the current editor/result pane
- improve empty states and failure messages for run/submit/history flows
- trim oversized payloads from submission list endpoints

## P1: Complete Problem Administration

Goal: make the project maintainable as a real local training platform, not just a demo dataset.

Tasks:
- add problem CRUD screens beyond the current language admin flow
- add testcase CRUD and validation in the desktop UI
- support safer preview/edit flows for examples, hidden tests, and metadata
- add form-level validation and stronger success/error feedback

## P2: Harden the Judge Pipeline

Goal: turn the executor from "works locally" into something predictable enough for long-term use.

Tasks:
- add stronger resource accounting and clearer compile/runtime error reporting
- isolate language execution rules into maintainable presets
- introduce a controlled working-directory and artifact cleanup strategy per run
- evaluate queueing or cancellation support for long-running executions

## P3: Improve Data Portability

Goal: make the local desktop app safer to upgrade and easier to carry across machines.

Tasks:
- add explicit import/export for SQLite data
- add repeatable external-dataset importers for personal local use
- add lightweight backup/restore support before destructive admin actions
- separate seed data, user data, and generated package data more clearly
- define a migration strategy for future schema changes

## P4: Raise Engineering Quality

Goal: make future feature work cheaper.

Tasks:
- continue converting implicit frontend contracts into typed API models
- expand frontend coverage around detail-page workflows and admin flows
- add CI for lint, tests, and TSOA generation checks
- reduce mixed JS/TS inconsistencies in shared UI state and hooks

## Immediate Priority Order

1. Submission history and result review on the problem detail page.
2. Problem/testcase admin workflow in the desktop UI.
3. Judge execution hardening and better diagnostics.
4. Data portability and upgrade-safe persistence.
5. Broader refactors, CI, and type cleanup.
