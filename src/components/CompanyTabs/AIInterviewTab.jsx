import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import { interviewAPI } from "../../utils/api";
import rvLogo from "../../assets/logo2.png";

const EXIT_WARNING_MESSAGE =
  "Are you sure you want to quit this interview?\n\nIf you exit now, your current interview will be discarded, your progress will not be saved, and you will be returned to this company's General tab.";

const summarizeRoundAbout = (value, fallbackText) => {
  const raw = Array.isArray(value) ? value.join(" ") : String(value || "");
  const cleaned = raw
    .replace(/^round\s*\d+\s*[:\-]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallbackText;

  // Keep preview concise: first clause only, max one short line.
  let summary = cleaned.split(/[;|.]/)[0].trim() || cleaned;
  const words = summary.split(" ").filter(Boolean);
  if (words.length > 10) {
    summary = `${words.slice(0, 10).join(" ")}...`;
  }
  if (summary.length > 72) {
    summary = `${summary.slice(0, 69).trimEnd()}...`;
  }

  return summary || fallbackText;
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

function AIInterviewTab({
  company,
  onInterviewLockChange,
  onForceExitToGeneral,
  registerInterviewExitHandler,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const answerCharCount = answer.trim().length;
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [status, setStatus] = useState("idle");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeSession, setResumeSession] = useState(null);
  const [roundsPlan, setRoundsPlan] = useState([]);
  const [roundsDetails, setRoundsDetails] = useState([]);
  const [currentRound, setCurrentRound] = useState("");
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [previewPlan, setPreviewPlan] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
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

  const canStart = useMemo(() => {
    return Boolean(user?.userId && company?._id) && !loading;
  }, [user?.userId, company?._id, loading]);

  const canSubmitAnswer = useMemo(() => {
    return (
      Boolean(sessionId) &&
      Boolean(question) &&
      Boolean(answer.trim()) &&
      status === "in_progress" &&
      !roundFeedbackView &&
      !pendingQuestionFeedback &&
      !loading &&
      !isProcessing
    );
  }, [
    sessionId,
    question,
    answer,
    status,
    roundFeedbackView,
    pendingQuestionFeedback,
    loading,
    isProcessing,
  ]);

  const isInterviewActive = useMemo(() => {
    return Boolean(sessionId) && status === "in_progress";
  }, [sessionId, status]);

  const previewRoundItems = useMemo(() => {
    if (Array.isArray(previewPlan?.rounds) && previewPlan.rounds.length > 0) {
      return previewPlan.rounds.map((item, index) => ({
        roundNumber: item.roundNumber || index + 1,
        about: summarizeRoundAbout(
          item.about || item.type,
          "General Interview"
        ),
      }));
    }

    if (Array.isArray(previewPlan?.roundsDetails) && previewPlan.roundsDetails.length > 0) {
      return previewPlan.roundsDetails.map((item, index) => ({
        roundNumber: index + 1,
        about: summarizeRoundAbout(
          item.questionType || item.round,
          "General Interview"
        ),
      }));
    }

    if (Array.isArray(previewPlan?.roundsPlan) && previewPlan.roundsPlan.length > 0) {
      return previewPlan.roundsPlan.map((item, index) => ({
        roundNumber: index + 1,
        about: summarizeRoundAbout(item, `Round ${index + 1}`),
      }));
    }

    const total = Number(previewPlan?.totalRounds) || 0;
    if (total > 0) {
      return Array.from({ length: total }, (_, index) => ({
        roundNumber: index + 1,
        about: `Round ${index + 1}`,
      }));
    }

    return [];
  }, [previewPlan]);

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

  const fetchResumableInterview = useCallback(async () => {
    if (!user?.userId || !company?._id) {
      setResumeSession(null);
      return;
    }

    if (user?.betaAccess === false) {
      setResumeSession(null);
      return;
    }

    try {
      const { data } = await interviewAPI.getResumableInterview({
        userId: user.userId,
        companyId: company._id,
      });
      setResumeSession(data || null);
    } catch {
      setResumeSession(null);
    }
  }, [user?.userId, user?.betaAccess, company?._id]);

  const fetchPreviewPlan = useCallback(async () => {
    if (!company?._id) {
      setPreviewPlan(null);
      return;
    }

    if (user?.betaAccess === false) {
      setPreviewPlan(null);
      return;
    }

    setPreviewLoading(true);
    try {
      const { data } = await interviewAPI.previewInterviewPlan(company._id);
      setPreviewPlan(data || null);
    } catch {
      setPreviewPlan(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [company?._id, user?.betaAccess]);

  useEffect(() => {
    fetchResumableInterview();
  }, [fetchResumableInterview]);

  useEffect(() => {
    fetchPreviewPlan();
  }, [fetchPreviewPlan]);

  useEffect(() => {
    if (!previewPlan) return;
    console.info("[AIInterviewTab] Preview payload", {
      totalRounds: previewPlan?.totalRounds,
      roundsCount: Array.isArray(previewPlan?.rounds) ? previewPlan.rounds.length : 0,
      roundsPlanCount: Array.isArray(previewPlan?.roundsPlan) ? previewPlan.roundsPlan.length : 0,
      roundsDetailsCount: Array.isArray(previewPlan?.roundsDetails)
        ? previewPlan.roundsDetails.length
        : 0,
      computedPreviewCount: previewRoundItems.length,
    });
  }, [previewPlan, previewRoundItems.length]);

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
    setResumeSession(null);
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
    setAnswer("");
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
    setRoundTransitionMessage("");
    setRoundFeedbackView(null);
    setIsProcessing(false);
    setTips([]);
    setCurrentTipIndex(0);
    setPendingQuestionFeedback(null);
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
  }, [answer, status]);

  const handleResumeInterview = () => {
    if (!resumeSession) return;
    loadingRef.current = false;
    roundFeedbackRef.current = null;
    setSessionId(resumeSession.sessionId || "");
    setQuestion(resumeSession.question || "");
    setStatus(resumeSession.status || "in_progress");
    setCurrentRound(resumeSession.currentRound || "");
    setRoundsPlan(Array.isArray(resumeSession.roundsPlan) ? resumeSession.roundsPlan : []);
    setRoundsDetails(Array.isArray(resumeSession.roundsDetails) ? resumeSession.roundsDetails : []);
    setCurrentRoundIndex(Number(resumeSession.currentRoundIndex) || 0);
    setTotalRounds(Number(resumeSession.totalRounds) || 0);
    setDifficultyLevel(resumeSession.difficultyLevel || "");
    setRoundTransitionMessage("");
    setRoundFeedbackView(null);
    setPendingQuestionFeedback(null);
    setError("");
    enterFullscreen();
  };

  const handleStartInterview = async () => {
    if (!canStart) {
      setError("Please login and make sure company details are loaded.");
      return;
    }

    if (user?.betaAccess === false) return;

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

    if (!previewPlan && !previewLoading) {
      fetchPreviewPlan().catch(() => {});
    }

    try {
      const { data } = await interviewAPI.startInterview({
        userId: user.userId,
        companyId: company._id,
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
      setRoundTransitionMessage("");
      setAnswer("");
      await enterFullscreen();
      if (data?.resumed) {
        setResumeSession({
          sessionId: data.sessionId || "",
          question: data.question || "",
          status: data.status || "in_progress",
          roundsPlan: Array.isArray(data.roundsPlan) ? data.roundsPlan : [],
          roundsDetails: Array.isArray(data.roundsDetails) ? data.roundsDetails : [],
          currentRound: data.currentRound || "",
          currentRoundIndex: Number(data.currentRoundIndex) || 0,
          totalRounds: Number(data.totalRounds) || 0,
          difficultyLevel: data.difficultyLevel || "",
        });
      } else {
        setResumeSession(null);
      }
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
    if (st.totalRounds != null) {
      setTotalRounds(Number(st.totalRounds) || 0);
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

    if (st.status === "completed") {
      setResumeSession(null);
    }
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
        answer: answer.trim(),
      });

      console.info("[AIInterviewTab] submitAnswer response", {
        sessionId,
        status: data?.status,
        hasSessionId: Boolean(data?.sessionId),
      });

      if (data.status === "processing") {
        setAnswer("");
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
        setRoundTransitionMessage(data?.roundTransition?.message || "");
        setAnswer("");
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
        if (data.status === "completed") {
          setResumeSession(null);
        }
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
      setAnswer("");
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
    setAnswer("");
  }, []);

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
      roundFeedbackRef.current = null;
      setRoundFeedbackView(null);
      await enterFullscreen();
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
  /** Entire multi-round session finished (server only sets this after the last round’s report is generated). */
  const showInterviewFinale =
    interviewCompleted && Boolean(sessionId) && !isProcessing;
  const hasResumableInterview =
    Boolean(resumeSession?.sessionId) && resumeSession?.status === "in_progress";

  return (
    <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 relative">
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
            <button
              type="button"
              onClick={handleContinueToNextQuestion}
              className="w-full sm:w-auto self-center sm:self-end px-8 py-3.5 rounded-xl bg-theme-accent text-white text-base font-semibold shadow-lg transition-colors"
            >
              {pendingQuestionFeedback?.deferredRoundSummary
                ? "View round summary"
                : "Next question"}
            </button>
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

      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-theme-primary">AI Mock Interview</h2>
        <button
          onClick={showStartPrompt ? handleStartInterview : resetInterviewState}
          disabled={
            loading ||
            (!showStartPrompt && status === "in_progress") ||
            interviewCompleted
          }
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            loading ||
            (!showStartPrompt && status === "in_progress") ||
            interviewCompleted
              ? "bg-theme-card text-theme-muted cursor-not-allowed"
              : "border border-theme-accent bg-theme-hero text-theme-accent shadow-sm"
          }`}
        >
          {showStartPrompt ? "Start Interview" : "Reset"}
        </button>
      </div>

      {!user?.userId && (
        <p className="text-sm text-theme-accent mb-3">
          Please login to start your AI interview.
        </p>
      )}

      {hasResumableInterview && showStartPrompt && (
        <div className="mb-4 p-3 rounded-lg border border-theme-accent bg-theme-input">
          <p className="text-sm text-theme-primary mb-2">
            You have an in-progress interview for this company.
          </p>
          <button
            onClick={handleResumeInterview}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-theme-accent text-white transition-colors disabled:opacity-60"
          >
            Resume Interview
          </button>
        </div>
      )}

      {showStartPrompt && !hasResumableInterview && (
        <div className="mb-4 p-3 rounded-lg border border-theme bg-theme-input">
          <p className="text-sm font-semibold text-theme-primary mb-2">
            Interview Structure Preview
          </p>
          {previewLoading ? (
            <p className="text-sm text-theme-secondary">Preparing round-wise plan...</p>
          ) : previewPlan ? (
            <div className="text-sm space-y-2">
              <p className="text-theme-secondary">
                Total rounds:{" "}
                <span className="text-theme-primary font-semibold">
                  {previewPlan.totalRounds || (previewPlan.roundsPlan || []).length || 0}
                </span>
              </p>
              {previewRoundItems.length > 0 ? (
                <ul className="list-disc pl-5 text-theme-secondary">
                  {previewRoundItems.map((item, idx) => (
                    <li key={`preview-round-about-${idx}`}>
                      <span className="text-theme-primary font-semibold">
                        Round {item.roundNumber || idx + 1}:
                      </span>{" "}
                      {item.about || "General Interview"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-theme-secondary">
                  Planned rounds: {(previewPlan.roundsPlan || []).join(" -> ")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-theme-secondary">
              Round preview unavailable right now.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-theme-accent bg-theme-input text-theme-primary text-sm">
          {error}
        </div>
      )}

      {isInterviewActive && (
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

      {question && !isProcessing && !pendingQuestionFeedback && (
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
          </div>
          <p className="text-xs uppercase tracking-wide text-theme-secondary mb-2">
            Current Question
          </p>
          <div className="p-4 rounded-lg border border-theme bg-theme-input text-theme-primary">
            {question}
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
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-theme-secondary">Your Answer</p>
              <p className="text-xs text-theme-muted mt-1">
                Tip: press <span className="font-semibold text-theme-accent">Ctrl + Enter</span> to submit
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-theme-muted">{answerCharCount} chars</p>
            </div>
          </div>

          <textarea
            ref={answerTextAreaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmitAnswer();
              }
            }}
            className="w-full px-3 py-2 rounded-lg bg-theme-input border border-theme-input text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent resize-none"
            placeholder="Type your answer..."
            disabled={loading}
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handleSubmitAnswer}
              disabled={!canSubmitAnswer}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                canSubmitAnswer
                  ? "bg-theme-accent text-white"
                  : "bg-theme-card text-theme-muted cursor-not-allowed"
              }`}
            >
              {loading ? "Submitting..." : "Submit Answer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIInterviewTab;

