import type {
  AiConversationMessage,
  AiConversationThreadSummary,
} from "./types";

const conversationStorageKeyPrefix = "global-ai-assistant-thread-v1:";
const maxPersistedMessages = 18;

type StoredConversationThread = {
  route: string;
  pageTitle: string;
  updatedAt: number;
  messages: AiConversationMessage[];
};

function buildConversationStorageKey(route: string) {
  return `${conversationStorageKeyPrefix}${encodeURIComponent(route)}`;
}

function decodeConversationStorageKey(storageKey: string) {
  return decodeURIComponent(storageKey.slice(conversationStorageKeyPrefix.length));
}

function isStoredMessage(value: unknown): value is AiConversationMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AiConversationMessage>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    (candidate.inferredIntent == null || typeof candidate.inferredIntent === "string") &&
    (candidate.sourcesUsed == null ||
      (Array.isArray(candidate.sourcesUsed) &&
        candidate.sourcesUsed.every((source) => typeof source === "string")))
  );
}

function isStoredConversationThread(value: unknown): value is StoredConversationThread {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredConversationThread>;
  return (
    typeof candidate.route === "string" &&
    typeof candidate.pageTitle === "string" &&
    typeof candidate.updatedAt === "number" &&
    Array.isArray(candidate.messages) &&
    candidate.messages.every(isStoredMessage)
  );
}

function buildThreadPreview(messages: AiConversationMessage[]) {
  const latestMessage = [...messages].reverse().find((message) => message.content.trim());
  if (!latestMessage) {
    return "No messages yet";
  }

  const normalized = latestMessage.content.replace(/\s+/g, " ").trim();
  return normalized.length > 92 ? `${normalized.slice(0, 89)}...` : normalized;
}

function toThreadSummary(thread: StoredConversationThread): AiConversationThreadSummary {
  return {
    route: thread.route,
    pageTitle: thread.pageTitle,
    updatedAt: thread.updatedAt,
    messageCount: thread.messages.length,
    preview: buildThreadPreview(thread.messages),
  };
}

function parseStoredConversationRoute(
  route: string,
  rawValue: string
): StoredConversationThread | null {
  try {
    const parsed = JSON.parse(rawValue);

    if (isStoredConversationThread(parsed)) {
      return {
        ...parsed,
        messages: parsed.messages.slice(-maxPersistedMessages),
      };
    }

    if (Array.isArray(parsed)) {
      const safeMessages = parsed.filter(isStoredMessage).slice(-maxPersistedMessages);
      return {
        route,
        pageTitle: route,
        updatedAt: 0,
        messages: safeMessages,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function loadConversationForRoute(route: string): AiConversationMessage[] {
  if (typeof window === "undefined" || !route) {
    return [];
  }

  const rawValue = window.localStorage.getItem(buildConversationStorageKey(route));
  if (!rawValue) {
    return [];
  }

  return parseStoredConversationRoute(route, rawValue)?.messages ?? [];
}

export function saveConversationForRoute(
  route: string,
  pageTitle: string,
  messages: AiConversationMessage[]
) {
  if (typeof window === "undefined" || !route) {
    return;
  }

  const safeMessages = messages.filter(isStoredMessage).slice(-maxPersistedMessages);
  const storageKey = buildConversationStorageKey(route);

  if (safeMessages.length === 0) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  const thread: StoredConversationThread = {
    route,
    pageTitle: pageTitle || route,
    updatedAt: Date.now(),
    messages: safeMessages,
  };

  window.localStorage.setItem(storageKey, JSON.stringify(thread));
}

export function clearConversationForRoute(route: string) {
  if (typeof window === "undefined" || !route) {
    return;
  }

  window.localStorage.removeItem(buildConversationStorageKey(route));
}

export function listConversationThreads(): AiConversationThreadSummary[] {
  if (typeof window === "undefined") {
    return [];
  }

  const threads: AiConversationThreadSummary[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey || !storageKey.startsWith(conversationStorageKeyPrefix)) {
      continue;
    }

    const route = decodeConversationStorageKey(storageKey);
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      continue;
    }

    const thread = parseStoredConversationRoute(route, rawValue);
    if (!thread || thread.messages.length === 0) {
      continue;
    }

    threads.push(toThreadSummary(thread));
  }

  return threads.sort((left, right) => right.updatedAt - left.updatedAt);
}
