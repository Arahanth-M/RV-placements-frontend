import React, { useState } from 'react';
import { studentAPI } from '../utils/api';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

const USNEntry = ({ onConfirm, onCancel, googleUsername }) => {
  const [usn, setUsn] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleUSNSubmit = async (e) => {
    e.preventDefault();
    
    if (!usn.trim()) {
      setError('Please enter your USN');
      return;
    }

    setLoading(true);
    setError('');
    setStudentData(null);

    try {
      const response = await studentAPI.getStudentByUSN(usn.trim());
      if (response.data) {
        // Get student name from fetched data
        const studentName = response.data.Name || 
                           response.data.name || 
                           response.data['Student Name'] || 
                           '';
        
        // Normalize names for comparison (trim, lowercase)
        const normalizeName = (name) => {
          if (!name) return '';
          return name.trim().toLowerCase().replace(/\s+/g, ' ');
        };
        
        const normalizedStudentName = normalizeName(studentName);
        const normalizedGoogleName = normalizeName(googleUsername);
        
        // Check if names match
        if (normalizedStudentName && normalizedGoogleName && 
            normalizedStudentName !== normalizedGoogleName) {
          setError(`The USN you entered belongs to "${studentName}", but you logged in as "${googleUsername}". Please enter the correct USN that matches your Google account.`);
          setStudentData(null);
          setShowConfirmation(false);
          return;
        }
        
        // Names match or Google username not available - proceed
        setStudentData(response.data);
        setShowConfirmation(true);
      } else {
        setError('Student data not found. Please check your USN and try again.');
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      if (err.response?.status === 404) {
        setError('Student not found with the provided USN. Please check your USN and try again.');
      } else {
        setError('Failed to fetch student data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (studentData) {
      onConfirm(studentData);
    }
  };

  const handleReenter = () => {
    setUsn('');
    setStudentData(null);
    setShowConfirmation(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-indigo-400 mb-6">
            Enter Your USN
          </h2>

          {!showConfirmation ? (
            <form onSubmit={handleUSNSubmit} className="space-y-6">
              <div>
                <label htmlFor="usn" className="block text-sm font-medium text-slate-300 mb-2">
                  University Serial Number (USN)
                </label>
                <input
                  type="text"
                  id="usn"
                  value={usn}
                  onChange={(e) => {
                    setUsn(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="e.g., 1RV22CS001"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg 
                           text-white placeholder-slate-400 focus:outline-none 
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 
                           text-white font-semibold rounded-lg transition-colors 
                           disabled:bg-slate-700 disabled:cursor-not-allowed 
                           flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 
                             text-white font-semibold rounded-lg transition-colors 
                             disabled:bg-slate-800 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-indigo-400 mb-4">
                  Please verify and approve your details:
                </h3>
                <div className="space-y-4">
                  {/* Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-slate-700">
                    <span className="text-slate-400 font-medium text-sm sm:text-base min-w-[150px]">
                      Name:
                    </span>
                    <span className="text-white text-sm sm:text-base font-semibold">
                      {studentData.Name || studentData.name || studentData['Student Name'] || 'N/A'}
                    </span>
                  </div>

                  {/* USN */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-slate-700">
                    <span className="text-slate-400 font-medium text-sm sm:text-base min-w-[150px]">
                      USN:
                    </span>
                    <span className="text-white text-sm sm:text-base font-semibold">
                      {studentData.USN || studentData.usn || usn.toUpperCase()}
                    </span>
                  </div>

                  {/* Company */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-slate-700">
                    <span className="text-slate-400 font-medium text-sm sm:text-base min-w-[150px]">
                      Company:
                    </span>
                    <span className="text-white text-sm sm:text-base font-semibold">
                      {studentData.Company || 
                       studentData['Placed Company'] || 
                       studentData['Company Name'] ||
                       studentData.company ||
                       studentData.placedCompany ||
                       'Not Placed'}
                    </span>
                  </div>

                  {/* CTC */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-slate-700">
                    <span className="text-slate-400 font-medium text-sm sm:text-base min-w-[150px]">
                      CTC:
                    </span>
                    <span className="text-white text-sm sm:text-base font-semibold">
                      {studentData.CTC || 
                       studentData.ctc || 
                       studentData['CTC (LPA)'] ||
                       studentData['Package'] ||
                       'N/A'}
                    </span>
                  </div>

                  {/* Type of Offer */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-slate-700 last:border-0">
                    <span className="text-slate-400 font-medium text-sm sm:text-base min-w-[150px]">
                      Type of Offer:
                    </span>
                    <span className="text-white text-sm sm:text-base font-semibold">
                      {studentData['Type of Offer'] || 
                       studentData['Offer Type'] ||
                       studentData.type ||
                       studentData['Type'] ||
                       'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4 mb-4">
                <p className="text-slate-300 text-sm">
                  <strong className="text-indigo-400">Note:</strong> Please verify the above details carefully. 
                  Once approved, your profile will be saved and you'll be able to access the platform.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 
                           text-white font-semibold rounded-lg transition-colors 
                           flex items-center justify-center gap-2"
                >
                  <FaCheck className="mr-1" />
                  Approve & Save Profile
                </button>
                <button
                  onClick={handleReenter}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 
                           text-white font-semibold rounded-lg transition-colors 
                           flex items-center justify-center gap-2"
                >
                  <FaTimes className="mr-1" />
                  Re-enter USN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default USNEntry;

