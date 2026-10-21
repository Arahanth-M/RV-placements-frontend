import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { consumeTestEmailFeature } from "../utils/testEmailAccess.js";
import { practiceChallengeAPI } from "../utils/api";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import InterviewCodingPlatform from "./CompanyTabs/InterviewCodingPlatform.jsx";
import {
  looksLikeCppInterviewCode,
  looksLikePythonInterviewCode,
} from "../utils/cppInterviewStub.js";
import { looksLikeJavaInterviewCode } from "../utils/javaInterviewStub.js";
import { buildPreviewCodeExecutionHints } from "../utils/previewExecutionHints.js";
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

function emptyWorkspaceDraft() {
  return {
    language: "python",
    code: "",
    busy: "",
    inlineHint: "",
    lastRun: null,
    leftPanePx: 400,
  };
}

function readWorkspaceDraft(store, key) {
  return store.drafts.get(key) || emptyWorkspaceDraft();
}

function writeWorkspaceDraft(store, key, patch) {
  const next = { ...readWorkspaceDraft(store, key), ...patch };
  store.drafts.set(key, next);
  const subs = store.listeners.get(key);
  if (subs) subs.forEach((fn) => fn(next));
  return next;
}

const CODING_LANGUAGE_OPTIONS = [
  { value: "python", label: "Python 3.11" },
  { value: "cpp", label: "C++ 17" },
  { value: "java", label: "Java 17" },
];

/** Same editor hint as the AI mock interview — not a filled-in stub. */
function editorPlaceholder(language) {
  if (language === "java") {
    return "public class Solution { /* implement the required method */ }";
  }
  return "def solution(...):\n    pass";
}

function languageMismatchHint(language, code) {
  if (language === "python" && looksLikeCppInterviewCode(code)) {
    return "Python is selected but the editor looks like C++. Switch the language to C++, or replace with a Python implementation.";
  }
  if (language === "cpp" && looksLikePythonInterviewCode(code)) {
    return "C++ is selected but the editor looks like Python. Switch the language to Python, or replace with a C++ implementation.";
  }
  if (language === "cpp" && looksLikeJavaInterviewCode(code)) {
    return "C++ is selected but the editor looks like Java. Switch the language to Java, or replace with a C++ implementation.";
  }
  if (language === "java" && looksLikePythonInterviewCode(code)) {
    return "Java is selected but the editor looks like Python. Use Java that matches the Grader contract, or switch the language to Python.";
  }
  if (language === "java" && looksLikeCppInterviewCode(code)) {
    return "Java is selected but the editor looks like C++. Switch the language to C++, or replace with a Java implementation.";
  }
  if (language === "python" && looksLikeJavaInterviewCode(code)) {
    return "Python is selected but the editor looks like Java. Use Python that matches the Grader contract, or switch the language to Java.";
  }
  return "";
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

function ProblemWorkspace({
  challenge,
  problem,
  questionNumber = 1,
  questionsInRound = 1,
  onChallengeUpdate,
  workspaceStore,
  draftKey,
  active = true,
}) {
  const { user, setUser } = useAuth();
  const challengeLocked =
    user?.testEmailAccess?.active === true && user.testEmailAccess.challengeRemaining === 0;

  const initialDraft = readWorkspaceDraft(workspaceStore, draftKey);
  const [language, setLanguage] = useState(initialDraft.language);
  const [code, setCode] = useState(initialDraft.code);
  const [busy, setBusy] = useState(initialDraft.busy);
  const [inlineHint, setInlineHint] = useState(initialDraft.inlineHint);
  const [lastRun, setLastRun] = useState(initialDraft.lastRun);
  const [leftPanePx, setLeftPanePx] = useState(initialDraft.leftPanePx);
  const paneWrapRef = useRef(null);
  const splitDragRef = useRef({ active: false, startX: 0, startW: initialDraft.leftPanePx });
  const wasActiveRef = useRef(active);
  const [editorEpoch, setEditorEpoch] = useState(0);

  useEffect(() => {
    if (active && !wasActiveRef.current) setEditorEpoch((n) => n + 1);
    wasActiveRef.current = active;
  }, [active]);

  const applyDraft = useCallback((next) => {
    const draft = next || emptyWorkspaceDraft();
    setLanguage(draft.language || "python");
    setCode(draft.code || "");
    setBusy(draft.busy || "");
    setInlineHint(draft.inlineHint || "");
    setLastRun(draft.lastRun || null);
    setLeftPanePx(draft.leftPanePx || 400);
    splitDragRef.current.startW = draft.leftPanePx || 400;
  }, []);

  useEffect(() => {
    applyDraft(readWorkspaceDraft(workspaceStore, draftKey));
    let subs = workspaceStore.listeners.get(draftKey);
    if (!subs) {
      subs = new Set();
      workspaceStore.listeners.set(draftKey, subs);
    }
    subs.add(applyDraft);
    return () => {
      subs.delete(applyDraft);
    };
  }, [applyDraft, draftKey, workspaceStore]);

  const questionText = useMemo(() => {
    const title = String(problem?.title || "").trim();
    const body = String(problem?.question || "").trim();
    if (!title) return body || "Problem statement unavailable.";
    if (!body) return title;
    if (body.toLowerCase().startsWith(title.toLowerCase())) return body;
    return `${title}\n\n${body}`;
  }, [problem?.title, problem?.question]);

  const previewHints = useMemo(
    () =>
      lastRun?.mode === "submit"
        ? { summary: null, hints: [] }
        : buildPreviewCodeExecutionHints(lastRun?.execution || null),
    [lastRun]
  );

  const run = async (mode) => {
    const runKey = draftKey;
    const snapshot = readWorkspaceDraft(workspaceStore, runKey);
    if (!challenge?.id || !problem?.questionId) return;
    if (snapshot.busy) return;
    if (mode === "submit" && challengeLocked) return;
    const mismatch = languageMismatchHint(snapshot.language, snapshot.code);
    if (mismatch) {
      writeWorkspaceDraft(workspaceStore, runKey, { inlineHint: mismatch });
      return;
    }
    if (!String(snapshot.code || "").trim()) {
      writeWorkspaceDraft(workspaceStore, runKey, { inlineHint: "Write your code first." });
      return;
    }
    writeWorkspaceDraft(workspaceStore, runKey, { busy: mode, inlineHint: "" });
    try {
      const api = mode === "submit" ? practiceChallengeAPI.submit : practiceChallengeAPI.runPreview;
      const { data } = await api(challenge.id, problem.questionId, {
        code: snapshot.code,
        language: snapshot.language,
      });
      if (mode === "submit") consumeTestEmailFeature(user, setUser, "challengeRemaining");
      writeWorkspaceDraft(workspaceStore, runKey, {
        busy: "",
        lastRun: {
          mode,
          score: data.score,
          bestScore: data.bestScore,
          keptBest: Boolean(data.keptBest),
          execution: data.execution,
        },
      });
      if (data.challenge && typeof onChallengeUpdate === "function") {
        onChallengeUpdate(data.challenge);
      }
    } catch (err) {
      const d = err?.response?.data;
      if (mode === "submit" && d?.code === "TEST_EMAIL_LIMIT") {
        consumeTestEmailFeature(user, setUser, "challengeRemaining");
      }
      writeWorkspaceDraft(workspaceStore, runKey, {
        busy: "",
        inlineHint: d?.error || d?.errors?.[0] || d?.message || err?.message || "Run failed.",
      });
    }
  };

  const showBest =
    lastRun?.bestScore != null && Number(lastRun.bestScore) !== Number(lastRun.score);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
          {problem.points} pts
          {problem.topics?.length ? ` · ${problem.topics.join(" · ")}` : ""}
        </p>
        {problem.myBestScore != null ? (
          <span className="rounded-full border border-theme-accent/30 bg-theme-accent/10 px-3 py-1 text-xs font-semibold text-theme-accent">
            Best: {problem.myBestScore}/100
          </span>
        ) : null}
      </div>

      {challengeLocked ? (
        <p className="text-sm text-theme-secondary">
          This test account has already used its challenge submit.
        </p>
      ) : null}

      <InterviewCodingPlatform
        key={editorEpoch}
        questionText={questionText}
        questionUrl={problem.questionUrl || ""}
        difficulty={problem.difficulty || "medium"}
        roundType="DSA"
        questionNumber={questionNumber}
        questionsInRound={questionsInRound}
        visibleTestCases={Array.isArray(problem.visibleTestCases) ? problem.visibleTestCases : []}
        complexity={problem.complexity}
        codingFunctionSignature={problem.functionSignature || ""}
        codingStarterCode={problem.starterCode || ""}
        answerCode={code}
        onAnswerCodeChange={(next) => writeWorkspaceDraft(workspaceStore, draftKey, { code: next })}
        language={language}
        languageOptions={CODING_LANGUAGE_OPTIONS}
        onLanguageChange={(next) => {
          writeWorkspaceDraft(workspaceStore, draftKey, { language: next, inlineHint: "" });
        }}
        onRun={() => run("preview")}
        onSubmit={() => run("submit")}
        canSubmit={Boolean(String(code || "").trim()) && !busy && !challengeLocked}
        runLoading={busy === "preview"}
        submitLoading={busy === "submit"}
        disabled={Boolean(busy)}
        placeholder={editorPlaceholder(language)}
        onSubmitShortcut={() => {
          if (!challengeLocked) run("submit");
        }}
        previewExecution={lastRun?.execution || null}
        previewLoading={Boolean(busy)}
        previewHints={previewHints}
        previewRunInlineHint={inlineHint}
        onDismissPreviewHint={() => writeWorkspaceDraft(workspaceStore, draftKey, { inlineHint: "" })}
        leftPaneWidth={leftPanePx}
        paneWrapRef={paneWrapRef}
        splitDragRef={splitDragRef}
        onLeftPaneWidthChange={(next) => {
          writeWorkspaceDraft(workspaceStore, draftKey, { leftPanePx: next });
        }}
      />

      {lastRun?.score != null ? (
        <p className="text-sm text-theme-secondary">
          <span className="font-semibold text-theme-accent">
            {lastRun.mode === "submit" ? "This run" : "Preview"}: {lastRun.score}/100
          </span>
          {showBest ? (
            <span className="font-semibold text-theme-primary"> · Best: {lastRun.bestScore}/100</span>
          ) : null}
          {lastRun.keptBest ? " · Previous best kept" : ""}
        </p>
      ) : null}
    </div>
  );
}

export default function PracticeChallengesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { appPath } = useTenantShell();

  const [tab, setTab] = useState(TAB_TODAY);
  const [keepTodayMounted, setKeepTodayMounted] = useState(false);
  const [keepWeekMounted, setKeepWeekMounted] = useState(false);
  const [today, setToday] = useState(null);
  const [week, setWeek] = useState(null);
  const [weekSelectedId, setWeekSelectedId] = useState("");
  const workspaceStoreRef = useRef(null);
  if (!workspaceStoreRef.current) {
    workspaceStoreRef.current = { drafts: new Map(), listeners: new Map() };
  }
  const workspaceStore = workspaceStoreRef.current;
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
    if (tab === TAB_HISTORY) loadHistory();
  }, [tab, loadHistory]);

  useEffect(() => {
    if (tab === TAB_TODAY && today) setKeepTodayMounted(true);
    if (tab === TAB_WEEK && week) setKeepWeekMounted(true);
  }, [tab, today, week]);

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
  ];

  return (
    <div className={pageShellOuterClassCompact}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(appPath("/"))} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Daily and weekly DSA challenges scored on the platform. Run your solution, then submit to see visible and hidden tests.">
          Practice{" "}
          <span className="italic text-theme-accent">challenges</span>
        </PageHeroHeader>

        <div className="w-full space-y-5">
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

          {loading && tab !== TAB_HISTORY ? (
            <p className="text-sm text-theme-secondary">Loading challenges…</p>
          ) : null}

          {(tab === TAB_TODAY || keepTodayMounted) && today ? (
            <section
              hidden={tab !== TAB_TODAY}
              className={tab === TAB_TODAY ? "space-y-4" : "hidden"}
            >
              <p className="text-sm text-theme-secondary">
                {today.periodKey} · {formatWindow(today.opensAt, today.closesAt)}
                {today.myPoints != null ? ` · Your points today: ${today.myPoints}` : ""}
              </p>
              {todayProblem ? (
                <ProblemWorkspace
                  key={`${today.id}:${todayProblem.questionId}`}
                  challenge={today}
                  problem={todayProblem}
                  questionNumber={1}
                  questionsInRound={Math.max(1, today.problems?.length || 1)}
                  onChallengeUpdate={setToday}
                  workspaceStore={workspaceStore}
                  draftKey={`${today.id}:${todayProblem.questionId}`}
                  active={tab === TAB_TODAY}
                />
              ) : (
                <p className="text-sm text-theme-secondary">No daily problem scheduled.</p>
              )}
            </section>
          ) : null}
          {tab === TAB_TODAY && !loading && !today ? (
            <p className="text-sm text-theme-secondary">No daily challenge available.</p>
          ) : null}

          {(tab === TAB_WEEK || keepWeekMounted) && week ? (
            <section
              hidden={tab !== TAB_WEEK}
              className={tab === TAB_WEEK ? "space-y-4" : "hidden"}
            >
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
                      key={`${week.id}:${weekProblem.questionId}`}
                      challenge={week}
                      problem={weekProblem}
                      questionNumber={Math.max(
                        1,
                        (week.problems || []).findIndex((p) => p.questionId === weekProblem.questionId) + 1
                      )}
                      questionsInRound={Math.max(1, week.problems?.length || 1)}
                      onChallengeUpdate={setWeek}
                      workspaceStore={workspaceStore}
                      draftKey={`${week.id}:${weekProblem.questionId}`}
                      active={tab === TAB_WEEK}
                    />
                  ) : null}
              </>
            </section>
          ) : null}
          {tab === TAB_WEEK && !loading && !week ? (
            <p className="text-sm text-theme-secondary">No weekly challenge available.</p>
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
                Every submission is listed. Your best score is kept for each problem.
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
        </div>
      </div>
    </div>
  );
}
