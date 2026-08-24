import React, { useState } from "react";
import { DEFAULT_PLACEMENT_DETAIL_YEAR } from "../../constants/placementYears.js";
import { API_ENDPOINTS, MESSAGES } from "../../utils/constants";
import BrandLogo from "../BrandLogo.jsx";
import SubmissionFeedbackModal from "../SubmissionFeedbackModal";
import {
  ExperienceEmptyState,
  ExperienceSectionHeader,
  ExperienceStoryCard,
} from "./ExperienceStoryCard.jsx";
import { listInternshipExperienceEntries } from "../../utils/parseExperienceStoredEntry.js";

function InternshipTab({
  company,
  placementYear = DEFAULT_PLACEMENT_DETAIL_YEAR,
  placementListContext,
  placementCompanyVisitId,
}) {
  const [showModal, setShowModal] = useState(false);
  const [experienceText, setExperienceText] = useState("");
  const [submitAnonymously, setSubmitAnonymously] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          companyId: company._id,
          type: "internshipExperience",
          content: JSON.stringify({ experience: experienceText }),
          isAnonymous: submitAnonymously,
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

      setExperienceText("");
      setSubmitAnonymously(false);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setSubmissionFeedback({
        variant: "error",
        message: MESSAGES.SUBMISSION_ERROR,
      });
    }
  };

  const internshipExperience = listInternshipExperienceEntries(company);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="rounded-xl border border-theme bg-theme-card p-4 shadow-sm sm:p-6">
        <ExperienceSectionHeader
          kicker="Experiences"
          title="Internship Experience"
          count={internshipExperience.length}
          addLabel="Add Internship Experience"
          onAdd={() => setShowModal(true)}
        />

        {internshipExperience.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {internshipExperience.map((exp, index) => {
              const expContent = exp.content || exp;
              const isAnonymous = exp.isAnonymous === true || exp.isAnonymous === "true";
              const submittedBy = exp.submittedBy || null;

              return (
                <ExperienceStoryCard
                  key={index}
                  content={expContent}
                  isAnonymous={isAnonymous}
                  submittedBy={submittedBy}
                />
              );
            })}
          </div>
        ) : (
          <ExperienceEmptyState
            message="No internship experiences yet. Share what the internship was like so others can prepare."
            actionLabel="Add Internship Experience"
            onAction={() => setShowModal(true)}
          />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-theme bg-theme-card shadow-2xl">
            <div className="border-b border-theme bg-theme-card px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
                  <BrandLogo />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-theme-primary">Add Internship Experience</h3>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Share the work, rounds, or day-to-day — stored as the same text as before.
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-theme-primary">Experience</label>
                <textarea
                  value={experienceText}
                  onChange={(e) => setExperienceText(e.target.value)}
                  placeholder="Share your internship experience..."
                  className="w-full min-h-[170px] rounded-xl border border-theme bg-theme-input px-4 py-3 text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  required
                />
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-theme bg-theme-input/50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={submitAnonymously}
                  onChange={(e) => setSubmitAnonymously(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-theme text-theme-accent focus:ring-theme-accent"
                />
                <span className="text-sm text-theme-secondary">
                  Submit anonymously (public readers won’t see your name).
                </span>
              </label>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-theme px-5 py-2.5 text-sm font-medium text-theme-secondary transition-colors hover:bg-theme-nav"
                  onClick={() => {
                    setShowModal(false);
                    setSubmitAnonymously(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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

export default InternshipTab;
