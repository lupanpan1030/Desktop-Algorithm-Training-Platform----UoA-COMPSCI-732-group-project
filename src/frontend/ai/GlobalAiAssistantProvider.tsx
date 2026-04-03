import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../api/axiosInstance";
import type {
  AiConversationMessage,
  AiConversationTurn,
  AiPageContextPayload,
  AiRespondResponse,
  AiSuggestion,
} from "./types";

type AssistantRequestPayload = {
  action?: "suggest" | "answer";
  userMessage?: string;
  pageContext: AiPageContextPayload;
  conversation?: AiConversationTurn[];
};

type GlobalAiAssistantContextValue = {
  open: boolean;
  pending: boolean;
  error: string | null;
  pageContext: AiPageContextPayload | null;
  suggestions: AiSuggestion[];
  messages: AiConversationMessage[];
  openAssistant: () => void;
  closeAssistant: () => void;
  clearConversation: () => void;
  sendMessage: (message: string) => Promise<void>;
  applySuggestedPrompt: (prompt: string) => Promise<void>;
  registerPageContext: (context: AiPageContextPayload) => void;
  refreshSuggestions: () => Promise<void>;
};

const GlobalAiAssistantContext =
  createContext<GlobalAiAssistantContextValue | null>(null);

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function requestAssistant(payload: AssistantRequestPayload) {
  const response = await api.post<AiRespondResponse>("/ai/respond", payload);
  return response.data;
}

function toConversationTurns(messages: AiConversationMessage[]): AiConversationTurn[] {
  return messages.map(({ role, content }) => ({ role, content }));
}

export function GlobalAiAssistantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageContext, setPageContext] = useState<AiPageContextPayload | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [messages, setMessages] = useState<AiConversationMessage[]>([]);
  const latestRequestIdRef = useRef(0);

  const registerPageContext = useCallback((context: AiPageContextPayload) => {
    setPageContext((previous) => {
      if (
        previous &&
        previous.route === context.route &&
        previous.summary === context.summary &&
        JSON.stringify(previous.facts) === JSON.stringify(context.facts) &&
        JSON.stringify(previous.contextText) === JSON.stringify(context.contextText)
      ) {
        return previous;
      }
      return context;
    });
  }, []);

  const runRequest = useCallback(
    async (payload: AssistantRequestPayload) => {
      latestRequestIdRef.current += 1;
      const requestId = latestRequestIdRef.current;
      setPending(true);
      setError(null);

      try {
        const response = await requestAssistant(payload);
        if (requestId === latestRequestIdRef.current) {
          setSuggestions(response.suggestions ?? []);
        }
        return response;
      } catch (requestError) {
        const message =
          requestError instanceof Error && requestError.message
            ? requestError.message
            : "Assistant request failed.";
        if (requestId === latestRequestIdRef.current) {
          setError(message);
        }
        throw requestError;
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setPending(false);
        }
      }
    },
    []
  );

  const refreshSuggestions = useCallback(async () => {
    if (!pageContext) {
      return;
    }

    await runRequest({
      action: "suggest",
      pageContext,
      conversation: toConversationTurns(messages),
    });
  }, [messages, pageContext, runRequest]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!pageContext || !message.trim()) {
        return;
      }

      const trimmedMessage = message.trim();
      const nextMessages: AiConversationMessage[] = [
        ...messages,
        {
          id: createMessageId("user"),
          role: "user",
          content: trimmedMessage,
        },
      ];
      setMessages(nextMessages);

      const response = await runRequest({
        action: "answer",
        userMessage: trimmedMessage,
        pageContext,
        conversation: toConversationTurns(nextMessages),
      });

      setMessages((previous) => [
        ...previous,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: response.answer,
          inferredIntent: response.inferredIntent,
          sourcesUsed: response.sourcesUsed,
        },
      ]);
    },
    [messages, pageContext, runRequest]
  );

  const applySuggestedPrompt = useCallback(
    async (prompt: string) => {
      await sendMessage(prompt);
    },
    [sendMessage]
  );

  const openAssistant = useCallback(() => {
    setOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setOpen(false);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!open || !pageContext) {
      return;
    }

    void refreshSuggestions();
  }, [open, pageContext, refreshSuggestions]);

  const value = useMemo<GlobalAiAssistantContextValue>(
    () => ({
      open,
      pending,
      error,
      pageContext,
      suggestions,
      messages,
      openAssistant,
      closeAssistant,
      clearConversation,
      sendMessage,
      applySuggestedPrompt,
      registerPageContext,
      refreshSuggestions,
    }),
    [
      open,
      pending,
      error,
      pageContext,
      suggestions,
      messages,
      openAssistant,
      closeAssistant,
      clearConversation,
      sendMessage,
      applySuggestedPrompt,
      registerPageContext,
      refreshSuggestions,
    ]
  );

  return (
    <GlobalAiAssistantContext.Provider value={value}>
      {children}
    </GlobalAiAssistantContext.Provider>
  );
}

export function useGlobalAiAssistant() {
  const context = useContext(GlobalAiAssistantContext);

  if (!context) {
    throw new Error(
      "useGlobalAiAssistant must be used within a GlobalAiAssistantProvider."
    );
  }

  return context;
}

export function useOptionalGlobalAiAssistant() {
  return useContext(GlobalAiAssistantContext);
}
