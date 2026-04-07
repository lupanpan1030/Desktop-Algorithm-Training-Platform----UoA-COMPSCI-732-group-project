# Global AI Assistant V1 Plan

## Goal

Build a global AI assistant for the desktop app instead of embedding AI into each page.

## Direction Update

This plan has been updated to match the current product decision:

- do not use a drawer-style assistant surface
- keep the assistant as a floating workspace companion
- let the desktop launcher be draggable and snap to the left or right edge
- remember the launcher position between sessions
- do not reserve permanent page space just to "make room" for the assistant
- on small screens, use a full-screen modal sheet rather than a side drawer

The assistant should behave like:

- a global floating entry point
- a lightweight desktop helper /客服入口
- a contextual assistant that can read the current page state
- a guided Q&A layer that can suggest likely questions before the user types

This assistant should work across the whole app:

- problem list
- problem detail
- problem admin
- language admin

V1 should focus on one clear capability:

- understand the current page
- understand likely user intent
- answer questions with page-aware context

V1 should not yet try to:

- autonomously edit database records
- silently rewrite user code
- act as a multi-step agent
- keep long-term memory across many sessions

## Product Shape

### Entry

Use one global floating button mounted at the app shell level.

Recommended placement:

- default to bottom-right on first launch
- draggable on desktop
- snap to the left or right edge after drag
- remember the last desktop position
- always visible above page content
- same component across all routes

Recommended states:

- idle
- draggable
- has suggestions ready
- loading context
- responding
- error / offline

### Assistant Window

When clicked, open a persistent assistant surface.

Recommended V1 form:

- anchored floating panel on desktop
- full-screen modal sheet on small screens

Why this shape:

- it avoids the pasted-on support-widget feeling of a drawer
- it does not force each page to reserve space
- it feels closer to a desktop companion tool
- it keeps the existing Electron shell intact while allowing richer motion and positioning

### Window Sections

The assistant surface should contain these sections:

1. Header

- assistant title
- current page label
- context freshness indicator
- clear conversation button

2. Context Summary

- short machine-generated or app-generated summary of the current page
- examples:
  - "Problem Detail: Two Sum, JavaScript selected, last run failed"
  - "Problem Admin: viewing imported LeetCode problem, 0 hidden testcases"
  - "Language Admin: 6 languages configured, edit mode enabled"

3. Suggested Actions

- 3 to 5 clickable prompts generated from current page context
- examples:
  - "Explain this problem"
  - "Why did my last run fail?"
  - "What should I add before marking this judge-ready?"
  - "Explain these language settings"

4. Conversation Area

- message history for the current session
- user messages
- assistant messages
- structured answer cards when useful

5. Composer

- freeform input
- optional context chips
- send button

## UX Behavior By Page

### Problem List

Primary user intents:

- ask how to choose next problem
- understand filters / statuses
- ask for recommendations

Context sent:

- current route
- locale
- visible problem count
- active filters
- top visible problem titles and metadata

Suggested prompts:

- "Help me choose the next problem"
- "Explain these status filters"
- "Recommend an easy problem to start with"

### Problem Detail

Primary user intents:

- understand the problem
- ask for hints
- explain current code
- explain last run or submit result

Context sent:

- problem title
- description
- difficulty
- tags
- locale
- current editor language
- current editor code
- starter code availability
- latest run result
- latest submission result
- recent submission history summary

Suggested prompts:

- "Explain this problem"
- "Give me a hint without revealing the full answer"
- "Review my current code"
- "Explain my last run result"
- "What testcase should I try next?"

### Problem Admin

Primary user intents:

- understand imported metadata
- decide what to curate next
- ask how to prepare a problem for judging

Context sent:

- selected problem
- judgeReady
- testcase counts
- sample reference availability
- source / locale / tags
- currently selected testcase list summary

Suggested prompts:

- "What is missing before this problem is judge-ready?"
- "Explain the imported sample reference"
- "What testcase types should I add next?"
- "Summarize this problem's curation status"

### Language Admin

Primary user intents:

- understand language fields
- configure compile / run commands
- debug language setup

Context sent:

- visible language list
- selected row or edit dialog values if open
- whether delete/edit mode is enabled

Suggested prompts:

- "Explain these language settings"
- "How should Java be configured here?"
- "What do compile command and run command actually do?"

## Context Architecture

The assistant should not scrape raw DOM as its main source of truth.

Use structured page context providers instead.

### Why

- DOM scraping is fragile when the UI changes
- it sends noisy data to the model
- it makes prompt quality inconsistent
- it is harder to test and reason about

### Recommended Frontend Pattern

Add a global AI context registry.

Conceptual pieces:

- `GlobalAiAssistantProvider`
- `useAiPageContext()`
- `registerAiContext(context)`

Each page contributes a typed context object.

Examples:

```ts
type AiPageContext =
  | ProblemListContext
  | ProblemDetailContext
  | ProblemAdminContext
  | LanguageAdminContext;
```

Each page should expose:

- page kind
- route
- title
- summary
- structured data relevant to that page
- suggested prompts

### Best Integration Point In This Repo

Mount the global assistant at the app shell level in [App.jsx](/Users/ethan/Documents/GitHub/group-project-delightful-dogs/src/frontend/App.jsx).

Current structure already has a stable root:

- `ProblemLocaleProvider`
- `HashRouter`
- `ThemeProvider`
- `NavBar`
- `Routes`

This is a good place to add:

- `GlobalAiAssistantProvider`
- `GlobalAiAssistantLauncher`
- `GlobalAiAssistantShell`
- `GlobalAiAssistantSurface`

## Backend Architecture

### V1 API

Recommended initial endpoints:

- `POST /ai/respond`
- optional later: `POST /ai/suggest`

For V1, one endpoint is enough if it supports both:

- explicit user message
- optional "generate suggestions from context"

### Request Shape

```ts
type AiRespondRequest = {
  pageContext: AiPageContext;
  userMessage?: string;
  action?: "suggest" | "answer";
  conversation?: AiConversationTurn[];
};
```

### Response Shape

```ts
type AiRespondResponse = {
  answer: string;
  suggestions: string[];
  inferredIntent:
    | "explain_problem"
    | "give_hint"
    | "review_code"
    | "explain_result"
    | "page_help"
    | "curation_help"
    | "language_help"
    | "general_question";
  sourcesUsed: string[];
};
```

### Backend Modules

Recommended file layout:

- `src/backend/api/ai/ai-controller.ts`
- `src/backend/api/ai/ai-service.ts`
- `src/backend/services/ai/context-builder.ts`
- `src/backend/services/ai/intent-classifier.ts`
- `src/backend/services/ai/prompts/`
- `src/backend/services/ai/providers/`

### Provider Layer

Use a provider abstraction immediately.

Recommended interface:

```ts
interface AiProvider {
  respond(input: ProviderInput): Promise<ProviderOutput>;
}
```

Why:

- lets you start with OpenAI
- keeps room for local or alternative providers later
- avoids tying business logic directly to one SDK

## Intent Strategy

V1 should not be a pure freeform chatbot.

It should infer intent, then route to a narrower prompt template.

Recommended V1 intents:

- explain_problem
- give_hint
- review_code
- explain_result
- page_help
- curation_help
- language_help
- general_question

### Suggested Routing Rules

If current page is problem detail:

- presence of code + "why", "error", "failed" => `explain_result` or `review_code`
- "hint" => `give_hint`
- "explain problem" => `explain_problem`

If current page is admin:

- "judgeReady", "testcase", "sample reference" => `curation_help`

If current page is language admin:

- "compile", "run command", "Java", "C++" => `language_help`

## Conversation Scope

Recommended V1 memory policy:

- session-local conversation only
- resettable by user
- no long-term persistence required in V1

Why:

- much easier to reason about
- avoids schema work before core interaction is proven useful
- reduces privacy and context bloat risk

Optional V1.5:

- persist the last conversation per route

## Safety and Guardrails

V1 should explicitly separate:

- explanation
- hinting
- code review
- operational guidance

Guardrails to include:

- do not silently mutate project data
- do not execute shell commands from user chat
- do not claim hidden testcases exist when they do not
- when no reliable page context exists, say so explicitly
- if current page is not fully loaded, answer conservatively

## Data Sources In This Repo

Current codebase already exposes most of the data needed.

Best V1 sources:

- [useApi.ts](/Users/ethan/Documents/GitHub/group-project-delightful-dogs/src/frontend/hooks/useApi.ts)
- [DetailPage.jsx](/Users/ethan/Documents/GitHub/group-project-delightful-dogs/src/frontend/pages/DetailPage.jsx)
- [ProblemAdmin.tsx](/Users/ethan/Documents/GitHub/group-project-delightful-dogs/src/frontend/pages/ProblemAdmin.tsx)
- [LanguageAdmin.tsx](/Users/ethan/Documents/GitHub/group-project-delightful-dogs/src/frontend/pages/LanguageAdmin.tsx)
- [Run&SubmitButton.tsx](/Users/ethan/Documents/GitHub/group-project-delightful-dogs/src/frontend/components/Run&SubmitButton.tsx)

This means V1 does not require DOM scraping to be useful.

## V1 Implementation Order

### Phase 1: Product Skeleton

- add global floating launcher
- add assistant floating shell
- add global conversation state
- add page-context registry
- hardcode page summaries and suggested prompts

Outcome:

- no real AI yet
- but full interaction model is visible

### Phase 2: Problem Detail Context

- wire problem detail structured context
- wire current code
- wire last run / submit result
- support the four highest-value actions on problem detail

Outcome:

- assistant is genuinely useful on the core study page

### Phase 3: Problem Admin Context

- wire curation metadata
- support curation explanations and next-step guidance

### Phase 4: Language Admin and Problem List Context

- wire remaining pages
- improve suggestion quality and page-help coverage

### Phase 5: Persistence and Smarter Suggestions

- optional conversation persistence
- optional proactive suggestion refresh
- optional recent-session recall

## Current Status

Implemented:

- global assistant provider mounted at app-shell level
- route-aware page context registration for problem list, problem detail, problem admin, and language admin
- floating launcher available from every route
- desktop floating assistant panel
- desktop draggable launcher with left/right edge snapping and position memory
- launcher placement preferences for side locking, remembered height, and top/middle/bottom docking
- launcher reset action and context freshness indicator
- no dedicated page-space reservation for the desktop launcher
- mobile full-screen modal sheet under the non-drawer direction
- route-scoped conversation persistence
- multi-route recent-thread management UI
- context reliability status surface
- structured assistant answer cards in the conversation surface
- page-aware suggestions, conversation history, and composer
- packaged-runtime assistant settings page for provider, model, and API key configuration
- local persisted AI runtime settings so packaged builds no longer depend on `.env` alone
- system-keychain-backed API key storage with migration away from legacy local-file secrets
- assistant settings connection-test flow for preview and live OpenAI validation

Remaining or worth improving:

- stronger provenance/source explanation beyond current route facts and summary

## UI Direction

The assistant should feel intentionally separate from the main content, not like another admin panel.

Recommended direction:

- compact draggable launcher
- anchored floating panel with slightly elevated visual language
- clear contrast against page content
- subtle motion on open/close
- action chips for suggestions
- visible context summary at top
- no permanent empty content band reserved for the launcher

Do not make it:

- a giant full-height page replacement
- a noisy mascot animation
- a generic chatbot clone with no page awareness

## Recommended V1 Success Criteria

The first version is good enough when:

- the assistant is reachable from every route
- it knows which page it is on
- it can summarize the current page context correctly
- it can suggest useful prompts for that page
- on problem detail, it can explain the problem, hint, review code, and explain the latest result

## Open Decisions For Confirmation

1. Entry style:

- floating round button only
- button plus expandable label
- more mascot-like assistant bubble

2. Assistant surface:

- anchored floating panel
- centered modal
- detachable small window feeling

3. AI provider for V1:

- OpenAI API
- local model
- provider abstraction first, provider choice later

4. Answer style:

- concise tutor
- conversational helper
- more formal teaching assistant

5. Code help policy:

- hints first, avoid full solutions by default
- allow full solutions when explicitly requested

6. Suggestion behavior:

- always auto-generate suggestions when page changes
- only generate after the assistant is opened

7. Scope of V1:

- only problem detail first
- all major pages from the start

## Recommended Defaults

If no further decision is made, the best implementation defaults are:

- floating draggable button plus short hover label
- anchored floating panel on desktop, full-screen modal sheet on small screens
- provider abstraction first
- concise tutor tone
- hints first, full solutions only on explicit request
- suggestions generated when the assistant is opened
- real page-aware support first on problem detail, lighter support on the other pages
