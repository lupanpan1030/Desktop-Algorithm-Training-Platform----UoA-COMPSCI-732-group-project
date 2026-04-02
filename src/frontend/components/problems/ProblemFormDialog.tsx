import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ProblemMutationPayload } from "../../hooks/useApi";

type Mode = "add" | "edit";

interface Props {
  open: boolean;
  mode: Mode;
  initialValues: ProblemMutationPayload;
  onSubmit: (values: ProblemMutationPayload) => Promise<void> | void;
  onClose: () => void;
}

const blankValues: ProblemMutationPayload = {
  title: "",
  description: "",
  difficulty: "EASY",
  locale: "en",
};

const difficultyOptions = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const localeOptions = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "中文" },
];

export default function ProblemFormDialog({
  open,
  mode,
  initialValues,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<ProblemMutationPayload>(blankValues);
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

  const updateField =
    (field: keyof ProblemMutationPayload) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const value = event.target.value;
      setForm((previous) => ({
        ...previous,
        [field]: value,
      }));
    };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (form.title.trim().length < 5) {
      nextErrors.title = "Title must be at least 5 characters.";
    }
    if (form.description.trim().length < 10) {
      nextErrors.description = "Description must be at least 10 characters.";
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
        title: form.title.trim(),
        description: form.description.trim(),
        difficulty: form.difficulty,
        locale: form.locale ?? "en",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save problem.";
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
      <DialogTitle>{mode === "add" ? "Add Problem" : "Edit Problem"}</DialogTitle>
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

        <TextField
          autoFocus
          label="Title"
          value={form.title}
          onChange={updateField("title")}
          error={Boolean(errors.title)}
          helperText={errors.title}
          fullWidth
          size="small"
        />

        <TextField
          select
          label="Difficulty"
          value={form.difficulty}
          onChange={updateField("difficulty")}
          fullWidth
          size="small"
        >
          {difficultyOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Content Locale"
          value={form.locale ?? "en"}
          onChange={updateField("locale")}
          fullWidth
          size="small"
        >
          {localeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Description"
          value={form.description}
          onChange={updateField("description")}
          error={Boolean(errors.description)}
          helperText={errors.description ?? "Markdown or HTML is supported."}
          multiline
          minRows={12}
          fullWidth
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
