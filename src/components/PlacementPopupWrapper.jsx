import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaRoute } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { useProductTour } from '../context/ProductTourContext';
import { submissionAPI } from '../utils/api';

const PLACEMENT_POPUP_FRESH_LOGIN_KEY = 'placementPopupFreshLogin';
const LOGIN_PROFILE_STATUS_KEY = 'loginProfileStatus';
const LOGIN_PROFILE_STATUS_HAS_PROFILE = 'has_profile';
const LOGIN_PROFILE_STATUS_NO_PROFILE = 'no_profile';
/** Welcome / placement card auto-dismiss (hover pauses). */
const POPUP_MAX_ACTIVE_MS = 60_000;
/** Content digest modal auto-dismiss after it appears. Matches the bottom sweep. */
const DIGEST_POPUP_MS = 10_000;
/** Wait after login/refresh before showing new-updates (does not overlap welcome). */
const DIGEST_SHOW_DELAY_MS = 10_000;

function normalizeCompanyName(raw) {
  if (raw == null) return '';
  return String(raw).trim();
}

function pushCompanyName(seen, names, raw) {
  const name = normalizeCompanyName(raw);
  if (!name) return;
  const key = name.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  names.push(name);
}

/** Companies from `placementdatas` (and API summary fields), de-duplicated. */
function placementCompanyNamesFromProfile(studentData) {
  if (!studentData || typeof studentData !== 'object') return [];

  const seen = new Set();
  const names = [];

  for (const placement of Array.isArray(studentData.placements) ? studentData.placements : []) {
    pushCompanyName(seen, names, placement?.companyPlaced);
  }
  for (const row of Array.isArray(studentData.placementCompanies) ? studentData.placementCompanies : []) {
    pushCompanyName(seen, names, row?.companyName);
  }
  pushCompanyName(seen, names, studentData.primaryCompanyName);
  pushCompanyName(seen, names, studentData.Company);

  return names;
}

function formatPartOfCompanySentence(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function followupVariantFromProfile(profileStatus, studentData) {
  const names =
    profileStatus === LOGIN_PROFILE_STATUS_HAS_PROFILE
      ? placementCompanyNamesFromProfile(studentData)
      : [];
  if (names.length > 0) return 'placement';
  if (profileStatus === LOGIN_PROFILE_STATUS_NO_PROFILE) return 'welcome-no-profile';
  return 'welcome';
}

function digestSeenStorageKey(userId) {
  const id = String(userId || '').trim();
  return id ? `contentDigestSeenAt_${id}` : '';
}

function readDigestSeenAt(userId) {
  try {
    const key = digestSeenStorageKey(userId);
    if (!key) return '';
    const raw = localStorage.getItem(key);
    if (!raw) return '';
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  } catch {
    return '';
  }
}

function writeDigestSeenAt(userId, when = new Date()) {
  try {
    const key = digestSeenStorageKey(userId);
    if (!key) return;
    localStorage.setItem(key, when.toISOString());
  } catch {
    // Ignore quota / private-mode failures; next visit may repeat once.
  }
}

const PlacementPopupWrapper = () => {
  const { user, studentData, isAdmin } = useAuth();
  const { startTour, isRunning, canStartTour } = useProductTour();
  const location = useLocation();

  const [showPopup, setShowPopup] = useState(false);
  const [popupVariant, setPopupVariant] = useState(null);
  const [digestCompanies, setDigestCompanies] = useState([]);
  const [digestTruncated, setDigestTruncated] = useState(false);
  const hasCheckedRef = useRef(false);
  const digestUserRef = useRef('');
  const hoverRef = useRef(false);
  const lastTickRef = useRef(0);
  const accumulatedActiveRef = useRef(0);
  const pendingDigestRef = useRef(null);
  const welcomeVisibleRef = useRef(false);
  const digestDelayDoneRef = useRef(false);

  const companyNames = useMemo(
    () => (studentData ? placementCompanyNamesFromProfile(studentData) : []),
    [studentData]
  );

  const userKey = user?.userId || user?._id || '';

  const tryRevealDigest = useCallback(() => {
    if (!digestDelayDoneRef.current) return;
    if (welcomeVisibleRef.current) return;
    const pending = pendingDigestRef.current;
    if (!pending?.companies?.length) return;
    pendingDigestRef.current = null;
    writeDigestSeenAt(userKey);
    setDigestCompanies(pending.companies);
    setDigestTruncated(pending.truncated === true);
    setPopupVariant('content-updates');
    setShowPopup(true);
  }, [userKey]);

  useEffect(() => {
    if (!userKey) {
      digestUserRef.current = '';
      hasCheckedRef.current = false;
      pendingDigestRef.current = null;
      welcomeVisibleRef.current = false;
      digestDelayDoneRef.current = false;
    }
  }, [userKey]);

  useEffect(() => {
    if (location.pathname === '/auth/callback') return;
    setShowPopup(false);
    setPopupVariant(null);
    welcomeVisibleRef.current = false;
    tryRevealDigest();
  }, [location.pathname, tryRevealDigest]);

  useEffect(() => {
    if (location.pathname === '/auth/callback') return;
    if (!user || !userKey) return;
    if (isAdmin) return;
    if (user?.betaAccess === false) return;

    const isFreshLogin =
      sessionStorage.getItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY) === '1';
    if (!isFreshLogin) return;

    const profileStatus = sessionStorage.getItem(LOGIN_PROFILE_STATUS_KEY);
    if (!profileStatus) return;
    if (profileStatus === LOGIN_PROFILE_STATUS_HAS_PROFILE && !studentData) {
      return;
    }
    if (hasCheckedRef.current === String(userKey)) return;
    hasCheckedRef.current = String(userKey);

    sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);
    sessionStorage.removeItem(LOGIN_PROFILE_STATUS_KEY);

    const pendingWelcome = followupVariantFromProfile(profileStatus, studentData);
    if (pendingWelcome) {
      welcomeVisibleRef.current = true;
      setPopupVariant(pendingWelcome);
      setShowPopup(true);
    }
  }, [user, userKey, studentData, isAdmin, location.pathname]);

  useEffect(() => {
    let cancelled = false;
    const delayIdRef = { current: 0 };

    const loadDigest = async () => {
      if (location.pathname === '/auth/callback') return;
      if (!user || !userKey) return;
      if (isAdmin) return;
      if (user?.betaAccess === false) return;
      if (digestUserRef.current === String(userKey)) return;

      digestUserRef.current = String(userKey);
      pendingDigestRef.current = null;
      digestDelayDoneRef.current = false;

      let companies = [];
      let truncated = false;
      const seenAt = readDigestSeenAt(userKey);
      try {
        const { data } = await submissionAPI.getSinceLastLogin(seenAt || undefined);
        if (cancelled) {
          digestUserRef.current = '';
          return;
        }
        companies = Array.isArray(data?.companies) ? data.companies : [];
        truncated = data?.truncated === true;
      } catch (err) {
        console.error('Failed to load login content digest:', err);
      }

      if (cancelled) {
        digestUserRef.current = '';
        return;
      }

      if (companies.length === 0) {
        writeDigestSeenAt(userKey);
        pendingDigestRef.current = null;
        return;
      }

      pendingDigestRef.current = { companies, truncated };
      delayIdRef.current = window.setTimeout(() => {
        if (cancelled) return;
        digestDelayDoneRef.current = true;
        tryRevealDigest();
      }, DIGEST_SHOW_DELAY_MS);
    };

    loadDigest();
    return () => {
      cancelled = true;
      if (delayIdRef.current) window.clearTimeout(delayIdRef.current);
    };
  }, [user, userKey, isAdmin, tryRevealDigest]);

  // Digest modal: auto-dismiss after it appears. Welcome card: 60s with hover pause.
  useEffect(() => {
    if (!showPopup) return;

    if (popupVariant === 'content-updates') {
      const id = window.setTimeout(() => {
        setShowPopup(false);
        setPopupVariant(null);
      }, DIGEST_POPUP_MS);
      return () => window.clearTimeout(id);
    }

    accumulatedActiveRef.current = 0;
    lastTickRef.current = Date.now();
    hoverRef.current = false;

    const id = window.setInterval(() => {
      const now = Date.now();
      if (!hoverRef.current) {
        accumulatedActiveRef.current += now - lastTickRef.current;
        lastTickRef.current = now;
        if (accumulatedActiveRef.current >= POPUP_MAX_ACTIVE_MS) {
          welcomeVisibleRef.current = false;
          setShowPopup(false);
          setPopupVariant(null);
          tryRevealDigest();
        }
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [showPopup, popupVariant, tryRevealDigest]);

  if (!user || !showPopup || !popupVariant) {
    return null;
  }

  const handleDismiss = () => {
    if (popupVariant === 'content-updates') {
      setShowPopup(false);
      setPopupVariant(null);
      return;
    }
    welcomeVisibleRef.current = false;
    setShowPopup(false);
    setPopupVariant(null);
    tryRevealDigest();
  };
  const handleStartTour = () => {
    welcomeVisibleRef.current = false;
    setShowPopup(false);
    setPopupVariant(null);
    startTour();
  };
  const displayName =
    studentData?.student?.name?.trim() || user?.username || 'Student';
  const isPlacementPopup = popupVariant === 'placement';
  const isNoProfileWelcome = popupVariant === 'welcome-no-profile';
  const isContentUpdates = popupVariant === 'content-updates';
  const companySentence = formatPartOfCompanySentence(companyNames);

  if (isContentUpdates) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-digest-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          aria-label="Close updates"
          onClick={handleDismiss}
        />
        <div className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-theme bg-theme-card text-theme-primary shadow-2xl max-h-[min(92dvh,40rem)]">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-8 sm:p-7 sm:pb-8">
            <div className="flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-theme-accent sm:text-xs">
                  Fresh on the platform
                </p>
                <h3
                  id="content-digest-title"
                  className="mt-1 text-xl font-black tracking-tight text-theme-primary sm:text-3xl"
                >
                  Since your last visit
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-theme-secondary sm:text-lg">
                  New material is waiting for you:
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-md p-2 text-theme-muted transition hover:bg-theme-nav hover:text-theme-primary sm:p-1.5"
                aria-label="Close"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-1 max-h-[min(48dvh,18rem)] sm:max-h-none">
              {digestCompanies.map((item) => {
                const year = Number(item.year);
                const hasYear = Number.isInteger(year) && year > 0;
                const to = hasYear
                  ? `/companies/${item.companyId}?year=${year}`
                  : `/companies/${item.companyId}`;
                return (
                  <li
                    key={`${item.companyId}-${item.year || 'na'}`}
                    className="rounded-xl border border-theme bg-theme-hero px-3 py-3 sm:px-4 sm:py-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={to}
                        onClick={() => {
                          setShowPopup(false);
                          setPopupVariant(null);
                        }}
                        className="min-w-0 text-base font-extrabold leading-snug text-theme-accent hover:underline sm:text-xl"
                      >
                        {item.companyName || 'Company'}
                      </Link>
                      {hasYear ? (
                        <span className="shrink-0 rounded-full border border-theme bg-theme-card px-2.5 py-0.5 text-xs font-bold text-theme-secondary sm:text-sm">
                          {year}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-theme-secondary sm:text-base">
                      {item.summary}
                    </p>
                  </li>
                );
              })}
            </ul>
            {digestTruncated ? (
              <p className="mt-3 shrink-0 text-xs text-theme-muted sm:text-sm">
                Showing the latest companies. Check Company Stats for everything else.
              </p>
            ) : null}
            <div className="mt-4 flex shrink-0 justify-end sm:mt-6">
              <button
                type="button"
                onClick={handleDismiss}
                className="min-h-11 w-full rounded-xl border border-theme bg-theme-hero px-5 py-2.5 text-base font-bold text-theme-primary transition-colors hover:bg-theme-nav sm:min-h-0 sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 overflow-hidden bg-theme-hero"
            aria-hidden
          >
            <div className="digest-bottom-sweep h-full rounded-r-full bg-theme-accent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right max-w-md w-[92vw] sm:w-auto">
      <div
        className="relative rounded-2xl p-5 sm:p-6 border border-theme overflow-hidden backdrop-blur-xl"
        style={{
          boxShadow: 'var(--shadow-soft)',
          background:
            'linear-gradient(135deg, var(--bg-card), rgba(255,255,255,0.05))',
        }}
        onMouseEnter={() => {
          hoverRef.current = true;
        }}
        onMouseLeave={() => {
          hoverRef.current = false;
          lastTickRef.current = Date.now();
        }}
      >
        {/* 🌈 Accent Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-30"
            style={{
              background:
                'radial-gradient(circle, var(--accent), transparent 70%)',
            }}
          />
        </div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-extrabold text-theme-primary mb-1 tracking-tight">
              {isPlacementPopup ? (
                <>
                  Congratulations, {displayName}{' '}
                  <span className="inline-block animate-bounce">🎉</span>
                </>
              ) : isNoProfileWelcome ? (
                <>Hey {displayName}, Hope you are doing great</>
              ) : (
                <>Welcome {displayName}, hope you are doing great!</>
              )}
            </h3>

            {isPlacementPopup ? (
              <>
                <p className="text-theme-secondary text-sm mb-3 leading-relaxed">
                  Congrats on being part of{' '}
                  <span className="font-semibold text-theme-primary">
                    {companySentence}
                  </span>
                  .
                </p>
                {companyNames.length > 1 ? (
                  <div className="flex flex-wrap gap-2">
                    {companyNames.map((name, idx) => (
                      <span
                        key={`${name}-${idx}`}
                        className="px-3 py-1 text-xs font-semibold rounded-full border"
                        style={{
                          background:
                            'color-mix(in srgb, var(--accent) 22%, transparent)',
                          borderColor:
                            'color-mix(in srgb, var(--accent) 55%, transparent)',
                          color: 'var(--accent)',
                          boxShadow:
                            '0 0 0 1px color-mix(in srgb, var(--accent) 24%, transparent), 0 6px 14px color-mix(in srgb, var(--accent) 18%, transparent)',
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            {canStartTour && (
              <div className={isPlacementPopup ? "mt-4 pt-4 border-t border-theme" : "mt-4"}>
                {!isPlacementPopup && (
                  <p className="text-sm text-theme-secondary leading-relaxed mb-3">
                    Explore Student Corner, company stats, resources, and more with a quick walkthrough.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={handleStartTour}
                    className="inline-flex items-center gap-2 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <FaRoute className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {isRunning ? "Starting tour…" : "Start video tour"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="rounded-xl border border-theme bg-theme-card px-4 py-2 text-sm font-semibold text-theme-secondary hover:bg-theme-nav transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="text-theme-muted hover:text-theme-primary transition p-1 rounded-md hover:bg-theme-nav"
            aria-label="Dismiss"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementPopupWrapper;
