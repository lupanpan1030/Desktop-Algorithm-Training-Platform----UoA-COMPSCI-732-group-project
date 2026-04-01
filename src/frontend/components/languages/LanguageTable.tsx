/**
 * LanguageTable component
 * ------------------------------------
 * Renders a compact, responsive table listing all programming languages
 * and optionally shows inline edit / delete actions.
 */
import React from "react";
import {
  useTheme,
  Table,
  TableHead,
  TableBody,
  TableFooter,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { strings } from "../../i18n/messages";

declare module "@mui/material/styles" {
  interface TypeAction {
    rowStripe?: string;
  }
  interface TypeAction {
    rowHover?: string;
  }
}

export interface Language {
  languageId: number;
  name: string;
  compilerCmd?: string | null;
  runtimeCmd?: string;
  suffix?: string;
  version?: string;
  /**
   * built‑in language flag
   * When true, the language cannot be removed from the system.
   */
  isDefault?: boolean;
}

// Component props
interface Props {
  languages: Language[];
  showDelete?: boolean;
  showEdit?: boolean;
  onEdit?: (lang: Language) => void;
  onDelete?: (id: number, name: string) => void;
}

/**
 * Data table
 * Columns: Language | Compile | Run | Suffix | Version (+ Action)
 */
export default function LanguageTable({
  languages,
  showDelete = false,
  showEdit = false,
  onEdit,
  onDelete,
}: Props) {
  const theme = useTheme();

  return (
    <TableContainer
      component={Paper}
      sx={{
        overflowX: "auto",
        whiteSpace: "nowrap",
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": {
          height: "4px",
        },
      }}
    >
      <Table size="small">
        <caption style={{ position: "absolute", left: -9999 }}>
          {strings.tableCaption}
        </caption>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme.palette.secondary.light }}>
            {[
              strings.tableColLanguage,
              strings.tableColCompile,
              strings.tableColRun,
              strings.tableColSuffix,
              strings.tableColVersion,
              showDelete || showEdit ? strings.tableColAction : "",
            ].map(
              (h) =>
                h && (
                  <TableCell key={h}>
                    <strong>{h}</strong>
                  </TableCell>
                )
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {languages.map((l, idx) => {
            const canDelete = showDelete && !l.isDefault;
            // Show trash icon only when delete‑mode is on and the language is not default
            return (
              <TableRow
                key={l.languageId}
                sx={{
                  backgroundColor:
                    idx % 2 !== 0
                      ? theme.palette.action.rowHover
                      : theme.palette.background.paper,
                }}
              >
                <TableCell>{l.name}</TableCell>
                <TableCell>{l.compilerCmd ?? "-"}</TableCell>
                <TableCell>{l.runtimeCmd ?? "-"}</TableCell>
                <TableCell>{l.suffix ?? "-"}</TableCell>
                <TableCell>{l.version ?? "-"}</TableCell>

                {(showDelete || showEdit) && (
                  <TableCell>
                    {showEdit && (
                      <Tooltip
                        title={strings.tooltipEdit(l.name)}
                        arrow
                        placement="right"
                      >
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
                      <Tooltip
                        title={strings.tooltipDelete(l.name)}
                        arrow
                        placement="right"
                      >
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
        <TableFooter>
          <TableRow
            sx={{
              backgroundColor:
                languages.length % 2 === 0
                  ? theme.palette.background.paper
                  : theme.palette.action.rowHover,
            }}
          >
            <TableCell colSpan={showDelete || showEdit ? 6 : 5}>
              {strings.tableCaption}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
