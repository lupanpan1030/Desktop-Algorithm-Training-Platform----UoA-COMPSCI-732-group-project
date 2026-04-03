export function normalizeStarterLanguageKey(language) {
  const normalized = language?.trim().toLowerCase();

  switch (normalized) {
    case "py":
    case "python3":
    case "python":
      return "python";
    case "js":
    case "javascript":
      return "javascript";
    case "c++":
    case "cpp":
      return "cpp";
    case "c#":
    case "csharp":
      return "csharp";
    case "golang":
    case "go":
      return "go";
    default:
      return normalized || "";
  }
}

export function buildStarterCodeLookup(starterCodes = []) {
  return starterCodes.reduce((lookup, starterCode) => {
    const candidateKeys = [
      normalizeStarterLanguageKey(starterCode.languageSlug),
      normalizeStarterLanguageKey(starterCode.languageName),
    ].filter(Boolean);

    candidateKeys.forEach((key) => {
      if (!lookup[key]) {
        lookup[key] = starterCode.template;
      }
    });

    return lookup;
  }, {});
}

export function getStarterCodeForLanguage(language, starterCodesOrLookup = []) {
  const lookup = Array.isArray(starterCodesOrLookup)
    ? buildStarterCodeLookup(starterCodesOrLookup)
    : starterCodesOrLookup;

  const normalizedLanguage = normalizeStarterLanguageKey(language);
  if (!normalizedLanguage) {
    return "";
  }

  return lookup[normalizedLanguage] ?? "";
}
