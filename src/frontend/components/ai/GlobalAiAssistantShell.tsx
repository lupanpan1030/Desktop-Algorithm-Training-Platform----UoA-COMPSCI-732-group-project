import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Box,
  ButtonBase,
  Chip,
  Divider,
  Fade,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useGlobalAiAssistant } from "../../ai/GlobalAiAssistantProvider";
import { buildAssistantCards } from "../../ai/assistantCards";
import { buildContextReliability } from "../../ai/contextReliability";
import {
  clamp,
  clampLauncherY,
  desktopLauncherInset,
  getDefaultLauncherState,
  LauncherAnchor,
  LauncherPreferences,
  persistLauncherState,
  readStoredLauncherState,
  resolveLauncherAnchor,
  launcherSize,
} from "../../ai/assistantLauncherPreferences";

const panelWidth = 432;
const launcherCollapsedWidth = 58;
const mobileLauncherInset = 14;
const launcherDragThreshold = 6;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  width: number;
  moved: boolean;
};

function buildAssistantStateLabel(
  pending: boolean,
  error: string | null,
  suggestionCount: number
) {
  if (pending) {
    return "Thinking";
  }
  if (error) {
    return "Check connection";
  }
  if (suggestionCount > 0) {
    return "Ready to help";
  }
  return "On this page";
}

function buildLauncherLabel(pageTitle?: string) {
  if (!pageTitle) {
    return "Ask the companion";
  }

  return `Ask about ${pageTitle}`;
}

function buildContextFreshnessLabel(updatedAt: number | null) {
  if (!updatedAt || typeof Date.now !== "function") {
    return "Context pending";
  }

  const elapsedMs = Math.max(0, Date.now() - updatedAt);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  if (elapsedSeconds < 10) {
    return "Context just updated";
  }

  if (elapsedSeconds < 60) {
    return `Updated ${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  return `Updated ${elapsedMinutes}m ago`;
}

function buildLauncherSideSummary(
  sidePreference: LauncherPreferences["sidePreference"]
) {
  switch (sidePreference) {
    case "left":
      return "Locked to the left edge";
    case "right":
      return "Locked to the right edge";
    default:
      return "Follows your last drag";
  }
}

function buildLauncherHeightSummary(
  verticalPreference: LauncherPreferences["verticalPreference"]
) {
  switch (verticalPreference) {
    case "top":
      return "Pinned near the top";
    case "middle":
      return "Pinned near the middle";
    case "bottom":
      return "Pinned near the bottom";
    default:
      return "Keeps the last vertical drop point";
  }
}

export default function GlobalAiAssistantShell() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === "undefined" ? 900 : window.innerHeight
  );
  const initialLauncherState = useMemo(
    () =>
      readStoredLauncherState(viewportHeight) ??
      getDefaultLauncherState(viewportHeight),
    [viewportHeight]
  );
  const [hovered, setHovered] = useState(false);
  const [input, setInput] = useState("");
  const [launcherAnchor, setLauncherAnchor] = useState<LauncherAnchor>(
    () => initialLauncherState.anchor
  );
  const [launcherPreferences, setLauncherPreferences] =
    useState<LauncherPreferences>(() => initialLauncherState.preferences);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [pageContextUpdatedAt, setPageContextUpdatedAt] = useState<number | null>(null);
  const [, setFreshnessTick] = useState(0);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const {
    open,
    pending,
    error,
    pageContext,
    suggestions,
    messages,
    threadSummaries,
    restoredConversation,
    openAssistant,
    closeAssistant,
    clearConversation,
    forgetConversation,
    applySuggestedPrompt,
  } = useGlobalAiAssistant();

  const launcherLabel = useMemo(
    () => buildLauncherLabel(pageContext?.pageTitle),
    [pageContext?.pageTitle]
  );
  const assistantStateLabel = useMemo(
    () => buildAssistantStateLabel(pending, error, suggestions.length),
    [error, pending, suggestions.length]
  );
  const contextReliability = useMemo(
    () =>
      buildContextReliability({
        pageContext,
        pending,
        error,
        restoredConversation,
      }),
    [error, pageContext, pending, restoredConversation]
  );
  const contextFreshnessLabel = buildContextFreshnessLabel(pageContextUpdatedAt);
  const visibleFacts = useMemo(() => (pageContext?.facts ?? []).slice(0, 2), [pageContext?.facts]);
  const visibleThreads = useMemo(
    () => threadSummaries.slice(0, 4),
    [threadSummaries]
  );
  const isProblemListPage = pageContext?.pageKind === "problem-list";
  const isDenseAdminPage =
    pageContext?.pageKind === "problem-admin" || pageContext?.pageKind === "language-admin";
  const shouldExpandLauncher = !compact && !open && (hovered || Boolean(dragState));
  const launcherWidth = compact
    ? launcherSize
    : dragState
      ? dragState.width
      : shouldExpandLauncher
        ? isDenseAdminPage
          ? 164
          : isProblemListPage
            ? 176
            : 248
        : launcherCollapsedWidth;
  const launcherCtaLabel =
    isProblemListPage || isDenseAdminPage ? "Quick help" : launcherLabel;
  const resolvedLauncherAnchor = useMemo(
    () => resolveLauncherAnchor(launcherAnchor, launcherPreferences, viewportHeight),
    [launcherAnchor, launcherPreferences, viewportHeight]
  );
  const panelSide = resolvedLauncherAnchor.side;
  const canDragHorizontally = launcherPreferences.sidePreference === "follow";
  const canDragVertically = launcherPreferences.verticalPreference === "remember";
  const canDragLauncher = !compact && !open && (canDragHorizontally || canDragVertically);
  const launcherSideSummary = buildLauncherSideSummary(
    launcherPreferences.sidePreference
  );
  const launcherHeightSummary = buildLauncherHeightSummary(
    launcherPreferences.verticalPreference
  );

  const commitDragState = (nextState: DragState | null) => {
    dragStateRef.current = nextState;
    setDragState(nextState);
  };

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const nextMessage = input;
    setInput("");
    await applySuggestedPrompt(nextMessage);
  };

  const handleOpenThread = (route: string) => {
    if (!route) {
      return;
    }

    if (typeof window !== "undefined" && pageContext?.route !== route) {
      const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
      if (window.location.hash !== `#${normalizedRoute}`) {
        window.location.hash = normalizedRoute;
      }
    }

    openAssistant();
  };

  const handleLauncherClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    openAssistant();
  };

  const handleResetLauncherPosition = () => {
    if (compact) {
      return;
    }

    const nextState = getDefaultLauncherState(viewportHeight);
    setLauncherAnchor(nextState.anchor);
    setLauncherPreferences(nextState.preferences);
    commitDragState(null);
    setHovered(false);
  };

  const finalizeDrag = (pointerId?: number) => {
    const activeDragState = dragStateRef.current;

    if (!activeDragState || typeof window === "undefined") {
      return;
    }

    if (pointerId != null && activeDragState.pointerId !== pointerId) {
      return;
    }

    setLauncherAnchor({
      side:
        launcherPreferences.sidePreference === "follow"
          ? (activeDragState.x + activeDragState.width / 2 >= window.innerWidth / 2
              ? "right"
              : "left")
          : launcherAnchor.side,
      y:
        launcherPreferences.verticalPreference === "remember"
          ? clampLauncherY(activeDragState.y, window.innerHeight)
          : launcherAnchor.y,
    });
    suppressClickRef.current = activeDragState.moved;
    commitDragState(null);
  };

  const handleLauncherPreferenceChange =
    <T extends keyof LauncherPreferences>(field: T) =>
    (
      _event: React.MouseEvent<HTMLElement>,
      nextValue: LauncherPreferences[T] | null
    ) => {
      if (!nextValue) {
        return;
      }

      setLauncherPreferences((current) => ({
        ...current,
        [field]: nextValue,
      }));
      commitDragState(null);
      setHovered(false);
    };

  const handleLauncherPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (!canDragLauncher) {
      return;
    }

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    suppressClickRef.current = false;
    setHovered(false);
    target.setPointerCapture(event.pointerId);
    commitDragState({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      moved: false,
    });
  };

  const handleLauncherPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    const activeDragState = dragStateRef.current;
    if (!activeDragState || !canDragLauncher || typeof window === "undefined") {
      return;
    }

    if (activeDragState.pointerId !== event.pointerId) {
      return;
    }

    const nextState: DragState = {
      ...activeDragState,
      x: canDragHorizontally
        ? clamp(
            event.clientX - activeDragState.offsetX,
            desktopLauncherInset,
            Math.max(
              desktopLauncherInset,
              window.innerWidth - activeDragState.width - desktopLauncherInset
            )
          )
        : activeDragState.x,
      y: canDragVertically
        ? clampLauncherY(
            event.clientY - activeDragState.offsetY,
            window.innerHeight
          )
        : activeDragState.y,
      moved:
        activeDragState.moved ||
        (canDragHorizontally &&
          Math.abs(event.clientX - activeDragState.startX) > launcherDragThreshold) ||
        (canDragVertically &&
          Math.abs(event.clientY - activeDragState.startY) > launcherDragThreshold),
    };

    commitDragState(nextState);
  };

  const handleLauncherPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (!compact && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    finalizeDrag(event.pointerId);
  };

  const handleLauncherPointerCancel = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (!compact && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    finalizeDrag(event.pointerId);
  };

  useEffect(() => {
    if (!pageContext) {
      setPageContextUpdatedAt(null);
      return;
    }

    setPageContextUpdatedAt(Date.now());
  }, [pageContext]);

  useEffect(() => {
    if (!pageContextUpdatedAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setFreshnessTick((current) => current + 1);
    }, 15_000);

    return () => window.clearInterval(intervalId);
  }, [pageContextUpdatedAt]);

  useEffect(() => {
    if (compact || typeof window === "undefined") {
      return;
    }

    persistLauncherState({
      anchor: launcherAnchor,
      preferences: launcherPreferences,
    });
  }, [compact, launcherAnchor, launcherPreferences]);

  useEffect(() => {
    if (compact || typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setLauncherAnchor((currentAnchor) => ({
        ...currentAnchor,
        y: clampLauncherY(currentAnchor.y, window.innerHeight),
      }));

      const activeDragState = dragStateRef.current;
      if (!activeDragState) {
        return;
      }

      commitDragState({
        ...activeDragState,
        x: clamp(
          activeDragState.x,
          desktopLauncherInset,
          Math.max(
            desktopLauncherInset,
            window.innerWidth - activeDragState.width - desktopLauncherInset
          )
        ),
        y: clampLauncherY(activeDragState.y, window.innerHeight),
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [compact]);

  function formatThreadTime(updatedAt: number) {
    if (!updatedAt) {
      return "Saved";
    }

    const elapsedMs = Math.max(0, Date.now() - updatedAt);
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    if (elapsedMinutes < 1) {
      return "Just now";
    }
    if (elapsedMinutes < 60) {
      return `${elapsedMinutes}m ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return `${elapsedHours}h ago`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays}d ago`;
  }

  const companionPanel = (
    <Stack
      sx={{
        height: "100%",
        minHeight: 0,
        bgcolor: "transparent",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          pt: 2.25,
          pb: 1.5,
          background: `linear-gradient(160deg, ${alpha(
            theme.palette.secondary.light,
            theme.palette.mode === "dark" ? 0.16 : 0.22
          )} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: theme.palette.common.white,
                background: `linear-gradient(145deg, ${theme.palette.secondary.main}, ${theme.palette.success.main})`,
                boxShadow: `0 14px 32px ${alpha(theme.palette.secondary.main, 0.35)}`,
                position: "relative",
                "&::after": pending
                  ? {
                      content: '""',
                      position: "absolute",
                      inset: -6,
                      borderRadius: "50%",
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`,
                    }
                  : undefined,
              }}
            >
              {pending ? <AutoAwesomeIcon /> : <SmartToyOutlinedIcon />}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                {pageContext?.pageTitle ?? "Global AI Assistant"}
              </Typography>
              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 0.45 }}>
                <Typography variant="body2" color="text.secondary">
                  {assistantStateLabel}
                </Typography>
                <Chip size="small" label={contextFreshnessLabel} variant="outlined" />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <IconButton
              aria-label="clear assistant conversation"
              onClick={clearConversation}
              disabled={messages.length === 0}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="close ai assistant" onClick={closeAssistant}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.68),
            backdropFilter: "blur(14px)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {pageContext?.summary ??
              "Open any page and the companion will describe what you are looking at."}
          </Typography>
          {(pageContext?.locale || visibleFacts.length > 0) && (
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 1.25 }}
            >
              {pageContext?.locale && (
                <Chip size="small" label={pageContext.locale} variant="outlined" />
              )}
              {visibleFacts.map((fact) => (
                <Chip
                  key={fact.key}
                  size="small"
                  label={`${fact.label}: ${fact.value}`}
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            mt: 1.15,
            p: 1.15,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.54),
            borderColor:
              contextReliability.tone === "success"
                ? alpha(theme.palette.success.main, 0.22)
                : contextReliability.tone === "warning"
                  ? alpha(theme.palette.warning.main, 0.22)
                  : alpha(theme.palette.divider, 0.24),
          }}
        >
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" alignItems="center">
            <Chip
              size="small"
              label={contextReliability.label}
              color={
                contextReliability.tone === "success"
                  ? "success"
                  : contextReliability.tone === "warning"
                    ? "warning"
                    : contextReliability.tone === "info"
                      ? "info"
                      : "default"
              }
              variant={contextReliability.tone === "default" ? "outlined" : "filled"}
            />
            {restoredConversation && (
              <Chip size="small" label="Restored thread" variant="outlined" />
            )}
            {threadSummaries.length > 1 && (
              <Chip size="small" label={`${threadSummaries.length} saved threads`} variant="outlined" />
            )}
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.8, display: "block", lineHeight: 1.45 }}
          >
            {contextReliability.detail}
          </Typography>
        </Paper>

        {!compact && (
          <Paper
            variant="outlined"
            sx={{
              mt: 1.15,
              p: 1.15,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.54),
              borderColor: alpha(theme.palette.divider, 0.24),
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Launcher placement
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 700 }}>
                  Tune where the desktop helper lives
                </Typography>
              </Box>
              <ButtonBase
                onClick={handleResetLauncherPosition}
                sx={{
                  px: 1,
                  py: 0.55,
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.3),
                  cursor: "pointer",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Reset
                </Typography>
              </ButtonBase>
            </Stack>

            <Stack spacing={1} sx={{ mt: 1.1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Side
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={launcherPreferences.sidePreference}
                  onChange={handleLauncherPreferenceChange("sidePreference")}
                  sx={{ mt: 0.6, display: "flex", flexWrap: "wrap", gap: 0.6 }}
                >
                  <ToggleButton value="follow">Follow</ToggleButton>
                  <ToggleButton value="left">Left</ToggleButton>
                  <ToggleButton value="right">Right</ToggleButton>
                </ToggleButtonGroup>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.55, display: "block", lineHeight: 1.4 }}
                >
                  {launcherSideSummary}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Height
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={launcherPreferences.verticalPreference}
                  onChange={handleLauncherPreferenceChange("verticalPreference")}
                  sx={{ mt: 0.6, display: "flex", flexWrap: "wrap", gap: 0.6 }}
                >
                  <ToggleButton value="remember">Remember</ToggleButton>
                  <ToggleButton value="top">Top</ToggleButton>
                  <ToggleButton value="middle">Middle</ToggleButton>
                  <ToggleButton value="bottom">Bottom</ToggleButton>
                </ToggleButtonGroup>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.55, display: "block", lineHeight: 1.4 }}
                >
                  {launcherHeightSummary}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {visibleThreads.length > 1 && (
          <Paper
            variant="outlined"
            sx={{
              mt: 1.15,
              p: 1.15,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.54),
              borderColor: alpha(theme.palette.divider, 0.24),
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Recent Threads
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 700 }}>
                  Resume another route conversation
                </Typography>
              </Box>
              <Chip size="small" label={visibleThreads.length} variant="outlined" />
            </Stack>

            <Stack spacing={0.8} sx={{ mt: 1.05 }}>
              {visibleThreads.map((thread) => {
                const isActiveThread = thread.route === pageContext?.route;

                return (
                  <Paper
                    key={thread.route}
                    variant="outlined"
                    sx={{
                      p: 0.8,
                      borderRadius: 2.6,
                      bgcolor: isActiveThread
                        ? alpha(theme.palette.secondary.main, 0.08)
                        : alpha(theme.palette.background.default, 0.42),
                      borderColor: isActiveThread
                        ? alpha(theme.palette.secondary.main, 0.26)
                        : alpha(theme.palette.divider, 0.18),
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="stretch">
                      <ButtonBase
                        onClick={() => handleOpenThread(thread.route)}
                        sx={{
                          flex: 1,
                          px: 0.65,
                          py: 0.45,
                          borderRadius: 2,
                          alignItems: "flex-start",
                          justifyContent: "flex-start",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                            useFlexGap
                            flexWrap="wrap"
                          >
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary" }}>
                              {thread.pageTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatThreadTime(thread.updatedAt)}
                            </Typography>
                            {isActiveThread && (
                              <Chip size="small" label="Current" color="secondary" variant="outlined" />
                            )}
                          </Stack>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              mt: 0.35,
                              display: "block",
                              lineHeight: 1.4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {thread.preview}
                          </Typography>
                        </Box>
                      </ButtonBase>

                      <IconButton
                        aria-label={`forget conversation for ${thread.pageTitle}`}
                        onClick={() => forgetConversation(thread.route)}
                        sx={{ alignSelf: "center" }}
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2, minHeight: 0 }}>
        <Stack spacing={1.5}>
          {messages.length > 0 &&
            messages.map((message) => (
              <Paper
                key={message.id}
                variant="outlined"
                sx={{
                  p: 1.6,
                  ml: message.role === "assistant" ? 0 : { xs: 2, sm: 6 },
                  mr: message.role === "assistant" ? { xs: 2, sm: 4 } : 0,
                  borderRadius: 3,
                  bgcolor:
                    message.role === "assistant"
                      ? alpha(theme.palette.background.paper, 0.8)
                      : alpha(theme.palette.secondary.light, 0.18),
                  borderColor:
                    message.role === "assistant"
                      ? alpha(theme.palette.divider, 0.9)
                      : alpha(theme.palette.secondary.main, 0.25),
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {message.role === "assistant" ? "Companion" : "You"}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}>
                  {message.content}
                </Typography>
                {message.role === "assistant" && (() => {
                  const cards = buildAssistantCards(message);
                  if (!cards.length) {
                    return null;
                  }

                  return (
                    <Box
                      sx={{
                        mt: 1.35,
                        display: "grid",
                        gap: 1,
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: cards.length > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr",
                        },
                      }}
                    >
                      {cards.map((card) => (
                        <Paper
                          key={`${message.id}-${card.id}`}
                          variant="outlined"
                          sx={{
                            p: 1.1,
                            borderRadius: 2.6,
                            bgcolor: alpha(theme.palette.background.default, 0.48),
                            borderColor: alpha(theme.palette.secondary.main, 0.12),
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ display: "block", color: "text.secondary", lineHeight: 1.2 }}
                          >
                            {card.title}
                          </Typography>
                          <Stack spacing={0.55} sx={{ mt: 0.7 }}>
                            {card.entries.map((entry) => (
                              <Typography
                                key={entry}
                                variant="caption"
                                sx={{ color: "text.primary", lineHeight: 1.45 }}
                              >
                                {entry}
                              </Typography>
                            ))}
                          </Stack>
                        </Paper>
                      ))}
                    </Box>
                  );
                })()}
              </Paper>
            ))}

          {error && (
            <Alert severity="error" variant="outlined" role="alert">
              {error}
            </Alert>
          )}
        </Stack>
      </Box>

      <Divider flexItem />

      <Box sx={{ p: 2.5 }}>
        {suggestions.length > 0 && (
          <Box sx={{ mb: 1.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.9 }}>
              Quick asks
            </Typography>
            <Stack direction="row" spacing={0.9} useFlexGap flexWrap="wrap">
              {suggestions.slice(0, 4).map((suggestion) => (
                <ButtonBase
                  key={suggestion.id}
                  onClick={() => void applySuggestedPrompt(suggestion.prompt)}
                  sx={{
                    px: 1.25,
                    py: 0.85,
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: alpha(theme.palette.secondary.main, 0.16),
                    bgcolor: alpha(theme.palette.background.paper, 0.68),
                    textAlign: "left",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    maxWidth: "100%",
                    transition:
                      "transform 160ms ease, border-color 160ms ease, background-color 160ms ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      borderColor: alpha(theme.palette.secondary.main, 0.34),
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.35,
                      color: "text.primary",
                    }}
                  >
                    {suggestion.label}
                  </Typography>
                </ButtonBase>
              ))}
            </Stack>
          </Box>
        )}

        <Paper
          variant="outlined"
          sx={{
            p: 1,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.background.paper, 0.82),
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              variant="standard"
              label="Ask about this page"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              InputProps={{ disableUnderline: true }}
            />
            <IconButton
              color="secondary"
              aria-label="send ai assistant message"
              onClick={() => void handleSend()}
              disabled={pending || !input.trim()}
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
              }}
            >
              <SendIcon />
            </IconButton>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          ...(compact
            ? {
                right: mobileLauncherInset,
                bottom: mobileLauncherInset,
              }
            : dragState
              ? {
                  left: dragState.x,
                  top: dragState.y,
                }
              : panelSide === "left"
                ? {
                    left: desktopLauncherInset,
                    top: resolvedLauncherAnchor.y,
                  }
                : {
                    right: desktopLauncherInset,
                    top: resolvedLauncherAnchor.y,
                  }),
          zIndex: theme.zIndex.drawer + 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          width: compact ? "auto" : launcherWidth,
        }}
      >
        <Paper
          component="button"
          type="button"
          aria-label="open ai assistant"
          onClick={handleLauncherClick}
          onMouseEnter={() => {
            if (!dragState) {
              setHovered(true);
            }
          }}
          onMouseLeave={() => setHovered(false)}
          onPointerDown={handleLauncherPointerDown}
          onPointerMove={handleLauncherPointerMove}
          onPointerUp={handleLauncherPointerUp}
          onPointerCancel={handleLauncherPointerCancel}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: shouldExpandLauncher ? "flex-start" : "center",
            gap: shouldExpandLauncher ? 1.1 : 0,
            width: launcherWidth,
            minWidth: launcherWidth,
            maxWidth: launcherWidth,
            px: compact ? 0 : shouldExpandLauncher ? 1.1 : 0,
            py: compact ? 0 : 1,
            height: launcherSize,
            borderRadius: 999,
            border: "1px solid",
            borderColor: alpha(theme.palette.secondary.main, 0.22),
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(16px)",
            boxShadow: `0 18px 46px ${alpha(theme.palette.common.black, 0.18)}`,
            cursor: compact
              ? "pointer"
              : dragState
                ? "grabbing"
                : canDragLauncher
                  ? "grab"
                  : open
                    ? "default"
                    : "pointer",
            overflow: "hidden",
            touchAction: compact || !canDragLauncher ? "auto" : "none",
            pointerEvents: open ? "none" : "auto",
            opacity: open ? 0 : compact ? 1 : 0.94,
            transform: open ? "scale(0.94)" : "translateY(0)",
            transition:
              dragState
                ? "none"
                : "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, width 180ms ease, opacity 180ms ease",
            "&:hover": {
              transform: compact || dragState ? undefined : "translateY(-2px)",
              borderColor: alpha(theme.palette.secondary.main, 0.38),
              boxShadow: `0 22px 52px ${alpha(theme.palette.secondary.main, 0.18)}`,
            },
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: theme.palette.common.white,
              background: `linear-gradient(145deg, ${theme.palette.secondary.main}, ${theme.palette.success.main})`,
              boxShadow: `0 10px 22px ${alpha(theme.palette.secondary.main, 0.28)}`,
              position: "relative",
              "&::after": hovered
                ? {
                    content: '""',
                    position: "absolute",
                    inset: -5,
                    borderRadius: "50%",
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.26)}`,
                  }
                : undefined,
            }}
          >
            {suggestions.length > 0 ? <AutoAwesomeIcon /> : <SmartToyOutlinedIcon />}
          </Box>

          {!compact && (
            <>
              {shouldExpandLauncher && (
                <Box sx={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                  {!isProblemListPage && !isDenseAdminPage && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "text.secondary", lineHeight: 1.1 }}
                    >
                      AI Companion
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {launcherCtaLabel}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>

      {compact ? (
        <Fade in={open} mountOnEnter unmountOnExit>
          <Box
            onClick={closeAssistant}
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: theme.zIndex.drawer + 3,
              p: 1.1,
              bgcolor: alpha(theme.palette.common.black, 0.24),
              backdropFilter: "blur(8px)",
            }}
          >
            <Paper
              role="dialog"
              aria-label="AI assistant"
              onClick={(event) => event.stopPropagation()}
              elevation={0}
              sx={{
                height: "100%",
                overflow: "hidden",
                borderRadius: 5,
                border: "1px solid",
                borderColor: alpha(theme.palette.secondary.main, 0.18),
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.background.default, 0.96)
                    : alpha(theme.palette.background.paper, 0.98),
                backdropFilter: "blur(20px)",
                boxShadow: `0 28px 72px ${alpha(theme.palette.common.black, 0.24)}`,
              }}
            >
              {companionPanel}
            </Paper>
          </Box>
        </Fade>
      ) : (
        <Fade in={open} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: "fixed",
              ...(panelSide === "left" ? { left: 24 } : { right: 24 }),
              bottom: 96,
              zIndex: theme.zIndex.drawer + 1,
              width: `min(${panelWidth}px, calc(100vw - 32px))`,
              height: "min(760px, calc(100vh - 132px))",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                overflow: "hidden",
                borderRadius: 6,
                border: "1px solid",
                borderColor: alpha(theme.palette.secondary.main, 0.16),
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.background.default, 0.94)
                    : alpha(theme.palette.background.paper, 0.96),
                backdropFilter: "blur(20px)",
                boxShadow: `0 30px 80px ${alpha(theme.palette.common.black, 0.22)}`,
              }}
            >
              {companionPanel}
            </Paper>
          </Box>
        </Fade>
      )}
    </>
  );
}
