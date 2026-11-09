import { useState } from "react";
import PrepSolutionBody from "./PrepSolutionBody";
import PrepRichText from "./PrepRichText";
import { preserveStoredSourceForDisplay } from "../utils/prepareSourceCodeForDisplay.js";
import { looksLikeMarkdownProse } from "../utils/looksLikeMarkdownProse";
import PlatformAdminCodeBlock from "./platform/PlatformAdminCodeBlock.jsx";

const LANGS = [
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
  { id: "python", label: "Python" },
];

function storedSolutions(solutions) {
  const sols =
    solutions && typeof solutions === "object" && !Array.isArray(solutions)
      ? solutions
      : {};
  return {
    cpp: preserveStoredSourceForDisplay(sols.cpp),
    java: preserveStoredSourceForDisplay(sols.java),
    python: preserveStoredSourceForDisplay(sols.python),
  };
}

function pickDefaultTab(sols, hasIntuition, hasExplanation) {
  if (hasIntuition) return "intuition";
  if (hasExplanation) return "explanation";
  return LANGS.find((lang) => sols[lang.id])?.id || "cpp";
}

/**
 * Intuition / C++ / Java / Python switcher for platform OA/interview items.
 */
export default function LanguageSolutionPanel({
  solutions,
  intuition = "",
  explanation = "",
  fallbackCode = "",
  copied = false,
  onCopy,
  embedded = false,
  richTextVariant = "theme",
  platformAdminCodeDisplay = false,
}) {
  const sols = storedSolutions(solutions);
  const intuitionText = preserveStoredSourceForDisplay(intuition);
  const explanationText = preserveStoredSourceForDisplay(explanation);
  const hasIntuition = Boolean(String(intuitionText || "").trim());
  const hasExplanation = Boolean(String(explanationText || "").trim());
  const availableLangs = LANGS.filter((lang) => String(sols[lang.id] || "").trim());
  const tabs = [
    ...(hasIntuition ? [{ id: "intuition", label: "Intuition" }] : []),
    ...(hasExplanation ? [{ id: "explanation", label: "Explanation" }] : []),
    ...availableLangs,
  ];
  const [tab, setTab] = useState(() => pickDefaultTab(sols, hasIntuition, hasExplanation));
  const active = tabs.some((item) => item.id === tab)
    ? tab
    : pickDefaultTab(sols, hasIntuition, hasExplanation);
  const prose = active === "intuition" ? intuitionText : active === "explanation" ? explanationText : "";
  const fallbackStored = preserveStoredSourceForDisplay(fallbackCode);
  const code = prose ? "" : sols[active] || fallbackStored;

  if (!tabs.length && !String(fallbackStored || "").trim()) return null;

  return (
    <div
      className={
        embedded
          ? "min-w-0"
          : "min-w-0 overflow-hidden rounded-none border border-theme bg-theme-card"
      }
    >
      {tabs.length > 0 ? (
        <div
          className="grid border-b border-theme bg-theme-hero/40"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          role="tablist"
          aria-label="Solution view"
        >
          {tabs.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(item.id)}
                className={`min-h-[44px] rounded-none border-r border-theme px-3 py-2.5 text-sm font-semibold tracking-wide last:border-r-0 sm:min-h-[48px] sm:px-4 sm:text-base ${
                  isActive
                    ? "bg-theme-accent text-white"
                    : "bg-transparent text-theme-secondary hover:bg-theme-card hover:text-theme-primary"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {prose ? (
        <div className="border-theme bg-theme-card p-4 sm:p-5">
          {looksLikeMarkdownProse(prose) ? (
            <PrepRichText variant={richTextVariant}>{prose}</PrepRichText>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-7 text-theme-secondary sm:text-base sm:leading-8">
              {prose}
            </p>
          )}
        </div>
      ) : code ? (
        platformAdminCodeDisplay && active !== "intuition" && active !== "explanation" ? (
          <PlatformAdminCodeBlock
            code={solutions?.[active] ?? fallbackCode}
            language={active}
            toolbar={
              onCopy ? (
                <button
                  type="button"
                  onClick={() => onCopy(code)}
                  className="rounded-lg bg-slate-800/95 hover:bg-slate-700 text-slate-200 px-2 py-1.5 text-xs font-medium transition-colors border border-slate-600"
                  title="Copy solution"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              ) : null
            }
          />
        ) : (
          <div className="p-2 sm:p-3">
            <PrepSolutionBody
              code={code}
              language={active === "intuition" ? undefined : active}
              richTextVariant={richTextVariant}
              toolbar={
                onCopy ? (
                  <button
                    type="button"
                    onClick={() => onCopy(code)}
                    className="rounded-lg bg-slate-800/95 hover:bg-slate-700 text-slate-200 px-2 py-1.5 text-xs font-medium transition-colors border border-slate-600"
                    title="Copy solution"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                ) : null
              }
            />
          </div>
        )
      ) : null}
    </div>
  );
}
