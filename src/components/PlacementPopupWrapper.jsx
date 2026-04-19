import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { BETA_JOIN_FORM_URL } from '../utils/constants';

const PLACEMENT_POPUP_FRESH_LOGIN_KEY = 'placementPopupFreshLogin';
const COMPANY_FIELDS = [
  'Summer internship Company name',
  'FTE Company name',
  'Only internship Company name',
  'FTE and internship Company name',
  '6 months Internship Company name',
  'company1',
  'company2',
  'company3',
  'company4',
  'company5',
  'Company',
  'company',
  'primaryCompanyName',
];
/** Max time the popup stays open while not hovering the card (hover pauses the timer). */
const POPUP_MAX_ACTIVE_MS = 60_000;

function normalizeCompanyName(raw) {
  if (raw == null) return '';
  return String(raw).trim();
}

function placementCompanyNamesFromProfile(studentData) {
  const directKeys = studentData && typeof studentData === 'object'
    ? Object.keys(studentData).filter((key) => /company name/i.test(key))
    : [];
  const candidateFields = [...new Set([...COMPANY_FIELDS, ...directKeys])];
  const directCompanies = candidateFields
    .map((fieldName) => normalizeCompanyName(studentData?.[fieldName]))
    .filter(Boolean);

  if (directCompanies.length > 0) {
    return Array.from(new Set(directCompanies.map((name) => name.toLowerCase()))).map(
      (normalizedName) =>
        directCompanies.find((name) => name.toLowerCase() === normalizedName) || ''
    ).filter(Boolean);
  }

  const items = studentData?.placementCompanies;

  if (Array.isArray(items) && items.length > 0) {
    const seen = new Set();
    const names = [];

    for (const item of items) {
      const name = normalizeCompanyName(
        item?.companyName ?? item?.Company ?? item?.company
      );

      if (!name) continue;

      const key = name.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      names.push(name);
    }

    return names;
  }

  const single = normalizeCompanyName(
    studentData?.Company ?? studentData?.company
  );

  return single ? [single] : [];
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

      if (user.fillForm === true) {
        setShowPopup(false);
        return;
      }

      if (
        sessionStorage.getItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY) !== '1'
      ) {
        return;
      }

      if (hasCheckedRef.current) return;

      if (user.isBetaListed === true) {
        const names = placementCompanyNamesFromProfile(studentData);
        if (!studentData || !names.length) return;
        hasCheckedRef.current = true;
        sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);
        setPopupVariant('placement');
      } else {
        hasCheckedRef.current = true;
        sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);
        setPopupVariant('beta-invite');
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

  if (!user || user.fillForm === true || !showPopup || !popupVariant) {
    return null;
  }

  const handleDismiss = () => setShowPopup(false);
  const displayName = studentData?.Name?.trim() || user?.username || 'Student';
  const isPlacementPopup = popupVariant === 'placement';

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right max-w-md w-[92vw] sm:w-auto">
      <div
        className="relative rounded-2xl p-5 sm:p-6 border border-theme overflow-hidden backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]"
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
          

          {/* 📄 Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-extrabold text-theme-primary mb-1 tracking-tight">
              {isPlacementPopup ? (
                <>
                  Congratulations {displayName}{' '}
                  <span className="inline-block animate-bounce">🎉</span>
                </>
              ) : (
                <>Hey {user?.username || 'there'}, part of 2026 Computer science?</>
              )}
            </h3>

            <p className="text-theme-secondary text-sm mb-3">
              {isPlacementPopup
                ? 'for successfully getting the opportunity to be part of:'
                : 'Fill the beta access form to join the platform. After submitting the form, wait a few seconds and then log out and sign in again to activate your beta access. If you are a non-CSE student, we are extending access to your branch soon.'}
            </p>

            {!isPlacementPopup ? (
              <a
                href={BETA_JOIN_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="mb-3 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-theme-accent/40 bg-theme-hero px-4 py-2.5 text-sm font-semibold text-theme-accent shadow-sm transition-opacity hover:opacity-90"
              >
                Fill signup form
                <FaExternalLinkAlt className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : null}

            {isPlacementPopup ? (
              <div className="flex flex-wrap gap-2">
                {companyNames.map((name, idx) => (
                  <span
                    key={`${name}-${idx}`}
                    className="px-3 py-1 text-xs rounded-full border transition hover:scale-105"
                    style={{
                      background:
                        'color-mix(in srgb, var(--accent) 12%, transparent)',
                      borderColor:
                        'color-mix(in srgb, var(--accent) 35%, transparent)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* ❌ Close */}
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