import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-theme-sidebar border-t border-theme-sidebar text-theme-secondary py-8 mt-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">lastminuteplacementprep</h3>
            <p className="text-sm text-theme-secondary">
              Your ultimate placement preparation platform with company insights, 
              interview experiences, and premium resources.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-theme-secondary hover:text-theme-accent transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/companystats" className="text-sm text-theme-secondary hover:text-theme-accent transition-colors">
                  Company Stats
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-theme-secondary hover:text-theme-accent transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/team" className="text-sm text-theme-secondary hover:text-theme-accent transition-colors">
                  Our Developers
                </Link>
              </li>
              <li>
                <Link to="/premium" className="text-sm text-theme-secondary hover:text-theme-accent transition-colors">
                  Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-theme-secondary">
              <p>
                Email: <a href="mailto:placement@rvce.edu.in" className="hover:text-theme-accent transition-colors">placement@rvce.edu.in</a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-theme mt-8 pt-6 text-center">
          <p className="text-sm text-theme-secondary">
            © {new Date().getFullYear()} lastminuteplacementprep.in All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
