import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ProblemLocaleContextValue = {
  locale: string;
  setLocale: (locale: string) => void;
};

const STORAGE_KEY = "problemLocale";
const DEFAULT_LOCALE = "en";

const ProblemLocaleContext = createContext<ProblemLocaleContextValue | null>(null);

function normalizeLocale(locale?: string | null) {
  const normalized = locale?.trim();

  if (!normalized) {
    return DEFAULT_LOCALE;
  }

  const lower = normalized.toLowerCase();
  if (lower === "zh" || lower === "zh-cn") {
    return "zh-CN";
  }

  if (lower.startsWith("en")) {
    return "en";
  }

  return normalized;
}

export function ProblemLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LOCALE;
    }

    return normalizeLocale(localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (nextLocale: string) => setLocaleState(normalizeLocale(nextLocale)),
    }),
    [locale]
  );

  return (
    <ProblemLocaleContext.Provider value={value}>
      {children}
    </ProblemLocaleContext.Provider>
  );
}

export function useProblemLocale() {
  const context = useContext(ProblemLocaleContext);

  if (!context) {
    throw new Error("useProblemLocale must be used within a ProblemLocaleProvider.");
  }

  return context;
}
