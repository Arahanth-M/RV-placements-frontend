import { useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import {
  plainExperienceText,
  splitExperienceNarrative,
} from "../../utils/splitExperienceNarrative.js";

const PREVIEW_CHARS = 420;

function authorInitial(name) {
  const ch = String(name || "").trim().match(/[a-zA-Z0-9]/);
  return ch ? ch[0].toUpperCase() : "?";
}

function proseParagraphs(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

function ExpandableBody({ text, className = "", forceExpanded = false, showFull = false }) {
  const [expanded, setExpanded] = useState(forceExpanded);
  const value = String(text || "").trim();
  if (!value) return null;

  const needsToggle = !showFull && value.length > PREVIEW_CHARS;
  const shown =
    !needsToggle || expanded || forceExpanded ? value : `${value.slice(0, PREVIEW_CHARS).trim()}…`;
  const paragraphs = proseParagraphs(shown);

  return (
    <div className={className}>
      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="break-words text-sm leading-7 text-theme-secondary"
          >
            {paragraph}
          </p>
        ))}
      </div>
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

function roundNumber(label, index) {
  const match = String(label || "").match(/(\d+)/);
  const value = match ? Number(match[1]) : index + 1;
  return String(value).padStart(2, "0");
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
  highlighted = false,
  forceExpanded = false,
  showFull = false,
}) {
  const narrative = useMemo(
    () => splitExperienceNarrative(content),
    [content]
  );
  const showAuthor = isAnonymous || Boolean(String(submittedBy?.name || "").trim());

  const rounds = narrative.rounds;

  return (
    <article
      className={`overflow-hidden rounded-xl border border-theme bg-theme-hero ${
        highlighted ? "ring-2 ring-theme-accent" : ""
      }`}
    >
      {narrative.intro || adminActions ? (
        <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <div className="min-w-0 flex-1">
            {narrative.intro ? (
              <ExpandableBody text={narrative.intro} forceExpanded={forceExpanded} showFull={showFull} />
            ) : null}
          </div>
          {adminActions ? (
            <div className="flex shrink-0 items-start gap-1">{adminActions}</div>
          ) : null}
        </div>
      ) : null}

      {rounds.length > 0 ? (
        <ol className={narrative.intro || adminActions ? "border-t border-theme" : ""}>
          {rounds.map((round, index) => (
            <li
              key={`${round.label}-${index}`}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-t border-theme px-4 py-4 first:border-t-0 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:py-5"
            >
              <span className="mt-0.5 text-xs font-semibold tabular-nums tracking-wide text-theme-muted">
                {roundNumber(round.label, index)}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted">
                  {round.label}
                </p>
                {round.subtitle ? (
                  <p className="mt-1 text-sm font-semibold leading-6 text-theme-primary">
                    {round.subtitle}
                  </p>
                ) : null}
                {round.body ? (
                  <ExpandableBody
                    text={round.body}
                    className={round.subtitle ? "mt-2" : "mt-1.5"}
                    forceExpanded={forceExpanded}
                    showFull={showFull}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : !narrative.intro ? (
        <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <ExpandableBody
            text={plainExperienceText(content)}
            forceExpanded={forceExpanded}
            showFull={showFull}
          />
          {adminActions ? (
            <div className="flex shrink-0 items-start gap-1">{adminActions}</div>
          ) : null}
        </div>
      ) : null}

      {showAuthor ? (
        <div className="flex items-center justify-end border-t border-theme px-4 py-3 sm:px-5">
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
