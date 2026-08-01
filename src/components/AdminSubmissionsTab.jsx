import React, { useCallback, useEffect, useState } from "react";
import { adminAPI } from "../utils/api";

const PAGE_SIZE = 25;

function parseContent(raw) {
  if (raw == null) return { question: "", solution: "" };
  if (typeof raw === "object") {
    return {
      question: String(raw.question || raw.Q || "").trim(),
      solution: String(raw.solution || raw.answer || raw.A || "").trim(),
    };
  }
  const text = String(raw).trim();
  if (!text) return { question: "", solution: "" };
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return {
        question: String(parsed.question || parsed.Q || "").trim(),
        solution: String(parsed.solution || parsed.answer || parsed.A || "").trim(),
      };
    }
  } catch {
    /* plain text */
  }
  return { question: "", solution: "" };
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Short cluster codes for compact table display. */
function formatClusterShort(raw) {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return "N/A";
  if (v === "cs" || v === "cse" || v.includes("computer science")) return "CS";
  if (v === "ec" || v === "ece" || v.includes("electronics")) return "EC";
  if (v === "me" || v.includes("mechanical")) return "ME";
  if (v === "ch" || v.includes("chemical")) return "CH";
  if (v === "cv" || v.includes("civil")) return "CV";
  if (v === "bt" || v.includes("biotech") || v.includes("bio tech")) return "BT";
  if (v === "chem" || v.includes("chemical sciences")) return "CHEM";
  return String(raw).trim().toUpperCase().slice(0, 8);
}

function emptyMeta() {
  return { page: 1, total: 0, totalPages: 1 };
}

function submissionSupportsEnhancement(type) {
  return String(type || "").trim() !== "mustDoTopics";
}

function submissionSupportsAddAnswer(type) {
  const t = String(type || "").trim();
  return t === "onlineQuestions" || t === "interviewQuestions";
}

export default function AdminSubmissionsTab({
  pendingCount = 0,
  approvedCount = 0,
  onCountsChanged,
}) {
  const [submissionsSubTab, setSubmissionsSubTab] = useState("pending");
  const [submissions, setSubmissions] = useState([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState([]);
  const [subPendingMeta, setSubPendingMeta] = useState(emptyMeta);
  const [subApprovedMeta, setSubApprovedMeta] = useState(emptyMeta);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [approvingIds, setApprovingIds] = useState(() => new Set());
  const [rejectingIds, setRejectingIds] = useState(() => new Set());
  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [approvingAll, setApprovingAll] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionEnhancedContent, setSubmissionEnhancedContent] = useState(null);
  const [submissionAnswerGenerated, setSubmissionAnswerGenerated] = useState(false);
  const [submissionEnhanceError, setSubmissionEnhanceError] = useState("");
  const [submissionEnhancing, setSubmissionEnhancing] = useState(false);
  const [submissionAddingAnswer, setSubmissionAddingAnswer] = useState(false);

  const loadList = useCallback(async (status, page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminAPI.getSubmissions({
        params: { status, page, limit: PAGE_SIZE },
      });
      const items = Array.isArray(data?.items) ? data.items : [];
      const meta = {
        page: data?.page || page,
        total: data?.total ?? items.length,
        totalPages: Math.max(1, data?.totalPages || 1),
      };
      if (status === "pending") {
        setSubmissions(items);
        setSubPendingMeta(meta);
      } else {
        setApprovedSubmissions(items);
        setSubApprovedMeta(meta);
      }
    } catch (e) {
      console.error("Failed to load submissions:", e);
      setError(e?.response?.data?.error || e?.message || "Failed to load submissions.");
      if (status === "pending") {
        setSubmissions([]);
        setSubPendingMeta(emptyMeta());
      } else {
        setApprovedSubmissions([]);
        setSubApprovedMeta(emptyMeta());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (submissionsSubTab === "pending") {
      void loadList("pending", subPendingMeta.page);
    } else {
      void loadList("approved", subApprovedMeta.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when tab/page changes
  }, [submissionsSubTab, subPendingMeta.page, subApprovedMeta.page, loadList]);

  const refreshAfterChange = async () => {
    await loadList(submissionsSubTab, submissionsSubTab === "pending" ? subPendingMeta.page : subApprovedMeta.page);
    if (typeof onCountsChanged === "function") {
      await onCountsChanged();
    }
  };

  const closeSubmissionModal = () => {
    setShowSubmissionModal(false);
    setSelectedSubmission(null);
    setSubmissionEnhancedContent(null);
    setSubmissionAnswerGenerated(false);
    setSubmissionEnhanceError("");
  };

  const handleApprove = async (id, mergeContent) => {
    const withEnhanced = typeof mergeContent === "string" && mergeContent.trim().length > 0;
    const confirmMsg = withEnhanced
      ? submissionAnswerGenerated
        ? "Approve using the generated answer? This updates the company database."
        : "Approve using the AI-enhanced text? This updates the company database."
      : "Approve this submission? This updates the company database.";
    if (!window.confirm(confirmMsg)) return;
    setApprovingIds((prev) => new Set(prev).add(id));
    try {
      await adminAPI.approveSubmission(id, withEnhanced ? { mergeContent } : {});
      closeSubmissionModal();
      await refreshAfterChange();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Failed to approve submission.");
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject and delete this submission?")) return;
    setRejectingIds((prev) => new Set(prev).add(id));
    try {
      await adminAPI.rejectSubmission(id);
      closeSubmissionModal();
      await refreshAfterChange();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Failed to reject submission.");
    } finally {
      setRejectingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteApprovedSubmission = async (id) => {
    if (!window.confirm("Delete this approved submission from the database?")) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await adminAPI.deleteApprovedSubmission(id);
      closeSubmissionModal();
      await refreshAfterChange();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Failed to delete submission.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleApproveAll = async () => {
    const ids = submissions.map((s) => s._id).filter(Boolean);
    if (ids.length === 0) return;
    if (!window.confirm(`Approve all ${ids.length} submission(s) on this page?`)) return;
    setApprovingAll(true);
    try {
      await adminAPI.approveSubmissionsBatch(ids);
      await refreshAfterChange();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Failed to approve submissions.");
    } finally {
      setApprovingAll(false);
    }
  };

  const handleViewFullSubmission = async (submission) => {
    setSubmissionEnhancedContent(null);
    setSubmissionAnswerGenerated(false);
    setSubmissionEnhanceError("");
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
    if (!submission?._id) return;
    try {
      const { data } = await adminAPI.getSubmission(submission._id);
      setSelectedSubmission(data);
    } catch (e) {
      console.error("Failed to load full submission:", e);
    }
  };

  const handleSubmissionEnhance = async (id) => {
    setSubmissionEnhancing(true);
    setSubmissionEnhanceError("");
    setSubmissionEnhancedContent(null);
    setSubmissionAnswerGenerated(false);
    try {
      const { data } = await adminAPI.enhanceSubmission(id);
      const next = data?.content;
      if (typeof next !== "string" || !next.trim()) {
        setSubmissionEnhanceError("Enhancement returned empty content.");
        return;
      }
      setSubmissionEnhancedContent(next);
      setSubmissionAnswerGenerated(false);
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Could not enhance submission.";
      setSubmissionEnhanceError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmissionEnhancing(false);
    }
  };

  const handleSubmissionAddAnswer = async (id) => {
    setSubmissionAddingAnswer(true);
    setSubmissionEnhanceError("");
    setSubmissionEnhancedContent(null);
    setSubmissionAnswerGenerated(false);
    try {
      if (selectedSubmission?.contentTruncated && String(selectedSubmission._id) === String(id)) {
        const res = await adminAPI.getSubmission(id);
        setSelectedSubmission(res.data);
      }
      const { data } = await adminAPI.addAnswerToSubmission(id);
      const next = data?.content;
      if (typeof next !== "string" || !next.trim()) {
        setSubmissionEnhanceError("Answer generation returned empty content.");
        return;
      }
      setSubmissionEnhancedContent(next);
      setSubmissionAnswerGenerated(true);
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Could not generate answer.";
      setSubmissionEnhanceError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmissionAddingAnswer(false);
    }
  };

  const renderPagination = (meta, setPage) => {
    if (meta.total <= 0) return null;
    const from = (meta.page - 1) * PAGE_SIZE + 1;
    const to = Math.min(meta.page * PAGE_SIZE, meta.total);
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-700 bg-slate-800/40">
        <p className="text-xs text-slate-400">
          {from}–{to} of {meta.total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={meta.page <= 1 || loading}
            onClick={() => setPage(meta.page - 1)}
            className="px-3 py-1.5 text-xs rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-slate-300 tabular-nums">
            Page {meta.page} / {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={meta.page >= meta.totalPages || loading}
            onClick={() => setPage(meta.page + 1)}
            className="px-3 py-1.5 text-xs rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const submissionAiBusy = submissionEnhancing || submissionAddingAnswer;

  return (
    <>
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="mb-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div aria-hidden="true" />
              <h2 className="text-center text-2xl font-semibold text-indigo-400">
                Submissions Management
              </h2>
              <div aria-hidden="true" />
            </div>
            <p className="mx-auto mt-1 max-w-2xl text-center text-sm text-slate-400">
              Review and approve user submissions
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 border border-slate-700 rounded-lg p-1 bg-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  setSubmissionsSubTab("pending");
                  setSubPendingMeta((m) => ({ ...m, page: 1 }));
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  submissionsSubTab === "pending"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmissionsSubTab("approved");
                  setSubApprovedMeta((m) => ({ ...m, page: 1 }));
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  submissionsSubTab === "approved"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                Approved
              </button>
            </div>
            {submissionsSubTab === "pending" && submissions.length > 0 ? (
              <button
                type="button"
                onClick={handleApproveAll}
                disabled={approvingAll || loading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  approvingAll
                    ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {approvingAll ? "Approving All..." : `Approve all on page (${submissions.length})`}
              </button>
            ) : (
              <div aria-hidden="true" />
            )}
          </div>
          {(pendingCount > 0 || approvedCount > 0) && (
            <p className="mt-3 text-center text-xs text-slate-400">
              {pendingCount} pending · {approvedCount} approved
            </p>
          )}
        </div>

        {error ? (
          <div className="px-6 py-4 text-sm text-red-300 border-b border-slate-700 bg-red-950/30">
            {error}
          </div>
        ) : null}

        {submissionsSubTab === "pending" ? (
          loading && submissions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-slate-400 text-sm sm:text-base">Loading pending submissions…</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-slate-400 text-sm sm:text-base">No pending submissions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800/60">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
                        Content
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                        Submitted At
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800/40 divide-y divide-slate-700">
                    {submissions.map((submission) => {
                      const content = parseContent(submission.content);
                      return (
                        <tr
                          key={submission._id}
                          className="hover:bg-slate-700/50 cursor-pointer"
                          onClick={() => handleViewFullSubmission(submission)}
                        >
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-slate-200">
                                {submission.submittedBy?.name || "N/A"}
                                {submission.isAnonymous && (
                                  <span className="ml-2 text-xs text-orange-600 font-normal">
                                    (Anonymous)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[120px] sm:max-w-none">
                                {submission.submittedBy?.email || ""}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 max-w-[14rem]">
                            <div>
                              <p className="text-xs sm:text-sm text-slate-200">
                                {submission.companyId?.name || "N/A"}
                              </p>
                              <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">
                                <span className="block">Year: {submission.placementYear || "N/A"}</span>
                                <span className="block">
                                  Cluster: {formatClusterShort(submission.cluster)}
                                </span>
                              </p>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                              {submission.type}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                            <div className="text-xs sm:text-sm text-slate-300 max-w-md">
                              {content.question && (
                                <p className="font-medium mb-1 truncate">Q: {content.question}</p>
                              )}
                              {content.solution && (
                                <p className="text-slate-400 truncate">A: {content.solution}</p>
                              )}
                              {!content.question && !content.solution && (
                                <p className="text-slate-400 truncate">{submission.content}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400 hidden lg:table-cell">
                            {formatDate(submission.submittedAt)}
                          </td>
                          <td
                            className="px-3 sm:px-6 py-4 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1 sm:gap-2 flex-col sm:flex-row">
                              <button
                                type="button"
                                onClick={() => handleApprove(submission._id)}
                                disabled={
                                  approvingIds.has(submission._id) || rejectingIds.has(submission._id)
                                }
                                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition w-full sm:w-auto ${
                                  approvingIds.has(submission._id) || rejectingIds.has(submission._id)
                                    ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                              >
                                {approvingIds.has(submission._id) ? "Approving..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(submission._id)}
                                disabled={
                                  approvingIds.has(submission._id) || rejectingIds.has(submission._id)
                                }
                                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition w-full sm:w-auto ${
                                  approvingIds.has(submission._id) || rejectingIds.has(submission._id)
                                    ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                              >
                                {rejectingIds.has(submission._id) ? "Rejecting..." : "Reject"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {renderPagination(subPendingMeta, (p) =>
                setSubPendingMeta((m) => ({ ...m, page: p }))
              )}
            </div>
          )
        ) : loading && approvedSubmissions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-slate-400 text-sm sm:text-base">Loading approved submissions…</p>
          </div>
        ) : approvedSubmissions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-slate-400 text-sm sm:text-base">No approved submissions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/60">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                      Approved
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/40 divide-y divide-slate-700">
                  {approvedSubmissions.map((submission) => (
                    <tr
                      key={submission._id}
                      className="hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => handleViewFullSubmission(submission)}
                    >
                      <td className="px-3 sm:px-4 py-4">
                        <p className="text-xs sm:text-sm font-medium text-slate-200">
                          {submission.submittedBy?.name || "N/A"}
                          {submission.isAnonymous ? (
                            <span className="ml-1.5 text-xs text-orange-400 font-normal">
                              (Anon)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-none">
                          {submission.submittedBy?.email || ""}
                        </p>
                      </td>
                      <td className="px-3 sm:px-4 py-4">
                        <p className="text-xs sm:text-sm text-slate-200">
                          {submission.companyId?.name || "N/A"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {submission.placementYear || "—"} ·{" "}
                          {formatClusterShort(submission.cluster)}
                        </p>
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-600 text-white capitalize">
                          {submission.type}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-xs text-slate-400 hidden sm:table-cell">
                        {submission.approvedAt ? formatDate(submission.approvedAt) : "N/A"}
                      </td>
                      <td
                        className="px-3 sm:px-4 py-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteApprovedSubmission(submission._id)}
                          disabled={deletingIds.has(submission._id)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                            deletingIds.has(submission._id)
                              ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {deletingIds.has(submission._id) ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(subApprovedMeta, (p) =>
              setSubApprovedMeta((m) => ({ ...m, page: p }))
            )}
          </div>
        )}
      </div>

      {/* Full Submission Details Modal */}
      {showSubmissionModal && selectedSubmission ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-indigo-400">Full Submission Details</h3>
              <button
                type="button"
                onClick={closeSubmissionModal}
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Submitted By</p>
                  <p className="text-base text-slate-200 mt-1">
                    {selectedSubmission.submittedBy?.name || "N/A"}
                    {selectedSubmission.isAnonymous ? (
                      <span className="ml-2 text-sm text-orange-400">(Anonymous)</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {selectedSubmission.submittedBy?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Company</p>
                  <p className="text-base text-slate-200 mt-1">
                    {selectedSubmission.companyId?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Type</p>
                  <span className="inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full bg-indigo-600 text-white capitalize">
                    {selectedSubmission.type || "N/A"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Placement Year</p>
                  <p className="text-base text-slate-200 mt-1">
                    {selectedSubmission.placementYear || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Cluster</p>
                  <p className="text-base text-slate-200 mt-1">
                    {formatClusterShort(selectedSubmission.cluster)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Status</p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedSubmission.status === "approved"
                        ? "bg-green-600 text-white"
                        : "bg-yellow-600 text-white"
                    }`}
                  >
                    {selectedSubmission.status === "approved" ? "Approved" : "Pending"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Submitted At</p>
                  <p className="text-base text-slate-200 mt-1">
                    {formatDate(selectedSubmission.submittedAt)}
                  </p>
                </div>
                {selectedSubmission.approvedAt ? (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Approved At</p>
                    <p className="text-base text-slate-200 mt-1">
                      {formatDate(selectedSubmission.approvedAt)}
                    </p>
                  </div>
                ) : null}
                {selectedSubmission.status === "approved" ? (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Reviewed by</p>
                    <p className="text-base text-slate-200 mt-1">
                      {selectedSubmission.reviewedBy?.name
                        ? `${selectedSubmission.reviewedBy.name}${
                            selectedSubmission.reviewedBy.role === "spc"
                              ? " (SPC)"
                              : " (Admin)"
                          }`
                        : "Admin (legacy)"}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm font-medium text-slate-400 mb-2">Full Submission Content</p>
                <div className="bg-slate-900 rounded-lg p-4">
                  {(() => {
                    const content = parseContent(selectedSubmission.content);
                    if (content.question || content.solution) {
                      return (
                        <div className="space-y-3">
                          {content.question ? (
                            <div>
                              <p className="text-sm font-semibold text-slate-300 mb-1">Question:</p>
                              <p className="text-base text-slate-200 whitespace-pre-wrap break-words">
                                {content.question}
                              </p>
                            </div>
                          ) : null}
                          {content.solution ? (
                            <div>
                              <p className="text-sm font-semibold text-slate-300 mb-1">Solution:</p>
                              <pre className="text-base text-slate-200 whitespace-pre-wrap break-words font-sans bg-slate-800 p-3 rounded border border-slate-700 overflow-x-auto">
                                {content.solution}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                    return (
                      <p className="text-base text-slate-200 whitespace-pre-wrap break-words">
                        {selectedSubmission.content || "—"}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {submissionEnhanceError ? (
                <p className="text-sm text-red-400 border-t border-slate-700 pt-4">
                  {submissionEnhanceError}
                </p>
              ) : null}

              {submissionEnhancedContent ? (
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-sm font-medium text-slate-400 mb-2">
                    {submissionAnswerGenerated
                      ? "Generated answer preview"
                      : "AI-enhanced preview"}
                  </p>
                  <div className="bg-slate-900/80 border border-violet-500/30 rounded-lg p-4">
                    {(() => {
                      const content = parseContent(submissionEnhancedContent);
                      if (content.question || content.solution) {
                        return (
                          <div className="space-y-3">
                            {content.question ? (
                              <div>
                                <p className="text-sm font-semibold text-slate-300 mb-1">
                                  Question:
                                </p>
                                <p className="text-base text-slate-200 whitespace-pre-wrap break-words">
                                  {content.question}
                                </p>
                              </div>
                            ) : null}
                            {content.solution ? (
                              <div>
                                <p className="text-sm font-semibold text-slate-300 mb-1">
                                  Solution:
                                </p>
                                <pre className="text-base text-slate-200 whitespace-pre-wrap break-words font-sans bg-slate-800 p-3 rounded border border-slate-700 overflow-x-auto max-h-48">
                                  {content.solution}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        );
                      }
                      return (
                        <p className="text-base text-slate-200 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                          {submissionEnhancedContent}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              ) : null}

              {selectedSubmission.status !== "approved" ? (
                <div className="border-t border-slate-700 pt-4 flex flex-wrap gap-3">
                  {submissionSupportsAddAnswer(selectedSubmission.type) ? (
                    <button
                      type="button"
                      onClick={() => handleSubmissionAddAnswer(selectedSubmission._id)}
                      disabled={
                        submissionAiBusy ||
                        approvingIds.has(selectedSubmission._id) ||
                        rejectingIds.has(selectedSubmission._id)
                      }
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        submissionAiBusy ||
                        approvingIds.has(selectedSubmission._id) ||
                        rejectingIds.has(selectedSubmission._id)
                          ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                          : "bg-sky-600 text-white hover:bg-sky-700"
                      }`}
                    >
                      {submissionAddingAnswer ? "Generating answer..." : "Add answer"}
                    </button>
                  ) : null}
                  {submissionSupportsEnhancement(selectedSubmission.type) ? (
                    <button
                      type="button"
                      onClick={() => handleSubmissionEnhance(selectedSubmission._id)}
                      disabled={
                        submissionAiBusy ||
                        approvingIds.has(selectedSubmission._id) ||
                        rejectingIds.has(selectedSubmission._id)
                      }
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        submissionAiBusy ||
                        approvingIds.has(selectedSubmission._id) ||
                        rejectingIds.has(selectedSubmission._id)
                          ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                          : "bg-violet-600 text-white hover:bg-violet-700"
                      }`}
                    >
                      {submissionEnhancing ? "Enhancing..." : "Enhance with AI"}
                    </button>
                  ) : null}
                  {submissionEnhancedContent ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleApprove(selectedSubmission._id, submissionEnhancedContent)
                        }
                        disabled={
                          submissionAiBusy ||
                          approvingIds.has(selectedSubmission._id) ||
                          rejectingIds.has(selectedSubmission._id)
                        }
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          submissionAiBusy ||
                          approvingIds.has(selectedSubmission._id) ||
                          rejectingIds.has(selectedSubmission._id)
                            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {approvingIds.has(selectedSubmission._id)
                          ? "Approving..."
                          : submissionAnswerGenerated
                            ? "Approve with answer"
                            : "Approve with enhanced"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedSubmission._id)}
                        disabled={
                          submissionAiBusy ||
                          approvingIds.has(selectedSubmission._id) ||
                          rejectingIds.has(selectedSubmission._id)
                        }
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          submissionAiBusy ||
                          approvingIds.has(selectedSubmission._id) ||
                          rejectingIds.has(selectedSubmission._id)
                            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                            : "border border-slate-500 text-slate-200 hover:bg-slate-700"
                        }`}
                      >
                        {approvingIds.has(selectedSubmission._id)
                          ? "Approving..."
                          : "Approve original"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedSubmission._id)}
                      disabled={
                        submissionAiBusy ||
                        approvingIds.has(selectedSubmission._id) ||
                        rejectingIds.has(selectedSubmission._id)
                      }
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        submissionAiBusy ||
                        approvingIds.has(selectedSubmission._id) ||
                        rejectingIds.has(selectedSubmission._id)
                          ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {approvingIds.has(selectedSubmission._id) ? "Approving..." : "Approve"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleReject(selectedSubmission._id)}
                    disabled={
                      submissionAiBusy ||
                      approvingIds.has(selectedSubmission._id) ||
                      rejectingIds.has(selectedSubmission._id)
                    }
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      submissionAiBusy ||
                      approvingIds.has(selectedSubmission._id) ||
                      rejectingIds.has(selectedSubmission._id)
                        ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {rejectingIds.has(selectedSubmission._id) ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              ) : (
                <div className="border-t border-slate-700 pt-4 flex flex-wrap gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteApprovedSubmission(selectedSubmission._id)}
                    disabled={deletingIds.has(selectedSubmission._id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      deletingIds.has(selectedSubmission._id)
                        ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {deletingIds.has(selectedSubmission._id) ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
