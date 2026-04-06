import React from "react";
import { alpha, Chip, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
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
  selectedLanguageId?: number | null;
  onSelect?: (lang: Language) => void;
  showDelete?: boolean;
  showEdit?: boolean;
  onEdit?: (lang: Language) => void;
  onDelete?: (id: number, name: string) => void;
}

export default function LanguageTable({
  languages,
  selectedLanguageId = null,
  onSelect,
  showDelete = false,
  showEdit = false,
  onEdit,
  onDelete,
}: Props) {
  const theme = useTheme();
  const handleSelectWithKeyboard = (
    event: React.KeyboardEvent<HTMLDivElement>,
    language: Language
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(language);
    }
  };

  return (
    <Stack spacing={1.1} role="listbox" aria-label="Languages">
      {languages.map((language) => {
        const canDelete = showDelete && !language.isDefault;
        const selected = language.languageId === selectedLanguageId;

        return (
          <Paper
            key={language.languageId}
            variant="outlined"
            onClick={() => onSelect?.(language)}
            role={onSelect ? "option" : undefined}
            aria-selected={onSelect ? selected : undefined}
            aria-label={`${language.name} runtime`}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={(event) => handleSelectWithKeyboard(event, language)}
            sx={{
              p: 0.95,
              borderRadius: 3,
              cursor: onSelect ? "pointer" : "default",
              bgcolor: alpha(theme.palette.background.paper, 0.42),
              borderColor: selected
                ? alpha(theme.palette.primary.main, 0.42)
                : alpha(theme.palette.divider, 0.34),
              transition:
                "border-color 160ms ease, background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
              "& .language-row-actions": {
                opacity: selected || !onSelect ? 1 : 0,
                visibility: selected || !onSelect ? "visible" : "hidden",
                transform: selected || !onSelect ? "translateY(0)" : "translateY(-2px)",
                transition: "opacity 160ms ease, visibility 160ms ease, transform 160ms ease",
              },
              "&:hover": {
                borderColor: alpha(theme.palette.primary.main, 0.32),
                bgcolor: selected
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.background.paper, 0.6),
                transform: "translateY(-1px)",
                boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.06)}`,
              },
              "&:hover .language-row-actions, &:focus-within .language-row-actions": {
                opacity: 1,
                visibility: "visible",
                transform: "translateY(0)",
              },
            }}
          >
            <Stack spacing={0.75}>
              <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
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
                  <Stack direction="row" spacing={0.3} className="language-row-actions">
                    {showEdit && (
                      <Tooltip title={`Edit ${language.name}`} arrow>
                        <IconButton
                          size="small"
                          aria-label={`Edit ${language.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit?.(language);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title={`Delete ${language.name}`} arrow>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Delete ${language.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete?.(language.languageId, language.name);
                          }}
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
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
