import React, { useMemo, useState } from "react";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Box,
  Chip,
  Divider,
  Drawer,
  Fab,
  Fade,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useGlobalAiAssistant } from "../../ai/GlobalAiAssistantProvider";

const drawerWidth = 420;

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

  const launcherLabel = useMemo(() => {
    if (!pageContext) {
      return "Ask AI";
    }
    return `Ask about ${pageContext.pageTitle}`;
  }, [pageContext]);

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const nextMessage = input;
    setInput("");
    await applySuggestedPrompt(nextMessage);
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          right: { xs: 16, md: 24 },
          bottom: { xs: 16, md: 24 },
          zIndex: theme.zIndex.drawer + 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          pointerEvents: "none",
        }}
      >
        <Fade in={!compact && hovered}>
          <Paper
            elevation={6}
            sx={{
              pointerEvents: "none",
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: "blur(8px)",
              maxWidth: 220,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {launcherLabel}
            </Typography>
          </Paper>
        </Fade>

        <Tooltip title={compact ? launcherLabel : ""} placement="left">
          <Fab
            color="secondary"
            aria-label="open ai assistant"
            onClick={openAssistant}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
              pointerEvents: "auto",
              boxShadow: 8,
            }}
          >
            {suggestions.length > 0 ? <AutoAwesomeIcon /> : <SmartToyOutlinedIcon />}
          </Fab>
        </Tooltip>
      </Box>

      <Drawer
        anchor="right"
        open={open}
        onClose={closeAssistant}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: drawerWidth },
            maxWidth: "100vw",
          },
        }}
      >
        <Stack sx={{ height: "100%" }}>
          <Box sx={{ px: 2.5, py: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6">Global AI Assistant</Typography>
                <Typography variant="body2" color="text.secondary">
                  {pageContext?.pageTitle ?? "Waiting for page context"}
                </Typography>
              </Box>
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
          </Box>

          <Divider />

          <Box sx={{ px: 2.5, py: 2 }}>
            {pageContext ? (
              <Stack spacing={1.5}>
                <Alert severity="info" variant="outlined">
                  {pageContext.summary}
                </Alert>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip size="small" label={pageContext.pageKind} />
                  {pageContext.locale && (
                    <Chip size="small" label={`Locale ${pageContext.locale}`} variant="outlined" />
                  )}
                  {pageContext.facts?.slice(0, 4).map((fact) => (
                    <Chip
                      key={fact.key}
                      size="small"
                      label={`${fact.label}: ${fact.value}`}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Open any page and the assistant will pick up its context.
              </Typography>
            )}
          </Box>

          <Divider />

          <Box sx={{ px: 2.5, py: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Suggested Questions
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <Chip
                    key={suggestion.id}
                    label={suggestion.label}
                    clickable
                    onClick={() => void applySuggestedPrompt(suggestion.prompt)}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {pending ? "Preparing suggestions..." : "Open the assistant on a page to get context-aware prompts."}
                </Typography>
              )}
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
            <Stack spacing={1.5}>
              {messages.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ask a question about the current page, or use one of the suggested prompts above.
                  </Typography>
                </Paper>
              ) : (
                messages.map((message) => (
                  <Paper
                    key={message.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      ml: message.role === "assistant" ? 0 : 4,
                      mr: message.role === "assistant" ? 4 : 0,
                      bgcolor:
                        message.role === "assistant"
                          ? "background.paper"
                          : alpha(theme.palette.secondary.light, 0.2),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {message.role === "assistant" ? "Assistant" : "You"}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                      {message.content}
                    </Typography>
                    {message.role === "assistant" && message.inferredIntent && (
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                        <Chip size="small" label={message.inferredIntent} variant="outlined" />
                        {message.sourcesUsed?.slice(0, 2).map((source) => (
                          <Chip key={source} size="small" label={source} variant="outlined" />
                        ))}
                      </Stack>
                    )}
                  </Paper>
                ))
              )}

              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-end">
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={5}
                label="Ask about this page"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <IconButton
                color="secondary"
                aria-label="send ai assistant message"
                onClick={() => void handleSend()}
                disabled={pending || !input.trim()}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </Drawer>
    </>
  );
}
