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
  FaBuilding,
  FaCalendarAlt,
  FaMapMarkedAlt,
  FaRoute,
} from "react-icons/fa";
import { adminAPI } from "../utils/api";
import { BASE_URL, RESUME_BUILDER_ENABLED } from "../utils/constants";
import NotificationBell from "./NotificationBell";
import NotificationSubscribeButton from "./NotificationSubscribeButton";
import logo from "../assets/logo2.webp";
import { useProductTour } from "../context/ProductTourContext";
import { TOUR_PREPARE_EVENT } from "../utils/productTourEvents";

const primaryLinks = [
  { label: "Home", path: "/" },
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

const adminCornerLinks = [
  { label: "Admin Dashboard", path: "/admin/dashboard", icon: FaTachometerAlt },
  { label: "Stats of the platform", path: "/admin/dashboard?tab=stats", icon: FaChartBar, tab: "stats" },
  { label: "Upload an event/Announcement", path: "/admin/dashboard?tab=events", icon: FaCalendarAlt, tab: "events" },
  { label: "Approve/Reject a company", path: "/admin/dashboard?tab=companies", icon: FaBuilding, tab: "companies" },
  { label: "Student Placement Stats", path: "/admin/dashboard?tab=student-placement-stats", icon: FaGraduationCap, tab: "student-placement-stats" },
  { label: "Miscellaneous Features", path: "/admin/dashboard?tab=miscellaneous", icon: FaBriefcase, tab: "miscellaneous" },
];

const studentCornerLinksBase = [
  { label: "Company Stats", path: "/companystats", icon: FaChartBar },
  { label: "AI Interviews", path: "/interviews", icon: FaComments },
  { label: "Interview slots", path: "/interview-slots", icon: FaCalendarAlt },
  { label: "PrepPath", path: "/prep-path", icon: FaMapMarkedAlt },
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
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    if (parts[0]?.length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts[0]) {
      return parts[0].charAt(0).toUpperCase();
    }
  }
  const e = user?.email;
  if (e && /[a-zA-Z]/.test(e)) {
    const local = (e.split("@")[0] || "").replace(/[^a-zA-Z]/g, "");
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
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
  const [mobileAdminCornerOpen, setMobileAdminCornerOpen] = useState(false);
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
    if (path.startsWith("/admin/dashboard")) {
      const [pathname, query = ""] = path.split("?");
      if (location.pathname !== pathname) return false;
      const tab = new URLSearchParams(query).get("tab");
      const currentTab = new URLSearchParams(location.search).get("tab");
      return tab === currentTab;
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
    ? studentCornerLinksBase.filter(
        (l) => l.path !== "/interviews" && l.path !== "/interview-slots"
      )
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
    setMobileAdminCornerOpen(false);
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
    const handlePointerDown = (event) => {
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

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
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

  /** Shared chip — fixed height + rounded-xl so short labels (Home) match Feedback / Video tour */
  const headerChipBase =
    "inline-flex box-border h-10 min-h-10 max-h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border text-xs font-semibold leading-none transition-colors";
  /** Slightly larger for main nav: Home, Events, Contact, Student Corner */
  const headerNavChipBase =
    "inline-flex box-border h-11 min-h-11 max-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold leading-none transition-colors";
  const headerChipIdle =
    "border-theme bg-theme-card text-theme-primary hover:bg-theme-hero";
  const headerChipActive =
    "border-theme-accent bg-theme-accent text-white";
  const headerChipOpen =
    "border-theme-accent bg-theme-accent/12 text-theme-primary";
  const headerIconChip =
    "inline-flex box-border h-10 w-10 min-h-10 max-h-10 shrink-0 items-center justify-center rounded-xl border border-theme bg-theme-card text-theme-primary transition-colors hover:bg-theme-hero";
  const headerChipPad = "px-3.5";

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
            className={`${headerNavChipBase} ${headerChipIdle}`}
          >
            Login
            <FaChevronDown className={`h-3 w-3 transition ${accountMenuOpen ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setAccountMenuOpen((prev) => !prev)}
            className={
              isMobile
                ? `${headerIconChip} ${
                    accountMenuOpen ? "border-theme-accent bg-theme-accent/12" : ""
                  }`
                : `${headerNavChipBase} ${
                    accountMenuOpen ? headerChipOpen : headerChipIdle
                  }`
            }
            title={headerDisplayName}
            aria-label={`Account menu for ${headerDisplayName}`}
            aria-expanded={accountMenuOpen}
          >
            {user.picture && !avatarFailed ? (
              <img
                src={user.picture}
                alt=""
                referrerPolicy="no-referrer"
                className={`shrink-0 rounded-full object-cover ${isMobile ? "h-6 w-6" : "h-6 w-6"}`}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span
                className={`flex shrink-0 items-center justify-center rounded-full bg-theme-hero text-[11px] font-bold leading-none tracking-tight text-theme-primary ${
                  isMobile ? "h-6 w-6" : "h-6 w-6"
                }`}
              >
                {headerInitial}
              </span>
            )}
            {!isMobile && (
              <FaChevronDown
                className={`h-3 w-3 shrink-0 transition ${accountMenuOpen ? "rotate-180" : ""}`}
              />
            )}
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
    `${headerChipBase} ${headerChipPad} ${headerChipIdle} disabled:opacity-50`;

  const toggleMobileNav = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMobileAccountMenuOpen(false);
    setMobileNavOpen((open) => {
      const next = !open;
      if (next) {
        setMobileStudentCornerOpen(false);
        setMobileSpcCornerOpen(false);
        setMobileAdminCornerOpen(false);
      }
      return next;
    });
  };

  return (
    <div ref={headerShellRef} className="relative sticky top-0 z-50 mb-2">
      <header className="flex w-full min-w-0 items-center overflow-visible border-b border-theme bg-theme-card/95 shadow-md backdrop-blur-xl">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 pl-2 pr-1.5 py-2 sm:gap-2.5 sm:pl-5 sm:pr-3 sm:py-2.5">
          <Link
            to="/"
            className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-theme bg-white px-1.5 py-1 shadow-md transition hover:bg-white/95 hover:shadow-md sm:h-12 sm:w-[4.5rem] sm:px-2"
            title="RVCE Placement — Home"
          >
            <img src={logo} alt="" className="h-full w-full max-h-full object-contain object-center" />
          </Link>
          <Link
            to="/feedback"
            className={`${headerChipBase} ${
              isPathActive("/feedback") ? headerChipActive : headerChipIdle
            } w-10 px-0 sm:w-auto sm:px-3.5`}
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
              className={`${videoTourButtonBaseClass} max-md:!hidden`}
              title="Start video tour"
              aria-label="Start video tour"
            >
              <FaRoute className="h-3.5 w-3.5 shrink-0" />
              <span>{isRunning ? "Tour…" : "Video tour"}</span>
            </button>
          )}
        </div>

        <div
          className={`flex min-w-0 flex-1 items-center justify-end border-l border-theme py-2 pl-2 pr-2 ${
            condensedHeader ? "sm:gap-1.5 sm:px-3 md:px-4" : "sm:gap-2 sm:px-4 md:px-5"
          }`}
        >
          {/* Mobile: compact actions + menu */}
          <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 md:hidden">
            {user && <NotificationBell />}
            <button
              type="button"
              data-tour="header-theme"
              onClick={toggleTheme}
              className={headerIconChip}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <FaSun className="h-3.5 w-3.5" /> : <FaMoon className="h-3.5 w-3.5" />}
            </button>
            <div className="relative z-0 shrink-0">{renderAccountMenu(true)}</div>
            <button
              type="button"
              data-tour="header-mobile-menu"
              onClick={toggleMobileNav}
              className={`${headerIconChip} relative z-[70] shrink-0 touch-manipulation`}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              {mobileNavOpen ? <FaTimes className="h-3.5 w-3.5" /> : <FaBars className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Desktop navigation (md+) */}
          <nav
            className="hidden min-h-0 w-full min-w-0 flex-nowrap items-center justify-end gap-2 overflow-visible md:flex"
            aria-label="Main"
          >
            {primaryLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${headerNavChipBase} ${
                  location.pathname === item.path ? headerChipActive : headerChipIdle
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
                className={`${headerNavChipBase} ${
                  isStudentCornerActive
                    ? headerChipActive
                    : studentMenuOpen
                      ? headerChipOpen
                      : headerChipIdle
                }`}
              >
                <FaGraduationCap className={`h-4 w-4 shrink-0 ${isStudentCornerActive ? "text-white" : ""}`} />
                <span>
                  Student
                  <span className="hidden lg:inline"> Corner</span>
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
                  className={`${headerNavChipBase} ${
                    isSpcCornerActive
                      ? headerChipActive
                      : spcMenuOpen
                        ? headerChipOpen
                        : headerChipIdle
                  }`}
                >
                  <FaBriefcase className={`h-4 w-4 shrink-0 ${isSpcCornerActive ? "text-white" : ""}`} />
                  <span>
                    SPC
                    <span className="hidden lg:inline"> Corner</span>
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
                  className={`${headerChipBase} ${headerChipPad} ${
                    location.pathname.startsWith("/admin")
                      ? headerChipActive
                      : adminMenuOpen
                        ? headerChipOpen
                        : headerChipIdle
                  }`}
                >
                  <FaUserShield className={`h-3.5 w-3.5 shrink-0 ${location.pathname.startsWith("/admin") ? "text-white" : ""}`} />
                  <span>Admin</span>
                  {hasPendingItems && (
                    <FaExclamationCircle className="h-3.5 w-3.5 text-red-400 animate-pulse" title="Pending items" />
                  )}
                  <FaChevronDown
                    className={`h-3 w-3 transition ${adminMenuOpen ? "rotate-180" : ""} ${location.pathname.startsWith("/admin") ? "text-white/90" : ""}`}
                  />
                </button>

                {adminMenuOpen && (
                  <div className="absolute right-0 top-full z-[100] mt-1 w-64 overflow-hidden rounded-md border border-theme bg-theme-card shadow-lg py-1">
                    {adminCornerLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setAdminMenuOpen(false)}
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

            <button
              type="button"
              data-tour="header-theme"
              onClick={toggleTheme}
              className={headerIconChip}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <FaSun className="h-3.5 w-3.5" />
              ) : (
                <FaMoon className="h-3.5 w-3.5" />
              )}
            </button>

            {user && (
              <div className="shrink-0 flex items-center gap-1.5" data-tour="header-notifications">
                <NotificationSubscribeButton />
                <NotificationBell />
              </div>
            )}

            <div className="shrink-0">{renderAccountMenu(false)}</div>
          </nav>
        </div>
      </header>

      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/40 md:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMobileNavOpen(false)}
          />
          <nav
            id="mobile-nav-drawer"
            className="absolute left-0 right-0 top-full z-[60] max-h-[min(75vh,calc(100dvh-4.5rem))] overflow-y-auto overscroll-contain border-b border-theme bg-theme-card shadow-lg md:hidden"
            aria-label="Mobile menu"
          >
            {user && <NotificationSubscribeButton variant="menu" />}
            {user && canStartTour && (
              <button
                type="button"
                disabled={isRunning}
                onClick={() => {
                  setMobileNavOpen(false);
                  startTour();
                }}
                className="flex w-full items-center gap-3 border-b border-theme px-4 py-3.5 text-left text-base font-semibold text-theme-primary transition-colors hover:bg-theme-hero disabled:opacity-50"
              >
                <FaRoute className="h-4 w-4 shrink-0 opacity-80" />
                {isRunning ? "Tour in progress…" : "Video tour"}
              </button>
            )}
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
              <button
                type="button"
                onClick={() => setMobileAdminCornerOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-[15px] font-semibold transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "text-theme-accent bg-theme-accent/10"
                    : "text-theme-primary hover:bg-theme-hero"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FaUserShield className="h-4 w-4 shrink-0 opacity-80" />
                  Admin
                </span>
                <FaChevronDown
                  className={`h-3 w-3 shrink-0 transition ${mobileAdminCornerOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileAdminCornerOpen && (
                <div className="border-b border-theme bg-theme-nav/30">
                  {adminCornerLinks.map((item) => {
                    const Icon = item.icon;
                    const active = isPathActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setMobileNavOpen(false);
                          setMobileAdminCornerOpen(false);
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
        </nav>
        </>
      )}
    </div>
  );
};

export default Header;