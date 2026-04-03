import { AiPageContextDto, AiSuggestionDto } from "../../../api/ai/ai";

export const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
  "problem-list": [
    "Help me choose the next problem",
    "Explain these filters",
    "Recommend a good problem to start with",
  ],
  "problem-detail": [
    "Explain this problem",
    "Give me a hint without revealing the full answer",
    "Review my current code",
    "Explain my latest result",
  ],
  "problem-admin": [
    "What is missing before this problem is judge-ready?",
    "Explain this imported metadata",
    "What testcase should I add next?",
  ],
  "language-admin": [
    "Explain these language settings",
    "What do compile and run commands do?",
    "How should Java be configured here?",
  ],
};

export function buildDefaultSuggestions(
  pageContext: AiPageContextDto
): AiSuggestionDto[] {
  const prompts =
    pageContext.suggestedPrompts?.filter(Boolean) ??
    DEFAULT_SUGGESTIONS[pageContext.pageKind] ??
    ["Explain this page", "What should I do next?"];

  return prompts.slice(0, 5).map((prompt, index) => ({
    id: `${pageContext.pageKind}-${index}`,
    label: prompt,
    prompt,
  }));
}

export function buildDefaultSources(pageContext: AiPageContextDto): string[] {
  return [
    pageContext.pageTitle,
    pageContext.summary,
    ...(pageContext.facts ?? []).slice(0, 3).map((fact) => fact.label),
  ];
}
