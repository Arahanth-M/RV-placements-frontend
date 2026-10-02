import { Link, useLocation } from "react-router-dom";
import { FaEnvelope, FaLinkedin } from "react-icons/fa";
import {
  PLATFORM_CONTACT_EMAIL,
  PLATFORM_LINKEDIN_URL,
} from "../utils/constants";
import { GENERAL_BASE } from "../constants/tenant.js";
import { useAuth } from "../utils/AuthContext";
import { getProductHomePathForUser } from "../utils/collegeScope.js";
import { GENERAL_LEGAL_PATHS, PUBLIC_LEGAL_PATHS } from "./legal/legalMeta.js";

function hashHref(pathname, hash) {
  return pathname === "/" ? `#${hash}` : `/#${hash}`;
}

function FooterHeading({ children }) {
  return (
    <p className="mb-4 h-5 text-xs font-semibold uppercase leading-5 tracking-[0.2em] text-theme-secondary/60">
      {children}
    </p>
  );
}

function FooterLink({ to, href, children }) {
  const className =
    "block text-sm leading-6 text-theme-secondary transition-colors hover:text-theme-accent";
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/**
 * Product footer for `/`, `/onboard`, and all `/general` routes.
 * Campus shells (`/rvce`, later college tenants) keep their own footer.
 */
export default function PlatformFooter() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const onOnboard = pathname === "/onboard";
  const inGeneral = String(pathname || "").startsWith(GENERAL_BASE);
  const homePath = getProductHomePathForUser(user);
  const legalItems = (inGeneral ? GENERAL_LEGAL_PATHS : PUBLIC_LEGAL_PATHS).map((item) => ({
    label: item.label,
    to: inGeneral ? `${GENERAL_BASE}${item.path}` : item.path,
  }));

  const exploreItems = [
    { label: "Challenges", href: hashHref(pathname, "challenges") },
    { label: "Solutions", href: hashHref(pathname, "solutions") },
    { label: "Institutions", href: hashHref(pathname, "institutions") },
    onOnboard
      ? { label: "Back to home", to: homePath }
      : { label: "Enrol your college", to: "/onboard" },
  ];

  const socialBtnClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-theme bg-theme-card text-theme-accent shadow-sm transition-colors hover:border-theme-accent hover:bg-theme-accent hover:text-white";

  return (
    <footer className="border-t border-theme bg-theme-sidebar text-theme-secondary">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
        <div className="grid grid-cols-1 items-start gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
          <div className="sm:col-span-2 lg:col-span-5">
            <h2 className="text-2xl font-serif tracking-tight text-theme-primary">
              lastminute<span className="italic text-theme-accent">placementprep</span>
            </h2>
            <p className="mt-2 text-sm font-medium text-theme-secondary/80">
              A product of Devomation AI
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-theme-secondary">
              Your ultimate placement preparation platform with company insights, interview
              experiences, and premium resources.
            </p>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>Explore</FooterHeading>
            <ul className="space-y-2.5">
              {exploreItems.map((item) => (
                <li key={item.label}>
                  <FooterLink to={item.to} href={item.href}>
                    {item.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <FooterHeading>Legal</FooterHeading>
            <ul className="space-y-2.5">
              {legalItems.map((item) => (
                <li key={item.to}>
                  <FooterLink to={item.to}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>Contact</FooterHeading>
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${PLATFORM_CONTACT_EMAIL}`}
                className={socialBtnClass}
                aria-label={`Email ${PLATFORM_CONTACT_EMAIL}`}
                title={PLATFORM_CONTACT_EMAIL}
              >
                <FaEnvelope className="h-4 w-4" aria-hidden />
              </a>
              <a
                href={PLATFORM_LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={socialBtnClass}
                aria-label="Devomation AI on LinkedIn"
                title="LinkedIn"
              >
                <FaLinkedin className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-theme pt-8 text-sm text-theme-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} lastminuteplacementprep. All rights reserved.</p>
          <p className="text-theme-secondary/70">Built for campuses · Powered by Devomation AI</p>
        </div>
      </div>
    </footer>
  );
}
