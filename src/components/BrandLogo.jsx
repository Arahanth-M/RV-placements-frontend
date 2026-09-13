import { useLocation } from "react-router-dom";
import logo from "../assets/logo.webp";
import { isGeneralAppPath, isTenantAppPath } from "../constants/tenant.js";
import { useTenantShell } from "../context/TenantShellContext.jsx";

function ProductWordmark() {
  return (
    <span className="px-0.5 text-center font-serif text-[11px] leading-tight tracking-tight text-theme-primary sm:text-xs">
      lastminute
      <span className="italic text-theme-accent">placementprep</span>
    </span>
  );
}

export default function BrandLogo({
  className = "",
  alt = "RV College logo",
  ...props
}) {
  const { isGeneral } = useTenantShell();
  const { pathname } = useLocation();
  const useCampusLogo = !isGeneral && isTenantAppPath(pathname) && !isGeneralAppPath(pathname);

  return (
    <div
      className={`rv-brand-logo-wrap flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden ${className}`.trim()}
    >
      {useCampusLogo ? (
        <img
          src={logo}
          alt={alt}
          className="rv-brand-logo max-h-full max-w-full object-contain"
          {...props}
        />
      ) : (
        <ProductWordmark />
      )}
    </div>
  );
}
