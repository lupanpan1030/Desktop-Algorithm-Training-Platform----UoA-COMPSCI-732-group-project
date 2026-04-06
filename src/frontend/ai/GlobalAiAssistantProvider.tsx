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
  AiConversationThreadSummary,
  AiPageContextPayload,
  AiRespondResponse,
  AiSuggestion,
} from "./types";
import {
  clearConversationForRoute,
  listConversationThreads,
  loadConversationForRoute,
  saveConversationForRoute,
} from "./conversationStorage";

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
  threadSummaries: AiConversationThreadSummary[];
  restoredConversation: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  clearConversation: () => void;
  forgetConversation: (route: string) => void;
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
  const response = await api.post<AiRespondResponse>("/ai/respond", payload, {
    timeout: 45_000,
  });
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
  const [threadSummaries, setThreadSummaries] = useState<AiConversationThreadSummary[]>([]);
  const [restoredConversation, setRestoredConversation] = useState(false);
  const [openSessionId, setOpenSessionId] = useState(0);
  const latestRequestIdRef = useRef(0);
  const activeRouteRef = useRef<string | null>(null);
  const hydratingRouteRef = useRef(false);
  const lastAutoRefreshKeyRef = useRef<string | null>(null);

  const refreshThreadSummaries = useCallback(() => {
    setThreadSummaries(listConversationThreads());
  }, []);

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

  const activeRoute = pageContext?.route ?? null;

  const refreshSuggestions = useCallback(async () => {
    if (!pageContext) {
      return;
    }

    try {
      await runRequest({
        action: "suggest",
        pageContext,
        conversation: toConversationTurns(messages),
      });
    } catch {
      // Error state is already stored in runRequest; swallow to avoid uncaught UI overlays.
    }
  }, [messages, pageContext, runRequest]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!pageContext || !message.trim()) {
        return;
      }

      const trimmedMessage = message.trim();
      const targetRoute = pageContext.route;
      hydratingRouteRef.current = false;
      setRestoredConversation(false);
      const userMessage: AiConversationMessage = {
        id: createMessageId("user"),
        role: "user",
        content: trimmedMessage,
      };
      const nextMessages: AiConversationMessage[] = [
        ...messages,
        userMessage,
      ];
      setMessages(nextMessages);

      let response: AiRespondResponse | undefined;
      try {
        response = await runRequest({
          action: "answer",
          userMessage: trimmedMessage,
          pageContext,
          conversation: toConversationTurns(nextMessages),
        });
      } catch {
        return;
      }

      if (response) {
        const assistantMessage: AiConversationMessage = {
          id: createMessageId("assistant"),
          role: "assistant",
          content: response.answer,
          inferredIntent: response.inferredIntent,
          sourcesUsed: response.sourcesUsed,
        };

        if (activeRouteRef.current !== targetRoute) {
          saveConversationForRoute(
            targetRoute,
            pageContext.pageTitle,
            [...nextMessages, assistantMessage]
          );
          refreshThreadSummaries();
          return;
        }

        setMessages((previous) => [...previous, assistantMessage]);
      }
    },
    [messages, pageContext, refreshThreadSummaries, runRequest]
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
    setRestoredConversation(false);
    if (activeRouteRef.current) {
      clearConversationForRoute(activeRouteRef.current);
    }
    refreshThreadSummaries();
  }, [refreshThreadSummaries]);

  const forgetConversation = useCallback(
    (route: string) => {
      clearConversationForRoute(route);
      if (activeRouteRef.current === route) {
        setMessages([]);
        setRestoredConversation(false);
      }
      refreshThreadSummaries();
    },
    [refreshThreadSummaries]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setOpenSessionId((current) => current + 1);
  }, [open]);

  useEffect(() => {
    if (!open || !pageContext || openSessionId === 0) {
      return;
    }

    const autoRefreshKey = `${openSessionId}:${pageContext.route}`;
    if (lastAutoRefreshKeyRef.current === autoRefreshKey) {
      return;
    }

    lastAutoRefreshKeyRef.current = autoRefreshKey;
    void refreshSuggestions();
  }, [open, openSessionId, pageContext, refreshSuggestions]);

  useEffect(() => {
    refreshThreadSummaries();
  }, [refreshThreadSummaries]);

  useEffect(() => {
    activeRouteRef.current = activeRoute;
  }, [activeRoute]);

  useEffect(() => {
    if (!activeRoute) {
      setMessages([]);
      setSuggestions([]);
      setError(null);
      return;
    }

    const restoredMessages = loadConversationForRoute(activeRoute);
    hydratingRouteRef.current = true;
    setMessages(restoredMessages);
    setRestoredConversation(restoredMessages.length > 0);
    setSuggestions([]);
    setError(null);
    refreshThreadSummaries();
  }, [activeRoute, refreshThreadSummaries]);

  useEffect(() => {
    if (!activeRoute) {
      return;
    }

    if (hydratingRouteRef.current) {
      hydratingRouteRef.current = false;
      return;
    }

    saveConversationForRoute(
      activeRoute,
      pageContext?.pageTitle ?? activeRoute,
      messages
    );
    refreshThreadSummaries();
  }, [activeRoute, messages, pageContext?.pageTitle, refreshThreadSummaries]);

  const value = useMemo<GlobalAiAssistantContextValue>(
    () => ({
      open,
      pending,
      error,
      pageContext,
      suggestions,
      messages,
      threadSummaries,
      restoredConversation,
      openAssistant,
      closeAssistant,
      clearConversation,
      forgetConversation,
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
      threadSummaries,
      restoredConversation,
      openAssistant,
      closeAssistant,
      clearConversation,
      forgetConversation,
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
