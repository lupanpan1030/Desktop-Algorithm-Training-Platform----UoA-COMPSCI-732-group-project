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
import SearchIcon from '@mui/icons-material/Search';
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
  const [openSearch, setOpenSearch] = useState(false); // controls search dialog
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  /* Fetch all languages */
  const fetchLanguages = async () => {
    const res = await fetch('http://localhost:6785/languages');
    const data = await res.json();
    setLanguages(data);
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  /* Handle input changes */
  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleDeleteMode = () => setShowDelete((prev) => !prev);

  const toggleEditMode = () => setShowEdit((prev) => !prev);

  const handleOpenSearch = () => {
    setSearchValue(searchTerm);
    setOpenSearch(true);
  };

  const handleSearchChange = (e) => setSearchValue(e.target.value);

  const performSearch = () => {
    setSearchTerm(searchValue.trim());
    setOpenSearch(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchValue('');
    setOpenSearch(false);
  };

  const handleEditClick = (lang) => {
    setEditId(lang.languageId);
    setEditForm({
      name: lang.name ?? '',
      compile_command: lang.compile_command ?? lang.compilerCmd ?? '',
      run_command: lang.run_command ?? lang.runCmd ?? '',
      suffix: lang.suffix ?? '',
      version: lang.version ?? ''
    });
    setOpenEdit(true);
  };

  const handleEditChange = (field) => (e) =>
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateLanguage = async () => {
    if (!editId) return;
    try {
      await fetch(`http://localhost:6785/languages/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          runtimeCmd: editForm.run_command,
          compilerCmd: editForm.compile_command || null,
          version: editForm.version || null,
          suffix: editForm.suffix
        }),
      });
      setSnackbar({ open: true, message: `Updated "${editForm.name}"`, severity: 'success' });
      setOpenEdit(false);
      fetchLanguages();
    } catch (e) {
      setSnackbar({ open: true, message: 'Update failed', severity: 'error' });
    }
  };

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const addLanguage = async () => {
    if (!form.name.trim()) {
      setSnackbar({ open: true, message: 'Please enter a language name', severity: 'warning' });
      return;
    }
    if (!form.suffix.trim()) return;
    try {
      await fetch('http://localhost:6785/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          runtimeCmd: form.run_command,
          compilerCmd: form.compile_command || null,
          version: form.version || null,
          suffix: form.suffix
        }),
      });
      setSnackbar({ open: true, message: `Added "${form.name}"`, severity: 'success' });
      setForm({
        name: '',
        compile_command: '',
        run_command: '',
        suffix: '',
        version: ''
      });
      handleCloseAdd();
      fetchLanguages();
    } catch (e) {
      setSnackbar({ open: true, message: 'Add failed', severity: 'error' });
    }
  };

  const handleDeleteClick = (id, name) => {
    setConfirm({ open: true, id, name });
  };

  const confirmDelete = async () => {
    const { id, name } = confirm;
    try {
      await fetch(`http://localhost:6785/languages/${id}`, { method: 'DELETE' });
      setSnackbar({ open: true, message: `Deleted "${name}"`, severity: 'success' });
      fetchLanguages();
    } catch (e) {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    } finally {
      setConfirm({ open: false, id: null, name: '' });
      setShowDelete(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <h1 style={{ margin: 0 }}>Language Management</h1>
        <Stack direction="row" spacing={1}>
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
          <Tooltip title="Search languages">
            <Button
              variant="contained"
              size="small"
              startIcon={<SearchIcon fontSize="small" />}
              onClick={handleOpenSearch}
              sx={darkBtnStyle}
            >
              Search
            </Button>
          </Tooltip>
          {searchTerm && (
            <Tooltip title="Clear search">
              <Button
                variant="outlined"
                size="small"
                onClick={clearSearch}
              >
                Clear
              </Button>
            </Tooltip>
          )}
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
              {(searchTerm
                ? languages.filter((lang) => {
                    const kw = searchTerm.toLowerCase();
                    return (
                      lang.name.toLowerCase().includes(kw) ||
                      (lang.suffix ?? '').toLowerCase().includes(kw) ||
                      (lang.version ?? '').toLowerCase().includes(kw)
                    );
                  })
                : languages
              ).map((lang) => (
                <TableRow
                  key={lang.languageId}
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
          />
          <TextField
            label="Compile Command"
            size="small"
            value={form.compile_command}
            onChange={handleChange('compile_command')}
          />
          <TextField
            label="Run Command"
            size="small"
            value={form.run_command}
            onChange={handleChange('run_command')}
          />
          <TextField
            label="Suffix"
            size="small"
            value={form.suffix}
            onChange={handleChange('suffix')}
          />
          <TextField
            label="Version"
            size="small"
            value={form.version}
            onChange={handleChange('version')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>
          <Button variant="contained" onClick={addLanguage}>Add</Button>
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
          />
          <TextField
            label="Compile Command"
            size="small"
            value={editForm.compile_command}
            onChange={handleEditChange('compile_command')}
          />
          <TextField
            label="Run Command"
            size="small"
            value={editForm.run_command}
            onChange={handleEditChange('run_command')}
          />
          <TextField
            label="Suffix"
            size="small"
            value={editForm.suffix}
            onChange={handleEditChange('suffix')}
          />
          <TextField
            label="Version"
            size="small"
            value={editForm.version}
            onChange={handleEditChange('version')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={updateLanguage}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Search dialog */}
      <Dialog open={openSearch} onClose={() => setOpenSearch(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Search Languages</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            label="Keyword (name, suffix, version)"
            size="small"
            value={searchValue}
            onChange={handleSearchChange}
          />
        </DialogContent>
        <DialogActions>
          {searchTerm && (
            <Button onClick={clearSearch}>Clear</Button>
          )}
          <Button onClick={() => setOpenSearch(false)}>Cancel</Button>
          <Button variant="contained" onClick={performSearch}>Search</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={confirm.open} onClose={() => setConfirm({ ...confirm, open: false })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete "{confirm.name}"?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ ...confirm, open: false })}>Cancel</Button>
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