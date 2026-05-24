import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';

const PLACEMENT_POPUP_FRESH_LOGIN_KEY = 'placementPopupFreshLogin';
const LOGIN_PROFILE_STATUS_KEY = 'loginProfileStatus';
const LOGIN_PROFILE_STATUS_HAS_PROFILE = 'has_profile';
const LOGIN_PROFILE_STATUS_NO_PROFILE = 'no_profile';
/** Max time the popup stays open while not hovering the card (hover pauses the timer). */
const POPUP_MAX_ACTIVE_MS = 60_000;

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

const PlacementPopupWrapper = () => {
  const { user, studentData } = useAuth();
  const location = useLocation();

  const [showPopup, setShowPopup] = useState(false);
  const [popupVariant, setPopupVariant] = useState(null);
  const hasCheckedRef = useRef(false);
  const hoverRef = useRef(false);
  const lastTickRef = useRef(0);
  const accumulatedActiveRef = useRef(0);

  const companyNames = useMemo(
    () => (studentData ? placementCompanyNamesFromProfile(studentData) : []),
    [studentData]
  );

  const placementNamesKey = useMemo(
    () => companyNames.join('\u0001'),
    [companyNames]
  );

  useEffect(() => {
    hasCheckedRef.current = false;
  }, [placementNamesKey]);

  useEffect(() => {
    hasCheckedRef.current = false;
    setShowPopup(false);
    setPopupVariant(null);
  }, [user?.userId || user?._id, location.pathname]);

  useEffect(() => {
    const maybeShowPopup = () => {
      if (location.pathname === '/auth/callback') return;
      if (!user) return;

      if (
        sessionStorage.getItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY) !== '1'
      ) {
        return;
      }

      if (hasCheckedRef.current) return;
      const profileStatus = sessionStorage.getItem(LOGIN_PROFILE_STATUS_KEY);
      if (!profileStatus) return;

      if (profileStatus === LOGIN_PROFILE_STATUS_HAS_PROFILE && !studentData) {
        return;
      }

      const names =
        profileStatus === LOGIN_PROFILE_STATUS_HAS_PROFILE
          ? placementCompanyNamesFromProfile(studentData)
          : [];
      hasCheckedRef.current = true;
      sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);
      sessionStorage.removeItem(LOGIN_PROFILE_STATUS_KEY);

      if (names.length > 0) {
        setPopupVariant('placement');
      } else if (profileStatus === LOGIN_PROFILE_STATUS_NO_PROFILE) {
        setPopupVariant('welcome-no-profile');
      } else {
        setPopupVariant('welcome');
      }
      setShowPopup(true);
    };

    maybeShowPopup();
  }, [user, studentData, location.pathname, placementNamesKey]);

  // Auto-dismiss after POPUP_MAX_ACTIVE_MS of non-hover time, or when user closes manually.
  useEffect(() => {
    if (!showPopup) return;

    accumulatedActiveRef.current = 0;
    lastTickRef.current = Date.now();
    hoverRef.current = false;

    const id = window.setInterval(() => {
      const now = Date.now();
      if (!hoverRef.current) {
        accumulatedActiveRef.current += now - lastTickRef.current;
        lastTickRef.current = now;
        if (accumulatedActiveRef.current >= POPUP_MAX_ACTIVE_MS) {
          setShowPopup(false);
        }
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [showPopup]);

  if (!user || !showPopup || !popupVariant) {
    return null;
  }

  const handleDismiss = () => setShowPopup(false);
  const displayName =
    studentData?.student?.name?.trim() || user?.username || 'Student';
  const isPlacementPopup = popupVariant === 'placement';
  const isNoProfileWelcome = popupVariant === 'welcome-no-profile';
  const companySentence = formatPartOfCompanySentence(companyNames);

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
          </div>

          <button
            onClick={handleDismiss}
            className="text-theme-muted hover:text-theme-primary transition p-1 rounded-md hover:bg-theme-nav"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementPopupWrapper;