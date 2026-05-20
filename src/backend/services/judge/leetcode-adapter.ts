import type { ProblemWithCounts } from "../../api/problem/problem";
import type { LanguageDto } from "../../api/language/language";
import type { TestCase } from "../../api/testcase/testcase";
import type { JudgeTestCase } from "./executor";

type LeetCodeSignature = {
  functionName: string;
  parameterNames: string[];
};

export type PreparedLeetCodeJudgeRun = {
  code: string;
  testCases: JudgeTestCase[];
};

function normalizeLanguageKey(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, "");
}

function splitTopLevel(value: string, separator = ",") {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (const character of value) {
    if (quote) {
      current += character;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === "[" || character === "{" || character === "(") {
      depth += 1;
    } else if (character === "]" || character === "}" || character === ")") {
      depth = Math.max(0, depth - 1);
    }

    if (character === separator && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function normalizeParameterNames(rawParams: string | undefined) {
  return (rawParams ?? "")
    .split(",")
    .map((param) =>
      param
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/#.*/g, "")
        .replace(/:.*/g, "")
        .replace(/=.*/g, "")
        .trim()
    )
    .filter(Boolean);
}

function extractJavaScriptSignature(code: string): LeetCodeSignature | null {
  const functionMatch =
    code.match(/function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/) ??
    code.match(/(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\(([^)]*)\)/) ??
    code.match(/(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*\(([^)]*)\)\s*=>/);

  if (!functionMatch) {
    return null;
  }

  return {
    functionName: functionMatch[1],
    parameterNames: normalizeParameterNames(functionMatch[2]),
  };
}

function extractPythonSignature(code: string): LeetCodeSignature | null {
  const methodMatch = code.match(/def\s+([A-Za-z_]\w*)\s*\(\s*self\s*(?:,\s*([^)]*))?\)/);
  if (methodMatch) {
    return {
      functionName: methodMatch[1],
      parameterNames: normalizeParameterNames(methodMatch[2]),
    };
  }

  const functionMatch = code.match(/def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/);
  if (!functionMatch) {
    return null;
  }

  return {
    functionName: functionMatch[1],
    parameterNames: normalizeParameterNames(functionMatch[2]),
  };
}

function extractSignature(
  languageKey: string,
  code: string,
  starterTemplate?: string
): LeetCodeSignature | null {
  const source = `${code}\n${starterTemplate ?? ""}`;

  if (languageKey === "javascript" || languageKey === "js" || languageKey === "typescript") {
    return extractJavaScriptSignature(source);
  }

  if (languageKey === "python" || languageKey === "python3" || languageKey === "py") {
    return extractPythonSignature(source);
  }

  return null;
}

function parseLiteral(value: string): unknown {
  const trimmed = value.trim();
  const normalized = trimmed
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null");

  try {
    return JSON.parse(normalized);
  } catch {
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    return trimmed.replace(/^['"]|['"]$/g, "");
  }
}

export function parseLeetCodeTestcaseArguments(
  input: string,
  parameterNames: string[]
): unknown[] | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const assignmentParts = splitTopLevel(trimmed).map((part) => {
    const match = part.match(/^([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/);
    return match ? { name: match[1], value: match[2] } : null;
  });

  if (assignmentParts.length > 0 && assignmentParts.every(Boolean)) {
    const valuesByName = new Map(
      assignmentParts.map((part) => [part?.name, part?.value] as [string, string])
    );
    const values = parameterNames.map((name) => valuesByName.get(name));
    if (values.every((value): value is string => value != null)) {
      return values.map(parseLiteral);
    }
  }

  if (parameterNames.length > 1 && lines.length === parameterNames.length) {
    return lines.map(parseLiteral);
  }

  if (parameterNames.length <= 1) {
    return [parseLiteral(trimmed)];
  }

  return null;
}

function buildJavaScriptHarness(userCode: string, signature: LeetCodeSignature) {
  return [
    userCode,
    "",
    "const __args = JSON.parse(require('fs').readFileSync(0, 'utf8') || '[]');",
    `const __result = ${signature.functionName}(...__args);`,
    "process.stdout.write(JSON.stringify(__result));",
    "",
  ].join("\n");
}

function buildPythonHarness(userCode: string, signature: LeetCodeSignature) {
  return [
    "from __future__ import annotations",
    "import json",
    userCode,
    "",
    "__args = json.loads(__import__('sys').stdin.read() or '[]')",
    "try:",
    `    __target = Solution().${signature.functionName}`,
    "except NameError:",
    `    __target = ${signature.functionName}`,
    "__result = __target(*__args)",
    "print(json.dumps(__result, separators=(',', ':')))",
    "",
  ].join("\n");
}

export function prepareLeetCodeJudgeRun(input: {
  problem: ProblemWithCounts | null;
  language: LanguageDto;
  code: string;
  testCases: TestCase[];
}): PreparedLeetCodeJudgeRun | null {
  if (input.problem?.source !== "LEETCODE") {
    return null;
  }

  const languageKey = normalizeLanguageKey(input.language.name || input.language.suffix);
  const starterTemplate = input.problem.starter_codes.find((starterCode) => {
    const starterKeys = [
      starterCode.language_slug,
      starterCode.language_name,
    ].map(normalizeLanguageKey);
    return starterKeys.includes(languageKey);
  })?.template;
  const signature = extractSignature(languageKey, input.code, starterTemplate);
  if (!signature) {
    return null;
  }

  const testCases = input.testCases.map((testcase) => {
    const args = parseLeetCodeTestcaseArguments(testcase.input, signature.parameterNames);
    if (!args) {
      return null;
    }

    return {
      input: JSON.stringify(args),
      timeLimitMs: testcase.timeLimitMs,
      memoryLimitMb: testcase.memoryLimitMb,
    };
  });

  if (testCases.some((testcase) => testcase == null)) {
    return null;
  }

  if (languageKey === "javascript" || languageKey === "js" || languageKey === "typescript") {
    return {
      code: buildJavaScriptHarness(input.code, signature),
      testCases: testCases as JudgeTestCase[],
    };
  }

  if (languageKey === "python" || languageKey === "python3" || languageKey === "py") {
    return {
      code: buildPythonHarness(input.code, signature),
      testCases: testCases as JudgeTestCase[],
    };
  }

  return null;
}
