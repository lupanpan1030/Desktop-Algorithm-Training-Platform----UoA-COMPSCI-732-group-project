# UI Redesign Plan

This document defines the next-stage UI/UX redesign for the Algo Platform. It is intended to guide implementation across multiple commits without losing the overall product direction.

## Accepted Direction

The redesign will follow these confirmed product decisions:

1. Overall visual direction:
   - Professional desktop tooling
   - Swiss Modernism 2.0
   - Dark-first presentation

2. Navigation structure:
   - Move from the current top-heavy layout toward a left-side navigation rail

3. Product positioning:
   - AI learning workspace
   - Not just a local OJ
   - Not just a CRUD admin panel

4. First redesign target:
   - `DetailPage`

## Core Problems In The Current UI

The current product works, but the interface has major structural issues:

- The product does not feel like one system. `List`, `Detail`, `Problem Admin`, `Language Admin`, and the AI assistant feel visually unrelated.
- The core page, `DetailPage`, is still built like an older OJ layout with features attached over time.
- The desktop layout wastes space in some areas while over-compressing others.
- Management pages work functionally but still feel like generic MUI CRUD pages.
- The AI assistant exists, but it has not yet been fully absorbed into the same design language as the main app.
- Typography, spacing, surfaces, and hierarchy are inconsistent across pages.

## Product Design Goal

The target experience is:

**A desktop-first algorithm learning workspace with integrated AI assistance and curation tooling.**

The UI should feel:

- focused
- technical
- calm
- modern
- intentional
- workspace-like rather than website-like

## Visual System

### Style

Primary style:

- Swiss Modernism 2.0

Secondary influence:

- restrained editorial minimalism

Avoid:

- generic admin-dashboard visuals
- excessive glassmorphism
- loud neon AI aesthetics
- overly playful educational-app styling

### Typography

Recommended pairing:

- Headings: `Space Grotesk`
- Body/UI text: `DM Sans`

Usage intent:

- headings should feel technical and structured
- body text should remain highly readable

### Color Direction

Dark-first palette:

- Background base: `#0F172A`
- Panel base: `#111827`
- Secondary surface: `#151B2C`
- Primary accent: `#3B82F6`
- Secondary accent: `#60A5FA`
- Action highlight: `#F97316`
- Main text: `#F1F5F9`
- Border tone: `#334155`

Rules:

- use blue as the main system accent
- use orange sparingly for primary actions or attention states
- avoid adding multiple competing accent colors

### Layout Rules

- Prefer fixed structural rhythm over loose page-by-page spacing.
- Favor panels, rails, and work areas over floating random blocks.
- Desktop first, but keep mobile fallbacks workable.
- Use strong hierarchy and fewer duplicated labels.

## Global App Shell Redesign

The redesign should begin with a shared shell, not isolated page tweaks.

### Proposed App Shell

- Left navigation rail
- Top page header area
- Main content canvas
- Persistent global AI companion entry

### Navigation Rail

Recommended destinations:

- `Problems`
- `Workspace`
- `Curation`
- `Languages`

Notes:

- `Workspace` maps to the problem-solving/detail workflow
- `Curation` maps to problem admin / testcase admin
- keep labels short
- use icons, but do not let icons dominate

## Page-By-Page Redesign Plan

## 1. Detail Page

This is the most important page and should be redesigned first.

### Goal

Turn it into a true solving workspace.

### Target Structure

- Left: problem statement and metadata
- Center/right: editor, language controls, run/submit, result history
- AI companion remains global, not embedded as a permanent third page column

### Key Improvements

- clearer information hierarchy for title, difficulty, tags, locale, source
- stronger separation between statement and coding workspace
- better integration of run/submit/history states
- cleaner result presentation with diagnostic signals
- starter code and history restore actions should feel native to the editor area

### What To Remove

- stacked legacy-panel feeling
- weak section boundaries
- CSS that makes the page feel like two unrelated halves

## 2. Problem List

### Goal

Make it feel like a browsable problem workspace, not a plain list.

### Target Structure

- Header with page title and context status
- Left filter rail or filter column
- Main problem list area

### Key Improvements

- stronger row/item hierarchy
- visible metadata for difficulty, tags, completion, readiness
- better filtering ergonomics
- more deliberate spacing and scanability

## 3. Problem Admin

### Goal

Reframe it from CRUD admin page into a curation workspace.

### Target Structure

- Left: searchable/filterable problem catalog
- Right: selected problem curation workspace
- Top: compact status summary and actions

### Key Improvements

- selected problem details feel like an editorial/operations panel
- testcase coverage and judge readiness are surfaced clearly
- sample references and starter codes are easier to scan
- filtering becomes part of the workflow, not just generic form controls

## 4. Language Admin

### Goal

Make runtime configuration feel intentional and understandable.

### Key Improvements

- better explanation of what each language config actually controls
- clearer distinction between compile and runtime behavior
- more structured presentation of default language state and suffix/runtime rules

## 5. AI Companion

### Goal

Keep it global, but visually consistent with the rest of the product.

### Direction

- companion-like entry
- floating workspace panel
- fewer large suggestion surfaces
- compact suggestion chips above the input
- stronger visual consistency with main app surfaces

### Rules

- it should feel like part of the workspace
- it should not feel like a support widget pasted on top

## Implementation Strategy

This should not be done as a single giant redesign commit.

## Phase 1

- Establish design tokens
- Rebuild app shell
- Introduce shared layout primitives
- Define shared surfaces, spacing, typography, chip, card, table styles

## Phase 2

- Redesign `DetailPage`
- Update related components used by the editor and result workflow

## Phase 3

- Redesign `ListPage`
- Redesign reusable list/filter presentation

## Phase 4

- Redesign `ProblemAdmin`
- Redesign `LanguageAdmin`

## Phase 5

- Refine AI companion visuals and unify it with the finished shell
- Do consistency pass across the app

## Technical Guidance

- Prefer `tsx` for new or significantly redesigned frontend surfaces.
- Avoid rewriting the entire frontend to TypeScript in one pass.
- Migrate high-value pages while redesigning them.
- Consolidate repeated layout/styling patterns into shared components once the shell is stable.

## Success Criteria

The redesign is successful if:

- the app feels like one coherent product
- the desktop layout feels intentional
- the solving workflow feels central
- curation pages feel like workflows rather than generic admin tables
- the AI companion no longer feels visually separate from the rest of the app

## First Implementation Target

The first implementation pass should start with:

- shared app shell
- then `DetailPage`

That sequence gives the strongest visible improvement and establishes the visual language for the rest of the product.
