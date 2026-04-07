import { beforeEach, describe, expect, it } from "vitest";
import {
  getDefaultLauncherPreferences,
  launcherStorageKey,
  readStoredLauncherState,
  resolveLauncherAnchor,
} from "../../../frontend/ai/assistantLauncherPreferences";

describe("assistantLauncherPreferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads legacy anchor-only storage and upgrades it with default preferences", () => {
    window.localStorage.setItem(
      launcherStorageKey,
      JSON.stringify({
        side: "left",
        y: 180,
      })
    );

    const state = readStoredLauncherState(900);

    expect(state).toEqual({
      anchor: {
        side: "left",
        y: 180,
      },
      preferences: getDefaultLauncherPreferences(),
    });
  });

  it("resolves fixed side and vertical preferences without losing the remembered anchor", () => {
    const resolved = resolveLauncherAnchor(
      {
        side: "left",
        y: 210,
      },
      {
        sidePreference: "right",
        verticalPreference: "bottom",
      },
      900
    );

    expect(resolved.side).toBe("right");
    expect(resolved.y).toBeGreaterThan(700);
  });
});
