import React, { useState, useCallback } from 'react';
import { Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import LanguageToolbar     from '../components/languages/LanguageToolbar';
import LanguageTable       from '../components/languages/LanguageTable';
import LanguageFormDialog  from '../components/languages/LanguageFormDialog';
import DeleteConfirmDialog from '../components/languages/DeleteConfirmDialog';
import { useLanguages, Language }    from '../hooks/useLanguages';
import { strings } from '../i18n/messages';

/**
 * Language Management Page (语言管理页面)
 * ------------------------------------
 * The page manages available programming languages in the system.
 * 本页面用于管理系统支持的编程语言。
 *
 * Main Components (主要组成):
 *   • LanguageToolbar – top toolbar: add, toggle delete/edit mode, refresh list
 *   • LanguageTable   – table view: display languages and trigger inline edit/delete
 *   • LanguageFormDialog / DeleteConfirmDialog – modals: add/edit/delete
 *
 * Data source (数据来源):
 *   Uses custom hook `useLanguages` for CRUD; all UI state is kept locally in this component.
 */
// Local state type definitions (本地状态类型定义)
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

// Local UI state (本地 UI 可见状态)
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [edit, setEdit]             = useState<EditState>({ open:false, lang:null });
  const [del,  setDel]              = useState<DelState>({ open:false, id:null, name:'' });

  const [snack,setSnack] = useState<{open:boolean; msg:string; sev:'success'|'error'|'warning'}>({open:false, msg:'', sev:'success'});
  const notify = (
    msg: string,
    sev: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setSnack({ open: true, msg, sev });
  };

// CRUD handlers (增删改处理函数)
  const handleAdd = useCallback(async (v: any) => {
    try {
      await addLanguage(v);
      notify(strings.addSuccess(v.name));
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setAddOpen(false);
    }
  }, [addLanguage]);

  const handleSave = useCallback(async (v: any) => {
    if (!edit.lang) return;

    try {
      await updateLanguage(edit.lang.languageId, v);
      notify(strings.updateSuccess(v.name));
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setEdit({ open: false, lang: null });
    }
  }, [edit, updateLanguage]);

  const confirmDel = useCallback(async () => {
    if (del.id == null) return;

    try {
      await deleteLanguage(del.id);
      notify(strings.deleteSuccess(del.name));
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setDel({ open: false, id: null, name: '' });
      setShowDelete(false);
    }
  }, [del, deleteLanguage]);

// Render (渲染)
  return (
    <>
    {loading && (
      <Box sx={{ display:'flex', justifyContent:'center', my:4 }}>
        <CircularProgress />
      </Box>
    )}
    <Box sx={{ p:3 }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <h1 style={{margin:0}}>Language Management</h1>
        <LanguageToolbar
          showDelete={showDelete} showEdit={showEdit}
          onAdd={() => {
            // Blur the triggering element before opening the dialog to avoid a11y warning (打开对话框前先失焦触发元素，避免 a11y 警告)
            (document.activeElement as HTMLElement | null)?.blur();
            setAddOpen(true);
          }}
          onToggleDelete={() => setShowDelete((p)=>!p)}
          onToggleEdit={() => setShowEdit((p)=>!p)}
          onRefresh={fetchLanguages}
        />
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => { /* TODO: optionally clear error state / 可选：清除错误状态 */ }}
        >
          {error.message ?? String(error)}
        </Alert>
      )}

      <LanguageTable
        languages={languages}
        showDelete={showDelete}
        showEdit={showEdit}
        onEdit={(lang: Language) => setEdit({open:true, lang})}
        onDelete={(id,name) => setDel({open:true,id,name})}
      />

      {/* dialogs */}
      <LanguageFormDialog
        open={addOpen}
        mode="add"
        initialValues={{ name:'', compilerCmd:'', runtimeCmd:'', suffix:'', version:'' }}
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
                name:        edit.lang.name,
                compilerCmd: edit.lang.compilerCmd ?? '',
                runtimeCmd:  edit.lang.runtimeCmd ?? '',
                suffix:      edit.lang.suffix,
                version:     edit.lang.version,
              }
            : { name:'', compilerCmd:'', runtimeCmd:'', suffix:'', version:'' }
        }
        languages={languages}
        ignoreId={edit.lang?.languageId}
        onSubmit={handleSave}
        onClose={() => setEdit({open:false, lang:null})}
      />
      <DeleteConfirmDialog
        open={del.open}
        name={del.name}
        onClose={() => setDel({open:false,id:null,name:''})}
        onConfirm={confirmDel}
      />

      {/* feedback */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({...snack,open:false})}
        anchorOrigin={{vertical:'bottom',horizontal:'center'}} >
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack({...snack,open:false})}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
    </>
  );
}