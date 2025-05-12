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
  const theme = useTheme();
  // Determine if viewport is small (判断视口是否为小屏)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const darkBtn =
    theme.palette.mode === 'dark'
      ? { backgroundColor: theme.palette.grey[100], color: theme.palette.grey[900] }
      : {};
  // Adjust button colors in dark mode to maintain contrast (暗色模式下调整按钮颜色，以保持对比度)

  return (
    <Stack direction="row" spacing={2}>
      {isMobile ? (
        <>
          <Tooltip title={strings.tooltipAdd}>
            <IconButton size="small" onClick={onAdd} sx={darkBtn}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={strings.tooltipDeleteMode}>
            <IconButton
              size="small"
              color={showDelete ? 'error' : 'default'}
              onClick={onToggleDelete}
              sx={darkBtn}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={strings.tooltipEditMode}>
            <IconButton
              size="small"
              color={showEdit ? 'secondary' : 'default'}
              onClick={onToggleEdit}
              sx={darkBtn}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={strings.tooltipRefresh}>
            <IconButton size="small" onClick={onRefresh} sx={darkBtn}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <>
          <Tooltip title={strings.tooltipAdd}>
            <Button variant="contained" size="small" onClick={onAdd} sx={darkBtn}>
              {strings.btnAdd}
            </Button>
          </Tooltip>

          <Tooltip title={strings.tooltipDeleteMode}>
            <Button
              variant="contained"
              size="small"
              color={showDelete ? 'error' : 'primary'}
              onClick={onToggleDelete}
              sx={darkBtn}
            >
              {strings.btnDelete}
            </Button>
          </Tooltip>

          <Tooltip title={strings.tooltipEditMode}>
            <Button
              variant="contained"
              size="small"
              color={showEdit ? 'secondary' : 'primary'}
              onClick={onToggleEdit}
              sx={darkBtn}
            >
              {strings.btnEdit}
            </Button>
          </Tooltip>

          <Tooltip title={strings.tooltipRefresh}>
            <Button
              variant="contained"
              size="small"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={onRefresh}
              sx={darkBtn}
            >
              {strings.btnRefresh}
            </Button>
          </Tooltip>
        </>
      )}
    </Stack>
  );
}