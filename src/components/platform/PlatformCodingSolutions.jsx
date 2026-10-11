import PlatformAdminCodeBlock from "./PlatformAdminCodeBlock.jsx";

const LANG_ROWS = [
  ["C++", "cpp"],
  ["Java", "java"],
  ["Python", "python"],
];

/**
 * Stacked C++ / Java / Python blocks (platform admin research review).
 */
export default function PlatformCodingSolutions({
  solutions,
  showAllLanguages = false,
  onRegenerate,
  regeneratingLanguages,
  disabled = false,
  questionLabel = "",
}) {
  if (!solutions || typeof solutions !== "object") {
    if (!showAllLanguages) return null;
  }
  const source = solutions && typeof solutions === "object" ? solutions : {};
  const rows = showAllLanguages
    ? LANG_ROWS
    : LANG_ROWS.filter(([, key]) => String(source[key] || "").trim());
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-theme-secondary">Solutions</p>
      {rows.map(([label, key]) => {
        const regenerating = Boolean(regeneratingLanguages?.has(key));
        const code = String(source[key] || "");
        return (
          <div key={key} className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-theme-primary">{label}</p>
              {typeof onRegenerate === "function" ? (
                <button
                  type="button"
                  disabled={disabled || regenerating}
                  onClick={() => onRegenerate(key)}
                  aria-label={
                    questionLabel ? `Regenerate ${label} for ${questionLabel}` : `Regenerate ${label}`
                  }
                  className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary disabled:opacity-60"
                >
                  {regenerating ? "Regenerating…" : `Regenerate ${label}`}
                </button>
              ) : null}
            </div>
            {code.trim() ? (
              <PlatformAdminCodeBlock code={code} language={key} />
            ) : (
              <p className="text-xs text-theme-secondary">No {label} solution yet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
