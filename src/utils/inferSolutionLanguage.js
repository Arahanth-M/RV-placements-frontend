/**
 * Pick a Prism language for solution text (OA / interview / coding).
 * Falls back to markdown for prose, typescript for ambiguous code-ish text.
 */
export function inferSolutionLanguage(code) {
  if (typeof code !== "string") return "markdown";
  const c = code.trim();
  if (!c) return "markdown";

  if (/#include\s*[<"]|using\s+namespace|std::|template\s*</.test(c)) return "cpp";
  if (/^\s*def\s+\w+\s*\(|^from\s+[\w.]+\s+import|^import\s+[\w.]+(\s+as\s+)?/m.test(c)) {
    return "python";
  }
  if (/\b(function|const|let|var)\s+\w+|=>\s*[{(`]|=>\s*$/m.test(c)) return "javascript";
  if (/\bpublic\s+class\b|\bpackage\s+[\w.]+\s*;/m.test(c)) return "java";
  if (/^\s*\{[\s\S]*\}\s*$/.test(c) && c.length < 100000) {
    try {
      JSON.parse(c);
      return "json";
    } catch {
      /* continue */
    }
  }
  if (/^#{1,6}\s+\S/m.test(c) || /^[-*+]\s+\S/m.test(c) || /```/.test(c)) {
    return "markdown";
  }
  if (/[;{}]\s*$/.test(c.slice(0, 200)) && /[=();<>]/.test(c)) return "typescript";
  return "markdown";
}
