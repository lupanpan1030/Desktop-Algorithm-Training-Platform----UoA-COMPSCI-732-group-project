import React from 'react';
import {
  useTheme,
  Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Paper,
  IconButton, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon   from '@mui/icons-material/Edit';

export interface Language {
  languageId: number;
  name: string;
  compile_command?: string;
  run_command?: string;
  suffix?: string;
  version?: string;
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
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.grey[800] : '#f5f5f5' }}>
            {['Language', 'Compile', 'Run', 'Suffix', 'Version',
              (showDelete || showEdit) ? 'Action' : '']
              .map((h) => h && (
                <TableCell key={h} align="center">
                  <strong>{h}</strong>
                </TableCell>
              ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {languages.map((l) => (
            <TableRow key={l.languageId}>
              <TableCell align="center">{l.name}</TableCell>
              <TableCell align="center">{l.compile_command ?? '-'}</TableCell>
              <TableCell align="center">{l.run_command ?? '-'}</TableCell>
              <TableCell align="center">{l.suffix ?? '-'}</TableCell>
              <TableCell align="center">{l.version ?? '-'}</TableCell>

              {(showDelete || showEdit) && (
                <TableCell align="center">
                  {showEdit && (
                    <Tooltip title={`Edit ${l.name}`}>
                      <IconButton size="small" onClick={() => onEdit?.(l)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {showDelete && (
                    <Tooltip title={`Delete ${l.name}`}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete?.(l.languageId, l.name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}