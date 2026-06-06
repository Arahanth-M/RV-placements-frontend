import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "../utils/AuthContext";
import { useInterviewLock } from "../utils/InterviewLockContext";
import { getStudentTourSteps } from "../config/productTour";
import { markTourCompleted } from "../utils/tourStorage";
import { companyAPI } from "../utils/api";
import { RESUME_BUILDER_ENABLED } from "../utils/constants";
import { DEFAULT_PLACEMENT_DETAIL_YEAR } from "../constants/placementYears.js";
import { dispatchTourPrepare } from "../utils/productTourEvents";

const TOUR_EXAMPLE_COMPANY_NAME = "phonepe";
const TOUR_MICROSOFT_COMPANY_NAME = "microsoft";
const TOUR_MICROSOFT_INTERNSHIP_YEAR = 2026;

const COMPANY_TOUR_PREPARES = new Set([
  "navigateToPhonePeCompany",
  "prepareCompanyTourStep",
]);

const ProductTourContext = createContext(null);

function isVisibleElement(el) {
  if (!(el instanceof HTMLElement)) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function queryVisibleElement(selector) {
  const nodes = document.querySelectorAll(selector);
  return Array.from(nodes).find(isVisibleElement) ?? null;
}

function qualifiesSummerInternshipCompany(company) {
  if (company?.placementSummerInternshipForListingYear === true) return true;
  if (company?.placementAnyYearPpoOnCampus === true) return true;
  if (company?.placementAnyYearPpoOnCampus === false) return false;
  return String(company?.type || "")
    .toLowerCase()
    .includes("ppo");
}

async function resolveMicrosoftInternshipPpoPath() {
  try {
    const res = await companyAPI.getAllCompanies({
      year: TOUR_MICROSOFT_INTERNSHIP_YEAR,
      cluster: "cs",
    });
    const list = Array.isArray(res.data) ? res.data : [];
    const isMicrosoft = (c) =>
      String(c?.name || "")
        .toLowerCase()
        .includes(TOUR_MICROSOFT_COMPANY_NAME);
    const microsoft =
      list.find((c) => isMicrosoft(c) && qualifiesSummerInternshipCompany(c)) ||
      list.find(isMicrosoft);
    if (!microsoft) return null;
    const cid = microsoft._id || microsoft.id;
    return `/companies/${cid}?year=${TOUR_MICROSOFT_INTERNSHIP_YEAR}&placementContext=summer_internship&placementCluster=cs`;
  } catch {
    return null;
  }
}

async function resolvePhonePeCompanyPath(preferredYear = DEFAULT_PLACEMENT_DETAIL_YEAR) {
  try {
    const res = await companyAPI.getAllCompanies({
      year: preferredYear,
      cluster: "cs",
    });
    const list = Array.isArray(res.data) ? res.data : [];
    const phonePe = list.find((c) =>
      String(c?.name || "")
        .toLowerCase()
        .includes(TOUR_EXAMPLE_COMPANY_NAME)
    );
    const target = phonePe || list.find((c) => c?._id || c?.id);
    if (!target) return null;
    const cid = target._id || target.id;
    return `/companies/${cid}?year=${preferredYear}&placementContext=dream&placementCluster=cs`;
  } catch {
    return null;
  }
}

function isOnMicrosoftInternshipPage() {
  if (!isOnCompanyDetailsPage()) return false;
  if (!window.location.search.includes("placementContext=summer_internship")) return false;
  const heading = document.querySelector("h1");
  return (
    heading?.textContent?.toLowerCase().includes(TOUR_MICROSOFT_COMPANY_NAME) ?? false
  );
}

/** @returns {Promise<"clicked" | string | null>} */
async function ensureMicrosoftInternshipOpenForTour() {
  if (isOnMicrosoftInternshipPage()) {
    await waitForCompanyDetailsReady();
    return null;
  }
  return resolveMicrosoftInternshipPpoPath();
}

function findPhonePeCardInGrid() {
  const grid = queryVisibleElement('[data-tour="company-stats-company-grid"]');
  if (!grid) return null;
  const cards = grid.querySelectorAll('[data-testid="company-card"]');
  for (const card of cards) {
    if (
      card instanceof HTMLElement &&
      card.textContent?.toLowerCase().includes(TOUR_EXAMPLE_COMPANY_NAME)
    ) {
      return card;
    }
  }
  const first = cards[0];
  return first instanceof HTMLElement ? first : null;
}

function waitForPhonePeCardInGrid(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const card = findPhonePeCardInGrid();
      if (card && isVisibleElement(card)) {
        resolve(card);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error("Tour PhonePe company card not found"));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/** @returns {"clicked" | string | null} */
async function openFirstCompanyCardInGrid() {
  try {
    const card = await waitForPhonePeCardInGrid();
    const detailsBtn = card.querySelector(".full-details-btn");
    if (detailsBtn instanceof HTMLElement) {
      detailsBtn.click();
      return "clicked";
    }
    return null;
  } catch {
    return null;
  }
}

/** @returns {"clicked" | string | null} */
async function openPhonePeCompanyForTour(preferredYear = DEFAULT_PLACEMENT_DETAIL_YEAR) {
  const clicked = await openFirstCompanyCardInGrid();
  if (clicked === "clicked") return "clicked";
  return resolvePhonePeCompanyPath(preferredYear);
}

function isOnCompanyDetailsPage() {
  return /^\/companies\/[^/]+/.test(window.location.pathname);
}

async function waitForCompanyDetailsReady(timeoutMs = 12000) {
  await waitForElement('[data-tour="company-details-tabs"]', timeoutMs).catch(
    () => {}
  );
}

function isOnPhonePeCompanyPage() {
  if (!isOnCompanyDetailsPage()) return false;
  const heading = document.querySelector("h1");
  return heading?.textContent?.toLowerCase().includes(TOUR_EXAMPLE_COMPANY_NAME) ?? false;
}

/** @returns {Promise<"clicked" | string | null>} */
async function ensurePhonePeCompanyOpenForTour(preferredYear = DEFAULT_PLACEMENT_DETAIL_YEAR) {
  if (isOnPhonePeCompanyPage() && preferredYear === DEFAULT_PLACEMENT_DETAIL_YEAR) {
    await waitForCompanyDetailsReady();
    return null;
  }
  if (isOnCompanyDetailsPage() && preferredYear === DEFAULT_PLACEMENT_DETAIL_YEAR) {
    const path = await resolvePhonePeCompanyPath(preferredYear);
    if (path) return path;
  }
  const opened = await openPhonePeCompanyForTour(preferredYear);
  if (opened === "clicked") {
    await waitForCompanyDetailsReady();
  }
  return opened;
}

function stepRoutePath(route) {
  try {
    return new URL(route, window.location.origin).pathname;
  } catch {
    return route.split("?")[0];
  }
}

function isAlreadyOnRoute(route) {
  return window.location.pathname === stepRoutePath(route);
}

async function waitForEventsTourReady(timeoutMs = 6000) {
  await waitForElement('[data-tour="events-loaded"]', timeoutMs).catch(() => {});
}

async function resolveTourTarget(step) {
  const primaryTimeout = step.fallbackSelector ? 2000 : 8000;
  try {
    return await waitForElement(step.selector, primaryTimeout);
  } catch {
    if (!step.fallbackSelector) throw new Error(`Tour target not found: ${step.selector}`);
    return waitForElement(step.fallbackSelector, 2000);
  }
}

function waitForElement(selector, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const el = queryVisibleElement(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error(`Tour target not found: ${selector}`));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function clearCompanyStatsYearPersistence(userId) {
  try {
    sessionStorage.setItem("companystats_selectedYear", "");
    localStorage.removeItem("companystats_selectedYear");
    if (userId) {
      sessionStorage.setItem(`companystats_selectedYear_${userId}`, "");
    }
  } catch {
    /* ignore */
  }
}

function runDriverStep(step, index, total, targetElement) {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (action) => {
      if (resolved) return;
      resolved = true;
      resolve(action);
    };

    const isLast = index >= total - 1;
    const isFirst = index === 0;
    const isDarkTheme =
      document.documentElement.getAttribute("data-theme") === "dark";
    const driverObj = driver({
      showProgress: false,
      allowClose: true,
      overlayOpacity: isDarkTheme ? 0.58 : 0.5,
      stagePadding: 14,
      stageRadius: 14,
      smoothScroll: true,
      nextBtnText: isLast ? "Done" : "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      popoverClass: "placement-tour-popover",
      onPopoverRender: (popover) => {
        if (popover.progress) {
          popover.progress.style.display = "none";
        }
        if (popover.previousButton) {
          if (isFirst) {
            popover.previousButton.style.display = "none";
          } else {
            popover.previousButton.style.display = "block";
            popover.previousButton.disabled = false;
            popover.previousButton.classList.remove("driver-popover-btn-disabled");
          }
        }
      },
      steps: [
        {
          element: targetElement,
          popover: {
            title: step.title,
            description: step.description,
            side: step.side || "bottom",
            align: step.align || "start",
            showProgress: false,
          },
        },
      ],
      onNextClick: () => {
        finish(isLast ? "done" : "next");
        driverObj.destroy();
      },
      onPrevClick: () => {
        finish("prev");
        driverObj.destroy();
      },
      onCloseClick: () => {
        finish("close");
        driverObj.destroy();
      },
    });

    try {
      driverObj.drive();
    } catch {
      finish("close");
      driverObj.destroy();
    }
  });
}

export function ProductTourProvider({ children }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isInterviewLocked } = useInterviewLock();
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);

  const includeAiInterviews = useMemo(() => {
    if (!user) return true;
    const profileKey = user.userId || user._id;
    if (!profileKey) return true;
    const hide =
      localStorage.getItem(`studentProfileAvailability_${profileKey}`) ===
      "no_profile";
    return !hide;
  }, [user]);

  const startTour = useCallback(async () => {
    if (!user || isRunning || isInterviewLocked || authLoading) return;

    const steps = getStudentTourSteps({
      isLoggedIn: true,
      includeAiInterviews,
      includeResumeBuilder: RESUME_BUILDER_ENABLED,
    });
    if (steps.length === 0) return;

    cancelRef.current = false;
    setIsRunning(true);

    let index = 0;

    try {
      while (index >= 0 && index < steps.length) {
        if (cancelRef.current) break;

        const step = steps[index];

        if (step.prepare === "navigateToMicrosoftInternshipPpo") {
          const path = await ensureMicrosoftInternshipOpenForTour();
          if (typeof path === "string" && path.startsWith("/")) {
            navigate(path);
            await waitForCompanyDetailsReady();
          }
          dispatchTourPrepare(step.id);
          await new Promise((r) => setTimeout(r, 650));
        } else if (COMPANY_TOUR_PREPARES.has(step.prepare)) {
          let opened = null;
          if (step.prepare === "navigateToPhonePeCompany") {
            const path = await resolvePhonePeCompanyPath(DEFAULT_PLACEMENT_DETAIL_YEAR);
            if (path) {
              navigate(path);
              await waitForCompanyDetailsReady();
            } else {
              opened = await ensurePhonePeCompanyOpenForTour();
            }
          } else {
            opened = await ensureMicrosoftInternshipOpenForTour();
          }
          if (typeof opened === "string" && opened.startsWith("/")) {
            navigate(opened);
            await waitForCompanyDetailsReady();
          } else if (
            opened === null &&
            !isOnCompanyDetailsPage() &&
            step.prepare === "navigateToPhonePeCompany"
          ) {
            navigate(step.route);
            await new Promise((r) => setTimeout(r, 250));
          }
          dispatchTourPrepare(step.id);
          await new Promise((r) =>
            setTimeout(r, step.prepare === "navigateToPhonePeCompany" ? 650 : 480)
          );
        } else if (step.prepare === "openAnalyticsTab") {
          navigate(step.route);
          await new Promise((r) => setTimeout(r, 120));
          dispatchTourPrepare(step.id);
          await new Promise((r) => setTimeout(r, 220));
        } else if (step.prepare === "openAiInterviewSessions") {
          navigate(step.route);
          await new Promise((r) => setTimeout(r, 120));
          dispatchTourPrepare(step.id);
          await new Promise((r) => setTimeout(r, 220));
        } else if (
          step.prepare === "resetCompanyStatsYear" ||
          step.prepare === "openCompanyStatsYear2025" ||
          step.prepare === "openCompanyStatsYear2026" ||
          step.prepare === "openCompanyStatsClusterCs" ||
          step.prepare === "openCompanyStatsDreamList"
        ) {
          if (step.prepare === "resetCompanyStatsYear") {
            clearCompanyStatsYearPersistence(user?.userId || user?._id);
          }
          // CompanyStats tour listener only runs when that route is mounted.
          navigate("/companystats");
          await new Promise((r) => setTimeout(r, 180));
          dispatchTourPrepare(step.id);
          const waitMs =
            step.id === "company-stats-2025-analytics"
              ? 1100
              : step.prepare === "openCompanyStatsYear2025"
              ? 700
              : step.prepare === "openCompanyStatsClusterCs"
                ? 500
                : step.prepare === "openCompanyStatsDreamList"
                  ? 650
                  : step.prepare === "openCompanyStatsYear2026"
                    ? 400
                    : 280;
          await new Promise((r) => setTimeout(r, waitMs));
          if (step.id === "company-stats-2025-analytics") {
            dispatchTourPrepare(step.id);
            await new Promise((r) => setTimeout(r, 350));
          }
        } else {
          const needsNavigate = !isAlreadyOnRoute(step.route);
          if (needsNavigate) {
            navigate(step.route);
          }
          if (step.id?.startsWith("events-")) {
            if (needsNavigate) {
              await new Promise((r) => setTimeout(r, 80));
            }
            if (step.id === "events-intro") {
              await new Promise((r) => setTimeout(r, needsNavigate ? 120 : 40));
            } else {
              await waitForEventsTourReady();
            }
          } else {
            await new Promise((r) =>
              setTimeout(
                r,
                needsNavigate
                  ? step.route.includes("companystats")
                    ? 280
                    : 120
                  : 40
              )
            );
          }
        }

        let targetElement = null;
        try {
          targetElement = await resolveTourTarget(step);
        } catch {
          index += 1;
          continue;
        }

        const action = await runDriverStep(step, index, steps.length, targetElement);

        if (action === "close") break;
        if (action === "prev") {
          index = Math.max(0, index - 1);
          continue;
        }
        if (action === "next" || action === "done") {
          if (action === "done" || index >= steps.length - 1) {
            markTourCompleted();
            break;
          }
          index += 1;
        }
      }
    } finally {
      setIsRunning(false);
      cancelRef.current = false;
      window.dispatchEvent(new CustomEvent("placement-product-tour:end"));
    }
  }, [
    authLoading,
    includeAiInterviews,
    isInterviewLocked,
    isRunning,
    navigate,
    user,
  ]);

  const value = useMemo(
    () => ({
      startTour,
      isRunning,
      canStartTour: Boolean(user) && !isInterviewLocked && !authLoading,
    }),
    [authLoading, isInterviewLocked, isRunning, startTour, user]
  );

  return (
    <ProductTourContext.Provider value={value}>
      {children}
    </ProductTourContext.Provider>
  );
}

export function useProductTour() {
  const ctx = useContext(ProductTourContext);
  if (!ctx) {
    throw new Error("useProductTour must be used within ProductTourProvider");
  }
  return ctx;
}
