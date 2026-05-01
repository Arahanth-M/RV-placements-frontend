import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FaArrowLeft, FaUser, FaIdCard, FaGraduationCap, FaBuilding } from 'react-icons/fa';
import { studentAPI } from '../utils/api';

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    studentAPI
      .getProfile()
      .then((response) => {
        setProfileData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        const status = err?.response?.status;
        const serverMsg =
          err?.response?.data?.message || err?.response?.data?.error;
        if (status === 403) {
          setError(
            serverMsg ||
              "Access restricted. Your account may not have beta access yet."
          );
        } else if (status === 404) {
          setError(
            serverMsg ||
              "No roster row found for your login email in the placement database. Contact the placement team."
          );
        } else {
          setError(
            serverMsg ||
              "Could not load profile. Try logging out and back in, or contact support."
          );
        }
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
    const spaced = String(key || "")
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .trim();

    if (!spaced) return '';

    return spaced
      .split(/\s+/)
      .map((word) => {
        // Preserve acronyms like USN, CGPA, DOB.
        if (/^[A-Z0-9]{2,}$/.test(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const unwrapDisplayString = (s) => {
    if (typeof s !== 'string') return s;
    let t = s.trim();
    if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
      t = t.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    return t;
  };

  // Get display value
  const getDisplayValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(unwrapDisplayString(value));
  };

  // Never show internal / redundant fields in the profile UI
  // Do not list "company" here: normalizeProfileKey("Company") === "company" and would hide the real company field.
  const hiddenProfileKeys = new Set([
    "companyid",
    "placementcompanies",
    "primarycompanyname",
  ]);
  const normalizeProfileKey = (key) =>
    String(key || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const isHiddenProfileKey = (key) => {
    if (key === "company") return true; // legacy lowercase duplicate only
    return hiddenProfileKeys.has(normalizeProfileKey(key));
  };

  const isFieldAvailable = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.some((item) => isFieldAvailable(item));
    if (typeof value === "object") {
      return Object.values(value).some((item) => isFieldAvailable(item));
    }
    return true;
  };

  /**
   * Roster columns differ by spelling/casing. Match by normalized key for dedupe and grouping.
   */
  const normFieldKey = (key) =>
    String(key || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  /** Semantic "primary company" fields only (not "FTE Company name", etc.). */
  const PRIMARY_COMPANY_KEY_NORMALS = new Set([
    "company",
    "companyname",
    "nameofcompany",
  ]);
  const isPrimaryCompanySemanticKey = (key) =>
    PRIMARY_COMPANY_KEY_NORMALS.has(normFieldKey(key));
  const isPrimaryCompanyDuplicateCandidate = isPrimaryCompanySemanticKey;
  const PRIMARY_COMPANY_CANONICAL_PRIORITY = ["company", "companyname", "nameofcompany"];
  const normalizeCompanyValueForDedupe = (v) =>
    String(unwrapDisplayString(v) ?? "").trim().toLowerCase();
  const getCanonicalPrimaryCompanyKey = (data) => {
    const keys = Object.keys(data).filter(
      (k) => isPrimaryCompanyDuplicateCandidate(k) && isFieldAvailable(data[k])
    );
    if (keys.length === 0) return null;
    for (const norm of PRIMARY_COMPANY_CANONICAL_PRIORITY) {
      const hit = keys.find((k) => normFieldKey(k) === norm);
      if (hit) return hit;
    }
    return keys[0];
  };
  const shouldHideDuplicateCompanyField = (data, key) => {
    if (!isPrimaryCompanyDuplicateCandidate(key)) return false;
    const canonical = getCanonicalPrimaryCompanyKey(data);
    if (!canonical || key === canonical) return false;
    return (
      normalizeCompanyValueForDedupe(data[key]) ===
      normalizeCompanyValueForDedupe(data[canonical])
    );
  };

  const EMAIL_KEY_NORMALS = new Set([
    "email",
    "emailaddress",
    "studentemail",
    "collegeemail",
  ]);
  const EMAIL_CANONICAL_PRIORITY = ["email", "emailaddress", "studentemail", "collegeemail"];
  const isEmailDuplicateCandidate = (key) => EMAIL_KEY_NORMALS.has(normFieldKey(key));
  const normalizeEmailValueForDedupe = (v) =>
    String(unwrapDisplayString(v) ?? "").trim().toLowerCase();
  const getCanonicalEmailKey = (data) => {
    const keys = Object.keys(data).filter(
      (k) => isEmailDuplicateCandidate(k) && isFieldAvailable(data[k])
    );
    if (keys.length === 0) return null;
    for (const norm of EMAIL_CANONICAL_PRIORITY) {
      const hit = keys.find((k) => normFieldKey(k) === norm);
      if (hit) return hit;
    }
    return keys[0];
  };
  const shouldHideDuplicateEmailField = (data, key) => {
    if (!isEmailDuplicateCandidate(key)) return false;
    const canonical = getCanonicalEmailKey(data);
    if (!canonical || key === canonical) return false;
    return (
      normalizeEmailValueForDedupe(data[key]) ===
      normalizeEmailValueForDedupe(data[canonical])
    );
  };

  const shouldHideDuplicateProfileField = (data, key) =>
    shouldHideDuplicateCompanyField(data, key) || shouldHideDuplicateEmailField(data, key);

  // Show only meaningful, non-empty fields
  const validKeys = Object.keys(profileData).filter(
    (key) =>
      key &&
      key !== "_id" &&
      key !== "__v" &&
      !isHiddenProfileKey(key) &&
      !shouldHideDuplicateProfileField(profileData, key) &&
      isFieldAvailable(profileData[key])
  );

  // Group fields into sections for better organization
  const personalInfoFields = ['USN', 'Name', 'Email', 'Phone', 'DOB', 'Gender'];

  const matchesPersonalField = (key) => {
    const lowerKey = key.toLowerCase();
    if (isPrimaryCompanySemanticKey(key)) return false;
    if (lowerKey.includes("company")) return false;
    return personalInfoFields.some((f) => lowerKey.includes(f.toLowerCase()));
  };

  const academicFields = ['Branch', 'Semester', 'CGPA', 'Year', 'Section'];

  const matchesAcademicField = (key) => {
    const lowerKey = key.toLowerCase();
    return academicFields.some((f) => lowerKey.includes(f.toLowerCase()));
  };

  /** Placement / offer fields — everything outside personal & academic. */
  const getFieldCategory = (key) => {
    if (matchesPersonalField(key)) return "personal";
    if (matchesAcademicField(key)) return "academic";
    return "company";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
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

          {/* Company Information — placement & offer details (company name, stipend, internship/FTE columns, …) */}
          {validKeys.some((key) => getFieldCategory(key) === 'company') && (
            <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-4 border-b border-theme pb-2">
                <FaBuilding className="text-theme-accent text-xl" />
                <h2 className="text-xl font-semibold text-theme-primary">Company Information</h2>
              </div>
              <div className="space-y-3 pt-2">
                {validKeys
                  .filter((key) => getFieldCategory(key) === 'company')
                  .map((key) => renderField(key, profileData[key]))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
