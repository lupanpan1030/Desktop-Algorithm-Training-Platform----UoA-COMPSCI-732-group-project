import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, CircularProgress,
} from '@mui/material';
import { Language } from '../../hooks/useLanguages';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { strings } from '../../i18n/messages';

interface Values {
  name: string;
  compilerCmd: string;
  runtimeCmd: string;
  suffix: string;
  version: string;
}

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  initialValues: Values;
  /** full language list，用于本地重复检测 */
  languages: Language[];
  /** 编辑模式下本条记录的 id，用于忽略自身 */
  ignoreId?: number;
  onSubmit: (v: Values) => Promise<void> | void;
  onClose: () => void;
}

const blank: Values = {
  name: '', compilerCmd: '', runtimeCmd: '', suffix: '', version: ''
};

export default function LanguageFormDialog({
  open, mode, initialValues, languages, ignoreId, onSubmit, onClose,
}: Props) {
  const [form, setForm] = useState<Values>(blank);
  const [err, setErr] = useState<Record<string, boolean>>({});
  const [submitErr, setSubmitErr] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setForm(initialValues || blank);
    setErr({});
    setSubmitErr('');
  }, [initialValues, open]);

  const change = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    const blankField = (s: string) => !s.trim();
    const e = {
      name: blankField(form.name),
      suffix: blankField(form.suffix),
      runtime: blankField(form.runtimeCmd),
    };

    // 前端重复检测（忽略自身）
    const sameName = languages.some(
      (l: Language) => l.name.trim() === form.name.trim() && l.languageId !== ignoreId
    );
    const sameSuffix = languages.some(
      (l: Language) => (l.suffix ?? '').trim() === form.suffix.trim() && l.languageId !== ignoreId
    );
    if (sameName) e.name = true;
    if (sameSuffix) e.suffix = true;

    if (e.name || e.suffix || e.runtime) {
      if (sameName)       setSubmitErr(strings.nameExistsWarn);
      else if (sameSuffix) setSubmitErr(strings.suffixExistsWarn);
      else                setSubmitErr(strings.formBlankWarn);
      setErr(e as any);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      disableRestoreFocus
    >
      <DialogTitle>{mode === 'add' ? strings.formAddTitle : strings.formEditTitle}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
        {submitErr && <Alert severity="warning" sx={{ mb: 1 }}>{submitErr}</Alert>}

        {/* 1. Language */}
        <TextField
          autoFocus
          label={strings.lblLanguage}
          value={form.name}
          onChange={change('name')}
          error={!!err.name}
          helperText={err.name ? strings.helperRequired : ''}
          fullWidth
          size="small"
        />

        {/* 2. Compile Cmd */}
        <TextField
          label={strings.lblCompileCmd}
          value={form.compilerCmd}
          onChange={change('compilerCmd')}
          fullWidth
          size="small"
        />

        {/* 3. Run Cmd */}
        <TextField
          label={strings.lblRunCmd}
          value={form.runtimeCmd}
          onChange={change('runtimeCmd')}
          error={!!err.runtime}
          helperText={err.runtime ? strings.helperRequired : ''}
          fullWidth
          size="small"
        />

        {/* 4. Suffix */}
        <TextField
          label={strings.lblSuffix}
          value={form.suffix}
          onChange={change('suffix')}
          error={!!err.suffix}
          helperText={err.suffix ? strings.helperRequired : ''}
          fullWidth
          size="small"
        />

        {/* 5. Version */}
        <TextField
          label={strings.lblVersion}
          value={form.version}
          onChange={change('version')}
          fullWidth
          size="small"
        />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>{strings.btnCancel}</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : undefined}
        >
          {mode === 'add' ? strings.btnAdd : strings.btnSave}
        </Button>
      </DialogActions>
    </Dialog>
  );
}