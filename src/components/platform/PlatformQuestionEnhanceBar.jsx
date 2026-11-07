import { isCodingOnlyEnhanceField } from "./PlatformQuestionEnhanceAllButton.jsx";

const ACTIONS = [
  { field: "question", label: "Enhance question" },
  { field: "intuition", label: "Enhance intuition" },
  { field: "explanation", label: "Enhance explanation" },
  { field: "cpp", label: "Refill C++" },
  { field: "java", label: "Refill Java" },
  { field: "python", label: "Refill Python" },
];

/**
 * Platform-admin only controls to rewrite one OA/interview question field via LLM.
 * Coding-only actions (intuition + languages) hide for explanation-only questions.
 */
export default function PlatformQuestionEnhanceBar({
  busyField = null,
  disabled = false,
  onEnhance,
  isCoding = true,
}) {
  if (typeof onEnhance !== "function") return null;

  const actions = ACTIONS.filter(
    ({ field }) => isCoding || !isCodingOnlyEnhanceField(field)
  );
  if (actions.length < 1) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5 sm:gap-2"
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="Enhance or refill question content"
    >
      {actions.map(({ field, label }) => {
        const isBusy = busyField === field;
        return (
          <button
            key={field}
            type="button"
            disabled={disabled || Boolean(busyField)}
            onClick={() => onEnhance(field)}
            className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:text-[11px] ${
              isBusy
                ? "border-violet-400/60 bg-violet-500/20 text-violet-200"
                : "border-slate-600 bg-slate-900/70 text-slate-200 hover:border-violet-400/50 hover:bg-slate-800 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
            }`}
            title={label}
          >
            {isBusy ? "Working…" : label}
          </button>
        );
      })}
    </div>
  );
}
