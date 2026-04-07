export const launcherStorageKey = "global-ai-assistant-launcher-v1";
export const launcherSize = 64;
export const desktopLauncherInset = 24;

export type LauncherSide = "left" | "right";
export type LauncherSidePreference = "follow" | "left" | "right";
export type LauncherVerticalPreference = "remember" | "top" | "middle" | "bottom";

export type LauncherAnchor = {
  side: LauncherSide;
  y: number;
};

export type LauncherPreferences = {
  sidePreference: LauncherSidePreference;
  verticalPreference: LauncherVerticalPreference;
};

export type StoredLauncherState = {
  anchor: LauncherAnchor;
  preferences: LauncherPreferences;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampLauncherY(y: number, viewportHeight: number) {
  return clamp(
    y,
    desktopLauncherInset,
    Math.max(desktopLauncherInset, viewportHeight - launcherSize - desktopLauncherInset)
  );
}

export function getDefaultLauncherPreferences(): LauncherPreferences {
  return {
    sidePreference: "follow",
    verticalPreference: "remember",
  };
}

export function resolveVerticalAnchorY(
  preference: LauncherVerticalPreference,
  rememberedY: number,
  viewportHeight: number
) {
  const safeViewportHeight = Math.max(viewportHeight, launcherSize + desktopLauncherInset * 2);

  switch (preference) {
    case "top":
      return desktopLauncherInset;
    case "middle":
      return clampLauncherY((safeViewportHeight - launcherSize) / 2, safeViewportHeight);
    case "bottom":
      return clampLauncherY(
        safeViewportHeight - launcherSize - desktopLauncherInset,
        safeViewportHeight
      );
    default:
      return clampLauncherY(rememberedY, safeViewportHeight);
  }
}

export function resolveLauncherAnchor(
  anchor: LauncherAnchor,
  preferences: LauncherPreferences,
  viewportHeight: number
): LauncherAnchor {
  return {
    side:
      preferences.sidePreference === "follow"
        ? anchor.side
        : preferences.sidePreference,
    y: resolveVerticalAnchorY(preferences.verticalPreference, anchor.y, viewportHeight),
  };
}

export function getDefaultLauncherAnchor(viewportHeight: number): LauncherAnchor {
  return {
    side: "right",
    y: resolveVerticalAnchorY("bottom", 0, viewportHeight),
  };
}

export function getDefaultLauncherState(viewportHeight: number): StoredLauncherState {
  return {
    anchor: getDefaultLauncherAnchor(viewportHeight),
    preferences: getDefaultLauncherPreferences(),
  };
}

export function readStoredLauncherState(viewportHeight: number) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(launcherStorageKey);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as
      | Partial<StoredLauncherState>
      | Partial<LauncherAnchor>
      | null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const parsedAnchor: Partial<LauncherAnchor> =
      "anchor" in parsed && parsed.anchor && typeof parsed.anchor === "object"
        ? (parsed.anchor as Partial<LauncherAnchor>)
        : (parsed as Partial<LauncherAnchor>);
    const side = parsedAnchor.side === "left" || parsedAnchor.side === "right"
      ? parsedAnchor.side
      : null;
    const y = typeof parsedAnchor.y === "number" ? parsedAnchor.y : null;

    if (!side || y == null) {
      return null;
    }

    const parsedPreferences: Partial<LauncherPreferences> =
      "preferences" in parsed && parsed.preferences && typeof parsed.preferences === "object"
        ? (parsed.preferences as Partial<LauncherPreferences>)
        : {};

    const defaultPreferences = getDefaultLauncherPreferences();

    return {
      anchor: {
        side,
        y: clampLauncherY(y, viewportHeight),
      },
      preferences: {
        sidePreference:
          parsedPreferences.sidePreference === "left" ||
          parsedPreferences.sidePreference === "right" ||
          parsedPreferences.sidePreference === "follow"
            ? parsedPreferences.sidePreference
            : defaultPreferences.sidePreference,
        verticalPreference:
          parsedPreferences.verticalPreference === "top" ||
          parsedPreferences.verticalPreference === "middle" ||
          parsedPreferences.verticalPreference === "bottom" ||
          parsedPreferences.verticalPreference === "remember"
            ? parsedPreferences.verticalPreference
            : defaultPreferences.verticalPreference,
      },
    } satisfies StoredLauncherState;
  } catch {
    return null;
  }
}

export function persistLauncherState(state: StoredLauncherState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(launcherStorageKey, JSON.stringify(state));
}
