/**
 * True when text should be rendered as Markdown (not Prism-highlighted code).
 */
export function looksLikeMarkdownProse(text) {
  const s = String(text ?? "");
  if (!s.trim()) return false;
  if (/```/.test(s)) return true;
  if (/\*\*[^*\n]+\*\*/.test(s)) return true;
  if (/^#{1,6}\s+\S/m.test(s)) return true;
  if (/^[-*+]\s+\S/m.test(s)) return true;
  if (/^\d+\.\s+\S/m.test(s)) return true;
  if (/^\|.+\|\s*$/m.test(s) && /^\|[\s:|-]+\|\s*$/m.test(s)) return true;
  const pipeCount = (s.match(/\|/g) || []).length;
  if (pipeCount >= 6 && /\|[^|\n]+\|/.test(s)) return true;
  return false;
}
