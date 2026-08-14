import React from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaExternalLinkAlt, FaUniversity } from "react-icons/fa";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";
import { RVCE_PLACEMENT_EMAIL, RVITM_PLACEMENT_EMAIL } from "../utils/collegeScope.js";



function Contact() {
  const navigate = useNavigate();
  const handleBack = () => {
  navigate('/');
};

  return (
    <div className={`contact-page-theme min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={handleBack} label="Back" />
        </PageBackNavRow>

        <div className="mx-auto max-w-4xl">
        <PageHeroHeader subtitle="Get in touch with the RVCE and RVITM Placement Offices for placement-related questions and support.">
          Contact <em style={{ color: '#818CF8', fontStyle: 'italic' }}>Us</em>
        </PageHeroHeader>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Email Card */}
          <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-3 sm:mb-4">
              <div
                className="rounded-full p-2 sm:p-3 mr-3 sm:mr-4 border border-theme-accent"
                style={{ backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
              >
                <FaEnvelope className="w-5 h-5 sm:w-6 sm:h-6 text-theme-accent" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-indigo-400">Email ID</h2>
            </div>
            <p className="text-sm sm:text-base text-slate-400 mb-3 sm:mb-4">Official placement emails</p>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">RVCE</p>
            <a
              href={`mailto:${RVCE_PLACEMENT_EMAIL}`}
              className="text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
            >
              {RVCE_PLACEMENT_EMAIL}
              <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
            </a>
            <p className="text-xs uppercase tracking-wide text-slate-500 mt-3 mb-1">RVITM</p>
            <a
              href={`mailto:${RVITM_PLACEMENT_EMAIL}`}
              className="text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
            >
              {RVITM_PLACEMENT_EMAIL}
              <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
            </a>
          </div>

          {/* Website Card */}
          <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-3 sm:mb-4">
              <div
                className="rounded-full p-2 sm:p-3 mr-3 sm:mr-4 border border-theme-accent"
                style={{ backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
              >
                <FaUniversity className="w-5 h-5 sm:w-6 sm:h-6 text-theme-accent" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-indigo-400">Placement Websites</h2>
            </div>
            <p className="text-sm sm:text-base text-slate-400 mb-3 sm:mb-4">
              Visit the official placement websites
            </p>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">RVCE</p>
            <a
              href="https://rvce.edu.in/placement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
            >
              RVCE Placement Official Website
              <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
            </a>
            <p className="text-xs uppercase tracking-wide text-slate-500 mt-3 mb-1">RVITM</p>
            <a
              href="https://rvitm.edu.in/placement/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
            >
              RVITM Placement Official Website
              <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-semibold text-indigo-400 mb-3 sm:mb-4">
              RV College of Engineering
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mb-2">
              <strong className="text-white">Address:</strong> RV Vidyaniketan Post, Mysore Road,
              Bengaluru - 560059, Karnataka, India
            </p>
            <p className="text-sm sm:text-base text-slate-400">
              For placement-related queries, please contact the Placement Office through the
              official email or visit the placement website for more information.
            </p>
          </div>
          <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-semibold text-indigo-400 mb-3 sm:mb-4">
              RV Institute of Technology and Management
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mb-2">
              <strong className="text-white">Address:</strong> Chaithanya Layout, 8th Phase, JP Nagar,
              Bengaluru - 560076, Karnataka, India
            </p>
            <p className="text-sm sm:text-base text-slate-400">
              For placement-related queries, please contact the Placement Office through the
              official email or visit the placement website for more information.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
