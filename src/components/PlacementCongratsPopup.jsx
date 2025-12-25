import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrophy, FaCheckCircle } from 'react-icons/fa';
import PlacementForm from './PlacementForm';
import { companyAPI } from '../utils/api';

const PlacementCongratsPopup = ({ studentData, userId }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState(null);
  const [dismissCount, setDismissCount] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    // Check if user is placed and get company info
    const checkPlacement = async () => {
      if (!studentData || !userId) return;

      // Check various possible field names for placed company
      const placedCompanyField = studentData.Company || 
                                 studentData['Placed Company'] || 
                                 studentData['Company Name'] ||
                                 studentData.company ||
                                 studentData.placedCompany ||
                                 studentData.PlacedCompany;

      if (!placedCompanyField) return;

      // Check if form has already been submitted for this company
      try {
        // Fetch all companies to find the one matching the placed company
        const companiesRes = await companyAPI.getAllCompanies();
        const companies = companiesRes.data || [];
        
        // Find company by name (case-insensitive)
        const company = companies.find(c => 
          c.name && c.name.toLowerCase().trim() === placedCompanyField.toString().toLowerCase().trim()
        );

        if (company) {
          const submittedKey = `placementFormSubmitted_${company._id}`;
          const isSubmitted = localStorage.getItem(submittedKey) === 'true';
          
          if (!isSubmitted) {
            setCompanyName(company.name);
            setCompanyId(company._id);
            
            // Check dismiss count
            const dismissKey = `placementPopupDismiss_${userId}_${company._id}`;
            const storedDismissCount = parseInt(localStorage.getItem(dismissKey) || '0', 10);
            setDismissCount(storedDismissCount);
            
            // Show popup if dismiss count < 3
            if (storedDismissCount < 3) {
              setShowPopup(true);
            } else {
              // 4th time - force show form
              setShowForm(true);
            }
          } else {
            setFormSubmitted(true);
          }
        }
      } catch (err) {
        console.error('Error checking placement:', err);
      }
    };

    checkPlacement();
  }, [studentData, userId]);

  const handleDismiss = () => {
    if (dismissCount < 3) {
      const newCount = dismissCount + 1;
      setDismissCount(newCount);
      const dismissKey = `placementPopupDismiss_${userId}_${companyId}`;
      localStorage.setItem(dismissKey, newCount.toString());
      setShowPopup(false);
    }
  };

  const handleFillForm = () => {
    setShowPopup(false);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setFormSubmitted(true);
  };

  const handleFormClose = () => {
    if (dismissCount >= 3) {
      // Can't close on 4th time
      return;
    }
    setShowForm(false);
  };

  if (formSubmitted || !companyName || !companyId) {
    return null;
  }

  return (
    <>
      {/* Popup from top right */}
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
                  {dismissCount < 3 && (
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      Maybe Later
                    </button>
                  )}
                </div>
                {dismissCount > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    You can dismiss this {3 - dismissCount} more time{3 - dismissCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {dismissCount < 3 && (
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white transition-colors p-1 flex-shrink-0"
                  title="Close"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
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
          isRequired={dismissCount >= 3}
        />
      )}
    </>
  );
};

export default PlacementCongratsPopup;

