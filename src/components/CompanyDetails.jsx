import React, { useEffect, useRef, useState } from "react";
import { FaCheck, FaPaperPlane } from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { useInterviewLock } from "../utils/InterviewLockContext";
import { companyAPI } from "../utils/api";
import {
  companystatsTierListUrl,
  isPlacementTierParam,
  normalizeClusterParam,
  PLACEMENT_CLUSTER_CS,
  PLACEMENT_TIER_DREAM,
  PLACEMENT_TIER_INTERNSHIP_ONLY,
  PLACEMENT_TIER_OFF_CAMPUS,
  PLACEMENT_TIER_OPEN_DREAM,
  PLACEMENT_TIER_SUMMER_INTERNSHIP,
  PLACEMENT_CATEGORY_NO_VISIT_COPY,
  PLACEMENT_YEAR_DROPDOWN_NO_VISIT_COPY,
} from "../constants/placementTiers.js";
import {
  COLLEGE_ID_RVITM,
  collegeIdFromUser,
  normalizeCollegeId,
} from "../utils/collegeScope.js";
import CompanyLogo from "./CompanyLogo";
import BrandLogo from "./BrandLogo.jsx";

import AboutTab from "./CompanyTabs/AboutTab";
import GeneralTab from "./CompanyTabs/GeneralTab";
import OATab from "./CompanyTabs/OATab";
import CodingTab from "./CompanyTabs/CodingTab";
import InterviewTab from "./CompanyTabs/InterviewTab";
import MustDoTab from "./CompanyTabs/MustDoTab";
import RecruitmentProcessTab from "./CompanyTabs/RecruitmentProcessTab";
import OffCampusQuestionsTab from "./CompanyTabs/OffCampusQuestionsTab";
import AIInterviewTab from "./CompanyTabs/AIInterviewTab";
import AiInterviewExploreButton from "./AiInterviewExploreButton";
import InternshipTab from "./CompanyTabs/InternshipTab";
import StatsTab from "./CompanyTabs/StatsTab";
import { TOUR_PREPARE_EVENT } from "../utils/productTourEvents";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
  isPlacementDetailVisitYear,
} from "../constants/placementYears.js";
import { companyHasInternshipExperience } from "../utils/parseExperienceStoredEntry.js";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";

const PLACEMENT_YEAR_CHOICES = [...PLACEMENT_DETAIL_VISIT_YEARS];
const YEAR_TABS = ["general", "stats", "recruitment", "oa", "interview", "internship"];

function readPreferredPlacementYearFromLocation(location) {
  try {
    const params = new URLSearchParams(location.search || "");
    const q = Number(params.get("year"));
    if (isPlacementDetailVisitYear(q)) return q;
  } catch {
    // ignore
  }
  const s = location.state?.defaultPlacementYear;
  if (isPlacementDetailVisitYear(s)) return s;
  return null;
}

/**
 * Keep header/static identity while a placement-year switch loads.
 * Clears visit-scoped fields so Roles / date / OA / etc. cannot flash the previous year.
 * Frontend-only — does not write to the DB.
 * @param {Record<string, unknown>|null|undefined} prev
 */
function companyShellWhileYearSwitch(prev) {
  if (!prev || typeof prev !== "object") return null;
  return {
    _id: prev._id,
    name: prev.name,
    logo: prev.logo,
    business_model: prev.business_model,
    helpfulCount: prev.helpfulCount,
    focusTags: prev.focusTags,
    // Keep year maps so the year dropdown stays usable during reload
    placementYearsAvailable: prev.placementYearsAvailable,
    placementDreamTierVisitByYear: prev.placementDreamTierVisitByYear,
    placementSummerInternshipVisitByYear: prev.placementSummerInternshipVisitByYear,
    roles: [],
    date_of_visit: "",
    type: "",
    eligibility: "",
    minCgpa: null,
    offCampus: false,
    onlineQuestions: [],
    onlineQuestions_solution: [],
    interviewQuestions: [],
    interviewQuestions_solution: [],
    interview_questions: [],
    interviewProcess: [],
    internshipExperience: [],
    must_do_topics: [],
    Must_Do_Topics: [],
    mcqQuestions: [],
    recruitment_process: undefined,
    totalGotIn: 0,
    totalGotInByYear: prev.totalGotInByYear,
    placementBranchStatsByYear: undefined,
    placementDetailHeadlineType: undefined,
    placementDreamTierVisitMissingForYear: false,
    placementSummerInternshipVisitMissingForYear: false,
    placementInternshipOnlyVisitMissingForYear: false,
    placementCompanyVisitId: undefined,
  };
}

function readPlacementCompanyVisitIdFromLocation(location) {
  try {
    const params = new URLSearchParams(location.search || "");
    const raw = String(params.get("placementCompanyVisitId") || "").trim();
    return raw || null;
  } catch {
    return null;
  }
}

function readPlacementClusterFromLocation(location) {
  try {
    const params = new URLSearchParams(location.search || "");
    return normalizeClusterParam(params.get("placementCluster"));
  } catch {
    return null;
  }
}

function parseTierContext(raw) {
  if (
    raw === PLACEMENT_TIER_SUMMER_INTERNSHIP ||
    raw === PLACEMENT_TIER_DREAM ||
    raw === PLACEMENT_TIER_OPEN_DREAM ||
    raw === PLACEMENT_TIER_OFF_CAMPUS ||
    raw === PLACEMENT_TIER_INTERNSHIP_ONLY
  ) {
    return raw;
  }
  return undefined;
}

/**
 * Router state is cleared on refresh — persist tier when opening from CompanyStats cards so subtitles stay correct.
 */
function readPlacementListContext(location, companyId) {
  const fromState = parseTierContext(location?.state?.placementListContext);
  if (fromState) return fromState;
  try {
    const q = new URLSearchParams(location.search || "").get("placementContext");
    const fromQuery = parseTierContext(q);
    if (fromQuery) return fromQuery;
  } catch {
    // ignore
  }
  if (!companyId) return undefined;
  try {
    return parseTierContext(sessionStorage.getItem(`company_detail_placement_ctx:${companyId}`));
  } catch {
    return undefined;
  }
}

/** Client fallback when API cache lacked placementDetailHeadlineType — mirrors backend hybrid heuristic. */
function inferDreamHeadlineFallback(company) {
  const raw = typeof company?.type === "string" ? company.type.trim() : "";
  const norm = raw.replace(/\s+/g, "").toLowerCase();
  if (!norm.includes("ppo")) return null;
  if (norm.includes("fte")) {
    return norm.includes("internship") ? "Internship + FTE" : "FTE";
  }
  const roles = company?.roles;
  if (!Array.isArray(roles)) return null;
  for (const role of roles) {
    const ctc = role?.ctc;
    if (!ctc || typeof ctc !== "object") continue;
    for (const v of Object.values(ctc)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) return "FTE";
      if (typeof v === "string") {
        const s = v.trim();
        if (s !== "" && s !== "0") return "FTE";
      }
    }
  }
  return null;
}

/** Summer internship → raw visit type (e.g. PPO); Dream / Open dream → FTE-aware headline; otherwise friendly default. */
function resolveCompanyHeadlineSubtitle(company, placementListContext) {
  if (!company) return "";
  const raw =
    typeof company.type === "string" && company.type.trim()
      ? company.type.trim()
      : "";
  const apiHeadline =
    typeof company.placementDetailHeadlineType === "string"
      ? company.placementDetailHeadlineType.trim()
      : "";

  if (placementListContext === PLACEMENT_TIER_SUMMER_INTERNSHIP) {
    if (company?.placementSummerInternshipVisitMissingForYear === true) {
      return PLACEMENT_CATEGORY_NO_VISIT_COPY;
    }
    return raw || apiHeadline || "";
  }

  if (placementListContext === PLACEMENT_TIER_INTERNSHIP_ONLY) {
    if (company?.placementInternshipOnlyVisitMissingForYear === true) {
      return PLACEMENT_CATEGORY_NO_VISIT_COPY;
    }
    return raw || apiHeadline || "";
  }

  if (placementListContext === PLACEMENT_TIER_OFF_CAMPUS) {
    return raw || apiHeadline || "";
  }

  if (
    company?.placementDreamTierVisitMissingForYear === true &&
    (placementListContext === PLACEMENT_TIER_DREAM ||
      placementListContext === PLACEMENT_TIER_OPEN_DREAM)
  ) {
    return PLACEMENT_CATEGORY_NO_VISIT_COPY;
  }

  return apiHeadline || inferDreamHeadlineFallback(company) || raw || "";
}

function ChevronIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Dream/Open dream or Summer internship: selected year has no visit for that list context — tabs stay empty. */
function DreamTierVisitEmptyPanel() {
  return (
    <div
      className="rounded-xl border border-theme bg-theme-card px-6 py-14 text-center"
      role="status"
      data-tour="company-tab-visit-placeholder"
    >
      <p className="text-theme-secondary">No visit yet</p>
    </div>
  );
}

/**
 * Sum placement got-in for RVITM rows only (`collegeId: "rvitm"`).
 * Prefer branch stats when present; otherwise fall back to visit `totalGotIn`
 * (already college-scoped for RVITM API responses).
 * @param {Record<string, unknown>|null|undefined} company
 * @returns {number}
 */
function rvitmPlacementGotInTotal(company) {
  const rows = company?.placementGotInBranchStats;
  if (Array.isArray(rows) && rows.length > 0) {
    const hasCollegeTag = rows.some(
      (row) => row && typeof row === "object" && "collegeId" in row
    );
    const scoped = hasCollegeTag
      ? rows.filter(
          (row) =>
            row &&
            typeof row === "object" &&
            normalizeCollegeId(/** @type {{ collegeId?: unknown }} */ (row).collegeId) ===
              COLLEGE_ID_RVITM
        )
      : rows;
    return scoped.reduce((sum, row) => {
      const n = Number(/** @type {{ gotIn?: unknown }} */ (row)?.gotIn);
      return sum + (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
    }, 0);
  }
  const n = Number(company?.totalGotIn);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function CompanyDetails() {
  const COMPANY_DETAILS_RETURN_PATH_KEY = "companyDetailsReturnPath";
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const collegeId = collegeIdFromUser(user);
  const isRvitmViewer = collegeId === COLLEGE_ID_RVITM;
  const canManageRecruitmentProcess =
    isAdmin || (user && String(user.role || "").toLowerCase() === "spc");
  const profileAvailabilityKey =
    user && (user.userId || user._id)
      ? `studentProfileAvailability_${user.userId || user._id}`
      : null;
  const shouldHideAiInterviews =
    profileAvailabilityKey &&
    localStorage.getItem(profileAvailabilityKey) === "no_profile";
  const { setIsInterviewLocked: setGlobalInterviewLocked } = useInterviewLock();
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInterviewLocked, setIsInterviewLocked] = useState(false);
  const [placementYear, setPlacementYear] = useState(DEFAULT_PLACEMENT_DETAIL_YEAR);
  const [placementYearLoading, setPlacementYearLoading] = useState(false);
  const [hasRequestedDetail, setHasRequestedDetail] = useState(false);
  const [detailRequestLoading, setDetailRequestLoading] = useState(false);
  const [detailRequestSubmitting, setDetailRequestSubmitting] = useState(false);
  const [detailRequestFeedback, setDetailRequestFeedback] = useState("");
  const [openDropdownTab, setOpenDropdownTab] = useState(null);
  const detailFetchIdRef = useRef(null);
  /** Increments per fetch so older responses cannot overwrite newer ones (race when year switches quickly). */
  const companyDetailFetchGenRef = useRef(0);
  /** Avoid depending on `placementYear` in the fetch effect (would re-fetch after setState). */
  const placementYearRef = useRef(placementYear);
  placementYearRef.current = placementYear;
  const interviewExitHandlerRef = useRef(null);
  const dropdownRef = useRef(null);
  const tabContentRef = useRef(null);
  const previousActiveTabRef = useRef(activeTab);
  const EXIT_WARNING_MESSAGE =
    "Progress will be lost and interview cannot be attended again. Are you sure you want to exit?";

  const placementContextForApi = readPlacementListContext(location, id);
  const placementCompanyVisitIdForApi = readPlacementCompanyVisitIdFromLocation(location);
  const placementClusterForApi = readPlacementClusterFromLocation(location);
  const isCsClusterForInterview = placementClusterForApi === PLACEMENT_CLUSTER_CS;

  const interviewFocusMode = isInterviewLocked && activeTab === "aiinterview";

  const getSessionValue = (baseKey) => {
    const userScopedKey =
      user && user.userId ? `${baseKey}_${user.userId}` : baseKey;
    const userScopedValue = sessionStorage.getItem(userScopedKey);
    if (userScopedValue !== null) return userScopedValue;
    return sessionStorage.getItem(baseKey);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownTab(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setGlobalInterviewLocked(isInterviewLocked);
    return () => {
      setGlobalInterviewLocked(false);
    };
  }, [isInterviewLocked, setGlobalInterviewLocked]);

  useEffect(() => {
    const previousTab = previousActiveTabRef.current;
    previousActiveTabRef.current = activeTab;

    if (activeTab !== "aiinterview" || previousTab === "aiinterview" || interviewFocusMode) {
      return;
    }

    const scrollToInterviewTab = () => {
      tabContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const frameId = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToInterviewTab);
    });
    return () => cancelAnimationFrame(frameId);
  }, [activeTab, interviewFocusMode]);

  useEffect(() => {
    if (!id) return;
    if (user?.betaAccess === false) {
      setLoading(false);
      setPlacementYearLoading(false);
      return;
    }

    const preferredYear = readPreferredPlacementYearFromLocation(location);
    const switchedCompany = detailFetchIdRef.current !== id;

    let yearForRequest;
    if (switchedCompany) {
      detailFetchIdRef.current = id;
      yearForRequest = preferredYear ?? DEFAULT_PLACEMENT_DETAIL_YEAR;
      setPlacementYear(yearForRequest);
      setPlacementYearLoading(false);
      setLoading(true);
      setLoadError(null);
      setCompany(null);
    } else {
      yearForRequest = preferredYear ?? placementYearRef.current;
      const yearChanged =
        Number(yearForRequest) !== Number(placementYearRef.current);
      // Sync selected year immediately and drop previous year's visit fields so
      // Roles / date of visit cannot show mixed 2026+2027 data while loading.
      if (yearChanged) {
        setPlacementYear(yearForRequest);
        setCompany((prev) => companyShellWhileYearSwitch(prev));
      }
      setPlacementYearLoading(true);
      setLoadError(null);
    }

    const fetchGen = ++companyDetailFetchGenRef.current;

    companyAPI
      .getCompany(id, {
        year: yearForRequest,
        ...(placementContextForApi ? { placementContext: placementContextForApi } : {}),
        ...(placementCompanyVisitIdForApi
          ? { placementCompanyVisitId: placementCompanyVisitIdForApi }
          : {}),
        ...(placementClusterForApi
          ? { placementCluster: placementClusterForApi }
          : {}),
      })
      .then((res) => {
        if (fetchGen !== companyDetailFetchGenRef.current) return;
        setCompany(res.data);
        setPlacementYear(yearForRequest);
        setLoadError(null);
      })
      .catch((err) => {
        if (fetchGen !== companyDetailFetchGenRef.current) return;
        console.error("❌ Error fetching company details:", err);
        if (err?.response?.status === 403) {
          setLoadError("restricted");
          return;
        }
        const isOffline =
          typeof navigator !== "undefined" && !navigator.onLine;
        const networkError =
          err.message === "Network Error" ||
          err.code === "ERR_NETWORK" ||
          (err.response == null && err.request != null);
        setLoadError(isOffline || networkError ? "offline" : "error");
      })
      .finally(() => {
        if (fetchGen !== companyDetailFetchGenRef.current) return;
        setLoading(false);
        setPlacementYearLoading(false);
      });
  }, [
    id,
    user?.betaAccess,
    location.pathname,
    location.search,
    location.state?.defaultPlacementYear,
    placementContextForApi,
    placementCompanyVisitIdForApi,
    placementClusterForApi,
  ]);

  const openTabFromNav = location.state?.openTab;

  useEffect(() => {
    if (!id || !user?.email || isAdmin) {
      setHasRequestedDetail(false);
      setDetailRequestLoading(false);
      return;
    }

    let cancelled = false;
    setDetailRequestLoading(true);
    companyAPI
      .getDetailRequestStatus(id)
      .then((res) => {
        if (cancelled) return;
        setHasRequestedDetail(res.data?.hasRequested === true);
      })
      .catch(() => {
        if (!cancelled) setHasRequestedDetail(false);
      })
      .finally(() => {
        if (!cancelled) setDetailRequestLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, user?.email, isAdmin]);

  const handleRequestMoreDetails = async () => {
    if (!id || !user || isAdmin || hasRequestedDetail || detailRequestSubmitting) return;

    setDetailRequestSubmitting(true);
    setDetailRequestFeedback("");
    try {
      await companyAPI.submitDetailRequest(id, { placementYear });
      setHasRequestedDetail(true);
      setDetailRequestFeedback("Request sent. We will notify you when more details are available.");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.hasRequested) {
        setHasRequestedDetail(true);
        setDetailRequestFeedback("You already requested more details for this company.");
        return;
      }
      setDetailRequestFeedback(
        err.response?.data?.error || "Could not send request. Please try again."
      );
    } finally {
      setDetailRequestSubmitting(false);
    }
  };

  useEffect(() => {
    if (!company || !id) return;
    if (!isCsClusterForInterview) return;
    if (openTabFromNav !== "aiinterview") return;
    setActiveTab("aiinterview");
    navigate(`/companies/${id}`, { replace: true, state: {} });
  }, [company, id, openTabFromNav, navigate, isCsClusterForInterview]);

  useEffect(() => {
    const COMPANY_TAB_STEP_TO_TAB = {
      "company-tab-about": "about",
      "company-tab-general": "general",
      "company-tab-general-eligibility": "general",
      "company-tab-general-visit-date": "general",
      "company-tab-general-roles-ctc": "general",
      "company-tab-stats": "stats",
      "company-tab-stats-wells-fargo": "stats",
      "company-tab-stats-got-in": "stats",
      "company-tab-stats-converted": "stats",
      "company-tab-stats-branch-wise": "stats",
      "company-tab-recruitment": "recruitment",
      "company-tab-oa": "oa",
      "company-tab-coding": "coding",
      "company-tab-interview": "interview",
      "company-add-interview-question": "interview",
      "company-tab-internship": "internship",
      "company-tab-mustdo": "mustdo",
    };

    const onTourPrepare = (event) => {
      const stepId = event.detail?.stepId;
      if (!stepId) return;

      if (stepId === "company-tab-stats-summer") {
        setActiveTab("stats");
        setOpenDropdownTab(null);
        return;
      }

      if (
        stepId === "company-tab-stats-wells-fargo" ||
        stepId === "company-tab-stats-got-in" ||
        stepId === "company-tab-stats-converted" ||
        stepId === "company-tab-stats-branch-wise"
      ) {
        setActiveTab("stats");
        setOpenDropdownTab(null);
        return;
      }

      if (stepId === "company-add-interview-question") {
        setActiveTab("interview");
        setOpenDropdownTab(null);
        return;
      }

      if (stepId === "company-ai-interview-explore") {
        setActiveTab("about");
        setOpenDropdownTab(null);
        return;
      }

      if (
        stepId === "company-ai-interview-setup" ||
        stepId === "company-ai-interview-start"
      ) {
        setActiveTab("aiinterview");
        setOpenDropdownTab(null);
        return;
      }

      const tabId = COMPANY_TAB_STEP_TO_TAB[stepId];
      if (tabId) {
        setActiveTab(tabId);
        setOpenDropdownTab(null);
      }
    };

    window.addEventListener(TOUR_PREPARE_EVENT, onTourPrepare);
    return () => window.removeEventListener(TOUR_PREPARE_EVENT, onTourPrepare);
  }, []);

  /** RVITM: Stats + Recruitment Process stay out of the nav when rvitm got-in is 0. */
  const hideRvitmEmptySelectionTabs =
    isRvitmViewer &&
    Boolean(company) &&
    company.placementDreamTierVisitMissingForYear !== true &&
    company.placementSummerInternshipVisitMissingForYear !== true &&
    company.placementInternshipOnlyVisitMissingForYear !== true &&
    !(
      Boolean(placementClusterForApi) &&
      Array.isArray(company.placementYearsAvailable) &&
      !company.placementYearsAvailable.includes(placementYear)
    ) &&
    rvitmPlacementGotInTotal(company) === 0;

  useEffect(() => {
    if (
      hideRvitmEmptySelectionTabs &&
      (activeTab === "stats" || activeTab === "recruitment")
    ) {
      setActiveTab("about");
    }
  }, [hideRvitmEmptySelectionTabs, activeTab]);

  useEffect(() => {
    if (placementYearLoading) return;
    if (activeTab !== "internship") return;
    if (!companyHasInternshipExperience(company)) {
      setActiveTab("about");
    }
  }, [company, activeTab, placementYearLoading]);

  const handleRefresh = () => {
    if (!id || isRefreshing) return;
    if (user?.betaAccess === false) return;
    setIsRefreshing(true);
    companyAPI
      .refreshCompany(id, {
        year: placementYear,
        ...(placementContextForApi ? { placementContext: placementContextForApi } : {}),
        ...(placementCompanyVisitIdForApi
          ? { placementCompanyVisitId: placementCompanyVisitIdForApi }
          : {}),
        ...(placementClusterForApi
          ? { placementCluster: placementClusterForApi }
          : {}),
      })
      .then((res) => setCompany(res.data))
      .catch((err) => console.error("❌ Error refreshing company:", err))
      .finally(() => setIsRefreshing(false));
  };

  if (!id)
    return (
      <div className="p-6 min-h-screen bg-theme-app">
        <p className="text-theme-secondary">Invalid company link.</p>
      </div>
    );

  if (loading && !company) {
    return (
      <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6 max-w-6xl mx-auto min-h-screen bg-theme-app">
        <div className="mb-4">
          <div className="shimmer-box h-5 w-20 rounded-md" />
        </div>
        <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
            <div className="shimmer-box w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="shimmer-box h-8 sm:h-10 w-56 max-w-full rounded-lg" />
              <div className="shimmer-box h-5 w-40 rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="shimmer-box h-10 w-24 sm:w-28 rounded-lg" />
          ))}
        </div>
        <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
          <div className="space-y-4">
            <div className="shimmer-box h-6 w-48 rounded-md" />
            <div className="shimmer-box h-4 w-full rounded-md" />
            <div className="shimmer-box h-4 w-[92%] rounded-md" />
            <div className="shimmer-box h-4 w-[85%] rounded-md" />
            <div className="shimmer-box h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError === "offline" && !company) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center min-h-screen bg-theme-app">
        <p className="text-theme-primary font-medium mb-2">You are offline.</p>
        <p className="text-theme-secondary text-sm mb-4">
          This company is not available from cache. Please connect to the
          internet to view it.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-theme-card border border-theme back-link-theme transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  if (loadError === "restricted" && !company) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center min-h-screen bg-theme-app">
        <p className="text-theme-secondary mb-4">
          {/* Stay connected, we will be back soon */}
          Access is restricted by organization
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-theme-card border border-theme back-link-theme hover:bg-theme-nav transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  if (loadError && !company) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center min-h-screen bg-theme-app">
        <p className="text-theme-secondary mb-4">
          Could not load this company. Please try again.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-theme-card border border-theme back-link-theme hover:bg-theme-nav transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!company) return null;

  const hasInterviewQuestions =
    company.interview_questions &&
    Array.isArray(company.interview_questions) &&
    company.interview_questions.length > 0 &&
    company.interview_questions.some((item) => {
      if (typeof item === "string") return item.trim().length > 0;
      return (
        item &&
        (item.question ||
          (typeof item === "object" && Object.keys(item).length > 0))
      );
    });

  const hasInternshipExperience = companyHasInternshipExperience(company);

  const tierCtxEffective = readPlacementListContext(location, id);
  const hideDreamTierVisitDetails =
    company.placementDreamTierVisitMissingForYear === true &&
    (tierCtxEffective === PLACEMENT_TIER_DREAM ||
      tierCtxEffective === PLACEMENT_TIER_OPEN_DREAM);

  const hideSummerInternshipVisitDetails =
    company.placementSummerInternshipVisitMissingForYear === true &&
    tierCtxEffective === PLACEMENT_TIER_SUMMER_INTERNSHIP;

  const hideInternshipOnlyVisitDetails =
    company.placementInternshipOnlyVisitMissingForYear === true &&
    tierCtxEffective === PLACEMENT_TIER_INTERNSHIP_ONLY;

  // Cluster-scoped detail route (e.g. /category?cluster=ec): when selected year has no
  // visit for this cluster, show the same empty "No visit yet" panel and hide visit tabs/forms.
  const hideClusterVisitDetailsForYear =
    Boolean(placementClusterForApi) &&
    Array.isArray(company.placementYearsAvailable) &&
    !company.placementYearsAvailable.includes(placementYear);

  const hideTierContextVisitDetails =
    hideDreamTierVisitDetails ||
    hideSummerInternshipVisitDetails ||
    hideInternshipOnlyVisitDetails ||
    hideClusterVisitDetailsForYear;

  const dreamTierVisitPresentForYear = (y) => {
    const m = company.placementDreamTierVisitByYear;
    if (m && typeof m === "object") return m[y] === true;
    return (
      Array.isArray(company.placementYearsAvailable) &&
      company.placementYearsAvailable.includes(y)
    );
  };

  const summerStrictVisitPresentForYear = (y) => {
    const m = company.placementSummerInternshipVisitByYear;
    if (m && typeof m === "object") return m[y] === true;
    return (
      Array.isArray(company.placementYearsAvailable) &&
      company.placementYearsAvailable.includes(y)
    );
  };

  const yearOptionShowsApprovedVisit = (y) => {
    if (
      tierCtxEffective === PLACEMENT_TIER_DREAM ||
      tierCtxEffective === PLACEMENT_TIER_OPEN_DREAM
    ) {
      return dreamTierVisitPresentForYear(y);
    }
    if (tierCtxEffective === PLACEMENT_TIER_SUMMER_INTERNSHIP) {
      return summerStrictVisitPresentForYear(y);
    }
    return (
      Array.isArray(company.placementYearsAvailable) &&
      company.placementYearsAvailable.includes(y)
    );
  };

  const companyNavTabs = [
    { id: "about", label: "About" },
    { id: "general", label: "Roles & Info" },
    ...(!hideRvitmEmptySelectionTabs
      ? [
          { id: "stats", label: "Stats" },
          { id: "recruitment", label: "Recruitment Process" },
        ]
      : []),
    { id: "oa", label: "OA Questions" },
    { id: "coding", label: "Coding" },
    { id: "interview", label: "Interview Experience" },
    ...(hasInternshipExperience
      ? [{ id: "internship", label: "Internship Experience" }]
      : []),
    { id: "mustdo", label: "Must Do Topics" },
  ];
  const optionalCompanyNavTabs = [];
  if (hasInterviewQuestions) {
    optionalCompanyNavTabs.push({
      id: "offcampus",
      label: "Off-Campus Questions",
    });
  }
  const allCompanyNavTabs = [...companyNavTabs, ...optionalCompanyNavTabs];

  const handleBack = () => {
    if (isInterviewLocked) {
      if (typeof interviewExitHandlerRef.current === "function") {
        interviewExitHandlerRef.current();
        return;
      }
      const shouldExit = window.confirm(EXIT_WARNING_MESSAGE);
      if (!shouldExit) return;
      setIsInterviewLocked(false);
      setActiveTab("about");
      return;
    }

    const fromCompanyCards = getSessionValue("fromCompanyCards");
    if (fromCompanyCards === "true") {
      const storedReturnPath = getSessionValue(COMPANY_DETAILS_RETURN_PATH_KEY);
      if (
        storedReturnPath &&
        (storedReturnPath.startsWith("/companystats") ||
          storedReturnPath.startsWith("/category"))
      ) {
        navigate(storedReturnPath, { replace: true });
        return;
      }
      const storedTier = getSessionValue("companystats_placement_tier");
      if (isPlacementTierParam(storedTier)) {
        navigate(companystatsTierListUrl(storedTier));
        return;
      }
      const storedYear = getSessionValue("companystats_selectedYear");
      let yearToRestore = null;
      if (storedYear && storedYear !== "") {
        const parsedYear = parseInt(storedYear, 10);
        if (!Number.isNaN(parsedYear)) yearToRestore = parsedYear;
      }
      navigate("/companystats", { state: { selectedYear: yearToRestore } });
    } else {
      navigate(-1);
    }
  };

  const handleTabChange = (nextTab) => {
    if (
      isInterviewLocked &&
      activeTab === "aiinterview" &&
      nextTab !== "aiinterview"
    ) {
      if (typeof interviewExitHandlerRef.current === "function") {
        interviewExitHandlerRef.current();
        return;
      }
      const shouldExit = window.confirm(EXIT_WARNING_MESSAGE);
      if (!shouldExit) return;
      setIsInterviewLocked(false);
    }
    setActiveTab(nextTab);
    setOpenDropdownTab(null);
  };

  // Called when user clicks a year-tab button
  const handleYearTabClick = (tabId) => {
    if (
      isInterviewLocked &&
      activeTab === "aiinterview" &&
      tabId !== "aiinterview"
    ) {
      if (typeof interviewExitHandlerRef.current === "function") {
        interviewExitHandlerRef.current();
        return;
      }
      const shouldExit = window.confirm(EXIT_WARNING_MESSAGE);
      if (!shouldExit) return;
      setIsInterviewLocked(false);
    }

    // If already on this tab, just toggle the dropdown
    if (activeTab === tabId) {
      setOpenDropdownTab((prev) => (prev === tabId ? null : tabId));
      return;
    }

    // Otherwise open dropdown to pick year before switching
    setOpenDropdownTab((prev) => (prev === tabId ? null : tabId));
  };

  const navigatePlacementYear = (year) => {
    const params = new URLSearchParams();
    params.set("year", String(year));
    const ctx = readPlacementListContext(location, id);
    if (ctx) params.set("placementContext", ctx);

    let urlYear = null;
    try {
      const qy = new URLSearchParams(location.search || "").get("year");
      const n = Number(qy);
      if (isPlacementDetailVisitYear(n)) urlYear = n;
    } catch {
      // ignore
    }
    const visitId = readPlacementCompanyVisitIdFromLocation(location);
    const nextY = Number(year);
    const keepVisitHint =
      visitId &&
      isPlacementDetailVisitYear(nextY) &&
      urlYear != null &&
      urlYear === nextY;
    if (keepVisitHint) {
      params.set("placementCompanyVisitId", visitId);
    }

    const pCluster = readPlacementClusterFromLocation(location);
    if (pCluster) params.set("placementCluster", pCluster);
    navigate(`/companies/${id}?${params.toString()}`, {
      replace: true,
      state: location.state ?? {},
    });
  };

  // Called when user picks a year from a year-scoped tab dropdown
  const handleYearPick = (tabId, year) => {
    setOpenDropdownTab(null);
    setActiveTab(tabId);
    navigatePlacementYear(year);
  };

  return (
    <>
      <div className={`min-h-screen ${pageShellOuterClass}`}>
        <div className={pageShellInnerClass}>
          <PageBackNavRow>
            <PageBackButton onClick={handleBack} label="Back" />
          </PageBackNavRow>

          <div className="mx-auto max-w-6xl">
        {/* Company header — compact during AI interview focus */}
        {interviewFocusMode ? (
          <div className="mb-4 rounded-xl border border-theme bg-theme-card px-4 py-3 shadow-sm flex items-center gap-3 min-w-0">
            <div
              className="h-11 w-11 shrink-0 rounded-lg border border-theme bg-theme-input flex items-center justify-center overflow-hidden"
              aria-hidden
            >
              <CompanyLogo
                company={company}
                pixelSize={112}
                className="w-full h-full object-contain p-0.5"
                alt={company.name ? `${company.name} logo` : "Company logo"}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-theme-accent">
                Interview in progress
              </p>
              <p className="text-base sm:text-lg font-semibold text-theme-primary truncate">
                {company.name}
              </p>
            </div>
            <div
              className="h-11 w-[4.75rem] sm:h-12 sm:w-20 shrink-0 rounded-lg border border-theme bg-white/95 p-1.5 sm:p-2 shadow-sm"
              title="RV College of Engineering"
            >
              <BrandLogo />
            </div>
          </div>
        ) : (
        <div className="bg-theme-card border border-theme rounded-xl p-5 sm:p-7 md:p-8 mb-4 sm:mb-6" data-tour="company-details-header">
          <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
            <div
              className="h-16 w-16 shrink-0 rounded-xl border-2 border-theme bg-theme-card shadow-md sm:h-24 sm:w-24 md:h-28 md:w-28 flex items-center justify-center overflow-hidden"
              data-testid="company-logo"
            >
              <CompanyLogo
                company={company}
                pixelSize={192}
                className="w-full h-full object-contain p-1"
                alt={company.name || "Company logo"}
              />
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-theme-primary leading-[1.08] tracking-tight break-words">
                {company.name}
              </h1>
              <p className="mt-2 sm:mt-3 text-lg sm:text-xl md:text-2xl text-theme-secondary font-medium break-words">
                {resolveCompanyHeadlineSubtitle(
                  company,
                  readPlacementListContext(location, id)
                ) || "Placement Drive"}
              </p>
              {user && !isAdmin && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    data-tour="company-detail-request-more"
                    onClick={handleRequestMoreDetails}
                    disabled={
                      detailRequestLoading ||
                      detailRequestSubmitting ||
                      hasRequestedDetail
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      hasRequestedDetail
                        ? "border-theme bg-theme-input text-theme-muted cursor-default"
                        : "border-theme-accent bg-theme-accent/10 text-theme-accent hover:bg-theme-accent/20 disabled:opacity-60"
                    }`}
                    aria-label={
                      hasRequestedDetail
                        ? "Details already requested"
                        : "Request more company details from admins"
                    }
                  >
                    {hasRequestedDetail ? (
                      <>
                        <FaCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Request sent
                      </>
                    ) : detailRequestSubmitting ? (
                      "Sending request…"
                    ) : (
                      <>
                        <FaPaperPlane className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Request more details
                      </>
                    )}
                  </button>
                  {detailRequestFeedback ? (
                    <p className="text-sm text-theme-secondary" role="status">
                      {detailRequestFeedback}
                    </p>
                  ) : hasRequestedDetail ? (
                    <p className="text-sm text-theme-muted">
                      You can only request once per company. We will notify you when more details are available!
                    </p>
                  ) : (
                    <p className="text-sm text-theme-muted">
                      Want to know more about this company or need more questions asked? Request additional details and we'll get back to you as soon as we can!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Tab Navigation */}
        {!interviewFocusMode && (
        <div className="mb-4 sm:mb-6 min-w-0" ref={dropdownRef}>
          <div
            className="flex w-full min-w-0 flex-wrap gap-2 p-1 bg-theme-card border border-theme rounded-xl md:gap-1.5 md:p-1.5"
            role="tablist"
            aria-label="Company sections"
            data-tour="company-details-tabs"
          >
            {allCompanyNavTabs.map(({ id, label }) => {
              const isYearTab = YEAR_TABS.includes(id);
              const isOpen = openDropdownTab === id;
              const isActive = activeTab === id;

              return (
                <div key={id} className="relative">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-haspopup={isYearTab ? "listbox" : undefined}
                    aria-expanded={isYearTab ? isOpen : undefined}
                    data-tour={`company-tab-${id}`}
                    onClick={() =>
                      isYearTab ? handleYearTabClick(id) : handleTabChange(id)
                    }
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold leading-tight transition-all duration-200 sm:px-3.5 sm:py-2 sm:text-sm md:rounded-lg md:px-4 md:py-2.5 md:text-base lg:px-5 lg:py-2.5 lg:text-lg whitespace-nowrap ${
                      isActive
                        ? "bg-theme-hero text-theme-accent shadow-md"
                        : "text-theme-secondary hover:text-theme-primary hover:bg-theme-nav"
                    }`}
                  >
                    {label}
                    {isYearTab && (
                      <ChevronIcon
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Year dropdown panel */}
                  {isYearTab && isOpen && (
                    <div
                      className="absolute top-full mt-1.5 left-0 z-30 bg-theme-card border border-theme rounded-xl overflow-hidden min-w-[132px] sm:min-w-[150px] shadow-lg"
                      role="listbox"
                      aria-label={`Select placement year for ${label}`}
                      data-tour="company-tab-year-menu"
                    >
                      {placementYearLoading && (
                        <div className="px-4 py-2 text-xs text-theme-secondary animate-pulse">
                          Updating…
                        </div>
                      )}
                      {PLACEMENT_YEAR_CHOICES.map((y, i) => {
                        const hasVisit = yearOptionShowsApprovedVisit(y);
                        const isSelected = placementYear === y;

                        return (
                          <React.Fragment key={y}>
                            {/* Divider before years without a visit for this list context */}
                            {i > 0 &&
                              !hasVisit &&
                              PLACEMENT_YEAR_CHOICES[i - 1] &&
                              yearOptionShowsApprovedVisit(
                                PLACEMENT_YEAR_CHOICES[i - 1]
                              ) && (
                                <div className="h-px bg-theme-border mx-2" />
                              )}
                            <button
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleYearPick(id, y)}
                              className={`w-full flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm transition-colors hover:bg-theme-nav ${
                                isSelected
                                  ? "text-theme-accent font-semibold"
                                  : "text-theme-primary"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {y}
                                {!hasVisit && (
                                  <span className="text-[10px] sm:text-xs text-theme-secondary font-normal">
                                    {PLACEMENT_YEAR_DROPDOWN_NO_VISIT_COPY}
                                  </span>
                                )}
                              </span>
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-theme-accent"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}
        <div ref={tabContentRef} className="company-tab-content">
          {placementYearLoading && YEAR_TABS.includes(activeTab) ? (
            <div
              className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6"
              aria-busy="true"
              aria-live="polite"
              data-tour="company-tab-year-loading"
            >
              <p className="text-sm text-theme-secondary mb-4 animate-pulse">
                Loading {placementYear} visit details…
              </p>
              <div className="space-y-4">
                <div className="shimmer-box h-6 w-48 rounded-md" />
                <div className="shimmer-box h-4 w-full rounded-md" />
                <div className="shimmer-box h-4 w-[92%] rounded-md" />
                <div className="shimmer-box h-4 w-[85%] rounded-md" />
                <div className="shimmer-box h-24 w-full rounded-lg" />
              </div>
            </div>
          ) : (
            <>
          {activeTab === "about" && <AboutTab company={company} />}
          {activeTab === "general" &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <GeneralTab
                company={company}
                isAdmin={isAdmin}
                onRolesUpdated={handleRefresh}
                placementYear={placementYear}
                placementListContext={placementContextForApi}
                placementCompanyVisitId={company?.placementCompanyVisitId}
                placementCluster={placementClusterForApi}
              />
            ))}
          {activeTab === "stats" &&
            !hideRvitmEmptySelectionTabs &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <StatsTab
                company={company}
                isAdmin={isAdmin}
                onStatsUpdated={handleRefresh}
                placementYear={placementYear}
                placementListContext={placementContextForApi}
                placementCluster={placementClusterForApi}
              />
            ))}
          {activeTab === "recruitment" &&
            !hideRvitmEmptySelectionTabs &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <RecruitmentProcessTab
                company={company}
                canManage={canManageRecruitmentProcess}
                onCompanyUpdate={handleRefresh}
                placementYear={placementYear}
                placementListContext={placementContextForApi}
                placementCompanyVisitId={company?.placementCompanyVisitId}
                placementCluster={placementClusterForApi}
              />
            ))}
          {activeTab === "oa" &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <OATab
                company={company}
                isAdmin={isAdmin}
                onCompanyUpdate={handleRefresh}
                placementYear={placementYear}
                placementListContext={placementContextForApi}
                placementCompanyVisitId={company?.placementCompanyVisitId}
                placementCluster={placementClusterForApi}
              />
            ))}
          {activeTab === "coding" &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <CodingTab company={company} />
            ))}
          {activeTab === "interview" &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <InterviewTab
                company={company}
                isAdmin={isAdmin}
                onCompanyUpdate={handleRefresh}
                placementYear={placementYear}
                placementListContext={placementContextForApi}
                placementCompanyVisitId={company?.placementCompanyVisitId}
                placementCluster={placementClusterForApi}
              />
            ))}
          {activeTab === "internship" &&
            hasInternshipExperience &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <InternshipTab
                company={company}
                placementYear={placementYear}
                placementListContext={placementContextForApi}
                placementCompanyVisitId={company?.placementCompanyVisitId}
              />
            ))}
          {isCsClusterForInterview && activeTab === "aiinterview" && (
            <AIInterviewTab
              company={company}
              onInterviewLockChange={setIsInterviewLocked}
              onForceExitToGeneral={() => setActiveTab("general")}
              registerInterviewExitHandler={(handler) => {
                interviewExitHandlerRef.current = handler;
              }}
            />
          )}
          {activeTab === "mustdo" &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <MustDoTab
                company={company}
                isAdmin={isAdmin}
                onCompanyUpdate={handleRefresh}
                placementYear={placementYear}
                placementListContext={placementContextForApi}
                placementCompanyVisitId={company?.placementCompanyVisitId}
                placementCluster={placementClusterForApi}
              />
            ))}
          {activeTab === "offcampus" &&
            (hideTierContextVisitDetails ? (
              <DreamTierVisitEmptyPanel />
            ) : (
              <OffCampusQuestionsTab company={company} />
            ))}
            </>
          )}
        </div>
          </div>
        </div>
      </div>

      {!shouldHideAiInterviews && isCsClusterForInterview && activeTab !== "aiinterview" && (
        <div
          className="ai-interview-explore-scope fixed z-[30] pointer-events-none flex flex-col items-end gap-2"
          style={{
            bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
            right: "max(1rem, env(safe-area-inset-right, 0px))",
          }}
        >
          <AiInterviewExploreButton
            data-tour="company-ai-interview-explore"
            className="pointer-events-auto shadow-lg"
            onClick={() => handleTabChange("aiinterview")}
          />
        </div>
      )}
    </>
  );
}

export default CompanyDetails;