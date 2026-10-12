import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaPlay, FaPaperPlane, FaFire } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { practiceChallengeAPI } from "../utils/api";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import InterviewCodeWorkspace from "./CompanyTabs/InterviewCodeWorkspace.jsx";
import {
  buildCppStubFromInterviewDraft,
  resolvePythonInterviewStub,
} from "../utils/cppInterviewStub.js";
import { getJavaGraderContractHints } from "../utils/javaInterviewStub.js";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const TAB_TODAY = "today";
const TAB_WEEK = "week";
const TAB_HISTORY = "history";
const TAB_BOARD = "board";

/**
 * Prefer per-language starter from metadata; otherwise generate a stub for that language.
 * Never reuse a Python `def ...` template for C++/Java.
 */
function starterForLanguage(starterCode, language, functionSignature = "") {
  const lang = String(language || "python").toLowerCase();

  if (starterCode != null && typeof starterCode === "object" && !Array.isArray(starterCode)) {
    const aliases = [lang, lang === "cpp" ? "c++" : "", lang === "python" ? "py" : ""].filter(
      Boolean
    );
    for (const key of aliases) {
      if (starterCode[key]) return String(starterCode[key]);
    }
  }

  const raw =
    typeof starterCode === "string"
      ? starterCode.trim()
      : "";

  if (lang === "python") {
    if (raw) return raw;
    return resolvePythonInterviewStub(starterCode, functionSignature);
  }

  // Object/string starters that are clearly Python must not be shown for cpp/java.
  if (raw && !/\bdef\s+\w+\s*\(/.test(raw)) {
    return raw;
  }

  if (lang === "cpp") {
    return buildCppStubFromInterviewDraft(functionSignature);
  }

  if (lang === "java") {
    const hints = getJavaGraderContractHints(functionSignature);
    if (hints?.kind === "design" && hints.designClassName) {
      return `public class ${hints.designClassName} {\n    // implement design operations\n}\n`;
    }
    if (hints?.kind === "function" && hints.classMethodDecl) {
      return `public class Solution {\n    ${hints.classMethodDecl} {\n        // TODO\n    }\n}\n`;
    }
    return "public class Solution {\n    // TODO\n}\n";
  }

  return raw;
}

function formatWindow(opensAt, closesAt) {
  try {
    const opts = { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" };
    const a = opensAt ? new Date(opensAt).toLocaleString("en-IN", opts) : "";
    const b = closesAt ? new Date(closesAt).toLocaleString("en-IN", opts) : "";
    if (a && b) return `${a} → ${b} IST`;
    return a || b || "";
  } catch {
    return "";
  }
}

function ResultPanel({ execution, score, bestScore, keptBest, mode }) {
  if (!execution) return null;
  const results = Array.isArray(execution.results) ? execution.results : [];
  const showBest =
    bestScore != null && Number(bestScore) !== Number(score);
  return (
    <div className="rounded-xl border border-theme bg-theme-hero/70 px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-theme-primary capitalize">{mode}</span>
        <span className="text-theme-secondary">Status: {execution.status || "—"}</span>
        {score != null ? (
          <span className="font-semibold text-theme-accent">
            {mode === "submit" ? "This run" : "Score"}: {score}/100
          </span>
        ) : null}
        {showBest ? (
          <span className="font-semibold text-theme-primary">Best: {bestScore}/100</span>
        ) : null}
        {keptBest ? (
          <span className="text-xs text-theme-secondary">
            Previous best kept (this run did not improve it)
          </span>
        ) : null}
        {execution.visiblePassedCount != null ? (
          <span className="text-theme-secondary">
            Visible passed: {execution.visiblePassedCount}
            {execution.hiddenPassedCount != null ? ` · Hidden: ${execution.hiddenPassedCount}` : ""}
          </span>
        ) : null}
      </div>
      {execution.error ? (
        <p className="text-xs text-red-600 dark:text-red-300 whitespace-pre-wrap">{execution.error}</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <li
              key={i}
              className={`text-xs rounded-lg px-2.5 py-1.5 ${
                r.passed
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/10 text-red-600 dark:text-red-300"
              }`}
            >
              {r.isHidden ? (
                <span>
                  Hidden case {i + 1}: {r.passed ? "passed" : "failed"}
                </span>
              ) : (
                <span className="break-all">
                  Case {i + 1}: {r.passed ? "passed" : "failed"}
                  {r.error ? ` — ${r.error}` : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ProblemWorkspace({ challenge, problem, onChallengeUpdate }) {
  // Always offer the full runner set (no DB metadata filter).
  const langs = useMemo(() => ["python", "cpp", "java"], []);

  const [language, setLanguage] = useState(langs[0] || "python");
  const [code, setCode] = useState(() =>
    starterForLanguage(problem?.starterCode, langs[0] || "python", problem?.functionSignature)
  );
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [lastRun, setLastRun] = useState(null);

  useEffect(() => {
    const nextLang = langs.includes(language) ? language : langs[0] || "python";
    setLanguage(nextLang);
    setCode(
      starterForLanguage(problem?.starterCode, nextLang, problem?.functionSignature)
    );
    setLastRun(null);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when problem changes
  }, [problem?.questionId]);

  const run = async (mode) => {
    if (!challenge?.id || !problem?.questionId) return;
    setBusy(mode);
    setError("");
    try {
      const api = mode === "submit" ? practiceChallengeAPI.submit : practiceChallengeAPI.runPreview;
      const { data } = await api(challenge.id, problem.questionId, { code, language });
      setLastRun({
        mode,
        score: data.score,
        bestScore: data.bestScore,
        keptBest: Boolean(data.keptBest),
        execution: data.execution,
      });
      if (data.challenge && typeof onChallengeUpdate === "function") {
        onChallengeUpdate(data.challenge);
      }
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || d?.errors?.[0] || d?.message || err?.message || "Run failed.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
              {problem.difficulty} · {problem.points} pts
            </p>
            <h3 className="mt-1 text-lg font-semibold text-theme-primary">{problem.title}</h3>
            {problem.topics?.length ? (
              <p className="mt-1 text-xs text-theme-secondary">{problem.topics.join(" · ")}</p>
            ) : null}
          </div>
          {problem.myBestScore != null ? (
            <span className="rounded-full border border-theme-accent/30 bg-theme-accent/10 px-3 py-1 text-xs font-semibold text-theme-accent">
              Best: {problem.myBestScore}/100
            </span>
          ) : null}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-theme-primary whitespace-pre-wrap text-sm leading-relaxed">
          {problem.question || "Problem statement unavailable."}
        </div>
        {problem.functionSignature ? (
          <p className="text-xs font-mono text-theme-secondary break-all">
            Signature: {problem.functionSignature}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold text-theme-primary">
            Language
            <select
              value={language}
              onChange={(e) => {
                const next = e.target.value;
                setLanguage(next);
                setCode(
                  starterForLanguage(
                    problem?.starterCode,
                    next,
                    problem?.functionSignature
                  )
                );
                setLastRun(null);
                setError("");
              }}
              className="ml-2 rounded-lg border border-theme bg-theme-hero px-2 py-1.5 text-sm font-normal"
            >
              {langs.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 ml-auto">
            <button
              type="button"
              disabled={Boolean(busy) || !code.trim()}
              onClick={() => run("preview")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-secondary hover:text-theme-accent disabled:opacity-50"
            >
              <FaPlay className="h-3 w-3" />
              {busy === "preview" ? "Running…" : "Run tests"}
            </button>
            <button
              type="button"
              disabled={Boolean(busy) || !code.trim()}
              onClick={() => run("submit")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <FaPaperPlane className="h-3 w-3" />
              {busy === "submit" ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>

        <InterviewCodeWorkspace
          key={`${problem?.questionId || "q"}:${language}`}
          value={code}
          onChange={setCode}
          language={language}
          minHeightPx={320}
          disabled={Boolean(busy)}
          onSubmitShortcut={() => run("submit")}
        />

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        ) : null}
        {lastRun ? (
          <ResultPanel
            execution={lastRun.execution}
            score={lastRun.score}
            bestScore={lastRun.bestScore}
            keptBest={lastRun.keptBest}
            mode={lastRun.mode}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function PracticeChallengesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { appPath } = useTenantShell();

  const [tab, setTab] = useState(TAB_TODAY);
  const [today, setToday] = useState(null);
  const [week, setWeek] = useState(null);
  const [weekSelectedId, setWeekSelectedId] = useState("");
  const [boardPeriod, setBoardPeriod] = useState("weekly");
  const [board, setBoard] = useState(null);
  const [me, setMe] = useState(null);
  const [historyKind, setHistoryKind] = useState("all");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryKey, setExpandedHistoryKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadChallenges = useCallback(async () => {
    if (!user?.userId && !user?._id) return;
    setLoading(true);
    setError("");
    try {
      const [todayRes, weekRes] = await Promise.all([
        practiceChallengeAPI.getToday(),
        practiceChallengeAPI.getWeek(),
      ]);
      setToday(todayRes?.data?.challenge || null);
      const weekChallenge = weekRes?.data?.challenge || null;
      setWeek(weekChallenge);
      if (weekChallenge?.problems?.length) {
        setWeekSelectedId((prev) =>
          prev && weekChallenge.problems.some((p) => p.questionId === prev)
            ? prev
            : weekChallenge.problems[0].questionId
        );
      }
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || d?.message || err?.message || "Could not load challenges.");
    } finally {
      setLoading(false);
    }
  }, [user?.userId, user?._id]);

  const loadBoard = useCallback(async () => {
    if (!user?.userId && !user?._id) return;
    setError("");
    try {
      const [boardRes, meRes] = await Promise.all([
        practiceChallengeAPI.getLeaderboard(boardPeriod),
        practiceChallengeAPI.getMyRank(boardPeriod),
      ]);
      setBoard(boardRes?.data || null);
      setMe(meRes?.data?.me || null);
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || d?.message || err?.message || "Could not load leaderboard.");
    }
  }, [user?.userId, user?._id, boardPeriod]);

  const loadHistory = useCallback(async () => {
    if (!user?.userId && !user?._id) return;
    setHistoryLoading(true);
    setError("");
    try {
      const { data } = await practiceChallengeAPI.getHistory({
        kind: historyKind === "all" ? undefined : historyKind,
        limit: 30,
      });
      setHistory(Array.isArray(data?.entries) ? data.entries : []);
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || d?.message || err?.message || "Could not load history.");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.userId, user?._id, historyKind]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  useEffect(() => {
    if (tab === TAB_BOARD) loadBoard();
  }, [tab, loadBoard]);

  useEffect(() => {
    if (tab === TAB_HISTORY) loadHistory();
  }, [tab, loadHistory]);

  const todayProblem = today?.problems?.[0] || null;
  const weekProblem =
    week?.problems?.find((p) => p.questionId === weekSelectedId) || week?.problems?.[0] || null;

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-theme-secondary">
        Loading…
      </div>
    );
  }

  const tabs = [
    { id: TAB_TODAY, label: "Today" },
    { id: TAB_WEEK, label: "This week" },
    { id: TAB_HISTORY, label: "History" },
    { id: TAB_BOARD, label: "Leaderboard" },
  ];

  return (
    <div className={pageShellOuterClassCompact}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(appPath("/"))} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Daily and weekly DSA challenges scored on the platform. Solve, submit, and see where you stand among peers.">
          Practice{" "}
          <span className="italic text-theme-accent">challenges</span>
        </PageHeroHeader>

        <div className="mx-auto max-w-4xl space-y-5">
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? "border-theme-accent bg-theme-accent/10 text-theme-primary"
                    : "border-theme text-theme-secondary hover:border-theme-accent/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && tab !== TAB_BOARD && tab !== TAB_HISTORY ? (
            <p className="text-sm text-theme-secondary">Loading challenges…</p>
          ) : null}

          {tab === TAB_TODAY && !loading ? (
            <section className="space-y-4">
              {today ? (
                <>
                  <p className="text-sm text-theme-secondary">
                    {today.periodKey} · {formatWindow(today.opensAt, today.closesAt)}
                    {today.myPoints != null ? ` · Your points today: ${today.myPoints}` : ""}
                  </p>
                  {todayProblem ? (
                    <ProblemWorkspace
                      challenge={today}
                      problem={todayProblem}
                      onChallengeUpdate={setToday}
                    />
                  ) : (
                    <p className="text-sm text-theme-secondary">No daily problem scheduled.</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-theme-secondary">No daily challenge available.</p>
              )}
            </section>
          ) : null}

          {tab === TAB_WEEK && !loading ? (
            <section className="space-y-4">
              {week ? (
                <>
                  <p className="text-sm text-theme-secondary">
                    Week {week.periodKey} · Solved {week.mySolvedCount}/{week.problemCount} ·{" "}
                    {week.myPoints ?? 0} pts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(week.problems || []).map((p, idx) => (
                      <button
                        key={p.questionId}
                        type="button"
                        onClick={() => setWeekSelectedId(p.questionId)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                          weekSelectedId === p.questionId
                            ? "border-theme-accent bg-theme-accent/10"
                            : "border-theme bg-theme-card hover:border-theme-accent/40"
                        }`}
                      >
                        <span className="font-semibold text-theme-primary">
                          #{idx + 1} {p.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-theme-secondary">
                          {p.difficulty}
                          {p.myBestScore != null ? ` · ${p.myBestScore}/100` : " · not tried"}
                        </span>
                      </button>
                    ))}
                  </div>
                  {weekProblem ? (
                    <ProblemWorkspace
                      challenge={week}
                      problem={weekProblem}
                      onChallengeUpdate={setWeek}
                    />
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-theme-secondary">No weekly challenge available.</p>
              )}
            </section>
          ) : null}

          {tab === TAB_HISTORY ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-semibold text-theme-primary">
                  Show
                  <select
                    value={historyKind}
                    onChange={(e) => setHistoryKind(e.target.value)}
                    className="ml-2 rounded-lg border border-theme bg-theme-hero px-2 py-1.5 text-sm font-normal"
                  >
                    <option value="all">All</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => loadHistory()}
                  className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  Refresh
                </button>
              </div>
              <p className="text-xs text-theme-secondary">
                Every submission is listed. Leaderboard points still use your best score per problem.
              </p>
              {historyLoading ? (
                <p className="text-sm text-theme-secondary">Loading history…</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-theme-secondary">
                  No past submissions yet. Solve a daily or weekly challenge to build history.
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.challengeId}
                      className="rounded-2xl border border-theme bg-theme-card overflow-hidden"
                    >
                      <div className="border-b border-theme bg-theme-hero/50 px-4 py-3">
                        <p className="text-sm font-semibold text-theme-primary capitalize">
                          {entry.kind} · {entry.periodKey}
                        </p>
                        <p className="text-xs text-theme-secondary mt-0.5">
                          {formatWindow(entry.opensAt, entry.closesAt)}
                          {entry.myPoints != null ? ` · Best total ${entry.myPoints} pts` : ""}
                        </p>
                      </div>
                      <ul className="divide-y divide-theme">
                        {(entry.problems || []).map((p) => {
                          const problemKey = `${entry.challengeId}:${p.questionId}`;
                          const submissions = Array.isArray(p.submissions) ? p.submissions : [];
                          return (
                            <li key={problemKey} className="px-4 py-3 space-y-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-theme-primary">{p.title}</p>
                                <p className="text-xs text-theme-secondary mt-0.5">
                                  {p.difficulty || "—"} · Best {p.bestScore ?? 0}/100 ·{" "}
                                  {p.submissionCount ?? submissions.length} submission
                                  {(p.submissionCount ?? submissions.length) === 1 ? "" : "s"}
                                </p>
                              </div>
                              <ul className="space-y-2">
                                {submissions.map((s, idx) => {
                                  const key = s.attemptId || `${problemKey}:${idx}`;
                                  const open = expandedHistoryKey === key;
                                  const isBest =
                                    Number(s.score) === Number(p.bestScore) &&
                                    Number(p.bestScore) > 0;
                                  return (
                                    <li
                                      key={key}
                                      className="rounded-xl border border-theme bg-theme-hero/40 px-3 py-2"
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedHistoryKey((prev) =>
                                            prev === key ? "" : key
                                          )
                                        }
                                        className="flex w-full items-start justify-between gap-3 text-left"
                                      >
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-theme-primary">
                                            Attempt #{submissions.length - idx}
                                            {isBest ? " · best" : ""} · {s.score}/100 ·{" "}
                                            {s.language}
                                          </p>
                                          <p className="text-[11px] text-theme-secondary mt-0.5">
                                            {s.submittedAt
                                              ? new Date(s.submittedAt).toLocaleString("en-IN", {
                                                  timeZone: "Asia/Kolkata",
                                                  dateStyle: "medium",
                                                  timeStyle: "short",
                                                })
                                              : "—"}
                                          </p>
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold text-theme-accent">
                                          {open ? "Hide code" : "View code"}
                                        </span>
                                      </button>
                                      {open ? (
                                        <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-theme bg-theme-card p-3 text-xs font-mono text-theme-primary whitespace-pre-wrap">
                                          {s.code?.trim()
                                            ? s.code
                                            : "// No code saved for this attempt"}
                                        </pre>
                                      ) : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {tab === TAB_BOARD ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-semibold text-theme-primary">
                  Period
                  <select
                    value={boardPeriod}
                    onChange={(e) => setBoardPeriod(e.target.value)}
                    className="ml-2 rounded-lg border border-theme bg-theme-hero px-2 py-1.5 text-sm font-normal"
                  >
                    <option value="daily">Today</option>
                    <option value="weekly">This week</option>
                    <option value="all">All time</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => loadBoard()}
                  className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-accent"
                >
                  Refresh
                </button>
              </div>

              {me ? (
                <div className="rounded-2xl border border-theme-accent/35 bg-theme-accent/5 px-4 py-4 flex flex-wrap items-center gap-4">
                  <FaTrophy className="h-6 w-6 text-theme-accent" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-theme-primary">Your standing</p>
                    <p className="text-sm text-theme-secondary">
                      Rank {me.rank ?? "—"}
                      {me.percentile != null ? ` · Top ${me.percentile}%` : ""} · {me.points} pts
                      {me.currentStreak > 0 ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-theme-accent">
                          <FaFire className="h-3 w-3" />
                          {me.currentStreak}-day streak
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-theme bg-theme-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-theme-hero text-left text-xs uppercase tracking-wider text-theme-secondary">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Rank</th>
                      <th className="px-4 py-3 font-semibold">Student</th>
                      <th className="px-4 py-3 font-semibold">Points</th>
                      <th className="px-4 py-3 font-semibold hidden sm:table-cell">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(board?.entries || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-theme-secondary">
                          No submissions on the board yet. Be the first.
                        </td>
                      </tr>
                    ) : (
                      (board.entries || []).map((row) => (
                        <tr
                          key={row.userId}
                          className="border-t border-theme text-theme-primary"
                        >
                          <td className="px-4 py-2.5 font-semibold">{row.rank}</td>
                          <td className="px-4 py-2.5">{row.displayName || "Student"}</td>
                          <td className="px-4 py-2.5">{row.points}</td>
                          <td className="px-4 py-2.5 hidden sm:table-cell text-theme-secondary">
                            {row.currentStreak || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
