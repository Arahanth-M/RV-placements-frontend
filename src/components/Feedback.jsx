import React from "react";
import { FaArrowLeft, FaExternalLinkAlt, FaComments } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const DUMMY_FEEDBACK_FORM_URL = "https://forms.google.com/dummy-feedback-link";

function Feedback() {
  const navigate = useNavigate();

  return (
    <div className="content-cards-page-theme min-h-screen bg-theme-app px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="back-nav-clear-sidebar mb-5 flex items-center back-link-theme text-sm sm:text-base"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>

        <section className="rounded-2xl border border-theme bg-theme-card p-6 shadow-lg sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-theme-accent/40 bg-theme-hero px-3 py-1.5">
            <FaComments className="text-theme-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-theme-accent">
              Student Feedback
            </span>
          </div>

          <h1 className="text-2xl font-bold text-theme-primary sm:text-3xl">
            Help us improve this platform
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
            Your feedback helps us make this platform better for everyone at RVCE.
            Share ideas, pain points, and suggestions so we can improve placement
            prep for upcoming batches and contribute to the overall betterment of
            the college.
          </p>

          <div className="mt-6 rounded-xl border border-theme bg-theme-hero p-4 sm:p-5">
            <p className="text-sm text-theme-secondary sm:text-base">
              We read every response carefully. Please use the form below to share
              your thoughts.
            </p>
            <a
              href={DUMMY_FEEDBACK_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-theme-accent/40 bg-theme-hero px-4 py-2.5 text-sm font-semibold text-theme-accent shadow-sm transition-colors hover:bg-theme-card sm:text-base"
            >
              Open Feedback Form
              <FaExternalLinkAlt className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Feedback;
