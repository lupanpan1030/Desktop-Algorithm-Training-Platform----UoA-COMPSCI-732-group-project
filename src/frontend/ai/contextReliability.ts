import type { AiPageContextPayload } from "./types";

export type AiContextReliabilityTone =
  | "default"
  | "info"
  | "success"
  | "warning";

export interface AiContextReliability {
  label: string;
  detail: string;
  tone: AiContextReliabilityTone;
}

type BuildContextReliabilityInput = {
  pageContext: AiPageContextPayload | null;
  pending: boolean;
  error: string | null;
  restoredConversation: boolean;
};

export function buildContextReliability(
  input: BuildContextReliabilityInput
): AiContextReliability {
  const factCount = input.pageContext?.facts?.length ?? 0;
  const contextLineCount = input.pageContext?.contextText?.length ?? 0;
  const evidenceCount = factCount + contextLineCount;

  if (!input.pageContext) {
    return {
      label: "Context unavailable",
      detail: "Open a page and let the workspace finish loading before relying on assistant guidance.",
      tone: "default",
    };
  }

  if (input.error) {
    return {
      label: "Needs verification",
      detail: "A recent assistant request failed, so answers may rely on the last stable page snapshot rather than a fresh response.",
      tone: "warning",
    };
  }

  if (input.pending) {
    return {
      label: "Refreshing context",
      detail: `The assistant is updating against ${factCount} facts and ${contextLineCount} context lines from the current route.`,
      tone: "info",
    };
  }

  if (evidenceCount >= 6) {
    return {
      label: input.restoredConversation ? "Live + restored" : "Live context",
      detail: `Using ${factCount} facts and ${contextLineCount} context lines from the current page${input.restoredConversation ? ", plus the restored route thread." : "."}`,
      tone: "success",
    };
  }

  return {
    label: input.restoredConversation ? "Partial + restored" : "Partial context",
    detail: `The current page exposed ${factCount} facts and ${contextLineCount} context lines, so treat the answer as guidance rather than a full diagnostic.`,
    tone: "warning",
  };
}
