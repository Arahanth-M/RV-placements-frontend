import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../utils/AuthContext";
import { useTheme } from "../../utils/ThemeContext";
import { interviewAPI } from "../../utils/api";
import { FaMoon, FaSun } from "react-icons/fa";
import rvLogo from "../../assets/logo2.webp";
import InterviewCodeWorkspace from "./InterviewCodeWorkspace";

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

const buildDefaultCustomRounds = (count = 2) =>
  Array.from({ length: Math.min(MAX_CUSTOM_ROUNDS, Math.max(1, Number(count) || 1)) }, () => ({
    type: "DSA",
    difficulty: "medium",
  }));

const placementSlotKey = (slot) =>
  `${slot?.visitType ?? ""}\u001f${slot?.mergePlacementByType ? "mt" : "ex"}`;

const formatPlacementSlotSummary = (slot) => {
  if (!slot) return "";
  const typePart = slot.visitType?.trim() ? slot.visitType.trim() : "Default";
  return typePart;
};

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

/** Whether UI should show the coding workspace (DSA / coding rounds only). */
function isCodingInterviewRound(roundTypeLabel) {
  const s = String(roundTypeLabel || "").trim().toLowerCase();
  if (!s) return false;
  if (s.includes("system design")) return false;
  if (s.includes("hr") || s.includes("behavior")) return false;
  return (
    s.includes("dsa") ||
    s.includes("sql") ||
    s.includes("coding") ||
    s.includes("algorithm") ||
    s.includes("data structure") ||
    s.includes("/coding")
  );
}

/** Planned question counts per round (mirrors backend interview-status shape). */
function deriveRoundsQuestionSummary(rounds) {
  if (!Array.isArray(rounds)) return [];
  return rounds.map((r, idx) => {
    const roundNumber = typeof r.roundNumber === "number" ? r.roundNumber : idx + 1;
    let qc =
      typeof r.questionCount === "number" && Number.isFinite(r.questionCount)
        ? Math.round(r.questionCount)
        : null;
    const slots = Array.isArray(r.questions) ? r.questions.length : 0;
    if (qc == null || qc < 1) qc = Math.max(slots, 3);
    qc = Math.min(5, Math.max(3, qc));
    return { roundNumber, questionCount: qc };
  });
}

/** Single blob sent to the API: prose-only rounds use explanation; coding rounds combine labeled sections. */
function buildInterviewSubmissionAnswer(explanation, code, isCodingRound) {
  const ex = String(explanation ?? "").trim();
  const co = String(code ?? "").trim();
  if (!isCodingRound) return ex;
  const parts = [];
  if (ex) parts.push(`Explanation:\n${ex}`);
  if (co) parts.push(`Code / solution:\n${co}`);
  return parts.join("\n\n").trim();
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

function ThemedSelect({ value, options, onChange, placeholder = "Select option", ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocPointer = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, []);

  const active = options.find((item) => String(item.value) === String(value)) || null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full min-w-[140px] px-3 py-2 rounded-xl border border-theme bg-theme-input text-sm text-theme-primary text-left flex items-center justify-between gap-2 hover:bg-theme-card focus:outline-none focus:border-theme-accent transition-colors"
      >
        <span className="truncate">{active?.label || placeholder}</span>
        <svg
          className={`h-4 w-4 text-theme-muted transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 left-0 right-0 w-full max-h-56 overflow-auto rounded-xl border border-theme-accent bg-theme-card shadow-2xl py-1.5"
        >
          {options.map((item) => {
            const isActive = String(item.value) === String(value);
            const isHovered = String(item.value) === String(hoveredValue);
            return (
              <li key={`${ariaLabel || "select"}-${item.value}`} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onMouseEnter={() => setHoveredValue(item.value)}
                  onMouseLeave={() => setHoveredValue(null)}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors border-l-2 ${
                    isActive
                      ? "border-theme-accent bg-theme-accent/10 text-theme-primary font-semibold"
                      : isHovered
                      ? "border-theme-accent bg-theme-input text-theme-primary font-semibold"
                      : "border-transparent text-theme-secondary hover:bg-theme-input hover:text-theme-primary"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
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
  const [answerExplanation, setAnswerExplanation] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const answerCharCount =
    answerExplanation.trim().length + answerCode.trim().length;
  const [_feedback, setFeedback] = useState("");
  const [_score, setScore] = useState(null);
  const [status, setStatus] = useState("idle");
  const [report, setReport] = useState(null);
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
  const [questionsPlannedThisRound, setQuestionsPlannedThisRound] = useState(3);
  const [currentQuestionNumberWithinRound, setCurrentQuestionNumberWithinRound] = useState(1);
  const [customRounds, setCustomRounds] = useState(() => buildDefaultCustomRounds(2));
  const [draggedRoundIndex, setDraggedRoundIndex] = useState(null);
  const [dragOverRoundIndex, setDragOverRoundIndex] = useState(null);
  const [visitSlots, setVisitSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [slotMenuOpen, setSlotMenuOpen] = useState(false);
  const slotPickerRef = useRef(null);
  const [roundTransitionMessage, setRoundTransitionMessage] = useState("");
  const [roundFeedbackView, setRoundFeedbackView] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tips, setTips] = useState([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  /** After each answer: full-screen feedback until user taps "Next question". */
  const [pendingQuestionFeedback, setPendingQuestionFeedback] = useState(null);
  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false);
  const [isInFullscreen, setIsInFullscreen] = useState(
    Boolean(document.fullscreenElement)
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
  const tipsRef = useRef([]);
  tipsRef.current = tips;
  const pendingQuestionFeedbackRef = useRef(null);
  pendingQuestionFeedbackRef.current = pendingQuestionFeedback;
  const quitConfirmResolverRef = useRef(null);

  const selectedPlacementSlot = useMemo(() => {
    if (!visitSlots.length || !selectedSlotKey) return null;
    return visitSlots.find((s) => placementSlotKey(s) === selectedSlotKey) ?? null;
  }, [visitSlots, selectedSlotKey]);

  const placementSelectionReady = useMemo(() => {
    if (user?.betaAccess === false) return true;
    if (slotsLoading) return false;
    if (!visitSlots.length) return false;
    return Boolean(selectedSlotKey);
  }, [user?.betaAccess, slotsLoading, visitSlots.length, selectedSlotKey]);

  const normalizedCustomRounds = useMemo(
    () =>
      (Array.isArray(customRounds) ? customRounds : [])
        .slice(0, MAX_CUSTOM_ROUNDS)
        .map((round) => ({
          type: ROUND_TYPE_OPTIONS.includes(round?.type) ? round.type : "DSA",
          difficulty: ROUND_DIFFICULTY_OPTIONS.includes(round?.difficulty)
            ? round.difficulty
            : "medium",
        })),
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

  const canStart = useMemo(() => {
    return (
      Boolean(user?.userId && company?._id) &&
      !loading &&
      placementSelectionReady &&
      !customPlanValidationError
    );
  }, [user?.userId, company?._id, loading, placementSelectionReady, customPlanValidationError]);

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

  const submissionAnswerDraft = useMemo(
    () =>
      buildInterviewSubmissionAnswer(
        answerExplanation,
        answerCode,
        isCodingRoundUI
      ),
    [answerExplanation, answerCode, isCodingRoundUI]
  );

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

  /** After every round is done, the server sets status to completed and attaches finalReport; poll if the client is briefly ahead of the report. */
  useEffect(() => {
    if (status !== "completed" || !sessionId || report) {
      return undefined;
    }

    let cancelled = false;
    let intervalId = null;

    const tick = async () => {
      try {
        if (user?.betaAccess === false) return;
        const { data } = await interviewAPI.getInterviewStatus(sessionId);
        if (cancelled) return;
        if (data?.report) {
          setReport(data.report);
        }
        if (data?.status === "completed" && typeof data.totalRounds === "number") {
          setTotalRounds(Number(data.totalRounds) || 0);
        }
      } catch {
        // ignore transient errors while waiting for the final report
      }
    };

    tick();
    intervalId = window.setInterval(tick, 2000);
    const timeoutId = window.setTimeout(() => {
      if (intervalId) window.clearInterval(intervalId);
      intervalId = null;
    }, 120000);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [status, sessionId, report, user?.betaAccess]);

  const fetchVisitSlots = useCallback(async () => {
    if (!company?._id) {
      setVisitSlots([]);
      return;
    }

    if (user?.betaAccess === false) {
      setVisitSlots([]);
      return;
    }

    setSlotsLoading(true);
    try {
      const { data } = await interviewAPI.getInterviewVisitOptions(company._id);
      const slots = Array.isArray(data?.slots) ? data.slots : [];
      setVisitSlots(slots);
    } catch {
      setVisitSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [company?._id, user?.betaAccess]);

  useEffect(() => {
    fetchVisitSlots();
  }, [fetchVisitSlots]);

  useEffect(() => {
    setSelectedSlotKey("");
    setSlotMenuOpen(false);
  }, [company?._id]);

  useEffect(() => {
    if (!visitSlots.length) return;
    setSelectedSlotKey((prev) => {
      if (prev && visitSlots.some((s) => placementSlotKey(s) === prev)) {
        return prev;
      }
      if (visitSlots.length === 1) {
        return placementSlotKey(visitSlots[0]);
      }
      return "";
    });
  }, [visitSlots]);

  useEffect(() => {
    if (!slotMenuOpen) return undefined;
    const onDocMouseDown = (e) => {
      const root = slotPickerRef.current;
      if (root && !root.contains(e.target)) {
        setSlotMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [slotMenuOpen]);

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
          return {
            ...round,
            type: ROUND_TYPE_OPTIONS.includes(value) ? value : "DSA",
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
    if (document.fullscreenElement) return;
    const element = document.documentElement;
    if (!element?.requestFullscreen) return;
    try {
      await element.requestFullscreen();
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
    setIsInFullscreen(Boolean(document.fullscreenElement));
    if (typeof onInterviewLockChange === "function") {
      onInterviewLockChange(false);
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        suppressFullscreenExitPromptRef.current = true;
        await document.exitFullscreen();
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
      if (!document.fullscreenElement) {
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
      setIsInFullscreen(Boolean(document.fullscreenElement));
      if (document.fullscreenElement) {
        setNeedsFullscreenResume(false);
      }
    };

    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", updateFullscreenState);
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
      if (document.fullscreenElement) return;
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
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
    setAnswerExplanation("");
    setAnswerCode("");
    setFeedback("");
    setScore(null);
    setStatus("idle");
    setReport(null);
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
    setPendingQuestionFeedback(null);
    setRoundsQuestionSummary([]);
    setQuestionsPlannedThisRound(3);
    setCurrentQuestionNumberWithinRound(1);
  };

  useEffect(() => {
    if (!answerTextAreaRef.current) return;
    if (status !== "in_progress") return;

    const el = answerTextAreaRef.current;
    el.style.height = "auto";
    // Keep some minimum height so the UI doesn't collapse on short answers.
    const minHeightPx = 120;
    const nextHeight = Math.max(minHeightPx, el.scrollHeight);
    el.style.height = `${nextHeight}px`;
  }, [answerExplanation, status]);

  const handleStartInterview = async () => {
    if (!canStart) {
      setError(
        !placementSelectionReady
          ? "Choose a visit type slot before starting."
          : customPlanValidationError
          ? customPlanValidationError
          : "Please login and make sure company details are loaded."
      );
      return;
    }

    if (user?.betaAccess === false) return;

    const slot = selectedPlacementSlot;

    loadingRef.current = true;
    roundFeedbackRef.current = null;
    setLoading(true);
    setError("");
    setFeedback("");
    setScore(null);
    setReport(null);
    setRoundTransitionMessage("");
    setRoundFeedbackView(null);
    setPendingQuestionFeedback(null);

    try {
      const mergeMt = slot?.mergePlacementByType === true;
      const { data } = await interviewAPI.startInterview({
        userId: user.userId,
        companyId: company._id,
        placementVisitType: slot?.visitType ?? "",
        placementCluster: mergeMt ? "" : slot?.cluster ?? "",
        placementYear: mergeMt ? undefined : Number(slot?.year),
        mergePlacementByType: mergeMt,
        interviewPlanMode: "custom",
        customRounds: normalizedCustomRounds,
      });

      setSessionId(data.sessionId || "");
      setQuestion(data.question || "");
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
          typeof rd?.questionCount === "number"
            ? Math.min(5, Math.max(3, Math.round(rd.questionCount)))
            : 3
        );
      }
      setCurrentQuestionNumberWithinRound(Number(data.currentQuestionIndex ?? 0) + 1);
      await enterFullscreen();
      // Resume intentionally disabled.
    } catch (err) {
      console.error("Failed to start AI interview:", err);
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
    setReport(st.report || null);
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

    if (st.roundCompleted) {
      roundCompletedAtRef.current = Date.now();
      setQuestion("");
      questionRef.current = "";

      /** Entire interview finished: never show per-answer feedback on top of the final summary. */
      if (st.status === "completed") {
        setPendingQuestionFeedback(null);
        setRoundFeedbackView(null);
        roundFeedbackRef.current = null;
        setFeedback(st.lastFeedback || "");
        setScore(typeof st.lastScore === "number" ? st.lastScore : null);
      } else {
        const deferredRoundSummary = {
          score:
            typeof st?.roundFeedback?.score === "number"
              ? st.roundFeedback.score
              : null,
          strengths: st?.roundFeedback?.strengths || [],
          weaknesses: st?.roundFeedback?.weaknesses || [],
          summary: st?.roundFeedback?.summary || "",
          improvementTips: st?.roundFeedback?.improvementTips || [],
          nextRoundAvailable: Boolean(st?.nextRoundAvailable),
        };
        const hasLastAnswerFeedback =
          String(st.lastFeedback || "").trim().length > 0 ||
          typeof st.lastScore === "number";

        if (hasLastAnswerFeedback) {
          setPendingQuestionFeedback({
            answeredQuestion: String(st.lastQuestion ?? "").trim(),
            canReattempt: Boolean(st.lastQuestionCanReattempt),
            feedback: st.lastFeedback || "",
            score: typeof st.lastScore === "number" ? st.lastScore : null,
            correctness: toDisplayCorrectness(st.lastCorrectness),
            relevance: toDisplayRelevance(st.lastRelevance),
            nextQuestion: "",
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
      roundFeedbackRef.current = null;
      setRoundFeedbackView(null);
      if (st.status === "completed") {
        setPendingQuestionFeedback(null);
        setFeedback(st.lastFeedback || "");
        setScore(typeof st.lastScore === "number" ? st.lastScore : null);
        setQuestion("");
        questionRef.current = "";
      } else if (
        incomingQ &&
        (String(st.lastFeedback || "").trim() || typeof st.lastScore === "number")
      ) {
        setPendingQuestionFeedback({
          answeredQuestion: String(st.lastQuestion ?? "").trim(),
          canReattempt: Boolean(st.lastQuestionCanReattempt),
          feedback: st.lastFeedback || "",
          score: typeof st.lastScore === "number" ? st.lastScore : null,
          correctness: toDisplayCorrectness(st.lastCorrectness),
          relevance: toDisplayRelevance(st.lastRelevance),
          nextQuestion: incomingQ,
          deferredRoundSummary: null,
        });
        setQuestion("");
        questionRef.current = "";
        setFeedback("");
        setScore(null);
      } else if (incomingQ) {
        setPendingQuestionFeedback(null);
        setFeedback(st.lastFeedback || "");
        setScore(typeof st.lastScore === "number" ? st.lastScore : null);
        setQuestion(incomingQ);
        questionRef.current = incomingQ;
      } else {
        setPendingQuestionFeedback(null);
        setFeedback(st.lastFeedback || "");
        setScore(typeof st.lastScore === "number" ? st.lastScore : null);
      }
    }

    // Resume intentionally disabled.
  }, []);

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
        setReport(data.report || null);
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
              nextRoundAvailable: Boolean(data?.nextRoundAvailable),
            };
            const hasLastAnswerFeedback =
              String(data.feedback || "").trim().length > 0 ||
              typeof data.score === "number";

            if (hasLastAnswerFeedback) {
              setPendingQuestionFeedback({
                answeredQuestion: snap.questionText || "",
                canReattempt: true,
                feedback: data.feedback || "",
                score: typeof data.score === "number" ? data.score : null,
                correctness: toDisplayCorrectness(data.correctness),
                relevance: toDisplayRelevance(data.relevance),
                nextQuestion: "",
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
            (String(data.feedback || "").trim() || typeof data.score === "number")
          ) {
            setPendingQuestionFeedback({
              answeredQuestion: snap.questionText || "",
              canReattempt: true,
              feedback: data.feedback || "",
              score: typeof data.score === "number" ? data.score : null,
              correctness: toDisplayCorrectness(data.correctness),
              relevance: toDisplayRelevance(data.relevance),
              nextQuestion: nextQ,
              deferredRoundSummary: null,
            });
            setQuestion("");
            questionRef.current = "";
            setFeedback("");
            setScore(null);
          } else {
            setPendingQuestionFeedback(null);
            setQuestion(data.question || "");
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
    questionRef.current = ctx.nextQuestion;
    setPendingQuestionFeedback(null);
    setFeedback("");
    setScore(null);
    setAnswerExplanation("");
    setAnswerCode("");
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
        })
        .catch(() => {});
    }
  }, [user?.betaAccess]);

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
        if (Array.isArray(st.roundsQuestionSummary)) {
          setRoundsQuestionSummary(st.roundsQuestionSummary);
        }
        if (typeof st.questionsPlannedThisRound === "number") {
          setQuestionsPlannedThisRound(st.questionsPlannedThisRound);
        }
        if (typeof st.currentQuestionNumberWithinRound === "number") {
          setCurrentQuestionNumberWithinRound(st.currentQuestionNumberWithinRound);
        }
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

  /** Entire multi-round session finished (server only sets this after the last round’s report is generated). */
  const showInterviewFinale =
    interviewCompleted && Boolean(sessionId) && !isProcessing;
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
          </div>
        </section>
      )}
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
                  <p className="ai-interview-question-display whitespace-pre-wrap text-[clamp(1.05rem,2.4vw,1.45rem)] leading-snug">
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
                {pendingQuestionFeedback.correctness && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-theme-input border border-theme px-4 py-3">
                    <span className="text-sm text-theme-secondary">Correctness</span>
                    <span className="text-sm font-semibold capitalize text-theme-primary">
                      {pendingQuestionFeedback.correctness}
                    </span>
                  </div>
                )}
                {pendingQuestionFeedback.relevance && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-theme-input border border-theme px-4 py-3">
                    <span className="text-sm text-theme-secondary">Relevance</span>
                    <span className="text-sm font-semibold capitalize text-theme-primary">
                      {pendingQuestionFeedback.relevance}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-theme bg-theme-input/80 p-5 sm:p-6">
              <p className="text-sm font-semibold text-theme-primary mb-2">Feedback</p>
              <p className="text-theme-secondary text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {pendingQuestionFeedback.feedback || "No detailed feedback for this response."}
              </p>
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

      {showInterviewFinale &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 ai-interview-backdrop backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-final-summary-title"
          >
            <div className="w-full max-w-3xl max-h-[min(92vh,900px)] flex flex-col overflow-hidden rounded-2xl border border-theme-accent bg-theme-card shadow-2xl">
              <div className="px-5 py-4 sm:px-8 sm:py-5 border-b border-theme bg-theme-input shrink-0">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
                    <img
                      src={rvLogo}
                      alt="RV College logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-theme-accent">
                      All rounds complete
                    </p>
                    <h2
                      id="interview-final-summary-title"
                      className="text-xl sm:text-2xl font-bold text-theme-primary mt-1"
                    >
                      Full interview summary
                      {company?.name ? (
                        <span className="text-theme-secondary font-medium"> — {company.name}</span>
                      ) : null}
                    </h2>
                    {totalRounds > 0 ? (
                      <p className="text-sm text-theme-primary mt-2 font-medium">
                        You finished every round ({totalRounds}{" "}
                        {totalRounds === 1 ? "round" : "rounds"}).
                      </p>
                    ) : null}
                    <p className="text-sm text-theme-secondary mt-2">
                      The detailed summary is below. When you&apos;re done reading, use End interview to
                      leave fullscreen and return to this company&apos;s General tab.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
            {report ? (
              <div className="p-5 sm:p-8 space-y-8 text-sm border-t border-theme">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-theme-accent mb-3">
                    Interview summary
                  </p>
                  <p className="text-sm text-theme-secondary">
                    Overall performance across the completed interview — review this section last,
                    then end the session.
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-theme-secondary mb-1">
                      Overall score
                    </p>
                    <p className="text-4xl sm:text-5xl font-bold tabular-nums text-theme-accent">
                      {report.overallScore ?? 0}
                      <span className="text-xl sm:text-2xl font-semibold text-theme-secondary">
                        /10
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-theme bg-theme-input p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-theme-accent mb-2">
                      Overall strength
                    </p>
                    <p className="text-theme-primary leading-relaxed">
                      {report.overallStrength ||
                        (report.strengths && report.strengths[0]) ||
                        "Not enough signal to highlight a primary strength."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-theme bg-theme-input p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-theme-accent mb-2">
                      Overall weakness
                    </p>
                    <p className="text-theme-primary leading-relaxed">
                      {report.overallWeakness ||
                        (report.weaknesses && report.weaknesses[0]) ||
                        "No major weakness called out—review detailed notes below."}
                    </p>
                  </div>
                </div>

                {(report.summaryFeedback || "").trim() ? (
                  <div className="rounded-xl border border-theme bg-theme-input/80 p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-theme-secondary mb-2">
                      Feedback
                    </p>
                    <p className="text-theme-primary leading-relaxed whitespace-pre-wrap">
                      {report.summaryFeedback}
                    </p>
                  </div>
                ) : null}

                {(report.companyRoadmap || []).length > 0 ? (
                  <div className="rounded-xl border border-theme bg-theme-input p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-theme-accent mb-3">
                      Roadmap for this company&apos;s interview
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-theme-secondary">
                      {(report.companyRoadmap || []).map((step, index) => (
                        <li key={`roadmap-overlay-${index}`} className="leading-relaxed text-theme-primary">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-theme">
                  <div>
                    <p className="font-semibold text-theme-primary text-sm mb-2">Strengths (detail)</p>
                    <ul className="list-disc pl-5 text-theme-secondary space-y-1">
                      {(report.strengths || []).length ? (
                        (report.strengths || []).map((item, index) => (
                          <li key={`strength-overlay-${index}`}>{item}</li>
                        ))
                      ) : (
                        <li className="list-none pl-0 text-theme-muted">—</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-theme-primary text-sm mb-2">Weaknesses (detail)</p>
                    <ul className="list-disc pl-5 text-theme-secondary space-y-1">
                      {(report.weaknesses || []).length ? (
                        (report.weaknesses || []).map((item, index) => (
                          <li key={`weakness-overlay-${index}`}>{item}</li>
                        ))
                      ) : (
                        <li className="list-none pl-0 text-theme-muted">—</li>
                      )}
                    </ul>
                  </div>
                </div>
                {(report.improvementPlan || []).length > 0 ? (
                  <div>
                    <p className="font-semibold text-theme-primary text-sm mb-2">Improvement plan</p>
                    <ul className="list-disc pl-5 text-theme-secondary space-y-1">
                      {(report.improvementPlan || []).map((item, index) => (
                        <li key={`plan-overlay-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
                <div
                    className="h-10 w-10 rounded-full border-2 border-theme-accent border-t-transparent animate-spin"
                  aria-hidden
                />
                <p className="text-sm font-medium text-theme-primary">
                  Preparing your full interview summary…
                </p>
                <p className="text-xs text-theme-secondary max-w-md">
                  All rounds are finished. Your overall results will appear here in a moment. You can
                  still use End interview below to exit.
                </p>
              </div>
            )}
              </div>

              <div className="px-5 py-4 sm:px-8 border-t border-theme bg-theme-card shrink-0">
                <button
                  type="button"
                  onClick={handleEndInterview}
                  className="w-full px-8 py-3.5 rounded-xl bg-theme-accent text-white text-base font-semibold shadow-lg transition-colors"
                >
                  End interview
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {roundFeedbackView && !interviewCompleted && (
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
                    Round summary
                  </h3>
                  {roundFeedbackView.summary && (
                    <p className="mt-4 text-theme-secondary text-sm sm:text-base leading-relaxed">
                      {roundFeedbackView.summary}
                    </p>
                  )}
                </div>
              </div>
              {roundFeedbackView.score !== null && (
                <div className="mt-4 inline-flex items-center gap-3 rounded-xl bg-theme-input border border-theme-accent px-4 py-3">
                  <span className="text-sm text-theme-secondary">Round score</span>
                  <span className="text-3xl font-bold tabular-nums text-theme-accent">
                    {roundFeedbackView.score}
                    <span className="text-lg font-semibold text-theme-secondary">/10</span>
                  </span>
                </div>
              )}
            </div>
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
            {Array.isArray(roundFeedbackView.improvementTips) &&
              (
                roundFeedbackView.improvementTips
              ).length > 0 && (
                <div className="rounded-xl border border-theme bg-theme-input p-4 sm:p-5">
                  <p className="text-sm font-semibold text-theme-accent mb-2">Tips for next time</p>
                  <ul className="list-disc pl-5 text-sm text-theme-secondary space-y-1.5">
                    {roundFeedbackView.improvementTips.map((item, idx) => (
                      <li key={`rf-tip-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
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
              <p className="text-center text-sm text-theme-secondary">
                Final round completed. Generating final interview summary…
              </p>
            )}
          </div>
        </div>
      )}

      {!isInterviewActive && (
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-theme-primary">AI Mock Interview</h2>
        <button
          onClick={showStartPrompt ? handleStartInterview : resetInterviewState}
          disabled={
            loading ||
            (!showStartPrompt && status === "in_progress") ||
            interviewCompleted ||
            (showStartPrompt && !canStart)
          }
          className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium ${
            loading ||
            (!showStartPrompt && status === "in_progress") ||
            interviewCompleted ||
            (showStartPrompt && !canStart)
              ? "bg-slate-700 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {showStartPrompt ? "Start Interview" : "Reset"}
        </button>
      </div>
      )}

      {!user?.userId && (
        <p className="text-sm text-theme-accent mb-3">
          Please login to start your AI interview.
        </p>
      )}

      {user?.userId && user?.betaAccess !== false && showStartPrompt && (
        <div
          ref={slotPickerRef}
          className="mb-4 rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-theme-primary">Placement slot</p>
            </div>
          </div>
          {slotsLoading ? (
            <p className="text-sm text-theme-secondary">Loading placement options…</p>
          ) : visitSlots.length === 0 ? (
            <p className="text-sm text-theme-secondary">No placement slots available.</p>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => visitSlots.length > 1 && setSlotMenuOpen((open) => !open)}
                aria-expanded={slotMenuOpen}
                aria-haspopup="listbox"
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-theme-accent bg-theme-input text-left transition-colors ${
                  visitSlots.length > 1
                    ? "hover:bg-theme-card/80 focus:outline-none focus:border-theme-accent cursor-pointer"
                    : "cursor-default"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs text-theme-muted uppercase tracking-[0.12em] mb-0.5">
                    Selected slot
                  </p>
                  <p className="text-sm font-semibold text-theme-primary truncate">
                    {selectedPlacementSlot
                      ? formatPlacementSlotSummary(selectedPlacementSlot)
                      : "Select visit type"}
                  </p>
                </div>
                {visitSlots.length > 1 ? (
                  <svg
                    className={`shrink-0 h-5 w-5 text-theme-accent transition-transform ${
                      slotMenuOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-theme-muted shrink-0">
                    Only slot
                  </span>
                )}
              </button>
              {slotMenuOpen && visitSlots.length > 1 && (
                <ul
                  className="absolute z-30 mt-2 left-0 right-0 w-full max-h-56 overflow-auto rounded-xl border border-theme-accent bg-theme-card shadow-2xl py-1.5"
                  role="listbox"
                >
                  {visitSlots.map((slot) => {
                    const key = placementSlotKey(slot);
                    const active = key === selectedSlotKey;
                    return (
                      <li key={key} role="option" aria-selected={active}>
                        <button
                          type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-l-2 ${
                            active
                              ? "border-theme-accent bg-theme-accent/10 text-theme-primary font-semibold"
                              : "border-transparent text-theme-secondary hover:bg-theme-input hover:text-theme-primary"
                          }`}
                          onClick={() => {
                            setSelectedSlotKey(key);
                            setSlotMenuOpen(false);
                          }}
                        >
                          <div>{formatPlacementSlotSummary(slot)}</div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {visitSlots.length > 1 && !selectedSlotKey && (
                <p className="mt-2 text-xs text-theme-accent font-medium">
                  Select a slot to load the preview and start.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {user?.userId && user?.betaAccess !== false && showStartPrompt && (
        <div className="mb-4 rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-theme-primary">Interview plan mode</p>
              <p className="text-xs text-theme-secondary">
                Customize your round order, type and difficulty (up to {MAX_CUSTOM_ROUNDS} rounds).
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-theme-primary">
                Number of rounds
              </label>
              <div>
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
              className="space-y-2"
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
                      <div className="h-4 rounded-md border border-dashed border-theme-accent bg-theme-accent/10 transition-all duration-200" />
                    )}
                  <div
                    draggable
                    onDragStart={() => handleRoundDragStart(idx)}
                    onDragOver={(event) => handleRoundDragOver(event, idx)}
                    onDrop={() => handleRoundDrop(idx)}
                    onDragEnd={handleRoundDragEnd}
                    className={`grid grid-cols-1 sm:grid-cols-3 gap-2 items-center rounded-lg border p-3 bg-theme-card transition-all duration-200 ease-out cursor-grab active:cursor-grabbing ${
                      draggedRoundIndex === idx
                        ? "opacity-50 border-theme-accent scale-[0.99] shadow-sm"
                        : dragOverRoundIndex === idx
                        ? "border-theme-accent/70 shadow-sm"
                        : "border-theme hover:border-theme-accent/60"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted flex items-center gap-2">
                      <span className="text-theme-accent">::</span> Round {idx + 1}
                    </p>
                    <ThemedSelect
                      ariaLabel={`Round ${idx + 1} type`}
                      value={round.type}
                      onChange={(next) => handleCustomRoundFieldChange(idx, "type", next)}
                      options={ROUND_TYPE_OPTIONS.map((type) => ({
                        value: type,
                        label: type,
                      }))}
                    />
                    <ThemedSelect
                      ariaLabel={`Round ${idx + 1} difficulty`}
                      value={round.difficulty}
                      onChange={(next) => handleCustomRoundFieldChange(idx, "difficulty", next)}
                      options={ROUND_DIFFICULTY_OPTIONS.map((difficulty) => ({
                        value: difficulty,
                        label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
                      }))}
                    />
                  </div>
                </React.Fragment>
              ))}
              {draggedRoundIndex !== null &&
                dragOverRoundIndex === normalizedCustomRounds.length && (
                  <div className="h-4 rounded-md border border-dashed border-theme-accent bg-theme-accent/10 transition-all duration-200" />
                )}
            </div>

            {customPlanValidationError && (
              <p className="text-xs font-medium text-theme-accent">{customPlanValidationError}</p>
            )}
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

      {!showInterviewQuestionHero && question && !isProcessing && !pendingQuestionFeedback && (
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
              className="ai-interview-question-display whitespace-pre-wrap text-[clamp(1rem,2.2vw,1.35rem)]"
              aria-live="polite"
              aria-busy={questionTypingIncomplete || undefined}
            >
              {typedQuestionText}
              {questionTypingIncomplete ? (
                <span className="ai-interview-typewriter-caret" aria-hidden />
              ) : null}
            </p>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold text-theme-primary tracking-tight">
                {isCodingRoundUI ? "Your response" : "Your answer"}
              </p>
              <p className="text-[11px] text-theme-muted leading-snug">
                {isCodingRoundUI ? (
                  <>
                    Write your <span className="font-medium text-theme-secondary">approach and reasoning</span> in the
                    explanation box and your{" "}
                    <span className="font-medium text-theme-secondary">implementation or pseudocode</span> in the code
                    editor. Both sections are submitted together and stay separate — nothing copies between them.
                  </>
                ) : (
                  <>Write your answer in the box below.</>
                )}
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
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
                {isCodingRoundUI ? "Explanation" : "Answer"}
              </p>
              <textarea
                ref={answerTextAreaRef}
                value={answerExplanation}
                onChange={(e) => setAnswerExplanation(e.target.value)}
                rows={isCodingRoundUI ? 5 : 6}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
                className="w-full min-h-[148px] px-4 py-3.5 rounded-xl bg-theme-input border-2 border-theme-input text-[15px] leading-relaxed text-theme-primary placeholder:text-theme-muted/80 transition-[border-color,box-shadow] duration-150 resize-y focus:outline-none focus:border-theme-accent focus:ring-0"
                placeholder={
                  isCodingRoundUI
                    ? "Explain your approach, complexity, trade-offs…"
                    : "Type your answer..."
                }
                disabled={loading}
              />
            </div>

            {isCodingRoundUI ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">Code</p>
                <div className="ai-interview-code-workspace-wrap">
                  <InterviewCodeWorkspace
                    value={answerCode}
                    onChange={setAnswerCode}
                    disabled={loading}
                    onSubmitShortcut={handleSubmitAnswer}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="ai-interview-submit-row flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={!canSubmitAnswer}
              className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-[background-color,box-shadow,opacity] ${
                canSubmitAnswer
                  ? "bg-theme-accent text-white hover:brightness-105 active:brightness-95"
                  : "bg-theme-card text-theme-muted cursor-not-allowed"
              }`}
            >
              {loading ? "Submitting..." : "Submit Answer"}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default AIInterviewTab;

