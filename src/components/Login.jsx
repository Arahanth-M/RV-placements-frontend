import { useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../utils/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  tenantPath,
  generalPath,
  toPostLoginAppPath,
  GENERAL_POST_LOGIN_PATH,
  resolveLoginGateBackPath,
} from "../constants/tenant.js";
import {
  canAccessRvceTenant,
  isPlatformAdminUser,
} from "../utils/collegeScope.js";
import { LOGIN_INTENT_CAMPUS, LOGIN_INTENT_GENERAL } from "../utils/loginIntent.js";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
} from "./PageBackNav.jsx";
import { SignInPanel } from "./PlatformLoginMenu.jsx";

const LOGIN_REDIRECT_PATH_KEY = "loginRedirectPath";

const Login = () => {
  const { login, user, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.includes("/admin");
  const spcAccessDenied = new URLSearchParams(location.search).get("reason") === "spc_access_denied";

  const backFallback = useMemo(
    () => resolveLoginGateBackPath(location.pathname),
    [location.pathname]
  );

  const handleBack = useCallback(() => {
    const historyIdx = window.history.state?.idx;
    if (typeof historyIdx === "number" && historyIdx > 0) {
      navigate(-1);
      return;
    }
    navigate(backFallback);
  }, [backFallback, navigate]);

  const persistRedirectForLogin = useCallback(() => {
    if (isAdminRoute) return;
    const nextPath = `${location.pathname || "/"}${location.search || ""}${location.hash || ""}`;
    if (nextPath.startsWith("/")) {
      sessionStorage.setItem(LOGIN_REDIRECT_PATH_KEY, nextPath);
    }
  }, [isAdminRoute, location.hash, location.pathname, location.search]);

  const handleGoogleSignIn = (intent) => {
    persistRedirectForLogin();
    login(false, { intent });
  };

  useEffect(() => {
    if (user || isAdminRoute) return;
    const here = `${location.pathname}${location.search}${location.hash}`;
    if (here === "/login" || here.endsWith("/login")) return;
    persistRedirectForLogin();
  }, [user, isAdminRoute, persistRedirectForLogin, location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!user) return;
    if (isPlatformAdminUser(user) || isSuperAdmin) {
      navigate(generalPath("/admin/dashboard"), { replace: true });
      return;
    }
    if (!canAccessRvceTenant(user)) {
      const storedRedirect = sessionStorage.getItem(LOGIN_REDIRECT_PATH_KEY);
      const safeRedirect = toPostLoginAppPath(storedRedirect, { useGeneral: true });
      sessionStorage.removeItem(LOGIN_REDIRECT_PATH_KEY);
      navigate(safeRedirect || GENERAL_POST_LOGIN_PATH, { replace: true });
      return;
    }
    if (isAdmin) {
      navigate(tenantPath("/admin/dashboard"), { replace: true });
      return;
    }
    const storedRedirect = sessionStorage.getItem(LOGIN_REDIRECT_PATH_KEY);
    const safeRedirect = toPostLoginAppPath(storedRedirect, { useGeneral: false });
    sessionStorage.removeItem(LOGIN_REDIRECT_PATH_KEY);
    navigate(safeRedirect, { replace: true });
  }, [user, isAdmin, isSuperAdmin, navigate]);

  return (
    <div className="bg-theme-app px-4 pb-6 pt-1 text-theme-primary sm:px-6 lg:px-8">
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={handleBack} label="Back" />
        </PageBackNavRow>

        <div className="mx-auto mt-1 w-full max-w-md">
          <div className="rounded-[28px] border border-theme bg-theme-card px-6 py-5 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.35)] sm:px-8 sm:py-6">
            {spcAccessDenied ? (
              <div className="mb-4 rounded-xl border border-red-300 bg-red-100/90 p-4 dark:border-red-700 dark:bg-red-900/25">
                <p className="text-sm text-red-900 dark:text-red-200">
                  <strong>Access denied:</strong> Not authorized as SPC.
                </p>
              </div>
            ) : null}
            <SignInPanel
              onCollege={() => handleGoogleSignIn(LOGIN_INTENT_CAMPUS)}
              onGeneral={() => handleGoogleSignIn(LOGIN_INTENT_GENERAL)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
