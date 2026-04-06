import fs from "fs/promises";
import path from "path";
import {
  fromSqliteFileUrl,
  syncSqliteDatabase,
  toSqliteFileUrl,
} from "./bootstrap-sqlite";

function resolveDatabasePath() {
  const configuredUrl = process.env.DATABASE_URL;

  if (configuredUrl) {
    return fromSqliteFileUrl(configuredUrl);
  }

  return path.resolve(process.cwd(), "dev.db");
}

export async function initializeDatabase() {
  const dbFilePath = resolveDatabasePath();

  process.env.DATABASE_URL = toSqliteFileUrl(dbFilePath);

  let isFreshDatabase = false;
  try {
    await fs.access(dbFilePath);
  } catch {
    isFreshDatabase = true;
    console.log("Database file not found. Initializing...");
  }

  const syncResult = await syncSqliteDatabase(dbFilePath);
  if (!isFreshDatabase && syncResult.changed) {
    console.log("Database schema updated to match the current Prisma schema.");
    if (syncResult.backupPath) {
      console.log(`Database backup created at ${syncResult.backupPath} before schema sync.`);
    }
  }

  if (syncResult.created) {
    const { seedFreshDatabase } = await import("../seeds/init-db_first");
    await seedFreshDatabase();
  }

  const {
    backfillProblemTranslationsFromBase,
    syncAllProblemPrimaryLocalizations,
  } = await import("../problem-catalog/problem-localization");
  await backfillProblemTranslationsFromBase((await import("./prisma")).getPrisma());

  const { reconcileProblemCatalog } = await import("../problem-catalog/reconcile-problem-catalog");
  const reconciliation = await reconcileProblemCatalog();
  const { reconcileLanguageCatalog } = await import("../language-catalog/reconcile-language-catalog");
  const languageReconciliation = await reconcileLanguageCatalog();

  const prisma = (await import("./prisma")).getPrisma();
  await backfillProblemTranslationsFromBase(prisma);
  await syncAllProblemPrimaryLocalizations(prisma);

  if (reconciliation.mergedProblems > 0) {
    console.log(
      `Problem catalog reconciled. Merged ${reconciliation.mergedProblems} duplicate localized problem entries.`
    );
  }
  if (
    languageReconciliation.renamedLanguages > 0 ||
    languageReconciliation.backfilledNames > 0 ||
    languageReconciliation.normalizedSuffixes > 0
  ) {
    console.log(
      `Language catalog reconciled. Renamed ${languageReconciliation.renamedLanguages} duplicate languages, backfilled ${languageReconciliation.backfilledNames} normalized language names, and synchronized ${languageReconciliation.normalizedSuffixes} suffix keys.`
    );
  }
}
