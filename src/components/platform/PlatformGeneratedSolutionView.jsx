import PrepRichText from "../PrepRichText.jsx";
import PrepSolutionBody from "../PrepSolutionBody.jsx";
import PlatformCodingSolutions from "./PlatformCodingSolutions.jsx";
import { formatSolutionCode } from "../../utils/formatSolutionCode.js";
import { looksLikeMarkdownProse } from "../../utils/looksLikeMarkdownProse.js";

function hasLanguageSolutions(solutions) {
  if (!solutions || typeof solutions !== "object") return false;
  return ["cpp", "java", "python"].some((key) => String(solutions[key] || "").trim());
}

/**
 * Matches platform admin “Add answers” review: Answer card + Solutions blocks.
 */
export default function PlatformGeneratedSolutionView({
  answer = "",
  solutions = null,
  intuition = "",
  fallbackCode = "",
  richTextVariant = "theme",
  questionLabel = "",
  onRegenerateLanguage,
  regeneratingLanguages,
  regenerateDisabled = false,
}) {
  const answerText = String(answer || "").trim();
  const intuitionText = formatSolutionCode(intuition);
  const fallback = formatSolutionCode(fallbackCode);
  const hasLang = hasLanguageSolutions(solutions);
  const showAnswerCard =
    Boolean(answerText) && (!hasLang || looksLikeMarkdownProse(answerText) || answerText.length < 600);

  return (
    <div className="space-y-3" data-testid="platform-generated-solution">
      {showAnswerCard ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Answer
          </p>
          {looksLikeMarkdownProse(answerText) ? (
            <PrepRichText variant={richTextVariant}>{answerText}</PrepRichText>
          ) : (
            <PrepSolutionBody code={answerText} richTextVariant={richTextVariant} />
          )}
        </div>
      ) : null}

      {intuitionText ? (
        <div className="rounded-xl border border-theme bg-theme-card p-3 sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-secondary">
            Intuition
          </p>
          {looksLikeMarkdownProse(intuitionText) ? (
            <PrepRichText variant={richTextVariant}>{intuitionText}</PrepRichText>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-theme-secondary">
              {intuitionText}
            </p>
          )}
        </div>
      ) : null}

      {hasLang || typeof onRegenerateLanguage === "function" ? (
        <PlatformCodingSolutions
          solutions={solutions}
          showAllLanguages={typeof onRegenerateLanguage === "function"}
          onRegenerate={onRegenerateLanguage}
          regeneratingLanguages={regeneratingLanguages}
          disabled={regenerateDisabled}
          questionLabel={questionLabel}
        />
      ) : fallback ? (
        <div className="overflow-hidden rounded-xl border border-theme bg-theme-card p-2 sm:p-3">
          <PrepSolutionBody code={fallback} richTextVariant={richTextVariant} />
        </div>
      ) : null}
    </div>
  );
}
