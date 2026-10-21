import { formatSolutionCode, reflowSpacedSourceCode } from "./formatSolutionCode.js";

/** Fix legacy reflow that split `for (a; b; c)` across lines. */
export function repairSplitForLoopHeaders(code) {
  const lines = String(code ?? "").split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^for\s*\(/.test(trimmed) && !/\)\s*(\{|;|$)/.test(trimmed)) {
      let merged = trimmed;
      let j = i + 1;
      while (j < lines.length && !/\)\s*(\{|;|$)/.test(merged)) {
        merged += ` ${lines[j].trim()}`;
        j += 1;
      }
      out.push(merged.replace(/\s+/g, " "));
      i = j - 1;
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}

function unescapeLiterals(str) {
  return String(str)
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

/**
 * Brace/colon aware re-indent when leading whitespace was lost in storage.
 */
export function applyBasicIndent(code, language = "") {
  const lang = String(language || "").toLowerCase();
  const lines = String(code ?? "").split("\n");
  let depth = 0;
  const out = [];
  const pyStack = [];
  const unit = lang === "python" ? "    " : "  ";

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }

    if (lang === "cpp" && trimmed.startsWith("#")) {
      out.push(trimmed);
      continue;
    }

    if (lang === "python" && /^if\s+__name__\b/.test(trimmed)) {
      pyStack.length = 0;
      depth = 0;
    } else if (lang === "python" && /^(elif|else)\b/.test(trimmed)) {
      const hasIf = pyStack.includes("if") || pyStack.includes("elif");
      const match = hasIf ? ["if", "elif"] : ["for", "while", "try"];
      while (pyStack.length && !match.includes(pyStack[pyStack.length - 1])) pyStack.pop();
      if (match.includes(pyStack[pyStack.length - 1])) pyStack.pop();
      depth = pyStack.length;
    } else if (lang === "python" && /^(except|finally)\b/.test(trimmed)) {
      while (pyStack.length && pyStack[pyStack.length - 1] !== "try") pyStack.pop();
      if (pyStack[pyStack.length - 1] === "try") pyStack.pop();
      depth = pyStack.length;
    }

    if (/^[}\])]/.test(trimmed)) {
      depth = Math.max(0, depth - 1);
    }

    if (lang === "python" && /^def\s+/.test(trimmed)) {
      const prev = out.filter((line) => line.trim()).at(-1) || "";
      const prevOpens = /:\s*(#.*)?$/.test(prev.trim());
      if (!prevOpens) {
        while (pyStack[pyStack.length - 1] === "def" || pyStack[pyStack.length - 1] === "block") {
          pyStack.pop();
        }
      }
      depth = pyStack.length;
    } else if (lang === "python" && /^class\s+/.test(trimmed)) {
      pyStack.length = 0;
      depth = 0;
    }

    out.push(`${unit.repeat(depth)}${trimmed}`);

    if (lang === "python") {
      if (/:\s*(#.*)?$/.test(trimmed)) {
        if (/^class\s+/.test(trimmed)) pyStack.push("class");
        else if (/^def\s+/.test(trimmed)) pyStack.push("def");
        else if (/^if\b/.test(trimmed)) pyStack.push("if");
        else if (/^elif\b/.test(trimmed)) pyStack.push("elif");
        else if (/^else\b/.test(trimmed)) pyStack.push("else");
        else if (/^for\b/.test(trimmed)) pyStack.push("for");
        else if (/^while\b/.test(trimmed)) pyStack.push("while");
        else if (/^try\b/.test(trimmed)) pyStack.push("try");
        else if (/^except\b/.test(trimmed)) pyStack.push("except");
        else if (/^with\b/.test(trimmed)) pyStack.push("with");
        else pyStack.push("block");
        depth = pyStack.length;
      } else if (/^(return|pass|break|continue|raise)\b/.test(trimmed)) {
        const top = pyStack[pyStack.length - 1];
        if (top && top !== "def" && top !== "class") pyStack.pop();
        depth = pyStack.length;
      }
    } else if (/\{\s*$/.test(trimmed)) {
      depth += 1;
    }
  }

  return out.join("\n");
}

function needsIndentRestore(code, language = "") {
  const lang = String(language || "").toLowerCase();
  const rawLines = String(code ?? "").split("\n");
  const lines = rawLines.map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return false;

  if (lang === "python") {
    const hasLeading = rawLines.some((line) => line.trim() && /^(\s{4}|\t)/.test(line));
    if (!hasLeading) return true;
  }

  const indented = rawLines.filter((line) => line.trim() && /^(\s{2,}|\t)/.test(line)).length;
  return indented / lines.length < 0.15;
}

/**
 * Full pipeline: unescape, reflow one-liners, restore indent.
 */
export function prepareSourceCodeForDisplay(raw, language) {
  const lang = String(language || "").toLowerCase();
  let text = formatSolutionCode(raw, 0, { language: lang || undefined });
  text = unescapeLiterals(text);
  text = reflowSpacedSourceCode(text, lang);
  if (lang === "cpp" || lang === "c" || lang === "java") {
    text = repairSplitForLoopHeaders(text);
  }
  if (needsIndentRestore(text, lang)) {
    text = applyBasicIndent(text, lang);
  }
  return text;
}
