/**
 * Global i18n message map (全局 i18n 消息映射)
 * -------------------------------------------
 * Contains en‑US strings used across the front‑end; extend with zh, es etc. if needed.
 * 包含前端使用的英文字符串；如有需要，可扩展为中文、西班牙语等其他语言。
 */
export const strings = {
  addSuccess:      (name: string) => `Added "${name}"`,
  addFail:         (name: string) => `Failed to add "${name}"`,
  updateSuccess:   (name: string) => `Updated "${name}"`,
  updateFail:      (name: string) => `Failed to update "${name}"`,
  deleteSuccess:   (name: string) => `Deleted "${name}"`,
  deleteFail:      (name: string) => `Failed to delete "${name}"`,
  networkError:    ()              => 'Network error, please try again later',
  confirmDeleteTitle: 'Confirm Delete',
  confirmDeleteMessage: (name: string) => `Are you sure you want to delete "${name}"?`,
  btnCancel: 'Cancel',
  btnDelete: 'Delete',

  /* ----- Language Form Dialog 表单对话框 ----- */
  formAddTitle: 'Add Language',
  formEditTitle: 'Edit Language',
  formBlankWarn: 'Please fill all required fields (marked with *).',
  lblLanguage: 'Language *',
  lblCompileCmd: 'Compile Cmd',
  lblRunCmd: 'Run Cmd *',
  lblSuffix: 'Suffix *',
  lblVersion: 'Version',
  helperRequired: 'Required',
  btnAdd: 'Add',
  btnSave: 'Save',

  /* ----- Language Table 语言表格 ----- */
  tableColLanguage: 'Language',
  tableColCompile:  'Compile',
  tableColRun:      'Run',
  tableColSuffix:   'Suffix',
  tableColVersion:  'Version',
  tableColAction:   'Action',
  tableCaption: 'Supported programming languages and their run / compile commands',
  tooltipEdit:      (name: string) => `Edit ${name}`,
  tooltipDelete:    (name: string) => `Delete ${name}`,

  /* ----- Language Toolbar 语言工具栏 ----- */
  tooltipAdd:        'Add',
  tooltipDeleteMode: 'Delete mode',
  tooltipEditMode:   'Edit mode',
  tooltipRefresh:    'Refresh',
  btnEdit:           'Edit',
  btnRefresh:        'Refresh',

  // LanguageFormDialog warnings (LanguageFormDialog 警告消息)
  nameExistsWarn:   'Language name already exists.',
  suffixExistsWarn: 'File suffix already exists.',
};