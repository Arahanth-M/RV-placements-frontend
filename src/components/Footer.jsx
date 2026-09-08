import React from "react";
import { Link } from "react-router-dom";
import { RVCE_PLACEMENT_EMAIL, RVITM_PLACEMENT_EMAIL } from "../utils/collegeScope.js";
import { TENANT_BASE } from "../constants/tenant.js";
import { useTenantShell } from "../context/TenantShellContext.jsx";

function Footer() {
  const { base, appPath, isGeneral } = useTenantShell();
  const homePath = base || TENANT_BASE;

  return (
    <footer className="bg-theme-sidebar border-t border-theme text-theme-secondary py-12 mt-6">
      <div className="container mx-auto px-8">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-theme">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-serif text-theme-primary tracking-tight">
              lastminute<span className="italic text-theme-accent">placementprep</span>
            </h2>
            <p className="mt-4 text-base text-theme-secondary leading-relaxed max-w-xs">
              Your ultimate placement preparation platform with company insights,
              interview experiences, and premium resources.
            </p>
          </div>

         {/* Navigation */}
          <div className="flex flex-col items-center">
          <p className="text-xl font-mono tracking-widest text-theme-secondary/50 uppercase mb-5">
            Quick Links
          </p>
          <ul className="flex flex-col gap-3.5 items-center">
            {[
              { label: "Home", to: homePath },
              { label: "Company Stats", to: appPath("/companystats") },
              { label: "Contact Us", to: appPath("/contact") },
              { label: "Feedback", to: appPath("/feedback") },
              { label: "Developers", to: appPath("/team") },
            ].map(({ label, to }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex items-center gap-2 text-base text-theme-secondary hover:text-theme-accent transition-colors"
              >
              <span className="w-3 h-px bg-current opacity-40 group-hover:w-5 group-hover:opacity-100 transition-all duration-200" />
              {label}
              </Link>
            </li>
            ))}
          
           </ul>
          </div>
          
          {/* Contact */}
          <div>
            <p className="text-xl font-mono tracking-widest text-theme-secondary/50 uppercase mb-5">
              Contact
            </p>
            <div className="text-base text-theme-secondary leading-relaxed">
              {isGeneral ? (
                <p>
                  Want this on your campus?{" "}
                  <Link to="/onboard" className="text-theme-accent hover:opacity-80 transition-opacity">
                    Enrol your college
                  </Link>
                </p>
              ) : (
                <>
                  <p>
                    RVCE:{" "}
                    <a
                      href={`mailto:${RVCE_PLACEMENT_EMAIL}`}
                      className="text-theme-accent hover:opacity-80 transition-opacity"
                    >
                      {RVCE_PLACEMENT_EMAIL}
                    </a>
                  </p>
                  <p className="mt-2">
                    RVITM:{" "}
                    <a
                      href={`mailto:${RVITM_PLACEMENT_EMAIL}`}
                      className="text-theme-accent hover:opacity-80 transition-opacity"
                    >
                      {RVITM_PLACEMENT_EMAIL}
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 text-center text-sm text-theme-secondary">
          © {new Date().getFullYear()} lastminuteplacementprep. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
