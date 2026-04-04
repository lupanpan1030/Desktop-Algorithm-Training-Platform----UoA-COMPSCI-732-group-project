import React from "react";
import {
  alpha,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export interface Language {
  languageId: number;
  name: string;
  compilerCmd?: string | null;
  runtimeCmd?: string;
  suffix?: string;
  version?: string;
  isDefault?: boolean;
}

interface Props {
  languages: Language[];
  showDelete?: boolean;
  showEdit?: boolean;
  onEdit?: (lang: Language) => void;
  onDelete?: (id: number, name: string) => void;
}

function summarizeCommand(command?: string | null) {
  if (!command) {
    return "none";
  }

  return command.length > 72 ? `${command.slice(0, 72)}...` : command;
}

export default function LanguageTable({
  languages,
  showDelete = false,
  showEdit = false,
  onEdit,
  onDelete,
}: Props) {
  const theme = useTheme();

  return (
    <Stack spacing={1.1}>
      {languages.map((language) => {
        const canDelete = showDelete && !language.isDefault;

        return (
          <Paper
            key={language.languageId}
            variant="outlined"
            sx={{
              p: 1.15,
              borderRadius: 3.5,
              bgcolor: alpha(theme.palette.background.paper, 0.42),
              borderColor: alpha(theme.palette.divider, 0.34),
            }}
          >
            <Stack spacing={0.85}>
              <Stack direction="row" justifyContent="space-between" spacing={1.2}>
                <div>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {language.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {language.suffix || "no suffix"}
                    {language.version ? ` · ${language.version}` : ""}
                  </Typography>
                </div>

                {(showDelete || showEdit) && (
                  <Stack direction="row" spacing={0.3}>
                    {showEdit && (
                      <Tooltip title={`Edit ${language.name}`} arrow>
                        <IconButton size="small" onClick={() => onEdit?.(language)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title={`Delete ${language.name}`} arrow>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete?.(language.languageId, language.name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                )}
              </Stack>

              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                {language.isDefault && <Chip size="small" label="Default" color="primary" />}
                <Chip
                  size="small"
                  variant="outlined"
                  label={language.compilerCmd ? "Compiled" : "Interpreted"}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={language.runtimeCmd ? "Run command set" : "No run command"}
                />
              </Stack>

              <Stack spacing={0.55}>
                <Stack direction="row" spacing={0.8} alignItems="baseline">
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52 }}>
                    Compile
                  </Typography>
                  <Tooltip title={language.compilerCmd || "none"} arrow disableInteractive>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.primary",
                        fontFamily: '"JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", monospace',
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {summarizeCommand(language.compilerCmd)}
                    </Typography>
                  </Tooltip>
                </Stack>
                <Stack direction="row" spacing={0.8} alignItems="baseline">
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52 }}>
                    Run
                  </Typography>
                  <Tooltip title={language.runtimeCmd || "none"} arrow disableInteractive>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.primary",
                        fontFamily: '"JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", monospace',
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {summarizeCommand(language.runtimeCmd)}
                    </Typography>
                  </Tooltip>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
