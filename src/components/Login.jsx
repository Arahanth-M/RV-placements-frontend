import { useEffect, useRef } from "react";
import { useAuth } from "../utils/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

const LOGIN_REDIRECT_PATH_KEY = "loginRedirectPath";

const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Login = () => {
  const { login, user, isAdmin, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handledOAuthQueryRef = useRef(false);
  const isAdminRoute = location.pathname.includes("/admin");

  const handleGoogleSignIn = () => {
    if (!isAdminRoute) {
      const nextPath = `${location.pathname || "/"}${location.search || ""}${location.hash || ""}`;
      if (nextPath.startsWith("/")) {
        sessionStorage.setItem(LOGIN_REDIRECT_PATH_KEY, nextPath);
      }
    }
    login(isAdminRoute);
  };

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }
      const storedRedirect = sessionStorage.getItem(LOGIN_REDIRECT_PATH_KEY);
      const safeRedirect =
        storedRedirect && storedRedirect.startsWith("/") ? storedRedirect : "/";
      sessionStorage.removeItem(LOGIN_REDIRECT_PATH_KEY);
      navigate(safeRedirect, { replace: true });
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (handledOAuthQueryRef.current) return;
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess =
      urlParams.get("login") === "success" || urlParams.get("signup") === "success";
    if (!oauthSuccess) return;

    handledOAuthQueryRef.current = true;

    const finalizeOAuthOnLoginPage = async () => {
      let refreshedUser = null;
      const maxAttempts = 5;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        refreshedUser = await refreshUser({ force: true });
        if (refreshedUser) break;
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      if (refreshedUser) {
        const adminFlag = urlParams.get("admin") === "true";
        if (adminFlag) {
          window.location.replace("/admin/dashboard");
          return;
        }
        const storedRedirect = sessionStorage.getItem(LOGIN_REDIRECT_PATH_KEY);
        const safeRedirect =
          storedRedirect && storedRedirect.startsWith("/") ? storedRedirect : "/";
        sessionStorage.removeItem(LOGIN_REDIRECT_PATH_KEY);
        window.location.replace(safeRedirect);
      }
    };

    finalizeOAuthOnLoginPage().catch((err) => {
      console.error("OAuth completion from /login failed:", err);
    });
  }, [refreshUser]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-4 pt-8 pb-10 sm:px-6 sm:pt-10 lg:px-8 bg-theme-app text-theme-primary">
      <div className="max-w-md w-full -translate-y-4 sm:-translate-y-6 space-y-6 bg-theme-card/95 border border-theme p-8 rounded-3xl shadow-2xl shadow-slate-950/20 backdrop-blur-md h-fit">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-theme-primary">Please sign in to access this content</h2>
          <p className="mt-3 text-center text-sm text-theme-secondary">
            Use your <strong className="text-theme-accent">RVCE mail ID</strong> to sign in.
          </p>
        </div>

        <div className="space-y-4">
          {isAdminRoute && (
            <div className="bg-yellow-100/90 dark:bg-yellow-900/25 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-200">
                <strong>Admin sign-in:</strong> Only authorized admin accounts can access this section.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-theme-accent hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-accent transition-colors"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
