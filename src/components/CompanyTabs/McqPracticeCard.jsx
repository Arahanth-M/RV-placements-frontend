import { useMemo, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

function normalizeAnswerKey(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  const letter = text.match(/^[A-Da-d]\b/)?.[0];
  if (letter) return letter.toUpperCase();
  return text.toUpperCase();
}

function buildOptions(question) {
  if (Array.isArray(question?.mcqMetadata?.options) && question.mcqMetadata.options.length > 0) {
    return question.mcqMetadata.options
      .map((opt) => ({
        label: String(opt?.id || "").trim().toUpperCase(),
        value: String(opt?.text || "").trim(),
      }))
      .filter((opt) => opt.label && opt.value);
  }
  return [
    { label: "A", value: String(question?.optionA || "").trim() },
    { label: "B", value: String(question?.optionB || "").trim() },
    { label: "C", value: String(question?.optionC || "").trim() },
    { label: "D", value: String(question?.optionD || "").trim() },
  ].filter((opt) => opt.value);
}

/**
 * Interactive MCQ: select an option, verify, see correct/incorrect feedback.
 */
export default function McqPracticeCard({ question, displayNumber, testIdIndex = 0 }) {
  const options = useMemo(() => buildOptions(question), [question]);
  const correctKey = useMemo(() => normalizeAnswerKey(question?.answer), [question?.answer]);
  const hasAnswer = Boolean(correctKey) || Boolean(String(question?.explanation || "").trim());

  const [selected, setSelected] = useState(null);
  const [verified, setVerified] = useState(false);

  const isCorrect = verified && selected && correctKey && selected === correctKey;

  const optionClass = (label) => {
    const base =
      "flex w-full items-start gap-2 sm:gap-3 rounded-lg border p-2.5 sm:p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 disabled:cursor-default";
    if (!verified) {
      if (selected === label) {
        return `${base} border-indigo-500 bg-indigo-50 text-theme-primary ring-1 ring-indigo-400/50 dark:border-indigo-400 dark:bg-indigo-500/15 dark:ring-indigo-400/40`;
      }
      return `${base} border-theme bg-theme-input text-theme-secondary hover:border-indigo-400/60 hover:bg-indigo-50/70 dark:hover:bg-slate-800/80`;
    }
    if (correctKey && label === correctKey) {
      return `${base} border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400/70 dark:bg-emerald-500/15 dark:text-emerald-100`;
    }
    if (selected === label && label !== correctKey) {
      return `${base} border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-400/70 dark:bg-rose-500/15 dark:text-rose-100`;
    }
    return `${base} border-theme bg-theme-card text-theme-muted opacity-80`;
  };

  const labelClass = (label) => {
    if (verified && correctKey && label === correctKey) {
      return "text-emerald-700 dark:text-emerald-300";
    }
    if (verified && selected === label) {
      return "text-rose-700 dark:text-rose-300";
    }
    if (selected === label) {
      return "text-indigo-600 dark:text-indigo-300";
    }
    return "text-theme-accent";
  };

  const handleSelect = (label) => {
    if (verified) return;
    setSelected(label);
  };

  const handleVerify = () => {
    if (!selected || !correctKey) return;
    setVerified(true);
  };

  const handleTryAgain = () => {
    setSelected(null);
    setVerified(false);
  };

  return (
    <div
      className="rounded-lg border border-theme bg-theme-card p-4 sm:p-5 transition-colors hover:border-indigo-300/70 dark:hover:border-slate-600"
      data-testid={`mcq-question-${testIdIndex}`}
    >
      <div className="mb-3 flex gap-2.5 sm:mb-4 sm:gap-3">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-indigo-300 bg-indigo-100 text-xs font-bold text-indigo-700 sm:text-sm dark:border-indigo-500/50 dark:bg-indigo-900/50 dark:text-indigo-200">
          {displayNumber}
        </span>
        <p className="min-w-0 text-sm font-medium leading-relaxed text-theme-primary sm:text-lg sm:leading-snug">
          {question?.question}
        </p>
      </div>

      <div
        className="ml-0 grid grid-cols-1 gap-2.5 sm:ml-10 sm:grid-cols-2 sm:gap-3"
        role="radiogroup"
        aria-label={`Question ${displayNumber} options`}
      >
        {options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={selected === opt.label}
            disabled={verified}
            onClick={() => handleSelect(opt.label)}
            className={optionClass(opt.label)}
          >
            <span className={`shrink-0 font-bold ${labelClass(opt.label)}`}>{opt.label}.</span>
            <span className="min-w-0 text-xs leading-relaxed text-inherit sm:text-sm">{opt.value}</span>
            {verified && correctKey && opt.label === correctKey ? (
              <FaCheck
                className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300"
                aria-hidden
              />
            ) : null}
            {verified && selected === opt.label && opt.label !== correctKey ? (
              <FaTimes
                className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-300"
                aria-hidden
              />
            ) : null}
          </button>
        ))}
      </div>

      {hasAnswer ? (
        <div className="ml-0 mt-3 space-y-3 sm:ml-10 sm:mt-4">
          {!verified ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleVerify}
                disabled={!selected || !correctKey}
                className="inline-flex items-center justify-center rounded-lg bg-theme-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:border disabled:border-theme disabled:bg-theme-input disabled:text-theme-muted disabled:opacity-100"
              >
                Verify answer
              </button>
              {!selected ? (
                <span className="text-xs text-theme-muted">Select an option to check</span>
              ) : null}
            </div>
          ) : (
            <>
              <div
                className={`inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-full border px-3 py-1.5 ${
                  isCorrect
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
                }`}
                data-testid={`mcq-answer-${testIdIndex}`}
                role="status"
              >
                {isCorrect ? (
                  <FaCheck className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <FaTimes className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="text-xs font-semibold leading-snug tracking-wide sm:text-sm">
                  {isCorrect
                    ? "Correct!"
                    : correctKey
                      ? `Incorrect — correct answer is ${correctKey}`
                      : "Checked"}
                </span>
              </div>

              {question?.explanation ? (
                <p className="whitespace-pre-wrap rounded-lg border border-theme bg-theme-input px-3 py-2.5 text-sm leading-relaxed text-theme-secondary">
                  {question.explanation}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleTryAgain}
                className="text-xs font-medium text-theme-accent underline-offset-2 hover:underline sm:text-sm"
              >
                Try again
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
