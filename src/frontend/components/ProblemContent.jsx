import React from "react";
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { marked } from "marked";
import DOMPurify from "../utils/dompurifyConfig";

function formatLocaleLabel(locale) {
  if (locale === "zh-CN") {
    return "中文";
  }

  return "English";
}

function difficultyColor(difficulty) {
  switch (difficulty) {
    case "EASY":
      return "success";
    case "MEDIUM":
      return "warning";
    case "HARD":
      return "error";
    default:
      return "default";
  }
}

function SectionBlock({ title, children }) {
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", letterSpacing: 0.8, display: "block", mb: 1, lineHeight: 1.35 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function ProblemContent({ problem, onLocaleChange }) {
  const theme = useTheme();

  if (!problem) {
    return <Typography>No problem data available</Typography>;
  }

  const starterCodeLanguages = [
    ...new Set((problem.starterCodes || []).map((starterCode) => starterCode.languageName)),
  ];

  return (
    <Box
      sx={{
        px: { xs: 2.25, md: 3 },
        py: { xs: 2.25, md: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "flex-start" }}
          spacing={2}
        >
          <Box sx={{ maxWidth: 720 }}>
            <Typography
              variant="overline"
              sx={{ color: "text.secondary", letterSpacing: 0.9, display: "block", lineHeight: 1.35 }}
            >
              Problem Statement
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.4, lineHeight: 1.1 }}>
              {problem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.1 }}>
              {problem.source}
              {problem.externalProblemId ? ` · #${problem.externalProblemId}` : ""}
              {problem.sourceSlug ? ` · ${problem.sourceSlug}` : ""}
            </Typography>
          </Box>

          {problem.availableLocales?.length > 1 && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={problem.locale}
              onChange={(_, nextLocale) => {
                if (nextLocale && onLocaleChange) {
                  onLocaleChange(nextLocale);
                }
              }}
            >
              {problem.availableLocales.map((locale) => (
                <ToggleButton key={locale} value={locale}>
                  {formatLocaleLabel(locale)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={problem.difficulty} color={difficultyColor(problem.difficulty)} />
          <Chip label={`${problem.source} / ${problem.locale}`} variant="outlined" />
          <Chip
            label={problem.judgeReady ? "Judge ready" : "Needs tests"}
            color={problem.judgeReady ? "success" : "default"}
            variant={problem.judgeReady ? "filled" : "outlined"}
          />
          <Chip
            label={`${problem.sampleCaseCount} sample / ${problem.hiddenCaseCount} hidden`}
            variant="outlined"
          />
        </Stack>

        {problem.tags?.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {problem.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Stack>
        )}
      </Stack>

      <Divider />

      <SectionBlock title="Description">
        <Box
          sx={{
            color: "text.primary",
            "& p": {
              color: "text.primary",
              lineHeight: 1.8,
              margin: "0 0 1rem",
            },
            "& code": {
              fontFamily:
                '"JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", monospace',
              fontSize: "0.92em",
              px: 0.6,
              py: 0.15,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.background.default, 0.72),
            },
            "& pre": {
              overflowX: "auto",
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: alpha(theme.palette.background.default, 0.72),
            },
            "& ul, & ol": {
              paddingLeft: 3,
              margin: 0,
            },
            "& li": {
              marginBottom: 0.8,
              lineHeight: 1.7,
            },
            "& img": {
              maxWidth: "100%",
              borderRadius: 2,
            },
          }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(marked(problem.description)),
          }}
        />
      </SectionBlock>

      {problem.sampleTestcase && (
        <SectionBlock title="Imported Sample Reference">
          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: 2,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.default, 0.52),
            })}
          >
            <Typography
              variant="body2"
              component="pre"
              sx={{
                m: 0,
                fontFamily: '"JetBrains Mono", "SFMono-Regular", monospace',
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {problem.sampleTestcase}
            </Typography>
          </Paper>
        </SectionBlock>
      )}

      {starterCodeLanguages.length > 0 && (
        <SectionBlock title="Starter Code">
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {starterCodeLanguages.map((languageName) => (
              <Chip key={languageName} label={languageName} variant="outlined" />
            ))}
          </Stack>
        </SectionBlock>
      )}

      {problem.examples && problem.examples.length > 0 && (
        <SectionBlock title="Examples">
          <Stack spacing={1.5}>
            {problem.examples.map((example, index) => (
              <Paper
                key={`${problem.problemId}-example-${index}`}
                variant="outlined"
                sx={(theme) => ({
                  p: 2,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.background.default, 0.48),
                })}
              >
                <Typography variant="subtitle2" sx={{ mb: 1.1 }}>
                  Example {index + 1}
                </Typography>
                <Stack spacing={1.1}>
                  {example.input && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Input
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          mt: 0.6,
                          mb: 0,
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.42),
                          fontFamily: '"JetBrains Mono", "SFMono-Regular", monospace',
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {example.input}
                      </Box>
                    </Box>
                  )}
                  {example.output && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Output
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          mt: 0.6,
                          mb: 0,
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.42),
                          fontFamily: '"JetBrains Mono", "SFMono-Regular", monospace',
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {example.output}
                      </Box>
                    </Box>
                  )}
                  {example.explanation && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Explanation
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.6, lineHeight: 1.7 }}>
                        {example.explanation}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </SectionBlock>
      )}

      {problem.constraints && (
        <SectionBlock title="Constraints">
          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: 2,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.default, 0.45),
            })}
          >
            {Array.isArray(problem.constraints) ? (
              <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                {problem.constraints.map((constraint, index) => (
                  <Typography component="li" variant="body2" key={`${constraint}-${index}`}>
                    {constraint}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2">{problem.constraints}</Typography>
            )}
          </Paper>
        </SectionBlock>
      )}
    </Box>
  );
}
