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
            <h2 className="text-2xl font-serif text-theme-primary tracking-tight mb-4">
              lastminute<span className="italic text-theme-accent">placementprep</span>
            </h2>
            <p className="text-base text-theme-secondary leading-relaxed max-w-xs">
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
              {label: "Feedback", to: "/feedback"},
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

        {/* Bottom bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-7">
          <p className="text-sm text-theme-secondary/60">
            © {new Date().getFullYear()} lastminuteplacementprep.in — All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;