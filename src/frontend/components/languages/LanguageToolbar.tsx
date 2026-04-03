import React from "react";
import { Stack, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

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
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      <Button
        variant="contained"
        color="secondary"
        startIcon={<AddIcon />}
        onClick={onAdd}
        disabled={showDelete || showEdit}
      >
        Add language
      </Button>
      <Button
        variant={showEdit ? "contained" : "outlined"}
        startIcon={<EditIcon />}
        onClick={onToggleEdit}
        disabled={showDelete}
      >
        Edit mode
      </Button>
      <Button
        variant={showDelete ? "contained" : "outlined"}
        color={showDelete ? "error" : "inherit"}
        startIcon={<DeleteIcon />}
        onClick={onToggleDelete}
        disabled={showEdit}
      >
        Delete mode
      </Button>
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        disabled={showDelete || showEdit}
      >
        Refresh
      </Button>
    </Stack>
  );
}
