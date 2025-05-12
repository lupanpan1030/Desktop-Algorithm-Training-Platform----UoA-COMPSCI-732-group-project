// src/frontend/pages/LanguageAdmin.tsx
import React, { useState, useEffect } from 'react';
import {
  useTheme,
  Box,
  Stack,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Language Management Page (Add/Delete Languages)
 * - List: GET /languages
 * - Add: POST /languages
 * - Delete: DELETE /languages/:id
 *
 * ⚠️ Make sure the backend `npm run dev` is running on port 6785,
 *    otherwise fetch will 404 / ECONNREFUSED.
 */
export default function LanguageAdmin() {
  const [languages, setLanguages] = useState([]);
  const [form, setForm] = useState({
    name: '',
    compile_command: '',
    run_command: '',
    suffix: '',
    version: ''
  });
  const [errors, setErrors] = useState({
    name: false,
    suffix: false,
    run_command: false,
  });
  const [showDelete, setShowDelete] = useState(false); // toggles delete mode
  const [showEdit, setShowEdit] = useState(false);   // toggles edit mode
  const [openAdd, setOpenAdd] = useState(false);       // controls add‑dialog
  const [openEdit, setOpenEdit] = useState(false); // controls edit‑dialog
  const [editForm, setEditForm] = useState({
    name: '',
    compile_command: '',
    run_command: '',
    suffix: '',
    version: ''
  });
  const [editId, setEditId] = useState(null); // current editing languageId

  const [confirm, setConfirm] = useState({ open: false, id: null, name: '' }); // delete confirmation
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // feedback

  const theme = useTheme();
  const darkBtnStyle =
    theme.palette.mode === 'dark'
      ? {
          backgroundColor: theme.palette.grey[100],
          color: theme.palette.grey[900],
          '&:hover': { backgroundColor: theme.palette.grey[300] },
        }
      : {};

  /** Normalises payload for either add or edit */
  const buildPayload = (formOrEdit) => {
    const compileCmdStr = (formOrEdit.compile_command ?? '').trim();
    const runCmdStr     = (formOrEdit.run_command ?? '').trim();
    const versionStr    = (formOrEdit.version ?? '').trim();

    return {
      run_command:     runCmdStr,
      compile_command: compileCmdStr,
      version:         versionStr,
      runtimeCmd:      runCmdStr,
      compilerCmd:     compileCmdStr,
      name:            formOrEdit.name,
      suffix:          formOrEdit.suffix,
    };
  };

  /* Fetch all languages */
  const fetchLanguages = async () => {
    try {
      const res = await fetch("http://localhost:6785/languages");
      const raw = await res.json();
      
    console.log("👉 /languages raw =", raw);        // 调试用，保留

    /* ① 把返回值统一折腾成数组 */
    const list =
      Array.isArray(raw)                     ? raw :
      Array.isArray(raw.languages)           ? raw.languages :
      Array.isArray(raw.data)                ? raw.data :
      Array.isArray(raw.data?.languages)     ? raw.data.languages :
      Object.values(raw);        /* 兜底：{1:{…},2:{…}} 这种 */

    /* ② 把各种别名字段映射成组件统一用的字段名 */
    const mapped = list
      .map((l) => {
        // 统一主键，优先转成 number
        const rawId = l.languageId ?? l.language_id ?? l.id ?? l.languageID;
        const numericId =
          typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;

        return {
          ...l,

          /* 主键：确保始终为数字 */
          languageId: numericId,

          /* 编译命令：compile_command / compileCmd / compilerCmd … */
          compile_command:
            l.compile_command ??
            l.compileCmd ??
            l.compilerCmd ??
            l.compiledCmd ??
            null,

          /* 运行命令：run_command / runCmd / runtimeCmd … */
          run_command:
            l.run_command ??
            l.runCmd ??
            l.runtimeCmd ??
            l.executeCmd ??
            l.runCommand ??
            null,
        };
      })
      /* 删除掉没有合法 ID 的脏数据，避免 422 */
      .filter((l) => Number.isFinite(l.languageId));

    setLanguages(mapped);
  } catch (err) {
    console.error("Failed to fetch languages", err);
    setLanguages([]);
  }
};

  useEffect(() => {
    fetchLanguages();
  }, []);

  /* Handle input changes + clear error state */
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    // 如果正在修改必填字段，实时清除错误提示
    if (field === 'name' || field === 'suffix' || field === 'run_command') {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const toggleDeleteMode = () => setShowDelete((prev) => !prev);

  const toggleEditMode = () => setShowEdit((prev) => !prev);


  const handleEditClick = (lang) => {
    setEditId(lang.languageId);
    setEditForm({
      name: lang.name ?? '',
      compile_command: lang.compile_command ?? lang.compilerCmd ?? '',
      run_command: lang.run_command ?? lang.runCmd ?? '',
      suffix: lang.suffix ?? '',
      version: lang.version ?? ''
    });
    setErrors({ name: false, suffix: false });
    setOpenEdit(true);
  };

  const handleEditChange = (field) => (e) => {
    const value = e.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' || field === 'suffix' || field === 'run_command') {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const updateLanguage = async () => {
    if (!editId) return;

    /* ===== Front‑end validation (same rules as Add) ===== */
    const newErrors = {
      name: !editForm.name.trim(),
      suffix: !editForm.suffix.trim(),
      run_command: !editForm.run_command.trim(),
    };
    if (newErrors.name || newErrors.suffix || newErrors.run_command) {
      setErrors(newErrors);
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'warning',
      });
      return;
    }

    try {
      const payload = buildPayload(editForm);
      const res = await fetch(`http://localhost:6785/languages/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // ✅ success
        setSnackbar({
          open: true,
          message: `Updated "${editForm.name}"`,
          severity: 'success',
        });
        setOpenEdit(false);
        fetchLanguages();
      } else {
        // ❌ back‑end rejected
        let msg = 'Update failed';
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          try {
            const text = await res.text();
            if (text) msg = text;
          } catch {}
        }
        setSnackbar({
          open: true,
          message: msg,
          severity: 'error',
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Network error, update failed',
        severity: 'error',
      });
    }
  };

  const handleOpenAdd = () => {
    setErrors({ name: false, suffix: false, run_command: false });
    setOpenAdd(true);
  };
  const handleCloseAdd = () => {
    setErrors({ name: false, suffix: false, run_command: false });
    setOpenAdd(false);
  };

  const addLanguage = async () => {
    /* ---------- front‑end validation ---------- */
    const blank = (s) => !s || s.trim() === '';
    const newErrors = {
      name: blank(form.name),
      suffix: blank(form.suffix),
      run_command: blank(form.run_command),
    };
    if (newErrors.name || newErrors.suffix || newErrors.run_command) {
      setErrors(newErrors);
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'warning',
      });
      return;
    }

    /* ---------- build request payload (camelCase only) ---------- */
    const payload = {
      name: form.name.trim(),
      runtimeCmd: form.run_command.trim(),
      compilerCmd: blank(form.compile_command) ? null : form.compile_command.trim(),
      version:     blank(form.version)         ? null : form.version.trim(),
      suffix:      form.suffix.trim(),
    };

    try {
      const res = await fetch('http://localhost:6785/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSnackbar({
          open: true,
          message: `Added "${form.name}"`,
          severity: 'success',
        });
        /* clear form & refresh list */
        setForm({
          name: '',
          compile_command: '',
          run_command: '',
          suffix: '',
          version: ''
        });
        handleCloseAdd();
        fetchLanguages();
      } else {
        /* backend rejected (validation, duplicate, etc.) */
        let msg = 'Add failed';
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          try {
            const text = await res.text();
            if (text) msg = text;
          } catch {}
        }
        setSnackbar({ open: true, message: msg, severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Network error, add failed', severity: 'error' });
    }
  };

  const handleDeleteClick = (id, name) => {
    setConfirm({ open: true, id, name });
  };

  const confirmDelete = async () => {
    const { id, name } = confirm;
    try {
      const res = await fetch(`http://localhost:6785/languages/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // ✅ successfully deleted
        setSnackbar({
          open: true,
          message: `Deleted "${name}"`,
          severity: 'success'
        });
        fetchLanguages();
        setShowDelete(false);         // leave delete mode after success
      } else {
        // ❌ backend rejected (e.g., trying to delete the last language)
        // 更健壮地解析后端错误信息
        let msg = 'Delete failed';
        try {
          // 尝试解析 JSON（推荐后端返回 {message: "..."}）
          const data = await res.json();
          if (data?.message) {
            msg = data.message;
          }
        } catch (_) {
          // 如果不是 JSON，再退而求其次读 text
          try {
            const text = await res.text();
            if (text) msg = text;
          } catch (_) {}
        }
        setSnackbar({
          open: true,
          message: msg,
          severity: 'error'
        });
      }
    } catch (e) {
      setSnackbar({
        open: true,
        message: 'Network error, delete failed',
        severity: 'error'
      });
    } finally {
      // close the confirmation dialog
      setConfirm({ open: false, id: null, name: '' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <h1 style={{ margin: 0 }}>Language Management</h1>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Add new language">
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenAdd}
              sx={darkBtnStyle}
            >
              Add
            </Button>
          </Tooltip>
          <Tooltip title="Toggle delete mode">
            <Button
              variant="contained"
              size="small"
              color={showDelete ? 'error' : 'primary'}
              onClick={toggleDeleteMode}
              sx={darkBtnStyle}
            >
              Delete
            </Button>
          </Tooltip>
          <Tooltip title="Toggle edit mode">
            <Button
              variant="contained"
              size="small"
              color={showEdit ? 'secondary' : 'primary'}
              onClick={toggleEditMode}
              sx={darkBtnStyle}
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Refresh list">
            <Button
              variant="contained"
              size="small"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={fetchLanguages}
              sx={darkBtnStyle}
            >
              Refresh
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      <Fade in timeout={500}>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor:
                    theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#f5f5f5',
                }}
              >
                <TableCell align="center" sx={{ borderRight: '1px solid rgba(224,224,224,1)', color: 'text.primary' }}>
                  <strong>Language</strong>
                </TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid rgba(224,224,224,1)', color: 'text.primary' }}>
                  <strong>Compile Command</strong>
                </TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid rgba(224,224,224,1)', color: 'text.primary' }}>
                  <strong>Suffix</strong>
                </TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid rgba(224,224,224,1)', color: 'text.primary' }}>
                  <strong>Version</strong>
                </TableCell>
                <TableCell align="center" sx={{ borderRight: '1px solid rgba(224,224,224,1)', color: 'text.primary' }}>
                  <strong>Run Command</strong>
                </TableCell>
                <TableCell align="center" sx={{ color: 'text.primary' }}>
                  {(showDelete || showEdit) && <strong>Action</strong>}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {languages.map((lang) => (
                <TableRow
                  key={lang.languageId ?? lang.language_id}
                  sx={{
                    height: 46,
                    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                    transition: 'background-color 0.3s',
                  }}
                >
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224,224,224,1)', borderRight: '1px solid rgba(224,224,224,1)' }}>
                    {lang.name}
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224,224,224,1)', borderRight: '1px solid rgba(224,224,224,1)' }}>
                    {lang.compile_command ?? lang.compilerCmd ?? '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224,224,224,1)', borderRight: '1px solid rgba(224,224,224,1)' }}>
                    {lang.suffix ?? '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224,224,224,1)', borderRight: '1px solid rgba(224,224,224,1)' }}>
                    {lang.version ?? '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224,224,224,1)', borderRight: '1px solid rgba(224,224,224,1)' }}>
                    {lang.run_command ?? lang.runCmd ?? '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(224,224,224,1)' }}>
                    {showEdit && (
                      <Tooltip title={`Edit ${lang.name}`}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleEditClick(lang)}
                          sx={{
                            mr: showDelete ? 1 : 0,
                            bgcolor: theme.palette.secondary.light,
                            color: theme.palette.getContrastText(theme.palette.secondary.light),
                            '&:hover': { bgcolor: theme.palette.secondary.main },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {showDelete && (
                      <Tooltip title={`Delete ${lang.name}`}>
                        <IconButton
                          edge="end"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(lang.languageId, lang.name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Fade>

      <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
        <DialogTitle>Add Language</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <TextField
            label="Language Name"
            size="small"
            value={form.name}
            onChange={handleChange('name')}
            required
            error={errors.name}
            helperText={errors.name ? 'Required' : ''}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Compile Command"
            size="small"
            value={form.compile_command}
            onChange={handleChange('compile_command')}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Run Command"
            size="small"
            value={form.run_command}
            onChange={handleChange('run_command')}
            required
            error={errors.run_command}
            helperText={errors.run_command ? 'Required' : ''}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Suffix"
            size="small"
            value={form.suffix}
            onChange={handleChange('suffix')}
            required
            error={errors.suffix}
            helperText={errors.suffix ? 'Required' : ''}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Version"
            size="small"
            value={form.version}
            onChange={handleChange('version')}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseAdd} sx={darkBtnStyle}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addLanguage}
            sx={darkBtnStyle}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit language dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Language</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <TextField
            label="Language Name"
            size="small"
            value={editForm.name}
            onChange={handleEditChange('name')}
            required
            error={errors.name}
            helperText={errors.name ? 'Required' : ''}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Compile Command"
            size="small"
            value={editForm.compile_command}
            onChange={handleEditChange('compile_command')}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Run Command"
            size="small"
            value={editForm.run_command}
            onChange={handleEditChange('run_command')}
            required
            error={errors.run_command}
            helperText={errors.run_command ? 'Required' : ''}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Suffix"
            size="small"
            value={editForm.suffix}
            onChange={handleEditChange('suffix')}
            required
            error={errors.suffix}
            helperText={errors.suffix ? 'Required' : ''}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Version"
            size="small"
            value={editForm.version}
            onChange={handleEditChange('version')}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenEdit(false)} sx={darkBtnStyle}>
            Cancel
          </Button>
          <Button variant="contained" onClick={updateLanguage}>Save</Button>
        </DialogActions>
      </Dialog>


      {/* Delete confirmation dialog */}
      <Dialog open={confirm.open} onClose={() => setConfirm({ ...confirm, open: false })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete "{confirm.name}"?</DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setConfirm({ ...confirm, open: false })} sx={darkBtnStyle}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}