import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FaArrowLeft, FaUser, FaIdCard, FaGraduationCap } from 'react-icons/fa';

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { studentData } = useAuth();

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#302C2C' }}>
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-indigo-400 mb-4">No Student Data Available</h2>
          <p className="text-slate-300 mb-6">Student profile data is not available. Please contact support.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Format key for display (convert camelCase/PascalCase to readable format)
  const formatKey = (key) => {
    // Skip MongoDB internal fields
    if (key === '_id' || key === '__v') return null;
    
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

  // Group fields into sections for better organization
  const personalInfoFields = ['USN', 'Name', 'Email', 'Phone', 'DOB', 'Gender'];
  const academicFields = ['Branch', 'Semester', 'CGPA', 'Year', 'Section'];
  const otherFields = Object.keys(studentData).filter(
    key => !['_id', '__v'].includes(key) && 
    !personalInfoFields.some(f => key.toLowerCase().includes(f.toLowerCase())) &&
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
      <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-2 pb-3 border-b border-slate-700 last:border-0">
        <span className="text-slate-400 font-medium text-sm sm:text-base min-w-[150px] sm:min-w-[180px]">
          {displayKey}:
        </span>
        <span className="text-white text-sm sm:text-base flex-1 break-words">
          {getDisplayValue(value)}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#302C2C' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 rounded-t-xl flex items-center gap-3">
            <div className="bg-indigo-600 rounded-full p-3">
              <FaUser className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-400">Student Profile</h1>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Personal Information Section */}
          {Object.keys(studentData).some(key => getFieldCategory(key) === 'personal') && (
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaIdCard className="text-indigo-400 text-xl" />
                <h2 className="text-xl font-semibold text-indigo-400">Personal Information</h2>
              </div>
              <div className="space-y-3">
                {Object.entries(studentData)
                  .filter(([key]) => getFieldCategory(key) === 'personal')
                  .map(([key, value]) => renderField(key, value))
                }
              </div>
            </div>
          )}

          {/* Academic Information Section */}
          {Object.keys(studentData).some(key => getFieldCategory(key) === 'academic') && (
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaGraduationCap className="text-indigo-400 text-xl" />
                <h2 className="text-xl font-semibold text-indigo-400">Academic Information</h2>
              </div>
              <div className="space-y-3">
                {Object.entries(studentData)
                  .filter(([key]) => getFieldCategory(key) === 'academic')
                  .map(([key, value]) => renderField(key, value))
                }
              </div>
            </div>
          )}

          {/* Other Information Section */}
          {otherFields.length > 0 && (
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-indigo-400 mb-4">Additional Information</h2>
              <div className="space-y-3">
                {otherFields.map(key => renderField(key, studentData[key]))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;

