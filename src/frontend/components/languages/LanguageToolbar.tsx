import React from 'react';
import { Button, Stack, Tooltip, useTheme } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  showDelete: boolean;
  showEdit: boolean;
  onAdd: () => void;
  onToggleDelete: () => void;
  onToggleEdit: () => void;
  onRefresh: () => void;
}

export default function LanguageToolbar({
  showDelete,
  showEdit,
  onAdd,
  onToggleDelete,
  onToggleEdit,
  onRefresh,
}: Props) {
  const theme = useTheme();
  const darkBtn =
    theme.palette.mode === 'dark'
      ? { backgroundColor: theme.palette.grey[100], color: theme.palette.grey[900] }
      : {};

  return (
    <Stack direction="row" spacing={2}>
      <Tooltip title="Add">
        <Button variant="contained" size="small" onClick={onAdd} sx={darkBtn}>
          Add
        </Button>
      </Tooltip>
      <Tooltip title="Delete mode">
        <Button
          variant="contained"
          size="small"
          color={showDelete ? 'error' : 'primary'}
          onClick={onToggleDelete}
          sx={darkBtn}
        >
          Delete
        </Button>
      </Tooltip>
      <Tooltip title="Edit mode">
        <Button
          variant="contained"
          size="small"
          color={showEdit ? 'secondary' : 'primary'}
          onClick={onToggleEdit}
          sx={darkBtn}
        >
          Edit
        </Button>
      </Tooltip>
      <Tooltip title="Refresh">
        <Button
          variant="contained"
          size="small"
          startIcon={<RefreshIcon fontSize="small" />}
          onClick={onRefresh}
          sx={darkBtn}
        >
          Refresh
        </Button>
      </Tooltip>
    </Stack>
  );
}