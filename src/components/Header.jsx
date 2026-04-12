import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { useTheme } from "../utils/ThemeContext";
import { useState, useEffect, useRef } from "react";
import {
  FaChevronDown,
  FaSun,
  FaMoon,
  FaGraduationCap,
  FaChartBar,
  FaBook,
  FaComments,
  FaTrophy,
  FaUserShield,
  FaTachometerAlt,
  FaExclamationCircle,
} from "react-icons/fa";
import { adminAPI } from "../utils/api";
import NotificationBell from "./NotificationBell";
import logo from "../assets/logo2.png";

const primaryLinks = [
  { label: "Home", path: "/" },
  { label: "Events", path: "/events" },
  { label: "Contact", path: "/contact" },
];

const studentCornerLinks = [
  { label: "Company Stats", path: "/companystats", icon: FaChartBar },
  { label: "AI Interviews", path: "/interviews", icon: FaComments },
  { label: "Resources", path: "/resources", icon: FaBook },
  { label: "Leaderboard", path: "/leaderboard", icon: FaTrophy },
];

/** Shown in header chip; admins usually have no studentData — use username or email local-part. */
function accountDisplayName(user, studentData) {
  const fromStudent = studentData?.name?.trim();
  if (fromStudent) return fromStudent;
  const u = user?.username?.trim();
  if (u) return u;
  const email = user?.email?.trim();
  if (email?.includes("@")) {
    const local = (email.split("@")[0] || "").replace(/[._]+/g, " ").trim();
    if (!local) return email;
    return local
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }
  return "Account";
}

function accountInitialLetter(user, displayName) {
  if (displayName && displayName !== "Account") {
    return displayName.charAt(0).toUpperCase();
  }
  const e = user?.email;
  if (e && /[a-zA-Z]/.test(e)) {
    const m = e.match(/[a-zA-Z]/);
    return m ? m[0].toUpperCase() : "U";
  }
  return "U";
}

// Sidebar-style dropdown item class
const dropdownItemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-sl text-theme-secondary hover:text-theme-primary hover:bg-theme-nav rounded-md transition-colors";

const dropdownItemRedClass =
  "flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-500 hover:bg-theme-nav rounded-md transition-colors";

const Header = () => {
  const { user, isAdmin, studentData, login, signup, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [hasPendingItems, setHasPendingItems] = useState(false);
  const studentMenuRef = useRef(null);
  const adminMenuRef = useRef(null);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.userId, user?.picture, user?.email]);

  const isPathActive = (path) => {
    if (path === "/companystats") {
      return location.pathname === path || location.pathname.startsWith("/companies");
    }
    return location.pathname === path;
  };

  const headerDisplayName = user ? accountDisplayName(user, studentData) : "";
  const headerInitial = user ? accountInitialLetter(user, headerDisplayName) : "U";

  const isStudentCornerActive = studentCornerLinks.some((l) => isPathActive(l.path));

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setAccountMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const el = event.target;
      if (!(el instanceof Node)) return;
      if (studentMenuRef.current && !studentMenuRef.current.contains(el)) {
        setStudentMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(el)) {
        setAdminMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(el)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAdmin || !user) {
      setHasPendingItems(false);
      return;
    }

    const pollIntervalMs = 60000;
    let intervalId = null;

    const checkPendingItems = async () => {
      try {
        const stats = await adminAPI.getStats();
        const hasPending =
          (stats.data?.pendingSubmissions > 0) || (stats.data?.pendingCompanies > 0);
        setHasPendingItems(hasPending);
      } catch {
        setHasPendingItems(false);
      }
    };

    const startPolling = () => {
      checkPendingItems();
      if (!intervalId) intervalId = setInterval(checkPendingItems, pollIntervalMs);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") startPolling();
      else stopPolling();
    };

    document.addEventListener("visibilitychange", onVis);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isAdmin, user]);

  // Sidebar-style dropdown wrapper
  const DropdownMenu = ({ children }) => (
    <div className="absolute right-0 top-full z-[100] mt-1 w-52 overflow-hidden rounded-md border border-theme bg-theme-card shadow-lg py-1">
      {children}
    </div>
  );

  const renderAccountMenu = () => {
    if (loading) {
      return <span className="text-sm text-theme-secondary">Loading...</span>;
    }

    return (
      <div className="relative" ref={accountMenuRef}>
        {!user ? (
          <button
            onClick={() => setAccountMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-theme px-5 py-3 text-base font-semibold text-theme-primary bg-theme-card hover:bg-theme-hero transition"
          >
            Login
            <FaChevronDown className={`h-3 w-3 transition ${accountMenuOpen ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAccountMenuOpen((prev) => !prev)}
            className={`inline-flex min-h-[2.75rem] items-center gap-3 rounded-full border-2 pl-2 pr-4 py-1.5 text-left text-theme-primary transition-[background-color,border-color] duration-200 ${
              accountMenuOpen
                ? "border-theme-accent bg-theme-accent/12"
                : "border-theme bg-theme-card hover:border-theme-accent/45 hover:bg-theme-hero"
            }`}
            title={headerDisplayName}
          >
            {user.picture && !avatarFailed ? (
              <img
                src={user.picture}
                alt=""
                referrerPolicy="no-referrer"
                className="h-10 w-10 shrink-0 rounded-full border-2 border-theme object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-theme bg-theme-hero">
                <span className="text-sm font-semibold text-theme-primary">{headerInitial}</span>
              </div>
            )}
            <span className="hidden min-w-0 max-w-[10rem] truncate text-sm font-semibold text-theme-primary sm:inline sm:max-w-[13rem]">
              {headerDisplayName}
            </span>
            <FaChevronDown className={`h-3 w-3 shrink-0 text-theme-secondary transition ${accountMenuOpen ? "rotate-180" : ""}`} />
          </button>
        )}

        {accountMenuOpen && (
          <DropdownMenu>
            {!user ? (
              <>
                <button
                  onClick={() => { setAccountMenuOpen(false); login(false); }}
                  className={dropdownItemClass}
                >
                  Login as Student
                </button>
                <button
                  onClick={() => { setAccountMenuOpen(false); login(true); }}
                  className={dropdownItemClass}
                >
                  Login as Admin
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-xs text-theme-secondary border-b border-theme break-words">
                  {user.email}
                </div>
                <button
                  onClick={() => { setAccountMenuOpen(false); navigate("/profile"); }}
                  className={dropdownItemClass}
                >
                  View Profile
                </button>
                <button
                  onClick={() => { setAccountMenuOpen(false); signup(); }}
                  className={dropdownItemClass}
                >
                  Switch Account
                </button>
                <button onClick={handleLogout} className={dropdownItemRedClass}>
                  Logout
                </button>
              </>
            )}
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 mb-3 flex w-full overflow-visible border-b border-theme bg-theme-card/95 shadow-md backdrop-blur-xl">
      <Link
        to="/"
        className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center border-b border-r border-theme bg-white p-2 shadow-inner transition hover:bg-white/90"
        title="RVCE Placement — Home"
      >
        <img src={logo} className="h-full w-full object-contain" />
      </Link>

      <div className="flex min-h-[4.5rem] min-w-0 flex-1 flex-col justify-center gap-1 border-b border-theme px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 overflow-visible sm:min-w-0 sm:flex-nowrap sm:justify-end sm:gap-2 md:gap-3">

          {/* Home & Events */}
          {primaryLinks.slice(0, 2).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`shrink-0 rounded-full px-3 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold transition ${
                location.pathname === item.path
                  ? "bg-theme-accent text-white"
                  : "text-theme-secondary hover:bg-theme-hero"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* ── Student Corner dropdown ── */}
          <div className="relative shrink-0" ref={studentMenuRef}>
            <button
              type="button"
              onClick={() => setStudentMenuOpen((prev) => !prev)}
              className={`inline-flex min-h-[2.75rem] sm:min-h-[3rem] items-center gap-2 rounded-full border-2 px-3 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base font-semibold transition-[background-color,border-color,color] duration-200 ${
                isStudentCornerActive
                  ? "border-theme-accent bg-theme-accent text-white"
                  : studentMenuOpen
                    ? "border-theme-accent bg-theme-accent/12 text-theme-primary"
                    : "box-border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero hover:border-theme-accent/55"
              }`}
            >
              <FaGraduationCap
                className={`h-4 w-4 ${isStudentCornerActive ? "text-white" : "opacity-90"}`}
              />
              <span className="max-[480px]:sr-only">Student Corner</span>
              <span className="hidden max-[480px]:inline">Corner</span>
              <FaChevronDown
                className={`h-3 w-3 transition ${studentMenuOpen ? "rotate-180" : ""} ${isStudentCornerActive ? "text-white/90" : ""}`}
              />
            </button>

            {studentMenuOpen && (
              <div className="absolute left-0 top-full z-[100] mt-1 w-52 overflow-hidden rounded-md border border-theme bg-theme-card shadow-lg py-1">
                {studentCornerLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setStudentMenuOpen(false)}
                      className={dropdownItemClass}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact */}
          <Link
            to="/contact"
            className={`shrink-0 rounded-full px-3 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold transition ${
              location.pathname === "/contact"
                ? "bg-theme-accent text-white"
                : "text-theme-secondary hover:bg-theme-hero"
            }`}
          >
            Contact
          </Link>

          {/* Admin Corner dropdown */}
          {isAdmin && (
            <div className="relative shrink-0" ref={adminMenuRef}>
              <button
                type="button"
                onClick={() => setAdminMenuOpen((prev) => !prev)}
                className={`inline-flex min-h-[2.75rem] sm:min-h-[3rem] items-center gap-2 rounded-full border-2 px-3 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base font-semibold transition-[background-color,border-color,color] duration-200 ${
                  location.pathname.startsWith("/admin")
                    ? "border-theme-accent bg-theme-accent text-white"
                    : adminMenuOpen
                      ? "border-theme-accent bg-theme-accent/12 text-theme-primary"
                      : "box-border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero hover:border-theme-accent/55"
                }`}
              >
                <FaUserShield
                  className={`h-4 w-4 ${location.pathname.startsWith("/admin") ? "text-white" : ""}`}
                />
                <span className="hidden sm:inline">Admin</span>
                {hasPendingItems && (
                  <FaExclamationCircle
                    className="h-3.5 w-3.5 text-red-400 animate-pulse"
                    title="Pending items"
                  />
                )}
                <FaChevronDown
                  className={`h-3 w-3 transition ${adminMenuOpen ? "rotate-180" : ""} ${location.pathname.startsWith("/admin") ? "text-white/90" : ""}`}
                />
              </button>

              {adminMenuOpen && (
                <div className="absolute right-0 top-full z-[100] mt-1 w-52 overflow-hidden rounded-md border border-theme bg-theme-card shadow-lg py-1">
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setAdminMenuOpen(false)}
                    className={dropdownItemClass}
                  >
                    <FaTachometerAlt className="h-4 w-4 shrink-0" />
                    Dashboard
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="shrink-0 p-2.5 sm:p-3 rounded-full border border-theme bg-theme-card text-theme-primary hover:bg-theme-card-hover transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
          </button>

          {user && (
            <div className="shrink-0 flex items-center">
              <NotificationBell />
            </div>
          )}

          <div className="shrink-0">{renderAccountMenu()}</div>
        </nav>
      </div>
    </header>
  );
};

export default Header;