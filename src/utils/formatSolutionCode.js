const SOLUTION_OBJECT_KEYS = [
  "cpp",
  "java",
  "python",
  "solution",
  "code",
  "answer",
  "answers",
  "content",
  "text",
];

function looksLikeJsonWrapper(str) {
  if (str.length < 2) return false;
  const start = str[0];
  const end = str[str.length - 1];
  return (
    (start === "[" && end === "]") ||
    (start === "{" && end === "}") ||
    (start === '"' && end === '"')
  );
}

function unescapeIfSingleLine(str) {
  if (str.includes("\n") || !/\\[ntr]/.test(str)) return str;
  return str.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r");
}

/**
 * Turn stored OA/interview/coding solutions into displayable source.
 * Visits often persist JSON arrays or literal `\n` instead of real newlines.
 */
export function formatSolutionCode(value, depth = 0) {
  if (value == null) return "";
  if (depth > 5) return String(value).trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => formatSolutionCode(item, depth + 1))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof value === "object") {
    for (const key of SOLUTION_OBJECT_KEYS) {
      if (value[key] == null) continue;
      const nested = formatSolutionCode(value[key], depth + 1);
      if (nested) return nested;
    }
    return "";
  }

  let str = String(value).trim();
  if (!str) return "";

  if (looksLikeJsonWrapper(str)) {
    try {
      const parsed = JSON.parse(str);
      const nested = formatSolutionCode(parsed, depth + 1);
      if (nested) return nested;
    } catch {
      // not valid JSON — fall through
    }
  }

  return unescapeIfSingleLine(str);
}
