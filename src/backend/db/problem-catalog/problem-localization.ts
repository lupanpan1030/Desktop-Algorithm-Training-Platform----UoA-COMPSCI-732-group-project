import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const DEFAULT_PROBLEM_LOCALE = "en";
export const SECONDARY_PROBLEM_LOCALE = "zh-CN";

type LocalizedContent = {
  locale: string;
  title: string;
  description: string;
};

type ProblemLike = {
  locale: string;
  title: string;
  description: string;
  translations?: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
};

function dedupeLocales(locales: Array<string | null | undefined>) {
  return locales
    .map((locale) => normalizeProblemLocale(locale))
    .filter((locale, index, array) => array.indexOf(locale) === index);
}

export function normalizeProblemLocale(locale?: string | null) {
  const normalized = locale?.trim();

  if (!normalized) {
    return DEFAULT_PROBLEM_LOCALE;
  }

  const lower = normalized.toLowerCase();

  if (lower === "zh" || lower === "zh-cn" || lower === "zh_hans") {
    return SECONDARY_PROBLEM_LOCALE;
  }

  if (lower === "local") {
    return DEFAULT_PROBLEM_LOCALE;
  }

  if (lower.startsWith("en")) {
    return DEFAULT_PROBLEM_LOCALE;
  }

  return normalized;
}

export function buildProblemLocalePreferenceChain(
  preferredLocale?: string | null,
  defaultLocale?: string | null,
  availableLocales: string[] = []
) {
  return dedupeLocales([
    preferredLocale,
    DEFAULT_PROBLEM_LOCALE,
    SECONDARY_PROBLEM_LOCALE,
    defaultLocale,
    ...availableLocales,
  ]);
}

export function listAvailableProblemLocales(problem: ProblemLike) {
  return dedupeLocales([
    problem.locale,
    ...(problem.translations ?? []).map((translation) => translation.locale),
  ]);
}

export function resolveProblemLocalization(
  problem: ProblemLike,
  preferredLocale?: string | null
): LocalizedContent {
  const translations = problem.translations ?? [];
  const availableLocales = listAvailableProblemLocales(problem);
  const preferenceChain = buildProblemLocalePreferenceChain(
    preferredLocale,
    problem.locale,
    availableLocales
  );

  for (const locale of preferenceChain) {
    if (locale === problem.locale) {
      return {
        locale,
        title: problem.title,
        description: problem.description,
      };
    }

    const translation = translations.find(
      (candidate) => normalizeProblemLocale(candidate.locale) === locale
    );

    if (translation) {
      return {
        locale,
        title: translation.title,
        description: translation.description,
      };
    }
  }

  return {
    locale: normalizeProblemLocale(problem.locale),
    title: problem.title,
    description: problem.description,
  };
}

export async function upsertProblemTranslation(
  db: DbClient,
  problemId: number,
  translation: LocalizedContent
) {
  const locale = normalizeProblemLocale(translation.locale);

  return db.problemTranslation.upsert({
    where: {
      problem_id_locale: {
        problem_id: problemId,
        locale,
      },
    },
    create: {
      problem_id: problemId,
      locale,
      title: translation.title,
      description: translation.description,
    },
    update: {
      title: translation.title,
      description: translation.description,
    },
  });
}

export async function backfillProblemTranslationsFromBase(db: DbClient) {
  const problems = await db.problem.findMany({
    select: {
      problem_id: true,
      locale: true,
      title: true,
      description: true,
    },
  });

  for (const problem of problems) {
    await upsertProblemTranslation(db, problem.problem_id, {
      locale: problem.locale,
      title: problem.title,
      description: problem.description,
    });
  }
}

export async function syncProblemPrimaryLocalization(
  db: DbClient,
  problemId: number,
  preferredLocale?: string | null
) {
  const problem = await db.problem.findUnique({
    where: {
      problem_id: problemId,
    },
    select: {
      problem_id: true,
      locale: true,
      title: true,
      description: true,
      translations: {
        select: {
          locale: true,
          title: true,
          description: true,
        },
      },
    },
  });

  if (!problem) {
    return;
  }

  const selectedLocalization = resolveProblemLocalization(problem, preferredLocale);

  await db.problem.update({
    where: {
      problem_id: problemId,
    },
    data: {
      locale: selectedLocalization.locale,
      title: selectedLocalization.title,
      description: selectedLocalization.description,
    },
  });
}

export async function syncAllProblemPrimaryLocalizations(
  db: DbClient,
  preferredLocale?: string | null
) {
  const problems = await db.problem.findMany({
    select: {
      problem_id: true,
    },
  });

  for (const problem of problems) {
    await syncProblemPrimaryLocalization(db, problem.problem_id, preferredLocale);
  }
}
