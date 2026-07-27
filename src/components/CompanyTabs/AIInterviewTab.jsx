import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../utils/AuthContext";
import { useTheme } from "../../utils/ThemeContext";
import { interviewAPI } from "../../utils/api";
import { MESSAGES } from "../../utils/constants";
import { FaChevronDown, FaMoon, FaSpinner, FaSun } from "react-icons/fa";
import rvLogo from "../../assets/logo2.webp";
import InterviewCodingPlatform from "./InterviewCodingPlatform";
import ThemedSelect from "../ThemedSelect.jsx";
import InterviewLimitModal from "../InterviewLimitModal";
import {
  looksLikeCppInterviewCode,
  looksLikePythonInterviewCode,
} from "../../utils/cppInterviewStub";
import { looksLikeJavaInterviewCode } from "../../utils/javaInterviewStub.js";
import { buildPreviewCodeExecutionHints } from "../../utils/previewExecutionHints";
import {
  getDefaultFocusForRoundType,
  getFocusOptionsForRoundType,
  roundTypeHasFocusPicker,
} from "../../constants/interviewRoundFocus";
import { clampInterviewQuestionCountForRound } from "../../utils/interviewRoundLimits";
import InterviewSlotBookModal from "../InterviewSlotBookModal";

/** Languages shown in the mock-interview coding picker (backend may still support more). */
const INTERVIEW_UI_CODING_LANGUAGES = ["python", "cpp", "java"];

function filterInterviewUiCodingLanguages(langs) {
  const allowed = new Set(INTERVIEW_UI_CODING_LANGUAGES);
  const filtered = (Array.isArray(langs) ? langs : []).filter((l) => allowed.has(l));
  return filtered.length > 0 ? filtered : [...INTERVIEW_UI_CODING_LANGUAGES];
}

/** Display labels with runtime versions — aligned with backend `executeCode.js` default images. */
const CODING_LANGUAGE_OPTION_LABELS = {
  python: "Python 3.11",
  cpp: "C++ 17",
  java: "Java 17",
};

const EXIT_WARNING_MESSAGE =
  "Are you sure you want to quit this interview?\n\nIf you exit now, your current interview will be discarded, your progress will not be saved, and you will be returned to this company's General tab.";

const MAX_CUSTOM_ROUNDS = 4;
const ROUND_TYPE_OPTIONS = [
  "DSA",
  "System Design",
  "SQL",
  "CS Fundamentals",
  "HR",
];
const ROUND_DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];

const PLAN_ROUND_ROW_CLASS =
  "grid grid-cols-1 min-w-0 gap-3 items-center rounded-lg border-2 border-theme p-3 bg-theme-input";

const buildDefaultCustomRounds = (count = 2) =>
  Array.from({ length: Math.min(MAX_CUSTOM_ROUNDS, Math.max(1, Number(count) || 1)) }, () => ({
    type: "DSA",
    difficulty: "medium",
  }));

const isIgnorableDiscardError = (err) => {
  const status =
    err?.response?.status ??
    err?.status ??
    err?.cause?.response?.status ??
    null;
  const errorMessage =
    err?.response?.data?.error ||
    err?.message ||
    err?.cause?.message ||
    "";

  return (
    status === 404 ||
    String(errorMessage).toLowerCase().includes("no in-progress session found")
  );
};

const toDisplayCorrectness = (value) => {
  const safe = String(value || "").trim().toLowerCase();
  return ["correct", "partial", "incorrect"].includes(safe) ? safe : null;
};

const toDisplayRelevance = (value) => {
  const safe = String(value || "").trim().toLowerCase();
  return ["relevant", "irrelevant"].includes(safe) ? safe : null;
};

/** Parse MCQ feedback from API trace or legacy feedback string. */
function buildMcqFeedbackFromStatus(st) {
  const api = st?.lastMcqFeedback;
  if (api && typeof api === "object") {
    return {
      selectedOptionId: String(api.selectedOptionId || "").trim().toUpperCase() || null,
      correctOptionId: String(api.correctOptionId || "").trim().toUpperCase() || null,
      selectedOptionText: String(api.selectedOptionText || "").trim(),
      correctOptionText: String(api.correctOptionText || "").trim(),
      reason: String(api.reason || "").trim(),
      explanation: String(api.explanation || "").trim(),
      verdict: String(api.verdict || st?.lastCorrectness || "").trim().toLowerCase() || null,
    };
  }

  const feedback = String(st?.lastFeedback || "").trim();
  if (!feedback) return null;
  const isMcqLike =
    /Correct \([A-F]\)/i.test(feedback) ||
    /You selected [A-F]/i.test(feedback) ||
    /correct answer is [A-F]/i.test(feedback);
  if (!isMcqLike) return null;

  const selectedOptionId =
    String(st?.lastAnswer || "")
      .trim()
      .toUpperCase() ||
    feedback.match(/You selected ([A-F])/i)?.[1]?.toUpperCase() ||
    null;
  const correctOptionId =
    feedback.match(/correct answer is ([A-F])/i)?.[1]?.toUpperCase() ||
    feedback.match(/Correct \(([A-F])\)/i)?.[1]?.toUpperCase() ||
    null;

  let reason = "";
  let explanation = "";
  if (/^Incorrect\./i.test(feedback)) {
    const tail = feedback.split(/correct answer is [A-F](?: \([^)]*\))?\.\s*/i)[1];
    reason = String(tail || "").trim();
  } else if (/^Correct \(/i.test(feedback)) {
    explanation = feedback.replace(/^Correct \([A-F]\)\.\s*/i, "").trim();
  }

  return {
    selectedOptionId,
    correctOptionId,
    selectedOptionText: "",
    correctOptionText: "",
    reason,
    explanation,
    verdict: String(st?.lastCorrectness || "").trim().toLowerCase() || null,
  };
}

function McqOptionGrid({ options, selectedOptionId, onSelect, disabled, namePrefix }) {
  const safeOptions = (Array.isArray(options) ? options : [])
    .map((opt) => ({
      id: String(opt?.id || "").trim().toUpperCase(),
      text: String(opt?.text || "").trim(),
    }))
    .filter((opt) => opt.id && opt.text);

  if (safeOptions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {safeOptions.map((opt) => {
        const checked = selectedOptionId === opt.id;
        const inputId = `${namePrefix}-${opt.id}`;
        return (
          <label
            key={opt.id}
            htmlFor={inputId}
            className={[
              "relative flex min-h-[5.5rem] cursor-pointer flex-col rounded-xl border-2 p-4 pt-12 transition-all duration-150",
              checked
                ? "border-theme-accent bg-theme-accent/12 shadow-[0_0_0_1px_var(--accent)]"
                : "border-theme bg-theme-input hover:border-theme-accent/55 hover:bg-theme-card/40",
              disabled ? "pointer-events-none opacity-60" : "",
            ].join(" ")}
          >
            <input
              id={inputId}
              type="radio"
              name={namePrefix}
              value={opt.id}
              checked={checked}
              onChange={() => onSelect(opt.id)}
              disabled={disabled}
              className="sr-only"
            />
            <span
              className={[
                "absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 text-sm font-bold tabular-nums",
                checked
                  ? "border-theme-accent bg-theme-accent text-white"
                  : "border-theme bg-theme-card text-theme-primary",
              ].join(" ")}
              aria-hidden
            >
              {opt.id}
            </span>
            <span className="text-sm leading-snug text-theme-primary">{opt.text}</span>
          </label>
        );
      })}
    </div>
  );
}

function McqAnswerFeedbackPanel({ mcqFeedback, correctness, fallbackFeedback = "" }) {
  if (!mcqFeedback) return null;

  const verdict = String(mcqFeedback.verdict || correctness || "").toLowerCase();
  const isCorrect = verdict === "correct";
  const isIncorrect = verdict === "incorrect";
  const selectedId = String(mcqFeedback.selectedOptionId || "").trim().toUpperCase();
  const correctId = String(mcqFeedback.correctOptionId || "").trim().toUpperCase();
  const reason = String(mcqFeedback.reason || "").trim();
  const explanation = String(mcqFeedback.explanation || "").trim();
  const selectedText = String(mcqFeedback.selectedOptionText || "").trim();
  const correctText = String(mcqFeedback.correctOptionText || "").trim();

  return (
    <div className="space-y-4">
      <div
        className={[
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          isCorrect
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : isIncorrect
              ? "border-amber-500/45 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              : "border-theme bg-theme-input text-theme-secondary",
        ].join(" ")}
      >
        {isCorrect ? "Correct answer" : isIncorrect ? "Incorrect answer" : "MCQ result"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-theme bg-theme-input p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-muted mb-2">
            Your choice
          </p>
          {selectedId ? (
            <>
              <p className="text-lg font-bold text-theme-primary tabular-nums">Option {selectedId}</p>
              {selectedText ? (
                <p className="mt-1 text-sm text-theme-secondary leading-snug">{selectedText}</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-theme-muted">No option selected</p>
          )}
        </div>
        <div className="rounded-xl border-2 border-theme-accent/40 bg-theme-accent/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-muted mb-2">
            Correct answer
          </p>
          {correctId ? (
            <>
              <p className="text-lg font-bold text-theme-accent tabular-nums">Option {correctId}</p>
              {correctText ? (
                <p className="mt-1 text-sm text-theme-secondary leading-snug">{correctText}</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-theme-muted">—</p>
          )}
        </div>
      </div>

      {isIncorrect && reason ? (
        <div className="rounded-xl border-2 border-amber-500/35 bg-amber-500/8 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200 mb-2">
            Why this was wrong
          </p>
          <p className="text-sm sm:text-base text-theme-primary leading-relaxed">{reason}</p>
        </div>
      ) : null}

      {explanation && (isCorrect || !reason || explanation !== reason) ? (
        <div className="rounded-xl border border-theme bg-theme-input/80 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-muted mb-2">
            {isCorrect ? "Explanation" : "Learn more"}
          </p>
          <p className="text-sm sm:text-base text-theme-secondary leading-relaxed">{explanation}</p>
        </div>
      ) : null}

      {!reason && !explanation && String(fallbackFeedback || "").trim() ? (
        <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">
          {fallbackFeedback}
        </p>
      ) : null}
    </div>
  );
}

/** DSA / code-execution round summary stats from backend `roundFeedback.dsaRoundStats`. */
const normalizeDsaRoundStatsFromFeedback = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const totalQuestions = Number(raw.totalQuestions);
  const answeredCorrectly = Number(raw.answeredCorrectly);
  const partiallyAnswered = Number(raw.partiallyAnswered);
  const notAnswered = Number(raw.notAnswered);
  if (
    !Number.isFinite(totalQuestions) ||
    !Number.isFinite(answeredCorrectly) ||
    !Number.isFinite(partiallyAnswered) ||
    !Number.isFinite(notAnswered)
  ) {
    return null;
  }
  return { totalQuestions, answeredCorrectly, partiallyAnswered, notAnswered };
};

const normalizeTopicsCoveredFromFeedback = (raw) => {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((t) => String(t || "").trim()).filter(Boolean))];
};

function getFullscreenElement() {
  if (typeof document === "undefined") return null;
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

async function exitFullscreenCompat() {
  if (typeof document === "undefined") return;
  const doc = document;
  if (!getFullscreenElement()) return;
  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  } catch (err) {
    console.warn("Fullscreen exit failed:", err);
  }
}

/** Per-round summary payload from interview-status `roundFeedback` (used for DSA + non-DSA round modals). */
const buildDeferredRoundSummaryFromStatus = (st) => {
  if (!st || typeof st !== "object") return null;
  return {
    score: typeof st?.roundFeedback?.score === "number" ? st.roundFeedback.score : null,
    strengths: st?.roundFeedback?.strengths || [],
    weaknesses: st?.roundFeedback?.weaknesses || [],
    summary: st?.roundFeedback?.summary || "",
    improvementTips: st?.roundFeedback?.improvementTips || [],
    dsaRoundStats: normalizeDsaRoundStatsFromFeedback(st?.roundFeedback?.dsaRoundStats),
    topicsCoveredThisRound: normalizeTopicsCoveredFromFeedback(
      st?.roundFeedback?.topicsCoveredThisRound
    ),
    nextRoundAvailable: Boolean(st?.nextRoundAvailable),
  };
};

const previewValueLane = (label, value) => {
  const kind =
    value === null ? "null" : value === undefined ? "undefined" : Array.isArray(value) ? "array" : typeof value;
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    serialized = String(value);
  }
  return { label, kind, serialized };
};

/** True when interview-status included an execution summary for DSA / code_execution. */
function isCodeExecutionSummaryPayload(summary) {
  return (
    summary &&
    typeof summary === "object" &&
    Number.isFinite(Number(summary.totalCount)) &&
    Number(summary.totalCount) >= 0
  );
}

function normalizePostSubmitTestCaseRow(row, idx) {
  const passed = Boolean(row.passed);
  const base = {
    caseNumber: Number(row.caseNumber) > 0 ? Number(row.caseNumber) : idx + 1,
    passed,
  };
  if (passed) return base;
  return {
    ...base,
    input: row.input ?? null,
    expectedOutput: row.expectedOutput ?? null,
    actualOutput: row.actualOutput ?? null,
    error: typeof row.error === "string" ? row.error : "",
  };
}

/** Hidden testcase rows from post-submit `lastCodeExecutionSummary`. */
function normalizeHiddenTestResultsFromSummary(summary) {
  if (!summary || typeof summary !== "object") return [];
  const rows = Array.isArray(summary.hiddenTestResults) ? summary.hiddenTestResults : [];
  const normalized = rows
    .filter((row) => row && typeof row === "object")
    .map((row, idx) => normalizePostSubmitTestCaseRow(row, idx));
  if (normalized.length > 0) return normalized;

  const total = Math.max(0, Number(summary.hiddenTotalCount) || 0);
  const passed = Math.max(0, Number(summary.hiddenPassedCount) || 0);
  if (total <= 0) return [];
  if (passed === total) {
    return Array.from({ length: total }, (_, i) => ({ caseNumber: i + 1, passed: true }));
  }
  if (passed === 0) {
    return Array.from({ length: total }, (_, i) => ({ caseNumber: i + 1, passed: false }));
  }
  return Array.from({ length: total }, (_, i) => ({
    caseNumber: i + 1,
    passed: i < passed,
  }));
}

function normalizeFailedVisibleTestsFromSummary(summary) {
  if (!summary || typeof summary !== "object") return [];
  const rows = Array.isArray(summary.failedTests) ? summary.failedTests : [];
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row, idx) => normalizePostSubmitTestCaseRow({ ...row, passed: false }, idx));
}

function formatPostSubmitTestValue(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function PostSubmitFailedTestCaseDetails({ row }) {
  const expLane = previewValueLane("Expected", row.expectedOutput);
  const actLane = previewValueLane("Actual", row.actualOutput);
  return (
    <div className="mt-2 space-y-1.5 border-t border-theme/60 pt-2">
      <p className="text-theme-secondary whitespace-pre-wrap break-words">
        Input: {formatPostSubmitTestValue(row.input)}
      </p>
      <p className="text-theme-secondary whitespace-pre-wrap break-words">
        {expLane.label}: {expLane.serialized}
      </p>
      <p className="text-theme-secondary whitespace-pre-wrap break-words">
        {actLane.label} ({actLane.kind}): {actLane.serialized}
      </p>
      {row.error ? (
        <p className="text-[11px] text-status-danger whitespace-pre-wrap break-words">
          Error: {row.error}
        </p>
      ) : null}
      {!row.error ? (
        <p className="text-[10px] text-theme-muted leading-snug">
          Output did not match expected (strict JSON / equality). Check types, nesting, and list order.
        </p>
      ) : null}
    </div>
  );
}

function PostSubmitTestCaseResultsList({
  title,
  caseLabelPrefix,
  testResults,
  className = "",
}) {
  if (!Array.isArray(testResults) || testResults.length === 0) return null;
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <p className="text-xs font-semibold text-theme-primary">{title}</p>
      <div className="space-y-2">
        {testResults.map((row) => {
          const passed = Boolean(row.passed);
          return (
            <div
              key={`${caseLabelPrefix}-${row.caseNumber}`}
              className={`rounded-lg border p-2.5 text-xs transition-colors ${
                passed ? "ui-test-result-pass" : "ui-test-result-fail"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-theme-primary font-semibold">
                  {caseLabelPrefix} {row.caseNumber}
                </p>
                <span className={passed ? "status-pill-success" : "status-pill-danger"}>
                  {passed ? "Passed" : "Failed"}
                </span>
              </div>
              {!passed ? <PostSubmitFailedTestCaseDetails row={row} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HiddenTestCaseResultsList({ hiddenTestResults, className = "" }) {
  return (
    <PostSubmitTestCaseResultsList
      title="Hidden testcases"
      caseLabelPrefix="Hidden case"
      testResults={hiddenTestResults}
      className={className}
    />
  );
}

function FailedVisibleTestCaseResultsList({ failedTests, className = "" }) {
  return (
    <PostSubmitTestCaseResultsList
      title="Failed visible testcases"
      caseLabelPrefix="Case"
      testResults={failedTests}
      className={className}
    />
  );
}

/** Backend round.type or derive from session.rounds + currentRound (1-based). */
function deriveRoundTypeFromPayload(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (payload.roundType != null && String(payload.roundType).trim() !== "") {
    return String(payload.roundType).trim();
  }
  const rounds = payload.rounds;
  if (!Array.isArray(rounds) || rounds.length === 0) return "";
  const cr = Number(payload.currentRound);
  let idx =
    Number.isFinite(cr) && cr >= 1 ? cr - 1 : Number(payload.currentRoundIndex);
  if (!Number.isFinite(idx) || idx < 0) idx = 0;
  idx = Math.min(Math.max(0, idx), rounds.length - 1);
  const t = rounds[idx]?.type;
  return t ? String(t).trim() : "";
}

/** Whether UI should show the coding workspace (DSA / coding rounds only). SQL is theoretical (LLM), not sandbox execution. */
function isCodingInterviewRound(roundTypeLabel) {
  const s = String(roundTypeLabel || "").trim().toLowerCase();
  if (!s) return false;
  if (s.includes("system design")) return false;
  if (s.includes("hr") || s.includes("behavior")) return false;
  return (
    s.includes("dsa") ||
    s.includes("coding") ||
    s.includes("algorithm") ||
    s.includes("data structure") ||
    s.includes("/coding")
  );
}

/**
 * SQL-query round semantics (stdin/stdout rules differ). Uses word-ish tokens —
 * naive `.includes("sql")` is wrong for labels like "MySQL" → false-positive "sql".
 */
function labelIndicatesSqlRound(roundTypeLabel) {
  const raw = String(roundTypeLabel || "").trim();
  if (!raw) return false;
  const x = raw.toLowerCase();
  return (
    /\bsql\b/.test(x) ||
    /\bmysql\b/.test(x) ||
    /\bmariadb\b/.test(x) ||
    /\bpostgres\b/.test(x) ||
    /\bpostgresql\b/.test(x) ||
    /\bsqlite\b/.test(x)
  );
}

/** Planned question counts per round (mirrors backend interview-status shape). */
function deriveRoundsQuestionSummary(rounds) {
  if (!Array.isArray(rounds)) return [];
  return rounds.map((r, idx) => {
    const roundNumber = typeof r.roundNumber === "number" ? r.roundNumber : idx + 1;
    const slots = Array.isArray(r.questions) ? r.questions.length : 0;
    const questionCount = clampInterviewQuestionCountForRound(r.type, r.questionCount, slots);
    return { roundNumber, questionCount };
  });
}

/** Single blob sent to the API: prose-only rounds use explanation; coding rounds send code only. */
function buildInterviewSubmissionAnswer(explanation, code, isCodingRound) {
  const ex = String(explanation ?? "").trim();
  const co = String(code ?? "").trim();
  if (!isCodingRound) return ex;
  return co;
}

/** Progressive reveal for interview question copy (caret hides when complete). */
function useTypewriterText(fullText, active) {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!active) {
      setOut("");
      return undefined;
    }
    const full = String(fullText ?? "");
    if (!full) {
      setOut("");
      return undefined;
    }

    let cancelled = false;
    let i = 0;
    const timeoutIds = [];
    setOut("");

    const schedule = (fn, delay) => {
      const id = window.setTimeout(fn, delay);
      timeoutIds.push(id);
      return id;
    };

    const tick = () => {
      if (cancelled) return;
      const pace = full.length > 900 ? 5 : full.length > 350 ? 3 : 2;
      const delay = full.length > 900 ? 14 : full.length > 350 ? 18 : 22;
      i = Math.min(i + pace, full.length);
      setOut(full.slice(0, i));
      if (i < full.length) schedule(tick, delay);
    };

    schedule(tick, 100);

    return () => {
      cancelled = true;
      timeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, [fullText, active]);

  return out;
}

function InterviewQuestionSourceLink({ url }) {
  const href = String(url || "").trim();
  if (!href || !/^https?:\/\//i.test(href)) return null;
  return (
    <p className="mt-3 text-sm text-theme-secondary">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-theme-accent font-medium underline underline-offset-2 decoration-theme-accent/50 hover:decoration-theme-accent break-all"
      >
        Problem reference (opens in new tab)
      </a>
    </p>
  );
}

function normalizeQuestionComplexityPayload(raw) {
  if (raw == null || typeof raw !== "object") return null;
  const time = raw.time != null ? String(raw.time).trim() : "";
  const space = raw.space != null ? String(raw.space).trim() : "";
  if (!time && !space) return null;
  return {
    ...(time ? { time } : {}),
    ...(space ? { space } : {}),
  };
}

function formatQuestionComplexityLine(complexity) {
  const c = normalizeQuestionComplexityPayload(complexity);
  if (!c) return "";
  const parts = [];
  if (c.time) parts.push(`Time ${c.time}`);
  if (c.space) parts.push(`Space ${c.space}`);
  return parts.join(" · ");
}

const metaChipButtonClass =
  "inline-flex max-w-full min-w-0 items-center gap-2 rounded-lg border border-theme-input bg-theme-card/90 px-2.5 py-2 text-left text-xs text-theme-primary shadow-sm transition-colors hover:border-theme-accent/60 hover:bg-theme-input focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent";

const metaLabelClass =
  "shrink-0 text-[11px] font-semibold uppercase tracking-wide text-theme-muted whitespace-nowrap";

/** Clickable chip: summary on the button; full detail in a dropdown panel. */
function InterviewMetaDropdownChip({ id, label, summary, isOpen, onToggle, children }) {
  const emptySummary = !summary || String(summary).trim() === "";
  if (emptySummary) return null;
  return (
    <div className="relative max-w-full shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(id);
        }}
        className={metaChipButtonClass}
      >
        <span className={metaLabelClass}>{label}</span>
        <span className="min-w-0 max-w-[11rem] truncate font-medium text-theme-secondary sm:max-w-[14rem]">
          {emptySummary ? "—" : summary}
        </span>
        <FaChevronDown
          className={`h-3 w-3 shrink-0 text-theme-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {isOpen && !emptySummary ? (
        <div
          className="absolute left-0 z-[85] mt-1.5 min-w-[14rem] max-w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-theme bg-theme-card py-2.5 px-3 shadow-xl ring-1 ring-black/5 dark:ring-white/10"
          role="dialog"
          aria-label={label}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Complexity, topics, and company tags as clickable chips with dropdown detail. */
function InterviewQuestionMetaRow({
  complexity,
  topics,
  subtopics,
  companyTags,
  variant = "inline",
  /** When true, company chip is omitted (e.g. non-DSA interview questions). */
  hideCompanyTags = false,
}) {
  const [openKey, setOpenKey] = useState(null);
  const rootRef = useRef(null);

  const listT = Array.isArray(topics) ? topics : [];
  const listS = Array.isArray(subtopics) ? subtopics : [];
  const listC = Array.isArray(companyTags) ? companyTags : [];
  const complexityLine = formatQuestionComplexityLine(complexity);
  const hasTopics = listT.length > 0 || listS.length > 0;
  const hasCompany = listC.length > 0;

  const topicEntries = useMemo(
    () => [
      ...listT.map((text, i) => ({ key: `topic-${i}`, text })),
      ...listS.map((text, i) => ({ key: `sub-${i}`, text })),
    ],
    [listT, listS]
  );

  const companyEntries = useMemo(
    () => listC.map((text, i) => ({ key: `co-${i}`, text })),
    [listC]
  );

  useEffect(() => {
    if (!openKey) return undefined;
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenKey(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openKey]);

  if (!complexityLine && !hasTopics && (hideCompanyTags || !hasCompany)) return null;

  const shell =
    variant === "hero"
      ? "mt-4 pt-4 border-t border-theme"
      : "mt-3 pt-3 border-t border-theme";

  const topicSummary = hasTopics
    ? topicEntries.length === 1
      ? topicEntries[0].text
      : `${topicEntries[0].text} +${topicEntries.length - 1}`
    : "";

  const companySummary = hasCompany
    ? companyEntries.length === 1
      ? companyEntries[0].text
      : `${companyEntries[0].text} +${companyEntries.length - 1}`
    : "";

  const toggleKey = (id) => {
    setOpenKey((prev) => (prev === id ? null : id));
  };

  return (
    <div
      ref={rootRef}
      className={`${shell} flex flex-wrap items-center gap-2 sm:gap-2.5`}
      role="group"
      aria-label="Question metadata"
    >
      <InterviewMetaDropdownChip
        id="complexity"
        label="Complexity"
        summary={complexityLine}
        isOpen={openKey === "complexity"}
        onToggle={toggleKey}
      >
        <p className="text-xs font-semibold text-theme-primary mb-1.5">Expected complexity</p>
        <p className="text-xs text-theme-secondary whitespace-pre-wrap leading-relaxed">{complexityLine}</p>
      </InterviewMetaDropdownChip>

      <InterviewMetaDropdownChip
        id="topics"
        label="Topics"
        summary={topicSummary}
        isOpen={openKey === "topics"}
        onToggle={toggleKey}
      >
        <p className="text-xs font-semibold text-theme-primary mb-1.5">Topics & subtopics</p>
        <ul className="max-h-48 overflow-y-auto space-y-1 pl-3 text-xs text-theme-secondary list-disc">
          {topicEntries.map(({ key, text }) => (
            <li key={key} className="leading-snug">
              {text}
            </li>
          ))}
        </ul>
      </InterviewMetaDropdownChip>

      {!hideCompanyTags ? (
        <InterviewMetaDropdownChip
          id="company"
          label="Company"
          summary={companySummary}
          isOpen={openKey === "company"}
          onToggle={toggleKey}
        >
          <p className="text-xs font-semibold text-theme-primary mb-1.5">Company tags</p>
          <ul className="max-h-48 overflow-y-auto space-y-1 pl-3 text-xs text-theme-secondary list-disc">
            {companyEntries.map(({ key, text }) => (
              <li key={key} className="leading-snug">
                {text}
              </li>
            ))}
          </ul>
        </InterviewMetaDropdownChip>
      ) : null}
    </div>
  );
}

function AIInterviewTab({
  company,
  onInterviewLockChange,
  onForceExitToGeneral,
  registerInterviewExitHandler,
}) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [questionUrl, setQuestionUrl] = useState("");
  const [answerExplanation, setAnswerExplanation] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const [_feedback, setFeedback] = useState("");
  const [_score, setScore] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roundsPlan, setRoundsPlan] = useState([]);
  const [roundsDetails, setRoundsDetails] = useState([]);
  const [currentRound, setCurrentRound] = useState("");
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [currentRoundType, setCurrentRoundType] = useState("");
  const [roundsQuestionSummary, setRoundsQuestionSummary] = useState([]);
  const [questionsPlannedThisRound, setQuestionsPlannedThisRound] = useState(2);
  const [currentQuestionNumberWithinRound, setCurrentQuestionNumberWithinRound] = useState(1);
  const [customRounds, setCustomRounds] = useState(() => buildDefaultCustomRounds(2));
  const [draggedRoundIndex, setDraggedRoundIndex] = useState(null);
  const [dragOverRoundIndex, setDragOverRoundIndex] = useState(null);
  const [interviewLimitReached, setInterviewLimitReached] = useState(false);
  const [interviewLimitOpen, setInterviewLimitOpen] = useState(false);
  const [interviewLimitMessage, setInterviewLimitMessage] = useState("");
  const [interviewLimitRequestStatus, setInterviewLimitRequestStatus] = useState("none");
  const [interviewLimitRequesting, setInterviewLimitRequesting] = useState(false);
  const [roundTransitionMessage, setRoundTransitionMessage] = useState("");
  const [roundFeedbackView, setRoundFeedbackView] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tips, setTips] = useState([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [visibleTestCases, setVisibleTestCases] = useState([]);
  const [previewExecutionResult, setPreviewExecutionResult] = useState(null);
  const [previewExecutionLoading, setPreviewExecutionLoading] = useState(false);
  const [previewLastRunAtMs, setPreviewLastRunAtMs] = useState(0);
  /** Shown beside Run code when preview is blocked (e.g. language vs editor mismatch) — not the global error banner. */
  const [previewRunInlineHint, setPreviewRunInlineHint] = useState("");
  const [codingLanguage, setCodingLanguage] = useState("python");
  const [supportedCodingLanguages, setSupportedCodingLanguages] = useState([
    ...INTERVIEW_UI_CODING_LANGUAGES,
  ]);
  const [codingFunctionSignature, setCodingFunctionSignature] = useState("");
  const [codingStarterCode, setCodingStarterCode] = useState("");
  const [codingQuestionId, setCodingQuestionId] = useState("");
  const [questionTopics, setQuestionTopics] = useState([]);
  const [questionSubtopics, setQuestionSubtopics] = useState([]);
  const [questionCompanyTags, setQuestionCompanyTags] = useState([]);
  const [questionComplexity, setQuestionComplexity] = useState(null);
  const [expectedAnswerMode, setExpectedAnswerMode] = useState("conceptual");
  const [mcqPayload, setMcqPayload] = useState(null);
  const [selectedMcqOptionId, setSelectedMcqOptionId] = useState("");
  /** After each answer: full-screen feedback until user taps "Next question". */
  const [pendingQuestionFeedback, setPendingQuestionFeedback] = useState(null);
  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false);
  const [isInFullscreen, setIsInFullscreen] = useState(
    Boolean(typeof document !== "undefined" && getFullscreenElement())
  );
  const [needsFullscreenResume, setNeedsFullscreenResume] = useState(false);
  const activeSessionIdRef = useRef("");
  const interviewActiveRef = useRef(false);
  const isExitingInterviewRef = useRef(false);
  const processingFullscreenExitRef = useRef(false);
  const suppressFullscreenExitPromptRef = useRef(false);
  const roundCompletedAtRef = useRef(0);
  const loadingRef = useRef(false);
  const roundFeedbackRef = useRef(null);
  const questionRef = useRef("");
  const answerTextAreaRef = useRef(null);
  /** Abort in-flight answer-evaluation polling when the tab unmounts or user navigates away. */
  const interviewAnswerPollAbortedRef = useRef(false);
  /** Prevents overlapping run-preview calls (e.g. React Strict Mode or double-clicks). */
  const previewRunInFlightRef = useRef(false);
  /** Resizable coding split: left pane width (px) on lg+; persisted in localStorage. */
  const codingPaneWrapRef = useRef(null);
  const codingSplitDragRef = useRef({ active: false, startX: 0, startW: 400 });
  const codingLeftWidthRef = useRef(400);
  const [codingLeftPanePx, setCodingLeftPanePx] = useState(() => {
    if (typeof window === "undefined") return 400;
    try {
      const raw = window.localStorage.getItem("aiInterview.codingLeftPx");
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 260 && n <= 720) return Math.round(n);
    } catch {
      /* ignore */
    }
    return 400;
  });
  const tipsRef = useRef([]);
  tipsRef.current = tips;
  const pendingQuestionFeedbackRef = useRef(null);
  pendingQuestionFeedbackRef.current = pendingQuestionFeedback;
  const quitConfirmResolverRef = useRef(null);

  const normalizedCustomRounds = useMemo(
    () =>
      (Array.isArray(customRounds) ? customRounds : [])
        .slice(0, MAX_CUSTOM_ROUNDS)
        .map((round) => {
          const type = ROUND_TYPE_OPTIONS.includes(round?.type) ? round.type : "DSA";
          const difficulty = ROUND_DIFFICULTY_OPTIONS.includes(round?.difficulty)
            ? round.difficulty
            : "medium";
          if (!roundTypeHasFocusPicker(type)) {
            return { type, difficulty };
          }
          const focusOptions = getFocusOptionsForRoundType(type);
          const validFocusIds = new Set(focusOptions.map((opt) => opt.id));
          const focus = validFocusIds.has(round?.focus)
            ? round.focus
            : getDefaultFocusForRoundType(type);
          return { type, difficulty, focus };
        }),
    [customRounds]
  );

  const customPlanValidationError = useMemo(() => {
    if (normalizedCustomRounds.length < 1 || normalizedCustomRounds.length > MAX_CUSTOM_ROUNDS) {
      return `Select between 1 and ${MAX_CUSTOM_ROUNDS} rounds.`;
    }
    const hrCount = normalizedCustomRounds.filter((round) => round.type === "HR").length;
    if (hrCount < 1) {
      return "At least one HR round is mandatory.";
    }
    const hardSystemDesignCount = normalizedCustomRounds.filter(
      (round) => round.type === "System Design" && round.difficulty === "hard"
    ).length;
    if (hardSystemDesignCount > 2) {
      return "Use at most 2 hard System Design rounds.";
    }
    return "";
  }, [normalizedCustomRounds]);

  const [slotBookModalOpen, setSlotBookModalOpen] = useState(false);
  const [slotBookingStatus, setSlotBookingStatus] = useState(null);
  const [slotStatusLoading, setSlotStatusLoading] = useState(false);

  const planRequiresDsaSlot = useMemo(
    () => normalizedCustomRounds.some((round) => round.type === "DSA"),
    [normalizedCustomRounds]
  );

  const refreshSlotBookingStatus = useCallback(async () => {
    if (!user?.userId || normalizedCustomRounds.length < 1) {
      setSlotBookingStatus(null);
      return;
    }
    setSlotStatusLoading(true);
    try {
      const { data } = await interviewAPI.getSlotBookingStatus(normalizedCustomRounds);
      setSlotBookingStatus(data || null);
    } catch (err) {
      console.warn("[AIInterviewTab] slot booking status failed", err?.message || err);
      setSlotBookingStatus(null);
    } finally {
      setSlotStatusLoading(false);
    }
  }, [user?.userId, normalizedCustomRounds]);

  const hasActiveDsaSlotNow = Boolean(slotBookingStatus?.hasActiveBookingNow);
  const dsaSlotBlocked =
    planRequiresDsaSlot && (slotStatusLoading || !hasActiveDsaSlotNow);

  const canStart = useMemo(() => {
    return (
      Boolean(user?.userId && company?._id) &&
      !loading &&
      !customPlanValidationError &&
      !dsaSlotBlocked
    );
  }, [
    user?.userId,
    company?._id,
    loading,
    customPlanValidationError,
    dsaSlotBlocked,
  ]);

  const isMcqQuestionUI = useMemo(() => {
    if (String(expectedAnswerMode || "").toLowerCase() === "mcq") return true;
    return Array.isArray(mcqPayload?.options) && mcqPayload.options.length >= 2;
  }, [expectedAnswerMode, mcqPayload]);

  const isCodingRoundUI = useMemo(() => {
    const hint =
      Array.isArray(roundsDetails) && roundsDetails[currentRoundIndex]
        ? roundsDetails[currentRoundIndex].questionType
        : "";
    return (
      isCodingInterviewRound(currentRoundType) ||
      isCodingInterviewRound(hint)
    );
  }, [currentRoundType, roundsDetails, currentRoundIndex]);

  const answerCharCount = useMemo(() => {
    if (isMcqQuestionUI) return selectedMcqOptionId ? 1 : 0;
    if (isCodingRoundUI) return answerCode.trim().length;
    return answerExplanation.trim().length + answerCode.trim().length;
  }, [isMcqQuestionUI, selectedMcqOptionId, isCodingRoundUI, answerCode, answerExplanation]);

  const interviewCodeWorkspacePlaceholder = useMemo(() => {
    if (!isCodingRoundUI) return undefined;
    if (codingLanguage === "java") {
      return "public class Solution { /* implement the required method */ }";
    }
    return "def solution(...):\n    pass";
  }, [isCodingRoundUI, codingLanguage]);

  const isSqlRoundUI = useMemo(() => {
    const hint =
      Array.isArray(roundsDetails) && roundsDetails[currentRoundIndex]
        ? roundsDetails[currentRoundIndex].questionType
        : "";
    return labelIndicatesSqlRound(currentRoundType) || labelIndicatesSqlRound(hint);
  }, [currentRoundType, roundsDetails, currentRoundIndex]);

  const previewFixHints = useMemo(
    () => buildPreviewCodeExecutionHints(previewExecutionResult),
    [previewExecutionResult]
  );

  const submissionAnswerDraft = useMemo(() => {
    if (isMcqQuestionUI) return String(selectedMcqOptionId || "").trim();
    return buildInterviewSubmissionAnswer(
      answerExplanation,
      answerCode,
      isCodingRoundUI
    );
  }, [isMcqQuestionUI, selectedMcqOptionId, answerExplanation, answerCode, isCodingRoundUI]);

  const canSubmitAnswer = useMemo(() => {
    return (
      Boolean(sessionId) &&
      Boolean(question) &&
      Boolean(submissionAnswerDraft.trim()) &&
      status === "in_progress" &&
      !roundFeedbackView &&
      !pendingQuestionFeedback &&
      !loading &&
      !isProcessing
    );
  }, [
    sessionId,
    question,
    submissionAnswerDraft,
    status,
    roundFeedbackView,
    pendingQuestionFeedback,
    loading,
    isProcessing,
  ]);

  const isInterviewActive = useMemo(() => {
    return Boolean(sessionId) && status === "in_progress";
  }, [sessionId, status]);

  useEffect(() => {
    if (!isCodingRoundUI) setAnswerCode("");
  }, [isCodingRoundUI]);

  useEffect(() => {
    setSelectedMcqOptionId("");
  }, [question, sessionId, currentQuestionNumberWithinRound, isMcqQuestionUI]);

  useEffect(() => {
    setPreviewExecutionResult(null);
  }, [question, currentQuestionNumberWithinRound, sessionId]);

  useEffect(() => {
    setPreviewRunInlineHint("");
  }, [codingLanguage]);

  useEffect(() => {
    setCodingLanguage("python");
  }, [question, sessionId]);

  useEffect(() => {
    if (!supportedCodingLanguages.includes(codingLanguage)) {
      setCodingLanguage(
        supportedCodingLanguages.includes("python")
          ? "python"
          : supportedCodingLanguages[0] || "python"
      );
    }
  }, [supportedCodingLanguages, codingLanguage]);

  useEffect(() => {
    codingLeftWidthRef.current = codingLeftPanePx;
  }, [codingLeftPanePx]);

  const handleCodingLeftPaneWidthChange = useCallback((next) => {
    setCodingLeftPanePx(next);
    codingLeftWidthRef.current = next;
    try {
      window.localStorage.setItem("aiInterview.codingLeftPx", String(next));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    activeSessionIdRef.current = sessionId;
    interviewActiveRef.current = isInterviewActive;
    if (typeof onInterviewLockChange === "function") {
      onInterviewLockChange(isInterviewActive);
    }
  }, [isInterviewActive, onInterviewLockChange, sessionId]);

  useEffect(() => {
    loadingRef.current = loading;
    roundFeedbackRef.current = roundFeedbackView;
    questionRef.current = question || "";
  }, [loading, question, roundFeedbackView]);

  useEffect(() => {
    return () => {
      interviewAnswerPollAbortedRef.current = true;
      setIsProcessing(false);
    };
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      return undefined;
    }
    const id = window.setInterval(() => {
      const list = tipsRef.current;
      if (!list.length) return;
      setCurrentTipIndex((prev) => (prev + 1) % list.length);
    }, 2500);
    return () => clearInterval(id);
  }, [isProcessing]);

  useEffect(() => {
    if (isProcessing) {
      setCurrentTipIndex(0);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (!user?.userId || user?.betaAccess === false) {
      setInterviewLimitReached(false);
      setInterviewLimitMessage("");
      setInterviewLimitRequestStatus("none");
      return;
    }
    if (status === "in_progress") return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await interviewAPI.getInterviewEligibility();
        if (cancelled) return;
        const blocked = data?.canStart === false && data?.reason === "INTERVIEW_LIMIT_REACHED";
        setInterviewLimitReached(blocked);
        setInterviewLimitMessage(
          blocked ? data?.message || MESSAGES.INTERVIEW_LIMIT_REACHED : ""
        );
        setInterviewLimitRequestStatus(data?.limitRequest?.status || "none");
      } catch {
        if (!cancelled) {
          setInterviewLimitReached(false);
          setInterviewLimitMessage("");
          setInterviewLimitRequestStatus("none");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, user?.betaAccess, status]);

  const handleCustomRoundCountChange = useCallback((nextCountRaw) => {
    const nextCount = Math.min(
      MAX_CUSTOM_ROUNDS,
      Math.max(1, Number.parseInt(String(nextCountRaw), 10) || 1)
    );
    setCustomRounds((prev) => {
      const base = Array.isArray(prev) ? [...prev] : [];
      if (base.length > nextCount) return base.slice(0, nextCount);
      while (base.length < nextCount) {
        base.push({ type: "DSA", difficulty: "medium" });
      }
      return base;
    });
  }, []);

  const handleCustomRoundFieldChange = useCallback((index, field, value) => {
    setCustomRounds((prev) =>
      (Array.isArray(prev) ? prev : []).map((round, roundIndex) => {
        if (roundIndex !== index) return round;
        if (field === "type") {
          const nextType = ROUND_TYPE_OPTIONS.includes(value) ? value : "DSA";
          if (!roundTypeHasFocusPicker(nextType)) {
            const { focus: _removed, ...withoutFocus } = round;
            return { ...withoutFocus, type: nextType };
          }
          return {
            ...round,
            type: nextType,
            focus: getDefaultFocusForRoundType(nextType),
          };
        }
        if (field === "focus") {
          const type = ROUND_TYPE_OPTIONS.includes(round?.type) ? round.type : "DSA";
          const focusOptions = getFocusOptionsForRoundType(type);
          const validFocusIds = new Set(focusOptions.map((opt) => opt.id));
          return {
            ...round,
            focus: validFocusIds.has(value) ? value : getDefaultFocusForRoundType(type),
          };
        }
        return {
          ...round,
          difficulty: ROUND_DIFFICULTY_OPTIONS.includes(value) ? value : "medium",
        };
      })
    );
  }, []);

  const handleRoundDragStart = useCallback((index) => {
    setDraggedRoundIndex(index);
    setDragOverRoundIndex(index);
  }, []);

  const handleRoundDragOver = useCallback((event, index) => {
    event.preventDefault();
    if (dragOverRoundIndex !== index) {
      setDragOverRoundIndex(index);
    }
  }, [dragOverRoundIndex]);

  const handleRoundDrop = useCallback((targetIndex) => {
    setCustomRounds((prev) => {
      const safeTargetIndex = Number(targetIndex);
      if (
        !Array.isArray(prev) ||
        prev.length < 2 ||
        draggedRoundIndex == null ||
        !Number.isFinite(safeTargetIndex) ||
        draggedRoundIndex < 0 ||
        safeTargetIndex < 0 ||
        draggedRoundIndex >= prev.length ||
        safeTargetIndex > prev.length
      ) {
        return prev;
      }
      const insertIndex = Math.min(prev.length, Math.max(0, safeTargetIndex));
      if (draggedRoundIndex === insertIndex || draggedRoundIndex + 1 === insertIndex) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(draggedRoundIndex, 1);
      const normalizedInsertIndex =
        insertIndex > draggedRoundIndex ? insertIndex - 1 : insertIndex;
      next.splice(normalizedInsertIndex, 0, moved);
      return next;
    });
    setDraggedRoundIndex(null);
    setDragOverRoundIndex(null);
  }, [draggedRoundIndex]);

  const handleRoundDragEnd = useCallback(() => {
    setDraggedRoundIndex(null);
    setDragOverRoundIndex(null);
  }, []);


  const enterFullscreen = useCallback(async () => {
    if (getFullscreenElement()) return;
    const element = document.documentElement;
    if (!element) return;
    const requestFs =
      element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen;
    if (!requestFs) return;
    try {
      await requestFs.call(element);
      setNeedsFullscreenResume(false);
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
      setNeedsFullscreenResume(true);
    }
  }, []);

  const discardCurrentInterview = useCallback(async (targetSessionId) => {
    if (!targetSessionId) return;
    if (user?.betaAccess === false) return;
    try {
      await interviewAPI.discardInterview(targetSessionId);
    } catch (err) {
      if (isIgnorableDiscardError(err)) {
        // Already discarded / no in-progress session left; safe to ignore.
        return;
      }
      console.error("Failed to discard in-progress interview:", err);
    }
  }, [user?.betaAccess]);

  const requestQuitConfirmation = useCallback(() => {
    return new Promise((resolve) => {
      if (typeof quitConfirmResolverRef.current === "function") {
        quitConfirmResolverRef.current(false);
      }
      quitConfirmResolverRef.current = resolve;
      setQuitConfirmOpen(true);
    });
  }, []);

  const resolveQuitConfirmation = useCallback((confirmed) => {
    setQuitConfirmOpen(false);
    const resolver = quitConfirmResolverRef.current;
    quitConfirmResolverRef.current = null;
    if (typeof resolver === "function") {
      resolver(Boolean(confirmed));
    }
  }, []);

  const finalizeExitToGeneral = useCallback(async () => {
    interviewActiveRef.current = false;
    activeSessionIdRef.current = "";
    isExitingInterviewRef.current = true;
    setSessionId("");
    resetInterviewState();
    setNeedsFullscreenResume(false);
    setIsInFullscreen(Boolean(getFullscreenElement()));
    if (typeof onInterviewLockChange === "function") {
      onInterviewLockChange(false);
    }
    if (getFullscreenElement()) {
      try {
        suppressFullscreenExitPromptRef.current = true;
        await exitFullscreenCompat();
      } catch {
        // Ignore fullscreen exit errors.
      } finally {
        window.setTimeout(() => {
          suppressFullscreenExitPromptRef.current = false;
          isExitingInterviewRef.current = false;
        }, 1200);
      }
    } else {
      window.setTimeout(() => {
        suppressFullscreenExitPromptRef.current = false;
        isExitingInterviewRef.current = false;
      }, 0);
    }
    if (typeof onForceExitToGeneral === "function") {
      onForceExitToGeneral();
    }
  }, [onForceExitToGeneral, onInterviewLockChange]);

  const handleQuitInterview = useCallback(async () => {
    if (isExitingInterviewRef.current) {
      return true;
    }
    if (!interviewActiveRef.current || !activeSessionIdRef.current) {
      return false;
    }

    const sessionIdToDiscard = activeSessionIdRef.current;
    const shouldExit = await requestQuitConfirmation();
    if (!shouldExit) {
      if (!getFullscreenElement()) {
        await enterFullscreen();
      }
      return false;
    }

    window.dispatchEvent(new Event("ai-interview-intentional-exit"));
    await finalizeExitToGeneral();
    discardCurrentInterview(sessionIdToDiscard).catch(() => {});
    return true;
  }, [
    discardCurrentInterview,
    enterFullscreen,
    finalizeExitToGeneral,
    requestQuitConfirmation,
  ]);

  const handleEndInterview = useCallback(async () => {
    await finalizeExitToGeneral();
  }, [finalizeExitToGeneral]);

  const handleCloseFinalRoundSummary = useCallback(() => {
    setRoundFeedbackView(null);
    roundFeedbackRef.current = null;
    if (typeof document === "undefined") return;
    if (!getFullscreenElement()) return;
    suppressFullscreenExitPromptRef.current = true;
    void exitFullscreenCompat().finally(() => {
      window.setTimeout(() => {
        suppressFullscreenExitPromptRef.current = false;
      }, 1200);
    });
  }, []);

  useEffect(() => {
    if (status !== "completed") return;
    if (typeof document === "undefined") return;
    if (!getFullscreenElement()) return;
    suppressFullscreenExitPromptRef.current = true;
    void exitFullscreenCompat().finally(() => {
      window.setTimeout(() => {
        suppressFullscreenExitPromptRef.current = false;
      }, 1200);
    });
  }, [status]);

  useEffect(() => {
    if (!isInterviewActive) return;

    const handleBeforeUnload = (event) => {
      const message =
        "Interview in progress. Leaving now will discard your interview and progress will be lost.";
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isInterviewActive]);

  useEffect(() => {
    if (!isInterviewActive) return;
    let isHandling = false;

    // Add one history entry so first browser-back stays on same page and we can confirm.
    window.history.pushState({ interviewLock: true }, "", window.location.href);

    const handlePopState = async () => {
      if (isHandling || !interviewActiveRef.current) return;
      isHandling = true;

      const exited = await handleQuitInterview();
      if (!exited) {
        window.history.pushState({ interviewLock: true }, "", window.location.href);
      }
      isHandling = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handleQuitInterview, isInterviewActive]);

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsInFullscreen(Boolean(getFullscreenElement()));
      if (getFullscreenElement()) {
        setNeedsFullscreenResume(false);
      }
    };

    document.addEventListener("fullscreenchange", updateFullscreenState);
    document.addEventListener("webkitfullscreenchange", updateFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
      document.removeEventListener("webkitfullscreenchange", updateFullscreenState);
    };
  }, []);

  useEffect(() => {
    const handleIntentionalExit = () => {
      suppressFullscreenExitPromptRef.current = true;
      window.setTimeout(() => {
        suppressFullscreenExitPromptRef.current = false;
      }, 1200);
    };

    window.addEventListener("ai-interview-intentional-exit", handleIntentionalExit);
    return () =>
      window.removeEventListener("ai-interview-intentional-exit", handleIntentionalExit);
  }, []);

  useEffect(() => {
    if (!isInterviewActive) return;
    const activeSessionId = sessionId;

    const handleFullscreenChange = () => {
      if (getFullscreenElement()) return;
      if (processingFullscreenExitRef.current) return;
      if (suppressFullscreenExitPromptRef.current) return;
      if (roundFeedbackRef.current || loadingRef.current || pendingQuestionFeedbackRef.current)
        return;

      // User exited fullscreen (usually with ESC) before completion.
      if (status === "in_progress" && activeSessionId) {
        processingFullscreenExitRef.current = true;
        window.setTimeout(async () => {
          try {
            const exited = await handleQuitInterview();
            if (!exited) {
              await enterFullscreen();
            }
          } finally {
            processingFullscreenExitRef.current = false;
          }
        }, 0);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [
    enterFullscreen,
    handleQuitInterview,
    isInterviewActive,
    sessionId,
    status,
  ]);

  useEffect(() => {
    return () => {
      if (typeof quitConfirmResolverRef.current === "function") {
        quitConfirmResolverRef.current(false);
        quitConfirmResolverRef.current = null;
      }
      if (interviewActiveRef.current && activeSessionIdRef.current) {
        interviewAPI.discardInterview(activeSessionIdRef.current).catch((err) => {
          if (isIgnorableDiscardError(err)) {
            return;
          }
          console.error("Failed to discard interview on exit:", err);
        });
      }
    };
  }, []);

  useEffect(() => {
    if (typeof registerInterviewExitHandler !== "function") {
      return undefined;
    }
    registerInterviewExitHandler(isInterviewActive ? handleQuitInterview : null);
    return () => {
      registerInterviewExitHandler(null);
    };
  }, [handleQuitInterview, isInterviewActive, registerInterviewExitHandler]);

  const resetInterviewState = () => {
    loadingRef.current = false;
    roundFeedbackRef.current = null;
    questionRef.current = "";
    if (answerTextAreaRef.current) {
      answerTextAreaRef.current.style.height = "auto";
    }
    setQuestion("");
    setQuestionUrl("");
    setAnswerExplanation("");
    setAnswerCode("");
    setFeedback("");
    setScore(null);
    setStatus("idle");
    setError("");
    setRoundsPlan([]);
    setRoundsDetails([]);
    setCurrentRound("");
    setCurrentRoundIndex(0);
    setTotalRounds(0);
    setDifficultyLevel("");
    setCurrentRoundType("");
    setRoundTransitionMessage("");
    setRoundFeedbackView(null);
    setIsProcessing(false);
    setTips([]);
    setCurrentTipIndex(0);
    setVisibleTestCases([]);
    setPreviewSqlContext(null);
    setPreviewExecutionResult(null);
    setPreviewExecutionLoading(false);
    setPreviewLastRunAtMs(0);
    setPreviewRunInlineHint("");
    setPendingQuestionFeedback(null);
    setExpectedAnswerMode("conceptual");
    setMcqPayload(null);
    setSelectedMcqOptionId("");
    setRoundsQuestionSummary([]);
    setQuestionsPlannedThisRound(3);
    setCurrentQuestionNumberWithinRound(1);
  };

  useEffect(() => {
    if (isCodingRoundUI || isMcqQuestionUI) return;
    if (!answerTextAreaRef.current) return;
    if (status !== "in_progress") return;

    const el = answerTextAreaRef.current;
    el.style.height = "auto";
    // Keep some minimum height so the UI doesn't collapse on short answers.
    const minHeightPx = 120;
    const nextHeight = Math.max(minHeightPx, el.scrollHeight);
    el.style.height = `${nextHeight}px`;
  }, [answerExplanation, status, isCodingRoundUI, isMcqQuestionUI]);

  const openInterviewLimitModal = useCallback((message) => {
    setInterviewLimitMessage(message || MESSAGES.INTERVIEW_LIMIT_REACHED);
    setInterviewLimitOpen(true);
  }, []);

  const handleInterviewLimitRequest = useCallback(async () => {
    setInterviewLimitRequesting(true);
    try {
      const { data } = await interviewAPI.submitInterviewLimitRequest();
      setInterviewLimitRequestStatus(data?.status || "pending");
      return data;
    } finally {
      setInterviewLimitRequesting(false);
    }
  }, []);

  /** Sync coding / MCQ / topic metadata for the active question from interview-status. */
  const applyQuestionMetaFromStatus = useCallback((st) => {
    if (!st || typeof st !== "object") return;

    if (Object.prototype.hasOwnProperty.call(st, "visibleTestCases")) {
      setVisibleTestCases(Array.isArray(st.visibleTestCases) ? st.visibleTestCases : []);
    }
    if (Object.prototype.hasOwnProperty.call(st, "supportedCodingLanguages")) {
      setSupportedCodingLanguages(filterInterviewUiCodingLanguages(st.supportedCodingLanguages));
    }
    if (Object.prototype.hasOwnProperty.call(st, "codingFunctionSignature")) {
      setCodingFunctionSignature(String(st.codingFunctionSignature || "").trim());
    }
    if (Object.prototype.hasOwnProperty.call(st, "codingStarterCode")) {
      setCodingStarterCode(String(st.codingStarterCode ?? ""));
    }
    if (Object.prototype.hasOwnProperty.call(st, "codingQuestionId")) {
      setCodingQuestionId(String(st.codingQuestionId || "").trim());
    }
    if (Object.prototype.hasOwnProperty.call(st, "questionTopics")) {
      setQuestionTopics(Array.isArray(st.questionTopics) ? st.questionTopics : []);
    }
    if (Object.prototype.hasOwnProperty.call(st, "questionSubtopics")) {
      setQuestionSubtopics(Array.isArray(st.questionSubtopics) ? st.questionSubtopics : []);
    }
    if (Object.prototype.hasOwnProperty.call(st, "questionCompanyTags")) {
      setQuestionCompanyTags(Array.isArray(st.questionCompanyTags) ? st.questionCompanyTags : []);
    }
    if (Object.prototype.hasOwnProperty.call(st, "questionComplexity")) {
      setQuestionComplexity(normalizeQuestionComplexityPayload(st.questionComplexity));
    }
    if (Object.prototype.hasOwnProperty.call(st, "questionUrl")) {
      setQuestionUrl(String(st.questionUrl || "").trim());
    }
    if (Object.prototype.hasOwnProperty.call(st, "expectedAnswerMode")) {
      const mode = String(st.expectedAnswerMode || "conceptual");
      setExpectedAnswerMode(mode);
      if (mode.toLowerCase() !== "mcq") {
        setMcqPayload(null);
      }
    }
    if (Object.prototype.hasOwnProperty.call(st, "mcq")) {
      const nextMcq =
        st.mcq && typeof st.mcq === "object" && Array.isArray(st.mcq.options)
          ? st.mcq
          : null;
      setMcqPayload(nextMcq);
    }
  }, []);

  const handleStartInterview = async () => {
    if (interviewLimitReached) {
      openInterviewLimitModal(interviewLimitMessage);
      return;
    }

    if (!canStart) {
      setError(
        customPlanValidationError
          ? customPlanValidationError
          : "Please login and make sure company details are loaded."
      );
      return;
    }

    if (user?.betaAccess === false) return;

    loadingRef.current = true;
    roundFeedbackRef.current = null;
    setLoading(true);
    setError("");
    setFeedback("");
    setScore(null);
    setRoundTransitionMessage("");
    setRoundFeedbackView(null);
    setPendingQuestionFeedback(null);
    setExpectedAnswerMode("conceptual");
    setMcqPayload(null);
    setSelectedMcqOptionId("");

    try {
      const { data } = await interviewAPI.startInterview({
        userId: user.userId,
        companyId: company._id,
        placementVisitType: "",
        mergePlacementByType: true,
        interviewPlanMode: "custom",
        customRounds: normalizedCustomRounds,
      });

      setSessionId(data.sessionId || "");
      setQuestion(data.question || "");
      setQuestionUrl(String(data.questionUrl || "").trim());
      setStatus(data.status || "in_progress");
      setCurrentRound(data.currentRound || "");
      setRoundsPlan(Array.isArray(data.roundsPlan) ? data.roundsPlan : []);
      setRoundsDetails(Array.isArray(data.roundsDetails) ? data.roundsDetails : []);
      setCurrentRoundIndex(Number(data.currentRoundIndex) || 0);
      setTotalRounds(Number(data.totalRounds) || 0);
      setDifficultyLevel(data.difficultyLevel || "");
      const rt0 = deriveRoundTypeFromPayload(data);
      if (rt0) setCurrentRoundType(rt0);
      setRoundTransitionMessage("");
      setAnswerExplanation("");
      setAnswerCode("");
      if (Array.isArray(data.rounds)) {
        setRoundsQuestionSummary(deriveRoundsQuestionSummary(data.rounds));
        const crNum = Number(data.currentRound) || 1;
        const rd = data.rounds[Math.max(0, crNum - 1)];
        setQuestionsPlannedThisRound(
          clampInterviewQuestionCountForRound(
            rd?.type,
            rd?.questionCount,
            Array.isArray(rd?.questions) ? rd.questions.length : 0
          )
        );
      }
      setCurrentQuestionNumberWithinRound(Number(data.currentQuestionIndex ?? 0) + 1);
      if (Object.prototype.hasOwnProperty.call(data || {}, "visibleTestCases")) {
        setVisibleTestCases(Array.isArray(data.visibleTestCases) ? data.visibleTestCases : []);
      }
      setPreviewExecutionResult(null);
      if (data.sessionId) {
        try {
          const { data: freshStatus } = await interviewAPI.getInterviewStatus(data.sessionId);
          applyQuestionMetaFromStatus(freshStatus);
          setCodingLanguage("python");
        } catch (statusErr) {
          console.warn("[AIInterviewTab] immediate status hydrate failed", {
            message: statusErr?.message || String(statusErr),
          });
        }
      }
      await enterFullscreen();
      // Resume intentionally disabled.
    } catch (err) {
      console.error("Failed to start AI interview:", err);
      const code = err?.response?.data?.code;
      if (code === "INTERVIEW_LIMIT_REACHED") {
        const msg = err?.response?.data?.error || MESSAGES.INTERVIEW_LIMIT_REACHED;
        setInterviewLimitReached(true);
        setInterviewLimitMessage(msg);
        openInterviewLimitModal(msg);
        return;
      }
      if (code === "DSA_SLOT_REQUIRED" || err?.response?.data?.requiresSlotBooking) {
        setError(
          err?.response?.data?.error ||
            "Book a slot for your DSA interview hour (IST), then start during that window."
        );
        setSlotBookModalOpen(true);
        refreshSlotBookingStatus();
        return;
      }
      setError(err?.response?.data?.error || "Failed to start interview.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const applyInterviewStatusPayload = useCallback((st) => {
    const incomingQ = (st.currentQuestion ?? "").trim();
    console.info("[AIInterviewTab] applyInterviewStatusPayload", {
      lifecycle: st.status,
      roundCompleted: Boolean(st.roundCompleted),
      incomingQLen: incomingQ.length,
      currentQuestionIndex: st.currentQuestionIndex,
    });

    setStatus(st.status || "in_progress");
    setCurrentRound(st.currentRound ?? "");
    setCurrentRoundIndex(Math.max(0, (Number(st.currentRound) || 1) - 1));
    if (st.roundType != null && String(st.roundType).trim() !== "") {
      setCurrentRoundType(String(st.roundType).trim());
    }
    if (st.totalRounds != null) {
      setTotalRounds(Number(st.totalRounds) || 0);
    }

    if (Array.isArray(st.roundsQuestionSummary)) {
      setRoundsQuestionSummary(st.roundsQuestionSummary);
    }
    if (typeof st.questionsPlannedThisRound === "number") {
      setQuestionsPlannedThisRound(st.questionsPlannedThisRound);
    }
    if (typeof st.currentQuestionNumberWithinRound === "number") {
      setCurrentQuestionNumberWithinRound(st.currentQuestionNumberWithinRound);
    }
    applyQuestionMetaFromStatus(st);

    if (st.roundCompleted) {
      roundCompletedAtRef.current = Date.now();
      setQuestion("");
      setQuestionUrl("");
      setQuestionTopics([]);
      setQuestionSubtopics([]);
      setQuestionCompanyTags([]);
      setQuestionComplexity(null);
      setExpectedAnswerMode("conceptual");
      setMcqPayload(null);
      setSelectedMcqOptionId("");
      questionRef.current = "";

      /** Entire interview finished: never show per-answer feedback on top of the final summary. */
      if (st.status === "completed") {
        setPendingQuestionFeedback(null);
        const deferredRoundSummary = buildDeferredRoundSummaryFromStatus(st);
        const hasRoundSummaryContent =
          deferredRoundSummary &&
          (deferredRoundSummary.dsaRoundStats ||
            (deferredRoundSummary.summary && String(deferredRoundSummary.summary).trim()) ||
            (Array.isArray(deferredRoundSummary.strengths) &&
              deferredRoundSummary.strengths.length > 0) ||
            (Array.isArray(deferredRoundSummary.weaknesses) &&
              deferredRoundSummary.weaknesses.length > 0));
        if (hasRoundSummaryContent) {
          setRoundFeedbackView(deferredRoundSummary);
          roundFeedbackRef.current = {
            nextRoundAvailable: Boolean(st?.nextRoundAvailable),
          };
        } else {
          setRoundFeedbackView(null);
          roundFeedbackRef.current = null;
        }
        setFeedback(st.lastFeedback || "");
        setScore(typeof st.lastScore === "number" ? st.lastScore : null);
      } else {
        const deferredRoundSummary = buildDeferredRoundSummaryFromStatus(st);
        const codeExecSummaryRound = st.lastCodeExecutionSummary;
        const hasLastAnswerFeedback =
          String(st.lastFeedback || "").trim().length > 0 ||
          typeof st.lastScore === "number" ||
          isCodeExecutionSummaryPayload(codeExecSummaryRound);

        if (hasLastAnswerFeedback) {
          setPendingQuestionFeedback({
            answeredQuestion: String(st.lastQuestion ?? "").trim(),
            canReattempt: Boolean(st.lastQuestionCanReattempt),
            feedback: st.lastFeedback || "",
            score: typeof st.lastScore === "number" ? st.lastScore : null,
            correctness: toDisplayCorrectness(st.lastCorrectness),
            relevance: toDisplayRelevance(st.lastRelevance),
            mcqFeedback: buildMcqFeedbackFromStatus(st),
            codeExecutionSummary: isCodeExecutionSummaryPayload(codeExecSummaryRound)
              ? codeExecSummaryRound
              : null,
            nextQuestion: "",
            nextQuestionUrl: "",
            deferredRoundSummary,
          });
          setRoundFeedbackView(null);
          roundFeedbackRef.current = null;
          setFeedback("");
          setScore(null);
        } else {
          setPendingQuestionFeedback(null);
          setFeedback(st.lastFeedback || "");
          setScore(typeof st.lastScore === "number" ? st.lastScore : null);
          setRoundFeedbackView(deferredRoundSummary);
          roundFeedbackRef.current = {
            nextRoundAvailable: Boolean(st?.nextRoundAvailable),
          };
        }
      }
    } else {
      if (st.status !== "completed") {
        roundFeedbackRef.current = null;
        setRoundFeedbackView(null);
      }
      if (st.status === "completed") {
        setPendingQuestionFeedback(null);
        setFeedback(st.lastFeedback || "");
        setScore(typeof st.lastScore === "number" ? st.lastScore : null);
        setQuestion("");
        setQuestionUrl("");
        questionRef.current = "";
      } else if (
        incomingQ &&
        (String(st.lastFeedback || "").trim() ||
          typeof st.lastScore === "number" ||
          isCodeExecutionSummaryPayload(st.lastCodeExecutionSummary))
      ) {
        const codeExecSummaryNext = st.lastCodeExecutionSummary;
        setPendingQuestionFeedback({
          answeredQuestion: String(st.lastQuestion ?? "").trim(),
          canReattempt: Boolean(st.lastQuestionCanReattempt),
          feedback: st.lastFeedback || "",
          score: typeof st.lastScore === "number" ? st.lastScore : null,
          correctness: toDisplayCorrectness(st.lastCorrectness),
          relevance: toDisplayRelevance(st.lastRelevance),
          mcqFeedback: buildMcqFeedbackFromStatus(st),
          codeExecutionSummary: isCodeExecutionSummaryPayload(codeExecSummaryNext)
            ? codeExecSummaryNext
            : null,
          nextQuestion: incomingQ,
          nextQuestionUrl: String(st.questionUrl || "").trim(),
          deferredRoundSummary: null,
        });
        setQuestion("");
        setQuestionUrl("");
        questionRef.current = "";
        setFeedback("");
        setScore(null);
      } else if (incomingQ) {
        setPendingQuestionFeedback(null);
        setFeedback(st.lastFeedback || "");
        setScore(typeof st.lastScore === "number" ? st.lastScore : null);
        setQuestion(incomingQ);
        setQuestionUrl(String(st.questionUrl || "").trim());
        questionRef.current = incomingQ;
      } else {
        setPendingQuestionFeedback(null);
        setFeedback(st.lastFeedback || "");
        setScore(typeof st.lastScore === "number" ? st.lastScore : null);
        setQuestionUrl("");
      }
    }

    // Resume intentionally disabled.
  }, [applyQuestionMetaFromStatus]);

  const codingLanguageOptions = useMemo(() => {
    return INTERVIEW_UI_CODING_LANGUAGES.filter((id) => supportedCodingLanguages.includes(id)).map(
      (id) => ({
        value: id,
        label: CODING_LANGUAGE_OPTION_LABELS[id] || id,
      })
    );
  }, [supportedCodingLanguages]);

  const handleCodingLanguageChange = useCallback(
    (next) => {
      const normalized = String(next || "").trim();
      if (
        !INTERVIEW_UI_CODING_LANGUAGES.includes(normalized) ||
        !supportedCodingLanguages.includes(normalized)
      ) {
        return;
      }
      if (normalized === codingLanguage) return;
      setCodingLanguage(normalized);
    },
    [supportedCodingLanguages, codingLanguage]
  );

  const handleRunPreview = useCallback(async () => {
    if (!sessionId || loading || previewExecutionLoading || isProcessing) return;
    const now = Date.now();
    if (previewLastRunAtMs && now - previewLastRunAtMs < 2000) {
      setPreviewRunInlineHint("");
      setError("Please wait 2 seconds before running preview again.");
      return;
    }

    const payloadCode = String(isCodingRoundUI ? answerCode : answerExplanation).trim();
    if (!payloadCode) {
      setPreviewRunInlineHint("");
      setError("Write your code first.");
      return;
    }

    const codeToSend = payloadCode;
    setPreviewRunInlineHint("");
    if (isCodingRoundUI) {
      if (codingLanguage === "python" && looksLikeCppInterviewCode(payloadCode)) {
        setError("");
        setPreviewRunInlineHint(
          "Python is selected but the editor looks like C++. Switch the language to C++, or replace with a Python implementation."
        );
        return;
      }
      if (codingLanguage === "cpp" && looksLikePythonInterviewCode(payloadCode)) {
        setError("");
        setPreviewRunInlineHint(
          "C++ is selected but the editor looks like Python. Switch the language to Python, or replace with a C++ implementation."
        );
        return;
      }
      if (codingLanguage === "cpp" && looksLikeJavaInterviewCode(payloadCode)) {
        setError("");
        setPreviewRunInlineHint(
          "C++ is selected but the editor looks like Java. Switch the language to Java, or replace with a C++ implementation."
        );
        return;
      }
      if (codingLanguage === "java" && looksLikePythonInterviewCode(payloadCode)) {
        setError("");
        setPreviewRunInlineHint(
          "Java is selected but the editor looks like Python. Use Java that matches the Grader contract, or switch the language to Python."
        );
        return;
      }
      if (codingLanguage === "java" && looksLikeCppInterviewCode(payloadCode)) {
        setError("");
        setPreviewRunInlineHint(
          "Java is selected but the editor looks like C++. Switch the language to C++, or replace with a Java implementation."
        );
        return;
      }
      if (codingLanguage === "python" && looksLikeJavaInterviewCode(payloadCode)) {
        setError("");
        setPreviewRunInlineHint(
          "Python is selected but the editor looks like Java. Use Python that matches the Grader contract, or switch the language to Java."
        );
        return;
      }
    }

    if (previewRunInFlightRef.current) return;
    previewRunInFlightRef.current = true;

    setError("");
    setPreviewExecutionLoading(true);
    setPreviewExecutionResult(null);
    try {
      const { data } = await interviewAPI.runPreview({
        sessionId,
        code: codeToSend,
        language: codingLanguage,
      });
      setPreviewExecutionResult(data?.execution || null);
      setPreviewLastRunAtMs(Date.now());
    } catch (err) {
      const timedOut =
        err?.code === "ECONNABORTED" || /timeout/i.test(String(err?.message || ""));
      const message = timedOut
        ? "Preview timed out. The first C++/Java run can take longer while the runtime image loads — try again."
        : err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to run preview.";
      setError(message);
    } finally {
      previewRunInFlightRef.current = false;
      setPreviewExecutionLoading(false);
    }
  }, [
    sessionId,
    loading,
    previewExecutionLoading,
    isProcessing,
    previewLastRunAtMs,
    isCodingRoundUI,
    codingLanguage,
    answerCode,
    answerExplanation,
  ]);

  const handleSubmitAnswer = async () => {
    if (!canSubmitAnswer) return;

    if (user?.betaAccess === false) return;

    loadingRef.current = true;
    roundFeedbackRef.current = null;
    setLoading(true);
    setError("");

    const toQuestionIndex = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    /** Snapshot before submit so we detect any server-side update after the worker runs. */
    let snap = {
      idx: null,
      questionText: (question || "").trim(),
      lastFeedback: "",
      lastScore: null,
    };
    let preTips = [];
    try {
      const { data: pre } = await interviewAPI.getInterviewStatus(sessionId);
      preTips = Array.isArray(pre.tips) ? pre.tips : [];
      snap = {
        idx: toQuestionIndex(pre.currentQuestionIndex),
        questionText: (pre.currentQuestion ?? "").trim() || (question || "").trim(),
        lastFeedback: pre.lastFeedback ?? "",
        lastScore: pre.lastScore ?? null,
      };
      setTips(preTips);
      console.info("[AIInterviewTab] pre-submit status ok", {
        sessionId,
        snapIdx: snap.idx,
        questionLen: snap.questionText.length,
        tipsCount: preTips.length,
      });
    } catch (preErr) {
      console.warn("[AIInterviewTab] pre-submit getInterviewStatus failed", {
        sessionId,
        message: preErr?.message,
      });
      setTips([]);
    }

    try {
      const { data } = await interviewAPI.submitAnswer({
        sessionId,
        answer: submissionAnswerDraft.trim(),
        ...(isCodingRoundUI ? { language: codingLanguage } : {}),
      });

      console.info("[AIInterviewTab] submitAnswer response", {
        sessionId,
        status: data?.status,
        hasSessionId: Boolean(data?.sessionId),
      });

      if (data.status === "processing") {
        setAnswerExplanation("");
        setAnswerCode("");
        const sid = String(data.sessionId || sessionId);
        interviewAnswerPollAbortedRef.current = false;
        setIsProcessing(true);
        setCurrentTipIndex(0);

        const pollMs = 1500;
        const deadline = Date.now() + 90000;
        let settled = false;
        let pollCount = 0;
        /** Prefer pre-submit index; else lock first response that still shows the same question text. */
        let dynamicBaselineIdx = snap.idx;

        const trySettle = (st, reason) => {
          console.info("[AIInterviewTab] settle apply", {
            sessionId: sid,
            pollCount,
            reason,
            apiIdx: st.currentQuestionIndex,
            cqLen: (st.currentQuestion ?? "").trim().length,
            roundCompleted: Boolean(st.roundCompleted),
            lifecycle: st.status,
            serverIsProcessing: st.isProcessing,
          });
          applyInterviewStatusPayload(st);
          settled = true;
        };

        const shouldSettle = (st) => {
          if (st.status === "completed" || st.roundCompleted) {
            return { ok: true, reason: "completed-or-roundDone" };
          }
          const idx = toQuestionIndex(st.currentQuestionIndex);
          const cq = (st.currentQuestion ?? "").trim();
          if (idx === null) {
            return { ok: false, reason: "no-question-index" };
          }
          if (cq.length === 0) {
            return { ok: false, reason: "empty-currentQuestion" };
          }
          if (dynamicBaselineIdx !== null) {
            if (idx > dynamicBaselineIdx) {
              return { ok: true, reason: `index-advanced ${dynamicBaselineIdx}->${idx}` };
            }
            if (idx === dynamicBaselineIdx && cq !== snap.questionText) {
              return { ok: true, reason: "same-index-new-question-text" };
            }
            return { ok: false, reason: "waiting-index-or-text" };
          }
          if (cq !== snap.questionText) {
            return { ok: true, reason: "new-text-no-baseline-idx" };
          }
          return { ok: false, reason: "no-baseline-still-same-text" };
        };

        const pollOnce = async () => {
          if (interviewAnswerPollAbortedRef.current) {
            return false;
          }
          if (user?.betaAccess === false) {
            return false;
          }
          pollCount += 1;
          const { data: st } = await interviewAPI.getInterviewStatus(sid);
          if (interviewAnswerPollAbortedRef.current) {
            return false;
          }
          if (Array.isArray(st.tips)) {
            setTips(st.tips);
          }
          const idx = toQuestionIndex(st.currentQuestionIndex);
          const cq = (st.currentQuestion ?? "").trim();

          if (
            dynamicBaselineIdx === null &&
            idx !== null &&
            snap.questionText &&
            cq === snap.questionText
          ) {
            dynamicBaselineIdx = idx;
            console.info("[AIInterviewTab] locked dynamic baseline idx (same Q text)", {
              sessionId: sid,
              dynamicBaselineIdx,
              pollCount,
            });
          }

          console.info("[AIInterviewTab] poll tick", {
            sessionId: sid,
            pollCount,
            idx,
            cqLen: cq.length,
            dynamicBaselineIdx,
            snapIdx: snap.idx,
            roundCompleted: Boolean(st.roundCompleted),
            lifecycle: st.status,
            lastFeedbackLen: String(st.lastFeedback ?? "").length,
          });

          if (st.status === "completed" || st.roundCompleted) {
            trySettle(st, "terminal-state");
            return true;
          }

          const decision = shouldSettle(st);
          if (decision.ok) {
            trySettle(st, decision.reason);
            return true;
          }

          console.info("[AIInterviewTab] poll continue", {
            sessionId: sid,
            pollCount,
            why: decision.reason,
          });
          return false;
        };

        try {
          await new Promise((r) => setTimeout(r, 300));
          if (!interviewAnswerPollAbortedRef.current) {
            await pollOnce();
          }
        } catch (pollErr) {
          console.warn("[AIInterviewTab] poll error (initial)", pollErr?.message || pollErr);
        }

        while (
          !settled &&
          Date.now() < deadline &&
          !interviewAnswerPollAbortedRef.current
        ) {
          await new Promise((r) => setTimeout(r, pollMs));
          try {
            await pollOnce();
          } catch (pollErr) {
            console.warn("[AIInterviewTab] poll error (loop)", pollErr?.message || pollErr);
          }
        }

        if (interviewAnswerPollAbortedRef.current && !settled) {
          setIsProcessing(false);
        }

        if (!settled) {
          console.warn("[AIInterviewTab] polling timed out without settle", {
            sessionId: sid,
            pollCount,
            dynamicBaselineIdx,
            snap,
          });
          try {
            const { data: st } = await interviewAPI.getInterviewStatus(sid);
            const idxT = toQuestionIndex(st.currentQuestionIndex);
            const cqT = (st.currentQuestion ?? "").trim();
            if (
              dynamicBaselineIdx === null &&
              idxT !== null &&
              snap.questionText &&
              cqT === snap.questionText
            ) {
              dynamicBaselineIdx = idxT;
            }
            const decision = shouldSettle(st);
            console.info("[AIInterviewTab] timeout final fetch", {
              decision,
              apiIdx: st.currentQuestionIndex,
              cqLen: (st.currentQuestion ?? "").trim().length,
            });
            if (decision.ok) {
              trySettle(st, `timeout:${decision.reason}`);
            } else {
              setIsProcessing(false);
              setError(
                "Your answer is still processing or the interview worker is not running. Start `node workers/interviewWorker.js` (with Redis), then try again or refresh the page."
              );
            }
          } catch (finalErr) {
            console.warn("[AIInterviewTab] timeout final fetch failed", finalErr?.message || finalErr);
            setIsProcessing(false);
            setError(
              "Could not reach the server for interview status. Check your connection and that the interview worker is running with Redis."
            );
          }
        }
      } else {
        console.info("[AIInterviewTab] submit non-processing path", {
          status: data?.status,
          hasQuestion: Boolean(data?.question),
        });
        const nextQ = (data.question || "").trim();
        setStatus(data.status || "in_progress");
        setCurrentRound(data.currentRound || "");
        setRoundsPlan(Array.isArray(data.roundsPlan) ? data.roundsPlan : []);
        setRoundsDetails(Array.isArray(data.roundsDetails) ? data.roundsDetails : []);
        setCurrentRoundIndex(Number(data.currentRoundIndex) || 0);
        setTotalRounds(Number(data.totalRounds) || 0);
        setDifficultyLevel(data.difficultyLevel || "");
        const rtSync = deriveRoundTypeFromPayload(data);
        if (rtSync) setCurrentRoundType(rtSync);
        if (Array.isArray(data.rounds)) {
          setRoundsQuestionSummary(deriveRoundsQuestionSummary(data.rounds));
        }
        if (typeof data.currentQuestionIndex === "number") {
          setCurrentQuestionNumberWithinRound(Number(data.currentQuestionIndex) + 1);
        }
        if (typeof data.questionsPlannedThisRound === "number") {
          setQuestionsPlannedThisRound(data.questionsPlannedThisRound);
        }
        setRoundTransitionMessage(data?.roundTransition?.message || "");
        setAnswerExplanation("");
        setAnswerCode("");
        if (data.roundCompleted) {
          roundCompletedAtRef.current = Date.now();
          setQuestion("");
          setQuestionUrl("");
          questionRef.current = "";

          if (data.status === "completed") {
            setPendingQuestionFeedback(null);
            setRoundFeedbackView(null);
            roundFeedbackRef.current = null;
            setFeedback(data.feedback || "");
            setScore(typeof data.score === "number" ? data.score : null);
          } else {
            const deferredRoundSummary = {
              score:
                typeof data?.roundFeedback?.score === "number"
                  ? data.roundFeedback.score
                  : null,
              strengths: data?.roundFeedback?.strengths || [],
              weaknesses: data?.roundFeedback?.weaknesses || [],
              summary: data?.roundFeedback?.summary || "",
              improvementTips: data?.roundFeedback?.improvementTips || [],
              dsaRoundStats: normalizeDsaRoundStatsFromFeedback(data?.roundFeedback?.dsaRoundStats),
              topicsCoveredThisRound: normalizeTopicsCoveredFromFeedback(
                data?.roundFeedback?.topicsCoveredThisRound
              ),
              nextRoundAvailable: Boolean(data?.nextRoundAvailable),
            };
            const codeExecSummaryData = data.lastCodeExecutionSummary;
            const hasLastAnswerFeedback =
              String(data.feedback || "").trim().length > 0 ||
              typeof data.score === "number" ||
              isCodeExecutionSummaryPayload(codeExecSummaryData);

            if (hasLastAnswerFeedback) {
              setPendingQuestionFeedback({
                answeredQuestion: snap.questionText || "",
                canReattempt: true,
                feedback: data.feedback || "",
                score: typeof data.score === "number" ? data.score : null,
                correctness: toDisplayCorrectness(data.correctness),
                relevance: toDisplayRelevance(data.relevance),
                mcqFeedback: buildMcqFeedbackFromStatus(data),
                codeExecutionSummary: isCodeExecutionSummaryPayload(codeExecSummaryData)
                  ? codeExecSummaryData
                  : null,
                nextQuestion: "",
                nextQuestionUrl: "",
                deferredRoundSummary,
              });
              setRoundFeedbackView(null);
              roundFeedbackRef.current = null;
              setFeedback("");
              setScore(null);
            } else {
              setPendingQuestionFeedback(null);
              setFeedback(data.feedback || "");
              setScore(typeof data.score === "number" ? data.score : null);
              setRoundFeedbackView(deferredRoundSummary);
              roundFeedbackRef.current = {
                nextRoundAvailable: Boolean(data?.nextRoundAvailable),
              };
            }
          }
        } else {
          roundFeedbackRef.current = null;
          setRoundFeedbackView(null);
          if (
            nextQ &&
            (String(data.feedback || "").trim() ||
              typeof data.score === "number" ||
              isCodeExecutionSummaryPayload(data.lastCodeExecutionSummary))
          ) {
            const sum = data.lastCodeExecutionSummary;
              setPendingQuestionFeedback({
                answeredQuestion: snap.questionText || "",
                canReattempt: true,
                feedback: data.feedback || "",
                score: typeof data.score === "number" ? data.score : null,
                correctness: toDisplayCorrectness(data.correctness),
                relevance: toDisplayRelevance(data.relevance),
                mcqFeedback: buildMcqFeedbackFromStatus(data),
                codeExecutionSummary: isCodeExecutionSummaryPayload(sum) ? sum : null,
                nextQuestion: nextQ,
                nextQuestionUrl: String(data.questionUrl || "").trim(),
                deferredRoundSummary: null,
              });
            setQuestion("");
            setQuestionUrl("");
            questionRef.current = "";
            setFeedback("");
            setScore(null);
          } else {
            setPendingQuestionFeedback(null);
            setQuestion(data.question || "");
            setQuestionUrl(String(data.questionUrl || "").trim());
            questionRef.current = data.question || "";
            setFeedback(data.feedback || "");
            setScore(typeof data.score === "number" ? data.score : null);
          }
        }
        // Resume intentionally disabled.
      }
    } catch (err) {
      console.error("Failed to submit interview answer:", err);
      setError(err?.response?.data?.error || "Failed to submit answer.");
      setIsProcessing(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleContinueToNextQuestion = useCallback(() => {
    const ctx = pendingQuestionFeedbackRef.current;
    if (!ctx) return;

    if (ctx.deferredRoundSummary) {
      const d = ctx.deferredRoundSummary;
      setPendingQuestionFeedback(null);
      setFeedback("");
      setScore(null);
      setAnswerExplanation("");
      setAnswerCode("");
      setRoundFeedbackView(d);
      roundFeedbackRef.current = {
        nextRoundAvailable: Boolean(d.nextRoundAvailable),
      };
      return;
    }

    if (!ctx.nextQuestion) {
      setPendingQuestionFeedback(null);
      return;
    }
    setQuestion(ctx.nextQuestion);
    setQuestionUrl(String(ctx.nextQuestionUrl || "").trim());
    questionRef.current = ctx.nextQuestion;
    setPendingQuestionFeedback(null);
    setFeedback("");
    setScore(null);
    setAnswerExplanation("");
    setAnswerCode("");
    setSelectedMcqOptionId("");
    const sid = activeSessionIdRef.current;
    if (sid && user?.betaAccess !== false) {
      interviewAPI
        .getInterviewStatus(sid)
        .then(({ data: st }) => {
          if (Array.isArray(st.roundsQuestionSummary)) {
            setRoundsQuestionSummary(st.roundsQuestionSummary);
          }
          if (typeof st.questionsPlannedThisRound === "number") {
            setQuestionsPlannedThisRound(st.questionsPlannedThisRound);
          }
          if (typeof st.currentQuestionNumberWithinRound === "number") {
            setCurrentQuestionNumberWithinRound(st.currentQuestionNumberWithinRound);
          }
          applyQuestionMetaFromStatus(st);
        })
        .catch(() => {});
    }
  }, [user?.betaAccess, applyQuestionMetaFromStatus]);

  const handleReattemptQuestion = useCallback(async () => {
    const sid = activeSessionIdRef.current || sessionId;
    if (!sid || user?.betaAccess === false) return;

    loadingRef.current = true;
    roundFeedbackRef.current = null;
    setLoading(true);
    setError("");
    try {
      await interviewAPI.beginQuestionReattempt({ sessionId: sid });
      const { data: st } = await interviewAPI.getInterviewStatus(sid);
      applyInterviewStatusPayload(st);
      setPendingQuestionFeedback(null);
      setAnswerExplanation("");
      setAnswerCode("");
      setFeedback("");
      setScore(null);
    } catch (err) {
      console.error("Failed to begin question reattempt:", err);
      setError(err?.response?.data?.error || "Could not start a reattempt.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [sessionId, user?.betaAccess, applyInterviewStatusPayload]);

  const handleStartNextRound = async () => {
    if (!sessionId || loading || !roundFeedbackView?.nextRoundAvailable) return;
    if (user?.betaAccess === false) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    setPendingQuestionFeedback(null);
    try {
      const { data } = await interviewAPI.moveToNextRound({ sessionId });
      setQuestion(data.question || "");
      setQuestionUrl(String(data.questionUrl || "").trim());
      setStatus(data.status || "in_progress");
      setCurrentRound(data.currentRound || "");
      setCurrentRoundIndex(Math.max(0, (Number(data.currentRound) || 1) - 1));
      setDifficultyLevel(data.difficulty || "");
      if (data.roundType != null && String(data.roundType).trim() !== "") {
        setCurrentRoundType(String(data.roundType).trim());
      }
      roundFeedbackRef.current = null;
      setRoundFeedbackView(null);
      setAnswerExplanation("");
      setAnswerCode("");
      await enterFullscreen();
      try {
        const { data: st } = await interviewAPI.getInterviewStatus(sessionId);
        applyInterviewStatusPayload(st);
      } catch {
        setCurrentQuestionNumberWithinRound(1);
      }
    } catch (err) {
      console.error("Failed to start next round:", err);
      setError(err?.response?.data?.error || "Failed to start next round.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const showStartPrompt = !sessionId || status === "idle";
  const interviewCompleted = status === "completed";

  useEffect(() => {
    if (!showStartPrompt || !user?.userId) return;
    refreshSlotBookingStatus();
  }, [showStartPrompt, user?.userId, refreshSlotBookingStatus]);

  const showInterviewQuestionHero = useMemo(() => {
    return (
      isInterviewActive &&
      Boolean(question?.trim()) &&
      !isProcessing &&
      !pendingQuestionFeedback &&
      !roundFeedbackView
    );
  }, [
    isInterviewActive,
    question,
    isProcessing,
    pendingQuestionFeedback,
    roundFeedbackView,
  ]);

  const typewriterQuestionActive = useMemo(() => {
    return (
      Boolean(question?.trim()) && !isProcessing && !pendingQuestionFeedback
    );
  }, [question, isProcessing, pendingQuestionFeedback]);

  const typedQuestionText = useTypewriterText(question ?? "", typewriterQuestionActive);
  const questionTypingIncomplete =
    typewriterQuestionActive &&
    typedQuestionText.length < String(question ?? "").length;

  const interviewRoundPlanLine = useMemo(() => {
    if (roundsQuestionSummary.length > 0) {
      return roundsQuestionSummary
        .map((r) => `Round ${r.roundNumber}: ${r.questionCount} questions`)
        .join(" · ");
    }
    if (totalRounds > 0) {
      return `This interview has ${totalRounds} round${totalRounds === 1 ? "" : "s"}.`;
    }
    return "";
  }, [roundsQuestionSummary, totalRounds]);

  const displayInterviewRoundNumber = useMemo(() => {
    const n = Number(currentRound);
    if (Number.isFinite(n) && n >= 1) return n;
    return currentRoundIndex + 1;
  }, [currentRound, currentRoundIndex]);

  const currentRoundTypeDisplay = useMemo(() => {
    if (String(currentRoundType || "").trim()) return String(currentRoundType).trim();
    const detailType =
      Array.isArray(roundsDetails) && roundsDetails[currentRoundIndex]
        ? roundsDetails[currentRoundIndex].questionType
        : "";
    return String(detailType || "").trim() || "General";
  }, [currentRoundType, roundsDetails, currentRoundIndex]);

  const interviewRoundsOverview = useMemo(() => {
    const byRound = Array.isArray(roundsQuestionSummary) ? roundsQuestionSummary : [];
    if (byRound.length > 0) {
      return byRound.map((item, idx) => {
        const labelFromDetails =
          Array.isArray(roundsDetails) && roundsDetails[idx]
            ? roundsDetails[idx].questionType
            : "";
        const labelFromPlan = Array.isArray(roundsPlan) ? roundsPlan[idx] : "";
        const category = String(labelFromDetails || labelFromPlan || "General").trim();
        return {
          roundNumber: item.roundNumber || idx + 1,
          category: category || "General",
          questionCount: item.questionCount || 0,
        };
      });
    }

    const total = Number(totalRounds) || 0;
    if (total <= 0) return [];
    return Array.from({ length: total }, (_, idx) => ({
      roundNumber: idx + 1,
      category:
        String(
          (Array.isArray(roundsDetails) && roundsDetails[idx]
            ? roundsDetails[idx].questionType
            : "") ||
            (Array.isArray(roundsPlan) ? roundsPlan[idx] : "") ||
            "General"
        ).trim() || "General",
      questionCount:
        (Array.isArray(roundsQuestionSummary) && roundsQuestionSummary[idx]
          ? roundsQuestionSummary[idx].questionCount
          : null) ?? 0,
    }));
  }, [roundsQuestionSummary, roundsDetails, roundsPlan, totalRounds]);

  /** Fullscreen + any loaded interview session (in progress or summary) — matches browser fullscreen during mock interview. */
  const showFullscreenThemeToggle =
    typeof document !== "undefined" &&
    isInFullscreen &&
    Boolean(sessionId) &&
    status !== "idle";

  return (
    <>
      {showFullscreenThemeToggle &&
        createPortal(
          <div
            className="fixed z-[10050] flex flex-col items-end gap-2 pointer-events-none"
            style={{
              top: "max(1rem, env(safe-area-inset-top, 0px))",
              right: "max(1rem, env(safe-area-inset-right, 0px))",
            }}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-theme bg-theme-card px-3 py-2 text-sm font-semibold text-theme-primary shadow-lg hover:bg-theme-card-hover transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <FaSun className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              ) : (
                <FaMoon className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
              )}
              <span className="hidden sm:inline">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>
          </div>,
          document.body
        )}
    <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 relative">
      {interviewCompleted &&
        Boolean(sessionId) &&
        !roundFeedbackView &&
        !isProcessing && (
          <div
            className="mb-4 rounded-xl border border-theme-accent/50 bg-theme-input p-4 sm:p-5"
            role="status"
          >
            <p className="text-sm font-semibold text-theme-primary">All rounds complete</p>
            <p className="mt-1 text-sm text-theme-secondary">
              Your full interview summary is available under AI Interviews for this company. Use End
              interview when you are ready to return to the General tab.
            </p>
            <button
              type="button"
              onClick={handleEndInterview}
              className="mt-3 px-6 py-2.5 rounded-xl bg-theme-accent text-white text-sm font-semibold shadow-md transition-colors"
            >
              End interview
            </button>
          </div>
        )}
      {showInterviewQuestionHero && (
        <section
          className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-theme"
          aria-labelledby="interview-current-question-heading"
        >
          <h2 id="interview-current-question-heading" className="sr-only">
            Current interview question
          </h2>
          <div className="mb-5 rounded-xl border border-theme bg-theme-input p-4">
            <p className="text-[11px] sm:text-xs font-semibold tracking-[0.12em] text-theme-muted uppercase mb-3 leading-snug">
              Interview Progress
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <div className="rounded-lg border border-theme bg-theme-card px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-theme-secondary font-semibold">
                  Total rounds
                </p>
                <p className="text-base font-bold text-theme-primary tabular-nums">
                  {totalRounds || interviewRoundsOverview.length || 0}
                </p>
              </div>
              <div className="rounded-lg border border-theme bg-theme-card px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-theme-secondary font-semibold">
                  Current round
                </p>
                <p className="text-base font-bold text-theme-primary tabular-nums">
                  {displayInterviewRoundNumber}
                  <span className="text-theme-muted font-semibold mx-1">/</span>
                  {totalRounds || interviewRoundsOverview.length || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-theme bg-theme-card px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-theme-secondary font-semibold">
                  Current round type
                </p>
                <p className="text-sm font-semibold text-theme-primary truncate">
                  {currentRoundTypeDisplay}
                </p>
              </div>
            </div>
            {interviewRoundsOverview.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interviewRoundsOverview.map((item) => (
                  <span
                    key={`overview-round-${item.roundNumber}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-theme px-2.5 py-1.5 bg-theme-card text-xs text-theme-secondary"
                  >
                    <span className="font-semibold text-theme-primary">R{item.roundNumber}</span>
                    <span className="truncate max-w-[140px]">{item.category}</span>
                    <span className="text-theme-muted">({item.questionCount}Q)</span>
                  </span>
                ))}
              </div>
            )}
            {interviewRoundPlanLine ? (
              <p className="mt-2 text-[11px] text-theme-muted">{interviewRoundPlanLine}</p>
            ) : null}
          </div>
          {!isCodingRoundUI ? (
            <div className="rounded-xl border border-theme-accent/40 bg-theme-input px-4 py-5 sm:px-7 sm:py-7 shadow-inner">
              <p
                className="ai-interview-question-display whitespace-pre-wrap"
                aria-live="polite"
                aria-busy={questionTypingIncomplete || undefined}
              >
                {typedQuestionText}
                {questionTypingIncomplete ? (
                  <span className="ai-interview-typewriter-caret" aria-hidden />
                ) : null}
              </p>
              <InterviewQuestionSourceLink url={questionUrl} />
              <InterviewQuestionMetaRow
                key={codingQuestionId ? `meta-${codingQuestionId}` : `meta-${sessionId}-${currentQuestionNumberWithinRound}`}
                complexity={questionComplexity}
                topics={questionTopics}
                subtopics={questionSubtopics}
                companyTags={questionCompanyTags}
                variant="hero"
                hideCompanyTags={!isCodingRoundUI}
              />
            </div>
          ) : null}
        </section>
      )}
      <InterviewLimitModal
        open={interviewLimitOpen}
        onClose={() => setInterviewLimitOpen(false)}
        message={interviewLimitMessage}
        limitRequestStatus={interviewLimitRequestStatus}
        onRequestAccess={handleInterviewLimitRequest}
        requesting={interviewLimitRequesting}
      />

      {quitConfirmOpen && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quit-interview-title"
        >
          <div className="w-full max-w-xl rounded-2xl border border-theme-accent bg-theme-card shadow-2xl p-6 sm:p-8">
            <p
              id="quit-interview-title"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-accent mb-2"
            >
              Quit interview?
            </p>
            <h3 className="text-2xl font-bold text-theme-primary leading-tight">
              Your current progress will be discarded
            </h3>
            <p className="mt-4 text-sm sm:text-base text-theme-secondary leading-relaxed whitespace-pre-wrap">
              {EXIT_WARNING_MESSAGE}
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => resolveQuitConfirmation(false)}
                className="px-5 py-3 rounded-xl border border-theme text-theme-primary hover:bg-theme-nav transition-colors"
              >
                Resume interview
              </button>
              <button
                type="button"
                onClick={() => resolveQuitConfirmation(true)}
                className="px-5 py-3 rounded-xl border border-theme text-white font-semibold transition-colors"
                style={{
                  backgroundColor: "var(--warning)",
                  color: "var(--warning-foreground)",
                }}
              >
                Quit and discard
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingQuestionFeedback && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="question-feedback-title"
        >
          <div className="w-full max-w-2xl max-h-[min(92vh,880px)] overflow-y-auto rounded-2xl border border-theme-accent bg-theme-card shadow-2xl p-6 sm:p-10 flex flex-col gap-6">
            <div>
              <div className="flex items-start gap-3">
                <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
                  <img
                    src={rvLogo}
                    alt="RV College logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p
                    id="question-feedback-title"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-accent mb-2"
                  >
                    Answer feedback
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-theme-primary leading-tight">
                    Here&apos;s how you did
                  </h3>
                </div>
              </div>
              {String(pendingQuestionFeedback.answeredQuestion || "").trim() ? (
                <div className="mt-5 rounded-xl border border-theme-accent/35 bg-theme-input px-4 py-4 sm:px-6 sm:py-5 shadow-inner">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted mb-2">
                    Your question
                  </p>
                  <p className="ai-interview-question-display whitespace-pre-wrap leading-snug">
                    {pendingQuestionFeedback.answeredQuestion}
                  </p>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {pendingQuestionFeedback.score !== null && (
                  <div className="inline-flex items-center gap-3 rounded-xl bg-theme-input border border-theme px-4 py-3">
                    <span className="text-sm text-theme-secondary">Score</span>
                    <span className="text-3xl font-bold tabular-nums text-theme-accent">
                      {pendingQuestionFeedback.score}
                      <span className="text-lg font-semibold text-theme-secondary">/10</span>
                    </span>
                  </div>
                )}
                {pendingQuestionFeedback.correctness && !pendingQuestionFeedback.mcqFeedback ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-theme-input border border-theme px-4 py-3">
                    <span className="text-sm text-theme-secondary">Correctness</span>
                    <span className="text-sm font-semibold capitalize text-theme-primary">
                      {pendingQuestionFeedback.correctness}
                    </span>
                  </div>
                ) : null}
                {pendingQuestionFeedback.relevance && !pendingQuestionFeedback.mcqFeedback ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-theme-input border border-theme px-4 py-3">
                    <span className="text-sm text-theme-secondary">Relevance</span>
                    <span className="text-sm font-semibold capitalize text-theme-primary">
                      {pendingQuestionFeedback.relevance}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
              {pendingQuestionFeedback.codeExecutionSummary ? (
                <div className="rounded-xl border border-theme bg-theme-input/80 p-5 sm:p-6">
                  <p className="text-sm font-semibold text-theme-primary mb-3">Automated test results</p>
                  <ul className="text-sm text-theme-secondary space-y-2.5 tabular-nums">
                    <li>
                      <span className="text-theme-muted">Total — </span>
                      <span className="font-medium text-theme-primary">
                        {pendingQuestionFeedback.codeExecutionSummary.passedCount}/
                        {pendingQuestionFeedback.codeExecutionSummary.totalCount} passed
                      </span>
                    </li>
                    <li>
                      <span className="text-theme-muted">Visible cases — </span>
                      <span className="font-medium text-theme-primary">
                        {pendingQuestionFeedback.codeExecutionSummary.visiblePassedCount}/
                        {pendingQuestionFeedback.codeExecutionSummary.visibleTotalCount} passed
                      </span>
                    </li>
                    <li>
                      <span className="text-theme-muted">Hidden cases — </span>
                      <span className="font-medium text-theme-primary">
                        {pendingQuestionFeedback.codeExecutionSummary.hiddenPassedCount}/
                        {pendingQuestionFeedback.codeExecutionSummary.hiddenTotalCount} passed
                      </span>
                    </li>
                  </ul>
                  {Number(pendingQuestionFeedback.codeExecutionSummary.hiddenTotalCount) > 0 ? (
                    <HiddenTestCaseResultsList
                      hiddenTestResults={normalizeHiddenTestResultsFromSummary(
                        pendingQuestionFeedback.codeExecutionSummary
                      )}
                      className="mt-3 pt-3 border-t border-theme"
                    />
                  ) : null}
                  {(() => {
                    const failedVisible = normalizeFailedVisibleTestsFromSummary(
                      pendingQuestionFeedback.codeExecutionSummary
                    );
                    return failedVisible.length > 0 ? (
                      <FailedVisibleTestCaseResultsList
                        failedTests={failedVisible}
                        className="mt-3 pt-3 border-t border-theme"
                      />
                    ) : null;
                  })()}
                  {String(pendingQuestionFeedback.codeExecutionSummary.status || "").trim() ? (
                    <p className="text-[11px] text-theme-muted mt-3 leading-snug">
                      Runner status: {pendingQuestionFeedback.codeExecutionSummary.status}
                    </p>
                  ) : null}
                  {String(pendingQuestionFeedback.codeExecutionSummary.userDebugOutput || "").trim() ? (
                    <div className="mt-3 rounded-lg border border-theme bg-theme-card/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-muted mb-1">
                        Debug output (visible cases only)
                      </p>
                      <pre className="text-xs text-theme-primary whitespace-pre-wrap break-words max-h-40 overflow-y-auto font-mono leading-relaxed">
                        {pendingQuestionFeedback.codeExecutionSummary.userDebugOutput}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="rounded-xl border border-theme bg-theme-input/80 p-5 sm:p-6">
                <p className="text-sm font-semibold text-theme-primary mb-2">
                  {pendingQuestionFeedback.codeExecutionSummary ? "Additional details" : "Feedback"}
                </p>
                {pendingQuestionFeedback.mcqFeedback ? (
                  <McqAnswerFeedbackPanel
                    mcqFeedback={pendingQuestionFeedback.mcqFeedback}
                    correctness={pendingQuestionFeedback.correctness}
                    fallbackFeedback={pendingQuestionFeedback.feedback}
                  />
                ) : (
                  <p className="text-theme-secondary text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {String(pendingQuestionFeedback.feedback || "").trim()
                      ? pendingQuestionFeedback.feedback
                      : pendingQuestionFeedback.codeExecutionSummary
                        ? "No execution errors. Scoring is based on the test counts above."
                        : "No detailed feedback for this response."}
                  </p>
                )}
              </div>
            {pendingQuestionFeedback.canReattempt ? (
              <p className="text-[11px] text-theme-muted leading-snug">
                You may submit one reattempt for this question. Scores are stored per attempt; we may use
                the best attempt later.
              </p>
            ) : null}
            <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-3">
              {pendingQuestionFeedback.canReattempt ? (
                <button
                  type="button"
                  onClick={handleReattemptQuestion}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-theme-accent text-theme-accent text-base font-semibold bg-transparent hover:bg-theme-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reattempt question
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleContinueToNextQuestion}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-theme-accent text-white text-base font-semibold shadow-lg transition-colors disabled:opacity-50"
              >
                {pendingQuestionFeedback?.deferredRoundSummary
                  ? "View round summary"
                  : "Next question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {roundFeedbackView && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 ai-interview-backdrop backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="round-summary-title"
        >
          <div className="w-full max-w-3xl max-h-[min(92vh,900px)] overflow-y-auto rounded-2xl border border-theme-accent bg-theme-card shadow-2xl p-6 sm:p-10 flex flex-col gap-6">
            <div>
              <div className="flex items-start gap-3">
                <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
                  <img
                    src={rvLogo}
                    alt="RV College logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p
                    id="round-summary-title"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-accent mb-2"
                  >
                    Round complete
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-theme-primary">
                    {roundFeedbackView.dsaRoundStats ? "DSA round summary" : "Round summary"}
                  </h3>
                  {!roundFeedbackView.dsaRoundStats && roundFeedbackView.summary ? (
                    <p className="mt-4 text-theme-secondary text-sm sm:text-base leading-relaxed">
                      {roundFeedbackView.summary}
                    </p>
                  ) : null}
                </div>
              </div>
              {!roundFeedbackView.dsaRoundStats && roundFeedbackView.score !== null ? (
                <div className="mt-4 inline-flex items-center gap-3 rounded-xl bg-theme-input border border-theme-accent px-4 py-3">
                  <span className="text-sm text-theme-secondary">Round score</span>
                  <span className="text-3xl font-bold tabular-nums text-theme-accent">
                    {roundFeedbackView.score}
                    <span className="text-lg font-semibold text-theme-secondary">/10</span>
                  </span>
                </div>
              ) : null}
              {roundFeedbackView.dsaRoundStats ? (
                <div className="mt-4 rounded-xl border border-theme bg-theme-input p-5 sm:p-6 space-y-3 text-sm sm:text-base text-theme-secondary">
                  <p>
                    <span className="font-semibold text-theme-primary">Total questions attempted:</span>{" "}
                    <span className="tabular-nums text-theme-primary">
                      {roundFeedbackView.dsaRoundStats.answeredCorrectly +
                        roundFeedbackView.dsaRoundStats.partiallyAnswered}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-theme-primary">Total answered correctly:</span>{" "}
                    <span className="tabular-nums text-theme-primary">
                      {roundFeedbackView.dsaRoundStats.answeredCorrectly}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-theme-primary">Partial answers:</span>{" "}
                    <span className="tabular-nums text-theme-primary">
                      {roundFeedbackView.dsaRoundStats.partiallyAnswered}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-theme-primary">Topics covered during the round:</span>{" "}
                    <span className="text-theme-primary">
                      {(roundFeedbackView.topicsCoveredThisRound || []).length > 0
                        ? (roundFeedbackView.topicsCoveredThisRound || []).join(", ")
                        : "—"}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
            {!roundFeedbackView.dsaRoundStats ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-theme bg-theme-input p-4 sm:p-5">
                  <p className="text-sm font-semibold text-theme-accent mb-2">Strengths</p>
                  <ul className="list-disc pl-5 text-sm text-theme-secondary space-y-1.5">
                    {(roundFeedbackView.strengths || []).length ? (
                      (roundFeedbackView.strengths || []).map((item, idx) => (
                        <li key={`rf-s-${idx}`}>{item}</li>
                      ))
                    ) : (
                      <li className="list-none pl-0 text-theme-muted">—</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-xl border border-theme bg-theme-input p-4 sm:p-5">
                  <p className="text-sm font-semibold text-theme-accent mb-2">Areas to improve</p>
                  <ul className="list-disc pl-5 text-sm text-theme-secondary space-y-1.5">
                    {(roundFeedbackView.weaknesses || []).length ? (
                      (roundFeedbackView.weaknesses || []).map((item, idx) => (
                        <li key={`rf-w-${idx}`}>{item}</li>
                      ))
                    ) : (
                      <li className="list-none pl-0 text-theme-muted">—</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : null}
            {!roundFeedbackView.dsaRoundStats &&
            Array.isArray(roundFeedbackView.improvementTips) &&
            roundFeedbackView.improvementTips.length > 0 ? (
              <div className="rounded-xl border border-theme bg-theme-input p-4 sm:p-5">
                <p className="text-sm font-semibold text-theme-accent mb-2">Tips for next time</p>
                <ul className="list-disc pl-5 text-sm text-theme-secondary space-y-1.5">
                  {roundFeedbackView.improvementTips.map((item, idx) => (
                    <li key={`rf-tip-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {roundFeedbackView.nextRoundAvailable ? (
              <button
                type="button"
                onClick={handleStartNextRound}
                disabled={loading}
                className="w-full sm:w-auto self-center sm:self-end px-8 py-3.5 rounded-xl bg-theme-accent text-white text-base font-semibold disabled:opacity-60 shadow-lg transition-colors"
              >
                Next round
              </button>
            ) : (
              <div className="flex flex-col gap-3 w-full sm:w-auto sm:max-w-lg self-center sm:self-end">
                <p className="text-center text-sm text-theme-secondary">
                  Interview finished. Your full interview summary is available under{" "}
                  <span className="font-semibold text-theme-primary">AI Interviews</span> for this company.
                </p>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseFinalRoundSummary}
                    className="px-6 py-3 rounded-xl border border-theme text-theme-primary font-semibold hover:bg-theme-nav transition-colors"
                  >
                    Close summary
                  </button>
                  <button
                    type="button"
                    onClick={handleEndInterview}
                    className="px-8 py-3.5 rounded-xl bg-theme-accent text-white text-base font-semibold shadow-lg transition-colors"
                  >
                    End interview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isInterviewActive && (
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-theme-primary">AI Mock Interview</h2>
        <div data-tour="company-ai-interview-start" className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl p-1">
          {showStartPrompt && planRequiresDsaSlot ? (
            <button
              type="button"
              onClick={() => setSlotBookModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-theme-accent/50 bg-theme-hero px-4 py-2.5 text-sm font-semibold text-theme-accent hover:bg-theme-nav"
            >
              Book slot
            </button>
          ) : null}
          <button
            onClick={showStartPrompt ? handleStartInterview : resetInterviewState}
            disabled={
              loading ||
              (!showStartPrompt && status === "in_progress") ||
              interviewCompleted ||
              (showStartPrompt && !canStart)
            }
            className={`flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base font-semibold min-w-[11rem] ${
              loading ||
              (!showStartPrompt && status === "in_progress") ||
              interviewCompleted ||
              (showStartPrompt && !canStart)
                ? "bg-slate-700 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/40"
            }`}
          >
            {showStartPrompt ? "Start Interview" : "Reset"}
          </button>
        </div>
      </div>
      )}

      {!user?.userId && (
        <p className="text-sm text-theme-accent mb-3">
          Please login to start your AI interview.
        </p>
      )}

      {user?.userId && user?.betaAccess !== false && showStartPrompt && (
        <div data-tour="company-ai-interview-setup" className="space-y-4">
        {planRequiresDsaSlot ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              hasActiveDsaSlotNow
                ? "border-emerald-500/40 bg-emerald-500/10 text-theme-secondary"
                : "border-amber-500/40 bg-amber-500/10 text-theme-secondary"
            }`}
          >
            {slotStatusLoading ? (
              <span>Checking your interview slot…</span>
            ) : hasActiveDsaSlotNow ? (
              <span>
                <strong className="text-theme-primary">Slot active:</strong>{" "}
                {slotBookingStatus?.activeBooking?.label || "Your booked hour is now — you can start."}
              </span>
            ) : (
              <span>
                Your plan includes a <strong className="text-theme-primary">DSA</strong> round. Book a
                1-hour IST slot (max 5 students/hour), then start anytime during that hour.{" "}
                <button
                  type="button"
                  onClick={() => setSlotBookModalOpen(true)}
                  className="font-semibold text-theme-accent underline underline-offset-2"
                >
                  Book slot
                </button>
              </span>
            )}
          </div>
        ) : null}
        <div className="plan-setup-panel mb-4 rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-theme-primary">Interview plan mode</p>
              <p className="text-xs text-theme-secondary">
                Customize round order, type, difficulty, and focus area for non-DSA rounds (up to{" "}
                {MAX_CUSTOM_ROUNDS} rounds).
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-theme-primary">
                Number of rounds
              </label>
              <div className="min-w-0 flex-1 sm:flex-none sm:min-w-[8rem]">
                <ThemedSelect
                  ariaLabel="Number of rounds"
                  value={normalizedCustomRounds.length}
                  onChange={(next) => handleCustomRoundCountChange(next)}
                  options={[1, 2, 3, 4].map((count) => ({
                    value: count,
                    label: String(count),
                  }))}
                />
              </div>
            </div>

            <div
              className="space-y-3"
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedRoundIndex !== null) {
                  setDragOverRoundIndex(normalizedCustomRounds.length);
                }
              }}
              onDrop={() => {
                if (draggedRoundIndex !== null) {
                  handleRoundDrop(normalizedCustomRounds.length);
                }
              }}
            >
              {normalizedCustomRounds.map((round, idx) => (
                <React.Fragment key={`custom-round-${idx}`}>
                  {draggedRoundIndex !== null &&
                    dragOverRoundIndex === idx &&
                    draggedRoundIndex !== idx && (
                      <div className="h-4 rounded-md border border-dashed border-theme-accent bg-theme-accent/10" />
                    )}
                  <div
                    onDragOver={(event) => handleRoundDragOver(event, idx)}
                    onDrop={() => handleRoundDrop(idx)}
                    className={`${PLAN_ROUND_ROW_CLASS} ${
                      roundTypeHasFocusPicker(round.type)
                        ? "sm:grid-cols-2 lg:grid-cols-4"
                        : "sm:grid-cols-3"
                    } ${
                      draggedRoundIndex === idx
                        ? "opacity-50"
                        : dragOverRoundIndex === idx
                          ? "border-theme-accent"
                          : ""
                    }`}
                  >
                    <p
                      draggable
                      onDragStart={() => handleRoundDragStart(idx)}
                      onDragEnd={handleRoundDragEnd}
                      className="text-xs font-semibold uppercase tracking-wide text-theme-muted flex items-center gap-2 min-w-0 cursor-grab active:cursor-grabbing select-none"
                    >
                      <span className="text-theme-accent">::</span> Round {idx + 1}
                    </p>
                    <div className="relative min-w-0">
                      <ThemedSelect
                        ariaLabel={`Round ${idx + 1} type`}
                        value={round.type}
                        onChange={(next) => handleCustomRoundFieldChange(idx, "type", next)}
                        options={ROUND_TYPE_OPTIONS.map((type) => ({
                          value: type,
                          label: type,
                        }))}
                        triggerSurface="card"
                      />
                    </div>
                    {roundTypeHasFocusPicker(round.type) && (
                      <div className="relative min-w-0">
                        <ThemedSelect
                          ariaLabel={`Round ${idx + 1} focus`}
                          value={round.focus}
                          onChange={(next) => handleCustomRoundFieldChange(idx, "focus", next)}
                          options={getFocusOptionsForRoundType(round.type).map((opt) => ({
                            value: opt.id,
                            label: opt.label,
                          }))}
                          triggerSurface="card"
                        />
                      </div>
                    )}
                    <div className="relative min-w-0">
                      <ThemedSelect
                        ariaLabel={`Round ${idx + 1} difficulty`}
                        value={round.difficulty}
                        onChange={(next) => handleCustomRoundFieldChange(idx, "difficulty", next)}
                        options={ROUND_DIFFICULTY_OPTIONS.map((difficulty) => ({
                          value: difficulty,
                          label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
                        }))}
                        triggerSurface="card"
                      />
                    </div>
                  </div>
                </React.Fragment>
              ))}
              {draggedRoundIndex !== null &&
                dragOverRoundIndex === normalizedCustomRounds.length && (
                  <div className="h-4 rounded-md border border-dashed border-theme-accent bg-theme-accent/10" />
                )}
            </div>

            {customPlanValidationError && (
              <p className="text-xs font-medium text-theme-accent">{customPlanValidationError}</p>
            )}
          </div>
        </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-theme-accent bg-theme-input text-theme-primary text-sm">
          {error}
        </div>
      )}

      {isInterviewActive && !showInterviewQuestionHero && (
        <div className="mb-4 p-3 rounded-lg border border-theme-accent bg-theme-input flex items-center justify-between gap-3">
          <p className="text-sm text-theme-primary">
            Interview mode is active. Press <span className="font-semibold">Esc</span> or use
            the <span className="font-semibold">Back</span> button to quit. If you leave now,
            this in-progress interview will be discarded and will not be saved.
          </p>
        </div>
      )}

      {isInterviewActive && !isInFullscreen && needsFullscreenResume && (
        <div className="mb-4 p-3 rounded-lg border border-theme-accent bg-theme-input flex items-center justify-between gap-3">
          <p className="text-sm text-theme-primary">
            Interview is still active. Return to fullscreen to continue.
          </p>
          <button
            type="button"
            onClick={enterFullscreen}
            className="px-3 py-1.5 rounded-lg bg-theme-accent text-white text-sm font-semibold transition-colors"
          >
            Return to Fullscreen
          </button>
        </div>
      )}

      {roundTransitionMessage && (
        <div className="mb-4 p-3 rounded-lg border border-theme-accent bg-theme-input text-theme-secondary text-sm">
          {roundTransitionMessage}
        </div>
      )}

      {isProcessing && status === "in_progress" && sessionId && (
        <div
          className="fixed inset-0 z-[190] flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-theme-accent bg-theme-card shadow-2xl overflow-hidden">
            <div className="bg-theme-input px-6 pt-6 pb-4 border-b border-theme">
              <div className="flex items-start gap-3 mb-1">
                <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
                  <img
                    src={rvLogo}
                    alt="RV College logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 pt-1">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-accent text-lg"
                      aria-hidden
                    >
                      ✦
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
                        While you wait
                      </p>
                      <p className="text-lg font-bold text-theme-primary">
                        Evaluating your answer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-theme-secondary ml-[108px] sm:ml-[124px]">
                This usually takes a few seconds. Take a breath and skim a tip below.
              </p>
            </div>
            <div className="px-6 py-6 min-h-[140px] flex flex-col justify-center">
              {tips.length > 0 ? (
                <>
                  <div
                    key={currentTipIndex % tips.length}
                    className="rounded-xl border border-theme bg-theme-input/90 p-4 sm:p-5 transition-all duration-300"
                  >
                    <p className="text-xs font-semibold text-theme-accent mb-2 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                      Interview tip
                    </p>
                    <p className="text-sm sm:text-base text-theme-primary leading-relaxed whitespace-pre-wrap">
                      {tips[currentTipIndex % tips.length]}
                    </p>
                  </div>
                  <div className="flex justify-center gap-1.5 mt-4" aria-hidden>
                    {tips.map((_, i) => (
                      <span
                        key={`tip-dot-${i}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === currentTipIndex % tips.length
                            ? "w-6 bg-theme-accent"
                            : "w-1.5 bg-theme-muted/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="h-9 w-9 rounded-full border-2 border-theme-accent border-t-transparent animate-spin" />
                  <p className="text-sm text-theme-secondary text-center">
                    Hang tight — scoring your response.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!showInterviewQuestionHero &&
        question &&
        !isProcessing &&
        !pendingQuestionFeedback &&
        !isCodingRoundUI && (
        <div className="mb-4">
          <div className="mb-2 flex flex-wrap gap-2 text-xs">
            {currentRound && (
              <span className="px-2 py-1 rounded-md bg-theme-card border border-theme text-theme-secondary">
                Round: {currentRound}
              </span>
            )}
            {totalRounds > 0 && (
              <span className="px-2 py-1 rounded-md bg-theme-card border border-theme text-theme-secondary">
                Stage: {Math.min(currentRoundIndex + 1, totalRounds)}/{totalRounds}
              </span>
            )}
            {difficultyLevel && (
              <span className="px-2 py-1 rounded-md bg-theme-card border border-theme text-theme-secondary">
                Difficulty: {difficultyLevel}
              </span>
            )}
            {isCodingRoundUI && (
              <span className="px-2 py-1 rounded-md bg-theme-accent/10 border border-theme-accent text-theme-accent font-medium">
                Coding round — explanation + code
              </span>
            )}
          </div>
          <p className="text-xs uppercase tracking-wide text-theme-secondary mb-2">
            Current Question
          </p>
          <div className="p-4 rounded-lg border border-theme bg-theme-input text-theme-primary">
            <p
              className="ai-interview-question-display whitespace-pre-wrap leading-snug"
              aria-live="polite"
              aria-busy={questionTypingIncomplete || undefined}
            >
              {typedQuestionText}
              {questionTypingIncomplete ? (
                <span className="ai-interview-typewriter-caret" aria-hidden />
              ) : null}
            </p>
            <InterviewQuestionSourceLink url={questionUrl} />
            <InterviewQuestionMetaRow
              key={codingQuestionId ? `meta-${codingQuestionId}` : `meta-${sessionId}-${currentQuestionNumberWithinRound}`}
              complexity={questionComplexity}
              topics={questionTopics}
              subtopics={questionSubtopics}
              companyTags={questionCompanyTags}
              hideCompanyTags={!isCodingRoundUI}
            />
          </div>
          {Array.isArray(roundsDetails) && roundsDetails.length > 0 ? (
            <div className="mt-2">
              <p className="text-xs text-theme-secondary mb-1">
                Round-wise question style
              </p>
              <ul className="list-disc pl-5 text-xs text-theme-secondary space-y-0.5">
                {roundsDetails.map((item, idx) => (
                  <li key={`round-detail-${idx}`}>
                    <span className="text-theme-primary">{item.round}:</span> {item.questionType}
                  </li>
                ))}
              </ul>
            </div>
          ) : roundsPlan.length > 0 ? (
            <p className="mt-2 text-xs text-theme-secondary">
              Planned rounds: {roundsPlan.join(" -> ")}
            </p>
          ) : null}
        </div>
      )}

      {status === "in_progress" &&
        sessionId &&
        question &&
        !roundFeedbackView &&
        !pendingQuestionFeedback &&
        !isProcessing && (
        <div className="ai-interview-answer-shell space-y-5">
          {!isCodingRoundUI && !isMcqQuestionUI ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-theme-primary tracking-tight">Your answer</p>
                  <p className="text-[11px] text-theme-muted leading-snug">
                    Write your answer in the box below.
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-end gap-3 shrink-0 w-full sm:w-auto">
                  <p className="text-[11px] font-medium tabular-nums text-theme-muted sm:text-right whitespace-nowrap">
                    {answerCharCount} chars
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Answer</p>
                  <textarea
                    ref={answerTextAreaRef}
                    value={answerExplanation}
                    onChange={(e) => setAnswerExplanation(e.target.value)}
                    rows={6}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleSubmitAnswer();
                      }
                    }}
                    className="w-full min-h-[148px] px-4 py-3.5 rounded-xl bg-theme-input border-2 border-theme-input text-[15px] leading-relaxed text-theme-primary placeholder:text-theme-muted/80 transition-[border-color,box-shadow] duration-150 resize-y focus:outline-none focus:border-theme-accent focus:ring-0"
                    placeholder={
                      isSqlRoundUI
                        ? "Explain your SQL approach (joins, indexes, normalization, query plans, trade-offs — prose or example snippets)…"
                        : "Type your answer..."
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          ) : null}

          {!isCodingRoundUI && isMcqQuestionUI ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-theme-primary tracking-tight">Select one option</p>
                <p className="text-[11px] text-theme-muted leading-snug">
                  Tap a card to choose your answer, then submit.
                </p>
              </div>
              <fieldset disabled={loading}>
                <legend className="sr-only">Multiple choice options</legend>
                <McqOptionGrid
                  options={mcqPayload?.options}
                  selectedOptionId={selectedMcqOptionId}
                  onSelect={setSelectedMcqOptionId}
                  disabled={loading}
                  namePrefix={`mcq-${sessionId}-${currentQuestionNumberWithinRound}`}
                />
              </fieldset>
            </div>
          ) : null}

          {isCodingRoundUI ? (
            <InterviewCodingPlatform
              questionText={typedQuestionText}
              questionTypingIncomplete={questionTypingIncomplete}
              questionUrl={questionUrl}
              difficulty={difficultyLevel || "medium"}
              roundType={currentRoundType || "DSA"}
              questionNumber={currentQuestionNumberWithinRound}
              questionsInRound={questionsPlannedThisRound}
              visibleTestCases={visibleTestCases}
              complexity={questionComplexity}
              codingFunctionSignature={codingFunctionSignature}
              codingStarterCode={codingStarterCode}
              answerCode={answerCode}
              onAnswerCodeChange={setAnswerCode}
              language={codingLanguage}
              languageOptions={codingLanguageOptions}
              onLanguageChange={handleCodingLanguageChange}
              onRun={handleRunPreview}
              onSubmit={handleSubmitAnswer}
              canSubmit={canSubmitAnswer}
              runLoading={previewExecutionLoading}
              submitLoading={loading}
              disabled={loading || isProcessing}
              placeholder={interviewCodeWorkspacePlaceholder}
              onSubmitShortcut={handleSubmitAnswer}
              previewExecution={previewExecutionResult}
              previewLoading={previewExecutionLoading}
              previewHints={previewFixHints}
              previewRunInlineHint={previewRunInlineHint}
              onDismissPreviewHint={() => setPreviewRunInlineHint("")}
              leftPaneWidth={codingLeftPanePx}
              paneWrapRef={codingPaneWrapRef}
              splitDragRef={codingSplitDragRef}
              onLeftPaneWidthChange={handleCodingLeftPaneWidthChange}
            />
          ) : null}

          {!isCodingRoundUI ? (
            <div className="ai-interview-submit-row flex flex-wrap items-center gap-2 justify-end sm:gap-3 sm:justify-between">
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!canSubmitAnswer}
                className={`inline-flex min-w-0 max-w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold sm:px-5 sm:py-2.5 sm:text-sm transition-[background-color,box-shadow,opacity] ${
                  canSubmitAnswer
                    ? "bg-theme-accent text-white hover:brightness-105 active:brightness-95"
                    : "bg-theme-card text-theme-muted cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <span className="sm:hidden">…</span>
                    <span className="hidden sm:inline">Submitting...</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Submit</span>
                    <span className="hidden sm:inline">Submit Answer</span>
                  </>
                )}
              </button>
            </div>
          ) : null}

        </div>
      )}
    </div>
    <InterviewSlotBookModal
      open={slotBookModalOpen}
      onClose={() => setSlotBookModalOpen(false)}
      customRounds={normalizedCustomRounds}
      onBooked={refreshSlotBookingStatus}
    />
    </>
  );
}

export default AIInterviewTab;

