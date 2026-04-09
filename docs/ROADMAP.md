# Secondary Development Roadmap

This roadmap is for the personal redevelopment line maintained by Chen Lu (`lupanpan`).

## P0: Stabilise the Practice Loop

Goal: make the core "read problem -> write code -> run -> submit -> review result" flow reliable and pleasant.

Current status:
- foundational runtime/database fixes are complete
- submission history and result review are in place
- per-language draft persistence and starter-code recovery are now stabilized

Tasks:
- tighten judge diagnostics and failure messages
- improve result empty states and edge-case feedback
- continue polishing the detail-page workflow around imported metadata and history

## P1: Complete Problem Administration

Goal: make the project maintainable as a real local training platform, not just a demo dataset.

Current status:
- problem CRUD and testcase CRUD are available in the desktop UI
- imported metadata, tags, starter code, and locale-aware filters are now visible in Problem Admin

Tasks:
- support faster testcase authoring from imported sample references
- add safer preview/edit flows for examples, hidden tests, and metadata
- add form-level validation and stronger success/error feedback
- add bulk curation helpers for unfinished imported problems

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

1. Judge execution hardening and better diagnostics.
2. Data portability and upgrade-safe persistence.
3. Faster imported-problem curation flows.
4. Broader refactors, CI, and type cleanup.
5. Evaluate the next major product direction, including AI-assisted workflows.
