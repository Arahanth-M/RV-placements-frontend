import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaExternalLinkAlt, FaLinkedin, FaMapMarkerAlt, FaUniversity } from "react-icons/fa";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";
import { RVCE_PLACEMENT_EMAIL, RVITM_PLACEMENT_EMAIL } from "../utils/collegeScope.js";
import {
  DEVOMATION_AI_EMAIL,
  PLATFORM_CONTACT_EMAIL,
  PLATFORM_LINKEDIN_URL,
} from "../utils/constants";
import { GENERAL_BASE, TENANT_BASE } from "../constants/tenant.js";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import { LEGAL_BRAND, LEGAL_LOCATION, LEGAL_OPERATOR, LEGAL_WEBSITE } from "./legal/legalMeta.js";

function Contact() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { base, isGeneral } = useTenantShell();
  const handleBack = () => {
    if (pathname.startsWith(`${GENERAL_BASE}/`) || pathname === GENERAL_BASE) {
      navigate(GENERAL_BASE);
      return;
    }
    if (pathname.startsWith(`${TENANT_BASE}/`) || pathname === TENANT_BASE) {
      navigate(base);
      return;
    }
    navigate("/");
  };

  return (
    <div className={`contact-page-theme min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={handleBack} label="Back" />
        </PageBackNavRow>

        <div className="mx-auto max-w-4xl">
          {isGeneral ? (
            <GeneralContactBody />
          ) : (
            <CampusContactBody />
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralContactBody() {
  return (
    <>
      <PageHeroHeader subtitle="Reach Devomation AI for product questions, payments, college enrolment, and support.">
        Contact <em style={{ color: "#818CF8", fontStyle: "italic" }}>Us</em>
      </PageHeroHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-3 sm:mb-4">
            <div
              className="rounded-full p-2 sm:p-3 mr-3 sm:mr-4 border border-theme-accent"
              style={{ backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
            >
              <FaEnvelope className="w-5 h-5 sm:w-6 sm:h-6 text-theme-accent" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-400">Email</h2>
          </div>
          <p className="text-sm sm:text-base text-slate-400 mb-2">Product support</p>
          <a
            href={`mailto:${PLATFORM_CONTACT_EMAIL}`}
            className="text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
          >
            {PLATFORM_CONTACT_EMAIL}
            <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
          </a>
          <p className="text-sm sm:text-base text-slate-400 mt-4 mb-2">Business</p>
          <a
            href={`mailto:${DEVOMATION_AI_EMAIL}`}
            className="text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
          >
            {DEVOMATION_AI_EMAIL}
            <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
          </a>
          <p className="mt-4 text-sm text-slate-400">
            Support is provided by email. We do not currently publish a customer phone number.
          </p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-3 sm:mb-4">
            <div
              className="rounded-full p-2 sm:p-3 mr-3 sm:mr-4 border border-theme-accent"
              style={{ backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
            >
              <FaLinkedin className="w-5 h-5 sm:w-6 sm:h-6 text-theme-accent" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-400">LinkedIn</h2>
          </div>
          <p className="text-sm sm:text-base text-slate-400 mb-3 sm:mb-4">{LEGAL_OPERATOR}</p>
          <a
            href={PLATFORM_LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base md:text-lg flex items-center break-all"
          >
            linkedin.com/company/devomation-ai
            <FaExternalLinkAlt className="w-3 h-3 sm:w-4 sm:h-4 ml-2 flex-shrink-0" />
          </a>
        </div>
      </div>

      <div className="mb-6 sm:mb-8 rounded-xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-lg">
        <div className="mb-4 flex items-center">
          <div
            className="mr-3 rounded-full border border-theme-accent p-2 sm:mr-4 sm:p-3"
            style={{ backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)" }}
          >
            <FaMapMarkerAlt className="h-5 w-5 text-theme-accent sm:h-6 sm:w-6" />
          </div>
          <h2 className="text-xl font-semibold text-indigo-400 sm:text-2xl">Business details</h2>
        </div>
        <p className="text-sm text-slate-300 sm:text-base">
          <strong className="text-white">Product:</strong> {LEGAL_BRAND}
        </p>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          <strong className="text-white">Operator:</strong> {LEGAL_OPERATOR}
        </p>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          <strong className="text-white">Website:</strong>{" "}
          <a className="text-indigo-400 hover:text-indigo-300" href={LEGAL_WEBSITE}>
            {LEGAL_WEBSITE}
          </a>
        </p>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          <strong className="text-white">Location:</strong> {LEGAL_LOCATION}
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Last Minute Placement Prep is a digital service. Correspondence and payment queries are
          handled by email at the addresses above.
        </p>
      </div>
    </>
  );
}

function CampusContactBody() {
  return (
    <>
      <PageHeroHeader subtitle="Get in touch with the RVCE and RVITM Placement Offices for placement-related questions and support.">
        Contact <em style={{ color: "#818CF8", fontStyle: "italic" }}>Us</em>
      </PageHeroHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
    </>
  );
}

export default Contact;
