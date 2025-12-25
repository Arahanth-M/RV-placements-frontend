import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes, FaTrophy, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import PlacementForm from './PlacementForm';
import { companyAPI } from '../utils/api';

const PlacementPopupWrapper = () => {
  const { user, studentData, refreshUser } = useAuth();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const hasCheckedRef = useRef(false);
  
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
      
      // Prevent multiple checks on the same render cycle
      if (hasCheckedRef.current) {
        return;
      }
      
      // If fillForm is false or undefined, proceed to show popup
      // Wait 10 seconds after login before showing popup
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Mark as checked to prevent duplicate checks
      hasCheckedRef.current = true;
      
      // Get placed company from student data
      const placedCompanyField = studentData.Company || 
                                 studentData['Placed Company'] || 
                                 studentData['Company Name'] ||
                                 studentData.company ||
                                 studentData.placedCompany ||
                                 studentData.PlacedCompany;

      if (!placedCompanyField) {
        return;
      }

      try {
        // Fetch companies to find the one matching the placed company
        const companiesRes = await companyAPI.getAllCompanies();
        const companies = companiesRes.data || [];
        
        // Find company by name (case-insensitive)
        const company = companies.find(c => 
          c.name && c.name.toLowerCase().trim() === placedCompanyField.toString().toLowerCase().trim()
        );

        if (company) {
          setCompanyId(company._id);
          setCompanyName(company.name);
          setShowPopup(true);
        }
      } catch (err) {
        console.error('PlacementPopupWrapper: Error checking placement form:', err);
      }
    };

    checkPlacementForm();
  }, [user, studentData, location.pathname]);
  
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
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right max-w-md">
          <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl shadow-2xl p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-600 rounded-full p-2 flex-shrink-0">
                <FaTrophy className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
                  <FaCheckCircle />
                  Congratulations!
                </h3>
                <p className="text-slate-300 text-sm mb-3">
                  Congrats on getting placed in <span className="font-semibold text-indigo-400">{companyName}</span>! 
                  Fill out a short form to get access to the alumni network in your company and get recognised in the leaderboard.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleFillForm}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Fill Form
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors p-1 flex-shrink-0"
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

