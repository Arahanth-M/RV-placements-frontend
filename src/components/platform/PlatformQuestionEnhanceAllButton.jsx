import {
  getEnhanceCategoryProgress,
  isEnhanceCategoryComplete,
} from "../../utils/platformEnhanceCompletion.js";

export const PLATFORM_ENHANCE_ALL_FIELDS = Object.freeze([
  "question",
  "intuition",
  "explanation",
  "cpp",
  "java",
  "python",
]);

/** Intuition + language refills only apply to coding/DSA questions. */
export const PLATFORM_CODING_ONLY_ENHANCE_FIELDS = Object.freeze([
  "intuition",
  "cpp",
  "java",
  "python",
]);

export function isCodingOnlyEnhanceField(field) {
  return PLATFORM_CODING_ONLY_ENHANCE_FIELDS.includes(field);
}

export function isCodingQuestionKind(kind) {
  return String(kind || "").trim() === "coding";
}

const FIELD_LABELS = Object.freeze({
  question: "question",
  intuition: "intuition",
  explanation: "explanation",
  cpp: "C++",
  java: "Java",
  python: "Python",
});

const COMPANY_FIELD_ACTIONS = Object.freeze([
  { field: "question", label: "Questions", fullLabel: "Enhance all questions" },
  { field: "intuition", label: "Intuitions", fullLabel: "Enhance all intuitions" },
  { field: "explanation", label: "Explanations", fullLabel: "Enhance all explanations" },
  { field: "cpp", label: "C++", fullLabel: "Enhance all C++ solutions" },
  { field: "java", label: "Java", fullLabel: "Enhance all Java solutions" },
  { field: "python", label: "Python", fullLabel: "Enhance all Python solutions" },
]);

/**
 * Platform-admin company-level enhance strip:
 * sits below role tabs and above the questions card.
 */
function DoneTick({ onAccent = false }) {
  return (
    <span
      className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ${
        onAccent ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-600"
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function PartialCount({ passed, remaining, onAccent = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold normal-case tracking-normal ${
        onAccent ? "text-white/95" : "text-amber-700"
      }`}
    >
      <span>{passed}✓</span>
      <span className={onAccent ? "text-white/70" : "text-theme-secondary"}>·</span>
      <span>{remaining} left</span>
    </span>
  );
}

function categoryStatus(entry) {
  const progress = getEnhanceCategoryProgress(entry);
  if (!progress) {
    return { kind: "idle", progress: null };
  }
  if (isEnhanceCategoryComplete(progress)) {
    return { kind: "done", progress };
  }
  if (progress.remaining > 0) {
    return { kind: "partial", progress };
  }
  return { kind: "idle", progress };
}

export default function PlatformQuestionEnhanceAllButton({
  busy = false,
  busyField = null,
  progress = null,
  disabled = false,
  onEnhanceField,
  onEnhanceEverything,
  questionCount = 0,
  completedFields = null,
}) {
  if (questionCount < 1) return null;
  if (typeof onEnhanceField !== "function" && typeof onEnhanceEverything !== "function") {
    return null;
  }

  const done = completedFields && typeof completedFields === "object" ? completedFields : {};
  const hasStatus = Object.keys(done).length > 0;

  const progressLabel =
    busy && progress
      ? `Enhancing ${progress.question}/${progress.totalQuestions} · ${
          FIELD_LABELS[progress.field] || progress.field
        }…`
      : null;

  return (
    <section
      className="bg-theme-card border border-theme rounded-xl px-3 py-3 sm:px-4 sm:py-3.5 shadow-[var(--shadow-soft)]"
      onClick={(e) => e.stopPropagation()}
      aria-label="Company-wide enhance actions"
    >
      <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-3">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-theme-accent tracking-wide uppercase">
            Enhance company content
          </h3>
          <p className="text-[10px] sm:text-xs text-theme-secondary mt-0.5 truncate">
            Apply to all {questionCount} question{questionCount === 1 ? "" : "s"}
            {hasStatus ? " · ✓ = done · N left = still failing" : ""}
          </p>
        </div>
        {progressLabel ? (
          <p className="text-[10px] sm:text-xs text-theme-accent shrink-0 text-right max-w-[50%]">
            {progressLabel}
          </p>
        ) : null}
      </div>

      <div
        className="-mx-1 px-1 overflow-x-auto overscroll-x-contain scrollbar-thin"
        role="group"
        aria-label="Enhance all questions for this company"
      >
        <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 min-w-min pb-0.5">
          {typeof onEnhanceField === "function"
            ? COMPANY_FIELD_ACTIONS.map(({ field, label, fullLabel }) => {
                const isBusy = busy && busyField === field;
                const status = categoryStatus(done[field]);
                const isDone = status.kind === "done";
                const isPartial = status.kind === "partial";
                return (
                  <button
                    key={field}
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => onEnhanceField(field)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      isBusy
                        ? "border-theme-accent bg-theme-accent/15 text-theme-accent"
                        : isDone
                          ? "border-emerald-500/40 bg-emerald-500/10 text-theme-primary hover:bg-emerald-500/15 hover:border-emerald-500/60"
                          : isPartial
                            ? "border-amber-500/50 bg-amber-500/10 text-theme-primary hover:bg-amber-500/15 hover:border-amber-500/70"
                            : "border-theme bg-theme-input text-theme-primary hover:bg-theme-nav hover:border-theme-accent hover:text-theme-accent"
                    }`}
                    title={
                      isDone
                        ? `${fullLabel} completed for this company`
                        : isPartial
                          ? `${fullLabel}: ${status.progress.passed} passed, ${status.progress.remaining} remaining`
                          : `${fullLabel} for this company`
                    }
                    aria-label={
                      isDone
                        ? `${fullLabel} (completed)`
                        : isPartial
                          ? `${fullLabel} (${status.progress.passed} passed, ${status.progress.remaining} remaining)`
                          : fullLabel
                    }
                  >
                    {isBusy ? "Working…" : label}
                    {!isBusy && isDone ? <DoneTick /> : null}
                    {!isBusy && isPartial ? (
                      <PartialCount
                        passed={status.progress.passed}
                        remaining={status.progress.remaining}
                      />
                    ) : null}
                  </button>
                );
              })
            : null}
          {typeof onEnhanceEverything === "function"
            ? (() => {
                const isBusy = busy && busyField === "all";
                const status = categoryStatus(done.all);
                const isDone = status.kind === "done";
                const isPartial = status.kind === "partial";
                return (
                  <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={onEnhanceEverything}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      isBusy
                        ? "border-theme-accent bg-theme-accent/15 text-theme-accent"
                        : isDone
                          ? "border-emerald-600 bg-emerald-600 text-white hover:opacity-90"
                          : isPartial
                            ? "border-amber-600 bg-amber-600 text-white hover:opacity-90"
                            : "border-theme-accent bg-theme-accent text-white hover:opacity-90"
                    }`}
                    title={
                      isDone
                        ? "Everything completed for this company"
                        : isPartial
                          ? `Everything: ${status.progress.passed} passed, ${status.progress.remaining} remaining`
                          : "Enhance question, intuition, explanation, and refill C++/Java/Python for every question in this company"
                    }
                    aria-label={
                      isDone
                        ? "Enhance everything (completed)"
                        : isPartial
                          ? `Enhance everything (${status.progress.passed} passed, ${status.progress.remaining} remaining)`
                          : "Enhance everything"
                    }
                  >
                    {isBusy ? "Working…" : "Everything"}
                    {!isBusy && isDone ? <DoneTick onAccent /> : null}
                    {!isBusy && isPartial ? (
                      <PartialCount
                        passed={status.progress.passed}
                        remaining={status.progress.remaining}
                        onAccent
                      />
                    ) : null}
                  </button>
                );
              })()
            : null}
        </div>
      </div>
    </section>
  );
}

const ENHANCE_ALL_CONCURRENCY = 3;

async function runWithConcurrency(items, concurrency, worker) {
  const list = Array.isArray(items) ? items : [];
  if (list.length < 1) return;
  const limit = Math.max(1, Math.min(Number(concurrency) || 1, list.length));
  let cursor = 0;
  async function runWorker() {
    while (cursor < list.length) {
      const current = cursor;
      cursor += 1;
      await worker(list[current], current);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => runWorker()));
}

/**
 * Run the existing per-field enhance API across every question index.
 * Continues after individual failures so one bad field does not abort the run.
 * Runs up to ENHANCE_ALL_CONCURRENCY question jobs in parallel per field.
 * Optional shouldEnhance(index, field) skips coding-only fields on non-coding items.
 */
export async function runEnhanceEverythingForCompany({
  indexes,
  fields = PLATFORM_ENHANCE_ALL_FIELDS,
  enhanceOne,
  onProgress,
  shouldEnhance,
  concurrency = ENHANCE_ALL_CONCURRENCY,
}) {
  const list = Array.isArray(indexes) ? indexes : [];
  const fieldList =
    Array.isArray(fields) && fields.length > 0 ? fields : PLATFORM_ENHANCE_ALL_FIELDS;
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  let attempted = 0;
  let completedQuestions = 0;
  /** @type {Record<string, { attempted: number, successCount: number, failureCount: number, skippedCount: number, failedIndexes: number[] }>} */
  const fieldStats = {};
  for (const field of fieldList) {
    fieldStats[field] = {
      attempted: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      failedIndexes: [],
    };
  }

  for (const field of fieldList) {
    const stats = fieldStats[field];
    const jobs = [];
    for (let qi = 0; qi < list.length; qi += 1) {
      const index = list[qi];
      if (typeof shouldEnhance === "function" && !shouldEnhance(index, field)) {
        skippedCount += 1;
        stats.skippedCount += 1;
        continue;
      }
      jobs.push({ index, qi });
    }

    await runWithConcurrency(jobs, concurrency, async ({ index, qi }) => {
      attempted += 1;
      stats.attempted += 1;
      if (typeof onProgress === "function") {
        onProgress({
          question: Math.min(completedQuestions + 1, list.length),
          totalQuestions: list.length,
          index,
          field,
        });
      }
      try {
        const out = await enhanceOne(index, field);
        if (out?.skipped || out?.data?.skipped) {
          skippedCount += 1;
          stats.skippedCount += 1;
        } else {
          successCount += 1;
          stats.successCount += 1;
        }
      } catch (error) {
        console.error(
          `[enhance-all] question ${index} field ${field}:`,
          error?.response?.data || error?.message || error
        );
        failureCount += 1;
        stats.failureCount += 1;
        stats.failedIndexes.push(index);
      } finally {
        completedQuestions += 1;
      }
    });
  }

  return {
    questionCount: list.length,
    attempted,
    successCount,
    failureCount,
    skippedCount,
    fieldStats,
  };
}
