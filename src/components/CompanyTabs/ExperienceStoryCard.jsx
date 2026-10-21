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

function ExpandableBody({
  text,
  className = "",
  forceExpanded = false,
  showFull = false,
  variant = "theme",
}) {
  const [expanded, setExpanded] = useState(forceExpanded);
  const value = String(text || "").trim();
  if (!value) return null;

  const isDark = variant === "dark";
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
            className={`break-words text-sm leading-relaxed sm:text-[15px] sm:leading-7 ${
              isDark ? "text-slate-300" : "text-theme-secondary"
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>
      {needsToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`mt-2 text-xs font-semibold hover:underline ${
            isDark ? "text-indigo-400" : "text-theme-accent"
          }`}
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

function ExperienceFooter({ isAnonymous, submittedBy, variant = "theme" }) {
  const name = String(submittedBy?.name || "").trim();
  const showName = !isAnonymous && Boolean(name);
  const isDark = variant === "dark";

  if (isAnonymous) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
          isDark
            ? "border-slate-600 bg-slate-800/80 text-slate-400"
            : "border-theme bg-theme-card text-theme-muted"
        }`}
      >
        Anonymous
      </span>
    );
  }

  if (!showName) return null;

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs ${
        isDark ? "text-slate-400" : "text-theme-secondary"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
          isDark
            ? "bg-indigo-500/20 text-indigo-300"
            : "bg-theme-accent/15 text-theme-accent"
        }`}
        aria-hidden
      >
        {authorInitial(name)}
      </span>
      <span className={`font-medium ${isDark ? "text-slate-200" : "text-theme-primary"}`}>
        {name}
      </span>
    </span>
  );
}

function InterviewExperienceCard({
  narrative,
  content,
  adminActions,
  highlighted,
  forceExpanded,
  showFull,
}) {
  const rounds = narrative.rounds;

  return (
    <article
      className={`relative min-w-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/60 p-4 sm:p-5 ${
        highlighted ? "ring-2 ring-indigo-500/80" : ""
      }`}
    >
      {adminActions ? (
        <div className="absolute right-2 top-2 flex shrink-0 items-start gap-0.5 sm:right-3 sm:top-3">
          {adminActions}
        </div>
      ) : null}

      <div className={`min-w-0 space-y-6 ${adminActions ? "pr-12 sm:pr-14" : ""}`}>
        {narrative.intro ? (
          <ExpandableBody
            text={narrative.intro}
            forceExpanded={forceExpanded}
            showFull={showFull}
            variant="dark"
          />
        ) : null}

        {rounds.length > 0 ? (
          <ol className="m-0 list-none space-y-6 p-0">
            {rounds.map((round, index) => (
              <li
                key={`${round.label}-${index}`}
                className="border-l-2 border-indigo-400/90 pl-4 sm:pl-5"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-400">
                  {round.label}
                </p>
                {round.subtitle ? (
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-200">
                    {round.subtitle}
                  </p>
                ) : null}
                {round.body ? (
                  <ExpandableBody
                    text={round.body}
                    className={round.subtitle ? "mt-2" : "mt-1.5"}
                    forceExpanded={forceExpanded}
                    showFull={showFull}
                    variant="dark"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        ) : !narrative.intro ? (
          <div className="border-l-2 border-indigo-400/90 pl-4 sm:pl-5">
            <ExpandableBody
              text={plainExperienceText(content)}
              forceExpanded={forceExpanded}
              showFull={showFull}
              variant="dark"
            />
          </div>
        ) : null}
      </div>
    </article>
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
  variant = "theme",
  /** When false, hides contributor name and anonymous badge (interview experiences). */
  showContributor = true,
}) {
  const narrative = useMemo(
    () => splitExperienceNarrative(content),
    [content]
  );
  const isDark = variant === "dark";

  if (isDark) {
    return (
      <InterviewExperienceCard
        narrative={narrative}
        content={content}
        adminActions={adminActions}
        highlighted={highlighted}
        forceExpanded={forceExpanded}
        showFull={showFull}
      />
    );
  }

  const showAuthor =
    showContributor &&
    (isAnonymous || Boolean(String(submittedBy?.name || "").trim()));

  const rounds = narrative.rounds;

  const articleClass = `overflow-hidden rounded-xl border border-theme bg-theme-hero ${
    highlighted ? "ring-2 ring-theme-accent" : ""
  }`;

  const dividerClass = "border-theme";
  const roundIndexClass =
    "mt-0.5 text-xs font-semibold tabular-nums tracking-wide text-theme-muted";
  const roundLabelClass =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted";
  const roundSubtitleClass = "mt-1 text-sm font-semibold leading-6 text-theme-primary";

  return (
    <article className={articleClass}>
      {narrative.intro || adminActions ? (
        <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <div className="min-w-0 flex-1">
            {narrative.intro ? (
              <ExpandableBody
                text={narrative.intro}
                forceExpanded={forceExpanded}
                showFull={showFull}
                variant={variant}
              />
            ) : null}
          </div>
          {adminActions ? (
            <div className="flex shrink-0 items-start gap-1">{adminActions}</div>
          ) : null}
        </div>
      ) : null}

      {rounds.length > 0 ? (
        <ol className={narrative.intro || adminActions ? `border-t ${dividerClass}` : ""}>
          {rounds.map((round, index) => (
            <li
              key={`${round.label}-${index}`}
              className={`grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-t ${dividerClass} px-4 py-4 first:border-t-0 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:py-5`}
            >
              <span className={roundIndexClass}>{roundNumber(round.label, index)}</span>
              <div className="min-w-0">
                <p className={roundLabelClass}>{round.label}</p>
                {round.subtitle ? (
                  <p className={roundSubtitleClass}>{round.subtitle}</p>
                ) : null}
                {round.body ? (
                  <ExpandableBody
                    text={round.body}
                    className={round.subtitle ? "mt-2" : "mt-1.5"}
                    forceExpanded={forceExpanded}
                    showFull={showFull}
                    variant={variant}
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
            variant={variant}
          />
          {adminActions ? (
            <div className="flex shrink-0 items-start gap-1">{adminActions}</div>
          ) : null}
        </div>
      ) : null}

      {showAuthor ? (
        <div className={`flex items-center justify-end border-t ${dividerClass} px-4 py-3 sm:px-5`}>
          <ExperienceFooter
            isAnonymous={isAnonymous}
            submittedBy={submittedBy}
            variant={variant}
          />
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
  variant = "theme",
}) {
  const isDark = variant === "dark";

  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && !isDark ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-theme-accent">
            {kicker}
          </p>
        ) : null}
        <div className={`flex flex-wrap items-center gap-2 ${kicker && !isDark ? "mt-1" : ""}`}>
          <h2
            className={`text-lg font-semibold sm:text-xl ${
              isDark ? "text-indigo-400" : "text-theme-primary"
            }`}
          >
            {title}
          </h2>
          {count > 0 ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${
                isDark
                  ? "border-slate-600 bg-slate-800/80 text-slate-300"
                  : "border-theme bg-theme-card text-theme-secondary"
              }`}
            >
              {count}
            </span>
          ) : null}
        </div>
      </div>
      {count > 0 || isDark ? (
        <button
          type="button"
          onClick={onAdd}
          className={
            isDark
              ? "inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-indigo-700 sm:w-auto sm:text-sm"
              : "inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-theme bg-theme-card px-3 py-2 text-xs font-semibold text-theme-primary transition-colors hover:bg-theme-nav sm:w-auto sm:text-sm"
          }
        >
          <FaPlus className={`h-3 w-3 ${isDark ? "" : "text-theme-accent"}`} aria-hidden />
          {addLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ExperienceEmptyState({ message, actionLabel, onAction, variant = "theme" }) {
  const isDark = variant === "dark";

  return (
    <div
      className={
        isDark
          ? "rounded-lg border border-dashed border-slate-600 bg-slate-800/40 px-4 py-10 text-center"
          : "rounded-2xl border border-dashed border-theme bg-theme-hero px-4 py-10 text-center"
      }
    >
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-theme-secondary"}`}>{message}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={
            isDark
              ? "mt-4 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              : "mt-4 inline-flex items-center gap-1.5 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          }
        >
          <FaPlus className="h-3 w-3" aria-hidden />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ExperienceStoryCard;
