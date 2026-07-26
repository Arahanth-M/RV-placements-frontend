import React from "react";
import { Link } from "react-router-dom";

function Footer() {
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
            {/* <p className="mt-1 text-sm font-medium text-theme-secondary/80">
              A product of Devomation AI
            </p> */}
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
              { label: "Home", to: "/" },
              { label: "Company Stats", to: "/companystats" },
              { label: "Contact Us", to: "/contact" },
              { label: "Feedback", to: "/feedback" },
              { label: "Developers", to: "/team" },
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
              <p>
                Email: <a
                href="mailto:placement@rvce.edu.in"
                className="text-theme-accent hover:opacity-80 transition-opacity"
              >
                placement@rvce.edu.in </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar — product + legal entity (industry-standard attribution) */}
        <div className="flex flex-col gap-3 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-theme-secondary/70">
            <span className="font-medium text-theme-secondary">Last Minute Placement Prep</span>
            <span className="text-theme-secondary/50" aria-hidden>
              {" "}
              ·{" "}
            </span>
            {/* <span className="text-theme-secondary/60">A product of Devomation AI</span> */}
          </p>
          <p className="text-sm text-theme-secondary/60">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;