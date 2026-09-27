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
  richTextVariant = "dark",
  className = "",
}) {
  const formatted = formatSolutionCode(code);
  if (!formatted) return null;

  const { text, lang } = prepareCodeDisplay(code, language);
  const forcedLang = language ? String(language) : "";
  const proseLike = looksLikeMarkdownProse(text) || lang === "markdown";
  const useMarkdown =
    proseLike ||
    !forcedLang ||
    !["cpp", "java", "python", "c"].includes(forcedLang);

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
