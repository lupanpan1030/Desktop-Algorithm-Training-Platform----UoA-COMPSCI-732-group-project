/**
 * LanguageFormDialog component ― 语言表单对话框组件
 * ------------------------------------------------
 * Provides a modal form used for adding or editing a programming language.
 * 该组件提供用于新增或编辑编程语言的模态表单。
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
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
  /** Full language list for local duplication check (完整语言列表，用于本地重复检测) */
  languages: Language[];
  /** Current record id in edit‑mode, used to ignore self (编辑模式下本条记录的 id，用于忽略自身) */
  ignoreId?: number;
  onSubmit: (v: Values) => Promise<void> | void;
  onClose: () => void;
}

const blank: Values = {
  name: '',
  compilerCmd: '',
  runtimeCmd: '',
  suffix: '',
  version: '',
};

export default function LanguageFormDialog({
  open,
  mode,
  initialValues,
  languages,
  ignoreId,
  onSubmit,
  onClose,
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

  const change =
    (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    const blankField = (s: string) => !s.trim();
    const e = {
      name: blankField(form.name),
      suffix: blankField(form.suffix),
      runtime: blankField(form.runtimeCmd),
    };

    // Front‑end duplication check (ignore current item) 前端重复检测（忽略自身）
    const sameName = languages.some(
      (l: Language) =>
        l.name.trim() === form.name.trim() && l.languageId !== ignoreId
    );
    const sameSuffix = languages.some(
      (l: Language) =>
        (l.suffix ?? '').trim() === form.suffix.trim() &&
        l.languageId !== ignoreId
    );
    if (sameName) e.name = true;
    if (sameSuffix) e.suffix = true;

    if (e.name || e.suffix || e.runtime) {
      if (sameName) setSubmitErr(strings.nameExistsWarn);
      else if (sameSuffix) setSubmitErr(strings.suffixExistsWarn);
      else setSubmitErr(strings.formBlankWarn);
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
      maxWidth='sm'
      fullWidth
      fullScreen={fullScreen}
      disableRestoreFocus
    >
      <DialogTitle sx={{ pt: 4.5, px:4, pd: 0 }}>
        {mode === 'add' ? strings.formAddTitle : strings.formEditTitle}
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          // MUI zeroes the top‑padding of DialogContent when it is immediately preceded by a DialogTitle
          // Use `&&` to increase selector specificity so the 'language' text can display completely on the left-top corner
          '&&': {
            padding:4,
            paddingTop: 1,
          },
        }}
      >
        {submitErr && (
          <Alert severity='warning' sx={{ mb: 1 }}>
            {submitErr}
          </Alert>
        )}

        {/* 1. Language 语言 */}
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

        {/* 2. Compile Cmd 编译命令 */}
        <TextField
          label={strings.lblCompileCmd}
          value={form.compilerCmd}
          onChange={change('compilerCmd')}
          fullWidth
          size="small"
        />

        {/* 3. Run Cmd 运行命令 */}
        <TextField
          label={strings.lblRunCmd}
          value={form.runtimeCmd}
          onChange={change('runtimeCmd')}
          error={!!err.runtime}
          helperText={err.runtime ? strings.helperRequired : ''}
          fullWidth
          size="small"
        />

        {/* 4. Suffix 文件后缀 */}
        <TextField
          label={strings.lblSuffix}
          value={form.suffix}
          onChange={change('suffix')}
          error={!!err.suffix}
          helperText={err.suffix ? strings.helperRequired : ''}
          fullWidth
          size="small"
        />

        {/* 5. Version 版本 */}
        <TextField
          label={strings.lblVersion}
          value={form.version}
          onChange={change('version')}
          fullWidth
          size="small"
        />
      </DialogContent>

      <DialogActions sx={{p:4, pt:0}}>
        <Button variant='contained' size="small" onClick={onClose} sx={{mr:1}}>
          {strings.btnCancel}
        </Button>
        <Button
          variant='contained'
          color='secondary'
          size="small"
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