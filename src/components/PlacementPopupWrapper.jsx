import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes, FaTrophy } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';

const PLACEMENT_POPUP_FRESH_LOGIN_KEY = 'placementPopupFreshLogin';

function normalizeCompanyName(raw) {
  if (raw == null) return '';
  return String(raw).trim();
}

function placementCompanyNamesFromProfile(studentData) {
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
  const hasCheckedRef = useRef(false);

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
    const maybeShowPopup = () => {
      if (location.pathname === '/auth/callback') return;
      if (!user || !studentData) return;

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

      hasCheckedRef.current = true;
      sessionStorage.removeItem(PLACEMENT_POPUP_FRESH_LOGIN_KEY);

      const names = placementCompanyNamesFromProfile(studentData);
      if (!names.length) return;

      setShowPopup(true);

      // Optional auto-dismiss
      setTimeout(() => setShowPopup(false), 6000);
    };

    maybeShowPopup();
  }, [user, studentData, location.pathname, placementNamesKey]);

  useEffect(() => {
    hasCheckedRef.current = false;
    setShowPopup(false);
  }, [user?.userId || user?._id]);

  if (
    !user ||
    !studentData ||
    user.fillForm === true ||
    !companyNames.length ||
    !showPopup
  ) {
    return null;
  }

  const handleDismiss = () => setShowPopup(false);

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right max-w-md w-[92vw] sm:w-auto">
      <div
        className="relative rounded-2xl p-5 sm:p-6 border border-theme overflow-hidden backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]"
        style={{
          boxShadow: 'var(--shadow-soft)',
          background:
            'linear-gradient(135deg, var(--bg-card), rgba(255,255,255,0.05))',
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
              Congratulations{' '}
              <span className="inline-block animate-bounce">🎉</span>
            </h3>

            <p className="text-theme-secondary text-sm mb-3">
              You’ve cracked interviews at:
            </p>

            {/* 🏷️ Company Pills */}
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