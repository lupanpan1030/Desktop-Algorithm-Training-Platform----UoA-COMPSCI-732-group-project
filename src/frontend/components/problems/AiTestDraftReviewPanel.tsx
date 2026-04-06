import React from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import type {
  AiTestcaseDraft,
  GenerateAiTestDraftsPayload,
} from "../../hooks/useApi";

type Props = {
  selectedProblemTitle?: string;
  disabled?: boolean;
  loading: boolean;
  savingIds: string[];
  selectedIds: string[];
  provider: string | null;
  warnings: string[];
  error: string | null;
  drafts: AiTestcaseDraft[];
  requestOptions: GenerateAiTestDraftsPayload;
  onGenerate: () => void;
  onClear: () => void;
  onUpdateRequest: (patch: Partial<GenerateAiTestDraftsPayload>) => void;
  onSaveDraft: (draftId: string) => void;
  onSaveSelected: () => void;
  onSaveHighConfidence: () => void;
  onDiscardDraft: (draftId: string) => void;
  onDiscardSelected: () => void;
  onUpdateDraft: (
    draftId: string,
    patch: Partial<Pick<AiTestcaseDraft, "input" | "expectedOutput" | "isSample">>
  ) => void;
  onToggleDraftSelection: (draftId: string) => void;
  onSelectAll: () => void;
  onSelectHighConfidence: () => void;
};

function confidenceColor(confidence: AiTestcaseDraft["confidence"]) {
  switch (confidence) {
    case "high":
      return "success";
    case "medium":
      return "warning";
    default:
      return "default";
  }
}

function confidenceLabel(confidence: AiTestcaseDraft["confidence"]) {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Needs a quick review";
    default:
      return "Manual review required";
  }
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function sourceHintLabel(sourceHint: string) {
  switch (sourceHint) {
    case "sample reference":
      return "From sample reference";
    case "problem description":
      return "From problem description";
    case "description example":
      return "From description example";
    case "edge-case reasoning":
      return "Inferred edge case";
    default:
      return humanize(sourceHint);
  }
}

function riskFlagLabel(riskFlag: string) {
  switch (riskFlag) {
    case "requires_manual_output_review":
      return "Review output manually";
    case "ambiguous_spec":
      return "Spec may be ambiguous";
    case "inferred_without_reference":
      return "Inferred without explicit example";
    default:
      return humanize(riskFlag);
  }
}

export default function AiTestDraftReviewPanel({
  selectedProblemTitle,
  disabled = false,
  loading,
  savingIds,
  selectedIds,
  provider,
  warnings,
  error,
  drafts,
  requestOptions,
  onGenerate,
  onClear,
  onUpdateRequest,
  onSaveDraft,
  onSaveSelected,
  onSaveHighConfidence,
  onDiscardDraft,
  onDiscardSelected,
  onUpdateDraft,
  onToggleDraftSelection,
  onSelectAll,
  onSelectHighConfidence,
}: Props) {
  const theme = useTheme();
  const highConfidenceCount = drafts.filter((draft) => draft.confidence === "high").length;
  const selectedCount = selectedIds.length;
  const selectedHighConfidenceCount = drafts.filter(
    (draft) => selectedIds.includes(draft.id) && draft.confidence === "high"
  ).length;
  const canGenerate =
    Boolean(requestOptions.includeSampleDrafts) || Boolean(requestOptions.includeHiddenDrafts);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.8, md: 2.1 },
        borderRadius: 6,
        bgcolor: alpha(theme.palette.background.paper, 0.68),
        borderColor: alpha(theme.palette.divider, 0.42),
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={1.6}
          alignItems={{ md: "center" }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
            >
              AI Draft Review
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.2, lineHeight: 1.1 }}>
              Draft testcases before you commit them
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
              {selectedProblemTitle
                ? `Generate draft testcases for ${selectedProblemTitle}, review the outputs, then save the ones you trust.`
                : "Choose a problem first, then generate draft testcases from the current prompt and metadata."}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              variant="contained"
              color="secondary"
              startIcon={loading ? <CircularProgress size={18} /> : <AutoAwesomeRoundedIcon />}
              onClick={onGenerate}
              disabled={disabled || loading || !canGenerate}
            >
              {drafts.length > 0 ? "Regenerate drafts" : "Generate test drafts"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircleOutlineRoundedIcon />}
              onClick={onSaveSelected}
              disabled={disabled || loading || selectedCount === 0}
            >
              Save selected
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircleOutlineRoundedIcon />}
              onClick={onSaveHighConfidence}
              disabled={disabled || loading || highConfidenceCount === 0}
            >
              Save high confidence
            </Button>
            <Button
              variant="text"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={onDiscardSelected}
              disabled={loading || selectedCount === 0}
            >
              Discard selected
            </Button>
            <Button
              variant="text"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={onClear}
              disabled={loading || drafts.length === 0}
            >
              Clear drafts
            </Button>
          </Stack>
        </Stack>

        <Alert severity="info">
          AI drafts are suggestions only. Review every expected output before saving it into judge
          coverage.
        </Alert>

        <Paper
          variant="outlined"
          sx={{
            p: 1.3,
            borderRadius: 4,
            bgcolor: alpha(theme.palette.background.default, 0.24),
            borderColor: alpha(theme.palette.divider, 0.3),
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.2}
            alignItems={{ lg: "center" }}
            justifyContent="space-between"
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} useFlexGap flexWrap="wrap">
              <TextField
                select
                label="Draft count"
                size="small"
                value={String(requestOptions.targetCount ?? 5)}
                onChange={(event) =>
                  onUpdateRequest({ targetCount: Number(event.target.value) })
                }
                sx={{ minWidth: 136 }}
              >
                {[2, 4, 5, 6, 8].map((count) => (
                  <MenuItem key={count} value={count}>
                    {count} drafts
                  </MenuItem>
                ))}
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(requestOptions.includeSampleDrafts)}
                    onChange={(_, checked) =>
                      onUpdateRequest({ includeSampleDrafts: checked })
                    }
                  />
                }
                label="Sample drafts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(requestOptions.includeHiddenDrafts)}
                    onChange={(_, checked) =>
                      onUpdateRequest({ includeHiddenDrafts: checked })
                    }
                  />
                }
                label="Hidden drafts"
              />
            </Stack>

            {!canGenerate && (
              <Typography variant="caption" color="warning.main">
                Select at least one draft type before generating.
              </Typography>
            )}
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}
        {warnings.length > 0 && (
          <Alert severity="warning">
            <Stack spacing={0.4}>
              {warnings.map((warning) => (
                <Typography key={warning} variant="body2">
                  {warning}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
          <Chip label={`${drafts.length} drafts`} variant="outlined" />
          <Chip label={`${highConfidenceCount} high confidence`} variant="outlined" />
          <Chip label={`${selectedCount} selected`} variant="outlined" />
          {selectedCount > 0 && (
            <Chip label={`${selectedHighConfidenceCount} selected high confidence`} variant="outlined" />
          )}
          {provider && <Chip label={provider} variant="outlined" icon={<RefreshRoundedIcon />} />}
        </Stack>

        {disabled ? (
          <Alert severity="info">Choose a problem before generating AI testcase drafts.</Alert>
        ) : drafts.length === 0 ? (
          <Alert severity="info">
            No drafts yet. Generate a batch from the current problem description and sample
            reference.
          </Alert>
        ) : (
          <Stack spacing={1.2}>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              <Button variant="text" size="small" onClick={onSelectAll}>
                {selectedCount === drafts.length ? "Clear selection" : "Select all"}
              </Button>
              <Button variant="text" size="small" onClick={onSelectHighConfidence}>
                Select high confidence
              </Button>
            </Stack>

            {drafts.map((draft) => {
              const saving = savingIds.includes(draft.id);
              const canSave = draft.input.trim().length > 0 && draft.expectedOutput.trim().length > 0;
              const selected = selectedIds.includes(draft.id);

              return (
                <Paper
                  key={draft.id}
                  variant="outlined"
                  sx={{
                    p: 1.4,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.background.paper, 0.42),
                    borderColor: alpha(theme.palette.divider, 0.34),
                  }}
                >
                  <Stack spacing={1.15}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      spacing={1}
                      alignItems={{ md: "center" }}
                    >
                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" alignItems="center">
                        <Checkbox
                          checked={selected}
                          onChange={() => onToggleDraftSelection(draft.id)}
                          inputProps={{ "aria-label": `select draft ${draft.id}` }}
                        />
                        <Chip
                          size="small"
                          color={draft.isSample ? "primary" : "default"}
                          label={draft.isSample ? "Sample" : "Hidden"}
                        />
                        <Chip
                          size="small"
                          color={confidenceColor(draft.confidence)}
                          variant={draft.confidence === "low" ? "outlined" : "filled"}
                          label={confidenceLabel(draft.confidence)}
                        />
                        {draft.sourceHints.map((sourceHint) => (
                          <Chip
                            key={sourceHint}
                            size="small"
                            variant="outlined"
                            label={sourceHintLabel(sourceHint)}
                          />
                        ))}
                        {draft.riskFlags.map((riskFlag) => (
                          <Chip
                            key={riskFlag}
                            size="small"
                            color="warning"
                            variant="outlined"
                            label={riskFlagLabel(riskFlag)}
                          />
                        ))}
                      </Stack>

                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          disabled={saving || !canSave}
                          onClick={() => onSaveDraft(draft.id)}
                          startIcon={saving ? <CircularProgress size={16} /> : <CheckCircleOutlineRoundedIcon />}
                        >
                          Save as testcase
                        </Button>
                        <Button
                          variant="text"
                          color="inherit"
                          size="small"
                          onClick={() => onDiscardDraft(draft.id)}
                        >
                          Discard
                        </Button>
                      </Stack>
                    </Stack>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={draft.isSample}
                          onChange={(_, checked) => onUpdateDraft(draft.id, { isSample: checked })}
                        />
                      }
                      label="Use as sample testcase for Run"
                    />

                    <TextField
                      label="Input"
                      value={draft.input}
                      onChange={(event) => onUpdateDraft(draft.id, { input: event.target.value })}
                      multiline
                      minRows={3}
                      fullWidth
                    />

                    <TextField
                      label="Expected output"
                      value={draft.expectedOutput}
                      onChange={(event) =>
                        onUpdateDraft(draft.id, { expectedOutput: event.target.value })
                      }
                      multiline
                      minRows={3}
                      fullWidth
                    />

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Rationale
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25 }}>
                        {draft.rationale}
                      </Typography>
                    </Box>

                    {draft.riskFlags.length > 0 && (
                      <Alert severity="warning" sx={{ py: 0.4 }}>
                        {draft.riskFlags.map((riskFlag) => riskFlagLabel(riskFlag)).join(" · ")}
                      </Alert>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
