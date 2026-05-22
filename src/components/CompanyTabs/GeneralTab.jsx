

import React, { useEffect, useState } from "react";
import { adminAPI } from "../../utils/api";
import { DEFAULT_PLACEMENT_DETAIL_YEAR } from "../../constants/placementYears.js";
import { COMPANY_VISIT_CLUSTER_FORM_OPTIONS } from "../../constants/placementTiers.js";
import {
  CompensationAsterisk,
  CompensationDisclaimerFootnote,
} from "../PlacementCompensationNote.jsx";
import { formatInternshipStipendDisplay } from "../../utils/compensationDisplay.js";

/** Whole-field placeholders — hide from students; admins still see them so they can replace with a real date. */
function isPlaceholderVisitDateOnly(raw) {
  const s = raw == null ? "" : String(raw).trim();
  return /^tba$/i.test(s) || /^tbd$/i.test(s);
}

function GeneralTab({
  company = {},
  isAdmin = false,
  onRolesUpdated,
  placementYear = DEFAULT_PLACEMENT_DETAIL_YEAR,
}) {
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [rolesDraft, setRolesDraft] = useState(() =>
    (company.roles || []).map((role) => ({
      roleName: role.roleName || "",
      internshipStipend:
        role.internshipStipend !== undefined &&
        role.internshipStipend !== null &&
        Number(role.internshipStipend) !== 0
          ? String(role.internshipStipend)
          : "",
      ctc: { ...(role.ctc || {}) },
    }))
  );

  // General info edit state
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [editEligibility, setEditEligibility] = useState(company.eligibility || "");
  const [editOffCampus, setEditOffCampus] = useState(company.offCampus === true);
  const [editCluster, setEditCluster] = useState(
    company.cluster != null && String(company.cluster).trim() !== ""
      ? String(company.cluster).trim()
      : ""
  );
  const [isEditingPpoConversion, setIsEditingPpoConversion] = useState(false);
  const [savingPpoConversion, setSavingPpoConversion] = useState(false);
  const [editPpoConversionType, setEditPpoConversionType] = useState(
    company.ppoConversionType || ""
  );

  const [isEditingVisitDate, setIsEditingVisitDate] = useState(false);
  const [visitDateDraft, setVisitDateDraft] = useState("");
  const [savingVisitDate, setSavingVisitDate] = useState(false);

  const isInternshipOnlyCompany = (() => {
    const typeLower = (company?.type || "").toLowerCase();
    return typeLower.includes("only internship");
  })();
  const isPpoCompany = ((company?.type || "").toLowerCase().includes("ppo"));
  const visitDateRaw =
    company.date_of_visit == null ? "" : String(company.date_of_visit).trim();
  /** Shown to students / non-admins only when not a bare TBA/TBD. */
  const visitDatePublicText =
    visitDateRaw.length > 0 && !isPlaceholderVisitDateOnly(visitDateRaw)
      ? visitDateRaw
      : null;
  /** Admin read-only line: any stored value including TBA/TBD. */
  const visitDateAdminReadOnlyText = visitDateRaw.length > 0 ? visitDateRaw : null;
  const canAdminEditVisitDate = isAdmin;
  const showVisitDateSection =
    visitDatePublicText != null || canAdminEditVisitDate;

  useEffect(() => {
    if (!isEditingPpoConversion) {
      setEditPpoConversionType(company.ppoConversionType || "");
    }
  }, [
    company.ppoConversionType,
    isEditingPpoConversion,
  ]);

  useEffect(() => {
    if (!isEditingGeneral) {
      setEditCluster(
        company.cluster != null && String(company.cluster).trim() !== ""
          ? String(company.cluster).trim()
          : ""
      );
    }
  }, [company.cluster, isEditingGeneral]);

  useEffect(() => {
    if (!isEditingVisitDate) {
      const raw =
        company.date_of_visit == null ? "" : String(company.date_of_visit).trim();
      setVisitDateDraft(raw);
    }
  }, [company.date_of_visit, isEditingVisitDate]);

  const formatCTCValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") return `₹ ${value.toLocaleString("en-IN")}`;
    return value;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      {/* Placement-year info (business model lives in company header — company-wide) */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-indigo-400">
              Eligibility details
            </h2>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (!isEditingGeneral) {
                  setEditEligibility(company.eligibility || "");
                  setEditOffCampus(company.offCampus === true);
                  setEditCluster(
                    company.cluster != null && String(company.cluster).trim() !== ""
                      ? String(company.cluster).trim()
                      : ""
                  );
                }
                setIsEditingGeneral((prev) => !prev);
              }}
              className="px-3 py-1 text-sm rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600 shrink-0"
            >
              {isEditingGeneral ? "Cancel" : "Edit placement details"}
            </button>
          )}
        </div>

        {!isEditingGeneral ? (
          <div className="bg-slate-800/60 rounded-lg p-4 space-y-3">
            {/* {isAdmin ? (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Visit cluster (hub)</p>
                <p className="text-slate-200 font-medium">
                  {(() => {
                    const raw =
                      company.cluster != null && String(company.cluster).trim() !== ""
                        ? String(company.cluster).trim()
                        : "";
                    const hit = COMPANY_VISIT_CLUSTER_FORM_OPTIONS.find((o) => o.value === raw);
                    return hit?.label || (raw ? raw : "Default / legacy (CSE hub)");
                  })()}
                </p>
              </div>
            ) : null}
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Eligibility</p> */}
              <p className="text-slate-200 whitespace-pre-wrap">
                {company.eligibility ?? "Not provided"}
              </p>
            </div>
          // </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSavingGeneral(true);
                await adminAPI.updateCompanyGeneralInfo(
                  company._id,
                  {
                    eligibility: editEligibility,
                    offCampus: editOffCampus,
                    cluster: editCluster,
                  },
                  { year: placementYear }
                );
                if (typeof onRolesUpdated === "function") {
                  await onRolesUpdated();
                }
                setIsEditingGeneral(false);
              } catch (err) {
                console.error("Error updating placement details:", err);
                alert(
                  err.response?.data?.details?.eligibility?.message ||
                    err.response?.data?.error ||
                    "Failed to update placement details. Please try again."
                );
              } finally {
                setSavingGeneral(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-4">
              <div>
                <label
                  htmlFor="visit-cluster-select"
                  className="block text-slate-400 text-xs uppercase tracking-wide mb-2"
                >
                  Visit cluster (placement hub)
                </label>
                <select
                  id="visit-cluster-select"
                  value={editCluster}
                  onChange={(e) => setEditCluster(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {COMPANY_VISIT_CLUSTER_FORM_OPTIONS.map((o) => (
                    <option key={o.value || "default"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  Chemical sciences visits: use Chemical, Civil, or Biotechnology so cards and branch stats match the chem hub.
                </p>
              </div>
              <div>
                <label htmlFor="placement-eligibility" className="sr-only">
                  Eligibility criteria
                </label>
                <textarea
                  id="placement-eligibility"
                  value={editEligibility}
                  onChange={(e) => setEditEligibility(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                  placeholder="e.g. 7.5 CGPA, CSE/ECE/EEE..."
                />
              </div>
              <div className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-800/60 px-4 py-3">
                <input
                  id="off-campus-toggle"
                  type="checkbox"
                  checked={editOffCampus}
                  onChange={(e) => setEditOffCampus(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="off-campus-toggle" className="text-slate-300 text-sm">
                  Mark this company as off campus
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingGeneral}
                className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {savingGeneral ? "Saving…" : "Save placement details"}
              </button>
              <button
                type="button"
                disabled={savingGeneral}
                onClick={() => setIsEditingGeneral(false)}
                className="px-3 py-2 rounded-md border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {showVisitDateSection && (
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-indigo-400">
                Date of visit
              </h2>
              {/* <p className="text-sm text-slate-500 mt-1">
                Placement batch{" "}
                <span className="font-medium text-slate-300">{placementYear}</span>
              </p> */}
            </div>
            {canAdminEditVisitDate && (
              <button
                type="button"
                onClick={() => {
                  if (!isEditingVisitDate) {
                    setVisitDateDraft(visitDateRaw);
                  }
                  setIsEditingVisitDate((prev) => !prev);
                }}
                className="px-3 py-1 text-sm rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600 shrink-0"
              >
                {isEditingVisitDate ? "Cancel" : visitDateRaw ? "Edit date" : "Add date"}
              </button>
            )}
          </div>

          {!isEditingVisitDate ? (
            <div className="bg-slate-800/60 rounded-lg p-4">
              {canAdminEditVisitDate ? (
                visitDateAdminReadOnlyText ? (
                  <p className="text-base font-medium text-slate-200 whitespace-pre-wrap">
                    {visitDateAdminReadOnlyText}
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    Not set — use Add date to record the on-campus visit date for this batch.
                  </p>
                )
              ) : visitDatePublicText ? (
                <p className="text-base font-medium text-slate-200 whitespace-pre-wrap">
                  {visitDatePublicText}
                </p>
              ) : null}
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setSavingVisitDate(true);
                  await adminAPI.updateCompanyGeneralInfo(
                    company._id,
                    { date_of_visit: visitDateDraft.trim() },
                    { year: placementYear }
                  );
                  if (typeof onRolesUpdated === "function") {
                    await onRolesUpdated();
                  }
                  setIsEditingVisitDate(false);
                } catch (err) {
                  console.error("Error updating date of visit:", err);
                  alert(
                    err.response?.data?.details?.date_of_visit?.message ||
                      err.response?.data?.error ||
                      "Failed to update date of visit. Please try again."
                  );
                } finally {
                  setSavingVisitDate(false);
                }
              }}
            >
              <div>
                <label
                  htmlFor="visit-date-input"
                  className="block text-slate-400 text-xs uppercase tracking-wide mb-2"
                >
                  Visit date (free text or ISO, e.g. 2026-08-12)
                </label>
                <input
                  id="visit-date-input"
                  type="text"
                  value={visitDateDraft}
                  onChange={(e) => setVisitDateDraft(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 12 Aug 2026 or TBA"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingVisitDate}
                  className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {savingVisitDate ? "Saving…" : "Save date"}
                </button>
                <button
                  type="button"
                  disabled={savingVisitDate}
                  onClick={() => setIsEditingVisitDate(false)}
                  className="px-3 py-2 rounded-md border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {isPpoCompany && (
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-indigo-400">
              Conversion details
            </h2>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (!isEditingPpoConversion) {
                    setEditPpoConversionType(company.ppoConversionType || "");
                  }
                  setIsEditingPpoConversion((prev) => !prev);
                }}
                className="px-3 py-1 text-sm rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600 shrink-0"
              >
                {isEditingPpoConversion ? "Cancel" : "Edit conversion type"}
              </button>
            )}
          </div>

          {!isEditingPpoConversion ? (
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-400 text-xs uppercase">Type of conversion</p>
              <p className="text-slate-200 font-medium mt-1">
                {company.ppoConversionType || "Not provided"}
              </p>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setSavingPpoConversion(true);
                  await adminAPI.updateCompanyStats(
                    company._id,
                    {
                      ppoConversionType: editPpoConversionType,
                    },
                    { year: placementYear }
                  );
                  if (typeof onRolesUpdated === "function") {
                    await onRolesUpdated();
                  }
                  setIsEditingPpoConversion(false);
                } catch (err) {
                  console.error("Error updating PPO conversion stats:", err);
                  alert(
                    err.response?.data?.error ||
                      "Failed to update conversion type. Please try again."
                  );
                } finally {
                  setSavingPpoConversion(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="ppo-conversion-type"
                  className="block text-slate-300 text-sm mb-1"
                >
                  Type of conversion
                </label>
                <input
                  id="ppo-conversion-type"
                  type="text"
                  value={editPpoConversionType}
                  onChange={(e) => setEditPpoConversionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Full-time PPO, extension + PPO"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingPpoConversion}
                  className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {savingPpoConversion ? "Saving…" : "Save conversion type"}
                </button>
                <button
                  type="button"
                  disabled={savingPpoConversion}
                  onClick={() => setIsEditingPpoConversion(false)}
                  className="px-3 py-2 rounded-md border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ROLES */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-indigo-400">
            Roles Offered
          </h2>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditingRoles((prev) => !prev)}
              className="px-3 py-1 text-sm rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600"
            >
              {isEditingRoles ? "Cancel" : (
                <>
                  Edit roles &amp; CTC
                  <CompensationAsterisk className="text-slate-400" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Read-only view */}
        {!isEditingRoles &&
          (company.roles ?? []).map((role, index) => (
            <div
              key={index}
              className="mb-6 bg-gradient-to-br from-slate-800/70 to-slate-900 rounded-xl p-5 border border-slate-700"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {role.roleName}
              </h3>

              {/* CTC (hidden for internship-only companies) */}
              {!isInternshipOnlyCompany && role.ctc && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {Object.entries(role.ctc).map(([key, value]) => (
                    <div key={key} className="bg-slate-800 rounded-lg p-4">
                      <p className="text-slate-400 text-xs uppercase inline-flex items-baseline gap-0 flex-wrap">
                        <span>{key.replace(/_/g, " ")}</span>
                        <CompensationAsterisk className="text-slate-500" />
                      </p>
                      <p className="text-slate-200 font-medium mt-1">
                        {formatCTCValue(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Stipend */}
              <div className="bg-slate-800 rounded-lg p-4 w-fit">
                <p className="text-slate-400 text-xs inline-flex items-baseline gap-0 flex-wrap">
                  <span>Internship Stipend</span>
                  <CompensationAsterisk className="text-slate-500" />
                </p>
                <p className="text-slate-200 font-medium mt-1">
                  {formatInternshipStipendDisplay(role.internshipStipend)}
                </p>
              </div>
            </div>
          ))}

        {/* Editable view for admins */}
        {isEditingRoles && (
          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSavingRoles(true);
                await adminAPI.updateCompanyRoles(company._id, rolesDraft, { year: placementYear });
                if (typeof onRolesUpdated === "function") {
                  await onRolesUpdated();
                }
                setIsEditingRoles(false);
              } catch (err) {
                console.error("Error updating roles:", err);
                alert(
                  err.response?.data?.details ||
                    err.response?.data?.error ||
                    "Failed to update roles. Please try again."
                );
              } finally {
                setSavingRoles(false);
              }
            }}
          >
            {rolesDraft.map((role, index) => (
              <div
                key={index}
                className="mb-6 bg-slate-800/80 rounded-xl p-5 border border-slate-700 space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm mb-1">
                      Role name
                    </label>
                    <input
                      type="text"
                      value={role.roleName}
                      onChange={(e) => {
                        const next = [...rolesDraft];
                        next[index] = { ...next[index], roleName: e.target.value };
                        setRolesDraft(next);
                      }}
                      className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm mb-1 inline-flex items-baseline gap-0 flex-wrap">
                      <span>Internship stipend (₹)</span>
                      <CompensationAsterisk className="text-slate-400" />
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="N/A if not applicable"
                      value={role.internshipStipend}
                      onChange={(e) => {
                        const next = [...rolesDraft];
                        next[index] = {
                          ...next[index],
                          internshipStipend: e.target.value,
                        };
                        setRolesDraft(next);
                      }}
                      className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2 inline-flex items-baseline gap-0 flex-wrap">
                    <span>CTC components (key → value)</span>
                    <CompensationAsterisk className="text-slate-400" />
                  </label>
                  <div className="space-y-2">
                    {Object.entries(role.ctc).map(([key, value]) => (
                      <div
                        key={key}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const next = [...rolesDraft];
                            const newCtc = { ...next[index].ctc };
                            const oldVal = newCtc[key];
                            delete newCtc[key];
                            newCtc[e.target.value] = oldVal;
                            next[index] = { ...next[index], ctc: newCtc };
                            setRolesDraft(next);
                          }}
                          className="px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="base, bonus, stock..."
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            const next = [...rolesDraft];
                            next[index] = {
                              ...next[index],
                              ctc: {
                                ...next[index].ctc,
                                [key]: e.target.value,
                              },
                            };
                            setRolesDraft(next);
                          }}
                          className="px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Amount"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...rolesDraft];
                            const newCtc = { ...next[index].ctc };
                            delete newCtc[key];
                            next[index] = { ...next[index], ctc: newCtc };
                            setRolesDraft(next);
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...rolesDraft];
                        const newCtc = { ...next[index].ctc };
                        let newKeyBase = "component";
                        let counter = 1;
                        while (newCtc[`${newKeyBase}_${counter}`]) {
                          counter += 1;
                        }
                        newCtc[`${newKeyBase}_${counter}`] = "";
                        next[index] = { ...next[index], ctc: newCtc };
                        setRolesDraft(next);
                      }}
                      className="mt-1 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      + Add CTC component
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(isEditingRoles || (company.roles ?? []).length > 0) && (
              <CompensationDisclaimerFootnote className="text-[11px] sm:text-xs text-slate-500 mt-4 italic leading-snug" />
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingRoles}
                className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {savingRoles ? "Saving…" : "Save roles"}
              </button>
              <button
                type="button"
                disabled={savingRoles}
                onClick={() => setIsEditingRoles(false)}
                className="px-3 py-2 rounded-md border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {(isEditingRoles || (company.roles ?? []).length > 0) && (
          <CompensationDisclaimerFootnote className="text-[11px] sm:text-xs text-slate-500 mt-4 italic leading-snug" />
        )}
      </div>

    </div>
  );
}

export default GeneralTab;
