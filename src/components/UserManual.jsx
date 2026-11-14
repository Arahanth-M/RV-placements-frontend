import React from "react";
import { FaBookOpen, FaRoute } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import { useProductTour } from "../context/ProductTourContext";
import { RESUME_BUILDER_ENABLED } from "../utils/constants";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";

function ManualSection({ title, children, highlight = false }) {
  const body = (
    <section className="space-y-3 text-sm leading-relaxed text-theme-secondary sm:text-base">
      <h2 className="text-base font-bold text-theme-primary sm:text-lg">{title}</h2>
      {children}
    </section>
  );

  if (!highlight) return body;

  return (
    <section className="space-y-3 rounded-xl border border-theme-accent/30 bg-theme-hero/80 p-5 sm:p-6 text-sm leading-relaxed text-theme-secondary sm:text-base">
      <h2 className="text-base font-bold text-theme-primary sm:text-lg">{title}</h2>
      {children}
    </section>
  );
}

function FeatureItem({ name, children }) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-theme-primary">{name}</h3>
      <p>{children}</p>
    </div>
  );
}

function GeneralFeatureGuide({ showResumeBuilder }) {
  return (
    <>
      <ManualSection title="Company Prep Hub">
        <p>
          Your starting point for company research. Browse companies by industry category —
          Fintech, E-commerce, AI/ML and Cyber Security, Semiconductors, Enterprise Software,
          Product-based, Service-based, Startup, and Miscellaneous. Search across categories,
          open a company card, and dig into interview content. Some categories or cards may
          need a plan from{" "}
          <strong className="text-theme-primary">Pricing</strong>.
        </p>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="What you see on a company page">
        <p>
          Each company page gathers how interviews usually run and what others were asked —
          including{" "}
          <strong className="text-theme-primary">interview rounds</strong>,{" "}
          <strong className="text-theme-primary">past questions</strong>, and{" "}
          <strong className="text-theme-primary">experiences</strong> shared by students. Use
          it to understand the process before you interview or contribute your own notes.
        </p>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="Sharing interview experiences and questions">
        <p>
          If you have interview or placement experience, contribute on the company page:{" "}
          <strong className="text-theme-primary">add experiences</strong>,{" "}
          <strong className="text-theme-primary">submit questions from rounds</strong>, and{" "}
          <strong className="text-theme-primary">share tips</strong>. Open the company → use{" "}
          <strong className="text-theme-primary">Add Experience / Questions</strong> → submit.
          Contributions may be reviewed before they appear for everyone.
        </p>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="AI mock interviews" highlight>
        <p>
          Practise realistic, company-specific interviews drawn from curated questions on the
          platform — not generic trivia. The hub has three sections:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-theme-accent">
          <li>
            <strong className="text-theme-primary">Mock interview</strong> — pick a company and
            run a structured AI session with feedback.
          </li>
          <li>
            <strong className="text-theme-primary">Interview slots</strong> — book or manage
            practice slot times.
          </li>
          <li>
            <strong className="text-theme-primary">Interview analytics</strong> — review past
            sessions and progress.
          </li>
        </ul>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="Student Corner features">
        <div className="space-y-5">
          <FeatureItem name="Behavioral coach">
            Practise HR / behavioral answers with a structured coach (for example STAR-style
            prompts). Pick a theme, write your answer, get feedback, and revisit past analytics.
          </FeatureItem>
          <FeatureItem name="Peer sessions">
            Host or join online Google Meet sessions for mock interviews, study groups, or
            doubts. Share a session code, accept join requests, and unlock the Meet link during
            the session window (times in IST).
          </FeatureItem>
          <FeatureItem name="Challenges">
            Daily and weekly DSA practice challenges scored on the platform. Run your solution,
            then submit to see visible and hidden tests.
          </FeatureItem>
          <FeatureItem name="Drive calendar">
            Log campus visits, deadlines, and eligibility checklists yourself. Set reminder
            timing and channel so you stay on top of upcoming drives.
          </FeatureItem>
          <FeatureItem name="PrepPath">
            A personal interview prep roadmap built from your resume, company data, and an AI
            coach — step-by-step guidance toward the roles you are targeting.
          </FeatureItem>
          <FeatureItem name="Pricing">
            Unlock categories or premium tools (mocks, PrepPath, and more). Pick a single
            category plan or a broader package; active entitlements show what you already have.
          </FeatureItem>
          <FeatureItem name="Resources">
            Curated study links and materials for technical interviews and career prep. Search
            by topic to find what you need quickly.
          </FeatureItem>
          {showResumeBuilder ? (
            <FeatureItem name="Resume Builder">
              Build and edit your resume on the platform. Drafts save automatically while you
              are logged in; export to Word when you are ready.
            </FeatureItem>
          ) : null}
        </div>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="Account">
        <div className="space-y-5">
          <FeatureItem name="Profile">
            View and update your student profile details used across the platform.
          </FeatureItem>
          <FeatureItem name="My submissions">
            Track experiences, questions, and other contributions you have submitted, including
            review status.
          </FeatureItem>
        </div>
      </ManualSection>
    </>
  );
}

function CampusFeatureGuide({ showResumeBuilder }) {
  return (
    <>
      <ManualSection title="Company Stats">
        <p>
          Browse companies grouped by how they recruit. Categories include{" "}
          <strong className="text-theme-primary">Dream Companies</strong>,{" "}
          <strong className="text-theme-primary">Open Dream</strong>,{" "}
          <strong className="text-theme-primary">Summer Internships</strong>,{" "}
          <strong className="text-theme-primary">Internships Only</strong>, and{" "}
          <strong className="text-theme-primary">Off-Campus Opportunities</strong>. You can also
          review year-wise placement statistics tables. Pick a category or year, then open
          individual company cards.
        </p>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="What you see on a company page">
        <p>
          After you select a company, review how interviews are structured and what others were
          asked — including{" "}
          <strong className="text-theme-primary">interview rounds</strong>,{" "}
          <strong className="text-theme-primary">questions</strong> from past processes, and{" "}
          <strong className="text-theme-primary">experiences</strong> shared by placed students.
        </p>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="Sharing interview experiences and questions">
        <p>
          Help juniors by contributing on the company page:{" "}
          <strong className="text-theme-primary">add interview experiences</strong>,{" "}
          <strong className="text-theme-primary">submit questions asked in rounds</strong>, and{" "}
          <strong className="text-theme-primary">share tips</strong>. Typical flow: log in → open
          the company → use{" "}
          <strong className="text-theme-primary">Add Experience / Questions</strong> → submit.
          Contributions may be reviewed before they appear for everyone.
        </p>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="AI Interviews" highlight>
        <p>
          Practise with structured AI mock interviews that draw from a{" "}
          <strong className="text-theme-primary">curated pool of real questions</strong> submitted
          by placed students — so practice stays company-specific and realistic.
        </p>
      </ManualSection>

      <hr className="my-8 border-theme" />

      <ManualSection title="Student Corner features">
        <div className="space-y-5">
          <FeatureItem name="Interview Slots">
            Book and manage practice interview slot times for AI mock sessions.
          </FeatureItem>
          <FeatureItem name="PrepPath">
            A personal interview prep roadmap from your resume, campus company data, and an AI
            coach.
          </FeatureItem>
          <FeatureItem name="Resources">
            Curated study links and materials for technical interviews and career prep. Search
            by topic to find what you need quickly.
          </FeatureItem>
          {showResumeBuilder ? (
            <FeatureItem name="Resume Builder">
              Build and edit your resume on the platform. Drafts save automatically while you
              are logged in; export to Word when you are ready.
            </FeatureItem>
          ) : null}
          <FeatureItem name="Leaderboard">
            See how you rank against peers on practice and engagement metrics.
          </FeatureItem>
        </div>
      </ManualSection>
    </>
  );
}

function UserManual() {
  const navigate = useNavigate();
  const { homePath, isGeneral } = useTenantShell();
  const { startTour, isRunning, canStartTour } = useProductTour();
  const showResumeBuilder = Boolean(RESUME_BUILDER_ENABLED);

  return (
    <div className={`content-cards-page-theme min-h-screen ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(homePath)} label="Back" />
        </PageBackNavRow>

        <div className="mx-auto w-full max-w-3xl">
          <article
            className="rounded-2xl border border-theme bg-theme-card p-6 shadow-lg sm:p-8 sm:p-10"
            data-tour="user-manual-intro"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-theme-accent/40 bg-theme-hero px-3 py-1.5">
              <FaBookOpen className="text-theme-accent" />
              <span className="text-xs font-semibold uppercase tracking-wide text-theme-accent">
                Students Corner
              </span>
            </div>

            <h1 className="text-2xl font-bold text-theme-primary sm:text-3xl">User Manual</h1>
            <p className="mt-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
              A short guide to what each feature does
              {isGeneral
                ? " on the general platform"
                : " on the campus platform"}
              . Open any item from{" "}
              <strong className="text-theme-primary">Student Corner</strong> in the header to
              try it.
            </p>

            {canStartTour && (
              <button
                type="button"
                disabled={isRunning}
                onClick={() => startTour()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-theme-accent/40 bg-theme-hero px-4 py-2.5 text-sm font-semibold text-theme-accent hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <FaRoute className="h-4 w-4 shrink-0" aria-hidden />
                {isRunning ? "Tour in progress…" : "Take the interactive tour"}
              </button>
            )}

            <hr className="my-8 border-theme" />

            <ManualSection title="Getting started">
              <p>
                Sign up or log in securely. Once you are signed in,{" "}
                <strong className="text-theme-primary">authenticated sessions</strong> unlock
                student features such as company pages, submissions, and AI interviews. Use the
                header for navigation, theme (light/dark), and notifications.
              </p>
            </ManualSection>

            <hr className="my-8 border-theme" />

            {isGeneral ? (
              <GeneralFeatureGuide showResumeBuilder={showResumeBuilder} />
            ) : (
              <CampusFeatureGuide showResumeBuilder={showResumeBuilder} />
            )}
          </article>
        </div>
      </div>
    </div>
  );
}

export default UserManual;
