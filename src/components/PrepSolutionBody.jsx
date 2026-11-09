import SolutionSyntaxBlock from "./SolutionSyntaxBlock";
import PrepRichText from "./PrepRichText";
import { preserveStoredSourceForDisplay } from "../utils/prepareSourceCodeForDisplay.js";
import { inferSolutionLanguage } from "../utils/inferSolutionLanguage";
import { looksLikeMarkdownProse } from "../utils/looksLikeMarkdownProse";

const PRISM_LANG = {
  cpp: "cpp",
  java: "java",
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  json: "json",
};

/**
 * Renders interview/OA solution text as Markdown or syntax-highlighted code.
 * Coding languages keep indentation exactly as stored.
 */
export default function PrepSolutionBody({
  code,
  language,
  toolbar = null,
  richTextVariant = "theme",
  className = "",
}) {
  const forcedLang = language ? String(language) : "";
  const stored = preserveStoredSourceForDisplay(code);
  // Emptiness check may trim; displayed source itself is never trimmed.
  if (!String(stored || "").trim()) return null;

  const forcedCodeLang = ["cpp", "java", "python", "c"].includes(
    forcedLang.toLowerCase()
  );
  const inferredLang = forcedLang || inferSolutionLanguage(stored);
  // Forced coding languages must never fall through to Markdown — pipe-heavy
  // Python (e.g. `int | str`) was false-positive matched as prose and lost indent.
  const useMarkdown =
    !forcedCodeLang &&
    (looksLikeMarkdownProse(stored) || inferredLang === "markdown" || !forcedLang);

  if (useMarkdown) {
    return <PrepRichText variant={richTextVariant}>{stored}</PrepRichText>;
  }

  return (
    <SolutionSyntaxBlock
      code={stored}
      language={forcedLang || PRISM_LANG[inferredLang] || inferredLang}
      toolbar={toolbar}
      className={className}
    />
  );
}
