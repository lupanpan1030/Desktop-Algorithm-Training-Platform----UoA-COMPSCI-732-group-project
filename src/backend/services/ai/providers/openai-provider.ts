import axios from "axios";
import { AiPageContextDto, AiSuggestionDto } from "../../../api/ai/ai";
import { AiProvider, AiProviderInput, AiProviderOutput } from "./ai-provider";
import { buildDefaultSources, buildDefaultSuggestions } from "./provider-utils";

type ParsedAssistantPayload = {
  answer?: string;
  inferredIntent?: string;
  suggestions?: string[];
  sourcesUsed?: string[];
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

const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 30000;

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

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
    this.model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
    this.baseUrl = process.env.OPENAI_BASE_URL?.trim() || DEFAULT_BASE_URL;
    this.timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

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
}
