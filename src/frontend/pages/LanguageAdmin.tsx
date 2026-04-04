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
  Button,
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

function DetailFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 1.05,
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.42),
        borderColor: alpha(theme.palette.divider, 0.28),
      })}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 600 }}>
        {value}
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
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);

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

  useEffect(() => {
    setSelectedLanguageId((current) => {
      if (languages.length === 0) {
        return null;
      }

      if (current != null && languages.some((language) => language.languageId === current)) {
        return current;
      }

      return languages[0].languageId;
    });
  }, [languages]);

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.languageId === selectedLanguageId) ?? null,
    [languages, selectedLanguageId]
  );

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
    <Box
      sx={{
        minHeight: "100%",
        width: "100%",
        maxWidth: { xl: 1480 },
        mx: "auto",
      }}
    >
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
                  Workspace Summary
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 0.25, fontWeight: 700, lineHeight: 1.2 }}>
                  Review runtime definitions and keep the local judge configuration coherent.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.45, display: "block", maxWidth: 760 }}>
                  Use the catalog below to inspect command templates, default entries, and mode controls without repeating the global page framing.
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

            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              <Chip label={`Languages ${metrics.total}`} variant="outlined" />
              <Chip label={`Defaults ${metrics.defaults}`} variant="outlined" />
              <Chip label={`Compiled ${metrics.compiled}`} variant="outlined" />
              <Chip label={`Interpreted ${metrics.interpreted}`} variant="outlined" />
            </Stack>
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
              justifyContent: "center",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "minmax(300px, 336px) minmax(780px, 980px)",
              },
            }}
          >
            <Stack spacing={2.2}>
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
                      Language Directory
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.2, lineHeight: 1.1 }}>
                      Select the runtime to inspect
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.45, display: "block" }}>
                      Use the compact list for scanning. The full compile and run settings live in the detail pane.
                    </Typography>
                  </Box>
                  <LanguageTable
                    languages={languages}
                    selectedLanguageId={selectedLanguageId}
                    onSelect={(lang: Language) => setSelectedLanguageId(lang.languageId)}
                    showDelete={showDelete}
                    showEdit={showEdit}
                    onEdit={(lang: Language) => setEdit({ open: true, lang })}
                    onDelete={(id, name) => setDel({ open: true, id, name })}
                  />
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
                      Quick Reference
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.2, lineHeight: 1.1 }}>
                      Keep the runtime model legible
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.45, display: "block" }}>
                      Pick a language on the left, then inspect and edit the selected runtime on the right.
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      py: 0.2,
                      borderBottom: "1px solid",
                      borderColor: alpha(theme.palette.divider, 0.22),
                    }}
                  >
                    <Typography variant="subtitle2">Compile command</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                      Optional. Use this when a language needs a build step before execution, such as C++ or Java.
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      py: 0.2,
                      borderBottom: "1px solid",
                      borderColor: alpha(theme.palette.divider, 0.22),
                    }}
                  >
                    <Typography variant="subtitle2">Run command</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                      Required. This is the command template the judge uses to execute submitted code.
                    </Typography>
                  </Box>

                  <Box sx={{ py: 0.2 }}>
                    <Typography variant="subtitle2">Suffix and defaults</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                      The suffix controls temporary file naming; default languages are protected entries shipped with the platform.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                p: 1.8,
                borderRadius: 6,
                bgcolor: alpha(theme.palette.background.paper, 0.68),
                borderColor: alpha(theme.palette.divider, 0.42),
                minHeight: 0,
              }}
            >
              {selectedLanguage ? (
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={1.4}
                    alignItems={{ md: "center" }}
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: "text.secondary", display: "block", lineHeight: 1.35 }}
                      >
                        Selected Runtime
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 0.2, lineHeight: 1.08 }}>
                        {selectedLanguage.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
                        {selectedLanguage.suffix || "no suffix"}
                        {selectedLanguage.version ? ` · ${selectedLanguage.version}` : ""}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                      {showEdit && (
                        <Button
                          variant="outlined"
                          onClick={() => setEdit({ open: true, lang: selectedLanguage })}
                        >
                          Edit selected
                        </Button>
                      )}
                      {showDelete && !selectedLanguage.isDefault && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            setDel({
                              open: true,
                              id: selectedLanguage.languageId,
                              name: selectedLanguage.name,
                            })
                          }
                        >
                          Delete selected
                        </Button>
                      )}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                    {selectedLanguage.isDefault && <Chip size="small" label="Default" color="primary" />}
                    <Chip
                      size="small"
                      variant="outlined"
                      label={selectedLanguage.compilerCmd ? "Compiled" : "Interpreted"}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={selectedLanguage.runtimeCmd ? "Run command set" : "No run command"}
                    />
                    <Chip
                      size="small"
                      variant={showEdit || showDelete ? "filled" : "outlined"}
                      label={
                        showEdit
                          ? "Edit mode active"
                          : showDelete
                            ? "Delete mode active"
                            : "Browse mode"
                      }
                    />
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(3, minmax(0, 1fr))",
                      },
                    }}
                  >
                    <DetailFact label="Suffix" value={selectedLanguage.suffix || "Not configured"} />
                    <DetailFact label="Version" value={selectedLanguage.version || "Not specified"} />
                    <DetailFact
                      label="Execution kind"
                      value={selectedLanguage.compilerCmd ? "Compile then run" : "Run directly"}
                    />
                  </Box>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.3,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.background.paper, 0.42),
                      borderColor: alpha(theme.palette.divider, 0.3),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Compile command
                    </Typography>
                    <Typography
                      component="pre"
                      variant="body2"
                      sx={{
                        mt: 0.6,
                        mb: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily:
                          '"JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", monospace',
                      }}
                    >
                      {selectedLanguage.compilerCmd || "none"}
                    </Typography>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.3,
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.background.paper, 0.42),
                      borderColor: alpha(theme.palette.divider, 0.3),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Run command
                    </Typography>
                    <Typography
                      component="pre"
                      variant="body2"
                      sx={{
                        mt: 0.6,
                        mb: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily:
                          '"JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", monospace',
                      }}
                    >
                      {selectedLanguage.runtimeCmd || "none"}
                    </Typography>
                  </Paper>
                </Stack>
              ) : (
                <Alert severity="info">Select a language from the directory to inspect its runtime settings.</Alert>
              )}
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
