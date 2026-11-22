import { useLocation } from "react-router-dom";
import campusLogo from "../assets/logo.webp";
import { isGeneralAppPath, isTenantAppPath } from "../constants/tenant.js";
import { useTenantShell } from "../context/TenantShellContext.jsx";

const PLATFORM_LOGO_SRC = "/ospp-logo.png";

export default function BrandLogo({
  className = "",
  alt,
  ...props
}) {
  const { isGeneral } = useTenantShell();
  const { pathname } = useLocation();
  const useCampusLogo = !isGeneral && isTenantAppPath(pathname) && !isGeneralAppPath(pathname);
  const src = useCampusLogo ? campusLogo : PLATFORM_LOGO_SRC;
  const resolvedAlt =
    alt != null && String(alt).length > 0
      ? alt
      : useCampusLogo
        ? "RV College logo"
        : "One Stop Placement Prep";

  return (
    <div
      className={`rv-brand-logo-wrap flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden ${className}`.trim()}
    >
      <img
        src={src}
        alt={resolvedAlt}
        className="rv-brand-logo max-h-full max-w-full object-contain"
        {...props}
      />
    </div>
  );
}
