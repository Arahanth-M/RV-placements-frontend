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
  FaBars,
  FaTimes,
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
  "flex w-full items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-nav rounded-md transition-colors";

const dropdownItemRedClass =
  "flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-500 hover:bg-theme-nav rounded-md transition-colors";

const Header = () => {
  const { user, isAdmin, studentData, login, signup, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [mobileStudentCornerOpen, setMobileStudentCornerOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const [desktopAccountMenuOpen, setDesktopAccountMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [hasPendingItems, setHasPendingItems] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const studentMenuRef = useRef(null);
  const adminMenuRef = useRef(null);
  const mobileAccountMenuRef = useRef(null);
  const desktopAccountMenuRef = useRef(null);
  const headerShellRef = useRef(null);

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
    setMobileAccountMenuOpen(false);
    setDesktopAccountMenuOpen(false);
    setMobileNavOpen(false);
  };

  useEffect(() => {
    setMobileNavOpen(false);
    setMobileStudentCornerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const el = event.target;
      if (!(el instanceof Node)) return;
      if (headerShellRef.current && !headerShellRef.current.contains(el)) {
        setMobileNavOpen(false);
      }
      if (studentMenuRef.current && !studentMenuRef.current.contains(el)) {
        setStudentMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(el)) {
        setAdminMenuOpen(false);
      }
      if (mobileAccountMenuRef.current && !mobileAccountMenuRef.current.contains(el)) {
        setMobileAccountMenuOpen(false);
      }
      if (desktopAccountMenuRef.current && !desktopAccountMenuRef.current.contains(el)) {
        setDesktopAccountMenuOpen(false);
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

  const renderAccountMenu = (isMobile = false) => {
    if (loading) {
      return <span className="text-sm text-theme-secondary">Loading...</span>;
    }

    const accountMenuOpen = isMobile ? mobileAccountMenuOpen : desktopAccountMenuOpen;
    const setAccountMenuOpen = isMobile ? setMobileAccountMenuOpen : setDesktopAccountMenuOpen;
    const accountMenuRef = isMobile ? mobileAccountMenuRef : desktopAccountMenuRef;

    return (
      <div className="relative" ref={accountMenuRef}>
        {!user ? (
          <button
            type="button"
            onClick={() => setAccountMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-theme px-3 py-2 text-sm font-semibold text-theme-primary bg-theme-card hover:bg-theme-hero transition sm:gap-2 sm:px-5 sm:py-3 sm:text-base"
          >
            Login
            <FaChevronDown className={`h-3 w-3 transition ${accountMenuOpen ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAccountMenuOpen((prev) => !prev)}
            className={`inline-flex min-h-[2.5rem] sm:min-h-[2.75rem] items-center gap-2 sm:gap-3 rounded-full border-2 pl-1.5 pr-2.5 py-1 sm:pl-2 sm:pr-4 sm:py-1.5 text-left text-theme-primary transition-[background-color,border-color] duration-200 ${
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
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full border-2 border-theme object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border-2 border-theme bg-theme-hero">
                <span className="text-xs font-semibold text-theme-primary sm:text-sm">{headerInitial}</span>
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

  const mobileNavLinkClass =
    "flex w-full items-center gap-3 px-4 py-3.5 text-base font-semibold text-theme-primary border-b border-theme hover:bg-theme-hero transition-colors";

  return (
    <div ref={headerShellRef} className="sticky top-0 z-50 mb-2">
      <header className="flex w-full items-stretch overflow-visible border-b border-theme bg-theme-card/95 shadow-md backdrop-blur-xl">
        <div className="flex shrink-0 items-center pl-3 pr-2 py-2 sm:pl-5 sm:pr-2 sm:py-2.5">
          <Link
            to="/"
            className="flex h-11 w-[3.85rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-theme bg-white px-2.5 py-1.5 shadow-md transition hover:bg-white/95 hover:shadow-md sm:h-14 sm:w-[5rem] sm:rounded-full sm:px-2.5 sm:py-1.5"
            title="RVCE Placement — Home"
          >
            <img src={logo} alt="" className="h-full w-full max-h-full object-contain object-center" />
          </Link>
        </div>

        <div className="flex min-h-[3.25rem] min-w-0 flex-1 flex-col justify-center border-l border-theme py-2 pl-2 pr-2 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-2">
          {/* Mobile: compact actions + menu */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 md:hidden">
            {user && (
              <div className="flex shrink-0 items-center [&_button]:p-2 [&_svg]:h-[1.05rem] [&_svg]:w-[1.05rem]">
                <NotificationBell />
              </div>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="shrink-0 rounded-full border border-theme bg-theme-card p-2 text-theme-primary hover:bg-theme-card-hover transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <FaSun className="h-[1.05rem] w-[1.05rem]" /> : <FaMoon className="h-[1.05rem] w-[1.05rem]" />}
            </button>
            <div className="shrink-0">{renderAccountMenu(true)}</div>
            <button
              type="button"
              onClick={() =>
                setMobileNavOpen((open) => {
                  const next = !open;
                  if (next) setMobileStudentCornerOpen(false);
                  return next;
                })
              }
              className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-full border border-theme bg-theme-card text-theme-primary hover:bg-theme-card-hover transition-colors active:scale-[0.98] touch-manipulation"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              {mobileNavOpen ? <FaTimes className="h-[1.2rem] w-[1.2rem]" /> : <FaBars className="h-[1.2rem] w-[1.2rem]" />}
            </button>
          </div>

          {/* Desktop navigation (md+) */}
          <nav
            className="hidden min-h-0 w-full min-w-0 flex-wrap items-center justify-end gap-2 overflow-visible md:flex md:gap-2 lg:gap-3"
            aria-label="Main"
          >
            {primaryLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition lg:px-5 lg:py-3 lg:text-base ${
                  location.pathname === item.path
                    ? "bg-theme-accent text-white"
                    : "text-theme-secondary hover:bg-theme-hero"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="relative shrink-0" ref={studentMenuRef}>
              <button
                type="button"
                onClick={() => setStudentMenuOpen((prev) => !prev)}
                aria-label="Student Corner"
                className={`inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color] duration-200 lg:min-h-[3rem] lg:px-5 lg:py-2.5 lg:text-base ${
                  isStudentCornerActive
                    ? "border-theme-accent bg-theme-accent text-white"
                    : studentMenuOpen
                      ? "border-theme-accent bg-theme-accent/12 text-theme-primary"
                      : "box-border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero hover:border-theme-accent/55"
                }`}
              >
                <FaGraduationCap className={`h-4 w-4 shrink-0 ${isStudentCornerActive ? "text-white" : "opacity-90"}`} />
                <span>Student Corner</span>
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

            {isAdmin && (
              <div className="relative shrink-0" ref={adminMenuRef}>
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen((prev) => !prev)}
                  aria-label="Admin"
                  className={`inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color] duration-200 lg:min-h-[3rem] lg:px-5 lg:py-2.5 lg:text-base ${
                    location.pathname.startsWith("/admin")
                      ? "border-theme-accent bg-theme-accent text-white"
                      : adminMenuOpen
                        ? "border-theme-accent bg-theme-accent/12 text-theme-primary"
                        : "box-border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero hover:border-theme-accent/55"
                  }`}
                >
                  <FaUserShield className={`h-4 w-4 shrink-0 ${location.pathname.startsWith("/admin") ? "text-white" : ""}`} />
                  <span>Admin</span>
                  {hasPendingItems && (
                    <FaExclamationCircle className="h-3.5 w-3.5 text-red-400 animate-pulse" title="Pending items" />
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

            <button
              type="button"
              onClick={toggleTheme}
              className="shrink-0 rounded-full border border-theme bg-theme-card p-2.5 text-theme-primary hover:bg-theme-card-hover transition-colors lg:p-3"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
            </button>

            {user && (
              <div className="shrink-0 flex items-center">
                <NotificationBell />
              </div>
            )}

            <div className="shrink-0">{renderAccountMenu(false)}</div>
          </nav>
        </div>
      </header>

      {mobileNavOpen && (
        <nav
          className="absolute left-0 right-0 top-full z-[60] max-h-[min(75vh,calc(100dvh-4.5rem))] overflow-y-auto overscroll-contain border-b border-theme bg-theme-card shadow-lg md:hidden"
          aria-label="Mobile menu"
        >
          {primaryLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileNavOpen(false)}
              className={`${mobileNavLinkClass} ${
                location.pathname === item.path ? "bg-theme-accent/15 text-theme-accent border-theme-accent/20" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setMobileStudentCornerOpen((prev) => !prev)}
            aria-expanded={mobileStudentCornerOpen}
            className={`flex w-full items-center justify-between gap-3 border-b border-theme px-4 py-3.5 text-left text-base font-semibold transition-colors ${
              isStudentCornerActive || mobileStudentCornerOpen
                ? "bg-theme-accent/10 text-theme-primary"
                : "text-theme-primary hover:bg-theme-hero"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FaGraduationCap className="h-4 w-4 shrink-0 opacity-80" />
              Student Corner
            </span>
            <FaChevronDown
              className={`h-3 w-3 shrink-0 transition ${mobileStudentCornerOpen ? "rotate-180" : ""}`}
            />
          </button>
          {mobileStudentCornerOpen && (
            <div className="border-b border-theme bg-theme-nav/30">
              {studentCornerLinks.map((item) => {
                const Icon = item.icon;
                const active = isPathActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      setMobileNavOpen(false);
                      setMobileStudentCornerOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-6 py-3 text-[15px] font-medium transition-colors ${
                      active ? "text-theme-accent bg-theme-accent/10" : "text-theme-secondary hover:text-theme-primary hover:bg-theme-hero"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {isAdmin && (
            <>
              <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-theme-secondary">Admin</div>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileNavOpen(false)}
                className={`${mobileNavLinkClass} ${location.pathname.startsWith("/admin") ? "bg-theme-accent/15 text-theme-accent" : ""}`}
              >
                <FaTachometerAlt className="h-4 w-4 shrink-0 opacity-80" />
                Dashboard
              </Link>
            </>
          )}
        </nav>
      )}
    </div>
  );
};

export default Header;