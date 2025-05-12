// src/frontend/i18n/messages.ts
// 仅示例英文，如需多语言可再扩展 zh、es 等
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

  /* ----- Language Form Dialog ----- */
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

  /* ----- Language Table ----- */
  tableColLanguage: 'Language',
  tableColCompile:  'Compile',
  tableColRun:      'Run',
  tableColSuffix:   'Suffix',
  tableColVersion:  'Version',
  tableColAction:   'Action',
  tableCaption: 'Supported programming languages and their run / compile commands',
  tooltipEdit:      (name: string) => `Edit ${name}`,
  tooltipDelete:    (name: string) => `Delete ${name}`,

  /* ----- Language Toolbar ----- */
  tooltipAdd:        'Add',
  tooltipDeleteMode: 'Delete mode',
  tooltipEditMode:   'Edit mode',
  tooltipRefresh:    'Refresh',
  btnEdit:           'Edit',
  btnRefresh:        'Refresh',

  // LanguageFormDialog warnings
  nameExistsWarn:   'Language name already exists.',
  suffixExistsWarn: 'File suffix already exists.',
};