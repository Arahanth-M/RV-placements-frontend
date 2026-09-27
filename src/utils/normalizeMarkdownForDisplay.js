function collapseBrokenPipes(text) {
  return String(text)
    .replace(/\|\|+/g, "|\n|")
    .replace(/\|\s+\|(?=\s*\S)/g, "|\n|");
}

function splitInlineTableRows(text) {
  let s = String(text);
  if (!/\|/.test(s)) return s;
  if (/^\|.+\|\s*$/m.test(s) && s.split("\n").filter((l) => l.trim()).length >= 2) {
    return s;
  }
  s = s.replace(/\s*\|\s*(?=\|)/g, "|\n|");
  s = s.replace(/(\|[^|\n]+\|)\s+(?=\|[^|\n]+\|)/g, "$1\n");
  return s;
}

function looksStructuredMarkdown(text) {
  const lines = String(text).split("\n");
  if (lines.length >= 3) return true;
  if (/^\s*\d+\.\s+\S/m.test(text)) return true;
  if (/^\s*[-*+]\s+\S/m.test(text)) return true;
  if (/^\|.+\|$/m.test(text)) return true;
  return false;
}

/**
 * Light touch for already-structured Markdown; stronger fixes for one-line blobs.
 */
export function normalizeMarkdownForDisplay(text) {
  let s = splitInlineTableRows(String(text ?? ""));
  s = collapseBrokenPipes(s);
  if (!s.trim()) return "";

  if (looksStructuredMarkdown(s)) {
    s = s.replace(/\n{3,}/g, "\n\n");
    return s.trim();
  }

  s = s.replace(/([.!?])\s+(\d+\.\s+\*\*)/g, "$1\n\n$2");
  s = s.replace(/:\s+(\d+\.\s+\*\*)/g, ":\n\n$1");
  s = s.replace(/\s+(\d+\.\s+\*\*[^*\n]+\*\*)/g, "\n\n$1");

  s = s.replace(/\s*((?:^|\n)[-*+]\s+\S)/g, "\n$1");
  s = s.replace(/\s*(\|(?:[^|\n]+\|){2,})/g, "\n$1");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}
