/**
 * LanguageTable component ― 语言表格组件
 * ------------------------------------
 * Renders a compact, responsive table listing all programming languages
 * and optionally shows inline edit / delete actions.
 * 渲染紧凑的响应式语言列表表格，并可选显示行内编辑 / 删除按钮。
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
   * built‑in language flag (内置语言标记)
   * When true, the language cannot be removed from the system.
   * 当为 true 时，该语言不可被删除。
   */
  isDefault?: boolean;
}

// Component props (组件属性)
interface Props {
  languages: Language[];
  showDelete?: boolean;
  showEdit?: boolean;
  onEdit?: (lang: Language) => void;
  onDelete?: (id: number, name: string) => void;
}

/**
 * Data table ― 列数据说明
 * Columns: Language | Compile | Run | Suffix | Version (+ Action)
 * 列顺序：语言 | 编译命令 | 运行命令 | 后缀 | 版本 (+ 操作)
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
    <TableContainer component={Paper} sx={{ overflowX: "auto"}}>
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
            // Show trash icon only when delete‑mode is on and the language is not default (仅当删除模式开启且语言非内置时才显示删除按钮)
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