import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  GENERAL_BASE,
  TENANT_BASE,
  isGeneralAppPath,
  pathUnderBase,
} from "../constants/tenant.js";

const TenantShellContext = createContext({
  base: TENANT_BASE,
  isGeneral: false,
  appPath: (path) => pathUnderBase(TENANT_BASE, path),
});

export function TenantShellProvider({ base, children }) {
  const value = useMemo(() => {
    const resolved = base === GENERAL_BASE ? GENERAL_BASE : TENANT_BASE;
    return {
      base: resolved,
      isGeneral: resolved === GENERAL_BASE,
      appPath: (path) => pathUnderBase(resolved, path),
    };
  }, [base]);

  return (
    <TenantShellContext.Provider value={value}>{children}</TenantShellContext.Provider>
  );
}

export function useTenantShell() {
  return useContext(TenantShellContext);
}

/** Infer shell base from the current URL (for pages that sit outside a provider). */
export function useAppBaseFromLocation() {
  const { pathname } = useLocation();
  return isGeneralAppPath(pathname) ? GENERAL_BASE : TENANT_BASE;
}
