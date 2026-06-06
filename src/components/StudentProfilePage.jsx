import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import {
  FaUser,
  FaIdCard,
  FaGraduationCap,
  FaBuilding,
  FaClipboardList,
} from "react-icons/fa";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";
import { StudentProfilePageShimmer } from "./PageLoadingShimmer.jsx";
import { studentAPI } from "../utils/api";
import {
  formatProfileLabel,
  getProfileDisplayValue,
  getProfileFieldCategory,
  getStudentProfileValidKeys,
} from "../utils/studentProfileView";
import {
  CompensationAsterisk,
  CompensationDisclaimerFootnote,
} from "./PlacementCompensationNote.jsx";
import { formatInternshipStipendDisplay } from "../utils/compensationDisplay.js";

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
        const raw = response?.data;
        if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
          setError(
            "Profile response was invalid. If this persists, contact the placement team."
          );
          setProfileData(null);
        } else {
          setProfileData(raw);
          setError(null);
        }
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
    return <StudentProfilePageShimmer onBack={() => navigate(-1)} />;
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-app">
        <div className="bg-theme-card border border-theme rounded-xl p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-theme-primary mb-4">No Student Data Available</h2>
          <p className="text-theme-secondary mb-6">
            {error || "Student profile data is not available. Please contact support."}
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-theme-card border border-theme back-link-theme font-semibold rounded-lg transition-colors hover:bg-theme-card-hover"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const splitStudent =
    profileData.student &&
    typeof profileData.student === "object" &&
    !Array.isArray(profileData.student)
      ? profileData.student
      : null;

  const validKeys = getStudentProfileValidKeys(profileData);

  const hasDisplayValue = (value) =>
    value != null && String(value).trim() !== "";

  const renderSplitRow = (label, value) => {
    if (!hasDisplayValue(value)) return null;
    const display = String(value).trim();
    return (
      <div className="border-b border-theme last:border-0">
        {/* Narrow phones: label + value flow inline and wrap together */}
        <div className="py-3 sm:hidden">
          <p className="text-sm leading-relaxed text-theme-primary [overflow-wrap:anywhere]">
            <span className="inline text-theme-secondary font-medium">
              {label}
              <span aria-hidden className="select-none">
                :{" "}
              </span>
            </span>
            <span className="font-medium text-theme-primary whitespace-pre-line break-words">{display}</span>
          </p>
        </div>
        {/* sm+: roomy two-column row like reference */}
        <div className="hidden sm:flex sm:flex-row sm:items-start sm:gap-6 md:gap-8 sm:py-3 md:py-3.5">
          <span className="w-40 shrink-0 pt-0.5 text-base font-medium text-theme-secondary md:w-48 lg:w-52">
            {label}
            <span aria-hidden className="select-none">
              :
            </span>
          </span>
          <span className="min-w-0 flex-1 text-base font-medium leading-relaxed text-theme-primary [overflow-wrap:anywhere] whitespace-pre-line break-words">
            {display}
          </span>
        </div>
      </div>
    );
  };

  const renderField = (key, value) => {
    const displayKey = formatProfileLabel(key);
    if (!displayKey) return null;

    return (
      <div key={key} className="border-b border-theme last:border-0">
        <div className="py-3 sm:hidden">
          <p className="text-sm leading-relaxed text-theme-primary [overflow-wrap:anywhere]">
            <span className="text-theme-secondary font-medium">{displayKey}: </span>
            <span className="font-medium text-theme-primary whitespace-pre-line break-words">
              {getProfileDisplayValue(value)}
            </span>
          </p>
        </div>
        <div className="hidden sm:flex sm:flex-row sm:items-start sm:gap-6 md:gap-8 sm:py-3 md:py-3.5">
          <span className="w-40 shrink-0 pt-0.5 text-base font-medium text-theme-secondary md:w-48 lg:w-52">
            {displayKey}:
          </span>
          <span className="min-w-0 flex-1 text-base font-medium leading-relaxed text-theme-primary [overflow-wrap:anywhere] whitespace-pre-line break-words">
            {getProfileDisplayValue(value)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen overflow-y-auto ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(-1)} />
        </PageBackNavRow>
        <div className="mb-6 sm:mb-8" data-tour="student-profile">
          <div className="bg-theme-card border border-theme px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
            {user?.picture ? (
              <img
                src={user.picture}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  e.target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div className={`bg-theme-accent rounded-full p-3 ${user?.picture ? "hidden" : ""}`}>
              <FaUser className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary">Student Profile</h1>
              {user?.username && (
                <span className="text-theme-secondary text-sm">{user.username}</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {splitStudent ? (
            <>
              <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 md:p-6 shadow-sm transition-colors">
                <div className="flex items-center gap-2 mb-4 border-b border-theme pb-2 sm:mb-4 sm:pb-2">
                  <FaIdCard className="text-theme-accent text-xl" />
                  <h2 className="text-xl font-semibold text-theme-primary">Personal Information</h2>
                </div>
                <div className="space-y-0 pt-1 sm:pt-2">
                  {renderSplitRow("Email Address", splitStudent.email)}
                  {renderSplitRow("Name", splitStudent.name)}
                  {renderSplitRow("USN", splitStudent.usn)}
                  {splitStudent.phoneNumber
                    ? renderSplitRow("Phone Number", splitStudent.phoneNumber)
                    : null}
                </div>
              </div>

              <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 md:p-6 shadow-sm transition-colors">
                <div className="flex items-center gap-2 mb-4 border-b border-theme pb-2 sm:mb-4 sm:pb-2">
                  <FaClipboardList className="text-theme-accent text-xl" />
                  <h2 className="text-xl font-semibold text-theme-primary">Company Information</h2>
                </div>
                <div className="space-y-0 pt-1 sm:pt-2">
                  {Array.isArray(profileData.placements) && profileData.placements.length > 0 ? (
                    profileData.placements.map((p, idx) => (
                      <div key={p?._id ?? `placement-${idx}`}>
                        {hasDisplayValue(p?.companyPlaced ?? p?.company ?? p?.Company) ||
                        hasDisplayValue(p?.typeOfOffer ?? p?.offerType ?? p?.offer) ||
                        hasDisplayValue(p?.stipend ?? p?.Stipend) ||
                        hasDisplayValue(p?.["6-months-internship-stipend"]) ||
                        hasDisplayValue(p?.base) ||
                        hasDisplayValue(p?.ctc) ? (
                          <div
                            className={`space-y-0 ${idx > 0 ? "pt-4 mt-4 border-t border-theme" : ""}`}
                          >
                            {profileData.placements.length > 1 ? (
                              <p className="text-theme-secondary text-sm font-semibold">
                                Placement {idx + 1}
                              </p>
                            ) : null}
                            {renderSplitRow(
                              "Company Name",
                              p?.companyPlaced ?? p?.company ?? p?.Company
                            )}
                            {renderSplitRow(
                              "Type Of Offer",
                              p?.typeOfOffer ?? p?.offerType ?? p?.offer
                            )}
                            {renderSplitRow(
                              <>
                                Stipend
                                <CompensationAsterisk />
                              </>,
                              formatInternshipStipendDisplay(p?.stipend ?? p?.Stipend)
                            )}
                            {renderSplitRow(
                              <>
                                6 Months Internship Stipend
                                <CompensationAsterisk />
                              </>,
                              formatInternshipStipendDisplay(p?.["6-months-internship-stipend"])
                            )}
                            {renderSplitRow(
                              <>
                                Base
                                <CompensationAsterisk />
                              </>,
                              p?.base
                            )}
                            {renderSplitRow(
                              <>
                                CTC
                                <CompensationAsterisk />
                              </>,
                              p?.ctc
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-theme-secondary text-sm">
                      No additional placement details available yet.
                    </p>
                  )}
                  {Array.isArray(profileData.placements) &&
                  profileData.placements.some((p) =>
                    [
                      p?.stipend ?? p?.Stipend,
                      p?.["6-months-internship-stipend"],
                      p?.base,
                      p?.ctc,
                    ].some((v) => hasDisplayValue(v))
                  ) ? (
                    <CompensationDisclaimerFootnote className="text-[11px] sm:text-xs text-theme-muted mt-3 italic leading-snug" />
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {!splitStudent && validKeys.length === 0 ? (
            <div className="bg-theme-card border border-theme rounded-xl p-6 shadow-sm">
              <p className="text-theme-secondary">
                Your profile loaded, but there are no fields to display yet. Contact the placement team if this is unexpected.
              </p>
            </div>
          ) : null}

          {!splitStudent &&
          validKeys.some((key) => getProfileFieldCategory(key) === "personal") ? (
            <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 md:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-4 border-b border-theme pb-2 sm:mb-4 sm:pb-2">
                <FaIdCard className="text-theme-accent text-xl" />
                <h2 className="text-xl font-semibold text-theme-primary">Personal Information</h2>
              </div>
              <div className="space-y-0 pt-1 sm:pt-2">
                {validKeys
                  .filter((key) => getProfileFieldCategory(key) === "personal")
                  .map((key) => renderField(key, profileData[key]))}
              </div>
            </div>
          ) : null}

          {!splitStudent &&
          validKeys.some((key) => getProfileFieldCategory(key) === "academic") ? (
            <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 md:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-4 border-b border-theme pb-2 sm:mb-4 sm:pb-2">
                <FaGraduationCap className="text-theme-accent text-xl" />
                <h2 className="text-xl font-semibold text-theme-primary">Academic Information</h2>
              </div>
              <div className="space-y-0 pt-1 sm:pt-2">
                {validKeys
                  .filter((key) => getProfileFieldCategory(key) === "academic")
                  .map((key) => renderField(key, profileData[key]))}
              </div>
            </div>
          ) : null}

          {!splitStudent &&
          validKeys.some((key) => getProfileFieldCategory(key) === "company") ? (
            <div className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 md:p-6 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-4 border-b border-theme pb-2 sm:mb-4 sm:pb-2">
                <FaBuilding className="text-theme-accent text-xl" />
                <h2 className="text-xl font-semibold text-theme-primary">Company Information</h2>
              </div>
              <div className="space-y-0 pt-1 sm:pt-2">
                {validKeys
                  .filter((key) => getProfileFieldCategory(key) === "company")
                  .map((key) => renderField(key, profileData[key]))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
