import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { TestCaseMutationPayload } from "../../hooks/useApi";

type Mode = "add" | "edit";

interface Props {
  open: boolean;
  mode: Mode;
  initialValues: TestCaseMutationPayload;
  onSubmit: (values: TestCaseMutationPayload) => Promise<void> | void;
  onClose: () => void;
}

const blankValues: TestCaseMutationPayload = {
  input: "",
  expectedOutput: "",
  timeLimitMs: 1000,
  memoryLimitMb: 128,
  isSample: false,
};

export default function TestCaseFormDialog({
  open,
  mode,
  initialValues,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<TestCaseMutationPayload>(blankValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setForm(initialValues ?? blankValues);
    setErrors({});
    setSubmitError("");
  }, [initialValues, open]);

  const updateTextField =
    (field: keyof TestCaseMutationPayload) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const value = event.target.value;
      setForm((previous) => ({
        ...previous,
        [field]:
          field === "timeLimitMs" || field === "memoryLimitMb"
            ? Number(value)
            : value,
      }));
    };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.input.trim()) {
      nextErrors.input = "Input is required.";
    }
    if (!form.expectedOutput.trim()) {
      nextErrors.expectedOutput = "Expected output is required.";
    }
    if (!Number.isFinite(form.timeLimitMs) || form.timeLimitMs < 100) {
      nextErrors.timeLimitMs = "Time limit must be at least 100 ms.";
    }
    if (!Number.isFinite(form.memoryLimitMb) || form.memoryLimitMb < 16) {
      nextErrors.memoryLimitMb = "Memory limit must be at least 16 MB.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit({
        input: form.input.trim(),
        expectedOutput: form.expectedOutput.trim(),
        timeLimitMs: Number(form.timeLimitMs),
        memoryLimitMb: Number(form.memoryLimitMb),
        isSample: Boolean(form.isSample),
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save test case.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      disableRestoreFocus
    >
      <DialogTitle>{mode === "add" ? "Add Test Case" : "Edit Test Case"}</DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          "&&": {
            padding: 3,
            paddingTop: 1,
          },
        }}
      >
        {submitError && <Alert severity="error">{submitError}</Alert>}

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(form.isSample)}
              onChange={(_, checked) =>
                setForm((previous) => ({ ...previous, isSample: checked }))
              }
            />
          }
          label="Use as sample testcase for Run"
        />

        <TextField
          label="Input"
          value={form.input}
          onChange={updateTextField("input")}
          error={Boolean(errors.input)}
          helperText={errors.input}
          multiline
          minRows={4}
          fullWidth
        />

        <TextField
          label="Expected Output"
          value={form.expectedOutput}
          onChange={updateTextField("expectedOutput")}
          error={Boolean(errors.expectedOutput)}
          helperText={errors.expectedOutput}
          multiline
          minRows={4}
          fullWidth
        />

        <TextField
          label="Time Limit (ms)"
          type="number"
          value={form.timeLimitMs}
          onChange={updateTextField("timeLimitMs")}
          error={Boolean(errors.timeLimitMs)}
          helperText={errors.timeLimitMs}
          fullWidth
          size="small"
        />

        <TextField
          label="Memory Limit (MB)"
          type="number"
          value={form.memoryLimitMb}
          onChange={updateTextField("memoryLimitMb")}
          error={Boolean(errors.memoryLimitMb)}
          helperText={errors.memoryLimitMb}
          fullWidth
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button variant="contained" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : undefined}
        >
          {mode === "add" ? "Create" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
