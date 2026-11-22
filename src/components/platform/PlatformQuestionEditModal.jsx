import BrandLogo from "../BrandLogo.jsx";

const LANGUAGE_FIELDS = [
  { id: "cpp", label: "C++ solution" },
  { id: "java", label: "Java solution" },
  { id: "python", label: "Python solution" },
];

const fieldClass =
  "w-full rounded-xl border border-theme bg-theme-input px-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent";

const selectClass =
  "w-full appearance-none rounded-xl border border-theme bg-theme-input px-4 py-3 text-sm text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent [color-scheme:light] dark:[color-scheme:dark]";

/**
 * Platform admin / general editor for a company question: explanation, optional intuition, and language solutions.
 */
export default function PlatformQuestionEditModal({
  title,
  draft,
  onChange,
  onSubmit,
  onCancel,
  saving = false,
  showCodingFields = true,
  showKindSelect = false,
  requireExplanation = true,
  showBrandLogo = false,
  subtitle = "",
}) {
  if (!draft) return null;

  const codingFieldsVisible =
    showCodingFields &&
    (!showKindSelect || String(draft.kind || "").toLowerCase() === "coding");

  const setField = (key, value) => onChange({ ...draft, [key]: value });
  const setSolution = (language, value) =>
    onChange({
      ...draft,
      solutions: { ...draft.solutions, [language]: value },
    });

  const resolvedSubtitle =
    subtitle ||
    (codingFieldsVisible
      ? "Intuition and language solutions are optional — leave blank to fill later or via Enhance."
      : "");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/55 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="my-auto flex max-h-[min(90vh,860px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-theme bg-theme-card shadow-2xl">
        <div className="shrink-0 border-b border-theme bg-theme-card px-5 py-4 sm:px-6">
          {showBrandLogo ? (
            <div className="flex items-center gap-3">
              <div className="h-14 w-52 shrink-0 rounded-lg border border-theme bg-white/95 px-3 py-2 shadow-sm">
                <BrandLogo />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-theme-primary">{title}</h3>
                {resolvedSubtitle ? (
                  <p className="mt-1 text-sm text-theme-secondary">{resolvedSubtitle}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-theme-accent sm:text-xl">{title}</h3>
              {resolvedSubtitle ? (
                <p className="mt-1 text-sm text-theme-secondary">{resolvedSubtitle}</p>
              ) : null}
            </>
          )}
        </div>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            {showKindSelect ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-theme-primary">Question type</span>
                <div className="relative">
                  <select
                    value={draft.kind || "non_coding"}
                    onChange={(e) => setField("kind", e.target.value)}
                    className={selectClass}
                    aria-label="Question type"
                  >
                    <option value="coding">Coding / DSA</option>
                    <option value="non_coding">Theory / non-coding</option>
                    <option value="sql">SQL</option>
                  </select>
                  <span
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-theme-secondary"
                    aria-hidden
                  >
                    ▾
                  </span>
                </div>
              </label>
            ) : null}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-theme-primary">Question</span>
              <textarea
                value={draft.question}
                onChange={(e) => setField("question", e.target.value)}
                className={`${fieldClass} min-h-[100px]`}
                required
                aria-label="Question"
              />
            </label>
            {codingFieldsVisible ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-theme-primary">
                  Intuition <span className="font-normal text-theme-secondary">(optional)</span>
                </span>
                <textarea
                  value={draft.intuition}
                  onChange={(e) => setField("intuition", e.target.value)}
                  className={`${fieldClass} min-h-[90px]`}
                  aria-label="Intuition"
                  placeholder="Short approach insight"
                />
              </label>
            ) : null}
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-theme-primary">
                Explanation
                {!requireExplanation ? (
                  <span className="font-normal text-theme-secondary"> (optional)</span>
                ) : null}
              </span>
              <textarea
                value={draft.explanation}
                onChange={(e) => setField("explanation", e.target.value)}
                className={`${fieldClass} min-h-[120px]`}
                aria-label="Explanation"
                required={requireExplanation}
              />
            </label>
            {codingFieldsVisible
              ? LANGUAGE_FIELDS.map((field) => (
                  <label key={field.id} className="block space-y-1.5">
                    <span className="text-sm font-medium text-theme-primary">
                      {field.label}{" "}
                      <span className="font-normal text-theme-secondary">(optional)</span>
                    </span>
                    <textarea
                      value={draft.solutions[field.id]}
                      onChange={(e) => setSolution(field.id, e.target.value)}
                      className={`${fieldClass} min-h-[140px] font-mono`}
                      aria-label={field.label}
                      spellCheck={false}
                      placeholder={`${field.label} — optional`}
                    />
                  </label>
                ))
              : null}
          </div>
          <div className="flex shrink-0 justify-end gap-3 border-t border-theme bg-theme-card px-5 py-4 sm:px-6">
            <button
              type="button"
              className="rounded-lg border border-theme px-5 py-2.5 text-sm font-medium text-theme-secondary transition-colors hover:bg-theme-nav"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
