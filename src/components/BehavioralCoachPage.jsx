import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../utils/AuthContext";
import { interviewAPI } from "../utils/api";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import { getFocusOptionsForRoundType } from "../constants/interviewRoundFocus.js";
import BrandLogo from "./BrandLogo.jsx";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const FOCUS_OPTIONS = getFocusOptionsForRoundType("HR");

const PHASE_PICK = "pick";
const PHASE_ANSWER = "answer";
const PHASE_FEEDBACK = "feedback";
const PHASE_ANALYTICS = "analytics";

const EMPTY_ANSWER_PARTS = {
  situation: "",
  task: "",
  action: "",
  result: "",
  reflection: "",
  motivation: "",
  fit: "",
  evidence: "",
  aspiration: "",
};

const STAR_FIELDS = [
  {
    key: "situation",
    label: "Situation",
    required: true,
    rows: 3,
    placeholder: "Context — when, where, who was involved, and what was at stake.",
  },
  {
    key: "task",
    label: "Task",
    required: true,
    rows: 2,
    placeholder: "Your responsibility or goal in that situation.",
  },
  {
    key: "action",
    label: "Action",
    required: true,
    rows: 4,
    placeholder: "What *you* specifically did — decisions, steps, ownership.",
  },
  {
    key: "result",
    label: "Result",
    required: true,
    rows: 3,
    placeholder: "Outcome — impact, metrics, or what changed.",
  },
  {
    key: "reflection",
    label: "Reflection",
    required: false,
    rows: 2,
    placeholder: "Optional — what you learned or would do differently.",
  },
];

/** Why-company is motivation/fit — STAR stories don't fit this prompt type. */
const WHY_FIELDS = [
  {
    key: "motivation",
    label: "Motivation",
    required: true,
    rows: 3,
    placeholder: "What draws you to this kind of company, product, or role?",
  },
  {
    key: "fit",
    label: "Fit",
    required: true,
    rows: 3,
    placeholder: "How your skills, projects, or interests match what the role needs.",
  },
  {
    key: "evidence",
    label: "Evidence",
    required: true,
    rows: 3,
    placeholder: "Specific research, product detail, or experience that backs that up.",
  },
  {
    key: "aspiration",
    label: "Aspiration",
    required: true,
    rows: 2,
    placeholder: "What you want to learn or contribute in the first months.",
  },
];

const GENERATE_WAIT_TIPS = [
  "For behavioral themes, pick one concrete example — projects, internships, clubs, or coursework all count.",
  "Interviewers listen for ownership: lead with what *you* did, not only what the team did.",
  "A strong STAR answer names the stakes, your actions, and a clear outcome.",
  "For “Why this company”, skip a past story — talk motivation, fit, evidence, and what you’d contribute.",
  "Keep answers fresher-friendly: campus experience is valid if it’s specific and honest.",
];

const EVALUATE_WAIT_TIPS = [
  "While we score, skim whether every box has a concrete detail — vague lines lose points.",
  "Results land better with a number, before/after change, or clear impact statement.",
  "Reflection (or Aspiration for why-company) shows maturity — don’t skip the close.",
  "If Action/Fit is weak, rewrite with first-person verbs: decided, built, coordinated, researched.",
  "Coaching tips after scoring point at the weakest dimension first — that’s your rewrite focus.",
];

function isWhyCompanyFocus(focusId) {
  return focusId === "why_company";
}

function fieldsForFocus(focusId) {
  return isWhyCompanyFocus(focusId) ? WHY_FIELDS : STAR_FIELDS;
}

function composeAnswer(parts, focusId) {
  if (isWhyCompanyFocus(focusId)) {
    const lines = [];
    if (parts.motivation?.trim()) lines.push(`Motivation: ${parts.motivation.trim()}`);
    if (parts.fit?.trim()) lines.push(`Fit: ${parts.fit.trim()}`);
    if (parts.evidence?.trim()) lines.push(`Evidence: ${parts.evidence.trim()}`);
    if (parts.aspiration?.trim()) lines.push(`Aspiration: ${parts.aspiration.trim()}`);
    return lines.join("\n\n");
  }
  const lines = [];
  if (parts.situation?.trim()) lines.push(`Situation: ${parts.situation.trim()}`);
  if (parts.task?.trim()) lines.push(`Task: ${parts.task.trim()}`);
  if (parts.action?.trim()) lines.push(`Action: ${parts.action.trim()}`);
  if (parts.result?.trim()) lines.push(`Result: ${parts.result.trim()}`);
  if (parts.reflection?.trim()) lines.push(`Reflection: ${parts.reflection.trim()}`);
  return lines.join("\n\n");
}

function answerPartsReady(parts, focusId) {
  if (isWhyCompanyFocus(focusId)) {
    return (
      (parts.motivation || "").trim().length >= 5 &&
      (parts.fit || "").trim().length >= 5 &&
      (parts.evidence || "").trim().length >= 5 &&
      (parts.aspiration || "").trim().length >= 4
    );
  }
  return (
    (parts.situation || "").trim().length >= 5 &&
    (parts.task || "").trim().length >= 3 &&
    (parts.action || "").trim().length >= 5 &&
    (parts.result || "").trim().length >= 3
  );
}

function missingAnswerFields(parts, focusId) {
  const fields = fieldsForFocus(focusId);
  const mins = isWhyCompanyFocus(focusId)
    ? { motivation: 5, fit: 5, evidence: 5, aspiration: 4 }
    : { situation: 5, task: 3, action: 5, result: 3, reflection: 0 };
  return fields
    .filter((field) => {
      if (!field.required) return false;
      const min = mins[field.key] ?? 5;
      return (parts[field.key] || "").trim().length < min;
    })
    .map((field) => field.label);
}

function focusLabelFor(id) {
  return FOCUS_OPTIONS.find((opt) => opt.id === id)?.label || id || "General";
}

function formatAttemptDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function StarBar({ score }) {
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  // Use solid theme classes only — Tailwind opacity modifiers like
  // `bg-theme-accent/70` do not work with CSS-variable theme colors, so the fill vanished.
  const fillClass = pct < 45 ? "bg-amber-500" : "bg-theme-accent";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-theme bg-[#e8eef8] dark:bg-theme-hero">
      <div
        className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScoreOverTimeChart({ progress }) {
  const data = useMemo(
    () =>
      (Array.isArray(progress) ? progress : []).map((point, idx) => ({
        name: `P${idx + 1}`,
        score: Math.max(0, Math.min(10, Number(point.score) || 0)),
        focus: point.focus,
      })),
    [progress]
  );

  if (!data.length) return null;

  return (
    <div className="rounded-xl border border-theme bg-theme-hero px-2 py-3 sm:px-3">
      <div className="h-48 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #d5dceb)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--text-secondary, #64748b)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 11, fill: "var(--text-secondary, #64748b)" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card, #fff)",
                border: "1px solid var(--border, #d5dceb)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value) => [`${value}/10`, "Score"]}
              labelFormatter={(label) => `Practice ${String(label).replace(/^P/, "")}`}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--accent, #6d28d9)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "var(--accent, #6d28d9)", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[11px] text-theme-secondary">
        Score by practice (oldest → newest)
      </p>
    </div>
  );
}

function StatTile({ label, value, suffix = "" }) {
  return (
    <div className="rounded-xl border border-theme bg-theme-hero px-3 py-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-secondary">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-theme-primary">
        {value == null || value === "" ? "—" : value}
        {value != null && value !== "" && suffix ? (
          <span className="text-sm font-medium text-theme-secondary">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}

function CoachWaitOverlay({ mode, tipIndex }) {
  const tips = mode === "evaluate" ? EVALUATE_WAIT_TIPS : GENERATE_WAIT_TIPS;
  const title = mode === "evaluate" ? "Evaluating your answer" : "Generating your question";
  const tip = tips[tipIndex % tips.length];

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-lg rounded-2xl border border-theme-accent bg-theme-card shadow-2xl overflow-hidden">
        <div className="bg-theme-hero px-6 pt-6 pb-4 border-b border-theme">
          <div className="flex items-start gap-3 mb-1">
            <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
              <BrandLogo />
            </div>
            <div className="min-w-0 pt-1">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-accent text-lg text-white"
                  aria-hidden
                >
                  ✦
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
                    While you wait
                  </p>
                  <p className="text-lg font-bold text-theme-primary">{title}</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-theme-secondary ml-[108px] sm:ml-[124px]">
            This usually takes a few seconds. Take a breath and skim a tip below.
          </p>
        </div>
        <div className="px-6 py-6 min-h-[140px] flex flex-col justify-center">
          <div
            key={tipIndex % tips.length}
            className="rounded-xl border border-theme bg-theme-hero/90 p-4 sm:p-5"
          >
            <p className="text-xs font-semibold text-theme-accent mb-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
              Coach tip
            </p>
            <p className="text-sm sm:text-base text-theme-primary leading-relaxed">{tip}</p>
          </div>
          <div className="flex justify-center gap-1.5 mt-4" aria-hidden>
            {tips.map((_, i) => (
              <span
                key={`coach-tip-dot-${i}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === tipIndex % tips.length ? "w-6 bg-theme-accent" : "w-1.5 bg-theme-muted/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BehavioralCoachPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { appPath } = useTenantShell();

  const [phase, setPhase] = useState(PHASE_PICK);
  const [focus, setFocus] = useState("general");
  const [practiceId, setPracticeId] = useState("");
  const [question, setQuestion] = useState("");
  const [tip, setTip] = useState("");
  const [answerParts, setAnswerParts] = useState(EMPTY_ANSWER_PARTS);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyMode, setBusyMode] = useState(null);
  const [waitTipIndex, setWaitTipIndex] = useState(0);
  const [error, setError] = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState("");

  const focusLabel = useMemo(() => focusLabelFor(focus), [focus]);
  const answerFields = useMemo(() => fieldsForFocus(focus), [focus]);
  const whyMode = isWhyCompanyFocus(focus);
  const resultWhyMode = isWhyCompanyFocus(result?.focus || focus);

  const composedAnswer = useMemo(
    () => composeAnswer(answerParts, focus),
    [answerParts, focus]
  );
  const missingFields = useMemo(
    () => missingAnswerFields(answerParts, focus),
    [answerParts, focus]
  );
  const canSubmit =
    answerPartsReady(answerParts, focus) &&
    missingFields.length === 0 &&
    composedAnswer.trim().length >= 24;

  useEffect(() => {
    if (!busyMode) return undefined;
    setWaitTipIndex(0);
    const tips = busyMode === "evaluate" ? EVALUATE_WAIT_TIPS : GENERATE_WAIT_TIPS;
    const id = window.setInterval(() => {
      setWaitTipIndex((prev) => (prev + 1) % tips.length);
    }, 2500);
    return () => clearInterval(id);
  }, [busyMode]);

  const updateAnswerPart = (key, value) => {
    setAnswerParts((prev) => ({ ...prev, [key]: value }));
  };

  const resetToPick = () => {
    setPhase(PHASE_PICK);
    setPracticeId("");
    setQuestion("");
    setTip("");
    setAnswerParts(EMPTY_ANSWER_PARTS);
    setResult(null);
    setError("");
    setBusy(false);
    setBusyMode(null);
    setExpandedAttemptId("");
  };

  const loadAnalytics = useCallback(async () => {
    if (!user?.userId && !user?._id) return;
    setAnalyticsLoading(true);
    setError("");
    try {
      const { data } = await interviewAPI.getBehavioralCoachAnalytics({ limit: 40 });
      setAnalytics(data);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Could not load past analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user?.userId, user?._id]);

  const openAnalytics = async () => {
    setPhase(PHASE_ANALYTICS);
    setError("");
    setExpandedAttemptId("");
    await loadAnalytics();
  };

  const startPractice = async (focusOverride) => {
    if (!user?.userId && !user?._id) return;
    const nextFocus =
      typeof focusOverride === "string" && focusOverride.trim()
        ? focusOverride.trim()
        : focus;
    setBusy(true);
    setBusyMode("generate");
    setError("");
    try {
      const { data } = await interviewAPI.startBehavioralCoach({ focus: nextFocus });
      setFocus(nextFocus);
      setPracticeId(data.practiceId || "");
      setQuestion(data.question || "");
      setTip(data.tip || "");
      setAnswerParts(EMPTY_ANSWER_PARTS);
      setResult(null);
      setPhase(PHASE_ANSWER);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Could not start practice. Please try again."
      );
    } finally {
      setBusy(false);
      setBusyMode(null);
    }
  };

  const submitAnswer = async () => {
    if (!practiceId || !canSubmit) {
      setError(
        whyMode
          ? "Fill Motivation, Fit, Evidence, and Aspiration before submitting."
          : "Fill Situation, Task, Action, and Result before submitting."
      );
      return;
    }
    setBusy(true);
    setBusyMode("evaluate");
    setError("");
    try {
      const { data } = await interviewAPI.evaluateBehavioralCoach({
        practiceId,
        answer: composedAnswer,
      });
      setResult(data);
      setPhase(PHASE_FEEDBACK);
      setAnalytics(null);
    } catch (err) {
      const code = err?.response?.data?.code;
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Could not evaluate your answer. Please try again."
      );
      if (code === "PRACTICE_NOT_FOUND") {
        setPracticeId("");
        setPhase(PHASE_PICK);
      }
    } finally {
      setBusy(false);
      setBusyMode(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-theme-secondary">
        Loading…
      </div>
    );
  }

  const summary = analytics?.summary;
  const avgStar = summary?.averageStar || {};
  const pickHint = whyMode
    ? "This theme uses Motivation → Fit → Evidence → Aspiration (not STAR)."
    : "We’ll give you one HR-style prompt. Fill each STAR box, then review dimension scores.";

  return (
    <div className={pageShellOuterClassCompact}>
      <PageHeroFontStyles />
      {busyMode ? <CoachWaitOverlay mode={busyMode} tipIndex={waitTipIndex} /> : null}
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(appPath("/"))} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Practice one answer at a time — STAR for behavioral themes, Motivation/Fit for why-company — then get dimension coaching.">
          Behavioral{" "}
          <span className="italic text-theme-accent">answer coach</span>
        </PageHeroHeader>

        <div className="mx-auto max-w-3xl space-y-5">
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {phase === PHASE_PICK ? (
            <section className="rounded-2xl border border-theme bg-theme-card p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-theme-primary">Pick a theme</h2>
                  <p className="mt-1 text-sm text-theme-secondary">{pickHint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openAnalytics()}
                  className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-secondary hover:border-theme-accent/40 hover:text-theme-accent"
                >
                  Past analytics
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {FOCUS_OPTIONS.map((opt) => {
                  const active = focus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFocus(opt.id)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                        active
                          ? "border-theme-accent bg-theme-accent/10 text-theme-primary"
                          : "border-theme bg-theme-hero text-theme-secondary hover:border-theme-accent/40"
                      }`}
                    >
                      <span className="font-semibold text-theme-primary">{opt.label}</span>
                      {opt.id === "why_company" ? (
                        <span className="mt-1 block text-[11px] font-medium text-theme-secondary">
                          Motivation / fit format
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => startPractice()}
                className="rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Generating question…" : "Get a question"}
              </button>
            </section>
          ) : null}

          {phase === PHASE_ANALYTICS ? (
            <section className="rounded-2xl border border-theme bg-theme-card p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-theme-primary">Past analytics</h2>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Scores and STAR trends from your recent coach practices.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={analyticsLoading}
                    onClick={() => loadAnalytics()}
                    className="rounded-xl border border-theme px-3 py-2 text-xs font-semibold text-theme-secondary hover:text-theme-accent disabled:opacity-50"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={resetToPick}
                    className="rounded-xl border border-theme px-3 py-2 text-xs font-semibold text-theme-secondary hover:text-theme-accent"
                  >
                    Back to themes
                  </button>
                </div>
              </div>

              {analyticsLoading && !analytics ? (
                <p className="text-sm text-theme-secondary">Loading analytics…</p>
              ) : null}

              {!analyticsLoading && analytics && (summary?.totalAttempts || 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-theme px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-theme-primary">No practices yet</p>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Complete a STAR answer to see scores and theme trends here.
                  </p>
                  <button
                    type="button"
                    onClick={resetToPick}
                    className="mt-4 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Start practicing
                  </button>
                </div>
              ) : null}

              {analytics && (summary?.totalAttempts || 0) > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatTile label="Attempts" value={summary.totalAttempts} />
                    <StatTile
                      label="Avg score"
                      value={summary.averageScore}
                      suffix="/10"
                    />
                    <StatTile
                      label="Latest"
                      value={summary.latestScore}
                      suffix="/10"
                    />
                    <StatTile
                      label="Themes"
                      value={(analytics.byFocus || []).length}
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-theme-primary">
                      Average dimension strength
                    </p>
                    <div className="space-y-2">
                      {[
                        { id: "situation", label: "Situation", score: avgStar.situation },
                        { id: "task", label: "Task", score: avgStar.task },
                        { id: "action", label: "Action", score: avgStar.action },
                        { id: "result", label: "Result", score: avgStar.result },
                        { id: "reflection", label: "Reflection", score: avgStar.reflection },
                      ].map((dim) => (
                        <div
                          key={dim.id}
                          className="rounded-xl border border-theme bg-theme-hero/60 px-4 py-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-theme-primary">{dim.label}</p>
                            <span className="text-sm font-bold tabular-nums text-theme-accent">
                              {dim.score == null ? "—" : `${Math.round(dim.score)}%`}
                            </span>
                          </div>
                          <StarBar score={dim.score ?? 0} />
                          {dim.score == null ? (
                            <p className="mt-1.5 text-[11px] text-theme-secondary">
                              No scored attempts for this dimension yet
                              {dim.id === "task"
                                ? " — complete a new practice after this update"
                                : ""}
                              .
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {(analytics.byFocus || []).length > 0 ? (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-theme-primary">By theme</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {analytics.byFocus.map((row) => (
                          <div
                            key={row.focus}
                            className="rounded-xl border border-theme bg-theme-hero px-4 py-3"
                          >
                            <p className="text-sm font-semibold text-theme-primary capitalize">
                              {row.label || focusLabelFor(row.focus)}
                            </p>
                            <p className="mt-1 text-xs text-theme-secondary">
                              {row.count} attempt{row.count === 1 ? "" : "s"} · avg{" "}
                              <span className="font-semibold text-theme-accent tabular-nums">
                                {row.avgScore ?? "—"}/10
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(analytics.progress || []).length > 0 ? (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-theme-primary">
                        Score over time
                      </p>
                      <ScoreOverTimeChart progress={analytics.progress} />
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-2 text-sm font-semibold text-theme-primary">
                      Recent practices
                    </p>
                    <div className="space-y-2">
                      {(analytics.attempts || []).map((attempt) => {
                        const open = expandedAttemptId === attempt.id;
                        return (
                          <div
                            key={attempt.id}
                            className="rounded-xl border border-theme bg-theme-hero/50 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAttemptId(open ? "" : attempt.id)
                              }
                              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
                                  {focusLabelFor(attempt.focus)}
                                </p>
                                <p className="mt-1 text-sm text-theme-primary line-clamp-2">
                                  {attempt.question}
                                </p>
                                <p className="mt-1 text-[11px] text-theme-secondary">
                                  {formatAttemptDate(attempt.createdAt)}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-lg font-bold tabular-nums text-theme-primary">
                                  {attempt.score}
                                  <span className="text-xs font-medium text-theme-secondary">
                                    /10
                                  </span>
                                </p>
                                <p className="text-[11px] text-theme-secondary">
                                  {open ? "Hide" : "Details"}
                                </p>
                              </div>
                            </button>
                            {open ? (
                              <div className="space-y-3 border-t border-theme px-4 py-3">
                                {(attempt.starBreakdown || []).map((dim) => (
                                  <div key={dim.id}>
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                      <p className="text-xs font-semibold text-theme-primary flex items-center gap-1.5">
                                        {dim.weak ? (
                                          <FaExclamationTriangle className="h-3 w-3 text-amber-500" />
                                        ) : (
                                          <FaCheckCircle className="h-3 w-3 text-theme-accent" />
                                        )}
                                        {dim.label}
                                      </p>
                                      <span className="text-xs font-bold tabular-nums text-theme-accent">
                                        {dim.score}%
                                      </span>
                                    </div>
                                    <StarBar score={dim.score} />
                                  </div>
                                ))}
                                {attempt.feedback ? (
                                  <p className="text-xs text-theme-secondary leading-relaxed whitespace-pre-wrap">
                                    {attempt.feedback}
                                  </p>
                                ) : null}
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => startPractice(attempt.focus)}
                                  className="rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                >
                                  Practice this theme again
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {phase === PHASE_ANSWER ? (
            <section className="rounded-2xl border border-theme bg-theme-card p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
                  Theme · {focusLabel}
                </p>
                <button
                  type="button"
                  onClick={resetToPick}
                  className="text-xs font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  Change theme
                </button>
              </div>
              <div className="rounded-xl border border-theme bg-theme-hero px-4 py-4">
                <p className="text-sm font-semibold text-theme-secondary mb-2">Question</p>
                <p className="text-base text-theme-primary leading-relaxed whitespace-pre-wrap">
                  {question}
                </p>
                {tip ? (
                  <p className="mt-3 text-xs text-theme-accent font-medium">{tip}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                {answerFields.map((field) => (
                  <label key={field.key} className="block text-sm font-semibold text-theme-primary">
                    <span className="flex items-baseline gap-2">
                      {field.label}
                      {field.required ? (
                        <span className="text-[11px] font-medium text-theme-accent">Required</span>
                      ) : (
                        <span className="text-[11px] font-medium text-theme-secondary">Optional</span>
                      )}
                    </span>
                    <textarea
                      value={answerParts[field.key]}
                      onChange={(e) => updateAnswerPart(field.key, e.target.value)}
                      rows={field.rows}
                      maxLength={4000}
                      placeholder={field.placeholder}
                      className="mt-1.5 w-full rounded-xl border border-theme bg-theme-hero px-3 py-3 text-sm font-normal text-theme-primary outline-none focus:border-theme-accent resize-y"
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !canSubmit}
                  onClick={() => submitAnswer()}
                  className="rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Scoring…" : whyMode ? "Get fit feedback" : "Get STAR feedback"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startPractice()}
                  className="rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  New question
                </button>
              </div>
              {!canSubmit && !busy ? (
                <p className="text-xs text-theme-secondary">
                  {missingFields.length
                    ? `Add a bit more in: ${missingFields.join(", ")}.`
                    : "Write a bit more across the boxes to unlock feedback."}
                </p>
              ) : null}
            </section>
          ) : null}

          {phase === PHASE_FEEDBACK && result ? (
            <section className="rounded-2xl border border-theme bg-theme-card p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-theme-primary">
                    {resultWhyMode ? "Motivation coaching" : "STAR coaching"}
                  </h2>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Theme · {FOCUS_OPTIONS.find((o) => o.id === result.focus)?.label || focusLabel}
                  </p>
                  <p className="mt-1 text-xs text-theme-secondary">
                    Overall score is the weighted average of the dimension percentages below.
                  </p>
                </div>
                {typeof result.score === "number" ? (
                  <div className="rounded-xl border border-theme-accent/30 bg-theme-accent/10 px-4 py-2 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-accent">
                      Score
                    </p>
                    <p className="text-2xl font-bold text-theme-primary tabular-nums">
                      {result.score}
                      <span className="text-sm font-medium text-theme-secondary">/10</span>
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-theme bg-theme-hero px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-1">
                  Question
                </p>
                <p className="text-sm text-theme-primary leading-relaxed">{result.question}</p>
              </div>

              <div className="space-y-3">
                {(result.starBreakdown || []).map((dim) => (
                  <div
                    key={dim.id}
                    className={`rounded-xl border px-4 py-3 ${
                      dim.weak
                        ? "border-amber-500/35 bg-amber-500/5"
                        : "border-theme bg-theme-hero/60"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-theme-primary flex items-center gap-2">
                        {dim.weak ? (
                          <FaExclamationTriangle className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <FaCheckCircle className="h-3.5 w-3.5 text-theme-accent" />
                        )}
                        {dim.label}
                      </p>
                      <span className="text-sm font-bold tabular-nums text-theme-accent">
                        {dim.score}%
                      </span>
                    </div>
                    <StarBar score={dim.score} />
                    {dim.weak ? (
                      <p className="mt-2 text-xs text-theme-secondary leading-snug">{dim.tip}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {Array.isArray(result.coachingHints) && result.coachingHints.length > 0 ? (
                <div className="rounded-xl border border-dashed border-theme-accent/40 px-4 py-3">
                  <p className="text-sm font-semibold text-theme-primary mb-2">What to improve</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-theme-secondary">
                    {result.coachingHints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.feedback ? (
                <div>
                  <p className="text-sm font-semibold text-theme-primary mb-1.5">Detailed feedback</p>
                  <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">
                    {result.feedback}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startPractice(result.focus || focus)}
                  className="rounded-xl bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Practice again
                </button>
                <button
                  type="button"
                  onClick={() => openAnalytics()}
                  className="rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  Past analytics
                </button>
                <button
                  type="button"
                  onClick={resetToPick}
                  className="rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  Choose another theme
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
