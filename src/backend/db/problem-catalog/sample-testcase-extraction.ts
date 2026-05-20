export type ExtractedSampleTestcase = {
  input: string;
  expectedOutput: string;
  sourceHint: "sample reference" | "problem description";
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, codepoint: string) =>
      String.fromCharCode(Number.parseInt(codepoint, 10))
    );
}

export function normalizeProblemTextForSampleExtraction(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|pre|div|li|ul|ol|blockquote|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanSegment(value: string) {
  return value
    .replace(/^\s*(?:Example|示例)\s*\d*\s*[:：]?\s*/i, "")
    .replace(/\n\s+/g, "\n")
    .trim();
}

export function extractSampleTestcasesFromText(
  value: string | null | undefined,
  sourceHint: ExtractedSampleTestcase["sourceHint"]
): ExtractedSampleTestcase[] {
  const text = normalizeProblemTextForSampleExtraction(value ?? "");
  if (!text) {
    return [];
  }

  const pattern =
    /(?:Input|输入)\s*[:：]\s*([\s\S]*?)\s*(?:Output|输出)\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:Explanation|解释|说明|Note|Constraints?|提示|Example|示例)\s*[:：]?|$)/gi;
  const examples: ExtractedSampleTestcase[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const input = cleanSegment(match[1] ?? "");
    const expectedOutput = cleanSegment(match[2] ?? "");

    if (!input || !expectedOutput) {
      continue;
    }

    examples.push({
      input,
      expectedOutput,
      sourceHint,
    });
  }

  return examples;
}

export function dedupeSampleTestcases(
  examples: ExtractedSampleTestcase[]
): ExtractedSampleTestcase[] {
  const seen = new Set<string>();
  return examples.filter((example) => {
    const signature = `${example.input}::${example.expectedOutput}`;
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}
