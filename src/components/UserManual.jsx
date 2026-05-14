import React from "react";
import { FaBookOpen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";

function UserManual() {
  const navigate = useNavigate();

  return (
    <div className={`content-cards-page-theme min-h-screen ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate("/")} label="Back" />
        </PageBackNavRow>

        <div className="mx-auto w-full max-w-3xl">
        <article className="rounded-2xl border border-theme bg-theme-card p-6 shadow-lg sm:p-8 sm:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-theme-accent/40 bg-theme-hero px-3 py-1.5">
            <FaBookOpen className="text-theme-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-theme-accent">
              Students Corner
            </span>
          </div>

          <h1 className="text-2xl font-bold text-theme-primary sm:text-3xl">User Manual</h1>
          <p className="mt-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
            This guide walks you through the platform in the order you will typically use it: signing
            in, exploring companies, reading interview content, contributing
            your own experience, and using AI mock interviews.
          </p>

          <hr className="my-8 border-theme" />

          <section className="space-y-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
            <h2 className="text-base font-bold text-theme-primary sm:text-lg">Getting started</h2>
            <p>
              The platform uses <strong className="text-theme-primary">secure signup and login</strong>.
              Once you are signed in, <strong className="text-theme-primary">access is controlled through
              authenticated sessions</strong>, so only logged-in users can use student features such as
              company pages, submissions, and AI interviews.
            </p>
          </section>

          <hr className="my-8 border-theme" />

          {/* <section className="space-y-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
            <h2 className="text-base font-bold text-theme-primary sm:text-lg">
              Rollout scope (branches and batches)
            </h2>
            <p>
              Full student access during this phase is aimed at{" "}
              <strong className="text-theme-primary">Computer Science and Engineering (CSE)</strong>{" "}
              students. <strong className="text-theme-primary">Other branches</strong> and{" "}
              <strong className="text-theme-primary">additional batches</strong> will be supported{" "}
              <strong className="text-theme-primary">shortly</strong> as we extend the rollout—check
              announcements or this manual again for updates.
            </p>
          </section> */}

          <hr className="my-8 border-theme" />

          <section className="space-y-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
            <h2 className="text-base font-bold text-theme-primary sm:text-lg">
              Exploring companies by category
            </h2>
            <p>
              From Company Stats (or the category views), you can browse companies grouped by how
              they recruit. Categories include{" "}
              <strong className="text-theme-primary">Dream Companies</strong>,{" "}
              <strong className="text-theme-primary">Open Dream</strong>,{" "}
              <strong className="text-theme-primary">Summer Internships</strong>,{" "}
              <strong className="text-theme-primary">Internships Only</strong>, and{" "}
              <strong className="text-theme-primary">Off-Campus Opportunities</strong>. Pick a category
              that matches what you are preparing for, then open individual company cards from there.
            </p>
          </section>

          <hr className="my-8 border-theme" />

          <section className="space-y-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
            <h2 className="text-base font-bold text-theme-primary sm:text-lg">
              What you see on a company page
            </h2>
            <p>
              After you select a company, you can review how interviews are structured and what
              others were asked. Typical content includes{" "}
              <strong className="text-theme-primary">interview rounds</strong>,{" "}
              <strong className="text-theme-primary">questions</strong> from past processes, and{" "}
              <strong className="text-theme-primary">experiences</strong> shared by placed students.
              Use this together to build a realistic picture of that company&apos;s process before you
              interview or submit your own notes.
            </p>
          </section>

          <hr className="my-8 border-theme" />

          <section className="space-y-4 text-sm leading-relaxed text-theme-secondary sm:text-base">
            <h2 className="text-base font-bold text-theme-primary sm:text-lg">
              Sharing interview experiences and questions
            </h2>
            <p>
              If you have been placed (or have reliable interview experience), you can help juniors by
              contributing on the relevant company page. Placed students can{" "}
              <strong className="text-theme-primary">add interview experiences</strong>,{" "}
              <strong className="text-theme-primary">submit questions asked in rounds</strong>, and{" "}
              <strong className="text-theme-primary">share tips and preparation strategies</strong>.
            </p>
            <p className="font-medium text-theme-primary">Typical flow:</p>
            <ol className="list-decimal space-y-2 pl-5 marker:text-theme-accent">
              <li>Log in to your account.</li>
              <li>Open the company you interviewed with.</li>
              <li>Use <strong className="text-theme-primary">Add Experience / Questions</strong> (or the equivalent action on that tab).</li>
              <li>
                Fill in the form: <strong className="text-theme-primary">role</strong> (e.g. SDE,
                Intern), <strong className="text-theme-primary">rounds</strong> (OA, Technical, HR,
                etc.), <strong className="text-theme-primary">questions asked</strong>, and optional{" "}
                <strong className="text-theme-primary">tips</strong>.
              </li>
              <li>Submit. Your contribution may be reviewed before it appears for everyone.</li>
            </ol>
          </section>

          <hr className="my-8 border-theme" />

          <section className="space-y-4 rounded-xl border border-theme-accent/30 bg-theme-hero/80 p-5 sm:p-6 text-sm leading-relaxed text-theme-secondary sm:text-base">
            <h2 className="text-base font-bold text-theme-primary sm:text-lg">AI Mock Interview</h2>
            <p>
              The <strong className="text-theme-primary">AI Mock Interview</strong> feature simulates
              real interview scenarios so you can practise with structure and feedback before your
              actual placements.
            </p>
            <p>
              Unlike generic mock tools, this system draws from a{" "}
              <strong className="text-theme-primary">curated pool of real questions</strong> that
              placed students have submitted on the platform. That keeps practice{" "}
              <strong className="text-theme-primary">relevant, realistic, and company-specific</strong>{" "}
              rather than generic trivia.
            </p>
            <p className="text-theme-secondary">
              Open <strong className="text-theme-primary">AI Interviews</strong> from Student Corner,
              pick your context, and follow the on-screen flow to start or resume a session.
            </p>
          </section>
        </article>
        </div>
      </div>
    </div>
  );
}

export default UserManual;
