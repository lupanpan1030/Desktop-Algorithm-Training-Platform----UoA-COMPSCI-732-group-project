// localStorageHelpers.js
// Helper functions for localStorage operations

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
    
    // Save in the legacy format for backward compatibility
    localStorage.setItem(`editorCode_${problemId}`, code);
    localStorage.setItem(`editorLanguage_${problemId}`, language);
    
    // And save in the new format with language ID
    const languageId = getLanguageIdFromName(language, languageMap);
    const key = `leetcode_clone_problem_${problemId}_lang_${languageId}`;
    localStorage.setItem(key, code);
  } catch (error) {
    console.error('Error saving code to localStorage:', error);
  }
};

/**
 * Get code from localStorage for a specific problem and language
 * @param {string|number} problemId - The problem ID
 * @param {string} language - The programming language name
 * @param {Object} languageMap - Map of language name to languageId
 * @returns {string} - The saved code or empty string if not found
 */
export const getCodeFromLocalStorage = (problemId, language, languageMap = {}) => {
  try {
    if (!problemId) {
      return '';
    }
    
    // First try the new format with language ID
    const languageId = getLanguageIdFromName(language, languageMap);
    const key = `leetcode_clone_problem_${problemId}_lang_${languageId}`;
    const savedCode = localStorage.getItem(key);
    
    // If not found, fall back to legacy format
    if (savedCode === null) {
      return localStorage.getItem(`editorCode_${problemId}`) || '';
    }
    
    return savedCode;
  } catch (error) {
    console.error('Error retrieving code from localStorage:', error);
    return '';
  }
};

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
      key === `editorCode_${problemId}` || 
      key === `editorLanguage_${problemId}` ||
      key.startsWith(`leetcode_clone_problem_${problemId}_lang_`)
    );
    
    // Remove all related keys
    problemKeys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing problem code from localStorage:', error);
  }
};
