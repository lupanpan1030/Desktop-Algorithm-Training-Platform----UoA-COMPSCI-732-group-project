import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import LanguageToolbar from "../components/languages/LanguageToolbar";
import LanguageTable from "../components/languages/LanguageTable";
import LanguageFormDialog from "../components/languages/LanguageFormDialog";
import DeleteConfirmDialog from "../components/languages/DeleteConfirmDialog";
import { useLanguages, Language } from "../hooks/useLanguages";
import { strings } from "../i18n/messages";
import { useAiPageContext } from "../ai/useAiPageContext";
import type { AiPageContextPayload } from "../ai/types";

/**
 * Language Management Page
 * ------------------------------------
 * The page manages available programming languages in the system.
 *
 *
 * Main Components:
 *   • LanguageToolbar – top toolbar: add, toggle delete/edit mode, refresh list
 *   • LanguageTable   – table view: display languages and trigger inline edit/delete
 *   • LanguageFormDialog / DeleteConfirmDialog – modals: add/edit/delete
 *
 * Data source:
 *   Uses custom hook `useLanguages` for CRUD; all UI state is kept locally in this component.
 */
// Local state type definitions
interface EditState {
  open: boolean;
  lang: Language | null;
}
interface DelState {
  open: boolean;
  id: number | null;
  name: string;
}

export default function LanguageAdmin() {
  const {
    languages,
    loading,
    error,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    fetchLanguages,
  } = useLanguages();

  // local control for showing the error alert
  const [showErrorAlert, setShowErrorAlert] = useState(true);
  useEffect(() => {
    if (error) {
      setShowErrorAlert(true);
    }
  }, [error]);

  // Local UI state
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
          value: addOpen
            ? "add"
            : edit.open
              ? "edit"
              : del.open
                ? "delete"
                : "none",
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

  // CRUD handlers
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

  // Render
  return (
    <>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ p: 5 }}>
        <Stack
          direction={{ xs: "column", ssm: "row" }}
          spacing={3}
          alignItems={{ xs: "flex-start", ssm: "center" }}
          justifyContent={{ ssm: "space-between" }}   // push toolbar to the right on ≥ ssm
          my={{ xs: 2, ssm: 3 }}
        >
          <Typography variant="h4">Language Management</Typography>
          <LanguageToolbar
            showDelete={showDelete}
            showEdit={showEdit}
            onAdd={() => {
              // Blur the triggering element before opening the dialog to avoid a11y warning
              (document.activeElement as HTMLElement | null)?.blur();
              setAddOpen(true);
            }}
            onToggleDelete={() => setShowDelete((p) => !p)}
            onToggleEdit={() => setShowEdit((p) => !p)}
            onRefresh={fetchLanguages}
          />
        </Stack>

        {error && showErrorAlert && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setShowErrorAlert(false)}
          >
            {error.message ?? String(error)}
          </Alert>
        )}

        <LanguageTable
          languages={languages}
          showDelete={showDelete}
          showEdit={showEdit}
          onEdit={(lang: Language) => setEdit({ open: true, lang })}
          onDelete={(id, name) => setDel({ open: true, id, name })}
        />

        {/* dialogs */}
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

        {/* feedback */}
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
      </Box>
    </>
  );
}
