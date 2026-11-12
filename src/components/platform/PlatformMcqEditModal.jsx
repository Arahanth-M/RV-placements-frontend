const OPTION_IDS = ["A", "B", "C", "D"];

const fieldClass =
  "w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";

/**
 * Platform admin editor for company MCQ questions (options + correct answer + solution).
 */
export default function PlatformMcqEditModal({
  title,
  draft,
  onChange,
  onSubmit,
  onCancel,
  saving = false,
}) {
  if (!draft) return null;

  const setField = (key, value) => onChange({ ...draft, [key]: value });
  const setOption = (id, value) =>
    onChange({
      ...draft,
      options: { ...draft.options, [id]: value },
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="flex max-h-[min(90vh,860px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 px-5 py-4">
          <h3 className="text-lg font-semibold text-amber-400">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Add the stem, at least two options, the correct choice, and an optional solution.
          </p>
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
                aria-label="MCQ question"
              />
            </label>

            <div className="space-y-3">
              <span className="text-sm font-medium text-slate-200">Options</span>
              {OPTION_IDS.map((id) => (
                <label key={id} className="flex items-start gap-3">
                  <span className="mt-3 w-6 shrink-0 text-sm font-semibold text-amber-300">{id}.</span>
                  <textarea
                    value={draft.options?.[id] || ""}
                    onChange={(e) => setOption(id, e.target.value)}
                    className={`${fieldClass} min-h-[56px]`}
                    aria-label={`Option ${id}`}
                    placeholder={id === "A" || id === "B" ? `Option ${id} (required)` : `Option ${id} (optional)`}
                    required={id === "A" || id === "B"}
                  />
                </label>
              ))}
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Correct answer</span>
              <select
                value={draft.correctOptionId || ""}
                onChange={(e) => setField("correctOptionId", e.target.value)}
                className={fieldClass}
                required
                aria-label="Correct option"
              >
                <option value="" disabled>
                  Select correct option
                </option>
                {OPTION_IDS.filter((id) => String(draft.options?.[id] || "").trim()).map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">
                Solution / explanation{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <textarea
                value={draft.explanation}
                onChange={(e) => setField("explanation", e.target.value)}
                className={`${fieldClass} min-h-[120px]`}
                aria-label="MCQ solution"
                placeholder="Why the correct option is right"
              />
            </label>
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

export function platformMcqEditDraft({
  question = "",
  optionA = "",
  optionB = "",
  optionC = "",
  optionD = "",
  answer = "",
  explanation = "",
  mcqMetadata = null,
} = {}) {
  const meta = mcqMetadata && typeof mcqMetadata === "object" ? mcqMetadata : null;
  const options = Array.isArray(meta?.options) ? meta.options : [];
  const byId = Object.fromEntries(
    options.map((opt) => [String(opt?.id || "").toUpperCase(), String(opt?.text || "")])
  );
  return {
    question: String(question ?? ""),
    options: {
      A: String(optionA || byId.A || ""),
      B: String(optionB || byId.B || ""),
      C: String(optionC || byId.C || ""),
      D: String(optionD || byId.D || ""),
    },
    correctOptionId: String(meta?.correctOptionId || answer || "").toUpperCase(),
    explanation: String(explanation || meta?.explanation || ""),
  };
}

export function platformMcqEditPayload(draft) {
  const options = ["A", "B", "C", "D"]
    .map((id) => ({
      id,
      text: String(draft?.options?.[id] ?? "").trim(),
    }))
    .filter((opt) => opt.text);
  return {
    question: String(draft?.question ?? "").trim(),
    options,
    correctOptionId: String(draft?.correctOptionId || "").trim().toUpperCase(),
    explanation: String(draft?.explanation ?? ""),
  };
}
