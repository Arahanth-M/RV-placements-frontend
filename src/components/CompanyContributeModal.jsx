import { useState } from "react";
import { createPortal } from "react-dom";
import BrandLogo from "./BrandLogo.jsx";
import InterviewProcessFields, {
  blankInterviewRound,
} from "./CompanyTabs/InterviewProcessFields.jsx";
import SubmissionFeedbackModal from "./SubmissionFeedbackModal";
import { API_ENDPOINTS, MESSAGES } from "../utils/constants";
import { submissionTargetFields } from "../utils/submissionTargetFields.js";
import { composeInterviewProcess } from "../utils/splitExperienceNarrative.js";

const fieldClass =
  "w-full rounded-xl border border-theme bg-theme-input px-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent";

/**
 * Submit an OA question or interview experience without opening the paid tab.
 */
export default function CompanyContributeModal({
  open,
  kind,
  onClose,
  onKindChange,
  company,
  isGeneral,
  placementYear,
  placementListContext,
  placementCompanyVisitId,
}) {
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [overview, setOverview] = useState("");
  const [rounds, setRounds] = useState(() => [blankInterviewRound()]);
  const [anonymous, setAnonymous] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!open || !kind) {
    return (
      <SubmissionFeedbackModal
        open={Boolean(feedback)}
        onClose={() => setFeedback(null)}
        variant={feedback?.variant}
        statusMessage={feedback?.message}
      />
    );
  }

  const reset = () => {
    setQuestion("");
    setSolution("");
    setOverview("");
    setRounds([blankInterviewRound()]);
    setAnonymous(false);
    setFormError("");
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose?.();
  };

  const submit = async (body) => {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyId: company?._id,
          ...body,
          ...submissionTargetFields({
            isGeneral,
            placementYear,
            placementListContext,
            placementCompanyVisitId,
          }),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      setFeedback({
        variant: "success",
        message: data.message || MESSAGES.SUBMISSION_SUCCESS,
      });
      reset();
      onClose?.();
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: "error",
        message: MESSAGES.SUBMISSION_ERROR,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuestion = (event, type) => {
    event.preventDefault();
    submit({
      type,
      content: JSON.stringify({ question, solution }),
    });
  };

  const handleExperience = (event) => {
    event.preventDefault();
    const content = composeInterviewProcess({ overview, rounds });
    if (!content || !rounds.some((round) => round.title.trim() || round.details.trim())) {
      setFormError("Add at least one round before submitting.");
      return;
    }
    submit({
      type: "interviewProcess",
      content,
      isAnonymous: anonymous,
    });
  };

  const isExperience = kind === "experience";
  const chipClass = (active) =>
    `rounded-full px-3 py-1 text-sm font-semibold ${
      active
        ? "bg-theme-accent text-white"
        : "border border-theme text-theme-secondary hover:bg-theme-hero"
    }`;

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="flex max-h-[min(90vh,860px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-theme bg-theme-card shadow-2xl">
            <div className="border-b border-theme px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-24 shrink-0 rounded-lg border border-theme bg-white/95 p-2 shadow-sm">
                  <BrandLogo />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold text-theme-primary">
                    Add for {company?.name || "this company"}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onKindChange?.("oa")}
                      className={chipClass(kind === "oa")}
                    >
                      OA question
                    </button>
                    <button
                      type="button"
                      onClick={() => onKindChange?.("interview")}
                      className={chipClass(kind === "interview")}
                    >
                      Interview question
                    </button>
                    <button
                      type="button"
                      onClick={() => onKindChange?.("experience")}
                      className={chipClass(isExperience)}
                    >
                      Interview experience
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <form
              onSubmit={
                isExperience
                  ? handleExperience
                  : (event) =>
                      handleQuestion(
                        event,
                        kind === "interview" ? "interviewQuestions" : "onlineQuestions"
                      )
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {!isExperience ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-theme-primary">
                        Question
                      </label>
                      <textarea
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder="Enter the complete question statement"
                        className={`${fieldClass} min-h-[130px]`}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-theme-primary">
                        Solution
                        <span className="ml-2 text-xs font-normal text-theme-muted">Optional</span>
                      </label>
                      <textarea
                        value={solution}
                        onChange={(event) => setSolution(event.target.value)}
                        placeholder="Add an explanation, approach, or sample code"
                        className={`${fieldClass} min-h-[130px]`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <InterviewProcessFields
                      overview={overview}
                      onOverviewChange={setOverview}
                      rounds={rounds}
                      onRoundsChange={setRounds}
                      error={formError}
                    />
                    <label className="flex items-start gap-3 rounded-xl border border-theme bg-theme-input/50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(event) => setAnonymous(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-theme text-theme-accent focus:ring-theme-accent"
                      />
                      <span className="text-sm text-theme-secondary">
                        Submit anonymously (your name will be hidden).
                      </span>
                    </label>
                  </>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-theme px-6 py-4">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-theme px-5 py-2.5 text-sm font-medium text-theme-secondary hover:bg-theme-nav"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      <SubmissionFeedbackModal
        open={Boolean(feedback)}
        onClose={() => setFeedback(null)}
        variant={feedback?.variant}
        statusMessage={feedback?.message}
      />
    </>
  );
}
