import { useEffect } from "react";
import { useOptionalGlobalAiAssistant } from "./GlobalAiAssistantProvider";
import type { AiPageContextPayload } from "./types";

export function useAiPageContext(pageContext: AiPageContextPayload | null) {
  const assistant = useOptionalGlobalAiAssistant();

  useEffect(() => {
    if (!pageContext || !assistant) {
      return;
    }

    assistant.registerPageContext(pageContext);
  }, [assistant, pageContext]);
}
