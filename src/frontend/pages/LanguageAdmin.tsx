import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Typography,
  Paper,
  alpha,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LanguageToolbar from "../components/languages/LanguageToolbar";
import LanguageTable from "../components/languages/LanguageTable";
import LanguageFormDialog from "../components/languages/LanguageFormDialog";
import DeleteConfirmDialog from "../components/languages/DeleteConfirmDialog";
import { useLanguages, Language } from "../hooks/useLanguages";
import { strings } from "../i18n/messages";
import { useAiPageContext } from "../ai/useAiPageContext";
import type { AiPageContextPayload } from "../ai/types";

interface EditState {
  open: boolean;
  lang: Language | null;
}

interface DelState {
  open: boolean;
  id: number | null;
  name: string;
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 1.35,
        borderRadius: 4,
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        borderColor: alpha(theme.palette.divider, 0.34),
      })}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.2, lineHeight: 1.08 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
        {helper}
      </Typography>
    </Paper>
  );
}

export default function LanguageAdmin() {
  const theme = useTheme();
  const {
    languages,
    loading,
    error,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    fetchLanguages,
  } = useLanguages();

  const [showErrorAlert, setShowErrorAlert] = useState(true);
  useEffect(() => {
    if (error) {
      setShowErrorAlert(true);
    }
  }, [error]);

  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState<EditState>({ open: false, lang: null });
  const [del, setDel] = useState<DelState>({ open: false, id: null, name: "" });

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error" | "warning";
  }>({ open: false, msg: "", sev: "success" });

  const notify = (
    msg: string,
    sev: "success" | "error" | "warning" = "success"
  ) => {
    setSnack({ open: true, msg, sev });
  };

  const assistantPageContext = useMemo<AiPageContextPayload>(() => {
    const defaultLanguages = languages.filter((language) => language.isDefault);

    return {
      pageKind: "language-admin",
      route: "/languages",
      pageTitle: "Language Management",
      summary: `Managing ${languages.length} configured languages. ${
        showEdit || showDelete
          ? "Inline management modes are active."
          : "Use this page to edit runtime and compile settings."
      }`,
      facts: [
        {
          key: "languageCount",
          label: "Language count",
          value: String(languages.length),
        },
        {
          key: "defaultLanguageCount",
          label: "Default languages",
          value: String(defaultLanguages.length),
        },
        {
          key: "editMode",
          label: "Edit mode",
          value: showEdit ? "enabled" : "disabled",
        },
        {
          key: "deleteMode",
          label: "Delete mode",
          value: showDelete ? "enabled" : "disabled",
        },
        {
          key: "openDialog",
          label: "Open dialog",
          value: addOpen ? "add" : edit.open ? "edit" : del.open ? "delete" : "none",
        },
      ],
      contextText: languages.slice(0, 6).map((language) => {
        const compile = language.compilerCmd ?? "none";
        const run = language.runtimeCmd ?? "none";
        return `${language.name}: suffix=${language.suffix}, compile=${compile}, run=${run}`;
      }),
      suggestedPrompts: [
        "Explain these language settings",
        "What do compile and run commands do?",
        "Which language configuration should I check first if execution fails?",
        "How should Java be configured here?",
      ],
    };
  }, [addOpen, del.open, edit.open, languages, showDelete, showEdit]);

  useAiPageContext(assistantPageContext);

  const metrics = useMemo(() => {
    const defaults = languages.filter((language) => language.isDefault).length;
    const compiled = languages.filter((language) => Boolean(language.compilerCmd)).length;
    const interpreted = languages.length - compiled;

    return {
      total: languages.length,
      defaults,
      compiled,
      interpreted,
    };
  }, [languages]);

  const handleAdd = useCallback(
    async (v: any) => {
      try {
        await addLanguage(v);
        notify(strings.addSuccess(v.name));
      } catch (e: any) {
        notify(e.message, "error");
      } finally {
        setAddOpen(false);
      }
    },
    [addLanguage]
  );

  const handleSave = useCallback(
    async (v: any) => {
      if (!edit.lang) return;

      try {
        await updateLanguage(edit.lang.languageId, v);
        notify(strings.updateSuccess(v.name));
      } catch (e: any) {
        notify(e.message, "error");
      } finally {
        setEdit({ open: false, lang: null });
      }
    },
    [edit, updateLanguage]
  );

  const confirmDel = useCallback(async () => {
    if (del.id == null) return;

    try {
      await deleteLanguage(del.id);
      await fetchLanguages();
      notify(strings.deleteSuccess(del.name));
    } catch (e: any) {
      notify(e.message, "error");
    } finally {
      setDel({ open: false, id: null, name: "" });
      setShowDelete(false);
    }
  }, [del, deleteLanguage, fetchLanguages]);

  return (
    <Box sx={{ minHeight: "100%" }}>
      <Stack spacing={2.2}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1.8, md: 2.2 },
            borderRadius: 6,
            bgcolor: alpha(theme.palette.background.paper, 0.72),
            borderColor: alpha(theme.palette.divider, 0.42),
          }}
        >
          <Stack spacing={1.6}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={1.6}
              justifyContent="space-between"
              alignItems={{ lg: "center" }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                >
                  Runtime Configuration
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.2, lineHeight: 1.1 }}>
                  Language management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, maxWidth: 760 }}>
                  Configure the compile and runtime environments that power the local judge and editor experience.
                </Typography>
              </Box>

              <LanguageToolbar
                showDelete={showDelete}
                showEdit={showEdit}
                onAdd={() => {
                  (document.activeElement as HTMLElement | null)?.blur();
                  setAddOpen(true);
                }}
                onToggleDelete={() => setShowDelete((p) => !p)}
                onToggleEdit={() => setShowEdit((p) => !p)}
                onRefresh={fetchLanguages}
              />
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  xl: "repeat(4, minmax(0, 1fr))",
                },
              }}
            >
              <MetricCard label="Languages" value={metrics.total} helper="Configured runtimes" />
              <MetricCard label="Defaults" value={metrics.defaults} helper="Protected built-in entries" />
              <MetricCard label="Compiled" value={metrics.compiled} helper="Require a compile step" />
              <MetricCard label="Interpreted" value={metrics.interpreted} helper="Run directly via runtime command" />
            </Box>
          </Stack>
        </Paper>

        {error && showErrorAlert && (
          <Alert severity="error" onClose={() => setShowErrorAlert(false)}>
            {error.message ?? String(error)}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2.2,
              gridTemplateColumns: {
                xs: "1fr",
                xl: "minmax(320px, 360px) minmax(0, 1fr)",
              },
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 1.8,
                borderRadius: 6,
                bgcolor: alpha(theme.palette.background.paper, 0.68),
                borderColor: alpha(theme.palette.divider, 0.42),
              }}
            >
              <Stack spacing={1.4}>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                  >
                    Configuration Notes
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.2, lineHeight: 1.1 }}>
                    Understand the runtime model
                  </Typography>
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.3,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.background.paper, 0.42),
                  }}
                >
                  <Typography variant="subtitle2">Compile command</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                    Optional. Use this when a language needs a build step before execution, such as C++ or Java.
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.3,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.background.paper, 0.42),
                  }}
                >
                  <Typography variant="subtitle2">Run command</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                    Required. This is the command template the judge uses to execute submitted code.
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.3,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.background.paper, 0.42),
                  }}
                >
                  <Typography variant="subtitle2">Suffix and defaults</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                    The suffix controls temporary file naming; default languages are protected entries shipped with the platform.
                  </Typography>
                </Paper>

                <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                  <Chip
                    size="small"
                    label={showEdit ? "Edit mode on" : "Edit mode off"}
                    variant={showEdit ? "filled" : "outlined"}
                  />
                  <Chip
                    size="small"
                    label={showDelete ? "Delete mode on" : "Delete mode off"}
                    variant={showDelete ? "filled" : "outlined"}
                  />
                </Stack>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 1.8,
                borderRadius: 6,
                bgcolor: alpha(theme.palette.background.paper, 0.68),
                borderColor: alpha(theme.palette.divider, 0.42),
              }}
            >
              <Stack spacing={1.4}>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                  >
                    Language Catalog
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.2, lineHeight: 1.1 }}>
                    Review runtime definitions deliberately
                  </Typography>
                </Box>
                <LanguageTable
                  languages={languages}
                  showDelete={showDelete}
                  showEdit={showEdit}
                  onEdit={(lang: Language) => setEdit({ open: true, lang })}
                  onDelete={(id, name) => setDel({ open: true, id, name })}
                />
              </Stack>
            </Paper>
          </Box>
        )}

        <LanguageFormDialog
          open={addOpen}
          mode="add"
          initialValues={{
            name: "",
            compilerCmd: "",
            runtimeCmd: "",
            suffix: "",
            version: "",
          }}
          languages={languages}
          onSubmit={handleAdd}
          onClose={() => setAddOpen(false)}
        />
        <LanguageFormDialog
          open={edit.open}
          mode="edit"
          initialValues={
            edit.lang
              ? {
                  name: edit.lang.name,
                  compilerCmd: edit.lang.compilerCmd ?? "",
                  runtimeCmd: edit.lang.runtimeCmd ?? "",
                  suffix: edit.lang.suffix,
                  version: edit.lang.version ?? "",
                }
              : {
                  name: "",
                  compilerCmd: "",
                  runtimeCmd: "",
                  suffix: "",
                  version: "",
                }
          }
          languages={languages}
          ignoreId={edit.lang?.languageId}
          onSubmit={handleSave}
          onClose={() => setEdit({ open: false, lang: null })}
        />
        <DeleteConfirmDialog
          open={del.open}
          name={del.name}
          onClose={() => setDel({ open: false, id: null, name: "" })}
          onConfirm={confirmDel}
        />

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snack.sev}
            variant="filled"
            onClose={() => setSnack({ ...snack, open: false })}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Stack>
    </Box>
  );
}
