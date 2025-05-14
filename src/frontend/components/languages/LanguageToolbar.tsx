/**
 * LanguageToolbar component ― 语言工具栏组件
 * ----------------------------------------
 * Displays a responsive toolbar for adding, editing, deleting, and refreshing languages.
 * 此组件用于显示添加、编辑、删除及刷新语言的响应式工具栏。
 *
 * It switches between icon buttons on small screens and text buttons on larger screens.
 * 小屏幕显示图标按钮，大屏幕显示文字按钮。
 */
import React from 'react';
import { Button, Stack, Tooltip, useTheme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { strings } from '../../i18n/messages';
import useMediaQuery from '@mui/material/useMediaQuery';

// Component props (组件属性)
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
    <Stack direction="row" spacing={2}>
      <>
        <Tooltip title={strings.tooltipAdd} placement="top">
          <IconButton onClick={onAdd} disabled={showDelete || showEdit}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={strings.tooltipDeleteMode} placement="top">
          <IconButton
            color={showDelete ? "error" : "default"}
            onClick={onToggleDelete}
            disabled={showEdit}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={strings.tooltipEditMode} placement="top">
          <IconButton
            color={showEdit ? "secondary" : "default"}
            onClick={onToggleEdit}
            disabled={showDelete}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={strings.tooltipRefresh} placement="top" sx={{mb:1}}>
          <IconButton onClick={onRefresh} disabled={showDelete || showEdit}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    </Stack>
  );
}
