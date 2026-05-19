# AI Development Workflow

This project uses a lightweight AI work protocol: define the boundary first, then let the agent work in small slices, and finish with evidence. The goal is to keep AI-assisted changes aligned with the current local-first algorithm platform instead of drifting into speculative product work.

This is not a full OpenSpec setup. If the project later adopts a formal spec system, this document should become the bridge into that system.

## Core Loop

Use this loop for non-trivial work:

```text
Intake -> Context -> Scope -> Spec / Plan -> Implement -> Verify -> Commit -> Retro
```

## 1. Intake

Classify the request before editing files.

Direct implementation is acceptable for:

- small bug fixes
- tests for existing behavior
- narrow documentation updates
- refactors that do not change behavior or public contracts

A short proposal or plan is required for:

- new product capabilities
- architecture or runtime changes
- security-sensitive behavior
- data model or migration changes
- API route, DTO, or schema changes
- judge execution semantics
- release, installer, or packaging workflows
- ambiguous requests where scope can easily expand

## 2. Context

Read the local project truth before planning:

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/STATUS.md`
- `docs/ROADMAP.md`
- the relevant file area under `src/`
- existing tests for the behavior being changed

Always check `git status --short --branch` before making changes so unrelated work is not accidentally overwritten or bundled.

## 3. Scope

Write or state a compact scope before implementation:

- goal
- non-goals
- affected modules
- user-visible behavior
- risks
- acceptance criteria
- verification plan

Keep the first implementation slice small enough to review in one pass.

## 4. Spec / Plan

For work that needs a proposal, place the plan under `docs/plans/` unless another docs location is clearly better.

A useful plan should cover:

- why this is needed now
- what will change
- what will not change
- implementation steps
- data, API, security, and packaging impact
- verification commands and manual checks
- rollback or fallback notes when relevant

Do not start broad product, architecture, security, or data changes until the plan is accepted or the user has explicitly told the agent to proceed.

## 5. Implement

Implementation rules:

- make small, reviewable edits
- preserve the local-first desktop boundary
- keep AI features optional and non-blocking when possible
- update tests with behavior changes
- update docs when product truth changes
- regenerate TSOA outputs when API routes or schemas change
- do not move explanatory material into the repository root

For AI-assisted product features, the baseline app should remain usable without a live AI provider.

## 6. Verify

Use focused verification first, then repo-level checks as needed.

Before closing behavior changes, run:

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

For API contract changes, regenerate TSOA output and include the generated files:

```bash
npx tsoa spec-and-routes
```

For documentation-only changes, at minimum run:

```bash
git diff --check
```

Then inspect the diff and report the actual verification result. If a check was skipped, say why.

## 7. Commit / Review

Keep unrelated work separate. If the user asks for categorized commits, split changes by intent, for example:

- local API hardening
- judge reliability
- AI workflow docs
- UI cleanup
- tests

Before staging or committing, summarize the buckets and make sure untracked or unrelated files are understood.

## 8. Retro

After substantial work, update the docs that represent current truth:

- `docs/STATUS.md` for verification state, support matrix, and known risks
- `docs/ROADMAP.md` for priorities and remaining work
- `docs/ARCHITECTURE.md` for runtime boundaries and data flow
- the relevant plan under `docs/plans/` if the plan outcome changed

## Debugging Path

For bugs, use evidence before changing code:

1. capture the symptom
2. reproduce it or identify the observed failing path
3. trace the relevant code path
4. compare against a working example or test
5. state the root-cause hypothesis
6. patch the root cause
7. verify with the narrowest useful test, then broader checks if risk warrants it

Avoid speculative fixes that only silence the symptom.

## Security-Sensitive Path

Security-sensitive changes need explicit trust-boundary thinking:

- identify the asset being protected
- identify the caller or attacker capability
- keep secrets out of logs, docs, tests, and committed fixtures
- add regression tests for the protected boundary when practical
- prefer deny-by-default local behavior for internal APIs

Examples in this project include local API access, AI credential handling, imported problem data, judge execution, and packaged application behavior.

## Judge Path

Judge changes need extra care because they execute untrusted or semi-trusted code locally.

Check for:

- timeout behavior
- memory limit behavior
- spawned child process cleanup
- stdout and stderr limits
- temporary file cleanup
- platform-specific behavior on macOS, Windows, and Linux

Tests should include adversarial or failure-path cases when changing execution semantics.

## AI Feature Path

AI-assisted workflows should stay optional and local-first:

- the core problem, admin, and judge flows should work without a live provider
- provider settings and credentials should stay in the intended local storage boundary
- AI output should be treated as a draft or assistant suggestion unless the user confirms mutation
- avoid hidden hosted dependencies unless the user explicitly accepts them

## Command-Style Prompts

These are local working prompts for agents, not application slash commands:

- `/doctor`: inspect environment, scripts, generated files, and obvious runtime blockers without changing files
- `/diff`: summarize the current worktree by intent and risk
- `/verify`: run the narrowest meaningful checks and report evidence
- `/plan`: write a compact implementation plan before broad changes
- `/review`: review changed code for bugs, regressions, and missing tests

Only turn these into product features after a separate proposal.
