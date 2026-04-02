import fs from "fs/promises";
import path from "path";
import { Difficulty } from "@prisma/client";

const DEFAULT_SIBLING_SOURCE_PATH = path.resolve(
  process.cwd(),
  "..",
  "leetcode-problemset",
  "leetcode-cn",
  "originData"
);

const LEETCODE_SOURCE = "LEETCODE";
const LEETCODE_EN_LOCALE = "en";
const LEETCODE_CN_LOCALE = "zh-CN";

type RawTopicTag = {
  name?: string | null;
  slug?: string | null;
  translatedName?: string | null;
};

type RawCodeSnippet = {
  lang?: string | null;
  langSlug?: string | null;
  code?: string | null;
};

export type RawLeetCodeCnQuestion = {
  title?: string | null;
  translatedTitle?: string | null;
  titleSlug?: string | null;
  content?: string | null;
  translatedContent?: string | null;
  difficulty?: string | null;
  questionFrontendId?: string | null;
  sampleTestCase?: string | null;
  topicTags?: RawTopicTag[] | null;
  codeSnippets?: RawCodeSnippet[] | null;
};

export type ImportCliOptions = {
  sourcePath: string;
  limit?: number;
  dryRun: boolean;
  databasePath?: string;
  verbose: boolean;
  help: boolean;
};

export type NormalizedImportedProblem = {
  importKey: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  source: string;
  sourceSlug: string;
  externalProblemId: string | null;
  locale: string;
  sampleTestcase: string | null;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    slug: string | null;
  }>;
  starterCodes: Array<{
    languageName: string;
    languageSlug: string;
    template: string;
  }>;
  sourceFile: string;
};

export type LoadProblemsResult = {
  problems: NormalizedImportedProblem[];
  stats: {
    scannedFiles: number;
    importedCandidates: number;
    skippedMissingContent: number;
    skippedInvalidPayload: number;
  };
};

function firstNonEmptyText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function normalizeDifficulty(value: string | null | undefined): Difficulty | null {
  switch ((value ?? "").trim().toLowerCase()) {
    case "easy":
      return "EASY";
    case "medium":
      return "MEDIUM";
    case "hard":
      return "HARD";
    default:
      return null;
  }
}

function normalizeTag(tag: RawTopicTag) {
  const name = firstNonEmptyText(tag.name, tag.translatedName);
  const slug = firstNonEmptyText(tag.slug);

  if (!name) {
    return null;
  }

  return { name, slug };
}

function normalizeStarterCode(snippet: RawCodeSnippet) {
  const languageName = firstNonEmptyText(snippet.lang);
  const languageSlug = firstNonEmptyText(snippet.langSlug);
  const template = snippet.code?.trim();

  if (!languageName || !languageSlug || !template) {
    return null;
  }

  return {
    languageName,
    languageSlug,
    template,
  };
}

export function getDefaultLeetCodeCnSourcePath() {
  return DEFAULT_SIBLING_SOURCE_PATH;
}

export function getImportUsage() {
  return [
    "Usage:",
    "  npm run import:leetcode-cn -- --source /path/to/leetcode-cn/originData [--limit 20] [--dry-run] [--database ./dev.db]",
    "",
    "Options:",
    "  --source <path>     Directory containing LeetCode CN JSON files.",
    "  --limit <number>    Import only the first N normalized problems after sorting.",
    "  --dry-run           Parse and summarize without writing to the database.",
    "  --database <path>   Target sqlite database file. Defaults to DATABASE_URL or ./dev.db.",
    "  --verbose           Print a short preview of the selected problems.",
    "  --help              Show this message.",
    "",
    `Default sibling source path: ${DEFAULT_SIBLING_SOURCE_PATH}`,
  ].join("\n");
}

export function parseImportCliArgs(argv: string[]): ImportCliOptions {
  const options: ImportCliOptions = {
    sourcePath: getDefaultLeetCodeCnSourcePath(),
    dryRun: false,
    verbose: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    switch (token) {
      case "--source":
      case "--source-path":
        options.sourcePath = path.resolve(argv[index + 1] ?? "");
        index += 1;
        break;
      case "--limit":
        options.limit = Number.parseInt(argv[index + 1] ?? "", 10);
        index += 1;
        break;
      case "--database":
      case "--db":
        options.databasePath = path.resolve(argv[index + 1] ?? "");
        index += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!options.help) {
    if (!options.sourcePath) {
      throw new Error("Missing required --source argument.");
    }

    if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit <= 0)) {
      throw new Error("--limit must be a positive integer.");
    }
  }

  return options;
}

export function extractLeetCodeCnQuestion(payload: unknown): RawLeetCodeCnQuestion | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybeData = (payload as { data?: unknown }).data;
  if (!maybeData || typeof maybeData !== "object") {
    return null;
  }

  const maybeQuestion = (maybeData as { question?: unknown }).question;
  if (!maybeQuestion || typeof maybeQuestion !== "object") {
    return null;
  }

  return maybeQuestion as RawLeetCodeCnQuestion;
}

export function normalizeLeetCodeCnQuestion(
  question: RawLeetCodeCnQuestion,
  sourceFile: string
): NormalizedImportedProblem | null {
  const englishTitle = firstNonEmptyText(question.title);
  const englishDescription = firstNonEmptyText(question.content);
  const chineseTitle = firstNonEmptyText(question.translatedTitle);
  const chineseDescription = firstNonEmptyText(question.translatedContent);
  const sourceSlug = firstNonEmptyText(question.titleSlug);
  const difficulty = normalizeDifficulty(question.difficulty);

  if ((!englishTitle && !chineseTitle) || (!englishDescription && !chineseDescription) || !sourceSlug || !difficulty) {
    return null;
  }

  const translations = [
    englishTitle && englishDescription
      ? {
          locale: LEETCODE_EN_LOCALE,
          title: englishTitle,
          description: englishDescription,
        }
      : null,
    chineseTitle && chineseDescription
      ? {
          locale: LEETCODE_CN_LOCALE,
          title: chineseTitle,
          description: chineseDescription,
        }
      : null,
  ].filter(
    (translation): translation is {
      locale: string;
      title: string;
      description: string;
    } => Boolean(translation)
  );

  if (translations.length === 0) {
    return null;
  }

  const preferredTranslation =
    translations.find((translation) => translation.locale === LEETCODE_EN_LOCALE) ??
    translations[0];

  const seenTagNames = new Set<string>();
  const tags = (question.topicTags ?? [])
    .map(normalizeTag)
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
    .filter((tag) => {
      if (seenTagNames.has(tag.name)) {
        return false;
      }
      seenTagNames.add(tag.name);
      return true;
    });

  const seenLanguages = new Set<string>();
  const starterCodes = (question.codeSnippets ?? [])
    .map(normalizeStarterCode)
    .filter((snippet): snippet is NonNullable<typeof snippet> => Boolean(snippet))
    .filter((snippet) => {
      if (seenLanguages.has(snippet.languageSlug)) {
        return false;
      }
      seenLanguages.add(snippet.languageSlug);
      return true;
    });

  return {
    importKey: `${LEETCODE_SOURCE}:${sourceSlug}`,
    title: preferredTranslation.title,
    description: preferredTranslation.description,
    difficulty,
    source: LEETCODE_SOURCE,
    sourceSlug,
    externalProblemId: firstNonEmptyText(question.questionFrontendId),
    locale: preferredTranslation.locale,
    sampleTestcase: firstNonEmptyText(question.sampleTestCase),
    translations,
    tags,
    starterCodes,
    sourceFile,
  };
}

function compareProblemOrder(
  left: NormalizedImportedProblem,
  right: NormalizedImportedProblem
) {
  const leftId = Number(left.externalProblemId);
  const rightId = Number(right.externalProblemId);
  const leftIsNumber = Number.isFinite(leftId);
  const rightIsNumber = Number.isFinite(rightId);

  if (leftIsNumber && rightIsNumber && leftId !== rightId) {
    return leftId - rightId;
  }

  if (leftIsNumber !== rightIsNumber) {
    return leftIsNumber ? -1 : 1;
  }

  return left.sourceSlug.localeCompare(right.sourceSlug);
}

export async function loadLeetCodeCnProblems(sourcePath: string): Promise<LoadProblemsResult> {
  const normalizedSourcePath = path.resolve(sourcePath);
  const entries = await fs.readdir(normalizedSourcePath, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const result: LoadProblemsResult = {
    problems: [],
    stats: {
      scannedFiles: 0,
      importedCandidates: 0,
      skippedMissingContent: 0,
      skippedInvalidPayload: 0,
    },
  };

  for (const fileName of files) {
    const filePath = path.join(normalizedSourcePath, fileName);
    result.stats.scannedFiles += 1;

    let payload: unknown;
    try {
      payload = JSON.parse(await fs.readFile(filePath, "utf8"));
    } catch {
      result.stats.skippedInvalidPayload += 1;
      continue;
    }

    const question = extractLeetCodeCnQuestion(payload);
    if (!question) {
      result.stats.skippedInvalidPayload += 1;
      continue;
    }

    const normalized = normalizeLeetCodeCnQuestion(question, fileName);
    if (!normalized) {
      result.stats.skippedMissingContent += 1;
      continue;
    }

    result.problems.push(normalized);
  }

  result.problems.sort(compareProblemOrder);
  result.stats.importedCandidates = result.problems.length;
  return result;
}
