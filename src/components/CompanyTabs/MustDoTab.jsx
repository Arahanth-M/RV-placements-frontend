import React, { useMemo, useState } from "react";
import { DEFAULT_PLACEMENT_DETAIL_YEAR } from "../../constants/placementYears.js";
import { API_ENDPOINTS, MESSAGES } from "../../utils/constants";
import { adminAPI, adminCompanyVisitOpts } from "../../utils/api";
import { FaEdit, FaExternalLinkAlt, FaTrash } from "react-icons/fa";
import BrandLogo from "../BrandLogo.jsx";
import SubmissionFeedbackModal from "../SubmissionFeedbackModal";
import {
  resolveMustDoTopicResources,
  resourceLinkChipClass,
} from "../../utils/mustDoTopicResources.js";

function ResourceLinkChip({ link }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={resourceLinkChipClass(link.source)}
    >
      <span className="font-bold text-theme-accent">{link.source}</span>
      <span className="text-theme-muted" aria-hidden>
        ·
      </span>
      <span>{link.label}</span>
      <FaExternalLinkAlt className="h-2.5 w-2.5 opacity-70" aria-hidden />
    </a>
  );
}

function TopicResourcePanel({ topicText }) {
  const resolved = useMemo(
    () => resolveMustDoTopicResources(topicText),
    [topicText]
  );

  if (resolved.hasCurated) {
    return (
      <div className="mt-3 space-y-2.5 border-t border-theme pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted">
          Prep resources
        </p>
        {resolved.matches.map((match) => (
          <div key={match.id} className="space-y-1.5">
            {resolved.matches.length > 1 && (
              <p className="text-xs font-medium text-theme-secondary">{match.label}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {match.links.map((link) => (
                <ResourceLinkChip
                  key={`${match.id}-${link.source}-${link.label}`}
                  link={link}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (resolved.fallbackLinks.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-theme pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted">
        Explore this topic
      </p>
      <div className="flex flex-wrap gap-2">
        {resolved.fallbackLinks.map((link) => (
          <ResourceLinkChip
            key={`fallback-${link.source}-${link.label}`}
            link={link}
          />
        ))}
      </div>
    </div>
  );
}

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
        credentials: "include",
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-theme-primary">
      <div className="rounded-xl border border-theme bg-theme-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-theme-accent">Must Do Topics</h2>
            <p className="mt-1 text-xs text-theme-muted sm:text-sm">
              Focus areas for this company — with direct learn &amp; practice links.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-theme-accent px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 sm:text-sm"
            onClick={() => setShowModal(true)}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Topic</span>
          </button>
        </div>

        {topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((topicItem, index) => (
              <div
                key={`${index}-${String(topicItem).slice(0, 24)}`}
                className="rounded-xl border border-theme bg-theme-input/30 p-4 shadow-sm transition hover:border-theme-accent/40"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-theme-accent/35 bg-theme-accent/10 text-xs font-bold text-theme-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    {editIndex === index ? (
                      <div className="space-y-3">
                        <textarea
                          value={editTopic}
                          onChange={(e) => setEditTopic(e.target.value)}
                          className="min-h-[90px] w-full rounded-lg border border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
                          disabled={actionLoading}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdminUpdate(index)}
                            disabled={actionLoading}
                            className="rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={actionLoading}
                            className="rounded-lg border border-theme bg-theme-card px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-nav disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="break-words text-[15px] leading-relaxed text-theme-secondary">
                          {topicItem}
                        </p>
                        <TopicResourcePanel topicText={topicItem} />
                      </>
                    )}
                  </div>
                  {isAdmin && editIndex !== index && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(index, topicItem)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 rounded-md border border-theme-accent/50 px-2 py-1 text-xs font-semibold text-theme-accent hover:bg-theme-accent/10 disabled:opacity-60"
                      >
                        <FaEdit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminDelete(index)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 rounded-md border border-red-400/60 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-60"
                      >
                        <FaTrash className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-theme bg-theme-input/20 px-4 py-10 text-center">
            <p className="font-medium text-theme-primary">No Must Do Topics provided yet.</p>
            <p className="mt-2 text-sm text-theme-muted">
              Add focus areas and students will get prep links automatically.
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 max-w-[90vw] rounded-xl border border-theme bg-theme-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
                <BrandLogo />
              </div>
              <h3 className="text-lg font-semibold text-theme-accent">Add Must Do Topic</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter the topic that students must prepare for this company..."
                className="min-h-[100px] w-full rounded-lg border border-theme bg-theme-input p-3 text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-theme bg-theme-card px-4 py-2 text-sm font-medium text-theme-secondary transition-colors hover:bg-theme-nav"
                  onClick={() => {
                    setShowModal(false);
                    setTopic("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-theme-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
