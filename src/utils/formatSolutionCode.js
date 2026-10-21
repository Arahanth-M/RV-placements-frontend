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

const PY_STATEMENT =
  /^(def|class|import|from|if|elif|else|for|while|try|except|finally|with|return|raise|yield|assert|pass|break|continue)(?![\w])/;

/** Indented, or already broken onto real statement lines — do not flatten. */
export function pythonAlreadyLaidOut(raw) {
  const lines = String(raw ?? "").split("\n");
  if (lines.length < 2) return false;
  if (lines.some((line) => /^\s+\S/.test(line))) return true;
  const bodies = lines.map((line) => line.trim()).filter(Boolean);
  const statements = bodies.filter((line) => PY_STATEMENT.test(line));
  return statements.length >= 2 && bodies.length >= 4;
}

/** A line still holds a second statement, e.g. `import argparse parser = ...`. */
function pythonLineHasExtraStatement(line) {
  const s = String(line ?? "").trim();
  if (!s) return false;
  let quote = null;
  let depth = 0;
  let comment = false;
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    if (comment) break;
    if (quote) {
      if (s[i] === "\\" && quote.length === 1 && i + 1 < s.length) {
        out += s[i] + s[i + 1];
        i += 1;
        continue;
      }
      if (s.startsWith(quote, i)) {
        out += quote;
        i += quote.length - 1;
        quote = null;
        continue;
      }
      out += s[i];
      continue;
    }
    if (s[i] === "#" && depth === 0) {
      comment = true;
      break;
    }
    const nextQuote = peekPythonQuote(s, i);
    if (nextQuote) {
      quote = nextQuote;
      out += nextQuote;
      i += nextQuote.length - 1;
      continue;
    }
    const ch = s[i];
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
    const starts =
      depth === 0 &&
      (i === 0 || s[i - 1] === " ") &&
      /[A-Za-z_]/.test(ch) &&
      (PY_STATEMENT.test(s.slice(i)) || pythonStatementStartsAt(s, i, out));
    if (starts && out && !out.endsWith("\n")) return true;
    out += ch;
  }
  return false;
}

function pythonHasGluedStatements(raw) {
  return String(raw ?? "").split("\n").some(pythonLineHasExtraStatement);
}

function skipPythonType(s, start) {
  let k = start;
  if (!/[A-Za-z_]/.test(s[k] || "")) return start;
  while (k < s.length) {
    if (/[\w.]/.test(s[k])) {
      k += 1;
      continue;
    }
    if (s[k] === "[") {
      let depth = 1;
      k += 1;
      while (k < s.length && depth > 0) {
        if (s[k] === "[") depth += 1;
        else if (s[k] === "]") depth -= 1;
        k += 1;
      }
      continue;
    }
    if (s[k] === " " && /[A-Za-z_\[]/.test(s[k + 1] || "")) {
      k += 1;
      continue;
    }
    if (s[k] === "|" || s[k] === "&") {
      k += 1;
      continue;
    }
    break;
  }
  return k;
}

function pythonColonClosesHeader(s, colonIdx) {
  let p = colonIdx - 1;
  while (p >= 0 && s[p] === " ") p -= 1;
  if (p < 0) return true;
  if (s[p] === ")") return true;
  while (p >= 0 && /[\w.\]]/.test(s[p])) {
    if (s[p] === "]") {
      let depth = 1;
      p -= 1;
      while (p >= 0 && depth > 0) {
        if (s[p] === "]") depth += 1;
        else if (s[p] === "[") depth -= 1;
        p -= 1;
      }
      continue;
    }
    p -= 1;
  }
  while (p >= 0 && s[p] === " ") p -= 1;
  return s.slice(Math.max(0, p - 1), p + 1) === "->";
}

/** `src: str` and `self.adj: Dict[...] =` are annotations, not new blocks. */
function isPythonAnnotationColon(s, colonIdx) {
  if (pythonColonClosesHeader(s, colonIdx)) return false;
  let j = colonIdx + 1;
  while (s[j] === " ") j += 1;
  if (PY_STATEMENT.test(s.slice(j))) return false;
  const end = skipPythonType(s, j);
  if (end === j) return false;
  let k = end;
  while (s[k] === " ") k += 1;
  return s[k] === "=" || s[k] === "," || s[k] === ")" || s[k] === "]";
}

function pythonStatementStartsAt(s, i, out) {
  let q = i - 1;
  while (q >= 0 && s[q] === " ") q -= 1;
  if (q < 0) return false;
  const prev = s[q];
  if (prev === ")" || prev === "]" || prev === "}" || prev === '"' || prev === "'" || prev === "`" || /[0-9]/.test(prev)) {
    return true;
  }
  if (/[A-Za-z0-9_]/.test(prev)) {
    const line = out.slice(out.lastIndexOf("\n") + 1).trim();
    if (/^import\s+\S+$/.test(line)) return true;
    if (/^from\s+\S+\s+import\s+\S+$/.test(line)) return true;
  }
  return false;
}

function peekPythonQuote(s, idx) {
  if (s.startsWith('"""', idx)) return '"""';
  if (s.startsWith("'''", idx)) return "'''";
  if (s[idx] === '"') return '"';
  if (s[idx] === "'") return "'";
  return null;
}

/**
 * Split a one-line Python blob on statement boundaries.
 * Leaves type annotations, docstrings, and backtick spans inside strings alone.
 */
export function reflowPythonOneLiner(src) {
  const s = String(src ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .trim();
  if (!s) return "";

  let out = "";
  let i = 0;
  let quote = null;
  let depth = 0;

  while (i < s.length) {
    if (quote) {
      if (s[i] === "\\" && quote.length === 1 && i + 1 < s.length) {
        out += s[i] + s[i + 1];
        i += 2;
        continue;
      }
      if (s.startsWith(quote, i)) {
        out += quote;
        i += quote.length;
        quote = null;
        continue;
      }
      out += s[i];
      i += 1;
      continue;
    }

    const nextQuote = peekPythonQuote(s, i);
    if (nextQuote) {
      quote = nextQuote;
      out += nextQuote;
      i += nextQuote.length;
      continue;
    }

    const ch = s[i];
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);

    if (
      depth === 0 &&
      (i === 0 || s[i - 1] === " ") &&
      /[A-Za-z_]/.test(ch) &&
      !PY_STATEMENT.test(s.slice(i)) &&
      pythonStatementStartsAt(s, i, out)
    ) {
      if (out && !out.endsWith("\n")) out += "\n";
    }

    if (ch === ":" && depth === 0 && !isPythonAnnotationColon(s, i)) {
      out += ":\n";
      i += 1;
      while (s[i] === " ") i += 1;
      continue;
    }

    if (depth === 0 && (i === 0 || s[i - 1] === " ") && PY_STATEMENT.test(s.slice(i))) {
      const word = s.slice(i).match(PY_STATEMENT)[1];
      if (word === "import" && /(?:^|\n)from\b[^\n]*$/.test(out)) {
        out += word;
        i += word.length;
        continue;
      }
      if (word === "return" && /^\s+[A-Za-z_]\w*\s*=/.test(s.slice(i + word.length))) {
        if (out && !out.endsWith("\n")) out += "\n";
        out += "return\n";
        i += word.length;
        while (s[i] === " ") i += 1;
        continue;
      }
      if (out && !out.endsWith("\n")) out += "\n";
      out += word;
      i += word.length;
      continue;
    }

    if (depth === 0 && ch === "#" && (i === 0 || s[i - 1] === " ")) {
      if (out && !out.endsWith("\n")) out += "\n";
    }

    out += ch;
    i += 1;
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Groq/JSON often stores C++/Java/Python as one space-separated line.
 * @param {string} code
 * @param {string} language
 */
export function reflowSpacedSourceCode(code, language) {
  const raw = String(code ?? "");
  if (!raw.trim()) return raw;
  const lang = String(language || "").toLowerCase();
  const pythonish = lang === "python" || (lang === "" && /\bdef\s+\w+/.test(raw));
  if (pythonish) {
    if (pythonAlreadyLaidOut(raw) && !pythonHasGluedStatements(raw)) return raw;
    return reflowPythonOneLiner(raw.replace(/\s+/g, " ").trim());
  }
  if (hasHealthyMultilineCode(raw)) return raw;
  if (!codeNeedsReflow(raw) && raw.includes("\n")) return raw;

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
