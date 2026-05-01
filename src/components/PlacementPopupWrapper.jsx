import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';

const PLACEMENT_POPUP_FRESH_LOGIN_KEY = 'placementPopupFreshLogin';
/** Max time the popup stays open while not hovering the card (hover pauses the timer). */
const POPUP_MAX_ACTIVE_MS = 60_000;

function normalizeCompanyName(raw) {
  if (raw == null) return '';
  return String(raw).trim();
}

function placementCompanyNamesFromProfile(studentData) {
  const placements = Array.isArray(studentData?.placements) ? studentData.placements : [];
  const seen = new Set();
  const names = [];

  for (const placement of placements) {
    const name = normalizeCompanyName(placement?.companyPlaced);
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
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

      /* Wait until profile payload is loaded after OAuth redirect */
      if (!studentData) return;

      const names = placementCompanyNamesFromProfile(studentData);
      hasCheckedRef.current = true;
      sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);

      setPopupVariant(names.length > 0 ? 'placement' : 'welcome');
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
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-extrabold text-theme-primary mb-1 tracking-tight">
              {isPlacementPopup ? (
                <>
                  Congrats {displayName}{' '}
                  <span className="inline-block animate-bounce">🎉</span>
                </>
              ) : (
                <>Welcome {displayName} , Hope you are doing great !!</>
              )}
            </h3>

            {isPlacementPopup ? (
              <>
                <p className="text-theme-secondary text-sm mb-3">
                  Congrats on being part of:
                </p>
                <div className="flex flex-wrap gap-2">
                  {companyNames.map((name, idx) => (
                    <span
                      key={`${name}-${idx}`}
                      className="px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
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