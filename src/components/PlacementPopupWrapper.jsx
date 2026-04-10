import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes, FaTrophy, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';

const PLACEMENT_POPUP_FRESH_LOGIN_KEY = 'placementPopupFreshLogin';

function normalizeCompanyName(raw) {
  if (raw == null) return '';
  return String(raw).trim();
}

/** Names from API placementCompanies ({ companyName }) or legacy shapes; deduped. */
function placementCompanyNamesFromProfile(studentData) {
  const items = studentData?.placementCompanies;
  if (Array.isArray(items) && items.length > 0) {
    const seen = new Set();
    const names = [];
    for (const item of items) {
      const name = normalizeCompanyName(item?.companyName ?? item?.Company ?? item?.company);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
    return names;
  }
  const single = normalizeCompanyName(studentData?.Company ?? studentData?.company);
  return single ? [single] : [];
}

const PlacementPopupWrapper = () => {
  const { user, studentData } = useAuth();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const hasCheckedRef = useRef(false);

  const companyNames = useMemo(
    () => (studentData ? placementCompanyNamesFromProfile(studentData) : []),
    [studentData]
  );

  const placementNamesKey = useMemo(() => companyNames.join('\u0001'), [companyNames]);

  useEffect(() => {
    hasCheckedRef.current = false;
  }, [placementNamesKey]);

  useEffect(() => {
    const maybeShowPopup = () => {
      if (location.pathname === '/auth/callback') {
        return;
      }

      if (!user || !studentData) {
        return;
      }

      if (user.fillForm === true) {
        setShowPopup(false);
        return;
      }

      if (sessionStorage.getItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY) !== '1') {
        return;
      }

      if (hasCheckedRef.current) {
        return;
      }
      hasCheckedRef.current = true;
      sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);

      const names = placementCompanyNamesFromProfile(studentData);
      if (names.length === 0) {
        return;
      }

      setShowPopup(true);
    };

    maybeShowPopup();
  }, [user, studentData, location.pathname, placementNamesKey]);

  useEffect(() => {
    hasCheckedRef.current = false;
    setShowPopup(false);
  }, [user?.userId || user?._id]);

  if (!user || !studentData) {
    return null;
  }

  if (user.fillForm === true) {
    return null;
  }

  if (!companyNames.length) {
    return null;
  }

  if (!showPopup) {
    return null;
  }

  const handleDismiss = () => {
    setShowPopup(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right max-w-md px-2 sm:px-0">
      <div
        className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 backdrop-blur-md"
        style={{ boxShadow: 'var(--shadow-soft)' }}
      >
        <div className="flex items-start gap-3">
          <div className="bg-theme-accent rounded-full p-2 flex-shrink-0 shadow-sm">
            <FaTrophy className="w-5 h-5 text-[var(--success-foreground)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-theme-primary mb-2 flex items-center gap-2">
              <FaCheckCircle className="text-theme-accent flex-shrink-0" aria-hidden />
              Congratulations!
            </h3>
            <p className="text-theme-secondary text-sm mb-2 leading-relaxed">
              congrats on cracking the interviews of the following companies:
            </p>
            <div className="text-theme-primary text-sm leading-relaxed space-y-1">
              {companyNames.map((name, idx) => (
                <p key={`${name}-${idx}`}>• {name}</p>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-theme-muted hover:text-theme-primary transition-colors p-1 flex-shrink-0 rounded-md hover:bg-theme-nav"
            title="Close"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementPopupWrapper;
