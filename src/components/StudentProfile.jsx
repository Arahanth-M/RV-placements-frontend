import React from 'react';
import { FaTimes, FaUser, FaIdCard, FaGraduationCap } from 'react-icons/fa';

const StudentProfile = ({ studentData, onClose }) => {
  if (!studentData) {
    return null;
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 rounded-full p-2">
              <FaUser className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-indigo-400">Student Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            title="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-6">
            {/* Personal Information Section */}
            {Object.keys(studentData).some(key => getFieldCategory(key) === 'personal') && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaIdCard className="text-indigo-400" />
                  <h3 className="text-lg font-semibold text-indigo-400">Personal Information</h3>
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
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaGraduationCap className="text-indigo-400" />
                  <h3 className="text-lg font-semibold text-indigo-400">Academic Information</h3>
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
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-indigo-400 mb-4">Additional Information</h3>
                <div className="space-y-3">
                  {otherFields.map(key => renderField(key, studentData[key]))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;

