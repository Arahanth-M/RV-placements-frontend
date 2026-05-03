import React from "react";
import { FaExternalLinkAlt, FaComments } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FEEDBACK_FORM_URL } from "../utils/constants";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";

function Feedback() {
  const navigate = useNavigate();

  return (
    <div className={`content-cards-page-theme min-h-screen ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(-1)} label="Back" />
        </PageBackNavRow>

        <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-2xl border border-theme bg-theme-card p-6 shadow-lg sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-theme-accent/40 bg-theme-hero px-3 py-1.5">
            <FaComments className="text-theme-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-theme-accent">
              Student Feedback
            </span>
          </div>

          <h1 className="text-2xl font-bold text-theme-primary sm:text-3xl text-center">
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
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-theme-accent/40 bg-theme-hero px-4 py-2.5 text-sm font-semibold text-theme-accent shadow-sm transition-colors hover:opacity-90 transition-opacity shadow-lg"
            >
              Open Feedback Form
              <FaExternalLinkAlt className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
