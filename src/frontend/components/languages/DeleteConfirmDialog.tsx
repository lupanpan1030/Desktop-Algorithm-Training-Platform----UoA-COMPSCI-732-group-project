import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { strings } from '../../i18n/messages';

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
      <DialogContent>{strings.confirmDeleteMessage(name)}</DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>{strings.btnCancel}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>{strings.btnDelete}</Button>
      </DialogActions>
    </Dialog>
  );
}