import { beforeEach, describe, expect, it } from "vitest";
import {
  getCodeDraftFromLocalStorage,
  getEditorLanguagePreference,
  saveCodeToLocalStorage,
} from "../../../frontend/utils/localStorageHelper";

describe("localStorageHelper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores drafts in language-specific keys without rewriting the legacy shared code key", () => {
    saveCodeToLocalStorage(42, "python", "print(1)", { python: 1 });

    expect(localStorage.getItem("editorLanguage_42")).toBe("python");
    expect(localStorage.getItem("editorCode_42")).toBeNull();
    expect(localStorage.getItem("leetcode_clone_problem_42_lang_python")).toBe("print(1)");
  });

  it("treats an empty stored draft as an existing draft", () => {
    localStorage.setItem("editorLanguage_42", "python");
    localStorage.setItem("leetcode_clone_problem_42_lang_python", "");

    expect(getCodeDraftFromLocalStorage(42, "python", { python: 1 })).toEqual({
      exists: true,
      code: "",
    });
  });

  it("migrates legacy drafts only when the requested language matches the legacy language", () => {
    localStorage.setItem("editorLanguage_42", "python");
    localStorage.setItem("editorCode_42", "print(1)");

    expect(getCodeDraftFromLocalStorage(42, "python", { python: 1, javascript: 2 })).toEqual({
      exists: true,
      code: "print(1)",
    });
    expect(localStorage.getItem("leetcode_clone_problem_42_lang_python")).toBe("print(1)");

    expect(
      getCodeDraftFromLocalStorage(42, "javascript", {
        python: 1,
        javascript: 2,
      })
    ).toEqual({
      exists: false,
      code: "",
    });
    expect(localStorage.getItem("leetcode_clone_problem_42_lang_javascript")).toBeNull();
    expect(getEditorLanguagePreference(42)).toBe("python");
  });

  it("migrates older language-id drafts when language metadata is available", () => {
    localStorage.setItem("leetcode_clone_problem_42_lang_4", "print(42)");

    expect(getCodeDraftFromLocalStorage(42, "cpp", { cpp: 4 })).toEqual({
      exists: true,
      code: "print(42)",
    });
    expect(localStorage.getItem("leetcode_clone_problem_42_lang_cpp")).toBe("print(42)");
  });

  it("does not treat an unknown language as the legacy Python draft key", () => {
    localStorage.setItem("leetcode_clone_problem_42_lang_1", "print('python')");

    expect(
      getCodeDraftFromLocalStorage(42, "haskell", {
        python: 1,
        javascript: 2,
      })
    ).toEqual({
      exists: false,
      code: "",
    });
    expect(localStorage.getItem("leetcode_clone_problem_42_lang_haskell")).toBeNull();
  });
});
