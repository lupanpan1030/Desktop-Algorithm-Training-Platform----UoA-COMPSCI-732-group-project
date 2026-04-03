import { AiPageContextDto, AiSuggestionDto } from "../../../api/ai/ai";
import { AiProvider, AiProviderInput, AiProviderOutput } from "./ai-provider";

type InferredIntent =
  | "explain_problem"
  | "give_hint"
  | "review_code"
  | "explain_result"
  | "page_help"
  | "curation_help"
  | "language_help"
  | "general_question";

const DEFAULT_SUGGESTIONS: Record<string, string[]> = {
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

function inferIntent(message: string | undefined, pageContext: AiPageContextDto): InferredIntent {
  const normalizedMessage = message?.trim().toLowerCase() ?? "";
  const pageKind = pageContext.pageKind;

  if (!normalizedMessage) {
    if (pageKind === "problem-detail") {
      return "explain_problem";
    }
    if (pageKind === "problem-admin") {
      return "curation_help";
    }
    if (pageKind === "language-admin") {
      return "language_help";
    }
    return "page_help";
  }

  if (normalizedMessage.includes("hint")) {
    return "give_hint";
  }
  if (
    ((normalizedMessage.includes("review") ||
      normalizedMessage.includes("check") ||
      normalizedMessage.includes("look at")) &&
      normalizedMessage.includes("code")) ||
    normalizedMessage.includes("review my current code")
  ) {
    return "review_code";
  }
  if (
    normalizedMessage.includes("result") ||
    normalizedMessage.includes("error") ||
    normalizedMessage.includes("failed") ||
    normalizedMessage.includes("compile") ||
    normalizedMessage.includes("runtime")
  ) {
    return "explain_result";
  }
  if (normalizedMessage.includes("judge") || normalizedMessage.includes("testcase")) {
    return "curation_help";
  }
  if (
    normalizedMessage.includes("language") ||
    normalizedMessage.includes("compile command") ||
    normalizedMessage.includes("run command") ||
    normalizedMessage.includes("java")
  ) {
    return "language_help";
  }
  if (
    normalizedMessage.includes("explain problem") ||
    normalizedMessage.includes("what is this problem") ||
    normalizedMessage.includes("explain this")
  ) {
    return "explain_problem";
  }

  if (pageKind === "problem-detail") {
    return "general_question";
  }
  if (pageKind === "problem-admin") {
    return "curation_help";
  }
  if (pageKind === "language-admin") {
    return "language_help";
  }
  return "page_help";
}

function buildSuggestions(pageContext: AiPageContextDto): AiSuggestionDto[] {
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

function factsToMap(pageContext: AiPageContextDto) {
  return Object.fromEntries(
    (pageContext.facts ?? []).map((fact) => [fact.key, fact.value])
  );
}

function buildAnswer(
  pageContext: AiPageContextDto,
  inferredIntent: InferredIntent,
  userMessage?: string
) {
  const facts = factsToMap(pageContext);
  const pageName = pageContext.pageTitle;
  const summary = pageContext.summary;

  switch (inferredIntent) {
    case "explain_problem":
      return [
        `You are looking at "${pageName}". ${summary}`,
        facts.difficulty
          ? `Difficulty is ${facts.difficulty}.`
          : "Start by identifying the exact input/output contract and the main constraint.",
        facts.currentLanguage
          ? `You currently have ${facts.currentLanguage} selected, so I would think about the solution in that language's strengths.`
          : "Once the contract is clear, pick one simple strategy and test it on the sample case first.",
      ].join(" ");
    case "give_hint":
      return [
        `Here is a nudge for "${pageName}":`,
        facts.tags
          ? `the current tags suggest looking at ${facts.tags}.`
          : "look for the smallest invariant you can maintain while scanning the input.",
        "Try to reason about what state must be remembered between steps before writing more code.",
      ].join(" ");
    case "review_code":
      return [
        `I can help review your current code for "${pageName}". ${summary}`,
        facts.codeLines
          ? `Your editor currently has ${facts.codeLines} lines of code.`
          : "I do not have a reliable code-size signal yet.",
        facts.lastRunStatus
          ? `The latest run status is ${facts.lastRunStatus}. Compare the branch that produced that result against the expected contract first.`
          : "Run the code once after the next small change so we can compare behavior against the expected output.",
      ].join(" ");
    case "explain_result":
      return [
        `Here is how I would read the latest result on "${pageName}":`,
        facts.lastRunStatus
          ? `latest run status: ${facts.lastRunStatus}.`
          : facts.lastSubmitStatus
            ? `latest submit status: ${facts.lastSubmitStatus}.`
            : "I do not yet have a recent run or submit result in context.",
        facts.lastError
          ? `The last recorded error was "${facts.lastError}".`
          : "Look at whether the failure happened in compile phase or run phase first; that tells you whether the problem is setup or logic.",
      ].join(" ");
    case "curation_help":
      return [
        `This page is about curating problems. ${summary}`,
        facts.judgeReady
          ? `The selected problem is currently marked ${facts.judgeReady}.`
          : "Judge readiness depends on having representative hidden and sample testcases.",
        facts.testcaseCounts
          ? `Current testcase coverage: ${facts.testcaseCounts}.`
          : "A good next step is usually to check whether sample references have been turned into runnable testcases.",
      ].join(" ");
    case "language_help":
      return [
        `This page is about execution language configuration. ${summary}`,
        facts.languageCount
          ? `You currently have ${facts.languageCount} configured languages.`
          : "Compile command is for building code before execution; run command is for executing the source or produced artifact.",
        userMessage
          ? `For your question "${userMessage}", I would first verify that suffix, compile command, and run command match the actual toolchain installed on the machine.`
          : "If a language is failing, check suffix, compile command, run command, and default-language behavior in that order.",
      ].join(" ");
    case "page_help":
      return [
        `You are on "${pageName}". ${summary}`,
        "I can explain what this page is for, what the visible controls mean, and what a sensible next action would be.",
      ].join(" ");
    case "general_question":
    default:
      return [
        `I am using the current page context for "${pageName}".`,
        summary,
        userMessage
          ? `Your question was "${userMessage}". I can answer it, but if you want a sharper answer, ask for a hint, a result explanation, or a code review explicitly.`
          : "Ask me to explain, hint, review code, or explain a result.",
      ].join(" ");
  }
}

export class MockAiProvider implements AiProvider {
  async respond(input: AiProviderInput): Promise<AiProviderOutput> {
    const inferredIntent = inferIntent(input.userMessage, input.pageContext);
    const suggestions = buildSuggestions(input.pageContext);
    const answer =
      input.action === "suggest" && !input.userMessage
        ? `I am ready to help with "${input.pageContext.pageTitle}". ${input.pageContext.summary}`
        : buildAnswer(input.pageContext, inferredIntent, input.userMessage);

    return {
      answer,
      suggestions,
      inferredIntent,
      sourcesUsed: [
        input.pageContext.pageTitle,
        input.pageContext.summary,
        ...(input.pageContext.facts ?? []).slice(0, 3).map((fact) => fact.label),
      ],
      provider: "mock-assistant-preview",
    };
  }
}
