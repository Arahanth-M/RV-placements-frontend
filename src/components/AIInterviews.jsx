import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../utils/AuthContext";
import { interviewAPI } from "../utils/api";
import InterviewAnalytics from "./InterviewAnalytics";
import { useNavigate } from "react-router-dom";


const toSafeString = (value) =>
  typeof value === "string" ? value.trim() : "";

const getRoundQuestionEntries = (session) => {
  if (!Array.isArray(session?.rounds)) return [];

  return session.rounds
    .map((round, roundIndex) => {
      const questions = Array.isArray(round?.questions) ? round.questions : [];
      const answeredQuestions = questions.filter(
        (item) => toSafeString(item?.question) || toSafeString(item?.answer)
      );

      return {
        key: `${session?._id || "session"}-round-${roundIndex + 1}`,
        roundLabel: round?.roundNumber || roundIndex + 1,
        roundType: round?.type || "General",
        difficulty: round?.difficulty || "N/A",
        items: answeredQuestions,
      };
    })
    .filter((roundEntry) => roundEntry.items.length > 0);
};

function AIInterviews() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("sessions");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchSessions = async (targetPage, append = false) => {
      if (!user?.userId) {
        setSessions([]);
        setLoading(false);
        setHasMore(false);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");
      try {
        const { data } = await interviewAPI.getUserInterviewSessions(user.userId, {
          page: targetPage,
          limit: PAGE_SIZE,
        });
        const items = Array.isArray(data) ? data : data?.items || [];
        if (append) {
          setSessions((prev) => [...prev, ...items]);
        } else {
          setSessions(items);
        }
        setHasMore(Boolean(data?.pagination?.hasMore));
      } catch (err) {
        console.error("Failed to fetch interview sessions:", err);
        setError("Failed to load interviews. Please try again.");
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    };

    setPage(1);
    fetchSessions(1, false);
  }, [user?.userId]);

  const handleLoadMore = async () => {
    if (!user?.userId || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const { data } = await interviewAPI.getUserInterviewSessions(user.userId, {
        page: nextPage,
        limit: PAGE_SIZE,
      });
      const items = Array.isArray(data) ? data : data?.items || [];
      setSessions((prev) => [...prev, ...items]);
      setHasMore(Boolean(data?.pagination?.hasMore));
      setPage(nextPage);
    } catch (err) {
      console.error("Failed to load more interview sessions:", err);
      setError("Failed to load more interviews. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1);
  };

  const groupedSessions = useMemo(() => {
    const completed = [];
    const inProgress = [];

    sessions.forEach((session) => {
      if (session.status === "completed") {
        completed.push(session);
      } else {
        inProgress.push(session);
      }
    });
  

    return { completed, inProgress };
  }, [sessions]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto min-h-screen bg-theme-app">
           {/* Back Button */}
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleBack}
          className="back-nav-clear-sidebar flex items-center back-link-theme text-sm sm:text-base transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
      {/* Header Section */}
      <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary">
          Mock Interviews
        </h1>
        <p className="mt-2 text-sm text-theme-secondary">
          Track your progress, review feedback, and analyze your performance in AI-driven interviews.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 p-1 bg-theme-card border border-theme rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "sessions"
              ? "bg-theme-accent text-white shadow-md"
              : "text-theme-secondary hover:text-theme-primary hover:bg-theme-nav"
          }`}
        >
          My Interviews
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "analytics"
              ? "bg-theme-accent text-white shadow-md"
              : "text-theme-secondary hover:text-theme-primary hover:bg-theme-nav"
          }`}
        >
          Performance Analytics
        </button>
      </div>

      {/* Error/Loading Content */}
      <div className="mb-6">
        {loading && (
          <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
            <p className="text-theme-secondary animate-pulse">Loading data...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-theme-card border border-red-500/40 rounded-xl p-4 sm:p-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {!loading && !error && (
        <div className="space-y-6">
          {activeTab === "analytics" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <InterviewAnalytics />
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {sessions.length === 0 ? (
                <div className="bg-theme-card border border-theme rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-theme-nav rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <p className="text-theme-secondary font-medium">No interviews found yet.</p>
                  <p className="text-xs text-theme-muted mt-1">Mock interviews will appear here after your first session.</p>
                </div>
              ) : (
                <>
                  <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-theme-primary mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      In Progress ({groupedSessions.inProgress.length})
                    </h2>
                    {groupedSessions.inProgress.length === 0 ? (
                      <p className="text-sm text-theme-secondary">No in-progress interviews.</p>
                    ) : (
                      <div className="space-y-3">
                        {groupedSessions.inProgress.map((session) => (
                          <InterviewSessionCard key={session._id} session={session} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-theme-primary mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Completed ({groupedSessions.completed.length})
                    </h2>
                    {groupedSessions.completed.length === 0 ? (
                      <p className="text-sm text-theme-secondary">No completed interviews.</p>
                    ) : (
                      <div className="space-y-3">
                        {groupedSessions.completed.map((session) => (
                          <InterviewSessionCard key={session._id} session={session} />
                        ))}
                      </div>
                    )}
                  </div>
                  {hasMore && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          loadingMore
                            ? "bg-theme-card-hover text-theme-muted cursor-not-allowed"
                            : "bg-theme-accent text-white hover:opacity-90"
                        }`}
                      >
                        {loadingMore ? "Loading..." : "Load more interviews"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InterviewSessionCard({ session }) {
  const [detailSession, setDetailSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [hasRequestedDetail, setHasRequestedDetail] = useState(false);

  const handleToggle = async (event) => {
    const isOpen = event.currentTarget.open;
    if (!isOpen || hasRequestedDetail || detailLoading) {
      return;
    }
    setHasRequestedDetail(true);
    setDetailLoading(true);
    setDetailError("");
    try {
      const { data } = await interviewAPI.getInterviewSessionDetail(session._id);
      setDetailSession(data || null);
    } catch (err) {
      console.error("Failed to fetch interview session detail:", err);
      setDetailError("Failed to load interview details. Please try again.");
    } finally {
      setDetailLoading(false);
    }
  };

  const sessionData = detailSession || session;
  const roundEntries = getRoundQuestionEntries(sessionData);
  const hasRoundQuestions = roundEntries.length > 0;
  const hasHistory = Array.isArray(sessionData.history) && sessionData.history.length > 0;

  return (
    <details
      className="rounded-lg border border-theme p-3 bg-theme-input"
      onToggle={handleToggle}
    >
      <summary className="cursor-pointer text-sm font-semibold text-theme-primary">
        {sessionData.companyName || "Unknown Company"} -{" "}
        {sessionData.status === "completed" ? "Completed" : "In Progress"} -{" "}
        {new Date(sessionData.updatedAt).toLocaleString()}
      </summary>

      <div className="mt-3 space-y-3 text-sm">
        <p className="text-theme-secondary">
          <span className="font-semibold text-theme-primary">Round:</span>{" "}
          {sessionData.currentRound || "N/A"} |{" "}
          <span className="font-semibold text-theme-primary">Difficulty:</span>{" "}
          {sessionData.difficultyLevel || "N/A"}
        </p>

        {Array.isArray(sessionData.roundsPlan) && sessionData.roundsPlan.length > 0 && (
          <p className="text-theme-secondary">
            <span className="font-semibold text-theme-primary">Rounds Plan:</span>{" "}
            {sessionData.roundsPlan.join(" -> ")}
          </p>
        )}

        {detailLoading && (
          <p className="text-theme-secondary">Loading detailed interview data...</p>
        )}

        {!detailLoading && detailError && (
          <p className="text-red-400">{detailError}</p>
        )}

        {!detailLoading && !detailError && !detailSession && (
          <p className="text-theme-secondary">
            Expand to fetch full question-by-question details.
          </p>
        )}

        {!detailLoading && !detailError && detailSession && hasRoundQuestions ? (
          <div className="space-y-3">
            {roundEntries.map((roundEntry) => (
              <div
                key={roundEntry.key}
                className="p-3 rounded-md border border-theme bg-theme-card"
              >
                <p className="text-theme-primary font-semibold">
                  Round {roundEntry.roundLabel}: {roundEntry.roundType}
                </p>
                <p className="text-theme-secondary text-xs mt-1">
                  Difficulty: {roundEntry.difficulty}
                </p>

                <div className="space-y-2 mt-3">
                  {roundEntry.items.map((item, idx) => (
                    <div
                      key={`${roundEntry.key}-q-${idx}`}
                      className="p-3 rounded-md border border-theme bg-theme-input"
                    >
                      <p className="text-theme-primary">
                        <span className="font-semibold">Q{idx + 1}:</span>{" "}
                        {item?.question || "N/A"}
                      </p>
                      <p className="text-theme-secondary mt-1">
                        <span className="font-semibold text-theme-primary">A:</span>{" "}
                        {item?.answer || "N/A"}
                      </p>
                      <p className="text-theme-secondary mt-1">
                        <span className="font-semibold text-theme-primary">Feedback:</span>{" "}
                        {item?.feedback || "N/A"}
                      </p>
                      <p className="text-theme-secondary mt-1">
                        <span className="font-semibold text-theme-primary">Score:</span>{" "}
                        {typeof item?.score === "number" ? `${item.score}/10` : "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !detailLoading && !detailError && detailSession && hasHistory ? (
          <div className="space-y-2">
            {sessionData.history.map((item, idx) => (
              <div
                key={`${sessionData._id}-item-${idx}`}
                className="p-3 rounded-md border border-theme bg-theme-card"
              >
                <p className="text-theme-primary">
                  <span className="font-semibold">Q:</span> {item.question || "N/A"}
                </p>
                <p className="text-theme-secondary mt-1">
                  <span className="font-semibold text-theme-primary">A:</span>{" "}
                  {item.answer || "N/A"}
                </p>
                <p className="text-theme-secondary mt-1">
                  <span className="font-semibold text-theme-primary">Feedback:</span>{" "}
                  {item.feedback || "N/A"}
                </p>
                <p className="text-theme-secondary mt-1">
                  <span className="font-semibold text-theme-primary">Score:</span>{" "}
                  {typeof item.score === "number" ? `${item.score}/10` : "N/A"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-theme-secondary">No answered questions yet.</p>
        )}

        {detailSession?.finalReport && (
          <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-3 text-sm">
            <p className="text-theme-primary font-semibold">Final summary</p>
            <p className="text-theme-secondary">
              <span className="font-semibold text-theme-primary">Score:</span>{" "}
              {detailSession.finalReport.overallScore ?? 0}/10
            </p>
            {(detailSession.finalReport.overallStrength ||
              detailSession.finalReport.strengths?.[0]) && (
              <p className="text-theme-secondary">
                <span className="font-semibold text-theme-primary">Overall strength:</span>{" "}
                {detailSession.finalReport.overallStrength ||
                  detailSession.finalReport.strengths?.[0]}
              </p>
            )}
            {(detailSession.finalReport.overallWeakness ||
              detailSession.finalReport.weaknesses?.[0]) && (
              <p className="text-theme-secondary">
                <span className="font-semibold text-theme-primary">Overall weakness:</span>{" "}
                {detailSession.finalReport.overallWeakness ||
                  detailSession.finalReport.weaknesses?.[0]}
              </p>
            )}
            {detailSession.finalReport.summaryFeedback?.trim() ? (
              <p className="text-theme-secondary whitespace-pre-wrap">
                <span className="font-semibold text-theme-primary">Feedback:</span>{" "}
                {detailSession.finalReport.summaryFeedback}
              </p>
            ) : null}
            {(detailSession.finalReport.companyRoadmap || []).length > 0 ? (
              <div>
                <p className="font-semibold text-theme-primary mb-1">Company interview roadmap</p>
                <ol className="list-decimal pl-5 text-theme-secondary space-y-1">
                  {(detailSession.finalReport.companyRoadmap || []).map((step, i) => (
                    <li key={`fr-road-${i}`}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            <p className="text-theme-secondary">
              <span className="font-semibold text-theme-primary">Strengths (detail):</span>{" "}
              {(detailSession.finalReport.strengths || []).join("; ") || "N/A"}
            </p>
            <p className="text-theme-secondary">
              <span className="font-semibold text-theme-primary">Weaknesses (detail):</span>{" "}
              {(detailSession.finalReport.weaknesses || []).join("; ") || "N/A"}
            </p>
            <p className="text-theme-secondary">
              <span className="font-semibold text-theme-primary">Improvement plan:</span>{" "}
              {(detailSession.finalReport.improvementPlan || []).join("; ") || "N/A"}
            </p>
          </div>
        )}
      </div>
    </details>
  );
}

export default AIInterviews;

