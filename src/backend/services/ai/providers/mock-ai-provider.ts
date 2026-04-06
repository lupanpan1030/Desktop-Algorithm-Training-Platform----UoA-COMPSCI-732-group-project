import { AiPageContextDto, AiSuggestionDto } from "../../../api/ai/ai";
import {
  AiProvider,
  AiProviderInput,
  AiProviderOutput,
  AiTestDraftInput,
  AiTestDraftOutput,
} from "./ai-provider";
import { AiTestcaseDraftDto } from "../../../api/problem-ai/problem-ai";
import { buildDefaultSources, buildDefaultSuggestions } from "./provider-utils";

type InferredIntent =
  | "explain_problem"
  | "give_hint"
  | "review_code"
  | "explain_result"
  | "page_help"
  | "curation_help"
  | "language_help"
  | "general_question";

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
  return buildDefaultSuggestions(pageContext);
}

type ExtractedExample = {
  input: string;
  expectedOutput: string;
  sourceHint: string;
};

function factsToMap(pageContext: AiPageContextDto) {
  return Object.fromEntries(
    (pageContext.facts ?? []).map((fact) => [fact.key, fact.value])
  );
}

function extractExamplePairs(text: string, sourceHint: string): ExtractedExample[] {
  const sanitized = text.replace(/\*\*/g, "");
  const pattern =
    /Input:\s*([\s\S]*?)\s*Output:\s*([\s\S]*?)(?=(?:\n\s*(?:Explanation|Note|Constraints?)\s*:)|(?:\n\s*Example\b)|$)/gi;
  const results: ExtractedExample[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(sanitized)) !== null) {
    const input = match[1]?.trim();
    const expectedOutput = match[2]?.trim();

    if (!input || !expectedOutput) {
      continue;
    }

    results.push({
      input,
      expectedOutput,
      sourceHint,
    });
  }

  return results;
}

function buildMockDrafts(input: AiTestDraftInput): AiTestDraftOutput {
  const warnings: string[] = [
    "Preview mode only extracts explicit examples and does not infer hidden edge cases confidently.",
  ];
  const existingKeys = new Set(
    input.existingTestcases.map(
      (testcase) => `${testcase.isSample ? "sample" : "hidden"}:${testcase.input}::${testcase.expectedOutput}`
    )
  );
  const combinedExamples = [
    ...(input.problem.sampleTestcase
      ? extractExamplePairs(input.problem.sampleTestcase, "sample reference")
      : []),
    ...extractExamplePairs(input.problem.description, "problem description"),
  ];
  const uniqueExamples = combinedExamples.filter((example, index, list) => {
    const signature = `${example.input}::${example.expectedOutput}`;
    return list.findIndex((candidate) => `${candidate.input}::${candidate.expectedOutput}` === signature) === index;
  });

  const drafts: AiTestcaseDraftDto[] = [];

  if (input.includeSampleDrafts) {
    uniqueExamples.forEach((example, index) => {
      if (drafts.length >= input.targetCount) {
        return;
      }

      const signature = `sample:${example.input}::${example.expectedOutput}`;
      if (existingKeys.has(signature)) {
        return;
      }

      drafts.push({
        id: `mock-sample-${input.problemId}-${index + 1}`,
        input: example.input,
        expectedOutput: example.expectedOutput,
        isSample: true,
        rationale:
          example.sourceHint === "sample reference"
            ? "Extracted directly from the imported sample reference."
            : "Extracted from an explicit Input/Output example in the current problem description.",
        confidence: example.sourceHint === "sample reference" ? "high" : "medium",
        riskFlags: [],
        sourceHints: [example.sourceHint],
      });
    });
  }

  if (input.includeHiddenDrafts) {
    warnings.push(
      "Hidden testcase drafts are not generated in preview mode; switch the assistant to OpenAI for inferred edge-case suggestions."
    );
  }

  if (!drafts.length) {
    warnings.push(
      "No explicit Input/Output examples were found in the current description or sample reference."
    );
  }

  return {
    provider: "mock-assistant-preview",
    drafts: drafts.slice(0, input.targetCount),
    warnings,
  };
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
      sourcesUsed: buildDefaultSources(input.pageContext),
      provider: "mock-assistant-preview",
    };
  }

  async generateTestDrafts(input: AiTestDraftInput): Promise<AiTestDraftOutput> {
    return buildMockDrafts(input);
  }
}
