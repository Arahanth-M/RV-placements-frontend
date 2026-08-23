import { useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import {
  shouldShowExperienceTimeline,
  splitExperienceNarrative,
} from "../../utils/splitExperienceNarrative.js";

const PREVIEW_CHARS = 420;

function authorInitial(name) {
  const ch = String(name || "").trim().match(/[a-zA-Z0-9]/);
  return ch ? ch[0].toUpperCase() : "?";
}

function ExpandableBody({ text, className = "" }) {
  const [expanded, setExpanded] = useState(false);
  const value = String(text || "").trim();
  if (!value) return null;

  const needsToggle = value.length > PREVIEW_CHARS;
  const shown =
    !needsToggle || expanded ? value : `${value.slice(0, PREVIEW_CHARS).trim()}…`;

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-theme-secondary sm:text-[15px]">
        {shown}
      </p>
      {needsToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-theme-accent hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

function ExperienceFooter({ isAnonymous, submittedBy }) {
  const name = String(submittedBy?.name || "").trim();
  const showName = !isAnonymous && Boolean(name);

  if (isAnonymous) {
    return (
      <span className="inline-flex items-center rounded-full border border-theme bg-theme-card px-2.5 py-0.5 text-[11px] font-semibold text-theme-muted">
        Anonymous
      </span>
    );
  }

  if (!showName) return null;

  return (
    <span className="inline-flex items-center gap-2 text-xs text-theme-secondary">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-theme-accent/15 text-[11px] font-bold text-theme-accent"
        aria-hidden
      >
        {authorInitial(name)}
      </span>
      <span className="font-medium text-theme-primary">{name}</span>
    </span>
  );
}

/**
 * Display-only story card for interview / internship experience strings.
 */
export function ExperienceStoryCard({
  content,
  isAnonymous = false,
  submittedBy = null,
  adminActions = null,
}) {
  const narrative = useMemo(
    () => splitExperienceNarrative(content),
    [content]
  );
  const useTimeline = shouldShowExperienceTimeline(narrative);
  const showAuthor = isAnonymous || Boolean(String(submittedBy?.name || "").trim());

  return (
    <article className="rounded-2xl border border-theme border-l-4 border-l-theme-accent bg-theme-hero p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-4">
          {narrative.intro ? <ExpandableBody text={narrative.intro} /> : null}

          {useTimeline ? (
            <ol className="space-y-5">
              {narrative.rounds.map((round, index) => (
                <li
                  key={`${round.label}-${index}`}
                  className="border-l-2 border-theme-accent pl-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-theme-accent">
                    {round.label}
                  </p>
                  {round.body ? (
                    <ExpandableBody text={round.body} className="mt-1.5" />
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <>
              {narrative.rounds.map((round, index) => (
                <div key={`${round.label}-${index}`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-theme-accent">
                    {round.label}
                  </p>
                  {round.body ? (
                    <ExpandableBody text={round.body} className="mt-1.5" />
                  ) : null}
                </div>
              ))}
              {!narrative.intro && narrative.rounds.length === 0 ? (
                <ExpandableBody text={content} />
              ) : null}
            </>
          )}
        </div>
        {adminActions ? (
          <div className="flex shrink-0 items-start gap-1">{adminActions}</div>
        ) : null}
      </div>

      {showAuthor ? (
        <div className="mt-4 flex items-center justify-end border-t border-theme pt-3">
          <ExperienceFooter isAnonymous={isAnonymous} submittedBy={submittedBy} />
        </div>
      ) : null}
    </article>
  );
}

export function ExperienceSectionHeader({
  kicker,
  title,
  count,
  addLabel,
  onAdd,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-theme-accent">
            {kicker}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-theme-primary sm:text-xl">{title}</h2>
          {count > 0 ? (
            <span className="rounded-full border border-theme bg-theme-card px-2 py-0.5 text-xs font-semibold tabular-nums text-theme-secondary">
              {count}
            </span>
          ) : null}
        </div>
      </div>
      {count > 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-theme bg-theme-card px-3 py-2 text-xs font-semibold text-theme-primary transition-colors hover:bg-theme-nav sm:w-auto sm:text-sm"
        >
          <FaPlus className="h-3 w-3 text-theme-accent" aria-hidden />
          {addLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ExperienceEmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-theme bg-theme-hero px-4 py-10 text-center">
      <p className="text-sm text-theme-secondary">{message}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <FaPlus className="h-3 w-3" aria-hidden />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ExperienceStoryCard;
