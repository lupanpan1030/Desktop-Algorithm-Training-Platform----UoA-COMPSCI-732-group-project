import React, { useEffect, useMemo, useState } from "react";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAiPageContext } from "../ai/useAiPageContext";
import {
  AiSettings as AiSettingsSnapshot,
  useApi,
} from "../hooks/useApi";

type FormState = {
  provider: "mock" | "openai";
  model: string;
  baseUrl: string;
  timeoutMs: string;
  apiKey: string;
};

function buildInitialFormState(settings: AiSettingsSnapshot): FormState {
  return {
    provider: settings.provider,
    model: settings.model,
    baseUrl: settings.baseUrl,
    timeoutMs: String(settings.timeoutMs),
    apiKey: "",
  };
}

function buildCredentialSummary(settings: AiSettingsSnapshot | null) {
  if (!settings?.apiKeyConfigured) {
    return "No API key configured";
  }

  if (settings.apiKeySource === "environment") {
    return `Using environment key ${settings.apiKeyPreview ?? ""}`.trim();
  }

  return `Using saved key ${settings.apiKeyPreview ?? ""}`.trim();
}

export default function AiSettings() {
  const theme = useTheme();
  const { getAiSettings, updateAiSettings } = useApi();
  const [settings, setSettings] = useState<AiSettingsSnapshot | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setLoadError(null);

      try {
        const nextSettings = await getAiSettings();
        if (!active) {
          return;
        }
        setSettings(nextSettings);
        setForm(buildInitialFormState(nextSettings));
      } catch (error) {
        if (!active) {
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : "Failed to load AI settings."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [getAiSettings]);

  const pageContext = useMemo(
    () => ({
      pageKind: "assistant-settings" as const,
      route: "/settings/ai",
      pageTitle: "Assistant Settings",
      summary: settings
        ? `${settings.statusLabel}. Provider preference is ${settings.provider}.`
        : "Configuring the global assistant provider and local AI credentials.",
      facts: [
        {
          key: "provider",
          label: "Selected provider",
          value: form?.provider ?? settings?.provider ?? "mock",
        },
        {
          key: "status",
          label: "Assistant mode",
          value: settings?.statusLabel ?? "Loading",
        },
        {
          key: "credentialSource",
          label: "Credential source",
          value: settings?.apiKeySource ?? "none",
        },
      ],
      suggestedPrompts: [
        "What does preview mode mean here?",
        "How do I switch this app to live OpenAI mode?",
        "Where is this key stored locally?",
      ],
    }),
    [form?.provider, settings]
  );

  useAiPageContext(pageContext);

  const timeoutValue = Number.parseInt(form?.timeoutMs ?? "", 10);
  const timeoutValid = Number.isInteger(timeoutValue) && timeoutValue >= 1000;
  const dirty = Boolean(
    settings &&
      form &&
      (
        form.provider !== settings.provider ||
        form.model !== settings.model ||
        form.baseUrl !== settings.baseUrl ||
        form.timeoutMs !== String(settings.timeoutMs) ||
        form.apiKey.trim()
      )
  );

  const handleFieldChange =
    (field: keyof FormState) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | React.MouseEvent<HTMLElement>,
      nextValue?: string
    ) => {
      setFeedback(null);
      setForm((current) => {
        if (!current) {
          return current;
        }

        if (field === "provider") {
          if (!nextValue) {
            return current;
          }

          return {
            ...current,
            provider: nextValue as FormState["provider"],
          };
        }

        return {
          ...current,
          [field]: (event.target as HTMLInputElement).value,
        };
      });
    };

  const handleSave = async () => {
    if (!form || !timeoutValid) {
      return;
    }

    setSaving(true);
    setLoadError(null);
    setFeedback(null);

    try {
      const nextSettings = await updateAiSettings({
        provider: form.provider,
        model: form.model.trim(),
        baseUrl: form.baseUrl.trim(),
        timeoutMs: timeoutValue,
        ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
      });

      setSettings(nextSettings);
      setForm(buildInitialFormState(nextSettings));
      setFeedback("Assistant settings saved. The new provider state is active immediately.");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to save AI settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClearSavedKey = async () => {
    if (!form || !settings) {
      return;
    }

    setSaving(true);
    setLoadError(null);
    setFeedback(null);

    try {
      const nextSettings = await updateAiSettings({
        provider: form.provider,
        model: form.model.trim(),
        baseUrl: form.baseUrl.trim(),
        timeoutMs: timeoutValid ? timeoutValue : settings.timeoutMs,
        clearApiKey: true,
      });

      setSettings(nextSettings);
      setForm(buildInitialFormState(nextSettings));
      setFeedback("Saved API key removed from local app settings.");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to clear the saved API key."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <Box
        sx={{
          minHeight: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack spacing={1.4} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading assistant settings...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "grid",
        gap: 1.8,
        gridTemplateColumns: {
          xs: "1fr",
          xl: "minmax(0, 0.9fr) minmax(320px, 0.65fr)",
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 6,
          p: { xs: 1.8, md: 2.2 },
          border: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.42),
          bgcolor: alpha(theme.palette.background.paper, 0.72),
          backdropFilter: "blur(18px)",
        }}
      >
        <Stack spacing={1.6}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between">
            <Box>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 0.72 }}>
                Assistant Runtime
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.25, lineHeight: 1.1 }}>
                AI provider and credentials
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, maxWidth: 660 }}>
                This screen replaces the old `.env`-only setup. Packaged builds can store the assistant
                provider, model, and API key locally on the device.
              </Typography>
            </Box>

            <Chip
              icon={<SmartToyRoundedIcon />}
              label={settings.statusLabel}
              sx={{
                alignSelf: { xs: "flex-start", md: "center" },
                bgcolor:
                  settings.status === "ready"
                    ? alpha(theme.palette.success.main, 0.16)
                    : settings.status === "misconfigured"
                      ? alpha(theme.palette.warning.main, 0.16)
                      : alpha(theme.palette.info.main, 0.16),
                color:
                  settings.status === "ready"
                    ? theme.palette.success.light
                    : settings.status === "misconfigured"
                      ? theme.palette.warning.light
                      : theme.palette.info.light,
              }}
            />
          </Stack>

          {loadError ? <Alert severity="error">{loadError}</Alert> : null}
          {feedback ? <Alert severity="success">{feedback}</Alert> : null}

          <Alert
            severity={
              settings.status === "ready"
                ? "success"
                : settings.status === "misconfigured"
                  ? "warning"
                  : "info"
            }
            sx={{ borderRadius: 3 }}
          >
            {settings.statusReason}
          </Alert>

          <Box
            sx={{
              display: "grid",
              gap: 1.2,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 4,
                p: 1.35,
                bgcolor: alpha(theme.palette.background.default, 0.4),
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Credential source
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.45, fontWeight: 700 }}>
                {buildCredentialSummary(settings)}
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 4,
                p: 1.35,
                bgcolor: alpha(theme.palette.background.default, 0.4),
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Storage scope
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.45, fontWeight: 700 }}>
                Local device
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {settings.storageScope}
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 4,
                p: 1.35,
                bgcolor: alpha(theme.palette.background.default, 0.4),
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Effective model
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.45, fontWeight: 700 }}>
                {settings.provider === "openai" ? settings.model : "Preview provider"}
              </Typography>
            </Paper>
          </Box>

          <Divider />

          <Stack spacing={1.4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Provider preference
            </Typography>
            <ToggleButtonGroup
              value={form.provider}
              exclusive
              onChange={handleFieldChange("provider")}
              sx={{ alignSelf: "flex-start" }}
            >
              <ToggleButton value="mock">Preview</ToggleButton>
              <ToggleButton value="openai">OpenAI</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Model"
              value={form.model}
              onChange={handleFieldChange("model")}
              fullWidth
            />

            <TextField
              label="Base URL"
              value={form.baseUrl}
              onChange={handleFieldChange("baseUrl")}
              fullWidth
            />

            <TextField
              label="Timeout (ms)"
              value={form.timeoutMs}
              onChange={handleFieldChange("timeoutMs")}
              error={!timeoutValid}
              helperText={
                timeoutValid
                  ? "Use a longer timeout when the model or network is slow."
                  : "Timeout must be an integer of at least 1000 ms."
              }
              fullWidth
            />

            <TextField
              label="OpenAI API key"
              type="password"
              value={form.apiKey}
              onChange={handleFieldChange("apiKey")}
              placeholder={
                settings.apiKeyConfigured
                  ? "Leave blank to keep the current key"
                  : "sk-..."
              }
              helperText={
                settings.apiKeySource === "saved"
                  ? "Leave this blank to keep the saved key. Use the remove action below to delete it."
                  : settings.apiKeySource === "environment"
                    ? "An environment key is currently active. Saving a key here will override that for this app."
                    : "No API key is configured yet. Add one to enable live OpenAI responses."
              }
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={1.1} useFlexGap flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              onClick={handleSave}
              disabled={saving || !dirty || !timeoutValid}
            >
              {saving ? "Saving..." : "Save settings"}
            </Button>

            {settings.apiKeySource === "saved" && settings.apiKeyConfigured ? (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<VpnKeyRoundedIcon />}
                onClick={handleClearSavedKey}
                disabled={saving}
              >
                Remove saved key
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>

      <Stack spacing={1.8}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 6,
            p: 2,
            border: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.42),
            bgcolor: alpha(theme.palette.background.paper, 0.72),
          }}
        >
          <Stack spacing={1.35}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <CloudDoneRoundedIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Runtime behavior
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Saved changes apply to the assistant immediately. You do not need to restart the app
              after changing provider, model, base URL, or API key.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Storage path:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                p: 1.2,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.default, 0.45),
                fontFamily: theme.typography.fontFamily,
                wordBreak: "break-all",
              }}
            >
              {settings.storagePath}
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 6,
            p: 2,
            border: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.42),
            bgcolor: alpha(theme.palette.background.paper, 0.72),
          }}
        >
          <Stack spacing={1.15}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Recommended setup
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use Preview mode when you want local UI testing without API calls. Switch to OpenAI,
              save a valid API key, then keep the model at `gpt-5-mini` unless you have a reason to
              pay for a larger one.
            </Typography>
            {form.provider === "openai" && !settings.apiKeyConfigured && !form.apiKey.trim() ? (
              <Alert severity="warning" sx={{ borderRadius: 3 }}>
                OpenAI is selected, but no key is configured yet. Until you save one, the assistant
                will remain in preview mode.
              </Alert>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
