import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes, FaTrophy, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import PlacementForm from './PlacementForm';
import { companyAPI } from '../utils/api';

/** Placement flow must resolve the company by ID only (users_2026.companyId / JWT), never by name. */
function normalizeCompanyId(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object' && raw !== null && '$oid' in raw && raw.$oid) {
    return String(raw.$oid);
  }
  return String(raw);
}

function resolvePlacementCompanyId(studentData, authUser) {
  return (
    normalizeCompanyId(studentData?.companyId) ??
    normalizeCompanyId(authUser?.companyId) ??
    null
  );
}

const PlacementPopupWrapper = () => {
  const { user, studentData, refreshUser } = useAuth();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const hasCheckedRef = useRef(false);
  const lastResolvedCompanyIdRef = useRef(null);

  const resolvedStudentCompanyId = resolvePlacementCompanyId(studentData, user);

  // Allow re-check when companyId appears or changes (e.g. profile loaded after user, or DB migration).
  useEffect(() => {
    if (resolvedStudentCompanyId !== lastResolvedCompanyIdRef.current) {
      hasCheckedRef.current = false;
      lastResolvedCompanyIdRef.current = resolvedStudentCompanyId;
    }
  }, [resolvedStudentCompanyId]);
  
  // Check if user needs to fill form - PRIMARY CONDITION: fillForm === false
  useEffect(() => {
    const checkPlacementForm = async () => {
      // Don't show popup on auth callback route (during USN entry)
      if (location.pathname === '/auth/callback') {
        return;
      }
      
      // First check: Must have user and studentData
      if (!user || !studentData) {
        return;
      }
      
      // PRIMARY CONDITION: Check if fillForm is false
      // If fillForm is true, don't show popup
      if (user.fillForm === true) {
        setShowPopup(false);
        return;
      }
      
      // Check sessionStorage to prevent showing popup on every page refresh
      const userId = user.userId || user._id;
      const storageKey = `placementPopupShown_${userId}`;
      if (sessionStorage.getItem(storageKey) === 'true') {
        return;
      }
      
      // Prevent duplicate fetch/show cycles for the same resolved company id
      if (hasCheckedRef.current) {
        return;
      }
      hasCheckedRef.current = true;
      
      const studentCompanyId = resolvePlacementCompanyId(studentData, user);

      if (!studentCompanyId) {
        hasCheckedRef.current = false;
        console.warn(
          '📋 [PlacementPopup] No companyId on student profile or session; popup requires users_2026.companyId (name is not used).'
        );
        return;
      }

      console.log(`📋 [PlacementPopup] Resolved companyId: ${studentCompanyId}`);

      try {
        const companyRes = await companyAPI.getCompany(studentCompanyId);
        const company = companyRes.data;

        if (company && company._id) {
          console.log(`🎯 [PlacementPopup] Company loaded by ID: ${company._id} (${company.name})`);
          setCompanyId(company._id);
          setCompanyName(company.name);
          setShowPopup(true);
          // Mark as shown for this session
          sessionStorage.setItem(storageKey, 'true');
        } else {
          hasCheckedRef.current = false;
          console.warn(`❌ [PlacementPopup] No company found for ID: ${studentCompanyId}`);
        }
      } catch (err) {
        hasCheckedRef.current = false;
        console.error('PlacementPopupWrapper: Error fetching company by ID:', err);
      }
    };

    checkPlacementForm();
  }, [user, studentData, location.pathname, resolvedStudentCompanyId]);
  
  // Reset check flag when user changes (new login)
  useEffect(() => {
    hasCheckedRef.current = false;
    setShowPopup(false);
    setShowForm(false);
  }, [user?.userId || user?._id]);
  
  // Early return if no user or studentData
  if (!user || !studentData) {
    return null;
  }

  // PRIMARY CONDITION: Only show if fillForm is false
  if (user.fillForm === true) {
    return null;
  }

  // Don't show if company not found
  if (!companyId || !companyName) {
    return null;
  }

  const handleDismiss = () => {
    setShowPopup(false);
    // Popup can be dismissed, but will show again on next login if fillForm is still false
  };

  const handleFillForm = () => {
    setShowPopup(false);
    setShowForm(true);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    // Refresh user data to get updated fillForm status
    await refreshUser();
  };

  const handleFormClose = () => {
    setShowForm(false);
  };
  
  return (
    <>
      {/* Congratulations Popup from top right */}
      {showPopup && (
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
                <p className="text-theme-secondary text-sm mb-3 leading-relaxed">
                  Congrats on getting placed in{' '}
                  <span className="font-semibold text-theme-accent">{companyName}</span>! Fill out a short form to get
                  access to the alumni network in your company and get recognised in the leaderboard.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleFillForm}
                    className="px-4 py-2 bg-theme-accent text-[var(--success-foreground)] font-semibold rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  >
                    Fill Form
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-theme-card border border-theme text-theme-primary font-semibold rounded-lg transition-colors text-sm hover:bg-theme-nav focus:outline-none focus:ring-2 focus:ring-theme-accent"
                  >
                    Maybe Later
                  </button>
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
      )}

      {/* Form Modal */}
      {showForm && (
        <PlacementForm
          companyName={companyName}
          companyId={companyId}
          onSuccess={handleFormSuccess}
          onClose={handleFormClose}
          isRequired={false}
        />
      )}
    </>
  );
};

export default PlacementPopupWrapper;

