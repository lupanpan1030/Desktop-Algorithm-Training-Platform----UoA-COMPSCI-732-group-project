export type AiPageKind =
  | "problem-list"
  | "problem-detail"
  | "problem-admin"
  | "language-admin";

export interface AiContextFact {
  key: string;
  label: string;
  value: string;
}

export interface AiPageContextPayload {
  pageKind: AiPageKind;
  route: string;
  pageTitle: string;
  summary: string;
  locale?: string;
  facts?: AiContextFact[];
  contextText?: string[];
  suggestedPrompts?: string[];
}

export interface AiConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AiSuggestion {
  id: string;
  label: string;
  prompt: string;
}

export interface AiRespondResponse {
  answer: string;
  suggestions: AiSuggestion[];
  inferredIntent: string;
  sourcesUsed: string[];
  provider: string;
}

export interface AiConversationMessage extends AiConversationTurn {
  id: string;
  inferredIntent?: string;
  sourcesUsed?: string[];
}
