import React from 'react';
import {
  useTheme,
  Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Paper,
  IconButton, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon   from '@mui/icons-material/Edit';
import { strings } from '../../i18n/messages';


export interface Language {
  languageId: number;
  name: string;
  compilerCmd?: string | null;
  runtimeCmd?: string;
  suffix?: string;
  version?: string;
  /** built‑in language that cannot be deleted */
  isDefault?: boolean;
}

interface Props {
  languages: Language[];
  showDelete?: boolean;
  showEdit?: boolean;
  onEdit?:   (lang: Language) => void;
  onDelete?: (id: number, name: string) => void;
}

/** Data table — column order: Language | Compile | Run | Suffix | Version (+ Action) */
export default function LanguageTable({
  languages,
  showDelete = false,
  showEdit   = false,
  onEdit,
  onDelete,
}: Props) {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <caption style={{ textAlign: 'left', paddingLeft: 8 }}>
          {strings.tableCaption}
        </caption>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.grey[800] : '#f5f5f5' }}>
            {[strings.tableColLanguage, strings.tableColCompile, strings.tableColRun,
              strings.tableColSuffix, strings.tableColVersion,
              (showDelete || showEdit) ? strings.tableColAction : '']
              .map((h) => h && (
                <TableCell key={h} align="center">
                  <strong>{h}</strong>
                </TableCell>
              ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {languages.map((l) => {
            const canDelete = showDelete && !l.isDefault;
            return (
              <TableRow key={l.languageId}>
                <TableCell align="center">{l.name}</TableCell>
                <TableCell align="center">{l.compilerCmd ?? '-'}</TableCell>
                <TableCell align="center">{l.runtimeCmd  ?? '-'}</TableCell>
                <TableCell align="center">{l.suffix ?? '-'}</TableCell>
                <TableCell align="center">{l.version ?? '-'}</TableCell>

                {(showDelete || showEdit) && (
                  <TableCell align="center">
                    {showEdit && (
                      <Tooltip title={strings.tooltipEdit(l.name)}>
                        <IconButton
                          size="small"
                          aria-label={strings.tooltipEdit(l.name)}
                          onClick={() => onEdit?.(l)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title={strings.tooltipDelete(l.name)}>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={strings.tooltipDelete(l.name)}
                          onClick={() => onDelete?.(l.languageId, l.name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}