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

    if (lang === "python" && /^(elif|else|except|finally)\b/.test(trimmed)) {
      depth = Math.max(0, depth - 1);
    }

    if (/^[}\])]/.test(trimmed)) {
      depth = Math.max(0, depth - 1);
    }

    out.push(`${unit.repeat(depth)}${trimmed}`);

    if (lang === "python") {
      if (/:\s*$/.test(trimmed)) {
        depth += 1;
      } else if (/^(return|pass|break|continue)\b/.test(trimmed)) {
        depth = Math.max(0, depth - 1);
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
