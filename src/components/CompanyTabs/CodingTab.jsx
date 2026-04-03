import React, { useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";
import { solutionBlockClass } from "../../utils/solutionPalette";

/**
 * Human-readable label for a key (e.g. "solution_code" -> "Solution Code").
 */
function fieldLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Preferred order for displaying fields. Unknown keys go at the end, alphabetically.
 */
/**
 * Preferred order for displaying fields. Title first, intuition last. Unknown keys at end, alphabetically.
 */
const FIELD_ORDER = [
  "title",
  "question", "problem", "statement", "description",
  "difficulty", "acceptance", "acceptance_rate", "topic", "topics", "link", "source",
  "solution", "code", "answer", "explanation", "solution_code",
  "intuition",
];

function sortKeys(keys) {
  const intuitionKey = keys.find((k) => k.toLowerCase() === "intuition");
  const rest = keys.filter((k) => k.toLowerCase() !== "intuition");
  const sorted = [...rest].sort((a, b) => {
    const ai = FIELD_ORDER.indexOf(a);
    const bi = FIELD_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
  return intuitionKey ? [...sorted, intuitionKey] : sorted;
}

/**
 * Renders a value for display (string, number, array, object).
 */
function ValueDisplay({ value }) {
  if (value == null) return <span className="text-theme-muted italic">—</span>;
  if (typeof value === "string") {
    return (
      <span className="text-theme-secondary text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
        {value}
      </span>
    );
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-theme-secondary">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1.5 text-theme-secondary">
        {value.map((item, i) => (
          <li key={i}>
            {typeof item === "object" && item !== null ? (
              <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words font-mono bg-theme-input rounded p-2.5 sm:p-3 mt-1 border border-theme">
                {JSON.stringify(item, null, 2)}
              </pre>
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <pre className="text-xs sm:text-sm text-theme-secondary whitespace-pre-wrap break-words font-mono bg-theme-input rounded p-2.5 sm:p-3 border border-theme">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <span className="text-theme-secondary">{String(value)}</span>;
}

/**
 * Single field in its own box (formal card). Accepts optional displayValue for overrides (e.g. percentage), isLink for clickable link.
 */
function FieldBox({ label, value, isCode, displayValue, isLink, paletteIndex }) {
  const isEmpty = value == null || (typeof value === "string" && !value.trim());
  if (isEmpty) return null;

  const content = displayValue !== undefined ? displayValue : value;
  const usePalette =
    typeof paletteIndex === "number" && !Number.isNaN(paletteIndex);

  if (isCode) {
    return (
      <div className="rounded-xl border border-theme bg-theme-card overflow-hidden shadow-sm">
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-theme bg-theme-input">
          <span
            className={`text-xs sm:text-sm font-semibold tracking-wide ${
              usePalette ? "coding-solution-label" : "text-theme-accent"
            }`}
          >
            {label}
          </span>
        </div>
        <div className="p-3 sm:p-4">
          <pre
            className={`text-xs sm:text-sm whitespace-pre-wrap break-words font-mono leading-relaxed bg-theme-input rounded-lg p-3 sm:p-4 border border-theme ${
              usePalette ? "coding-solution-pre" : "text-theme-primary"
            }`}
          >
            <code>{typeof content === "string" ? content : JSON.stringify(content, null, 2)}</code>
          </pre>
        </div>
      </div>
    );
  }

  const href = typeof value === "string" ? value.trim() : "";
  const isUrl = isLink && href.length > 0;
  const linkHref = isUrl && !href.startsWith("http") && !href.startsWith("/") ? `https://${href}` : href;

  return (
    <div className="rounded-xl border border-theme bg-theme-card overflow-hidden shadow-sm">
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-theme bg-theme-input">
        <span className="text-xs sm:text-sm font-semibold text-theme-secondary tracking-wide">
          {label}
        </span>
      </div>
      <div className="p-3 sm:p-4">
        {isUrl ? (
          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-theme-accent hover:underline break-all"
          >
            {content}
          </a>
        ) : displayValue !== undefined ? (
          <span className="text-theme-secondary">{displayValue}</span>
        ) : (
          <ValueDisplay value={value} />
        )}
      </div>
    </div>
  );
}

const CODE_KEYS = new Set(["solution", "code", "answer", "explanation", "solution_code"]);
/** Fields that span full width (displayed last, col-span-2). */
const FULL_WIDTH_KEYS = new Set(["intuition"]);
const LINK_KEYS = new Set(["link", "source", "url"]);
const SKIP_KEYS = new Set(["_id"]);
/** Keys that should be shown as percentage with 2 decimal places */
const ACCEPTANCE_KEYS = new Set([
  "acceptance", "acceptance_rate", "acceptancerate", "acceptance rate",
]);

/**
 * Get the display title for an item (accordion header). Prefer title/Title, then question, problem, description.
 */
function getItemTitle(item) {
  if (!item || typeof item !== "object") return "";
  const v = item.title ?? item.Title ?? item.question ?? item.problem ?? item.statement ?? item.description;
  if (v != null && String(v).trim() !== "") return String(v).trim();
  return "";
}

/**
 * Format acceptance as percentage with exactly 2 decimal places (e.g. 0.4567 -> "45.67%", 45.67 -> "45.67%").
 */
function formatAcceptance(value) {
  if (value == null) return "—";
  let n = NaN;
  if (typeof value === "number") n = value;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/%/g, "");
    n = parseFloat(cleaned);
  }
  if (Number.isNaN(n)) return "—";
  const pct = n <= 1 && n > -0.0001 ? n * 100 : n;
  return `${Number(pct).toFixed(2)}%`;
}

function CodingTab({ company }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const safeCompany = company || {};
  const items = Array.isArray(safeCompany.prev_coding_ques) ? safeCompany.prev_coding_ques : [];

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-5 sm:space-y-6 text-theme-primary">
        <div className="bg-theme-card border border-theme rounded-xl p-6 sm:p-8 text-center">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-theme-accent">
            Previous Coding Questions
          </h2>
          <p className="text-theme-muted">No coding questions added yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-5 sm:space-y-6 text-theme-primary">
      <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-1 text-theme-accent">
          Previous Coding Questions
        </h2>
        <p className="text-theme-muted text-xs sm:text-sm mb-4 sm:mb-6">
          {items.length} question{items.length !== 1 ? "s" : ""} available
        </p>
        <div className="space-y-3 sm:space-y-4">
          {items.map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const keys = sortKeys(
              Object.keys(item).filter((k) => !SKIP_KEYS.has(k))
            );
            const itemTitle = getItemTitle(item);
            const preview =
              itemTitle !== ""
                ? itemTitle.slice(0, 60) + (itemTitle.length > 60 ? "…" : "")
                : "Coding question";

            return (
              <div
                key={index}
                className="border border-theme rounded-xl bg-theme-card overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left px-3 py-3.5 sm:px-5 sm:py-4 font-semibold text-theme-primary flex justify-between items-center min-w-0 hover:bg-theme-nav transition-colors gap-2 text-sm sm:text-base"
                >
                  <span className="truncate pr-2 min-w-0">{preview}</span>
                  <span className="text-theme-muted text-base sm:text-lg shrink-0">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </button>

                {openIndex === index && (
                  <div className="px-3 pb-4 sm:px-4 sm:pb-5 pt-1 min-w-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {keys.map((key) => {
                        const value = item[key];
                        const isEmpty =
                          value == null ||
                          (typeof value === "string" && !value.trim());
                        if (isEmpty) return null;

                        const keyLower = key.toLowerCase();
                        const isCode = CODE_KEYS.has(key);
                        const isFullWidth = FULL_WIDTH_KEYS.has(keyLower);
                        const isLink = LINK_KEYS.has(keyLower);
                        const isAcceptance = ACCEPTANCE_KEYS.has(keyLower);

                        // For intuition, treat literal "\n" as real newlines
                        let processedValue = value;
                        if (keyLower === "intuition" && typeof value === "string") {
                          processedValue = value.replace(/\\n/g, "\n");
                        }

                        const displayValue = isAcceptance ? formatAcceptance(value) : undefined;
                        const label = fieldLabel(key);

                        const codeOrdinal = keys
                          .filter((k) => CODE_KEYS.has(k))
                          .indexOf(key);
                        const codePalette =
                          (codeOrdinal + index * 7) % 6;

                        return (
                          <div
                            key={key}
                            className={`min-w-0 ${isCode || isFullWidth ? "md:col-span-2" : ""}`}
                          >
                            {isCode ? (
                              <div className={`relative ${solutionBlockClass(codePalette)}`}>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(value, `${index}-${key}`)}
                                  className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-theme-input hover:bg-theme-nav text-theme-primary px-2 py-1.5 text-[10px] sm:text-xs font-medium transition-colors border border-theme"
                                  title="Copy"
                                >
                                  {copiedKey === `${index}-${key}` ? (
                                    <>
                                      <FaCheck className="w-3 h-3 shrink-0" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <FaCopy className="w-3 h-3 shrink-0" />
                                      Copy
                                    </>
                                  )}
                                </button>
                                <FieldBox
                                  label={label}
                                  value={processedValue}
                                  isCode={isCode}
                                  displayValue={displayValue}
                                  isLink={isLink}
                                  paletteIndex={codePalette}
                                />
                              </div>
                            ) : (
                              <FieldBox
                                label={label}
                                value={processedValue}
                                isCode={isCode}
                                displayValue={displayValue}
                                isLink={isLink}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CodingTab;
