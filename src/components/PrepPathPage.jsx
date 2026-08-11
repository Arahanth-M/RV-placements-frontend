import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaHistory,
  FaMapMarkedAlt,
  FaSpinner,
} from "react-icons/fa";
import { companyAPI, prepPathAPI } from "../utils/api";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const INPUT =
  "w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary outline-none focus:border-theme-accent";

const LABEL = "mb-1 block text-xs font-medium text-theme-secondary whitespace-nowrap";

function trackLabel(track) {
  return String(track) === "summer_internship" ? "Summer internship" : "Full-time";
}

const TRACK_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "summer_internship", label: "Summer internship" },
];

/** Theme-aware track picker — matches PrepPath INPUT styling in light/dark (avoids native OS select chrome). */
function PrepPathTrackSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = TRACK_OPTIONS.find((o) => o.value === value) || TRACK_OPTIONS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        className={`${INPUT} flex items-center justify-between gap-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
      >
        <span className="truncate text-theme-primary">{selected.label}</span>
        <FaChevronDown
          className={`h-3 w-3 shrink-0 text-theme-secondary transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-theme bg-theme-card py-1 shadow-lg"
        >
          {TRACK_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-theme-hero font-medium text-theme-primary"
                      : "text-theme-primary hover:bg-theme-hero"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CampusEvidenceChips({ items }) {
  const list = Array.isArray(items) ? items.filter((e) => e?.label || e?.snippet) : [];
  if (!list.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-1">
      {list.map((ev, i) => (
        <div
          key={`${ev.label || ev.snippet}-${i}`}
          className="rounded-md border border-theme-accent/30 bg-theme-accent/5 px-2 py-1 text-[10px] leading-snug text-theme-secondary"
          title={ev.snippet || ev.label}
        >
          <span className="font-semibold text-theme-accent">
            {ev.label || "Seen in RVCE visit data"}
          </span>
          {ev.snippet ? (
            <span className="mt-0.5 block truncate text-theme-muted">“{ev.snippet}”</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PeerDemandBanner({ peerDemand, compact = false }) {
  if (!peerDemand?.label) return null;
  const hot = Boolean(peerDemand.hot);
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${
        hot
          ? "border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-subtle-bg)] text-status-warning"
          : "border-theme bg-theme-hero text-theme-secondary"
      } ${compact ? "text-xs" : ""}`}
    >
      <span className={`font-semibold ${hot ? "text-status-warning" : "text-theme-primary"}`}>
        Peer demand ·{" "}
      </span>
      {peerDemand.label}
      {hot ? <span className="ml-1 font-medium">(high interest this week)</span> : null}
    </div>
  );
}

function formatPlanDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

const FLOW_COLS = 3;

function buildSnakeRows(days, cols = FLOW_COLS) {
  const rows = [];
  for (let i = 0; i < days.length; i += cols) {
    const chunk = days.slice(i, i + cols);
    const rowIndex = Math.floor(i / cols);
    rows.push({
      rowIndex,
      rtl: rowIndex % 2 === 1,
      days: chunk,
    });
  }
  return rows;
}

function DayPrepBox({ day, showNext, onNext, isLatest, nextArrow = "right" }) {
  const NextIcon = nextArrow === "down" ? FaArrowDown : FaArrowRight;
  return (
    <div
      className={`flex w-full min-w-0 flex-col rounded-xl border px-3 py-3 ${
        isLatest
          ? "border-theme-accent bg-theme-hero shadow-sm"
          : "border-theme bg-theme-card"
      }`}
      style={{ minHeight: "unset", height: "auto" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-theme-accent">Day {day.day}</span>
        <span className="shrink-0 text-[11px] text-theme-muted">{day.hours}h</span>
      </div>
      {day.focus ? (
        <p className="mt-1 break-words text-xs font-medium text-theme-primary">{day.focus}</p>
      ) : null}

      <CampusEvidenceChips items={day.campusEvidence} />

      <ul className="mt-2 space-y-1.5 text-xs text-theme-secondary">
        {(day.tasks || []).map((task, idx) => (
          <li
            key={`${day.day}-${idx}-${task.title}`}
            className="rounded-md border border-theme/40 bg-theme-card/50 px-2 py-1.5"
          >
            <span className="break-words font-medium text-theme-primary">{task.title}</span>
            {task.minutes ? (
              <span className="text-theme-muted"> · {task.minutes} min</span>
            ) : null}
            {task.resourceHint ? (
              <div className="mt-0.5 break-words text-[10px] text-theme-muted">
                {task.resourceHint}
              </div>
            ) : null}
            {task.notes ? (
              <div className="mt-0.5 break-words text-[10px] text-theme-secondary">
                {task.notes}
              </div>
            ) : null}
          </li>
        ))}
        {!(day.tasks || []).length ? (
          <li className="text-theme-muted">No tasks listed for this day.</li>
        ) : null}
      </ul>

      {showNext ? (
        <button
          type="button"
          onClick={onNext}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-theme-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Next day
          <NextIcon className="h-3 w-3" />
        </button>
      ) : isLatest ? (
        <p className="mt-3 text-center text-[10px] font-medium uppercase tracking-wide text-theme-muted">
          Final day
        </p>
      ) : null}
    </div>
  );
}

function DayByDayFlowchart({ days, planKey }) {
  const [unlocked, setUnlocked] = useState(1);

  useEffect(() => {
    setUnlocked(1);
  }, [planKey]);

  const visibleDays = useMemo(
    () => days.filter((d) => Number(d.day) <= unlocked),
    [days, unlocked]
  );
  const rows = useMemo(() => buildSnakeRows(visibleDays, FLOW_COLS), [visibleDays]);
  const total = days.length;
  const canNext = unlocked < total;

  const revealNext = () => {
    if (!canNext) return;
    setUnlocked((n) => Math.min(total, n + 1));
  };

  return (
    <section className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-theme-primary">Day-by-day flowchart</h3>
        <p className="mt-1 text-xs text-theme-muted">
          Day {unlocked} of {total} · use Next day inside a box to follow the path
        </p>
      </div>

      {/* Mobile: vertical stack — each next day appends below with a down arrow */}
      <div className="mt-5 flex w-full min-w-0 flex-col sm:hidden">
        {visibleDays.map((day, idx) => {
          const dayNum = Number(day.day);
          const isLatest = dayNum === unlocked;
          const showNext = Boolean(isLatest && canNext);
          return (
            <React.Fragment key={`m-day-${day.day}`}>
              {idx > 0 ? (
                <div className="flex justify-center py-2" aria-hidden>
                  <FaArrowDown className="h-5 w-5 text-theme-accent" />
                </div>
              ) : null}
              <DayPrepBox
                day={day}
                isLatest={isLatest}
                showNext={showNext}
                onNext={revealNext}
                nextArrow="down"
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* sm+: zigzag snake layout */}
      <div className="mt-5 hidden w-full flex-col gap-3 sm:flex">
        {rows.map((row, rowIdx) => {
          const cells = Array.from({ length: FLOW_COLS }, () => null);
          row.days.forEach((day, i) => {
            const col = row.rtl ? FLOW_COLS - 1 - i : i;
            cells[col] = day;
          });
          const ArrowBetween = row.rtl ? FaArrowLeft : FaArrowRight;
          const endsOnRight = !row.rtl;
          const nextRow = rows[rowIdx + 1];
          const downCol = endsOnRight ? FLOW_COLS - 1 : 0;

          return (
            <div key={`row-${row.rowIndex}`} className="flex w-full flex-col gap-3">
              <div className="flex w-full items-start">
                {cells.map((day, colIdx) => {
                  const leftDay = cells[colIdx - 1];
                  const dayNum = day ? Number(day.day) : null;
                  const isLatest = dayNum != null && dayNum === unlocked;
                  const showNext = Boolean(isLatest && canNext);

                  return (
                    <React.Fragment key={`c-${row.rowIndex}-${colIdx}`}>
                      {colIdx > 0 ? (
                        <div className="flex w-6 shrink-0 items-center justify-center pt-10 sm:w-8">
                          {leftDay && day ? (
                            <ArrowBetween className="h-5 w-5 text-theme-accent" aria-hidden />
                          ) : null}
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 self-start">
                        {day ? (
                          <DayPrepBox
                            day={day}
                            isLatest={isLatest}
                            showNext={showNext}
                            onNext={revealNext}
                          />
                        ) : (
                          <div aria-hidden className="h-0" />
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {nextRow ? (
                <div className="flex w-full items-center">
                  {cells.map((_, colIdx) => (
                    <React.Fragment key={`down-${row.rowIndex}-${colIdx}`}>
                      {colIdx > 0 ? <div className="w-6 shrink-0 sm:w-8" /> : null}
                      <div className="flex min-w-0 flex-1 justify-center">
                        {colIdx === downCol ? (
                          <FaArrowDown className="h-5 w-5 text-theme-accent" aria-hidden />
                        ) : null}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PrepPathPlanView({ plan }) {
  if (!plan) return null;
  const roadmap = plan.roadmap || {};
  const days = Array.isArray(roadmap.days) ? roadmap.days : [];
  const topics = Array.isArray(roadmap.topicSections) ? roadmap.topicSections : [];
  const companySignals = Array.isArray(roadmap.companySignals)
    ? roadmap.companySignals
    : [];
  const studyLinks = Array.isArray(roadmap.studyLinks) ? roadmap.studyLinks : [];
  const motivationSlogans = Array.isArray(roadmap.motivationSlogans)
    ? roadmap.motivationSlogans
    : [];
  const flags = plan.contextFlags || {};
  const peerDemand = plan.peerDemand || null;
  const planKey = String(plan._id || `${plan.companyName}-${plan.role}-${plan.createdAt}`);

  /** Prefer per-subtopic links; for older plans, fall back to top-level studyLinks. */
  const topicsWithLinks = (() => {
    const hasAny = topics.some((t) =>
      (t.subtopics || []).some((s) => s?.linkUrl || s?.link?.url)
    );
    if (hasAny || !studyLinks.length) return topics;
    let i = 0;
    return topics.map((t) => ({
      ...t,
      subtopics: (t.subtopics || []).map((s) => {
        if (s?.linkUrl || s?.link?.url) return s;
        const link = studyLinks[i % studyLinks.length];
        i += 1;
        return {
          ...s,
          linkTitle: link.title,
          linkUrl: link.url,
          linkWhy: link.why || "",
        };
      }),
    }));
  })();

  const signalLabel = (type) => {
    switch (String(type || "").toLowerCase()) {
      case "oa":
        return "OA";
      case "interview_question":
        return "Interview Q";
      case "interview_experience":
        return "Experience";
      case "must_do":
        return "Must-do";
      case "platform_role":
        return "Platform roles";
      default:
        return "Campus data";
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 overflow-x-hidden">
      <section className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold text-theme-primary sm:text-2xl">
              {plan.companyName || "Company"} · {plan.role}
            </h2>
            <p className="mt-1 text-sm text-theme-secondary">
              {trackLabel(plan.track)} · {plan.days} days · {plan.hoursPerDay} h/day
              {roadmap.totalHours != null ? ` · ~${roadmap.totalHours} total hours` : ""}
              <span className="text-theme-muted"> · Fresher-focused plan</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {flags.limitedData ? (
              <span className="status-badge-warning px-2.5 py-1">
                Limited campus data
              </span>
            ) : null}
            {flags.webAugmented ? (
              <span className="rounded-full border border-theme px-2.5 py-1 text-theme-secondary">
                Web-augmented
              </span>
            ) : null}
          </div>
        </div>

        {peerDemand?.label ? (
          <div className="mt-4">
            <PeerDemandBanner peerDemand={peerDemand} />
          </div>
        ) : null}
        {roadmap.summary ? (
          <p className="mt-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
            {roadmap.summary}
          </p>
        ) : null}
        {roadmap.dataQualityNote ? (
          <p className="mt-3 rounded-lg border border-[color:var(--status-warning-border)] bg-[color:var(--status-warning-subtle-bg)] px-3 py-2 text-sm text-status-warning">
            {roadmap.dataQualityNote}
          </p>
        ) : null}

        {Array.isArray(roadmap.resumeStrengths) && roadmap.resumeStrengths.length > 0 ? (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-status-success">
              Strengths for this company
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-theme-secondary">
              {roadmap.resumeStrengths.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {Array.isArray(roadmap.resumeMissing) && roadmap.resumeMissing.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-status-warning">
              Missing on the resume
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-theme-secondary">
              {roadmap.resumeMissing.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {Array.isArray(roadmap.companyExpectations) &&
        roadmap.companyExpectations.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-theme-accent">
              What the company expects most
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-theme-secondary">
              {roadmap.companyExpectations.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {Array.isArray(roadmap.skillGaps) && roadmap.skillGaps.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-theme-primary">Skill gaps</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-theme-secondary">
              {roadmap.skillGaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {companySignals.length > 0 ? (
          <div className="mt-5 rounded-xl border border-theme bg-theme-hero px-4 py-3">
            <h3 className="text-sm font-semibold text-theme-primary">
              From this company&apos;s campus data
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-theme-secondary">
              {companySignals.map((sig, i) => (
                <li key={`${sig.point}-${i}`} className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                  <span className="mt-0.5 w-fit shrink-0 rounded border border-theme px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-theme-accent">
                    {signalLabel(sig.sourceType)}
                    {sig.year ? ` · ${sig.year}` : ""}
                  </span>
                  <div className="min-w-0">
                    <span>{sig.point}</span>
                    {sig.label ? (
                      <div className="mt-0.5 text-[10px] text-theme-muted">{sig.label}</div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {topicsWithLinks.length > 0 ? (
        <section className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-theme-primary">Topics & hour split</h3>
          <p className="mt-1 text-xs text-theme-muted">
            Each subtopic includes hours and a practice link. Campus tags cite RVCE visit data when matched.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topicsWithLinks.map((t) => (
              <div
                key={`${t.title}-${t.hours}`}
                className="min-w-0 overflow-hidden rounded-xl border border-theme bg-theme-hero p-3 sm:p-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                  <h4 className="min-w-0 break-words font-medium text-theme-primary">{t.title}</h4>
                  <span className="shrink-0 text-sm font-semibold text-theme-accent">
                    {t.hours}h total
                  </span>
                </div>
                {t.why ? (
                  <p className="mt-2 break-words text-sm text-theme-secondary">{t.why}</p>
                ) : null}
                <CampusEvidenceChips items={t.campusEvidence} />
                {Array.isArray(t.subtopics) && t.subtopics.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {t.subtopics.map((s) => {
                      const linkUrl = s.linkUrl || s.link?.url || "";
                      const linkTitle = s.linkTitle || s.link?.title || "Resource";
                      const linkWhy = s.linkWhy || s.link?.why || "";
                      return (
                        <li
                          key={`${t.title}-${s.title}`}
                          className="min-w-0 rounded-md border border-theme/50 bg-theme-card/60 px-2.5 py-1.5 text-xs"
                        >
                          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                            <div className="min-w-0">
                              <span className="break-words font-medium text-theme-primary">
                                {s.title}
                              </span>
                              {s.notes ? (
                                <div className="mt-0.5 break-words text-theme-muted">{s.notes}</div>
                              ) : null}
                            </div>
                            <span className="shrink-0 font-semibold text-theme-accent">
                              {s.hours}h
                            </span>
                          </div>
                          {linkUrl ? (
                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block max-w-full break-all text-[11px] font-medium text-theme-accent underline-offset-2 hover:underline"
                              title={linkWhy || linkTitle}
                            >
                              {linkTitle}
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {Array.isArray(t.practiceHints) && t.practiceHints.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-theme-muted">
                    {t.practiceHints.map((h) => (
                      <li key={h} className="break-words">
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {days.length > 0 ? <DayByDayFlowchart days={days} planKey={planKey} /> : null}

      {motivationSlogans.length > 0 ? (
        <section className="rounded-2xl border border-theme-accent/40 bg-theme-hero p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-theme-primary">Stay motivated</h3>
          <ul className="mt-3 space-y-2">
            {motivationSlogans.map((line) => (
              <li
                key={line}
                className="rounded-lg border border-theme/60 bg-theme-card/70 px-3 py-2 text-sm italic text-theme-secondary"
              >
                “{line}”
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function PrepPathPage() {
  const navigate = useNavigate();
  const suggestRootRef = useRef(null);
  const companiesLoadPromiseRef = useRef(null);

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const [role, setRole] = useState("");
  const [track, setTrack] = useState("full_time");
  const [days, setDays] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [resumeFile, setResumeFile] = useState(null);

  const [quota, setQuota] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [loadingPlanId, setLoadingPlanId] = useState("");
  const [formPeerDemand, setFormPeerDemand] = useState(null);

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLocaleLowerCase("en");
    const list = Array.isArray(companies) ? companies : [];
    if (!q) return list.slice(0, 12);
    return list
      .filter((c) => String(c?.name || "").toLocaleLowerCase("en").includes(q))
      .slice(0, 12);
  }, [companies, companyQuery]);

  const ensureCompanyNames = useCallback(async () => {
    if (companiesLoaded) return;
    if (companiesLoadPromiseRef.current) return companiesLoadPromiseRef.current;

    setCompaniesLoading(true);
    const p = (async () => {
      try {
        const res = await companyAPI.getCompanyNames();
        const list = Array.isArray(res?.data) ? res.data : [];
        setCompanies(
          list
            .map((c) => ({
              id: String(c._id || c.id || ""),
              name: String(c.name || "").trim(),
            }))
            .filter((c) => c.id && c.name)
            .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
        );
        setCompaniesLoaded(true);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load company list.");
      } finally {
        setCompaniesLoading(false);
        companiesLoadPromiseRef.current = null;
      }
    })();
    companiesLoadPromiseRef.current = p;
    return p;
  }, [companiesLoaded]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [quotaRes, plansRes] = await Promise.all([
          prepPathAPI.getQuota(),
          prepPathAPI.listPlans(),
        ]);
        if (cancelled) return;
        setQuota(quotaRes?.data?.quota || null);
        setHistory(Array.isArray(plansRes?.data?.plans) ? plansRes.data.plans : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.error || "Failed to load PrepPath.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const companyId = selectedCompany?.id;
    if (!companyId) {
      setFormPeerDemand(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await prepPathAPI.getPeerDemand(companyId);
        if (!cancelled) setFormPeerDemand(res?.data?.peerDemand || null);
      } catch {
        if (!cancelled) setFormPeerDemand(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCompany?.id]);

  useEffect(() => {
    const onDoc = (e) => {
      if (suggestRootRef.current && !suggestRootRef.current.contains(e.target)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!historyOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setHistoryOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [historyOpen]);

  const openHistoryPlan = async (planId) => {
    setLoadingPlanId(String(planId));
    setError("");
    try {
      const res = await prepPathAPI.getPlan(planId);
      setActivePlan(res?.data?.plan || null);
      setHistoryOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to open plan.");
    } finally {
      setLoadingPlanId("");
    }
  };

  const onGenerate = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedCompany?.id) {
      setError("Pick a company from the list.");
      return;
    }
    if (!role.trim()) {
      setError("Enter the target role.");
      return;
    }
    if (track !== "full_time" && track !== "summer_internship") {
      setError("Choose Full-time or Summer internship.");
      return;
    }
    if (!resumeFile) {
      setError("Upload a PDF or DOCX resume.");
      return;
    }
    if (quota && quota.unlimited !== true && Number(quota.remaining) <= 0) {
      setError("Daily PrepPath limit reached. Try again tomorrow (IST).");
      return;
    }

    setGenerating(true);
    try {
      const res = await prepPathAPI.generate({
        companyId: selectedCompany.id,
        role: role.trim(),
        track,
        days,
        hoursPerDay,
        resumeFile,
      });
      setActivePlan(res?.data?.plan || null);
      if (res?.data?.peerDemand) setFormPeerDemand(res.data.peerDemand);
      if (res?.data?.quota) setQuota(res.data.quota);
      const plansRes = await prepPathAPI.listPlans();
      setHistory(Array.isArray(plansRes?.data?.plans) ? plansRes.data.plans : []);
      setResumeFile(null);
      const fileInput = document.getElementById("prep-path-resume");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          (err?.code === "ECONNABORTED"
            ? "Generation timed out. Please try again."
            : "Failed to generate PrepPath plan.")
      );
      try {
        const q = await prepPathAPI.getQuota();
        if (q?.data?.quota) setQuota(q.data.quota);
      } catch {
        /* ignore */
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={`relative min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={`${pageShellInnerClass} max-w-none`}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(-1)} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Personal interview prep roadmap from your resume, company campus data, and a careful AI coach.">
          PrepPath
        </PageHeroHeader>

        <div className="w-full space-y-5">
            {/* Single-row inputs */}
            <section className="w-full rounded-2xl border border-theme bg-theme-card p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-theme-accent">
                  <FaMapMarkedAlt />
                  <span className="text-xs font-semibold uppercase tracking-wide sm:text-sm">
                    New plan
                  </span>
                </div>
                {quota ? (
                  <span className="text-xs text-theme-secondary">
                    {quota.unlimited
                      ? `Generated today: ${quota.used}`
                      : `Today: ${quota.used}/${quota.limit} used · ${quota.remaining} left`}
                  </span>
                ) : null}
              </div>

              <form onSubmit={onGenerate}>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
                  <div ref={suggestRootRef} className="relative min-w-0 flex-1">
                    <label className={LABEL}>
                      Company <span className="text-theme-accent">*</span>
                    </label>
                    <input
                      className={INPUT}
                      value={companyQuery}
                      onChange={(e) => {
                        setCompanyQuery(e.target.value);
                        setSelectedCompany(null);
                        setFormPeerDemand(null);
                        setSuggestOpen(true);
                        ensureCompanyNames();
                      }}
                      onFocus={() => {
                        setSuggestOpen(true);
                        ensureCompanyNames();
                      }}
                      placeholder="Search company"
                      autoComplete="off"
                    />
                    {suggestOpen && companiesLoading && !companiesLoaded ? (
                      <div className="absolute z-30 mt-1 w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs text-theme-muted shadow-lg">
                        Loading companies…
                      </div>
                    ) : null}
                    {suggestOpen && !companiesLoading && filteredCompanies.length > 0 ? (
                      <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-theme bg-theme-card shadow-lg">
                        {filteredCompanies.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm text-theme-primary hover:bg-theme-hero"
                              onClick={() => {
                                setSelectedCompany(c);
                                setCompanyQuery(c.name);
                                setSuggestOpen(false);
                              }}
                            >
                              {c.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {suggestOpen &&
                    companiesLoaded &&
                    !companiesLoading &&
                    companyQuery.trim() &&
                    filteredCompanies.length === 0 ? (
                      <div className="absolute z-30 mt-1 w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs text-theme-muted shadow-lg">
                        No matching companies
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-[0.9]">
                    <label className={LABEL}>
                      Role <span className="text-theme-accent">*</span>
                    </label>
                    <input
                      className={INPUT}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. SDE / Backend"
                      maxLength={120}
                    />
                  </div>

                  <div className="w-full sm:w-44 xl:w-44">
                    <label className={LABEL}>
                      Track <span className="text-theme-accent">*</span>
                    </label>
                    <PrepPathTrackSelect value={track} onChange={setTrack} />
                  </div>

                  <div className="w-full sm:w-24 xl:w-20">
                    <label className={LABEL}>Days</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className={INPUT}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                    />
                  </div>

                  <div className="w-full sm:w-28 xl:w-24">
                    <label className={LABEL}>Hrs / day</label>
                    <input
                      type="number"
                      min={0.5}
                      max={16}
                      step={0.5}
                      className={INPUT}
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <label className={LABEL}>
                      Resume <span className="text-theme-accent">*</span>
                    </label>
                    <input
                      id="prep-path-resume"
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="block w-full truncate text-xs text-theme-secondary file:mr-2 file:rounded-md file:border-0 file:bg-theme-hero file:px-2.5 file:py-2 file:text-xs file:font-medium file:text-theme-primary sm:text-sm"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="w-full shrink-0 xl:w-auto">
                    <label className={`${LABEL} invisible hidden xl:block`}>Go</label>
                    <button
                      type="submit"
                      disabled={
                        generating ||
                        (quota &&
                          quota.unlimited !== true &&
                          Number(quota.remaining) <= 0)
                      }
                      className="inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-theme-accent px-4 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto xl:min-w-[9.5rem]"
                    >
                      {generating ? (
                        <>
                          <FaSpinner className="animate-spin" /> Generating…
                        </>
                      ) : (
                        "Generate"
                      )}
                    </button>
                  </div>
                </div>

                {formPeerDemand?.label ? (
                  <div className="mt-3">
                    <PeerDemandBanner peerDemand={formPeerDemand} compact />
                  </div>
                ) : null}

                {!selectedCompany && companyQuery ? (
                  <p className="mt-2 text-xs text-theme-muted">
                    Pick a company from the dropdown.
                  </p>
                ) : null}

                {error ? (
                  <p className="mt-3 rounded-lg border border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-subtle-bg)] px-3 py-2 text-sm text-status-danger">
                    {error}
                  </p>
                ) : null}
              </form>
            </section>

            {/* Full-width plan */}
            <div className="w-full pb-10">
              {activePlan ? (
                <PrepPathPlanView plan={activePlan} />
              ) : (
                <div className="rounded-2xl bg-theme-card/60 px-6 py-16 text-center text-sm text-theme-secondary">
                  Generate a plan above, or open History from the left arrow to view a previous roadmap.
                </div>
              )}
            </div>
          </div>
      </div>

      {/* History edge tab (left) */}
      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className={`fixed left-0 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-1 rounded-r-xl border border-l-0 border-theme bg-theme-card px-2 py-4 text-theme-accent shadow-lg transition-transform hover:bg-theme-hero ${
          historyOpen ? "pointer-events-none -translate-x-full opacity-0" : ""
        }`}
        title="Open previous roadmaps"
        aria-label="Open previous roadmaps"
      >
        <FaHistory className="h-4 w-4" />
        <FaChevronRight className="h-3.5 w-3.5" />
        <span
          className="mt-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ writingMode: "vertical-rl" }}
        >
          History
        </span>
      </button>

      {/* History sidebar overlay */}
      {historyOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35"
          aria-label="Close history"
          onClick={() => setHistoryOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[min(22rem,90vw)] flex-col rounded-none border-r border-theme bg-theme-card shadow-2xl transition-transform duration-300 ease-out ${
          historyOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!historyOpen}
      >
        <div className="flex items-center justify-between gap-2 border-b border-theme px-3 py-2.5">
          <div>
            <h3 className="text-sm font-semibold text-theme-primary">Previous roadmaps</h3>
            <p className="text-xs text-theme-muted">Last 10 · older kept</p>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-theme text-theme-secondary hover:bg-theme-hero"
            aria-label="Close history sidebar"
          >
            <FaChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {history.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-theme-secondary">No plans yet.</p>
          ) : (
            <ul className="flex w-full flex-col gap-1">
              {history.map((p) => {
                const isActive = activePlan && String(activePlan._id) === String(p._id);
                return (
                  <li key={p._id} className="w-full">
                    <button
                      type="button"
                      onClick={() => openHistoryPlan(p._id)}
                      title={`${p.companyName} · ${trackLabel(p.track)} · ${p.role} · ${formatPlanDate(p.createdAt)} · ${p.days}d × ${p.hoursPerDay}h`}
                      className={`flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-colors ${
                        isActive
                          ? "border-theme-accent/60 bg-theme-hero"
                          : "border-theme/70 bg-transparent hover:border-theme-accent/40 hover:bg-theme-hero/60"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-theme-primary">
                        {p.companyName} · {trackLabel(p.track)} · {p.role}
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-[10px] text-theme-muted">
                        {formatPlanDate(p.createdAt)} · {p.days}d×{p.hoursPerDay}h
                      </span>
                      {loadingPlanId === String(p._id) ? (
                        <FaSpinner className="h-3 w-3 shrink-0 animate-spin text-theme-muted" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

export default PrepPathPage;
