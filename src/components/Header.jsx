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
  FaBookOpen,
  FaFileAlt,
  FaUserShield,
  FaTachometerAlt,
  FaExclamationCircle,
  FaBars,
  FaTimes,
  FaBriefcase,
  FaClipboardList,
} from "react-icons/fa";
import { adminAPI } from "../utils/api";
import { BASE_URL, RESUME_BUILDER_ENABLED } from "../utils/constants";
import NotificationBell from "./NotificationBell";
import logo from "../assets/logo2.webp";
import { useProductTour } from "../context/ProductTourContext";
import { TOUR_PREPARE_EVENT } from "../utils/productTourEvents";
import { FaRoute } from "react-icons/fa";

const primaryLinks = [
  { label: "Home", path: "/" },
  { label: "General Stats", path: "/general-stats" },
  { label: "Events", path: "/events" },
  { label: "Contact", path: "/contact" },
];

const spcCornerLinks = [
  { label: "SPC Dashboard", path: "/spc-dashboard", icon: FaTachometerAlt },
  { label: "Add Placement Data", path: "/spc/form", icon: FaFileAlt },
  { label: "Update conversion details", path: "/spc/conversion-details", icon: FaClipboardList },
  {label: "view details added", path: "spc-dashboard?view=submissions", icon: FaFileAlt },
  { label: "Approve Students Submissions", path: "/spc-dashboard?view=student-contributions", icon: FaExclamationCircle },
];

const studentCornerLinksBase = [
  { label: "Company Stats", path: "/companystats", icon: FaChartBar },
  { label: "AI Interviews", path: "/interviews", icon: FaComments },
  { label: "Resources", path: "/resources", icon: FaBook },
  ...(RESUME_BUILDER_ENABLED ? [{ label: "Resume Builder", path: "/resume-builder", icon: FaFileAlt }] : []),
  { label: "Leaderboard", path: "/leaderboard", icon: FaTrophy },
  { label: "User Manual", path: "/user-manual", icon: FaBookOpen },
];

/** Shown in header chip; admins usually have no studentData — use username or email local-part. */
function accountDisplayName(user, studentData) {
  const fromStudent =
    studentData?.student?.name?.trim() || studentData?.name?.trim();
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
const STUDENT_PROFILE_AVAILABILITY_KEY_PREFIX = "studentProfileAvailability_";

const Header = () => {
  const placementFormEntryUrl = `${BASE_URL}/api/placement/form`;
  const { user, isAdmin, studentData, login, signup, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [mobileStudentCornerOpen, setMobileStudentCornerOpen] = useState(false);
  const [spcMenuOpen, setSpcMenuOpen] = useState(false);
  const [mobileSpcCornerOpen, setMobileSpcCornerOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const [desktopAccountMenuOpen, setDesktopAccountMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [hasPendingItems, setHasPendingItems] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const studentMenuRef = useRef(null);
  const spcMenuRef = useRef(null);
  const adminMenuRef = useRef(null);
  const mobileAccountMenuRef = useRef(null);
  const desktopAccountMenuRef = useRef(null);
  const headerShellRef = useRef(null);
  const { startTour, isRunning, canStartTour } = useProductTour();

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.userId, user?.picture, user?.email]);

  useEffect(() => {
    const onPrepare = (event) => {
      if (event.detail?.stepId !== "student-corner") return;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (isMobile) {
        setMobileNavOpen(true);
        setMobileStudentCornerOpen(true);
      } else {
        setStudentMenuOpen(true);
      }
    };
    window.addEventListener(TOUR_PREPARE_EVENT, onPrepare);
    return () => window.removeEventListener(TOUR_PREPARE_EVENT, onPrepare);
  }, []);

  const isPathActive = (path) => {
    if (path === "/companystats") {
      return (
        location.pathname === path ||
        location.pathname === "/category" ||
        location.pathname.startsWith("/companies")
      );
    }
    return location.pathname === path;
  };

  const headerDisplayName = user ? accountDisplayName(user, studentData) : "";
  const headerInitial = user ? accountInitialLetter(user, headerDisplayName) : "U";
  const profileAvailabilityKey =
    user && (user.userId || user._id)
      ? `${STUDENT_PROFILE_AVAILABILITY_KEY_PREFIX}${user.userId || user._id}`
      : null;
  const shouldHideViewProfile =
    profileAvailabilityKey &&
    localStorage.getItem(profileAvailabilityKey) === "no_profile";
  const shouldHideAiInterviews = shouldHideViewProfile;
  const studentCornerLinks = shouldHideAiInterviews
    ? studentCornerLinksBase.filter((l) => l.path !== "/interviews")
    : studentCornerLinksBase;

  const isStudentCornerActive = studentCornerLinks.some((l) => isPathActive(l.path));
  const isSpcUser = user?.role === "spc";
  const isSpcCornerActive =
    isSpcUser &&
    (location.pathname === "/spc-dashboard" || location.pathname.startsWith("/spc/"));
  /** Tighter desktop nav only when extra role controls crowd the bar (SPC / admin). */
  const condensedHeader = Boolean(user && (isAdmin || isSpcUser));

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMobileAccountMenuOpen(false);
    setDesktopAccountMenuOpen(false);
    setMobileNavOpen(false);
  };

  const handleOpenPlacementForm = () => {
    window.open(placementFormEntryUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    setMobileNavOpen(false);
    setMobileStudentCornerOpen(false);
    setMobileSpcCornerOpen(false);
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
      if (spcMenuRef.current && !spcMenuRef.current.contains(el)) {
        setSpcMenuOpen(false);
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
            className={`inline-flex items-center rounded-full border-2 text-left text-sm font-semibold text-theme-primary transition-[background-color,border-color] duration-200 ${
              isMobile
                ? "min-h-9 gap-1 py-1 pl-1 pr-1.5"
                : condensedHeader
                  ? "min-h-[2.5rem] gap-1.5 py-2 pl-1.5 pr-2.5 md:min-h-[2.75rem] md:pl-2 md:pr-3"
                  : "min-h-[2.5rem] gap-2 py-1 pl-1.5 pr-2.5 sm:min-h-[2.75rem] sm:gap-3 sm:py-1.5 sm:pl-2 sm:pr-4"
            } ${
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
                className={`shrink-0 rounded-full border-2 border-theme object-cover ${
                  isMobile ? "h-8 w-8" : condensedHeader ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10"
                }`}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div
                className={`flex shrink-0 items-center justify-center rounded-full border-2 border-theme bg-theme-hero ${
                  isMobile ? "h-8 w-8" : condensedHeader ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10"
                }`}
              >
                <span
                  className={`font-semibold text-theme-primary ${
                    condensedHeader ? "text-xs" : "text-xs sm:text-sm"
                  }`}
                >
                  {headerInitial}
                </span>
              </div>
            )}
            <span
              className={`hidden min-w-0 truncate text-sm font-semibold text-theme-primary ${
                isMobile
                  ? condensedHeader
                    ? "max-w-[9rem] sm:inline sm:max-w-[11rem]"
                    : "max-w-[10rem] sm:inline sm:max-w-[13rem]"
                  : condensedHeader
                    ? "md:inline max-w-[7rem] lg:max-w-[10rem] xl:max-w-[13rem]"
                    : "md:inline max-w-[10rem] md:max-w-[13rem]"
              }`}
            >
              {headerDisplayName}
            </span>
            <FaChevronDown
              className={`h-3 w-3 shrink-0 text-theme-secondary transition ${accountMenuOpen ? "rotate-180" : ""} ${
                isMobile ? "hidden min-[400px]:inline" : ""
              }`}
            />
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
                  onClick={() => { setAccountMenuOpen(false); login(false, { intent: "spc" }); }}
                  className={dropdownItemClass}
                >
                  Login as SPC
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
                {!shouldHideViewProfile ? (
                  <button
                    onClick={() => { setAccountMenuOpen(false); navigate("/profile"); }}
                    className={dropdownItemClass}
                  >
                    View Profile
                  </button>
                ) : null}
                <button
                  onClick={() => { setAccountMenuOpen(false); navigate("/my-submissions"); }}
                  className={dropdownItemClass}
                >
                  My Submissions
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

  const videoTourButtonBaseClass =
    "shrink-0 items-center justify-center rounded-full border border-theme bg-theme-card text-theme-primary transition-colors hover:bg-theme-hero disabled:opacity-50";

  return (
    <div ref={headerShellRef} className="sticky top-0 z-50 mb-2">
      <header className="flex w-full items-stretch overflow-visible border-b border-theme bg-theme-card/95 shadow-md backdrop-blur-xl">
        <div className="flex shrink-0 items-center gap-1 pl-2 pr-1 py-1.5 sm:gap-2.5 sm:pl-5 sm:pr-2 sm:py-2.5">
          <Link
            to="/"
            className="flex h-10 w-[3.35rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-theme bg-white px-2 py-1 shadow-md transition hover:bg-white/95 hover:shadow-md sm:h-14 sm:w-[5rem] sm:rounded-full sm:px-2.5 sm:py-1.5"
            title="RVCE Placement — Home"
          >
            <img src={logo} alt="" className="h-full w-full max-h-full object-contain object-center" />
          </Link>
          <Link
            to="/feedback"
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors sm:h-10 sm:w-auto sm:gap-1.5 sm:px-3.5 sm:text-xs ${
              isPathActive("/feedback")
                ? "border-theme-accent bg-theme-accent text-white"
                : "border-theme bg-theme-card text-theme-primary hover:bg-theme-hero"
            }`}
            title="Open feedback form"
            aria-label="Open feedback form"
          >
            <FaComments className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Feedback</span>
          </Link>
          {user && canStartTour && (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => startTour()}
              className={`${videoTourButtonBaseClass} hidden h-9 gap-1.5 px-3.5 text-xs font-semibold md:inline-flex sm:h-10`}
              title="Start video tour"
              aria-label="Start video tour"
            >
              <FaRoute className="h-3.5 w-3.5 shrink-0" />
              <span>{isRunning ? "Tour…" : "Video tour"}</span>
            </button>
          )}
        </div>

        <div
          className={`flex min-h-[3.25rem] min-w-0 flex-1 flex-col justify-center border-l border-theme py-2 pl-2 pr-2 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:justify-between sm:py-2 ${
            condensedHeader ? "sm:gap-2 sm:px-4 md:px-5" : "sm:gap-4 sm:px-6"
          }`}
        >
          {/* Mobile: compact actions + menu */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-0.5 sm:gap-1 md:hidden">
            {user && canStartTour && (
              <button
                type="button"
                disabled={isRunning}
                onClick={() => startTour()}
                className={`${videoTourButtonBaseClass} inline-flex h-9 w-9 p-0 md:hidden`}
                title={isRunning ? "Tour in progress" : "Start video tour"}
                aria-label={isRunning ? "Tour in progress" : "Start video tour"}
              >
                <FaRoute className="h-[1.05rem] w-[1.05rem]" />
              </button>
            )}
            {user && (
              <div
                className="flex shrink-0 items-center [&_button]:p-2 [&_svg]:h-[1.05rem] [&_svg]:w-[1.05rem]"
                data-tour="header-notifications"
              >
                <NotificationBell />
              </div>
            )}
            <button
              type="button"
              data-tour="header-theme"
              onClick={toggleTheme}
              className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-theme bg-theme-card text-theme-primary hover:bg-theme-card-hover transition-colors"
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
                  if (next) {
                    setMobileStudentCornerOpen(false);
                    setMobileSpcCornerOpen(false);
                  }
                  return next;
                })
              }
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-theme bg-theme-card text-theme-primary hover:bg-theme-card-hover transition-colors touch-manipulation sm:h-11 sm:w-11"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              {mobileNavOpen ? <FaTimes className="h-[1.15rem] w-[1.15rem]" /> : <FaBars className="h-[1.15rem] w-[1.15rem]" />}
            </button>
          </div>

          {/* Desktop navigation (md+) */}
          <nav
            className={`hidden min-h-0 w-full min-w-0 items-center justify-end overflow-visible py-0.5 md:flex ${
              condensedHeader
                ? "flex-nowrap gap-1.5 md:gap-2"
                : "flex-wrap gap-2 md:gap-2 lg:gap-3"
            }`}
            aria-label="Main"
          >
            {primaryLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`shrink-0 whitespace-nowrap rounded-full font-semibold transition ${
                  condensedHeader
                    ? "px-3 py-2 text-sm md:px-3.5 md:py-2.5"
                    : "px-4 py-2.5 text-sm lg:px-5 lg:py-3 lg:text-base"
                } ${
                  location.pathname === item.path
                    ? "bg-theme-accent text-white"
                    : "text-theme-secondary hover:bg-theme-hero"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="relative shrink-0" ref={studentMenuRef} data-tour="student-corner">
              <button
                type="button"
                onClick={() => setStudentMenuOpen((prev) => !prev)}
                aria-label="Student Corner"
                className={`inline-flex items-center whitespace-nowrap rounded-full border-2 text-sm font-semibold transition-[background-color,border-color,color] duration-200 ${
                  condensedHeader
                    ? "min-h-[2.5rem] gap-1.5 px-3 py-2 md:min-h-[2.75rem] md:px-3.5"
                    : "min-h-[2.75rem] gap-2 px-4 py-2 lg:min-h-[3rem] lg:px-5 lg:py-2.5 lg:text-base"
                } ${
                  isStudentCornerActive
                    ? "border-theme-accent bg-theme-accent text-white"
                    : studentMenuOpen
                      ? "border-theme-accent bg-theme-accent/12 text-theme-primary"
                      : "box-border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero hover:border-theme-accent/55"
                }`}
              >
                <FaGraduationCap className={`h-4 w-4 shrink-0 ${isStudentCornerActive ? "text-white" : "opacity-90"}`} />
                <span>
                  Student
                  {condensedHeader ? <span className="hidden lg:inline"> Corner</span> : <span> Corner</span>}
                </span>
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

            {isSpcUser && (
              <div className="relative shrink-0" ref={spcMenuRef}>
                <button
                  type="button"
                  onClick={() => setSpcMenuOpen((prev) => !prev)}
                  aria-label="SPC Corner"
                  className={`inline-flex items-center whitespace-nowrap rounded-full border-2 text-sm font-semibold transition-[background-color,border-color,color] duration-200 ${
                    condensedHeader
                      ? "min-h-[2.5rem] gap-1.5 px-3 py-2 md:min-h-[2.75rem] md:px-3.5"
                      : "min-h-[2.75rem] gap-2 px-4 py-2 lg:min-h-[3rem] lg:px-5 lg:py-2.5 lg:text-base"
                  } ${
                    isSpcCornerActive
                      ? "border-theme-accent bg-theme-accent text-white"
                      : spcMenuOpen
                        ? "border-theme-accent bg-theme-accent/12 text-theme-primary"
                        : "box-border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero hover:border-theme-accent/55"
                  }`}
                >
                  <FaBriefcase className={`h-4 w-4 shrink-0 ${isSpcCornerActive ? "text-white" : "opacity-90"}`} />
                  <span>
                    SPC
                    {condensedHeader ? <span className="hidden lg:inline"> Corner</span> : <span> Corner</span>}
                  </span>
                  <FaChevronDown
                    className={`h-3 w-3 transition ${spcMenuOpen ? "rotate-180" : ""} ${isSpcCornerActive ? "text-white/90" : ""}`}
                  />
                </button>

                {spcMenuOpen && (
                  <div className="absolute left-0 top-full z-[100] mt-1 w-56 overflow-hidden rounded-md border border-theme bg-theme-card shadow-lg py-1">
                    {spcCornerLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSpcMenuOpen(false)}
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
            )}

            {isAdmin && (
              <div className="relative shrink-0" ref={adminMenuRef}>
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen((prev) => !prev)}
                  aria-label="Admin"
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border-2 text-sm font-semibold transition-[background-color,border-color,color] duration-200 ${
                    condensedHeader
                      ? "min-h-[2.5rem] gap-1.5 px-3 py-2 md:min-h-[2.75rem] md:px-3.5"
                      : "min-h-[2.75rem] px-4 py-2 lg:min-h-[3rem] lg:px-5 lg:py-2.5 lg:text-base"
                  } ${
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
              data-tour="header-theme"
              onClick={toggleTheme}
              className={`shrink-0 rounded-full border border-theme bg-theme-card text-theme-primary hover:bg-theme-card-hover transition-colors ${
                condensedHeader ? "p-2 md:p-2.5" : "p-2.5 lg:p-3"
              }`}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <FaSun className={condensedHeader ? "h-[1.15rem] w-[1.15rem] md:h-5 md:w-5" : "h-5 w-5"} />
              ) : (
                <FaMoon className={condensedHeader ? "h-[1.15rem] w-[1.15rem] md:h-5 md:w-5" : "h-5 w-5"} />
              )}
            </button>

            {user && (
              <div className="shrink-0 flex items-center" data-tour="header-notifications">
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
          {/* <button
            type="button"
            onClick={() => {
              setMobileNavOpen(false);
              handleOpenPlacementForm();
            }}
            className={mobileNavLinkClass}
          >
            Fill the form
          </button> */}

          <button
            type="button"
            data-tour="student-corner"
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

          {isSpcUser && (
            <>
              <button
                type="button"
                onClick={() => setMobileSpcCornerOpen((prev) => !prev)}
                aria-expanded={mobileSpcCornerOpen}
                className={`flex w-full items-center justify-between gap-3 border-b border-theme px-4 py-3.5 text-left text-base font-semibold transition-colors ${
                  isSpcCornerActive || mobileSpcCornerOpen
                    ? "bg-theme-accent/10 text-theme-primary"
                    : "text-theme-primary hover:bg-theme-hero"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FaBriefcase className="h-4 w-4 shrink-0 opacity-80" />
                  SPC Corner
                </span>
                <FaChevronDown
                  className={`h-3 w-3 shrink-0 transition ${mobileSpcCornerOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileSpcCornerOpen && (
                <div className="border-b border-theme bg-theme-nav/30">
                  {spcCornerLinks.map((item) => {
                    const Icon = item.icon;
                    const active = isPathActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setMobileNavOpen(false);
                          setMobileSpcCornerOpen(false);
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
            </>
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