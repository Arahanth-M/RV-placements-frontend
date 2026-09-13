import { useState } from "react";
import SolutionSyntaxBlock from "./SolutionSyntaxBlock";
import { formatSolutionCode } from "../utils/formatSolutionCode";

const LANGS = [
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
  { id: "python", label: "Python" },
];

function formattedSolutions(solutions) {
  const sols =
    solutions && typeof solutions === "object" && !Array.isArray(solutions)
      ? solutions
      : {};
  return {
    cpp: formatSolutionCode(sols.cpp),
    java: formatSolutionCode(sols.java),
    python: formatSolutionCode(sols.python),
  };
}

function pickDefaultTab(sols, hasIntuition) {
  if (hasIntuition) return "intuition";
  return LANGS.find((lang) => sols[lang.id])?.id || "cpp";
}

/**
 * Intuition / C++ / Java / Python switcher for platform OA/interview items.
 */
export default function LanguageSolutionPanel({
  solutions,
  intuition = "",
  fallbackCode = "",
  copied = false,
  onCopy,
  embedded = false,
}) {
  const sols = formattedSolutions(solutions);
  const intuitionText = formatSolutionCode(intuition);
  const hasIntuition = Boolean(intuitionText);
  const availableLangs = LANGS.filter((lang) => sols[lang.id]);
  const tabs = [
    ...(hasIntuition ? [{ id: "intuition", label: "Intuition" }] : []),
    ...availableLangs,
  ];
  const [tab, setTab] = useState(() => pickDefaultTab(sols, hasIntuition));
  const active = tabs.some((item) => item.id === tab)
    ? tab
    : pickDefaultTab(sols, hasIntuition);
  const code =
    active === "intuition" ? "" : sols[active] || formatSolutionCode(fallbackCode);

  if (!tabs.length && !formatSolutionCode(fallbackCode)) return null;

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
      {active === "intuition" && intuitionText ? (
        <div className="border-theme bg-theme-card p-4 sm:p-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-theme-secondary sm:text-base sm:leading-8">
            {intuitionText}
          </p>
        </div>
      ) : code ? (
        <div className="p-2 sm:p-3">
          <SolutionSyntaxBlock
            code={code}
            language={active === "cpp" ? "cpp" : active}
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
      ) : null}
    </div>
  );
}
