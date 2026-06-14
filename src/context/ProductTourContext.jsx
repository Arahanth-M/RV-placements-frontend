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

const TOUR_EXAMPLE_COMPANY_NAME = "wells fargo";
const TOUR_PPO_COMPANY_NAME = "deutsche";
/** Fixed Microsoft company page for coding tour (summer internship PPO, CS 2026). */
const TOUR_MICROSOFT_COMPANY_ID = "69edb0e91dafb58cccd88dc4";
const TOUR_MICROSOFT_COMPANY_PATH = `/companies/${TOUR_MICROSOFT_COMPANY_ID}?year=2026&placementContext=summer_internship&placementCluster=cs`;
const TOUR_PPO_INTERNSHIP_YEAR = 2026;

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
      year: TOUR_PPO_INTERNSHIP_YEAR,
      cluster: "cs",
    });
    const list = Array.isArray(res.data) ? res.data : [];
    const isPpoExample = (c) =>
      String(c?.name || "")
        .toLowerCase()
        .includes(TOUR_PPO_COMPANY_NAME);
    const ppoCompany =
      list.find((c) => isPpoExample(c) && qualifiesSummerInternshipCompany(c)) ||
      list.find(isPpoExample);
    if (!ppoCompany) return null;
    const cid = ppoCompany._id || ppoCompany.id;
    return `/companies/${cid}?year=${TOUR_PPO_INTERNSHIP_YEAR}&placementContext=summer_internship&placementCluster=cs`;
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
    const dreamExample = list.find((c) =>
      String(c?.name || "")
        .toLowerCase()
        .includes(TOUR_EXAMPLE_COMPANY_NAME)
    );
    const target = dreamExample || list.find((c) => c?._id || c?.id);
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
    heading?.textContent?.toLowerCase().includes(TOUR_PPO_COMPANY_NAME) ?? false
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

async function resolveMicrosoftCodingCompanyPath() {
  return TOUR_MICROSOFT_COMPANY_PATH;
}

function isOnMicrosoftCodingPage() {
  if (!isOnCompanyDetailsPage()) return false;
  return window.location.pathname.includes(TOUR_MICROSOFT_COMPANY_ID);
}

/** @returns {Promise<string | null>} */
async function ensureMicrosoftCodingOpenForTour() {
  if (isOnMicrosoftCodingPage()) {
    await waitForCompanyDetailsReady();
    return null;
  }
  return resolveMicrosoftCodingCompanyPath();
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
        reject(new Error("Tour Wells Fargo company card not found"));
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

function resetTourViewport(targetElement) {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const scrollRoots = document.querySelectorAll("main, [data-tour-scroll-root]");
  scrollRoots.forEach((node) => {
    if (node instanceof HTMLElement) {
      node.scrollTop = 0;
      node.scrollLeft = 0;
    }
  });

  if (targetElement instanceof HTMLElement) {
    let node = targetElement.parentElement;
    while (node) {
      const style = getComputedStyle(node);
      const canScrollY =
        (style.overflowY === "auto" ||
          style.overflowY === "scroll" ||
          style.overflowY === "overlay") &&
        node.scrollHeight > node.clientHeight;
      if (canScrollY) {
        node.scrollTop = 0;
      }
      node = node.parentElement;
    }
  }
}

function cleanupDriverArtifacts() {
  document.querySelectorAll(".driver-overlay, .driver-popover").forEach((node) => {
    node.remove();
  });
  document.body.classList.remove("driver-active", "driver-fade", "driver-simple");
  document.querySelectorAll(".driver-active-element").forEach((node) => {
    if (node instanceof HTMLElement) {
      node.classList.remove("driver-active-element", "driver-no-interaction");
      node.removeAttribute("aria-haspopup");
      node.removeAttribute("aria-expanded");
      node.removeAttribute("aria-controls");
    }
  });
}

function queryTourTarget(step) {
  const primary = queryVisibleElement(step.selector);
  if (primary) return primary;
  if (step.fallbackSelector) {
    return queryVisibleElement(step.fallbackSelector);
  }
  return null;
}

async function waitForLayoutSettle(extraMs = 180) {
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  await new Promise((r) => setTimeout(r, extraMs));
}

async function waitForStableTargetRect(element, timeoutMs = 1200) {
  if (!(element instanceof HTMLElement)) return element;

  let lastTop = Number.NaN;
  let lastLeft = Number.NaN;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const rect = element.getBoundingClientRect();
    if (
      Number.isFinite(lastTop) &&
      Math.abs(rect.top - lastTop) < 1 &&
      Math.abs(rect.left - lastLeft) < 1 &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      return element;
    }
    lastTop = rect.top;
    lastLeft = rect.left;
    await waitForLayoutSettle(60);
  }

  return element;
}

async function focusTourTarget(step, targetElement) {
  resetTourViewport(targetElement);
  await waitForLayoutSettle(80);

  let focused = targetElement;
  if (focused instanceof HTMLElement) {
    focused.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "instant",
    });
  }

  await waitForLayoutSettle(
    step.id === "company-ai-interview-start"
      ? 320
      : step.id?.startsWith("company-")
        ? 260
        : 200
  );

  const refreshed = queryTourTarget(step);
  if (refreshed instanceof HTMLElement) {
    focused = refreshed;
    focused.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "instant",
    });
    await waitForStableTargetRect(focused, 900);
  }

  return focused;
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

async function prepareTourTarget(step) {
  cleanupDriverArtifacts();
  let targetElement = null;
  try {
    targetElement = await resolveTourTarget(step);
  } catch {
    return null;
  }
  return focusTourTarget(step, targetElement);
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
    let driverObj = null;
    const finish = (action) => {
      if (resolved) return;
      resolved = true;
      try {
        driverObj?.destroy();
      } catch {
        /* ignore */
      }
      cleanupDriverArtifacts();
      resolve(action);
    };

    const isLast = index >= total - 1;
    const isFirst = index === 0;
    const isDarkTheme =
      document.documentElement.getAttribute("data-theme") === "dark";
    const highlightStartInterview = step.id === "company-ai-interview-start";

    const resolveHighlightElement = () => {
      const fresh = queryTourTarget(step);
      if (fresh instanceof HTMLElement) {
        fresh.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "instant",
        });
        return fresh;
      }
      return targetElement;
    };

    driverObj = driver({
      showProgress: false,
      allowClose: true,
      animate: false,
      overlayOpacity: isDarkTheme ? 0.58 : 0.5,
      stagePadding: highlightStartInterview ? 22 : 14,
      stageRadius: highlightStartInterview ? 16 : 14,
      smoothScroll: false,
      nextBtnText: isLast ? "Done" : "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      popoverClass: "placement-tour-popover",
      onHighlightStarted: () => {
        requestAnimationFrame(() => {
          try {
            driverObj?.refresh();
          } catch {
            /* ignore */
          }
        });
      },
      onHighlighted: () => {
        requestAnimationFrame(() => {
          try {
            driverObj?.refresh();
          } catch {
            /* ignore */
          }
        });
      },
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
          element: resolveHighlightElement,
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
      },
      onPrevClick: () => {
        finish("prev");
      },
      onCloseClick: () => {
        finish("close");
      },
    });

    try {
      driverObj.drive();
    } catch {
      finish("close");
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
          resetTourViewport();
          dispatchTourPrepare(step.id);
          await new Promise((r) => setTimeout(r, 650));
        } else if (step.prepare === "navigateToMicrosoftCodingCompany") {
          const path = await ensureMicrosoftCodingOpenForTour();
          if (typeof path === "string" && path.startsWith("/")) {
            navigate(path);
            await waitForCompanyDetailsReady();
          }
          resetTourViewport();
          dispatchTourPrepare(step.id);
          await new Promise((r) => setTimeout(r, 700));
        } else if (step.prepare === "navigateToPhonePeCompanyStats") {
          const path = await resolvePhonePeCompanyPath(DEFAULT_PLACEMENT_DETAIL_YEAR);
          if (path) {
            navigate(path);
            await waitForCompanyDetailsReady();
          } else {
            const opened = await ensurePhonePeCompanyOpenForTour();
            if (typeof opened === "string" && opened.startsWith("/")) {
              navigate(opened);
              await waitForCompanyDetailsReady();
            }
          }
          resetTourViewport();
          dispatchTourPrepare(step.id);
          await new Promise((r) => setTimeout(r, 700));
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
          resetTourViewport();
          dispatchTourPrepare(step.id);
          await new Promise((r) =>
            setTimeout(
              r,
              step.prepare === "navigateToPhonePeCompany"
                ? 650
                : step.id === "company-ai-interview-start"
                  ? 800
                  : 480
            )
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
          resetTourViewport();
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
                  ? step.id === "company-stats-2026-filter-fte" ||
                    step.id === "company-stats-2026-filter-internship-fte"
                    ? 850
                    : 650
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
            resetTourViewport();
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
                  ? step.route.includes("companystats") ||
                    step.route.includes("/companies/")
                    ? 420
                    : step.route.includes("/profile") ||
                        step.route.includes("/my-submissions") ||
                        step.route.includes("/resume-builder")
                      ? 380
                      : 220
                  : 80
              )
            );
          }
        }

        cleanupDriverArtifacts();
        let targetElement = await prepareTourTarget(step);
        if (!targetElement) {
          index += 1;
          continue;
        }

        if (step.id === "company-ai-interview-start") {
          await new Promise((r) => setTimeout(r, 280));
          targetElement = (await prepareTourTarget(step)) || targetElement;
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
