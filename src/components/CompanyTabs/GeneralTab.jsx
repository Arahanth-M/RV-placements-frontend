

import React, { useState } from "react";
import { adminAPI } from "../../utils/api";

function GeneralTab({ company = {}, isAdmin = false, onRolesUpdated }) {
  const [aboutOpen, setAboutOpen] = useState(true);
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [rolesDraft, setRolesDraft] = useState(() =>
    (company.roles || []).map((role) => ({
      roleName: role.roleName || "",
      internshipStipend:
        role.internshipStipend !== undefined && role.internshipStipend !== null
          ? String(role.internshipStipend)
          : "",
      ctc: { ...(role.ctc || {}) },
    }))
  );

  // General info edit state
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [editEligibility, setEditEligibility] = useState(company.eligibility || "");
  const [editBusinessModel, setEditBusinessModel] = useState(company.business_model || "");


  const formatCTCValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") return `₹ ${value.toLocaleString("en-IN")}`;
    return value;
  };

  const formatAboutCompany = (text) => {
    if (!text) return null;

    const normalized = text.replace(/\\n/g, "\n");

    return normalized.split(/\n+/).map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      if (/^\d+\.\s+.+?:$/.test(trimmed) || /^[A-Za-z].+?:$/.test(trimmed)) {
        return (
          <h3
            key={idx}
            className="mt-4 text-indigo-400 font-semibold text-lg"
          >
            {trimmed}
          </h3>
        );
      }

      if (/^[-•]/.test(trimmed)) {
        return (
          <p
            key={idx}
            className="ml-4 text-slate-300 leading-relaxed"
          >
            {trimmed}
          </p>
        );
      }

      return (
        <p
          key={idx}
          className="text-slate-300 leading-relaxed"
        >
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      
      {/* ABOUT COMPANY */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-full flex justify-between items-center"
        >
          <h2 className="text-xl font-semibold text-indigo-400">
            About the Company
          </h2>
          <span className="text-slate-400">
            {aboutOpen ? "−" : "+"}
          </span>
        </button>

        {aboutOpen && (
          <div className="mt-4 max-h-[500px] overflow-y-auto pr-2 space-y-2">
            {formatAboutCompany(company["About The Company"])}
          </div>
        )}
      </div>

      {/* GENERAL INFO */}
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-indigo-400">
            General Information
          </h2>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (!isEditingGeneral) {
                  setEditEligibility(company.eligibility || "");
                  setEditBusinessModel(company.business_model || "");
                }
                setIsEditingGeneral((prev) => !prev);
              }}
              className="px-3 py-1 text-sm rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600"
            >
              {isEditingGeneral ? "Cancel" : "Edit general info"}
            </button>
          )}
        </div>

        {!isEditingGeneral ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Eligibility</p>
              <p className="text-slate-200 mt-1">
                {company.eligibility ?? "Not provided"}
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Business Model</p>
              <p className="text-slate-200 mt-1">
                {company.business_model ?? "Not provided"}
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSavingGeneral(true);
                await adminAPI.updateCompanyGeneralInfo(company._id, {
                  eligibility: editEligibility,
                  business_model: editBusinessModel,
                });
                if (typeof onRolesUpdated === "function") {
                  await onRolesUpdated();
                }
                setIsEditingGeneral(false);
              } catch (err) {
                console.error("Error updating general info:", err);
                alert(
                  err.response?.data?.details?.eligibility?.message ||
                    err.response?.data?.details?.business_model?.message ||
                    err.response?.data?.error ||
                    "Failed to update general info. Please try again."
                );
              } finally {
                setSavingGeneral(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">
                  Eligibility
                </label>
                <textarea
                  value={editEligibility}
                  onChange={(e) => setEditEligibility(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  placeholder="e.g. 7.5 CGPA, CSE/ECE/EEE..."
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">
                  Business Model
                </label>
                <input
                  type="text"
                  value={editBusinessModel}
                  onChange={(e) => setEditBusinessModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Product-based, Fintech..."
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingGeneral}
                className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {savingGeneral ? "Saving…" : "Save general info"}
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
      </div> (LANGUAGE_JAVASCRIPT)

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
              {isEditingRoles ? "Cancel" : "Edit roles & CTC"}
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

              {/* CTC */}
              {role.ctc && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {Object.entries(role.ctc).map(([key, value]) => (
                    <div key={key} className="bg-slate-800 rounded-lg p-4">
                      <p className="text-slate-400 text-xs uppercase">
                        {key.replace(/_/g, " ")}
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
                <p className="text-slate-400 text-xs">Internship Stipend</p>
                <p className="text-slate-200 font-medium mt-1">
                  ₹ {role.internshipStipend ?? 0}
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
                await adminAPI.updateCompanyRoles(company._id, rolesDraft);
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
                    <label className="block text-slate-300 text-sm mb-1">
                      Internship stipend (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
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
                  <label className="block text-slate-300 text-sm mb-2">
                    CTC components (key → value)
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
      </div>

    </div>
  );
}

export default GeneralTab;
