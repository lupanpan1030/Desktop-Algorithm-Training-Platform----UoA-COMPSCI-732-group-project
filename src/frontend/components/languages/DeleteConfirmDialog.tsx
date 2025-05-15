/**
 * DeleteConfirmDialog component
 * -----------------------------------------------
 * Shows a confirmation dialog to verify that the user really wants to delete
 * an item.
 */
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { strings } from '../../i18n/messages';

// Component props
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
      {/* Confirmation message with item name */}
      <DialogContent>{strings.confirmDeleteMessage(name)}</DialogContent>
      {/* Cancel and Delete buttons */}
      <DialogActions sx={{ px : 3, pb : 2}}>
        <Button variant="contained" size="small" onClick={onClose} sx={{mr:1}}>{strings.btnCancel}</Button>
        <Button variant="contained" color="secondary" size="small"onClick={onConfirm}>{strings.btnDelete}</Button>
      </DialogActions>
    </Dialog>
  );
}