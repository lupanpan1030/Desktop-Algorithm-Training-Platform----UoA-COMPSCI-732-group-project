import type { PrismaClient } from "@prisma/client";
import { getPrisma } from "../prisma/prisma";
import {
  normalizeLanguageDisplayName,
  normalizeLanguageDisplaySuffix,
  normalizeLanguageName,
  normalizeLanguageSuffix,
} from "../../api/language/language-normalization";

function buildUniqueLanguageName(
  originalName: string,
  languageId: number,
  usedNames: Set<string>
) {
  const baseName = normalizeLanguageDisplayName(originalName, `Language ${languageId}`);
  let counter = 0;
  let candidate = `${baseName} (${languageId})`;
  let normalizedCandidate = normalizeLanguageName(candidate);

  while (!normalizedCandidate || usedNames.has(normalizedCandidate)) {
    counter += 1;
    candidate = `${baseName} (${languageId}-${counter})`;
    normalizedCandidate = normalizeLanguageName(candidate);
  }

  return candidate;
}

export async function reconcileLanguageCatalog(prisma: PrismaClient = getPrisma()) {
  const languages = await prisma.programmingLanguage.findMany({
    orderBy: [{ is_default: "desc" }, { language_id: "asc" }],
  });

  const usedNames = new Set<string>();
  const usedSuffixes = new Map<string, number>();
  const invalidSuffixes: string[] = [];
  let renamedLanguages = 0;
  let backfilledNames = 0;
  let normalizedSuffixes = 0;
  const updates: Array<{
    language_id: number;
    data: {
      name?: string;
      normalized_name?: string;
      suffix?: string;
      normalized_suffix?: string;
    };
  }> = [];

  for (const language of languages) {
    const displayName = normalizeLanguageDisplayName(language.name, `Language ${language.language_id}`);
    let nextName = displayName;
    let normalizedName = normalizeLanguageName(displayName);
    const displaySuffix = normalizeLanguageDisplaySuffix(language.suffix);
    const normalizedSuffix = normalizeLanguageSuffix(displaySuffix);

    if (!normalizedName || usedNames.has(normalizedName)) {
      nextName = buildUniqueLanguageName(displayName, language.language_id, usedNames);
      normalizedName = normalizeLanguageName(nextName);
    }

    usedNames.add(normalizedName);

    const needsBackfill = language.normalized_name !== normalizedName;
    const needsRename = language.name !== nextName;
    const needsSuffixTrim = language.suffix !== displaySuffix;
    const needsSuffixBackfill = language.normalized_suffix !== normalizedSuffix;

    if (!displaySuffix) {
      invalidSuffixes.push(`language ${language.language_id} has an empty suffix`);
      continue;
    }

    const existingSuffixOwner = usedSuffixes.get(normalizedSuffix);
    if (existingSuffixOwner !== undefined) {
      invalidSuffixes.push(
        `languages ${existingSuffixOwner} and ${language.language_id} share suffix "${displaySuffix}"`
      );
      continue;
    }
    usedSuffixes.set(normalizedSuffix, language.language_id);

    if (!needsBackfill && !needsRename && !needsSuffixTrim && !needsSuffixBackfill) {
      continue;
    }

    if (needsBackfill) {
      backfilledNames += 1;
    }
    if (needsRename) {
      renamedLanguages += 1;
    }
    if (needsSuffixBackfill || needsSuffixTrim) {
      normalizedSuffixes += 1;
    }

    updates.push({
      language_id: language.language_id,
      data: {
        ...(needsRename ? { name: nextName } : {}),
        ...(needsBackfill ? { normalized_name: normalizedName } : {}),
        ...(needsSuffixTrim ? { suffix: displaySuffix } : {}),
        ...(needsSuffixBackfill ? { normalized_suffix: normalizedSuffix } : {}),
      },
    });
  }

  if (invalidSuffixes.length > 0) {
    throw new Error(
      `Language catalog has invalid suffixes. Resolve these entries before startup: ${invalidSuffixes.join(
        "; "
      )}.`
    );
  }

  await prisma.$transaction(
    updates.map((update) =>
      prisma.programmingLanguage.update({
        where: { language_id: update.language_id },
        data: update.data,
      })
    )
  );

  return {
    renamedLanguages,
    backfilledNames,
    normalizedSuffixes,
  };
}
