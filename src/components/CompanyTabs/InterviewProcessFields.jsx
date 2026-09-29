import { FaPlus, FaTrash } from "react-icons/fa";

const fieldClass =
  "w-full rounded-xl border border-theme bg-theme-input px-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent";

export function blankInterviewRound() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    details: "",
  };
}

export default function InterviewProcessFields({
  overview,
  onOverviewChange,
  rounds,
  onRoundsChange,
  error = "",
}) {
  const updateRound = (id, patch) => {
    onRoundsChange(rounds.map((round) => (round.id === id ? { ...round, ...patch } : round)));
  };

  const removeRound = (id) => {
    if (rounds.length <= 1) return;
    onRoundsChange(rounds.filter((round) => round.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-theme-primary" htmlFor="interview-process-overview">
          Overview
          <span className="ml-2 text-xs font-normal text-theme-muted">Optional</span>
        </label>
        <textarea
          id="interview-process-overview"
          value={overview}
          onChange={(event) => onOverviewChange(event.target.value)}
          placeholder="Campus visit, eligibility, online assessment, and how many people moved ahead."
          className={`${fieldClass} min-h-[96px]`}
        />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-theme-primary">Rounds</p>
          <p className="mt-1 text-xs text-theme-muted">
            Add each round in order. Include what was asked, how long it took, and the result.
          </p>
        </div>

        <ol className="space-y-3">
          {rounds.map((round, index) => (
            <li key={round.id} className="rounded-xl border border-theme bg-theme-hero p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-theme-muted">
                  Round {index + 1}
                </p>
                {rounds.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRound(round.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-theme-nav"
                  >
                    <FaTrash className="h-3 w-3" aria-hidden />
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-theme-secondary" htmlFor={`round-title-${round.id}`}>
                    Round name
                  </label>
                  <input
                    id={`round-title-${round.id}`}
                    value={round.title}
                    onChange={(event) => updateRound(round.id, { title: event.target.value })}
                    placeholder="Technical interview (1–1.5 hrs)"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-theme-secondary" htmlFor={`round-details-${round.id}`}>
                    What happened
                  </label>
                  <textarea
                    id={`round-details-${round.id}`}
                    value={round.details}
                    onChange={(event) => updateRound(round.id, { details: event.target.value })}
                    placeholder="Topics, questions, and how the round ended."
                    className={`${fieldClass} min-h-[96px]`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => onRoundsChange([...rounds, blankInterviewRound()])}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-theme bg-theme-card px-4 py-2.5 text-sm font-semibold text-theme-primary transition-colors hover:bg-theme-nav"
        >
          <FaPlus className="h-3 w-3 text-theme-accent" aria-hidden />
          Add round
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
