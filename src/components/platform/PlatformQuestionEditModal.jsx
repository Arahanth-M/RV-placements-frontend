const LANGUAGE_FIELDS = [
  { id: "cpp", label: "C++ solution" },
  { id: "java", label: "Java solution" },
  { id: "python", label: "Python solution" },
];

const fieldClass =
  "w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

/**
 * Platform admin editor for a company question: explanation, intuition, and each language.
 */
export default function PlatformQuestionEditModal({
  title,
  draft,
  onChange,
  onSubmit,
  onCancel,
  saving = false,
}) {
  if (!draft) return null;

  const setField = (key, value) => onChange({ ...draft, [key]: value });
  const setSolution = (language, value) =>
    onChange({
      ...draft,
      solutions: { ...draft.solutions, [language]: value },
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="flex max-h-[min(90vh,860px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 px-5 py-4">
          <h3 className="text-lg font-semibold text-amber-400">{title}</h3>
        </div>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Question</span>
              <textarea
                value={draft.question}
                onChange={(e) => setField("question", e.target.value)}
                className={`${fieldClass} min-h-[100px]`}
                required
                aria-label="Question"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Intuition</span>
              <textarea
                value={draft.intuition}
                onChange={(e) => setField("intuition", e.target.value)}
                className={`${fieldClass} min-h-[90px]`}
                aria-label="Intuition"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Explanation</span>
              <textarea
                value={draft.explanation}
                onChange={(e) => setField("explanation", e.target.value)}
                className={`${fieldClass} min-h-[120px]`}
                aria-label="Explanation"
              />
            </label>
            {LANGUAGE_FIELDS.map((field) => (
              <label key={field.id} className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-200">{field.label}</span>
                <textarea
                  value={draft.solutions[field.id]}
                  onChange={(e) => setSolution(field.id, e.target.value)}
                  className={`${fieldClass} min-h-[140px] font-mono`}
                  aria-label={field.label}
                  spellCheck={false}
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-700 px-5 py-4">
            <button
              type="button"
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 transition-colors hover:bg-slate-700"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
