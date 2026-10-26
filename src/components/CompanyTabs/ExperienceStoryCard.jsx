import { useMemo, useState } from "react";
import { FaPlus, FaThumbsUp } from "react-icons/fa";
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

function tightenRoundText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]*\n+[ \t]*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function ExpandableBody({
  text,
  className = "",
  forceExpanded = false,
  showFull = false,
  tone = "body",
}) {
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
            className={
              tone === "overview"
                ? "experience-overview-copy break-words"
                : "break-words text-sm leading-relaxed text-theme-secondary sm:text-[15px] sm:leading-7"
            }
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

const TYPE_LABELS = {
  oa: ["oa", "online assessment"],
  technical: ["technical"],
  hr: ["hr"],
  coding: ["coding"],
  "system design": ["system design"],
  aptitude: ["aptitude"],
  managerial: ["managerial"],
  gd: ["gd", "group discussion"],
  behavioral: ["behavioral", "behavioural"],
  interview: ["interview"],
  other: ["other", "general"],
};

function normalizeRoundLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+(round|interview)$/g, "")
    .trim();
}

function subtitleRepeatsType(type, subtitle) {
  const typeKey = normalizeRoundLabel(type);
  const subtitleKey = normalizeRoundLabel(subtitle);
  if (!typeKey || !subtitleKey) return false;
  const aliases = (TYPE_LABELS[typeKey] || [typeKey]).map(normalizeRoundLabel);
  return aliases.includes(subtitleKey) || subtitleKey === typeKey;
}

function RoundHeading({ round, index }) {
  const number = round.number || index + 1;
  const type = String(round.type || "").trim();
  return (
    <div className="experience-round-heading">
      <h3 className="experience-round-index">Round {number}</h3>
      {type ? <span className="experience-round-type">{type}</span> : null}
    </div>
  );
}

function narrativeFromPolished(polishedContent) {
  const rounds = Array.isArray(polishedContent?.rounds) ? polishedContent.rounds : [];
  if (!rounds.length) return null;
  return {
    intro: String(polishedContent.overview || "").trim(),
    rounds: rounds.map((round, index) => ({
      label: `Round ${round.order || index + 1}`,
      number: round.order || index + 1,
      type: round.type || "",
      subtitle: round.title || "",
      body: round.details || "",
    })),
  };
}

function ExperienceLikeButton({ liked, count, pending, onLike }) {
  if (!onLike) return null;
  const total = Number(count) || 0;
  return (
    <button
      type="button"
      onClick={onLike}
      disabled={pending}
      aria-pressed={liked === true}
      aria-label={liked ? `Unlike this experience, ${total} likes` : `Like this experience, ${total} likes`}
      title={liked ? "Remove like" : "Like this experience"}
      className={`experience-like-btn ${liked ? "experience-like-btn--active" : ""} inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold`}
    >
      <span className="experience-like-icon" aria-hidden>
        <FaThumbsUp className={`h-3.5 w-3.5 ${pending ? "animate-bounce" : ""}`} />
      </span>
      <span className="text-theme-secondary">Like</span>
      <span className="experience-like-count">{total}</span>
    </button>
  );
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

/**
 * Display-only story card for interview / internship experience strings.
 */
export function ExperienceStoryCard({
  content,
  polishedContent = null,
  isAnonymous = false,
  submittedBy = null,
  adminActions = null,
  highlighted = false,
  forceExpanded = false,
  showFull = false,
  variant = "theme",
  /** When false, hides contributor name and anonymous badge (interview experiences). */
  showContributor = true,
  likeCount = 0,
  likedByMe = false,
  likePending = false,
  onLike = null,
  overviewLabel = "",
  /** Admin edit view: overview, type, title, and details as stored. */
  layout = "story",
}) {
  const narrative = useMemo(
    () => narrativeFromPolished(polishedContent) || splitExperienceNarrative(content),
    [content, polishedContent]
  );
  const storedRounds = Array.isArray(polishedContent?.rounds) ? polishedContent.rounds : [];
  const storedOverview = String(polishedContent?.overview || "").trim();
  const hasStoredShape =
    Boolean(storedOverview) ||
    storedRounds.some((round) => round?.type || round?.title || round?.details);

  const showAuthor =
    showContributor &&
    (isAnonymous || Boolean(String(submittedBy?.name || "").trim()));

  const rounds = narrative.rounds;
  const showLike = typeof onLike === "function";
  const showFooter = showAuthor || showLike;

  return (
    <article
      className={`relative min-w-0 overflow-hidden rounded-xl border border-theme bg-theme-card ${
        highlighted ? "ring-2 ring-theme-accent" : ""
      }`}
    >
      {adminActions ? (
        <div className="absolute right-2 top-2 z-10 flex shrink-0 items-start gap-0.5 sm:right-3 sm:top-3">
          {adminActions}
        </div>
      ) : null}

      {layout === "stored" ? (
        <div className={`space-y-5 px-4 py-4 sm:px-5 sm:py-5 ${adminActions ? "pr-14" : ""}`}>
          {hasStoredShape ? (
            <>
              {storedOverview ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-theme-secondary sm:text-[15px] sm:leading-7">
                  {storedOverview}
                </p>
              ) : null}
              <ol className="m-0 list-none space-y-5 p-0">
                {storedRounds.map((round, index) => (
                  <li key={`${round.order || index}-${round.type || ""}-${index}`}>
                    <RoundHeading
                      round={{ number: round.order || index + 1, type: round.type || "" }}
                      index={index}
                    />
                    {String(round.title || "").trim() ? (
                      <p className="mt-3 text-base font-semibold leading-6 text-theme-primary">
                        {round.title}
                      </p>
                    ) : null}
                    {String(round.details || "").trim() ? (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-theme-secondary sm:text-[15px] sm:leading-7">
                        {round.details}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-theme-secondary sm:text-[15px] sm:leading-7">
              {String(content || "").trim()}
            </p>
          )}
        </div>
      ) : narrative.intro ? (
        <div className={`px-4 py-4 sm:px-5 sm:py-5 ${adminActions ? "pr-14" : ""}`}>
          {overviewLabel ? (
            <p className="experience-overview-label">{overviewLabel}</p>
          ) : null}
          <ExpandableBody
            text={narrative.intro}
            forceExpanded={forceExpanded}
            showFull={showFull}
            tone={overviewLabel ? "overview" : "body"}
          />
        </div>
      ) : null}

      {layout !== "stored" && rounds.length > 0 ? (
        <ol className="m-0 list-none p-0">
          {rounds.map((round, index) => {
            const subtitle = String(round.subtitle || "").trim();
            const showSubtitle = Boolean(subtitle) && !subtitleRepeatsType(round.type, subtitle);
            const body = tightenRoundText(round.body);
            return (
            <li
              key={`${round.label}-${round.type}-${index}`}
              className={`px-4 pb-1 pt-5 sm:px-5 sm:pt-6 ${
                !narrative.intro && index === 0 && adminActions ? "pr-14" : ""
              }`}
            >
              <RoundHeading round={round} index={index} />
              {showSubtitle ? (
                <p className="mt-3 text-base font-semibold leading-6 text-theme-primary">
                  {subtitle}
                </p>
              ) : null}
              {body ? (
                <ExpandableBody
                  text={body}
                  className={showSubtitle ? "mt-2" : "mt-3"}
                  forceExpanded={forceExpanded}
                  showFull={showFull}
                />
              ) : null}
            </li>
            );
          })}
        </ol>
      ) : layout !== "stored" && !narrative.intro ? (
        <div className={`px-4 py-4 sm:px-5 sm:py-5 ${adminActions ? "pr-14" : ""}`}>
          <ExpandableBody
            text={plainExperienceText(content)}
            forceExpanded={forceExpanded}
            showFull={showFull}
            variant={variant}
          />
        </div>
      ) : null}

      {showFooter ? (
        <div
          className={`flex items-center gap-3 border-t border-theme px-4 py-3 sm:px-5 ${
            showLike && showAuthor ? "justify-between" : "justify-end"
          }`}
        >
          {showLike ? (
            <ExperienceLikeButton
              liked={likedByMe}
              count={likeCount}
              pending={likePending}
              onLike={onLike}
            />
          ) : (
            <span />
          )}
          {showAuthor ? (
            <ExperienceFooter
              isAnonymous={isAnonymous}
              submittedBy={submittedBy}
              variant={variant}
            />
          ) : null}
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
