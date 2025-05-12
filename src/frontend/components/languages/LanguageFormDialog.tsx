import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert,
} from '@mui/material';

interface Values {
  name: string;
  compile_command: string;
  run_command: string;
  suffix: string;
  version: string;
}

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues: Values;
  onSubmit: (v: Values) => void;
  onClose: () => void;
}

const blank: Values = { name: '', compile_command: '', run_command: '', suffix: '', version: '' };

export default function LanguageFormDialog({
  open, mode, initialValues, onSubmit, onClose,
}: Props) {
  const [form, setForm] = useState<Values>(blank);
  const [err, setErr] = useState<Record<string, boolean>>({});
  const [submitErr, setSubmitErr] = useState<string>('');

  useEffect(() => {
    setForm(initialValues || blank);
    setErr({});
    setSubmitErr('');
  }, [initialValues, open]);

  const change = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = () => {
    const blankField = (s: string) => !s.trim();
    const e = {
      name: blankField(form.name),
      suffix: blankField(form.suffix),
      run: blankField(form.run_command),
    };

    if (e.name || e.suffix || e.run) {
      setErr(e as any);
      setSubmitErr('Please fill all required fields (marked with *).');
      return;
    }

    setSubmitErr('');
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'add' ? 'Add Language' : 'Edit Language'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
        {submitErr && <Alert severity="warning" sx={{ mb: 1 }}>{submitErr}</Alert>}

        {/* 1. Language */}
        <TextField
          label="Language *"
          value={form.name}
          onChange={change('name')}
          error={!!err.name}
          helperText={err.name ? 'Required' : ''}
          fullWidth
          size="small"
        />

        {/* 2. Compile Cmd */}
        <TextField
          label="Compile Cmd"
          value={form.compile_command}
          onChange={change('compile_command')}
          fullWidth
          size="small"
        />

        {/* 3. Run Cmd */}
        <TextField
          label="Run Cmd *"
          value={form.run_command}
          onChange={change('run_command')}
          error={!!err.run}
          helperText={err.run ? 'Required' : ''}
          fullWidth
          size="small"
        />

        {/* 4. Suffix */}
        <TextField
          label="Suffix *"
          value={form.suffix}
          onChange={change('suffix')}
          error={!!err.suffix}
          helperText={err.suffix ? 'Required' : ''}
          fullWidth
          size="small"
        />

        {/* 5. Version */}
        <TextField
          label="Version"
          value={form.version}
          onChange={change('version')}
          fullWidth
          size="small"
        />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}