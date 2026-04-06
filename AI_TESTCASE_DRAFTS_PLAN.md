# AI Testcase Drafts Plan

## Goal

Add an AI-assisted testcase drafting workflow for curated problems.

This is the recommended "B" path:

- AI proposes testcase drafts
- the curator reviews them
- accepted drafts are saved through the existing testcase APIs
- `judge_ready` is still controlled by actual saved testcase coverage, not by AI suggestions alone

## Why This Path First

This repository already has the right base for a draft-first workflow:

- `Problem Admin` already exposes problem metadata, sample reference, starter code, and testcase editing
- the AI assistant already accepts structured page context and returns structured JSON
- testcase persistence already exists and updates `judge_ready`

This means we can add useful AI help without pretending the model is an oracle.

## Non-Goals For V1

Do not make AI-generated testcase drafts authoritative by default.

V1 should not:

- auto-save drafts into the database without review
- auto-mark a problem as judge-ready just because AI generated something
- invent hidden tests and silently trust their expected output
- replace a future reference-solution / oracle pipeline

## Product Shape

### Entry Point

Add one action inside `Problem Admin`:

- `Generate test drafts`

Recommended placement:

- inside the `Testcase Coverage` card
- next to `Add testcase`
- enabled only when a problem is selected

### Draft Review Surface

After generation, show a draft review tray below the testcase controls.

Each draft should show:

- sample or hidden
- input
- expected output
- rationale
- confidence
- risk flags

Each draft should support:

- accept
- edit before accept
- reject

Recommended batch actions:

- accept all high-confidence drafts
- reject all
- regenerate

## User Flow

1. Curator opens a problem in `Problem Admin`
2. Curator clicks `Generate test drafts`
3. Frontend sends the selected problem context to a new backend endpoint
4. AI returns testcase drafts
5. UI renders them as reviewable drafts
6. Curator accepts or edits selected drafts
7. Accepted drafts are persisted via the existing testcase endpoints
8. Existing readiness logic continues to use saved testcase count

## Context Sent To AI

Use the currently available curated problem context.

Send:

- problem title
- localized description
- difficulty
- tags
- source and slug
- imported sample reference, if present
- current testcase summary
- existing testcase kinds and counts
- starter code language names

Do not send raw database state that is irrelevant to testcase authoring.

## Suggested Draft Schema

Use a separate draft DTO rather than overloading the persisted testcase shape.

```ts
type AiTestcaseDraftDto = {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  rationale: string;
  confidence: "low" | "medium" | "high";
  riskFlags: string[];
  sourceHints: string[];
};
```

Notes:

- `expectedOutput` may still be wrong, even when present
- `riskFlags` is important because it lets the UI say "review carefully"
- `sourceHints` can tell the curator whether a draft came from the prompt, sample reference, or inferred edge-case reasoning

## Backend API

Add a new AI drafting endpoint instead of reusing the generic chat endpoint.

Recommended endpoint:

```txt
POST /problems/{problemId}/ai/test-drafts
```

Request:

```ts
type GenerateAiTestDraftsRequestDto = {
  locale?: string;
  targetCount?: number;
  includeSampleDrafts?: boolean;
  includeHiddenDrafts?: boolean;
};
```

Response:

```ts
type GenerateAiTestDraftsResponseDto = {
  problemId: number;
  provider: string;
  drafts: AiTestcaseDraftDto[];
  warnings: string[];
};
```

## Backend Service Shape

Add a dedicated service instead of embedding this inside the existing chat response path.

Recommended components:

- `src/backend/api/problem-ai/problem-ai-controller.ts`
- `src/backend/api/problem-ai/problem-ai-service.ts`
- `src/backend/services/ai/problem-test-draft-provider.ts`

Service responsibilities:

- load problem details
- load testcase summary
- build a drafting prompt
- call the active AI provider
- parse strict JSON
- normalize draft count and fields
- attach warnings when parsing confidence is low

## Prompting Strategy

The prompt should ask the model for testcase drafts, not general tutoring prose.

Required instructions:

- return JSON only
- produce exact candidate inputs and outputs
- separate sample-facing cases from hidden edge cases
- explain why each case is useful
- mark uncertain cases as low confidence
- never claim certainty when output derivation is ambiguous

If the model cannot derive a trustworthy expected output, it should still return a draft with:

- low confidence
- a risk flag such as `requires_manual_output_review`

## Frontend Integration

Add draft state only inside `Problem Admin` first.

Recommended local state:

```ts
type TestDraftReviewState = {
  loading: boolean;
  error: string | null;
  drafts: AiTestcaseDraftDto[];
};
```

Recommended UI sections:

1. Draft action row

- generate
- regenerate
- accept high-confidence
- clear drafts

2. Draft list

- card per draft
- editable input and expected output
- confidence chip
- rationale
- accept / reject actions

3. Review warning

- clearly state that AI drafts are suggestions, not ground truth

## Guardrails

V1 should add explicit safety rails:

- cap generation count, for example `max 8`
- never auto-save generated drafts
- never auto-flip `judge_ready`
- require manual review for low-confidence drafts
- show warnings when no existing testcase coverage exists

## Relationship To C

This plan deliberately stops short of the full oracle path.

Future `C-lite` should look like:

- add one trusted reference solution per curated problem
- AI proposes interesting inputs
- reference solution computes outputs
- only oracle-verified drafts become high-trust testcases

That future path is stronger, but it requires new storage, execution, and validation infrastructure.

## Recommended Rollout

## Current Status

Implemented so far:

- dedicated `POST /problems/{problemId}/ai/test-drafts` endpoint
- draft review panel inside `Problem Admin`
- editable draft input / expected output / sample toggle
- save single draft into the existing testcase APIs
- save all high-confidence drafts
- generation controls for draft count, sample drafts, and hidden drafts
- batch selection, save selected, and discard selected
- clearer provenance and review-risk labels in the UI

Still pending for later:

- richer provenance explanations in the backend payload
- analytics around accepted vs rejected drafts
- optional oracle-backed `C-lite` verification for selected problems

### Phase 1

- add doc and DTOs
- add endpoint shell
- wire `Generate test drafts` button

### Phase 2

- implement OpenAI-backed testcase draft generation
- show drafts in `Problem Admin`
- allow accept / reject / edit

### Phase 3

- add provenance and confidence display
- add batch actions
- add analytics / logs around accepted vs rejected drafts

### Phase 4

- optionally add `C-lite` oracle verification for selected problems

## Success Criteria

This is good enough when:

- curators can generate testcase drafts from `Problem Admin`
- drafts are clearly labeled as suggestions
- accepted drafts are easy to review and save
- the workflow reduces manual testcase authoring time
- the system never treats AI output as trusted judge truth by default
