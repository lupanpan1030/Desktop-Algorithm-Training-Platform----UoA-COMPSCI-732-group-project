import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AiSettings from "../../../frontend/pages/AiSettings";
import { AiSettings as AiSettingsSnapshot, useApi } from "../../../frontend/hooks/useApi";

vi.mock("../../../frontend/hooks/useApi", () => ({
  useApi: vi.fn(),
}));

const baseSettings: AiSettingsSnapshot = {
  provider: "openai" as const,
  apiFormat: "responses" as const,
  model: "gpt-5-mini",
  baseUrl: "https://api.openai.com/v1",
  timeoutMs: 30000,
  apiKeyConfigured: false,
  apiKeySource: "none" as const,
  apiKeyPreview: null,
  status: "misconfigured" as const,
  statusLabel: "Needs API key",
  statusReason: "A live AI endpoint is selected, but no API key is available yet.",
  storagePath: "/tmp/ai-settings.json",
  storageScope: "Local test settings.",
};

describe("AiSettings", () => {
  const getAiSettings = vi.fn();
  const updateAiSettings = vi.fn();
  const testAiSettings = vi.fn();

  beforeEach(() => {
    getAiSettings.mockResolvedValue(baseSettings);
    updateAiSettings.mockResolvedValue({
      ...baseSettings,
      apiFormat: "chat_completions",
    });
    testAiSettings.mockResolvedValue({
      ok: true,
      status: "preview",
      message: "Preview",
      provider: "mock",
      apiFormat: "responses",
      model: "gpt-5-mini",
      baseUrl: "https://api.openai.com/v1",
      credentialSource: "none",
    });
    vi.mocked(useApi).mockReturnValue({
      getAiSettings,
      updateAiSettings,
      testAiSettings,
    } as unknown as ReturnType<typeof useApi>);
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("saves the selected Chat Completions-compatible API format", async () => {
    render(<AiSettings />);

    await screen.findByRole("heading", { name: "AI provider and credentials" });
    const saveButton = screen.getByRole("button", { name: "Save settings" });

    expect((saveButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Chat Completions" }));

    await waitFor(() => {
      expect((saveButton as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateAiSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "openai",
          apiFormat: "chat_completions",
          model: "gpt-5-mini",
          baseUrl: "https://api.openai.com/v1",
          timeoutMs: 30000,
        })
      );
    });
  });
});
