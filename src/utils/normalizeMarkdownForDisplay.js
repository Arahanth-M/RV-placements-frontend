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
  if (/^\s*\d+\)\s+\S/m.test(text)) return true;
  if (/^\s*[-*+]\s+\S/m.test(text)) return true;
  if (/^\|.+\|$/m.test(text)) return true;
  return false;
}

/** Normalize newlines / odd spaces so list-join regexes are reliable. */
function normalizeLineEndings(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, " ")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/\uFF0E/g, "."); // fullwidth full stop → .
}

/**
 * Model answers often put the list marker alone, then the title on the next line:
 *   1.
 *   **Time Quantum** – …
 * Join so ReactMarkdown keeps number + content on one line.
 */
function joinBrokenNumberedItems(text) {
  let s = String(text);

  // **1.**\n**Title** → 1. **Title**
  s = s.replace(/^\*\*(\d+)\.\*\*[ \t]*\n+(?=\S)/gm, "$1. ");
  // 1)\nTitle → 1. Title
  s = s.replace(/^(\d+)\)[ \t]*\n+(?=\S)/gm, "$1. ");
  // 1.\n**Title** / 1.\n\nTitle / 1.\n– Title (any non-empty continuation)
  s = s.replace(/^(\d+\.)[ \t]*\n+(?=\S)/gm, "$1 ");
  // Indented variants inside a block
  s = s.replace(/^([ \t]*)\*\*(\d+)\.\*\*[ \t]*\n+[ \t]*(?=\S)/gm, "$1$2. ");
  s = s.replace(/^([ \t]*)(\d+)\)[ \t]*\n+[ \t]*(?=\S)/gm, "$1$2. ");
  s = s.replace(/^([ \t]*)(\d+\.)[ \t]*\n+[ \t]*(?=\S)/gm, "$1$2 ");

  // Lone marker line with only spaces already handled; also "1.   \nTitle"
  s = s.replace(/^(\d+\.)[ \t]+$/gm, "$1");
  s = s.replace(/^(\d+\.)[ \t]*\n+(?=\S)/gm, "$1 ");

  // Run twice — array-joined answers can leave a blank line between marker and title
  s = s.replace(/^(\d+\.)[ \t]*\n+(?=\S)/gm, "$1 ");

  return s;
}

/**
 * Light touch for already-structured Markdown; stronger fixes for one-line blobs.
 */
export function normalizeMarkdownForDisplay(text) {
  let s = normalizeLineEndings(String(text ?? ""));
  s = splitInlineTableRows(s);
  s = collapseBrokenPipes(s);
  if (!s.trim()) return "";

  if (looksStructuredMarkdown(s)) {
    s = joinBrokenNumberedItems(s);
    s = s.replace(/\n{3,}/g, "\n\n");
    return s.trim();
  }

  s = s.replace(/([.!?])\s+(\d+\.\s+\*\*)/g, "$1\n\n$2");
  s = s.replace(/:\s+(\d+\.\s+\*\*)/g, ":\n\n$1");
  s = s.replace(/\s+(\d+\.\s+\*\*[^*\n]+\*\*)/g, "\n\n$1");

  s = s.replace(/\s*((?:^|\n)[-*+]\s+\S)/g, "\n$1");
  s = s.replace(/\s*(\|(?:[^|\n]+\|){2,})/g, "\n$1");
  s = joinBrokenNumberedItems(s);
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}
