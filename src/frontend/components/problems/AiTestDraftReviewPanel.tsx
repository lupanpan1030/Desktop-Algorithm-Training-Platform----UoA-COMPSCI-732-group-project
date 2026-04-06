import React from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
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
import type { AiTestcaseDraft } from "../../hooks/useApi";

type Props = {
  selectedProblemTitle?: string;
  disabled?: boolean;
  loading: boolean;
  savingIds: string[];
  provider: string | null;
  warnings: string[];
  error: string | null;
  drafts: AiTestcaseDraft[];
  onGenerate: () => void;
  onClear: () => void;
  onSaveDraft: (draftId: string) => void;
  onSaveHighConfidence: () => void;
  onDiscardDraft: (draftId: string) => void;
  onUpdateDraft: (
    draftId: string,
    patch: Partial<Pick<AiTestcaseDraft, "input" | "expectedOutput" | "isSample">>
  ) => void;
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

export default function AiTestDraftReviewPanel({
  selectedProblemTitle,
  disabled = false,
  loading,
  savingIds,
  provider,
  warnings,
  error,
  drafts,
  onGenerate,
  onClear,
  onSaveDraft,
  onSaveHighConfidence,
  onDiscardDraft,
  onUpdateDraft,
}: Props) {
  const theme = useTheme();
  const highConfidenceCount = drafts.filter((draft) => draft.confidence === "high").length;

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
              disabled={disabled || loading}
            >
              {drafts.length > 0 ? "Regenerate drafts" : "Generate test drafts"}
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
            {drafts.map((draft) => {
              const saving = savingIds.includes(draft.id);
              const canSave = draft.input.trim().length > 0 && draft.expectedOutput.trim().length > 0;

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
                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        <Chip
                          size="small"
                          color={draft.isSample ? "primary" : "default"}
                          label={draft.isSample ? "Sample" : "Hidden"}
                        />
                        <Chip
                          size="small"
                          color={confidenceColor(draft.confidence)}
                          variant={draft.confidence === "low" ? "outlined" : "filled"}
                          label={`${draft.confidence} confidence`}
                        />
                        {draft.sourceHints.map((sourceHint) => (
                          <Chip key={sourceHint} size="small" variant="outlined" label={sourceHint} />
                        ))}
                        {draft.riskFlags.map((riskFlag) => (
                          <Chip key={riskFlag} size="small" color="warning" variant="outlined" label={riskFlag} />
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
