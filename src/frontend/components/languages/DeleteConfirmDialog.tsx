/**
 * DeleteConfirmDialog component — 删除确认对话框组件
 * -----------------------------------------------
 * Shows a confirmation dialog to verify that the user really wants to delete
 * an item. 该组件显示一个确认对话框，用于确认用户确实要删除条目。
 */
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { strings } from '../../i18n/messages';

// Component props (组件属性)
interface Props {
  open: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmDialog({ open, name, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{strings.confirmDeleteTitle}</DialogTitle>
      {/* Confirmation message with item name 确认信息，包含条目名称 */}
      <DialogContent>{strings.confirmDeleteMessage(name)}</DialogContent>
      {/* Cancel and Delete buttons 取消和删除按钮 */}
      <DialogActions sx={{ px : 3, pb : 2}}>
        <Button variant="contained" size="small" onClick={onClose} sx={{mr:1}}>{strings.btnCancel}</Button>
        <Button variant="contained" color="secondary" size="small"onClick={onConfirm}>{strings.btnDelete}</Button>
      </DialogActions>
    </Dialog>
  );
}