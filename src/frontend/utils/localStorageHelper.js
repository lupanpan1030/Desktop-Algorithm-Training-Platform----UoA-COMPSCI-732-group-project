// localStorageHelpers.js
// Helper functions for localStorage operations

const LEGACY_CODE_KEY_PREFIX = "editorCode_";
const LANGUAGE_KEY_PREFIX = "editorLanguage_";
const LANGUAGE_DRAFT_KEY_PREFIX = "leetcode_clone_problem_";

const getLegacyCodeKey = (problemId) => `${LEGACY_CODE_KEY_PREFIX}${problemId}`;
const getLanguagePreferenceKey = (problemId) => `${LANGUAGE_KEY_PREFIX}${problemId}`;

const normalizeStoredLanguage = (language) => {
  const normalized = language?.trim().toLowerCase();

  switch (normalized) {
    case "py":
    case "python3":
      return "python";
    case "js":
      return "javascript";
    case "c++":
      return "cpp";
    case "c#":
      return "csharp";
    default:
      return normalized || "";
  }
};

const getLanguageDraftKey = (problemId, language, languageMap = {}) => {
  const languageId = getLanguageIdFromName(language, languageMap);
  return `${LANGUAGE_DRAFT_KEY_PREFIX}${problemId}_lang_${languageId}`;
};

export const getEditorLanguagePreference = (problemId) => {
  if (!problemId) {
    return null;
  }

  return localStorage.getItem(getLanguagePreferenceKey(problemId));
};

export const saveEditorLanguagePreference = (problemId, language) => {
  if (!problemId || !language) {
    return;
  }

  localStorage.setItem(getLanguagePreferenceKey(problemId), language);
};

/**
 * Save code to localStorage with problem ID and language
 * @param {string|number} problemId - The problem ID
 * @param {string} language - The programming language name
 * @param {string} code - The code to save
 * @param {Object} languageMap - Map of language name to languageId
 */
export const saveCodeToLocalStorage = (problemId, language, code, languageMap = {}) => {
  try {
    if (!problemId) {
      console.warn('Cannot save code: Problem ID is missing');
      return;
    }

    saveEditorLanguagePreference(problemId, language);

    // Persist code only in the language-specific key. The legacy shared code key
    // is no longer written because it caused cross-language draft pollution.
    const key = getLanguageDraftKey(problemId, language, languageMap);
    localStorage.setItem(key, code);
  } catch (error) {
    console.error('Error saving code to localStorage:', error);
  }
};

/**
 * Get code draft presence from localStorage for a specific problem and language.
 * It distinguishes between "no draft yet" and "draft exists but is empty".
 * @param {string|number} problemId - The problem ID
 * @param {string} language - The programming language name
 * @param {Object} languageMap - Map of language name to languageId
 * @returns {{ exists: boolean, code: string }} - The draft state
 */
export const getCodeDraftFromLocalStorage = (problemId, language, languageMap = {}) => {
  try {
    if (!problemId) {
      return { exists: false, code: '' };
    }

    // First try the language-specific draft.
    const key = getLanguageDraftKey(problemId, language, languageMap);
    const savedCode = localStorage.getItem(key);

    if (savedCode !== null) {
      return { exists: true, code: savedCode };
    }

    // Backward compatibility: migrate the old shared draft only when it belongs
    // to the same language the user is opening now.
    const legacyCode = localStorage.getItem(getLegacyCodeKey(problemId));
    const legacyLanguage = getEditorLanguagePreference(problemId);

    if (
      legacyCode !== null &&
      legacyLanguage &&
      normalizeStoredLanguage(legacyLanguage) === normalizeStoredLanguage(language)
    ) {
      localStorage.setItem(key, legacyCode);
      return { exists: true, code: legacyCode };
    }

    return { exists: false, code: '' };
  } catch (error) {
    console.error('Error retrieving code from localStorage:', error);
    return { exists: false, code: '' };
  }
};

/**
 * Get code from localStorage for a specific problem and language
 * @param {string|number} problemId - The problem ID
 * @param {string} language - The programming language name
 * @param {Object} languageMap - Map of language name to languageId
 * @returns {string} - The saved code or empty string if not found
 */
export const getCodeFromLocalStorage = (problemId, language, languageMap = {}) =>
  getCodeDraftFromLocalStorage(problemId, language, languageMap).code;

/**
 * Convert language name to language ID using a dynamic map
 * @param {string} langName - The language name
 * @param {Object} languageMap - Map of language name to languageId
 * @returns {number} - The language ID
 */
export const getLanguageIdFromName = (langName, languageMap = {}) => {
  if (!langName) return 1;
  
  if (!languageMap || Object.keys(languageMap).length === 0) {
    return 1; // Default to Python (ID: 1) as fallback
  }
  
  const normalizedName = langName.toLowerCase();
  // Handle specific cases like 'c++' vs 'cpp'
  if (normalizedName === 'c++' && languageMap['cpp']) {
    return languageMap['cpp'];
  } else if (normalizedName === 'cpp' && languageMap['c++']) {
    return languageMap['c++'];
  }
  const resolvedId = (() => {
    if (normalizedName === 'c++' && languageMap['cpp']) return languageMap['cpp'];
    if (normalizedName === 'cpp' && languageMap['c++']) return languageMap['c++'];
    return languageMap[normalizedName] || 1;
  })();

  return resolvedId;
};

/**
 * Clear all code saved for a specific problem
 * @param {string|number} problemId - The problem ID to clear
 */
export const clearProblemCode = (problemId) => {
  try {
    if (!problemId) return;
    
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Find all keys related to this problem
    const problemKeys = keys.filter(key => 
      key === getLegacyCodeKey(problemId) || 
      key === getLanguagePreferenceKey(problemId) ||
      key.startsWith(`leetcode_clone_problem_${problemId}_lang_`)
    );
    
    // Remove all related keys
    problemKeys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing problem code from localStorage:', error);
  }
};
