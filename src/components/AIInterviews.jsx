import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../utils/AuthContext";
import { interviewAPI } from "../utils/api";
import InterviewAnalytics from "./InterviewAnalytics";

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

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.userId) {
        setSessions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const { data } = await interviewAPI.getUserInterviewSessions(user.userId);
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch interview sessions:", err);
        setError("Failed to load interviews. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user?.userId]);

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
      <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary">
          Interviews
        </h1>
        <p className="mt-2 text-sm text-theme-secondary">
          View all your AI mock interviews, including questions, answers, feedback, and final reports.
        </p>
      </div>

      <div className="mb-4">
        <InterviewAnalytics />
      </div>

      {loading && (
        <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
          <p className="text-theme-secondary">Loading interviews...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-theme-card border border-red-500/40 rounded-xl p-4 sm:p-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
          <p className="text-theme-secondary">No interviews found yet.</p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="space-y-4">
          <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-theme-primary mb-3">
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
            <h2 className="text-lg font-semibold text-theme-primary mb-3">
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
        </div>
      )}
    </div>
  );
}

function InterviewSessionCard({ session }) {
  const roundEntries = getRoundQuestionEntries(session);
  const hasRoundQuestions = roundEntries.length > 0;
  const hasHistory = Array.isArray(session.history) && session.history.length > 0;

  return (
    <details className="rounded-lg border border-theme p-3 bg-theme-input">
      <summary className="cursor-pointer text-sm font-semibold text-theme-primary">
        {session.companyName || "Unknown Company"} -{" "}
        {session.status === "completed" ? "Completed" : "In Progress"} -{" "}
        {new Date(session.updatedAt).toLocaleString()}
      </summary>

      <div className="mt-3 space-y-3 text-sm">
        <p className="text-theme-secondary">
          <span className="font-semibold text-theme-primary">Round:</span>{" "}
          {session.currentRound || "N/A"} |{" "}
          <span className="font-semibold text-theme-primary">Difficulty:</span>{" "}
          {session.difficultyLevel || "N/A"}
        </p>

        {Array.isArray(session.roundsPlan) && session.roundsPlan.length > 0 && (
          <p className="text-theme-secondary">
            <span className="font-semibold text-theme-primary">Rounds Plan:</span>{" "}
            {session.roundsPlan.join(" -> ")}
          </p>
        )}

        {hasRoundQuestions ? (
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
        ) : hasHistory ? (
          <div className="space-y-2">
            {session.history.map((item, idx) => (
              <div
                key={`${session._id}-item-${idx}`}
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

        {session.finalReport && (
          <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-3 text-sm">
            <p className="text-theme-primary font-semibold">Final summary</p>
            <p className="text-theme-secondary">
              <span className="font-semibold text-theme-primary">Score:</span>{" "}
              {session.finalReport.overallScore ?? 0}/10
            </p>
            {(session.finalReport.overallStrength || session.finalReport.strengths?.[0]) && (
              <p className="text-theme-secondary">
                <span className="font-semibold text-theme-primary">Overall strength:</span>{" "}
                {session.finalReport.overallStrength || session.finalReport.strengths?.[0]}
              </p>
            )}
            {(session.finalReport.overallWeakness || session.finalReport.weaknesses?.[0]) && (
              <p className="text-theme-secondary">
                <span className="font-semibold text-theme-primary">Overall weakness:</span>{" "}
                {session.finalReport.overallWeakness || session.finalReport.weaknesses?.[0]}
              </p>
            )}
            {session.finalReport.summaryFeedback?.trim() ? (
              <p className="text-theme-secondary whitespace-pre-wrap">
                <span className="font-semibold text-theme-primary">Feedback:</span>{" "}
                {session.finalReport.summaryFeedback}
              </p>
            ) : null}
            {(session.finalReport.companyRoadmap || []).length > 0 ? (
              <div>
                <p className="font-semibold text-theme-primary mb-1">Company interview roadmap</p>
                <ol className="list-decimal pl-5 text-theme-secondary space-y-1">
                  {(session.finalReport.companyRoadmap || []).map((step, i) => (
                    <li key={`fr-road-${i}`}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            <p className="text-theme-secondary">
              <span className="font-semibold text-theme-primary">Strengths (detail):</span>{" "}
              {(session.finalReport.strengths || []).join("; ") || "N/A"}
            </p>
            <p className="text-theme-secondary">
              <span className="font-semibold text-theme-primary">Weaknesses (detail):</span>{" "}
              {(session.finalReport.weaknesses || []).join("; ") || "N/A"}
            </p>
            <p className="text-theme-secondary">
              <span className="font-semibold text-theme-primary">Improvement plan:</span>{" "}
              {(session.finalReport.improvementPlan || []).join("; ") || "N/A"}
            </p>
          </div>
        )}
      </div>
    </details>
  );
}

export default AIInterviews;

