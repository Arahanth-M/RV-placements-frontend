import { useNavigate, useLocation } from "react-router-dom";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "../PageBackNav.jsx";
import { GENERAL_BASE, TENANT_BASE } from "../../constants/tenant.js";
import { LEGAL_LAST_UPDATED } from "./legalMeta.js";

export default function LegalPageLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleBack = () => {
    if (pathname.startsWith(`${GENERAL_BASE}/`) || pathname === GENERAL_BASE) {
      navigate(GENERAL_BASE);
      return;
    }
    if (pathname.startsWith(`${TENANT_BASE}/`) || pathname === TENANT_BASE) {
      navigate(TENANT_BASE);
      return;
    }
    navigate("/");
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={handleBack} label="Back" />
        </PageBackNavRow>
        <PageHeroHeader subtitle={subtitle}>{title}</PageHeroHeader>
        <p className="mx-auto mb-8 max-w-3xl text-center text-xs text-theme-muted">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>
        <article className="mx-auto max-w-3xl space-y-8 pb-8 text-sm leading-relaxed text-theme-secondary sm:text-base">
          {children}
        </article>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-theme-primary">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
