import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FaArrowLeft, FaUser, FaIdCard, FaGraduationCap } from 'react-icons/fa';
import { studentAPI } from '../utils/api';

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    studentAPI.getProfile()
      .then((response) => {
        setProfileData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Profile not found. Contact placement team.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-app">
        <h2 className="text-2xl font-bold text-theme-primary mb-4">Loading profile...</h2>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-app">
        <div className="bg-theme-card border border-theme rounded-xl p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-theme-primary mb-4">No Student Data Available</h2>
          <p className="text-theme-secondary mb-6">{error || "Student profile data is not available. Please contact support."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-theme-card border border-theme back-link-theme font-semibold rounded-lg transition-colors hover:bg-theme-card-hover"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Format key for display (convert camelCase/PascalCase to readable format)
  const formatKey = (key) => {
    // Replace underscores and convert to title case
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Get display value
  const getDisplayValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Filter keys as requested
  const validKeys = Object.keys(profileData).filter(key => key && key !== "_id" && key !== "__v");

  // Group fields into sections for better organization
  const personalInfoFields = ['USN', 'Name', 'Email', 'Phone', 'DOB', 'Gender'];
  const academicFields = ['Branch', 'Semester', 'CGPA', 'Year', 'Section'];
  
  const otherFields = validKeys.filter(
    key => !personalInfoFields.some(f => key.toLowerCase().includes(f.toLowerCase())) &&
    !academicFields.some(f => key.toLowerCase().includes(f.toLowerCase()))
  );

  const getFieldCategory = (key) => {
    const lowerKey = key.toLowerCase();
    if (personalInfoFields.some(f => lowerKey.includes(f.toLowerCase()))) return 'personal';
    if (academicFields.some(f => lowerKey.includes(f.toLowerCase()))) return 'academic';
    return 'other';
  };

  const renderField = (key, value) => {
    const displayKey = formatKey(key);
    if (!displayKey) return null;

    return (
      <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-2 pb-3 border-b border-theme last:border-0">
        <span className="text-theme-secondary font-medium text-sm sm:text-base min-w-[150px] sm:min-w-[180px]">
          {displayKey}:
        </span>
        <span className="text-theme-primary font-medium text-sm sm:text-base flex-1 break-words">
          {getDisplayValue(value)}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-theme-app overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center back-link-theme text-sm sm:text-base mb-4 hover:opacity-80 transition-opacity"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <div className="bg-theme-card border border-theme px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`bg-theme-accent rounded-full p-3 ${user?.picture ? 'hidden' : ''}`}>
              <FaUser className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary">Student Profile</h1>
              {user?.username && <span className="text-theme-secondary text-sm">{user.username}</span>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Personal Information Section */}
          {validKeys.some(key => getFieldCategory(key) === 'personal') && (
            <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-4 border-b border-theme pb-2">
                <FaIdCard className="text-theme-accent text-xl" />
                <h2 className="text-xl font-semibold text-theme-primary">Personal Information</h2>
              </div>
              <div className="space-y-3 pt-2">
                {validKeys
                  .filter((key) => getFieldCategory(key) === 'personal')
                  .map((key) => renderField(key, profileData[key]))
                }
              </div>
            </div>
          )}

          {/* Academic Information Section */}
          {validKeys.some(key => getFieldCategory(key) === 'academic') && (
            <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-4 border-b border-theme pb-2">
                <FaGraduationCap className="text-theme-accent text-xl" />
                <h2 className="text-xl font-semibold text-theme-primary">Academic Information</h2>
              </div>
              <div className="space-y-3 pt-2">
                {validKeys
                  .filter((key) => getFieldCategory(key) === 'academic')
                  .map((key) => renderField(key, profileData[key]))
                }
              </div>
            </div>
          )}

          {/* Other Information Section */}
          {otherFields.length > 0 && (
            <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 shadow-sm transition-colors">
              <div className="mb-4 border-b border-theme pb-2">
                <h2 className="text-xl font-semibold text-theme-primary">Additional Information</h2>
              </div>
              <div className="space-y-3 pt-2">
                {otherFields.map(key => renderField(key, profileData[key]))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
