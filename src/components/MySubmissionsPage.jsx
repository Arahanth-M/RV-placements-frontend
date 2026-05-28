import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChevronDown,
  FaClock,
  FaBuilding,
  FaClipboardList,
  FaUser,
  FaCheck,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaEdit,
  FaTrash,
  FaEye,
  FaUserShield,
  FaHourglassHalf,
  FaTimes,
} from "react-icons/fa";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";
import { MySubmissionsPageShimmer } from "./PageLoadingShimmer.jsx";
import { submissionAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";

// ─── constants ────────────────────────────────────────────────────────────────

const SUBMISSION_TYPE_LABELS = {
  onlineQuestions: "OA question",
  interviewQuestions: "Interview question",
  interviewProcess: "Interview process",
  mustDoTopics: "Must-do topic",
  internshipExperience: "Internship experience",
};

const SUBMISSIONS_PER_PAGE = 5;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "status", label: "By status" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── sub-components ───────────────────────────────────────────────────────────

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

/** Three quick-glance stat cards */
function StatCards({ submissions }) {
  const total = submissions.length;
  const approved = submissions.filter((s) => s.status === "approved").length;
  const pending = submissions.filter(
    (s) => !s.status || s.status === "pending"
  ).length;

  const cards = [
    { label: "Total", value: total, color: "text-violet-400" },
    { label: "Approved", value: approved, color: "text-status-success" },
    { label: "Pending", value: pending, color: "text-status-warning" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map(({ label, value, color }) => (
        <div
          key={label}
          className="bg-theme-card border border-theme rounded-xl px-4 py-3 shadow-sm"
        >
          <p className="text-xs font-medium text-theme-secondary mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

/** Search + filter + sort toolbar */
function Toolbar({ search, onSearch, filter, onFilter, sort, onSort }) {
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  return (
    <div className="flex items-center gap-2 mb-5 relative">
      {/* Search */}
      <div className="relative flex-1">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary text-xs" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search submissions…"
          className="w-full rounded-lg border border-theme bg-theme-card pl-8 pr-3 py-2 text-sm text-theme-primary placeholder-theme-secondary focus:outline-none focus:ring-1 focus:ring-theme-accent transition"
        />
      </div>

      {/* Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}
          className="flex items-center gap-1.5 rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm font-medium text-theme-primary hover:bg-theme-hero transition"
        >
          <FaFilter className="text-theme-accent text-xs" />
          Filter
        </button>
        {showFilter && (
          <div className="absolute right-0 top-full mt-1 z-10 min-w-[130px] rounded-xl border border-theme bg-theme-card shadow-lg overflow-hidden">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onFilter(opt.value); setShowFilter(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition hover:bg-theme-hero ${
                  filter === opt.value ? "text-theme-accent font-semibold" : "text-theme-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setShowSort((v) => !v); setShowFilter(false); }}
          className="flex items-center gap-1.5 rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm font-medium text-theme-primary hover:bg-theme-hero transition"
        >
          <FaSortAmountDown className="text-theme-accent text-xs" />
          Sort
        </button>
        {showSort && (
          <div className="absolute right-0 top-full mt-1 z-10 min-w-[150px] rounded-xl border border-theme bg-theme-card shadow-lg overflow-hidden">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onSort(opt.value); setShowSort(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition hover:bg-theme-hero ${
                  sort === opt.value ? "text-theme-accent font-semibold" : "text-theme-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Edit pending submission (content + anonymous flags where applicable) */
function EditSubmissionModal({ submission, onClose, onSaved }) {
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [textBody, setTextBody] = useState("");
  const [experience, setExperience] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(submission.isAnonymous === true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const type = submission.type;
    const raw = typeof submission.content === "string" ? submission.content.trim() : "";
    if (type === "onlineQuestions" || type === "interviewQuestions") {
      const p = parseJsonContent(raw) || {};
      setQuestion(String(p.question || p.q || "").trim());
      setSolution(String(p.solution || p.answer || p.ans || "").trim());
      setTextBody("");
      setExperience("");
    } else if (type === "internshipExperience") {
      const p = parseJsonContent(raw);
      setExperience(p?.experience != null ? String(p.experience).trim() : raw);
      setQuestion("");
      setSolution("");
      setTextBody("");
    } else {
      setTextBody(raw);
      setQuestion("");
      setSolution("");
      setExperience("");
    }
    setIsAnonymous(submission.isAnonymous === true);
    setError("");
  }, [submission]);

  const buildContent = () => {
    const t = submission.type;
    if (t === "onlineQuestions" || t === "interviewQuestions") {
      return JSON.stringify({ question: question.trim(), solution: solution.trim() });
    }
    if (t === "internshipExperience") {
      return JSON.stringify({ experience: experience.trim() });
    }
    return textBody;
  };

  const handleSave = async () => {
    const t = submission.type;
    if ((t === "onlineQuestions" || t === "interviewQuestions") && !question.trim()) {
      setError("Question cannot be empty.");
      return;
    }
    if (t === "internshipExperience" && !experience.trim()) {
      setError("Experience cannot be empty.");
      return;
    }
    if (t !== "onlineQuestions" && t !== "interviewQuestions" && t !== "internshipExperience") {
      if (!textBody.trim()) {
        setError("Content cannot be empty.");
        return;
      }
    }

    const content = buildContent();
    if (!String(content).trim()) {
      setError("Content cannot be empty.");
      return;
    }

    const payload = { content };
    if (t === "interviewProcess" || t === "internshipExperience") {
      payload.isAnonymous = isAnonymous;
    }

    setSaving(true);
    setError("");
    try {
      await submissionAPI.updateMine(submission._id, payload);
      await onSaved();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not save changes.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const showAnonymous =
    submission.type === "interviewProcess" || submission.type === "internshipExperience";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-submission-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-theme bg-theme-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-theme bg-theme-card px-4 py-3 sm:px-5">
          <h2 id="edit-submission-title" className="text-lg font-semibold text-theme-primary">
            Edit submission
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-theme-secondary hover:bg-theme-hero hover:text-theme-primary"
            aria-label="Close"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <p className="text-xs text-theme-secondary">
            {getSubmissionTypeLabel(submission.type)}
            {submission.companyName ? ` · ${submission.companyName}` : ""}
          </p>

          {(submission.type === "onlineQuestions" || submission.type === "interviewQuestions") && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                  Question
                </span>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                  Solution
                </span>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                />
              </label>
            </>
          )}

          {submission.type === "internshipExperience" && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                Experience
              </span>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
              />
            </label>
          )}

          {submission.type !== "onlineQuestions" &&
            submission.type !== "interviewQuestions" &&
            submission.type !== "internshipExperience" && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                  {submission.type === "interviewProcess" ? "Interview process" : "Topic / content"}
                </span>
                <textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  rows={submission.type === "interviewProcess" ? 10 : 6}
                  className="w-full rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                />
              </label>
            )}

          {showAnonymous && (
            <label className="flex items-center gap-2 text-sm text-theme-primary cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-theme text-theme-accent focus:ring-theme-accent"
              />
              Submit anonymously (where supported)
            </label>
          )}

          {error ? (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-theme bg-theme-hero/30 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-theme-primary hover:bg-theme-card disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Status badge with icon */
function StatusBadge({ status }) {
  if (status === "approved") {
    return (
      <span className="status-badge-success">
        <FaCheck className="text-[10px]" />
        Approved
      </span>
    );
  }
  return (
    <span className="status-badge-warning">
      <FaClock className="text-[10px]" />
      Pending
    </span>
  );
}

/** Per-card meta line below company/time */
function CardMeta({ submission }) {
  if (submission.status === "approved") {
    const rb = submission.reviewedBy;
    const name = String(rb?.name || "").trim();
    const label = name ? `${name}` : "Admin ";
    return (
      <div className="flex items-center gap-2 text-xs text-theme-secondary mt-1">
        <FaUserShield className="shrink-0 text-status-success" />
        <span>Approved by {label} </span>
        <span className="ml-2 text-status-success-muted text-[10px] font-medium uppercase tracking-wide">
          · Visible to all students
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs text-status-warning mt-1">
      <FaHourglassHalf className="shrink-0" />
      <span>Awaiting review</span>
      <span className="ml-2 text-theme-secondary text-[10px] font-medium uppercase tracking-wide">
        · Not yet published
      </span>
    </div>
  );
}

/** Single submission card */
function SubmissionCard({ submission, isExpanded, onToggle, onEdit, onDelete }) {
  const isApproved = submission.status === "approved";
  const isPending = !submission.status || submission.status === "pending";

  return (
    <article
      className={`bg-theme-card border border-theme rounded-xl shadow-sm overflow-hidden
        border-l-[3px] ${isApproved ? "border-l-status-success" : "border-l-status-warning"}`}
    >
      {/* Header button */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 sm:p-6 text-left transition-colors hover:bg-theme-hero/20"
        aria-expanded={isExpanded}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {/* Tag row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full bg-theme-accent/15 px-3 py-1 text-xs font-semibold text-theme-accent border border-theme-accent/25">
                {getSubmissionTypeLabel(submission.type)}
              </span>
              <StatusBadge status={submission.status} />
              {submission.placementYear ? (
                <span className="inline-flex items-center rounded-full border border-theme px-3 py-1 text-xs font-medium text-theme-secondary">
                  Batch {submission.placementYear}
                </span>
              ) : null}
              {submission.isAnonymous === true ? (
                <span className="inline-flex items-center rounded-full border border-theme-accent/30 bg-theme-accent/10 px-3 py-1 text-xs font-medium text-theme-accent">
                  Anonymous
                </span>
              ) : null}
            </div>

            {/* Company + time */}
            <div className="flex flex-col gap-1.5 text-sm text-theme-secondary">
              <div className="flex items-center gap-2">
                <FaBuilding className="shrink-0 text-theme-accent" />
                <span className="font-semibold text-theme-primary text-base">
                  {submission.companyName || "Unknown company"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="shrink-0 text-theme-accent" />
                <span>{formatSubmissionTime(submission.submittedAt)}</span>
              </div>
            </div>

            {/* Status meta line */}
            <CardMeta submission={submission} />
          </div>

          {/* Expand toggle */}
          <div className="flex items-center gap-1.5 self-start text-sm text-theme-secondary shrink-0 mt-1">
            <FaEye className="text-xs text-theme-accent" />
            <span>{isExpanded ? "Hide content" : "View content"}</span>
            <FaChevronDown
              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded ? (
        <div className="border-t border-theme px-5 py-4 sm:px-6 sm:py-5 bg-theme-hero/30">
          <div className="rounded-xl border border-theme bg-theme-hero/40 p-4 sm:p-5">
            <SubmissionContent submission={submission} />
          </div>
        </div>
      ) : null}

      {/* Footer actions — only while submission is still pending */}
      {isPending ? (
        <div className="flex items-center justify-end gap-4 border-t border-theme bg-theme-hero/20 px-5 py-2.5">
          <button
            type="button"
            onClick={() => onEdit?.(submission)}
            className="flex items-center gap-1.5 text-xs font-medium text-theme-secondary hover:text-theme-accent transition-colors"
          >
            <FaEdit className="text-[11px]" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(submission)}
            className="flex items-center gap-1.5 text-xs font-medium text-theme-secondary hover:text-red-400 transition-colors"
          >
            <FaTrash className="text-[11px]" />
            Delete
          </button>
        </div>
      ) : null}
    </article>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

const MySubmissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSubmission, setEditingSubmission] = useState(null);

  // toolbar state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const refreshSubmissions = useCallback(async () => {
    try {
      const response = await submissionAPI.getMine();
      setSubmissions(
        Array.isArray(response.data?.submissions) ? response.data.submissions : []
      );
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message || err?.response?.data?.error;
      setError(serverMessage || "Could not refresh submissions.");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    submissionAPI
      .getMine()
      .then((response) => {
        if (!isMounted) return;
        setSubmissions(
          Array.isArray(response.data?.submissions) ? response.data.submissions : []
        );
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
    return () => { isMounted = false; };
  }, []);

  // derived list
  const filteredAndSorted = useMemo(() => {
    let list = [...submissions];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          (s.companyName || "").toLowerCase().includes(q) ||
          getSubmissionTypeLabel(s.type).toLowerCase().includes(q)
      );
    }

    // filter by status
    if (filter !== "all") {
      list = list.filter((s) =>
        filter === "pending"
          ? !s.status || s.status === "pending"
          : s.status === filter
      );
    }

    // sort
    list.sort((a, b) => {
      if (sort === "oldest")
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      if (sort === "status")
        return (a.status || "pending").localeCompare(b.status || "pending");
      return new Date(b.submittedAt) - new Date(a.submittedAt); // newest
    });

    return list;
  }, [submissions, search, filter, sort]);

  // reset page on filter/search change
  useEffect(() => { setCurrentPage(1); setExpandedSubmissionId(null); }, [search, filter, sort]);

  if (loading) {
    return <MySubmissionsPageShimmer onBack={() => navigate(-1)} />;
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
    Math.ceil(filteredAndSorted.length / SUBMISSIONS_PER_PAGE)
  );
  const paginatedSubmissions = filteredAndSorted.slice(
    (currentPage - 1) * SUBMISSIONS_PER_PAGE,
    currentPage * SUBMISSIONS_PER_PAGE
  );

  return (
    <div className={`min-h-screen overflow-y-auto ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(-1)} />
        </PageBackNavRow>

        {/* Profile header */}
        <div className="mb-6 sm:mb-5">
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
            <div
              className={`bg-theme-accent rounded-full p-3 ${
                user?.picture ? "hidden" : ""
              }`}
            >
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

        {/* Stat cards — always shown when there are submissions */}
        {submissions.length > 0 && <StatCards submissions={submissions} />}

        {/* Toolbar */}
        {submissions.length > 0 && (
          <Toolbar
            search={search}
            onSearch={setSearch}
            filter={filter}
            onFilter={setFilter}
            sort={sort}
            onSort={setSort}
          />
        )}

        {/* Empty state */}
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
              must-do topic, it will show up here with the company and submission
              time.
            </p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="bg-theme-card border border-theme rounded-xl p-8 text-center shadow-sm">
            <p className="text-theme-secondary">
              No submissions match your search or filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedSubmissions.map((submission) => (
              <SubmissionCard
                key={submission._id}
                submission={submission}
                isExpanded={expandedSubmissionId === submission._id}
                onToggle={() =>
                  setExpandedSubmissionId((cur) =>
                    cur === submission._id ? null : submission._id
                  )
                }
                onEdit={(s) => setEditingSubmission(s)}
                onDelete={async (s) => {
                  if (!window.confirm("Delete this submission? This cannot be undone.")) {
                    return;
                  }
                  try {
                    await submissionAPI.deleteMine(s._id);
                    setExpandedSubmissionId((cur) => (cur === s._id ? null : cur));
                    await refreshSubmissions();
                  } catch (err) {
                    const msg =
                      err?.response?.data?.error ||
                      err?.response?.data?.message ||
                      "Delete failed. Please try again.";
                    window.alert(msg);
                  }
                }}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 rounded-xl border border-theme bg-theme-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-theme-secondary">
                  Showing{" "}
                  <span className="font-semibold text-theme-primary">
                    {(currentPage - 1) * SUBMISSIONS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-theme-primary">
                    {Math.min(
                      currentPage * SUBMISSIONS_PER_PAGE,
                      filteredAndSorted.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-theme-primary">
                    {filteredAndSorted.length}
                  </span>{" "}
                  submissions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedSubmissionId(null);
                      setCurrentPage((p) => Math.max(1, p - 1));
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
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
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

      {editingSubmission ? (
        <EditSubmissionModal
          key={editingSubmission._id}
          submission={editingSubmission}
          onClose={() => setEditingSubmission(null)}
          onSaved={async () => {
            await refreshSubmissions();
            setEditingSubmission(null);
          }}
        />
      ) : null}
    </div>
  );
};

export default MySubmissionsPage;