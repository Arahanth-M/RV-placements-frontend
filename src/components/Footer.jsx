import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 py-8 mt-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">lastminuteplacementprep</h3>
            <p className="text-sm text-slate-400">
              Your ultimate placement preparation platform with company insights, 
              interview experiences, and premium resources.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/companystats" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Company Stats
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/developers" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Our Developers
                </Link>
              </li>
              <li>
                <Link to="/premium" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/cancellation" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  Cancellation & Refund
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-slate-400">
              <p>
                Email: <a href="mailto:placement@rvce.edu.in" className="hover:text-indigo-400 transition-colors">placement@rvce.edu.in</a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-6 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} lastminuteplacementprep.in All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
