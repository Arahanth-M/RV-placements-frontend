import React, { useState } from "react";
import { DEFAULT_PLACEMENT_DETAIL_YEAR } from "../../constants/placementYears.js";
import { API_ENDPOINTS, MESSAGES } from "../../utils/constants";
import { adminAPI, adminCompanyVisitOpts } from "../../utils/api";
import { FaEdit, FaTrash } from "react-icons/fa";
import rvLogo from "../../assets/logo2.webp";
import SubmissionFeedbackModal from "../SubmissionFeedbackModal";

function MustDoTab({
  company = {},
  placementYear = DEFAULT_PLACEMENT_DETAIL_YEAR,
  placementListContext,
  placementCompanyVisitId,
  placementCluster,
  isAdmin = false,
  onCompanyUpdate,
}) {
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editTopic, setEditTopic] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);
  const topics = company.Must_Do_Topics ?? [];

  const adminOpts = adminCompanyVisitOpts({
    placementYear,
    placementListContext,
    placementCompanyVisitId: placementCompanyVisitId || company?.placementCompanyVisitId,
    placementCluster,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          companyId: company._id,
          type: "mustDoTopics",
          content: topic,
          placementYear,
          ...(placementListContext ? { placementListContext } : {}),
          ...(placementCompanyVisitId ? { companyVisitId: placementCompanyVisitId } : {}),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      setSubmissionFeedback({
        variant: "success",
        message: data.message || MESSAGES.SUBMISSION_SUCCESS,
      });

      setTopic("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setSubmissionFeedback({
        variant: "error",
        message: MESSAGES.SUBMISSION_ERROR,
      });
    }
  };

  const startEdit = (index, value) => {
    setEditIndex(index);
    setEditTopic(value || "");
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditTopic("");
  };

  const handleAdminUpdate = async (index) => {
    const nextTopic = editTopic.trim();
    if (!nextTopic) {
      setSubmissionFeedback({
        variant: "error",
        message: "Topic cannot be empty.",
      });
      return;
    }
    try {
      setActionLoading(true);
      await adminAPI.updateMustDoTopic(
        company._id,
        index,
        { topic: nextTopic },
        adminOpts
      );
      cancelEdit();
      setSubmissionFeedback({
        variant: "success",
        message: "Must do topic updated.",
      });
      if (typeof onCompanyUpdate === "function") await onCompanyUpdate();
    } catch (err) {
      console.error(err);
      setSubmissionFeedback({
        variant: "error",
        message: err?.response?.data?.error || "Failed to update topic.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminDelete = async (index) => {
    const ok = window.confirm("Delete this must do topic for this company cluster?");
    if (!ok) return;
    try {
      setActionLoading(true);
      await adminAPI.deleteMustDoTopic(company._id, index, adminOpts);
      if (editIndex === index) cancelEdit();
      setSubmissionFeedback({
        variant: "success",
        message: "Must do topic deleted.",
      });
      if (typeof onCompanyUpdate === "function") await onCompanyUpdate();
    } catch (err) {
      console.error(err);
      setSubmissionFeedback({
        variant: "error",
        message: err?.response?.data?.error || "Failed to delete topic.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-indigo-400 flex justify-between items-center">
          Must Do Topics
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:py-1.5 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Topic</span>
          </button>
        </h2>

        {topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 transition min-w-0"
              >
                <span className="text-indigo-400 font-bold flex-shrink-0">{index + 1}.</span>
                <div className="min-w-0 flex-1">
                  {editIndex === index ? (
                    <div className="space-y-3">
                      <textarea
                        value={editTopic}
                        onChange={(e) => setEditTopic(e.target.value)}
                        className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[90px]"
                        disabled={actionLoading}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdminUpdate(index)}
                          disabled={actionLoading}
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={actionLoading}
                          className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 leading-relaxed break-words">{topic}</p>
                  )}
                </div>
                {isAdmin && editIndex !== index && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(index, topic)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 rounded-md border border-indigo-500/50 px-2 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-60"
                    >
                      <FaEdit className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminDelete(index)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1 rounded-md border border-red-500/50 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <FaTrash className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 italic">No Must Do Topics provided yet.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-96 max-w-[90vw]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
                <img
                  src={rvLogo}
                  alt="RV College logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-indigo-400">Add Must Do Topic</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter the topic that students must prepare for this company..."
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-theme-secondary hover:bg-theme-nav transition-colors"
                  onClick={() => {
                    setShowModal(false);
                    setTopic("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SubmissionFeedbackModal
        open={submissionFeedback !== null}
        onClose={() => setSubmissionFeedback(null)}
        variant={submissionFeedback?.variant}
        statusMessage={submissionFeedback?.message}
      />
    </div>
  );
}

export default MustDoTab;
