# Judge Sandbox Hardening Plan

## Goal

Make the local judge safer and easier to diagnose without pretending it is a complete security sandbox.

The current reliability pass improved process-tree cleanup and process-group memory sampling. The next pass should harden the remaining execution boundary around diagnostics, output limits, temporary files, and platform-specific behavior.

## Current State

The judge currently supports:

- compile and interpret execution modes
- testcase-level timeout handling
- best-effort process-tree cleanup
- best-effort process-group memory sampling
- persisted submission and testcase results

The app remains a local desktop tool. The judge runs user-provided or imported problem code on the user's own machine, so the boundary should be explicit and conservative.

## Non-Goals

This phase should not:

- claim to provide a fully secure container sandbox
- add Docker, VM, or network-isolation requirements to the MVP path
- redesign the whole judge pipeline
- change the submission database schema unless a concrete diagnostic field requires it
- silently download runtimes or compilers
- break the existing language preset model

## Risks To Address

### 1. Diagnostics Are Too Thin

When execution fails, the user needs to know whether the failure came from:

- compile command failure
- runtime command failure
- timeout
- memory limit
- stdout or stderr overflow
- missing runtime
- internal judge error

Current error strings are useful but not structured enough for deeper troubleshooting.

### 2. Output Can Grow Too Large

User code can produce very large stdout or stderr output. The judge should cap captured output before it becomes a memory or UI problem.

### 3. Temporary Files Need Stronger Guarantees

Each run should have a clear isolated temp directory lifecycle:

- create per-run directory
- write source and executable files inside it
- clean up after success, failure, timeout, and memory kill
- preserve artifacts only when a debug flag is explicitly enabled

### 4. Platform Behavior Needs Explicit Coverage

The previous process-tree cleanup tests are skipped on Windows. The next pass should document and test platform differences more directly.

### 5. Execution Boundary Is Not Fully Communicated

The UI and docs should avoid implying that arbitrary code is safely sandboxed. The product should call this a local judge, not a secure remote execution environment.

## Phase 1 Scope

Phase 1 should stay small and reviewable.

Implement:

- stdout and stderr byte caps
- structured internal failure reason for execution results
- clearer timeout, memory, compile, runtime, and output-limit messages
- temp directory cleanup assertions in tests
- a dev-only flag to preserve judge temp directories for debugging
- docs update describing the local execution boundary

Do not implement:

- Docker sandboxing
- seccomp, chroot, or macOS sandbox profiles
- network isolation
- per-language resource policies beyond current timeout and memory options
- UI redesign for submissions

## Proposed Implementation

### 1. Add Output Capture Limits

Add constants in the judge executor:

```ts
const MAX_CAPTURED_OUTPUT_BYTES = 64 * 1024;
```

Apply the limit independently to stdout and stderr.

When a stream exceeds the cap:

- stop appending more data
- mark the stream as truncated
- include a short suffix such as `[output truncated]`
- keep the process running unless another limit requires killing it

If output flooding itself should terminate the process, make that a separate follow-up decision.

### 2. Normalize Failure Reasons

Introduce a narrow internal union, for example:

```ts
type JudgeFailureReason =
  | "compile_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "internal_error";
```

Use it inside the judge service first. Only expose it through API DTOs if the UI needs structured handling.

### 3. Strengthen Temp Directory Lifecycle

Wrap each testcase execution with cleanup that runs for:

- compile failure
- runtime failure
- timeout
- memory kill
- unexpected exceptions

Support:

```bash
JUDGE_KEEP_TEMP=1
```

when a developer needs to inspect generated files.

### 4. Add Focused Tests

Add backend unit tests for:

- stdout truncation
- stderr truncation
- timeout cleanup still removes temp files
- compile failure cleanup removes temp files
- runtime failure cleanup removes temp files
- `JUDGE_KEEP_TEMP=1` preserves temp files

Keep platform-specific process-tree tests guarded when needed, but make the skip reason clear.

### 5. Update Docs

Update:

- `docs/ARCHITECTURE.md`
- `docs/STATUS.md`
- `docs/development.md`

Docs should say:

- the judge is local execution, not a complete security sandbox
- resource limits are best-effort local protections
- imported or untrusted code should still be treated carefully

## Acceptance Criteria

Phase 1 is complete when:

- excessive stdout and stderr are capped deterministically
- capped output is visible as truncated, not silently lost
- judge temp directories are cleaned after success and failure paths
- developers can preserve temp directories with `JUDGE_KEEP_TEMP=1`
- tests cover timeout, memory, compile failure, runtime failure, output flood, and cleanup paths
- docs accurately describe the local execution boundary

## Verification Plan

Run:

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

Manual smoke check:

- start the desktop app
- run a passing testcase
- run a timeout testcase
- run a code snippet that prints excessive output
- confirm the UI remains responsive

## Follow-Up Phases

### Phase 2: Better User-Facing Diagnostics

Add clearer submission result cards for:

- compile error
- runtime error
- timeout
- memory limit
- output truncation

This can stay frontend-only if Phase 1 exposes enough structured data.

### Phase 3: Optional Stronger Isolation

Evaluate optional sandbox approaches only after Phase 1 and Phase 2:

- per-language command allowlists
- disabled network by convention or wrapper
- Docker-based judge mode
- macOS sandbox profile experiments

This should be opt-in and documented, not a hidden MVP dependency.
