import React, { useMemo, useState } from "react";
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
  Drawer,
  Fade,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useGlobalAiAssistant } from "../../ai/GlobalAiAssistantProvider";

const panelWidth = 432;

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

export default function GlobalAiAssistantShell() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const [hovered, setHovered] = useState(false);
  const [input, setInput] = useState("");
  const {
    open,
    pending,
    error,
    pageContext,
    suggestions,
    messages,
    openAssistant,
    closeAssistant,
    clearConversation,
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
  const visibleFacts = useMemo(() => (pageContext?.facts ?? []).slice(0, 2), [pageContext?.facts]);
  const isProblemListPage = pageContext?.pageKind === "problem-list";
  const isDenseAdminPage =
    pageContext?.pageKind === "problem-admin" || pageContext?.pageKind === "language-admin";

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const nextMessage = input;
    setInput("");
    await applySuggestedPrompt(nextMessage);
  };

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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                {assistantStateLabel}
              </Typography>
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
                {message.role === "assistant" && message.inferredIntent && (
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mt: 1.25 }}
                  >
                    <Chip size="small" label={message.inferredIntent} variant="outlined" />
                    {message.sourcesUsed?.slice(0, 2).map((source) => (
                      <Chip key={source} size="small" label={source} variant="outlined" />
                    ))}
                  </Stack>
                )}
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
          right: { xs: 14, md: 24 },
          bottom: { xs: 14, md: 24 },
          zIndex: theme.zIndex.drawer + 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          width: { xs: "auto", md: "min(360px, calc(100vw - 32px))" },
        }}
      >
        <Paper
          component="button"
          type="button"
          aria-label="open ai assistant"
          onClick={openAssistant}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            width: compact
              ? 64
              : open
                ? 74
                : isDenseAdminPage
                  ? hovered
                    ? 168
                    : 58
                  : isProblemListPage
                    ? 192
                    : 280,
            minWidth: compact
              ? 64
              : open
                ? 74
                : isDenseAdminPage
                  ? hovered
                    ? 168
                    : 58
                  : isProblemListPage
                    ? 152
                    : 220,
            maxWidth: compact
              ? 64
              : open
                ? 74
                : isDenseAdminPage
                  ? hovered
                    ? 168
                    : 58
                  : isProblemListPage
                    ? 192
                    : 280,
            px: compact || isDenseAdminPage ? 0 : 1.1,
            py: compact ? 0 : 1,
            height: 64,
            borderRadius: 999,
            border: "1px solid",
            borderColor: alpha(theme.palette.secondary.main, 0.22),
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(16px)",
            boxShadow: `0 18px 46px ${alpha(theme.palette.common.black, 0.18)}`,
            cursor: "pointer",
            overflow: "hidden",
            opacity: compact ? 1 : open ? 0.22 : isDenseAdminPage ? 0.68 : isProblemListPage ? 0.78 : 0.9,
            transition:
              "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, width 180ms ease, opacity 180ms ease",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: alpha(theme.palette.secondary.main, 0.38),
              boxShadow: `0 22px 52px ${alpha(theme.palette.secondary.main, 0.18)}`,
            },
          }}
        >
          <Box
            sx={{
              ml: compact || isDenseAdminPage ? 1.25 : 0,
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
              {!open && (!isDenseAdminPage || hovered) && (
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
                    {pageContext?.pageKind === "problem-list"
                      ? "Quick help"
                      : isDenseAdminPage
                        ? "Quick help"
                        : launcherLabel}
                  </Typography>
                </Box>
              )}

              {!open && !isProblemListPage && !isDenseAdminPage && (
                <Chip
                  size="small"
                  label={assistantStateLabel}
                  sx={{
                    mr: 0.5,
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    border: "1px solid",
                    borderColor: alpha(theme.palette.success.main, 0.18),
                  }}
                />
              )}
            </>
          )}
        </Paper>
      </Box>

      {compact ? (
        <Drawer
          anchor="right"
          open={open}
          onClose={closeAssistant}
          PaperProps={{
            sx: {
              width: "100%",
              maxWidth: "100vw",
            },
          }}
        >
          {companionPanel}
        </Drawer>
      ) : (
        <Fade in={open} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: "fixed",
              right: 24,
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
