import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaChevronDown,
  FaClock,
  FaBuilding,
  FaClipboardList,
  FaUser,
} from "react-icons/fa";
import { submissionAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";

const SUBMISSION_TYPE_LABELS = {
  onlineQuestions: "Add Question",
  interviewQuestions: "Add Interview Question",
  interviewProcess: "Add Interview Process",
  mustDoTopics: "Add Must Do Topics",
  internshipExperience: "Add Internship Experience",
};

const STATUS_STYLES = {
  approved: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
};
const SUBMISSIONS_PER_PAGE = 5;

function formatSubmissionTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSubmissionTypeLabel(type) {
  return SUBMISSION_TYPE_LABELS[type] || "Submission";
}

function parseJsonContent(rawContent) {
  if (typeof rawContent !== "string") return null;
  try {
    const parsed = JSON.parse(rawContent);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function renderStructuredSection(title, value) {
  if (!value || String(value).trim().length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">
        {title}
      </p>
      <p className="whitespace-pre-wrap break-words text-sm sm:text-base text-theme-primary leading-6">
        {String(value).trim()}
      </p>
    </div>
  );
}

function SubmissionContent({ submission }) {
  const rawContent =
    typeof submission?.content === "string" ? submission.content.trim() : "";
  const parsedContent = parseJsonContent(rawContent);

  if (
    (submission?.type === "onlineQuestions" ||
      submission?.type === "interviewQuestions") &&
    parsedContent
  ) {
    const question = parsedContent.question || parsedContent.q || "";
    const solution =
      parsedContent.solution || parsedContent.answer || parsedContent.ans || "";

    if (question || solution) {
      return (
        <div className="space-y-4">
          {renderStructuredSection("Question", question)}
          {renderStructuredSection("Solution", solution)}
        </div>
      );
    }
  }

  if (submission?.type === "internshipExperience" && parsedContent?.experience) {
    return renderStructuredSection("Experience", parsedContent.experience);
  }

  return (
    <p className="whitespace-pre-wrap break-words text-sm sm:text-base text-theme-primary leading-6">
      {rawContent || "No content available."}
    </p>
  );
}

const MySubmissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    submissionAPI
      .getMine()
      .then((response) => {
        if (!isMounted) return;
        setSubmissions(Array.isArray(response.data?.submissions) ? response.data.submissions : []);
        setCurrentPage(1);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        const serverMessage =
          err?.response?.data?.message || err?.response?.data?.error;
        setError(serverMessage || "Could not load your submissions right now.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-app">
        <h2 className="text-2xl font-bold text-theme-primary">
          Loading your submissions...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-app">
        <div className="bg-theme-card border border-theme rounded-xl p-8 text-center shadow-lg max-w-xl mx-4">
          <h2 className="text-2xl font-bold text-theme-primary mb-4">
            Unable to load submissions
          </h2>
          <p className="text-theme-secondary mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-theme-card border border-theme back-link-theme font-semibold rounded-lg transition-colors hover:bg-theme-card-hover"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(
    1,
    Math.ceil(submissions.length / SUBMISSIONS_PER_PAGE)
  );
  const paginatedSubmissions = submissions.slice(
    (currentPage - 1) * SUBMISSIONS_PER_PAGE,
    currentPage * SUBMISSIONS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-theme-app overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center back-link-theme text-sm sm:text-base mb-4 hover:opacity-80 transition-opacity"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>

          <div className="bg-theme-card border border-theme px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
            {user?.picture ? (
              <img
                src={user.picture}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  e.target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div className={`bg-theme-accent rounded-full p-3 ${user?.picture ? "hidden" : ""}`}>
              <FaUser className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary">
                My Submissions
              </h1>
              <span className="text-theme-secondary text-sm truncate">
                {user?.email || "Track the contributions you have made"}
              </span>
            </div>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-theme-card border border-theme rounded-xl p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-theme-hero">
              <FaClipboardList className="h-6 w-6 text-theme-accent" />
            </div>
            <h2 className="text-xl font-semibold text-theme-primary mb-2">
              No submissions yet
            </h2>
            <p className="text-theme-secondary max-w-2xl mx-auto">
              When you add a question, interview question, interview process, or
              must-do topic, it will show up here with the company and submission time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedSubmissions.map((submission) => {
              const statusClass =
                STATUS_STYLES[submission.status] ||
                "bg-slate-500/15 text-slate-300 border border-slate-500/30";
              const isExpanded = expandedSubmissionId === submission._id;

              return (
                <article
                  key={submission._id}
                  className="bg-theme-card border border-theme rounded-xl shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSubmissionId((current) =>
                        current === submission._id ? null : submission._id
                      )
                    }
                    className="w-full p-5 sm:p-6 text-left transition-colors hover:bg-theme-hero/20"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-theme-accent/15 px-3 py-1 text-xs font-semibold text-theme-accent border border-theme-accent/20">
                              {getSubmissionTypeLabel(submission.type)}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}
                            >
                              {submission.status || "pending"}
                            </span>
                            {submission.placementYear ? (
                              <span className="inline-flex items-center rounded-full border border-theme px-3 py-1 text-xs font-medium text-theme-secondary">
                                Batch {submission.placementYear}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-2 text-sm text-theme-secondary sm:text-base">
                            <div className="flex items-center gap-2 min-w-0">
                              <FaBuilding className="shrink-0 text-theme-accent" />
                              <span className="truncate">
                                {submission.companyName || "Unknown company"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <FaClock className="shrink-0 text-theme-accent" />
                              <span>{formatSubmissionTime(submission.submittedAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start text-sm text-theme-secondary">
                          <span>{isExpanded ? "Hide content" : "View content"}</span>
                          <FaChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-theme px-5 py-4 sm:px-6 sm:py-5 bg-theme-hero/30">
                      <div className="rounded-xl border border-theme bg-theme-hero/40 p-4 sm:p-5">
                        <SubmissionContent submission={submission} />
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 rounded-xl border border-theme bg-theme-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-theme-secondary">
                  Showing{" "}
                  <span className="font-semibold text-theme-primary">
                    {(currentPage - 1) * SUBMISSIONS_PER_PAGE + 1}
                  </span>
                  {" "}to{" "}
                  <span className="font-semibold text-theme-primary">
                    {Math.min(currentPage * SUBMISSIONS_PER_PAGE, submissions.length)}
                  </span>
                  {" "}of{" "}
                  <span className="font-semibold text-theme-primary">
                    {submissions.length}
                  </span>{" "}
                  submissions
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedSubmissionId(null);
                      setCurrentPage((page) => Math.max(1, page - 1));
                    }}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-hero disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="min-w-[90px] text-center text-sm font-medium text-theme-secondary">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedSubmissionId(null);
                      setCurrentPage((page) => Math.min(totalPages, page + 1));
                    }}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-hero disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubmissionsPage;
