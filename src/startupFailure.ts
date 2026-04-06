export type StartupFailureKind = "backend_exit" | "backend_timeout" | "generic";
export type StartupFailureDialogModel = {
  title: string;
  message: string;
  detail: string;
  copyText: string;
};

const MAX_DETAIL_LINES = 8;

function isAsciiLetter(value: string) {
  return /^[A-Za-z]$/.test(value);
}

function stripAnsi(detail: string) {
  let output = "";

  for (let index = 0; index < detail.length; index += 1) {
    const current = detail[index];

    if (current === "\u001b" && detail[index + 1] === "[") {
      index += 2;
      while (index < detail.length && !isAsciiLetter(detail[index])) {
        index += 1;
      }
      continue;
    }

    if (current !== "\u001b") {
      output += current;
    }
  }

  return output;
}

export class StartupFailure extends Error {
  kind: StartupFailureKind;
  detail?: string;

  constructor(kind: StartupFailureKind, message: string, detail?: string) {
    super(message);
    this.name = "StartupFailure";
    this.kind = kind;
    this.detail = detail;
  }
}

function normalizeDetail(detail?: string) {
  if (!detail) {
    return "";
  }

  const lines = stripAnsi(detail)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(-MAX_DETAIL_LINES).join("\n");
}

function extractLanguageCatalogIssues(text: string) {
  const match = text.match(
    /Resolve these entries before startup:\s*([\s\S]+?)(?:\.$|$)/i
  );
  if (!match) {
    return [];
  }

  return match[1]
    .split(/\s*;\s*/)
    .map((issue) => issue.trim())
    .filter(Boolean);
}

function formatRecentOutput(detail?: string) {
  const normalized = normalizeDetail(detail);
  if (!normalized) {
    return "";
  }

  return `Recent backend output:\n${normalized
    .split("\n")
    .map((line) => `- ${line}`)
    .join("\n")}`;
}

function buildCopyText(title: string, message: string, detail: string) {
  return [title, "", message, detail ? `\n${detail}` : ""].join("\n").trim();
}

function buildDetail({
  actions,
  startupException,
  recentOutput,
}: {
  actions: string[];
  startupException?: string;
  recentOutput?: string;
}) {
  const sections = [
    actions.length > 0 ? `Recommended actions:\n${actions.map((action) => `- ${action}`).join("\n")}` : "",
    startupException ? `Startup exception:\n${startupException}` : "",
    recentOutput || "",
  ].filter(Boolean);

  return sections.join("\n\n");
}

function createDialogModel({
  title,
  message,
  actions,
  startupException,
  recentOutput,
}: {
  title: string;
  message: string;
  actions: string[];
  startupException?: string;
  recentOutput?: string;
}): StartupFailureDialogModel {
  const detail = buildDetail({
    actions,
    startupException,
    recentOutput,
  });

  return {
    title,
    message,
    detail,
    copyText: buildCopyText(title, message, detail),
  };
}

export function buildStartupFailureDialog(error: unknown): StartupFailureDialogModel {
  const startupFailure = error instanceof StartupFailure ? error : null;
  const message =
    error instanceof Error && error.message ? error.message : "Unknown startup error.";
  const combinedText = [message, startupFailure?.detail].filter(Boolean).join("\n");
  const recentOutput = formatRecentOutput(startupFailure?.detail);

  if (/Language catalog has invalid suffixes/i.test(combinedText)) {
    const issues = extractLanguageCatalogIssues(combinedText);
    return createDialogModel({
      title: "Language Configuration Error",
      message: "The app found invalid language suffix configuration and stopped before the backend started.",
      actions: issues.length > 0
        ? [
            ...issues,
            "Resolve the conflicting ProgrammingLanguage suffix entries in the local database, then start the app again.",
          ]
        : [
            "Review the language catalog for duplicate or empty suffix values.",
            "Resolve the conflicting ProgrammingLanguage suffix entries in the local database, then start the app again.",
          ],
      startupException: message,
      recentOutput,
    });
  }

  if (/EADDRINUSE/i.test(combinedText)) {
    return createDialogModel({
      title: "Backend Port In Use",
      message: "The local backend could not start because the configured port is already in use.",
      actions: [
        "Free the existing process that is already bound to the configured port.",
        "Or change the PORT setting, then start the app again.",
      ],
      startupException: message,
      recentOutput,
    });
  }

  if (
    startupFailure?.kind === "backend_timeout" ||
    /did not become ready within/i.test(message)
  ) {
    return createDialogModel({
      title: "Backend Startup Timed Out",
      message: "The local backend did not become ready before the startup timeout expired.",
      actions: [
        "Check the recent backend output below for the underlying error.",
        "Fix that issue, then restart the app.",
      ],
      startupException: message,
      recentOutput,
    });
  }

  if (startupFailure?.kind === "backend_exit") {
    return createDialogModel({
      title: "Backend Exited During Startup",
      message: "The local backend process exited before the app finished starting.",
      actions: [
        "Review the recent backend output below.",
        "Fix the underlying issue, then restart the app.",
      ],
      startupException: message,
      recentOutput,
    });
  }

  return createDialogModel({
    title: "Startup Failed",
    message: "The local backend could not be started.",
    actions: [
      "Review the startup exception and recent backend output below.",
      "Fix the underlying issue, then restart the app.",
    ],
    startupException: message,
    recentOutput,
  });
}
