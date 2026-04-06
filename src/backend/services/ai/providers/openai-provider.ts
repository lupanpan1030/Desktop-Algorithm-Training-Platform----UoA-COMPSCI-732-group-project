import axios from "axios";
import { AiPageContextDto, AiSuggestionDto } from "../../../api/ai/ai";
import {
  AiProvider,
  AiProviderInput,
  AiProviderOutput,
  AiTestDraftInput,
  AiTestDraftOutput,
} from "./ai-provider";
import {
  DEFAULT_AI_MODEL,
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_OPENAI_TIMEOUT_MS,
  ResolvedAiRuntimeSettings,
  resolveAiRuntimeSettings,
} from "../ai-runtime-settings";
import { buildDefaultSources, buildDefaultSuggestions } from "./provider-utils";
import { AiTestcaseDraftDto } from "../../../api/problem-ai/problem-ai";

type ParsedAssistantPayload = {
  answer?: string;
  inferredIntent?: string;
  suggestions?: string[];
  sourcesUsed?: string[];
};

type ParsedTestDraftPayload = {
  drafts?: Array<{
    input?: string;
    expectedOutput?: string;
    isSample?: boolean;
    rationale?: string;
    confidence?: string;
    riskFlags?: string[];
    sourceHints?: string[];
  }>;
  warnings?: string[];
};

type OpenAiResponseContentItem = {
  type?: string;
  text?: string;
};

type OpenAiResponseOutputItem = {
  type?: string;
  content?: OpenAiResponseContentItem[];
};

type OpenAiResponse = {
  output?: OpenAiResponseOutputItem[];
};

function normalizeIntent(value?: string) {
  return value?.trim() || "general_question";
}

function extractOutputText(response: OpenAiResponse) {
  const chunks =
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && item.text)
      .map((item) => item.text ?? "") ?? [];

  return chunks.join("\n").trim();
}

function extractJsonObject(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

function parseAssistantPayload(text: string): ParsedAssistantPayload | null {
  try {
    return JSON.parse(extractJsonObject(text)) as ParsedAssistantPayload;
  } catch {
    return null;
  }
}

function parseTestDraftPayload(text: string): ParsedTestDraftPayload | null {
  try {
    return JSON.parse(extractJsonObject(text)) as ParsedTestDraftPayload;
  } catch {
    return null;
  }
}

function buildPrompt(input: AiProviderInput) {
  const facts = (input.pageContext.facts ?? [])
    .map((fact) => `- ${fact.label}: ${fact.value}`)
    .join("\n");
  const contextText = (input.pageContext.contextText ?? [])
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");
  const conversation = input.conversation
    .slice(-8)
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join("\n");

  return [
    `Action: ${input.action}`,
    `Page kind: ${input.pageContext.pageKind}`,
    `Route: ${input.pageContext.route}`,
    `Page title: ${input.pageContext.pageTitle}`,
    `Locale: ${input.pageContext.locale ?? "unknown"}`,
    `Summary: ${input.pageContext.summary}`,
    facts ? `Facts:\n${facts}` : "Facts: none",
    contextText ? `Context:\n${contextText}` : "Context: none",
    conversation ? `Recent conversation:\n${conversation}` : "Recent conversation: none",
    `Latest user message: ${input.userMessage ?? "(none)"}`,
    "",
    "Return a JSON object with this exact shape:",
    JSON.stringify(
      {
        answer: "short helpful tutor answer",
        inferredIntent: "one short snake_case intent label",
        suggestions: [
          "follow-up question 1",
          "follow-up question 2",
          "follow-up question 3",
        ],
        sourcesUsed: ["page title", "summary", "key fact label"],
      },
      null,
      2
    ),
  ].join("\n");
}

function truncateForPrompt(value: string, limit = 1400) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit)}\n...[truncated]`;
}

function buildTestDraftPrompt(input: AiTestDraftInput) {
  const existingCoverage =
    input.existingTestcases.length > 0
      ? input.existingTestcases
          .slice(0, 10)
          .map(
            (testcase, index) =>
              `${index + 1}. ${testcase.isSample ? "sample" : "hidden"} | input=${truncateForPrompt(
                testcase.input,
                220
              )} | output=${truncateForPrompt(testcase.expectedOutput, 220)}`
          )
          .join("\n")
      : "none";
  const starterLanguages =
    input.problem.starterCodes.length > 0
      ? input.problem.starterCodes.map((starterCode) => starterCode.languageName).join(", ")
      : "none";

  return [
    `Problem ID: ${input.problemId}`,
    `Title: ${input.problem.title}`,
    `Difficulty: ${input.problem.difficulty}`,
    `Locale: ${input.problem.locale}`,
    `Source: ${input.problem.source}`,
    `Source slug: ${input.problem.sourceSlug ?? "none"}`,
    `Tags: ${input.problem.tags.join(", ") || "none"}`,
    `Need sample drafts: ${input.includeSampleDrafts ? "yes" : "no"}`,
    `Need hidden drafts: ${input.includeHiddenDrafts ? "yes" : "no"}`,
    `Target draft count: ${input.targetCount}`,
    `Current testcase coverage: ${input.problem.sampleCaseCount} sample / ${input.problem.hiddenCaseCount} hidden`,
    `Existing testcase summary:\n${existingCoverage}`,
    `Starter code languages: ${starterLanguages}`,
    input.problem.sampleTestcase
      ? `Imported sample reference:\n${truncateForPrompt(input.problem.sampleTestcase, 2200)}`
      : "Imported sample reference: none",
    `Problem description:\n${truncateForPrompt(input.problem.description, 5000)}`,
    "",
    "Return a JSON object with this exact shape:",
    JSON.stringify(
      {
        drafts: [
          {
            input: "exact testcase input string",
            expectedOutput: "exact expected output string",
            isSample: true,
            rationale: "why this testcase is useful",
            confidence: "high",
            riskFlags: ["only when needed"],
            sourceHints: ["sample reference", "description example", "edge-case reasoning"],
          },
        ],
        warnings: ["optional warning for manual review"],
      },
      null,
      2
    ),
  ].join("\n");
}

function buildSystemInstructions() {
  return [
    "You are the global AI assistant inside an Electron algorithm practice app.",
    "Adopt a concise tutor tone.",
    "Use the provided page context instead of inventing UI state.",
    "Prefer explanation, hints, checkpoints, and debugging guidance over complete solutions.",
    "Do not provide a full final solution by default, even if the page is a coding problem.",
    "When the action is suggest, focus on generating clickable next questions for the current page.",
    "When the action is answer, answer the user directly and keep it grounded in the current page context.",
    "If context is missing, say exactly what is missing.",
    "Always return valid JSON only.",
  ].join("\n");
}

function buildTestDraftSystemInstructions() {
  return [
    "You are generating testcase drafts for a curated algorithm problem inside a local judge application.",
    "Return JSON only. Do not wrap the response in Markdown.",
    "Avoid duplicating existing testcase coverage.",
    "Prefer concrete sample cases and meaningful edge cases.",
    "Every draft must contain exact input and expectedOutput strings.",
    "If expected output is uncertain, keep the best available guess but set confidence to low and include risk flag requires_manual_output_review.",
    "Do not claim certainty when the problem statement is ambiguous.",
    "Keep drafts concise and reviewable.",
  ].join("\n");
}

function normalizeConfidence(value?: string): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "low";
}

function normalizeStringArray(value?: string[]) {
  return value?.map((item) => item?.trim()).filter(Boolean) ?? [];
}

function normalizeDrafts(
  input: AiTestDraftInput,
  parsed?: ParsedTestDraftPayload
): AiTestcaseDraftDto[] {
  const seen = new Set(
    input.existingTestcases.map(
      (testcase) => `${testcase.isSample ? "sample" : "hidden"}:${testcase.input}::${testcase.expectedOutput}`
    )
  );
  const drafts = parsed?.drafts ?? [];

  return drafts
    .map((draft, index) => {
      const normalizedInput = draft.input?.trim() ?? "";
      const normalizedOutput = draft.expectedOutput?.trim() ?? "";
      const isSample = Boolean(draft.isSample);

      if (!normalizedInput || !normalizedOutput) {
        return null;
      }
      if (isSample && !input.includeSampleDrafts) {
        return null;
      }
      if (!isSample && !input.includeHiddenDrafts) {
        return null;
      }

      const signature = `${isSample ? "sample" : "hidden"}:${normalizedInput}::${normalizedOutput}`;
      if (seen.has(signature)) {
        return null;
      }
      seen.add(signature);

      return {
        id: `openai-${input.problemId}-${index + 1}`,
        input: normalizedInput,
        expectedOutput: normalizedOutput,
        isSample,
        rationale: draft.rationale?.trim() || "AI-generated testcase draft.",
        confidence: normalizeConfidence(draft.confidence),
        riskFlags: normalizeStringArray(draft.riskFlags),
        sourceHints: normalizeStringArray(draft.sourceHints),
      };
    })
    .filter((draft): draft is AiTestcaseDraftDto => Boolean(draft))
    .slice(0, input.targetCount);
}

function toSuggestions(
  pageContext: AiPageContextDto,
  suggestions?: string[]
): AiSuggestionDto[] {
  const normalizedSuggestions = suggestions
    ?.map((suggestion) => suggestion.trim())
    .filter(Boolean);

  if (!normalizedSuggestions?.length) {
    return buildDefaultSuggestions(pageContext);
  }

  return normalizedSuggestions.slice(0, 5).map((prompt, index) => ({
    id: `${pageContext.pageKind}-${index}`,
    label: prompt,
    prompt,
  }));
}

export class OpenAiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(settings: ResolvedAiRuntimeSettings = resolveAiRuntimeSettings()) {
    this.apiKey = settings.apiKey.trim();
    this.model = settings.model.trim() || DEFAULT_AI_MODEL;
    this.baseUrl = settings.baseUrl.trim() || DEFAULT_OPENAI_BASE_URL;
    this.timeoutMs = Number(settings.timeoutMs ?? DEFAULT_OPENAI_TIMEOUT_MS);

    if (!this.apiKey) {
      throw new Error(
        "OPENAI_API_KEY is required when AI_PROVIDER is set to openai."
      );
    }
  }

  async respond(input: AiProviderInput): Promise<AiProviderOutput> {
    const response = await axios.post<OpenAiResponse>(
      `${this.baseUrl}/responses`,
      {
        model: this.model,
        instructions: buildSystemInstructions(),
        input: buildPrompt(input),
      },
      {
        timeout: this.timeoutMs,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const outputText = extractOutputText(response.data);
    const parsed = parseAssistantPayload(outputText);

    return {
      answer:
        parsed?.answer?.trim() ||
        outputText ||
        `I am using the current context for "${input.pageContext.pageTitle}".`,
      inferredIntent: normalizeIntent(parsed?.inferredIntent),
      suggestions: toSuggestions(input.pageContext, parsed?.suggestions),
      sourcesUsed:
        parsed?.sourcesUsed?.filter(Boolean)?.slice(0, 5) ??
        buildDefaultSources(input.pageContext),
      provider: `openai:${this.model}`,
    };
  }

  async generateTestDrafts(input: AiTestDraftInput): Promise<AiTestDraftOutput> {
    const response = await axios.post<OpenAiResponse>(
      `${this.baseUrl}/responses`,
      {
        model: this.model,
        instructions: buildTestDraftSystemInstructions(),
        input: buildTestDraftPrompt(input),
      },
      {
        timeout: this.timeoutMs,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const outputText = extractOutputText(response.data);
    const parsed = parseTestDraftPayload(outputText);

    if (!parsed) {
      throw new Error("AI provider returned an invalid testcase draft payload.");
    }

    return {
      provider: `openai:${this.model}`,
      drafts: normalizeDrafts(input, parsed),
      warnings: normalizeStringArray(parsed.warnings),
    };
  }
}
