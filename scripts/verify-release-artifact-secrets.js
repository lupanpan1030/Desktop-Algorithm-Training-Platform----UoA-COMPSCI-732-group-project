#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const asar = require("@electron/asar");
const dotenv = require("dotenv");

const repoRoot = process.cwd();
const outputRoots = ["out", "build-resources"].map((root) => path.join(repoRoot, root));

const secretKeyPattern =
  /(^|_)(API_KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|PRIVATE_KEY|ACCESS_KEY|AUTH_KEY)($|_)/i;
const placeholderPattern =
  /^(|change_me|example|placeholder|test|your[_-]?key[_-]?here|sk-\.\.\.)$/i;
const forbiddenEnvFilePattern = /(^|[/\\])\.env($|[.][^/\\]+$)/;
const forbiddenDatabasePattern = /(^|[/\\])(dev|local|test)[^/\\]*[.](db|sqlite|sqlite3)$/i;

function toRelative(filePath) {
  return path.relative(repoRoot, filePath) || ".";
}

function discoverDotenvFiles() {
  return fs
    .readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\.env($|\.)/.test(entry.name))
    .map((entry) => path.join(repoRoot, entry.name));
}

function readDotenvSecrets() {
  const secrets = [];

  for (const envFile of discoverDotenvFiles()) {
    const parsed = dotenv.parse(fs.readFileSync(envFile));
    for (const [key, value] of Object.entries(parsed)) {
      if (shouldTreatAsSecret(key, value)) {
        secrets.push({
          label: `${toRelative(envFile)}:${key}`,
          value,
        });
      }
    }
  }

  return secrets;
}

function readEnvironmentSecrets() {
  return Object.entries(process.env)
    .filter(([key, value]) => shouldTreatAsSecret(key, value))
    .map(([key, value]) => ({
      label: `process.env:${key}`,
      value,
    }));
}

function shouldTreatAsSecret(key, value) {
  const normalized = String(value ?? "").trim();

  if (!secretKeyPattern.test(key)) {
    return false;
  }
  if (normalized.length < 8) {
    return false;
  }
  if (placeholderPattern.test(normalized)) {
    return false;
  }

  return true;
}

function uniqueSecrets(secrets) {
  const seen = new Map();

  for (const secret of secrets) {
    if (!seen.has(secret.value)) {
      seen.set(secret.value, {
        ...secret,
        labels: [secret.label],
      });
      continue;
    }

    seen.get(secret.value).labels.push(secret.label);
  }

  return [...seen.values()];
}

function walkFiles(root) {
  const files = [];

  if (!fs.existsSync(root)) {
    return files;
  }

  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift();
    const stat = fs.lstatSync(current);

    if (stat.isSymbolicLink()) {
      continue;
    }

    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(current)) {
        queue.push(path.join(current, child));
      }
      continue;
    }

    if (stat.isFile()) {
      files.push(current);
    }
  }

  return files;
}

function findAsarFiles(files) {
  return files.filter((file) => path.basename(file) === "app.asar");
}

function scanPathNames(files, findings) {
  for (const file of files) {
    const relativePath = toRelative(file);

    if (forbiddenEnvFilePattern.test(relativePath)) {
      findings.push({
        type: "forbidden-file",
        message: `Packaged output contains an env file: ${relativePath}`,
      });
    }

    if (forbiddenDatabasePattern.test(relativePath)) {
      findings.push({
        type: "forbidden-file",
        message: `Packaged output contains a local development database: ${relativePath}`,
      });
    }
  }
}

function scanAsarFileList(asarPath, findings) {
  const entries = asar.listPackage(asarPath);

  for (const entry of entries) {
    const displayPath = `${toRelative(asarPath)}:${entry}`;

    if (forbiddenEnvFilePattern.test(entry)) {
      findings.push({
        type: "forbidden-asar-entry",
        message: `Packaged app.asar contains an env file: ${displayPath}`,
      });
    }

    if (forbiddenDatabasePattern.test(entry)) {
      findings.push({
        type: "forbidden-asar-entry",
        message: `Packaged app.asar contains a local development database: ${displayPath}`,
      });
    }
  }
}

function scanSecretBytes(files, secrets, findings) {
  if (secrets.length === 0) {
    return;
  }

  for (const file of files) {
    const stat = fs.statSync(file);
    if (stat.size > 150 * 1024 * 1024) {
      continue;
    }

    const content = fs.readFileSync(file);
    for (const secret of secrets) {
      if (content.includes(Buffer.from(secret.value))) {
        findings.push({
          type: "secret-match",
          message: `Packaged output contains a secret value from ${secret.labels.join(", ")} in ${toRelative(file)}`,
        });
      }
    }
  }
}

function main() {
  const files = outputRoots.flatMap(walkFiles);

  if (files.length === 0) {
    throw new Error("No release artifacts were found. Run npm run package or npm run make first.");
  }

  const findings = [];
  const secrets = uniqueSecrets([
    ...readDotenvSecrets(),
    ...readEnvironmentSecrets(),
  ]);
  const asarFiles = findAsarFiles(files);

  scanPathNames(files, findings);
  for (const asarFile of asarFiles) {
    scanAsarFileList(asarFile, findings);
  }
  scanSecretBytes(files, secrets, findings);

  if (findings.length > 0) {
    console.error("Release artifact secret check failed:");
    for (const finding of findings) {
      console.error(`- ${finding.message}`);
    }
    process.exit(1);
  }

  console.log(
    `Release artifact secret check passed. Scanned ${files.length} files, ${asarFiles.length} app.asar archive(s), and ${secrets.length} local secret value(s).`
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
