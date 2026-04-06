export function normalizeLanguageKey(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function normalizeLanguageName(name?: string | null) {
  return normalizeLanguageKey(name);
}

export function normalizeLanguageSuffix(suffix?: string | null) {
  return normalizeLanguageKey(suffix);
}

export function normalizeLanguageDisplayName(name?: string | null, fallback = "Language") {
  const trimmed = name?.trim();
  return trimmed || fallback;
}

export function normalizeLanguageDisplaySuffix(suffix?: string | null) {
  return suffix?.trim() ?? "";
}
