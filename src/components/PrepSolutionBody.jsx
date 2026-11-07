import SolutionSyntaxBlock from "./SolutionSyntaxBlock";
import PrepRichText from "./PrepRichText";
import { formatSolutionCode } from "../utils/formatSolutionCode";
import { prepareSourceCodeForDisplay } from "../utils/prepareSourceCodeForDisplay.js";
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

function prepareCodeDisplay(raw, forcedLanguage) {
  const langHint = forcedLanguage ? String(forcedLanguage) : "";
  const lang = langHint || inferSolutionLanguage(formatSolutionCode(raw));
  const text =
    langHint && PRISM_LANG[langHint]
      ? prepareSourceCodeForDisplay(raw, langHint)
      : formatSolutionCode(raw);
  return { text, lang };
}

/**
 * Renders interview/OA solution text as Markdown or syntax-highlighted code.
 */
export default function PrepSolutionBody({
  code,
  language,
  toolbar = null,
  richTextVariant = "theme",
  className = "",
}) {
  const forcedLang = language ? String(language) : "";
  const formatted =
    forcedLang.toLowerCase() === "python"
      ? prepareSourceCodeForDisplay(code, "python")
      : formatSolutionCode(code);
  // Emptiness check may trim; displayed Python source itself is never trimmed.
  if (!String(formatted || "").trim()) return null;

  const { text, lang } = prepareCodeDisplay(code, language);
  const forcedCodeLang = ["cpp", "java", "python", "c"].includes(
    forcedLang.toLowerCase()
  );
  // Forced coding languages must never fall through to Markdown — pipe-heavy
  // Python (e.g. `int | str`) was false-positive matched as prose and lost indent.
  const useMarkdown =
    !forcedCodeLang &&
    (looksLikeMarkdownProse(text) || lang === "markdown" || !forcedLang);

  if (useMarkdown) {
    return <PrepRichText variant={richTextVariant}>{text}</PrepRichText>;
  }

  return (
    <SolutionSyntaxBlock
      code={code}
      language={forcedLang || PRISM_LANG[lang] || lang}
      toolbar={toolbar}
      className={className}
    />
  );
}
