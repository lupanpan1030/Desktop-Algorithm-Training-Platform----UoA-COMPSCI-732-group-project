import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CodeEditor from "../../../frontend/components/Editor/Editor";
import useApi from "../../../frontend/hooks/useApi";

const mockEditorState = vi.hoisted(() => ({
  latestHeaderProps: null,
}));

vi.mock("@monaco-editor/react", () => ({
  loader: {
    config: vi.fn(),
  },
  default: () => <div data-testid="monaco-editor" />,
}));

vi.mock("../../../frontend/hooks/useApi", () => ({
  default: vi.fn(),
  useApi: vi.fn(),
}));

vi.mock("../../../frontend/components/Editor/EditorHeader", () => ({
  default: (props) => {
    mockEditorState.latestHeaderProps = props;

    return (
      <div>
        <div data-testid="language-options">
          {props.languages.map((lang) => lang.name).join(", ")}
        </div>
        <div data-testid="language-error">{props.error?.message ?? ""}</div>
      </div>
    );
  },
}));

vi.mock("../../../frontend/components/Editor/MonacoConfig", () => ({
  default: () => <div data-testid="monaco-config" />,
}));

beforeEach(() => {
  localStorage.clear();
  mockEditorState.latestHeaderProps = null;
  vi.mocked(useApi).mockReturnValue({
    getLanguages: vi.fn().mockResolvedValue(null),
    loading: false,
    error: new Error("Network down"),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("Editor", () => {
  it("keeps the built-in fallback language list when the language request fails", async () => {
    render(<CodeEditor problemId={1} starterCodes={[]} />);

    await waitFor(() => {
      expect(screen.getByTestId("language-options")).toHaveTextContent(
        "Python, JavaScript, Java, C++"
      );
      expect(screen.getByTestId("language-error")).toHaveTextContent(
        "Network down"
      );
    });
  });
});
