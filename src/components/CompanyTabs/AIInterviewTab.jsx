import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import { interviewAPI } from "../../utils/api";

const TIME_BY_DIFFICULTY_SECONDS = {
  easy: 20 * 60,
  medium: 30 * 60,
  hard: 40 * 60,
};
const EXIT_WARNING_MESSAGE =
  "Progress will be lost and interview cannot be attended again. Are you sure you want to exit?";

const formatTime = (totalSeconds) => {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function AIInterviewTab({ company, onInterviewLockChange, onForceExitToGeneral }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
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
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [isInFullscreen, setIsInFullscreen] = useState(
    Boolean(document.fullscreenElement)
  );
  const [needsFullscreenResume, setNeedsFullscreenResume] = useState(false);
  const activeSessionIdRef = useRef("");
  const interviewActiveRef = useRef(false);
  const processingFullscreenExitRef = useRef(false);

  const canStart = useMemo(() => {
    return Boolean(user?.userId && company?._id) && !loading;
  }, [user?.userId, company?._id, loading]);

  const canSubmitAnswer = useMemo(() => {
    return (
      Boolean(sessionId) &&
      Boolean(answer.trim()) &&
      status === "in_progress" &&
      !loading
    );
  }, [sessionId, answer, status, loading]);

  const isInterviewActive = useMemo(() => {
    return Boolean(sessionId) && status === "in_progress";
  }, [sessionId, status]);

  useEffect(() => {
    activeSessionIdRef.current = sessionId;
    interviewActiveRef.current = isInterviewActive;
    if (typeof onInterviewLockChange === "function") {
      onInterviewLockChange(isInterviewActive);
    }
  }, [isInterviewActive, onInterviewLockChange, sessionId]);

  const fetchResumableInterview = useCallback(async () => {
    if (!user?.userId || !company?._id) {
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
  }, [user?.userId, company?._id]);

  const fetchPreviewPlan = useCallback(async () => {
    if (!company?._id) {
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
  }, [company?._id]);

  useEffect(() => {
    fetchResumableInterview();
    fetchPreviewPlan();
  }, [fetchResumableInterview, fetchPreviewPlan]);

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
    try {
      await interviewAPI.discardInterview(targetSessionId);
    } catch (err) {
      console.error("Failed to discard in-progress interview:", err);
    }
  }, []);

  const finalizeExitToGeneral = useCallback(async () => {
    setSessionId("");
    setResumeSession(null);
    resetInterviewState();
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore fullscreen exit errors.
      }
    }
    if (typeof onForceExitToGeneral === "function") {
      onForceExitToGeneral();
    }
  }, [onForceExitToGeneral]);

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

      const shouldExit = window.confirm(EXIT_WARNING_MESSAGE);
      if (!shouldExit) {
        window.history.pushState({ interviewLock: true }, "", window.location.href);
        isHandling = false;
        return;
      }

      await discardCurrentInterview(activeSessionIdRef.current);
      await finalizeExitToGeneral();
      isHandling = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [discardCurrentInterview, finalizeExitToGeneral, isInterviewActive]);

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
    if (!isInterviewActive) return;
    const activeSessionId = sessionId;

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) return;
      if (processingFullscreenExitRef.current) return;

      // User exited fullscreen (usually with ESC) before completion.
      if (status === "in_progress" && activeSessionId) {
        processingFullscreenExitRef.current = true;
        window.setTimeout(async () => {
          try {
            const shouldExit = window.confirm(EXIT_WARNING_MESSAGE);
            if (!shouldExit) {
              await enterFullscreen();
              return;
            }

            await discardCurrentInterview(activeSessionId);
            await finalizeExitToGeneral();
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
    discardCurrentInterview,
    enterFullscreen,
    finalizeExitToGeneral,
    isInterviewActive,
    sessionId,
    status,
  ]);

  useEffect(() => {
    if (!isInterviewActive || timeLeftSec <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSec((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isInterviewActive, timeLeftSec]);

  useEffect(() => {
    if (!isInterviewActive || timeLeftSec > 0 || !sessionId) return;

    const timeoutHandler = async () => {
      await discardCurrentInterview(sessionId);
      alert(
        "Interview time is over. The in-progress interview was discarded and your progress was lost."
      );
      setSessionId("");
      setResumeSession(null);
      resetInterviewState();
      if (document.fullscreenElement && document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch {
          // Ignore fullscreen exit errors.
        }
      }
    };

    timeoutHandler();
  }, [discardCurrentInterview, isInterviewActive, sessionId, timeLeftSec]);

  useEffect(() => {
    return () => {
      if (interviewActiveRef.current && activeSessionIdRef.current) {
        interviewAPI.discardInterview(activeSessionIdRef.current).catch((err) => {
          console.error("Failed to discard interview on exit:", err);
        });
      }
    };
  }, []);

  const resetInterviewState = () => {
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
    setTimeLeftSec(0);
  };

  const handleResumeInterview = () => {
    if (!resumeSession) return;
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
    const resumeDifficulty = (resumeSession.difficultyLevel || "medium").toLowerCase();
    setTimeLeftSec(
      TIME_BY_DIFFICULTY_SECONDS[resumeDifficulty] ||
        TIME_BY_DIFFICULTY_SECONDS.medium
    );
    setError("");
    enterFullscreen();
  };

  const handleStartInterview = async () => {
    if (!canStart) {
      setError("Please login and make sure company details are loaded.");
      return;
    }

    setLoading(true);
    setError("");
    setFeedback("");
    setScore(null);
    setReport(null);
    setRoundTransitionMessage("");

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
      const startDifficulty = (data.difficultyLevel || "medium").toLowerCase();
      setTimeLeftSec(
        TIME_BY_DIFFICULTY_SECONDS[startDifficulty] ||
          TIME_BY_DIFFICULTY_SECONDS.medium
      );
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
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!canSubmitAnswer) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await interviewAPI.submitAnswer({
        sessionId,
        answer: answer.trim(),
      });

      setQuestion(data.question || "");
      setFeedback(data.feedback || "");
      setScore(typeof data.score === "number" ? data.score : null);
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
      if (data.status === "completed") {
        setResumeSession(null);
        setTimeLeftSec(0);
        if (document.fullscreenElement && document.exitFullscreen) {
          try {
            await document.exitFullscreen();
          } catch {
            // Ignore fullscreen exit errors.
          }
        }
      }
    } catch (err) {
      console.error("Failed to submit interview answer:", err);
      setError(err?.response?.data?.error || "Failed to submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const showStartPrompt = !sessionId || status === "idle";
  const interviewCompleted = status === "completed";
  const hasResumableInterview =
    Boolean(resumeSession?.sessionId) && resumeSession?.status === "in_progress";

  return (
    <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-theme-primary">AI Mock Interview</h2>
        <button
          onClick={showStartPrompt ? handleStartInterview : resetInterviewState}
          disabled={loading || (!showStartPrompt && status === "in_progress")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            loading || (!showStartPrompt && status === "in_progress")
              ? "bg-theme-card-hover text-theme-muted cursor-not-allowed"
              : "bg-theme-accent text-white"
          }`}
        >
          {showStartPrompt ? "Start Interview" : "Reset"}
        </button>
      </div>

      {!user?.userId && (
        <p className="text-sm text-amber-500 mb-3">
          Please login to start your AI interview.
        </p>
      )}

      {hasResumableInterview && showStartPrompt && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10">
          <p className="text-sm text-theme-primary mb-2">
            You have an in-progress interview for this company.
          </p>
          <button
            onClick={handleResumeInterview}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-60"
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
              {Array.isArray(previewPlan.roundsDetails) &&
              previewPlan.roundsDetails.length > 0 ? (
                <ul className="list-disc pl-5 text-theme-secondary">
                  {previewPlan.roundsDetails.map((item, idx) => (
                    <li key={`preview-round-${idx}`}>
                      <span className="text-theme-primary font-semibold">{item.round}:</span>{" "}
                      {item.questionType}
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
        <div className="mb-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      {isInterviewActive && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-3">
          <p className="text-sm text-theme-primary">
            Interview mode is active. Press <span className="font-semibold">Esc</span> to exit (progress will be lost).
          </p>
          <span className="text-sm font-semibold text-amber-300 whitespace-nowrap">
            Time Left: {formatTime(timeLeftSec)}
          </span>
        </div>
      )}

      {isInterviewActive && !isInFullscreen && needsFullscreenResume && (
        <div className="mb-4 p-3 rounded-lg border border-blue-500/40 bg-blue-500/10 flex items-center justify-between gap-3">
          <p className="text-sm text-theme-primary">
            Interview is still active. Return to fullscreen to continue.
          </p>
          <button
            type="button"
            onClick={enterFullscreen}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Return to Fullscreen
          </button>
        </div>
      )}

      {roundTransitionMessage && (
        <div className="mb-4 p-3 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-300 text-sm">
          {roundTransitionMessage}
        </div>
      )}

      {question && (
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

      {status === "in_progress" && sessionId && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-theme-secondary">Your Answer</span>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-theme-input border border-theme-input text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent"
              placeholder="Type your answer..."
              disabled={loading}
            />
          </label>

          <button
            onClick={handleSubmitAnswer}
            disabled={!canSubmitAnswer}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              canSubmitAnswer
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-theme-card-hover text-theme-muted cursor-not-allowed"
            }`}
          >
            {loading ? "Submitting..." : "Submit Answer"}
          </button>
        </div>
      )}

      {(feedback || score !== null) && (
        <div className="mt-5 p-4 rounded-lg border border-theme bg-theme-input">
          <p className="text-sm font-semibold text-theme-primary mb-1">
            Feedback
          </p>
          <p className="text-theme-secondary text-sm whitespace-pre-wrap">
            {feedback || "No feedback yet."}
          </p>
          {score !== null && (
            <p className="mt-2 text-sm font-medium text-theme-primary">
              Score: {score}/10
            </p>
          )}
        </div>
      )}

      {interviewCompleted && (
        <div className="mt-5 p-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10">
          <h3 className="text-lg font-semibold text-theme-primary mb-3">
            Interview Completed
          </h3>
          {report ? (
            <div className="space-y-3 text-sm">
              <p className="text-theme-primary">
                <span className="font-semibold">Overall Score:</span>{" "}
                {report.overallScore ?? 0}/10
              </p>
              <div>
                <p className="font-semibold text-theme-primary">Strengths</p>
                <ul className="list-disc pl-5 text-theme-secondary">
                  {(report.strengths || []).map((item, index) => (
                    <li key={`strength-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-theme-primary">Weaknesses</p>
                <ul className="list-disc pl-5 text-theme-secondary">
                  {(report.weaknesses || []).map((item, index) => (
                    <li key={`weakness-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-theme-primary">Improvement Plan</p>
                <ul className="list-disc pl-5 text-theme-secondary">
                  {(report.improvementPlan || []).map((item, index) => (
                    <li key={`plan-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-theme-secondary">
              Final report is not available.
            </p>
          )}
        </div>
      )}
      <div className="mt-8 pt-5 border-t border-theme">
        <button
          type="button"
          onClick={() => {
            if (isInterviewActive) return;
            navigate("/interviews");
          }}
          disabled={isInterviewActive}
          className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
            isInterviewActive
              ? "bg-theme-card-hover border-theme text-theme-muted cursor-not-allowed"
              : "bg-theme-card border-theme text-theme-primary hover:bg-theme-nav"
          }`}
        >
          View All Interviews
        </button>
      </div>
    </div>
  );
}

export default AIInterviewTab;

