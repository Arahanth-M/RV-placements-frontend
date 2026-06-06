import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../utils/AuthContext";
import { interviewAPI } from "../utils/api";
import InterviewAnalytics from "./InterviewAnalytics";
import { TOUR_PREPARE_EVENT } from "../utils/productTourEvents";
import {
  InterviewQuestionAnswerBlock,
  CompanyInterviewReadinessCard,
} from "./InterviewHistoryAnswer";
import { useNavigate } from "react-router-dom";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

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

/** Completed mock interviews per page (server-side pagination). */
const PAGE_SIZE = 5;

function InterviewSessionsPagination({
  page,
  totalPages,
  total,
  pageSize,
  loading,
  onPageChange,
}) {
  if (totalPages <= 1 && total <= pageSize) return null;

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="border-t border-theme pt-4 mt-4">
      <p className="text-sm text-theme-muted text-center mb-3 px-2">
        Showing {rangeStart}–{rangeEnd} of {total} (page {page} of {totalPages})
      </p>
      <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold border border-theme bg-theme-card text-theme-secondary hover:bg-theme-nav disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const shouldShow =
              pageNum === 1 ||
              pageNum === totalPages ||
              Math.abs(pageNum - page) <= 1 ||
              (page <= 3 && pageNum <= 4) ||
              (page >= totalPages - 2 && pageNum >= totalPages - 3);

            if (!shouldShow) {
              if (pageNum === 2 && page > 4) {
                return (
                  <span key={`ellipsis-start-${pageNum}`} className="px-1 text-theme-muted text-sm">
                    …
                  </span>
                );
              }
              if (pageNum === totalPages - 1 && page < totalPages - 3) {
                return (
                  <span key={`ellipsis-end-${pageNum}`} className="px-1 text-theme-muted text-sm">
                    …
                  </span>
                );
              }
              return null;
            }

            const isActive = pageNum === page;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                aria-current={isActive ? "page" : undefined}
                className={`min-w-[2.25rem] px-2.5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  isActive
                    ? "bg-theme-accent text-white"
                    : "border border-theme bg-theme-card text-theme-secondary hover:bg-theme-nav disabled:opacity-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold border border-theme bg-theme-card text-theme-secondary hover:bg-theme-nav disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function AIInterviews() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("sessions");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchSessions = useCallback(
    async (targetPage, { isInitial = false } = {}) => {
      if (!user?.userId) {
        setSessions([]);
        setTotal(0);
        setPage(1);
        setLoading(false);
        setPageLoading(false);
        return;
      }

      if (user?.betaAccess === false) {
        setSessions([]);
        setTotal(0);
        setPage(1);
        setLoading(false);
        setPageLoading(false);
        return;
      }

      if (isInitial) {
        setLoading(true);
      } else {
        setPageLoading(true);
      }
      setError("");
      try {
        const { data } = await interviewAPI.getUserInterviewSessions(user.userId, {
          page: targetPage,
          limit: PAGE_SIZE,
        });
        const items = Array.isArray(data) ? data : data?.items || [];
        setSessions(items);
        setTotal(Number(data?.pagination?.total) || items.length);
        setPage(Number(data?.pagination?.page) || targetPage);
      } catch (err) {
        console.error("Failed to fetch interview sessions:", err);
        setError("Failed to load interviews. Please try again.");
        if (isInitial) {
          setSessions([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    },
    [user?.userId, user?.betaAccess]
  );

  useEffect(() => {
    setPage(1);
    fetchSessions(1, { isInitial: true });
  }, [fetchSessions]);

  useEffect(() => {
    const onTourPrepare = (event) => {
      const stepId = event.detail?.stepId;
      if (stepId === "ai-interviews-analytics") {
        setActiveTab("analytics");
      }
      if (
        stepId === "ai-interviews-sessions" ||
        stepId === "ai-interviews-hero"
      ) {
        setActiveTab("sessions");
      }
    };
    window.addEventListener(TOUR_PREPARE_EVENT, onTourPrepare);
    return () => window.removeEventListener(TOUR_PREPARE_EVENT, onTourPrepare);
  }, []);

  const handlePageChange = (nextPage) => {
    const clamped = Math.max(1, Math.min(totalPages, nextPage));
    if (clamped === page || pageLoading || loading) return;
    fetchSessions(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={handleBack} label="Back" />
        </PageBackNavRow>

        <div className="mx-auto max-w-6xl">
      <div data-tour="ai-interviews-hero">
      <PageHeroHeader
        subtitle="Track your progress, review feedback, and analyze your performance in AI-driven interviews."
        subtitleClassName="text-theme-secondary"
        subtitleMaxWidth="520px"
      >
        Mock <em style={{ color: '#818CF8', fontStyle: 'italic' }}>Interviews</em>
      </PageHeroHeader>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex gap-2 mb-6 p-1 bg-theme-card border border-theme rounded-xl w-fit"
        data-tour="ai-interviews-tabs"
      >
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "sessions"
              ? "bg-theme-hero text-theme-accent shadow-md"
              : "text-theme-secondary hover:text-theme-primary hover:bg-theme-nav"
          }`}
        >
          My Interviews
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "analytics"
              ? "bg-theme-hero text-theme-accent shadow-md"
              : "text-theme-secondary hover:text-theme-primary hover:bg-theme-nav"
          }`}
        >
          Performance Analytics
        </button>
      </div>

      <div
        className="mb-6 rounded-xl border border-dashed border-theme-accent/35 bg-theme-hero/60 px-4 py-3 text-sm text-theme-secondary"
        data-tour="ai-interviews-start"
      >
        <span className="font-semibold text-theme-primary">Start a mock interview: </span>
        Company Stats → open a company → <span className="text-theme-accent font-medium">AI Interview</span> tab → Start Interview.
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
          <div
            className={activeTab === "analytics" ? "" : "hidden"}
            aria-hidden={activeTab !== "analytics"}
            data-tour="ai-interviews-analytics"
          >
            <InterviewAnalytics />
          </div>

          <div
            className={`space-y-4 ${activeTab === "sessions" ? "" : "hidden"}`}
            aria-hidden={activeTab !== "sessions"}
          >
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
                    <h2 className="text-lg font-semibold text-theme-primary mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                      Completed interviews
                    </h2>
                    <p className="text-xs text-theme-muted mb-3">
                      {total} {total === 1 ? "company" : "companies"} · {PAGE_SIZE} per page
                    </p>
                    <div
                      className={`space-y-3 ${pageLoading ? "opacity-60 pointer-events-none" : ""}`}
                      aria-busy={pageLoading}
                    >
                      {sessions.map((session) => (
                        <InterviewSessionCard key={session._id} session={session} />
                      ))}
                    </div>
                    {pageLoading ? (
                      <p className="mt-3 text-center text-sm text-theme-muted animate-pulse">
                        Loading page…
                      </p>
                    ) : null}
                    <InterviewSessionsPagination
                      page={page}
                      totalPages={totalPages}
                      total={total}
                      pageSize={PAGE_SIZE}
                      loading={pageLoading || loading}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

function InterviewSessionCard({ session }) {
  const { user } = useAuth();
  const [detailSession, setDetailSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [hasRequestedDetail, setHasRequestedDetail] = useState(false);

  const handleToggle = async (event) => {
    const isOpen = event.currentTarget.open;
    if (!isOpen || hasRequestedDetail || detailLoading) {
      return;
    }
    if (user?.betaAccess === false) return;
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
                    <InterviewQuestionAnswerBlock
                      key={`${roundEntry.key}-q-${idx}`}
                      item={item}
                      roundType={roundEntry.roundType}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !detailLoading && !detailError && detailSession && hasHistory ? (
          <div className="space-y-2">
            {sessionData.history.map((item, idx) => (
              <InterviewQuestionAnswerBlock
                key={`${sessionData._id}-item-${idx}`}
                item={item}
                roundType={item?.round || ""}
              />
            ))}
          </div>
        ) : (
          <p className="text-theme-secondary">No answered questions yet.</p>
        )}

        {detailSession?.finalReport && (
          <div className="p-4 rounded-lg border border-theme bg-theme-card space-y-3 text-sm">
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
            <CompanyInterviewReadinessCard
              companyName={sessionData.companyName}
              finalReport={detailSession.finalReport}
            />
          </div>
        )}
      </div>
    </details>
  );
}

export default AIInterviews;

