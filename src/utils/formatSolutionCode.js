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

function unescapeLiterals(str) {
  return String(str)
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

export function codeNeedsReflow(raw) {
  const text = String(raw ?? "");
  if (!text.trim()) return false;
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length <= 1) {
    return text.replace(/\s+/g, " ").trim().length > 60;
  }
  const avg = text.length / lines.length;
  return lines.length <= 4 && avg > 120;
}

/** Already multi-line stored code — reflow would break `long long`, for-loops, etc. */
function hasHealthyMultilineCode(raw) {
  const lines = String(raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;
  const reasonable = lines.filter((line) => line.length <= 140).length / lines.length;
  return lines.length >= 2 && reasonable >= 0.55;
}

const CPP_BREAK_BEFORE =
  /\s+(?=#include\b|#define\b|using\s+namespace\b|namespace\s+\w|struct\s+\w|class\s+\w|(?:public|private|protected):|(?:virtual\s+)?(?:void|int|bool|auto|double|float|char|string|vector|map|queue|stack|TreeNode|ListNode|Node)\b|if\s*\(|while\s*\(|return\b|else\b|switch\s*\()/g;

/** Split `;` only at statement level — keep `for (a; b; c)` on one line. */
export function newlineAfterStatementSemicolons(text) {
  let depth = 0;
  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
    if (ch === ";" && depth === 0) {
      out += ";\n";
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Groq/JSON often stores C++/Java/Python as one space-separated line.
 * @param {string} code
 * @param {string} language
 */
export function reflowSpacedSourceCode(code, language) {
  const raw = String(code ?? "");
  if (!raw.trim()) return raw;
  if (hasHealthyMultilineCode(raw)) return raw;
  if (!codeNeedsReflow(raw) && raw.includes("\n")) return raw;

  const lang = String(language || "").toLowerCase();
  let out = raw.replace(/\s+/g, " ").trim();

  if (lang === "cpp" || lang === "c" || (lang === "" && /#include\s*[<"]/.test(out))) {
    out = out.replace(/\s*(#include\s+[<"][^>"]+[>"])/g, "\n$1");
    out = out.replace(/\s*(using\s+namespace\s+[\w:]+\s*;)/g, "\n$1");
    out = out.replace(CPP_BREAK_BEFORE, "\n");
    out = newlineAfterStatementSemicolons(out);
    out = out.replace(/\{\s*/g, "{\n");
    out = out.replace(/\s*\}/g, "\n}\n");
    out = out.replace(/\n{3,}/g, "\n\n");
    return out.trim();
  }

  if (lang === "java" || (lang === "" && /\bpublic\s+class\b/.test(out))) {
    out = out.replace(/\s*(package\s+[\w.]+\s*;)/g, "\n$1");
    out = out.replace(/\s*(import\s+[\w.*]+\s*;)/g, "\n$1");
    out = out.replace(/\s*(public\s+class\s+\w+)/g, "\n$1");
    out = out.replace(CPP_BREAK_BEFORE, "\n");
    out = newlineAfterStatementSemicolons(out);
    out = out.replace(/\{\s*/g, "{\n");
    out = out.replace(/\s*\}/g, "\n}\n");
    out = out.replace(/\n{3,}/g, "\n\n");
    return out.trim();
  }

  if (lang === "python" || (lang === "" && /\bdef\s+\w+/.test(out))) {
    out = out.replace(/:\s*(?=return\b|pass\b|break\b|continue\b|[A-Za-z_])/g, ":\n");
    out = out.replace(
      /\s+(?=def |class |import |from |if |for |while |elif |else:|return |try:|except |with |#)/g,
      "\n"
    );
    out = out.replace(/\breturn\s+(?=[a-zA-Z_]\w*\s*=)/g, "return\n");
    return out.trim();
  }

  return raw;
}

/**
 * Turn stored OA/interview/coding solutions into displayable source.
 * Visits often persist JSON arrays or literal `\n` instead of real newlines.
 */
export function formatSolutionCode(value, depth = 0, options = {}) {
  if (value == null) return "";
  if (depth > 5) return String(value).trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => formatSolutionCode(item, depth + 1, options))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof value === "object") {
    for (const key of SOLUTION_OBJECT_KEYS) {
      if (value[key] == null) continue;
      const nested = formatSolutionCode(value[key], depth + 1, options);
      if (nested) return nested;
    }
    return "";
  }

  let str = String(value).trim();
  if (!str) return "";

  if (looksLikeJsonWrapper(str)) {
    try {
      const parsed = JSON.parse(str);
      const nested = formatSolutionCode(parsed, depth + 1, options);
      if (nested) return nested;
    } catch {
      // not valid JSON — fall through
    }
  }

  let result = unescapeLiterals(str);
  const lang = options.language ? String(options.language) : "";
  if (lang === "cpp" || lang === "java" || lang === "python" || lang === "c") {
    result = reflowSpacedSourceCode(result, lang);
  }
  return result;
}
