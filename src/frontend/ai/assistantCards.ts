import type { AiConversationMessage } from "./types";

export interface AiAssistantCard {
  id: string;
  title: string;
  entries: string[];
}

const intentLabelMap: Record<string, string> = {
  explain_problem: "Problem explanation",
  give_hint: "Hint path",
  review_code: "Code review",
  explain_result: "Result diagnosis",
  page_help: "Page guidance",
  curation_help: "Curation guidance",
  language_help: "Language setup help",
  general_question: "General guidance",
};

function normalizeSentence(sentence: string) {
  return sentence.replace(/\s+/g, " ").trim();
}

function extractHighlights(content: string) {
  const chunks = content
    .split(/\n+|(?<=[.!?])\s+/)
    .map(normalizeSentence)
    .filter(Boolean);

  const uniqueChunks = chunks.filter(
    (chunk, index) => chunks.findIndex((candidate) => candidate === chunk) === index
  );

  return uniqueChunks.slice(0, 3);
}

export function buildAssistantCards(
  message: AiConversationMessage
): AiAssistantCard[] {
  if (message.role !== "assistant") {
    return [];
  }

  const cards: AiAssistantCard[] = [];
  const highlights = extractHighlights(message.content);

  if (message.inferredIntent) {
    cards.push({
      id: "focus",
      title: "Focus",
      entries: [intentLabelMap[message.inferredIntent] ?? message.inferredIntent],
    });
  }

  if (highlights.length > 1 || message.content.length > 120) {
    cards.push({
      id: "highlights",
      title: "Key points",
      entries: highlights,
    });
  }

  if (message.sourcesUsed?.length) {
    cards.push({
      id: "sources",
      title: "Grounded in",
      entries: message.sourcesUsed.slice(0, 3),
    });
  }

  return cards;
}
