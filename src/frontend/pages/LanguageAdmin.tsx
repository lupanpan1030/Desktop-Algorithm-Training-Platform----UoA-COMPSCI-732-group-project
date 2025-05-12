import React, { useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import LanguageToolbar     from '../components/languages/LanguageToolbar';
import LanguageTable       from '../components/languages/LanguageTable';
import LanguageFormDialog  from '../components/languages/LanguageFormDialog';
import DeleteConfirmDialog from '../components/languages/DeleteConfirmDialog';
import { useLanguages }    from '../hooks/useLanguages';

/**
 * LanguageAdmin Page
 * ------------------
 * Admin interface for managing supported programming languages.
 * Combines:
 *   • LanguageToolbar – quick actions (add, toggle edit/delete mode, refresh)
 *   • LanguageTable   – list view with inline edit/delete triggers
 *   • LanguageFormDialog / DeleteConfirmDialog – modal forms
 *
 * Data operations come from the custom `useLanguages` hook while
 * all UI state is kept locally in this component.
 */

export default function LanguageAdmin() {
  const { languages, addLanguage, updateLanguage, deleteLanguage, fetchLanguages } = useLanguages();

// ---------- Local UI state ----------

  const [showDelete, setShowDelete] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [edit, setEdit]             = useState<{ open:boolean; lang:any|null }>({ open:false, lang:null });
  const [del,  setDel]              = useState<{ open:boolean; id:number|null; name:string }>({ open:false, id:null, name:'' });

  const [snack,setSnack] = useState<{open:boolean; msg:string; sev:'success'|'error'|'warning'}>({open:false, msg:'', sev:'success'});
  const notify = (
    msg: string,
    sev: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setSnack({ open: true, msg, sev });
  };

// ---------- CRUD handlers ----------
  const handleAdd = async (v:any) => {
    try {
      await addLanguage(v);
      notify(`Added "${v.name}"`);
    } catch (e:any) {
      notify(e.message, 'error');
    } finally {
      setAddOpen(false);
    }
  };
  const handleSave = async (v:any) => {
    if (!edit.lang) return;

    try {
      await updateLanguage(edit.lang.languageId, v);
      notify(`Updated "${v.name}"`);
    } catch (e:any) {
      notify(e.message, 'error');
    } finally {
      setEdit({ open: false, lang: null });
    }
  };
  const confirmDel = async () => {
    if (del.id == null) return;

    try {
      await deleteLanguage(del.id);
      notify(`Deleted "${del.name}"`);
    } catch (e:any) {
      notify(e.message, 'error');
    } finally {
      setDel({ open: false, id: null, name: '' });
      setShowDelete(false);
    }
  };

// ---------- Render ----------
  return (
    <Box sx={{ p:3 }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <h1 style={{margin:0}}>Language Management</h1>
        <LanguageToolbar
          showDelete={showDelete} showEdit={showEdit}
          onAdd={() => setAddOpen(true)}
          onToggleDelete={() => setShowDelete((p)=>!p)}
          onToggleEdit={() => setShowEdit((p)=>!p)}
          onRefresh={fetchLanguages}
        />
      </Box>

      <LanguageTable
        languages={languages}
        showDelete={showDelete}
        showEdit={showEdit}
        onEdit={(lang) => setEdit({open:true, lang})}
        onDelete={(id,name) => setDel({open:true,id,name})}
      />

      {/* dialogs */}
      <LanguageFormDialog
        open={addOpen}
        mode="add"
        initialValues={{ name:'', compile_command:'', run_command:'', suffix:'', version:'' }}
        onSubmit={handleAdd}
        onClose={() => setAddOpen(false)}
      />
      <LanguageFormDialog
        open={edit.open}
        mode="edit"
        initialValues={edit.lang ?? { name:'', compile_command:'', run_command:'', suffix:'', version:'' }}
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
  );
}