import React from "react";
import { Button, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
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
  const mode = showEdit ? "edit" : showDelete ? "delete" : "browse";

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

      <ToggleButtonGroup
        exclusive
        size="small"
        value={mode}
        onChange={(_, nextMode) => {
          if (!nextMode || nextMode === mode) {
            return;
          }

          if (nextMode === "browse") {
            if (showEdit) {
              onToggleEdit();
            }
            if (showDelete) {
              onToggleDelete();
            }
            return;
          }

          if (nextMode === "edit") {
            if (showDelete) {
              onToggleDelete();
            }
            if (!showEdit) {
              onToggleEdit();
            }
            return;
          }

          if (nextMode === "delete") {
            if (showEdit) {
              onToggleEdit();
            }
            if (!showDelete) {
              onToggleDelete();
            }
          }
        }}
        sx={{
          "& .MuiToggleButton-root": {
            px: 1.35,
            textTransform: "none",
          },
        }}
      >
        <ToggleButton value="browse">Browse</ToggleButton>
        <ToggleButton value="edit">
          <Stack direction="row" spacing={0.7} alignItems="center">
            <EditIcon fontSize="small" />
            <span>Edit</span>
          </Stack>
        </ToggleButton>
        <ToggleButton value="delete" color="error">
          <Stack direction="row" spacing={0.7} alignItems="center">
            <DeleteIcon fontSize="small" />
            <span>Delete</span>
          </Stack>
        </ToggleButton>
      </ToggleButtonGroup>

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
