import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { spcAPI } from "../utils/api";
import {
  PageBackButton,
  PageBackNavRow,
  pageShellInnerClass,
  pageShellOuterClass,
} from "./PageBackNav.jsx";

const PRIMARY_ACTION_BTN_CLASS =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-theme-accent px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

const EDIT_INITIAL = {
  studentName: "",
  studentEmail: "",
  studentUsn: "",
  companyPlaced: "",
  placementYear: "",
  branchCode: "",
  typeOfOffer: "",
  role: "",
  ctc: "",
  base: "",
  stipend: "",
  ppoConversionType: "",
  sixMonthsInternshipStipend: "",
};

export default function SPCDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showSubmissions = searchParams.get("view") === "submissions";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placements, setPlacements] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState(EDIT_INITIAL);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [companySuggestOpen, setCompanySuggestOpen] = useState(false);
  const [companySuggestLoading, setCompanySuggestLoading] = useState(false);
  const companySuggestRootRef = useRef(null);
  const companySuggestDebounceRef = useRef(null);
  const pickedCompanyNameRef = useRef("");

  useEffect(() => {
    return () => {
      if (companySuggestDebounceRef.current) {
        clearTimeout(companySuggestDebounceRef.current);
      }
    };
  }, []);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await spcAPI.getMySubmissions();
      setPlacements(Array.isArray(data?.placements) ? data.placements : []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Could not load your submissions."
      );
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showSubmissions) {
      loadSubmissions();
    }
  }, [showSubmissions, loadSubmissions]);

  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch {
      // no-op for non-browser environments
    }
  }, [showSubmissions]);

  useEffect(() => {
    if (!companySuggestOpen) return undefined;
    const onPointerDown = (e) => {
      if (!companySuggestRootRef.current?.contains(e.target)) setCompanySuggestOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [companySuggestOpen]);

  useEffect(() => {
    const q = String(editForm.companyPlaced || "").trim();
    if (!selectedRecord) return;
    const pickedName = String(pickedCompanyNameRef.current || "").trim().toLowerCase();
    if (pickedName && q.toLowerCase() === pickedName) {
      setCompanySuggestLoading(false);
      setCompanySuggestOpen(false);
      return;
    }
    if (companySuggestDebounceRef.current) clearTimeout(companySuggestDebounceRef.current);
    if (q.length < 2) {
      setCompanySuggestions([]);
      setCompanySuggestOpen(false);
      setCompanySuggestLoading(false);
      return;
    }
    companySuggestDebounceRef.current = setTimeout(async () => {
      setCompanySuggestLoading(true);
      try {
        const res = await spcAPI.companySuggest(q);
        const rawItems = Array.isArray(res?.data?.items) ? res.data.items : [];
        const seenNames = new Set();
        const items = rawItems.filter((item) => {
          const nameKey = String(item?.name || "")
            .trim()
            .toLowerCase();
          if (!nameKey || seenNames.has(nameKey)) return false;
          seenNames.add(nameKey);
          return true;
        });
        setCompanySuggestions(items);
        setCompanySuggestOpen(items.length > 0);
      } catch {
        setCompanySuggestions([]);
        setCompanySuggestOpen(false);
      } finally {
        setCompanySuggestLoading(false);
      }
    }, 280);
  }, [editForm.companyPlaced, selectedRecord]);

  const openRecordModal = (row) => {
    setSelectedRecord(row);
    setEditForm({
      studentName: String(row?.studentName || ""),
      studentEmail: String(row?.studentEmail || ""),
      studentUsn: String(row?.studentUsn || ""),
      companyPlaced: String(row?.companyPlaced || row?.companyName || ""),
      placementYear: row?.placementYear == null ? "" : String(row.placementYear),
      branchCode: String(row?.branchCode || ""),
      typeOfOffer: String(row?.typeOfOffer || ""),
      role: String(row?.role || ""),
      ctc: String(row?.ctc || ""),
      base: String(row?.base || ""),
      stipend: String(row?.stipend || ""),
      ppoConversionType: String(row?.ppoConversionType || ""),
      sixMonthsInternshipStipend: String(row?.sixMonthsInternshipStipend || ""),
    });
    pickedCompanyNameRef.current = "";
    setSaveError("");
    setSaveSuccess("");
  };

  const closeRecordModal = () => {
    if (isSaving) return;
    setSelectedRecord(null);
    setEditForm(EDIT_INITIAL);
    pickedCompanyNameRef.current = "";
    setCompanySuggestions([]);
    setCompanySuggestOpen(false);
    setCompanySuggestLoading(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    if (name === "companyPlaced") {
      const next = String(value || "").trim().toLowerCase();
      const picked = String(pickedCompanyNameRef.current || "").trim().toLowerCase();
      if (next !== picked) {
        pickedCompanyNameRef.current = "";
      }
    }
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setSaveError("");
    setSaveSuccess("");
  };

  const pickSuggestedCompany = (item) => {
    const pickedName = String(item?.name || "").trim();
    if (!pickedName) return;
    if (companySuggestDebounceRef.current) {
      clearTimeout(companySuggestDebounceRef.current);
      companySuggestDebounceRef.current = null;
    }
    pickedCompanyNameRef.current = pickedName.toLowerCase();
    setEditForm((prev) => ({ ...prev, companyPlaced: pickedName }));
    setCompanySuggestions([]);
    setCompanySuggestOpen(false);
    setCompanySuggestLoading(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const saveRecord = async () => {
    if (!selectedRecord?._id) return;
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const updatePayload = {
        ...editForm,
        placementYear:
          String(editForm.placementYear || "").trim() === ""
            ? null
            : Number(editForm.placementYear),
        branchCode: String(editForm.branchCode || "").trim().toLowerCase(),
        studentUsn: String(editForm.studentUsn || "").trim().toUpperCase(),
      };
      await spcAPI.updatePlacementRecord(selectedRecord._id, updatePayload);
      setSaveSuccess("Record updated.");
      setPlacements((prev) =>
        prev.map((row) =>
          row._id === selectedRecord._id
            ? {
                ...row,
                studentName: editForm.studentName,
                studentEmail: editForm.studentEmail,
                studentUsn: editForm.studentUsn,
                companyPlaced: editForm.companyPlaced,
                companyName: editForm.companyPlaced,
                placementYear: editForm.placementYear ? Number(editForm.placementYear) : null,
                branchCode: String(editForm.branchCode || "").trim().toLowerCase(),
                typeOfOffer: editForm.typeOfOffer,
                role: editForm.role,
                ctc: editForm.ctc,
                base: editForm.base,
                stipend: editForm.stipend,
                ppoConversionType: editForm.ppoConversionType,
                sixMonthsInternshipStipend: editForm.sixMonthsInternshipStipend,
                updatedAt: new Date().toISOString(),
              }
            : row
        )
      );
      setSelectedRecord((prev) =>
        prev
          ? {
              ...prev,
              studentName: editForm.studentName,
              studentEmail: editForm.studentEmail,
              studentUsn: editForm.studentUsn,
              companyPlaced: editForm.companyPlaced,
              companyName: editForm.companyPlaced,
              placementYear: editForm.placementYear ? Number(editForm.placementYear) : null,
              branchCode: String(editForm.branchCode || "").trim().toLowerCase(),
              typeOfOffer: editForm.typeOfOffer,
              role: editForm.role,
              ctc: editForm.ctc,
              base: editForm.base,
              stipend: editForm.stipend,
              ppoConversionType: editForm.ppoConversionType,
              sixMonthsInternshipStipend: editForm.sixMonthsInternshipStipend,
              updatedAt: new Date().toISOString(),
            }
          : prev
      );
    } catch (e) {
      setSaveError(
        e?.response?.data?.message || e?.response?.data?.error || "Could not update record."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        {!showSubmissions ? (
          <div className="mx-auto w-full max-w-5xl">
            <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
              <h1 className="text-3xl font-bold text-theme-primary">SPC Dashboard</h1>
              <p className="mt-3 text-sm text-theme-secondary">
                Manage SPC placement workflows and review what you have submitted.
              </p>

              <div className="mt-6 flex flex-wrap items-start gap-3">
                <button type="button" onClick={() => navigate("/spc/form")} className={PRIMARY_ACTION_BTN_CLASS}>
                  Add Placement Data
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/spc/conversion-details")}
                  className={PRIMARY_ACTION_BTN_CLASS}
                >
                  Update conversion details
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ view: "submissions" })}
                  className={PRIMARY_ACTION_BTN_CLASS}
                >
                  View submissions
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <PageBackNavRow>
              <PageBackButton
                onClick={() => setSearchParams({})}
                label="Back to Dashboard"
              />
            </PageBackNavRow>

            <div className="mx-auto w-full max-w-5xl">
              <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
                <div className="space-y-8">
                  {error ? (
                    <div
                      className="rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-300"
                      role="alert"
                    >
                      {error}
                    </div>
                  ) : null}

                  {loading && !placements.length ? (
                    <p className="text-sm text-theme-muted">Loading…</p>
                  ) : null}

                  <section className="space-y-3" aria-label="Placement and conversion records">
                    <div className="flex w-full flex-wrap items-center gap-3">
                      <h2 className="min-w-0 flex-1 text-lg font-semibold text-theme-primary">
                        Placement & conversion records
                      </h2>
                      <button
                        type="button"
                        onClick={loadSubmissions}
                        disabled={loading}
                        className="ml-auto h-10 shrink-0 rounded-xl border border-theme-input bg-theme-input px-4 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Refreshing…" : "Refresh"}
                      </button>
                    </div>
                    {placements.length === 0 && !loading ? (
                      <p className="text-sm text-theme-muted">No placement or conversion entries yet.</p>
                    ) : placements.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-theme-input">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-theme-input bg-theme-input/80 text-theme-secondary">
                            <tr>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Updated</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Student</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Company</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Year</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Branch</th>
                              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Offer</th>
                              <th className="min-w-[8rem] px-3 py-2.5 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-input text-theme-primary">
                            {placements.map((row) => (
                              <tr key={row._id} className="bg-theme-card hover:bg-theme-nav/50">
                                <td className="whitespace-nowrap px-3 py-2 align-middle text-theme-secondary">
                                  {formatWhen(row.updatedAt || row.createdAt)}
                                </td>
                                <td className="px-3 py-2 align-middle">
                                  <div className="font-medium">{row.studentName}</div>
                                </td>
                                <td className="px-3 py-2 align-middle">{row.companyPlaced || row.companyName || "—"}</td>
                                <td className="whitespace-nowrap px-3 py-2 align-middle">{row.placementYear ?? "—"}</td>
                                <td className="whitespace-nowrap px-3 py-2 align-middle uppercase">
                                  {row.branchCode || "—"}
                                </td>
                                <td className="max-w-[10rem] px-3 py-2 align-middle">{row.typeOfOffer || "—"}</td>
                                {/* <td className="max-w-[14rem] px-3 py-2 align-middle">
                                  <button
                                    type="button"
                                    onClick={() => openRecordModal(row)}
                                    className="inline-flex h-8 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-600/15 px-3 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-600/25 hover:text-violet-200"
                                  >
                                    View details / Edit
                                  </button>
                                </td> */}
                                <td className="px-3 py-2 align-middle">
  <div className="flex items-center h-full">
    <button
      type="button"
      onClick={() => openRecordModal(row)}
className= "h-8 rounded-xl bg-theme-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
>
      View details / Edit
    </button>
  </div>
</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {selectedRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-theme bg-theme-card p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-theme-primary">Placement record details</h3>
                <p className="text-sm text-theme-secondary">
                  {selectedRecord.studentName || "—"} · {selectedRecord.companyName || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRecordModal}
                disabled={isSaving}
                className="h-9 rounded-xl bg-theme-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-2 rounded-xl border border-theme-input bg-theme-input/40 p-3 text-sm text-theme-secondary sm:grid-cols-2">
              <p><span className="font-medium text-theme-primary">Updated:</span> {formatWhen(selectedRecord.updatedAt || selectedRecord.createdAt)}</p>
              <p><span className="font-medium text-theme-primary">Year:</span> {selectedRecord.placementYear ?? "—"}</p>
              <p><span className="font-medium text-theme-primary">Branch:</span> {String(selectedRecord.branchCode || "—").toUpperCase()}</p>
              <p><span className="font-medium text-theme-primary">Type Of Offer:</span> {selectedRecord.typeOfOffer || "—"}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm text-theme-secondary">
                Student Name
                <input name="studentName" value={editForm.studentName} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="text-sm text-theme-secondary">
                Student Email
                <input name="studentEmail" type="email" value={editForm.studentEmail} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="text-sm text-theme-secondary">
                Student USN
                <input name="studentUsn" value={editForm.studentUsn} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="relative text-sm text-theme-secondary" ref={companySuggestRootRef}>
                Company
                <input
                  name="companyPlaced"
                  autoComplete="off"
                  value={editForm.companyPlaced}
                  onChange={onEditChange}
                  onFocus={() => {
                    if (
                      String(editForm.companyPlaced || "").trim().length >= 2 &&
                      companySuggestions.length > 0
                    ) {
                      setCompanySuggestOpen(true);
                    }
                  }}
                  className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent"
                />
                {companySuggestLoading ? (
                  <p className="mt-1 text-xs text-theme-muted">Searching...</p>
                ) : null}
                {companySuggestOpen && companySuggestions.length > 0 ? (
                  <ul
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-theme-input bg-theme-card py-1 shadow-lg"
                    role="listbox"
                  >
                    {companySuggestions.map((item) => (
                      <li key={item.id} role="presentation">
                        <button
                          type="button"
                          className="flex w-full px-4 py-2.5 text-left text-sm text-theme-primary hover:bg-theme-nav"
                          onMouseDown={(ev) => ev.preventDefault()}
                          onClick={() => pickSuggestedCompany(item)}
                        >
                          {item.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </label>
              <label className="text-sm text-theme-secondary">
                Placement Year
                <input name="placementYear" type="number" value={editForm.placementYear} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="text-sm text-theme-secondary">
                Branch Code
                <input name="branchCode" value={editForm.branchCode} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="text-sm text-theme-secondary">
                Type Of Offer
                <select name="typeOfOffer" value={editForm.typeOfOffer} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent">
                  <option value="Internship(PPO)">Internship(PPO)</option>
                  <option value="FTE">FTE</option>
                  <option value="Internship+FTE">Internship+FTE</option>
                  <option value="Internship + FTE (PBC)">Internship + FTE (PBC)</option>
                  <option value="Only internship(6 months)">Only internship(6 months)</option>
                </select>
              </label>
              <label className="text-sm text-theme-secondary">
                Role
                <input name="role" value={editForm.role} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="text-sm text-theme-secondary">
                CTC
                <input name="ctc" value={editForm.ctc} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="text-sm text-theme-secondary">
                Base
                <input name="base" value={editForm.base} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="text-sm text-theme-secondary">
                Summer Internship Stipend
                <input name="stipend" value={editForm.stipend} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
              <label className="text-sm text-theme-secondary">
                PPO Conversion Type
                <select name="ppoConversionType" value={editForm.ppoConversionType} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent">
                  <option value="">None</option>
                  <option value="FTE">FTE</option>
                  <option value="Internship+FTE">Internship+FTE</option>
                </select>
              </label>
              <label className="text-sm text-theme-secondary">
                6 Months Internship Stipend
                <input name="sixMonthsInternshipStipend" value={editForm.sixMonthsInternshipStipend} onChange={onEditChange} className="mt-1 h-10 w-full rounded-lg border border-theme-input bg-theme-input px-3 text-theme-primary outline-none focus:border-theme-accent" />
              </label>
            </div>

            {saveError ? <p className="mt-3 text-sm text-red-400">{saveError}</p> : null}
            {saveSuccess ? <p className="mt-3 text-sm text-emerald-400">{saveSuccess}</p> : null}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={saveRecord}
                disabled={isSaving}
                className="h-10 rounded-xl bg-theme-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
