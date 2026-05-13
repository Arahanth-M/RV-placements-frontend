import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { spcAPI, adminAPI } from "../utils/api";
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

const SPC_MOD_PAGE_SIZE = 25;

function parseSubmissionContentJson(contentString) {
  try {
    return JSON.parse(contentString);
  } catch {
    return { question: contentString, solution: "" };
  }
}

function formatSubmissionDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const SUBMISSION_TYPE_LABELS = {
  onlineQuestions: "OA question",
  interviewQuestions: "Interview question",
  interviewProcess: "Interview process",
  mustDoTopics: "Must-do topic",
  internshipExperience: "Internship experience",
};

function getSubmissionTypeLabel(type) {
  const t = String(type || "").trim();
  if (t === "onlineQuestion" || t === "onlineQuestions") return "OA question";
  return SUBMISSION_TYPE_LABELS[t] || (t ? t.replace(/([A-Z])/g, " $1").trim() : "Submission");
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
  const showStudentMod = searchParams.get("view") === "student-contributions";
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

  const [modList, setModList] = useState([]);
  const [modMeta, setModMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState("");
  const [modApproving, setModApproving] = useState(() => new Set());
  const [modRejecting, setModRejecting] = useState(() => new Set());
  const [modSelected, setModSelected] = useState(null);

  const loadModList = useCallback(async (page = 1) => {
    setModLoading(true);
    setModError("");
    try {
      const { data } = await adminAPI.getSubmissions({
        params: { status: "pending", page, limit: SPC_MOD_PAGE_SIZE },
      });
      setModList(Array.isArray(data?.items) ? data.items : []);
      setModMeta({
        page: data?.page || page,
        total: data?.total ?? 0,
        totalPages: Math.max(1, data?.totalPages || 1),
      });
    } catch (e) {
      setModError(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Could not load pending submissions."
      );
      setModList([]);
    } finally {
      setModLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showStudentMod) {
      loadModList(modMeta.page);
    }
  }, [showStudentMod, loadModList, modMeta.page]);

  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch {
      // no-op for non-browser environments
    }
  }, [showSubmissions, showStudentMod]);

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

  const openModRow = async (row) => {
    if (row.contentTruncated) {
      try {
        const res = await adminAPI.getSubmission(row._id);
        setModSelected(res.data);
      } catch {
        setModSelected(row);
      }
    } else {
      setModSelected(row);
    }
  };

  const closeModModal = () => setModSelected(null);

  const handleModApprove = async (id) => {
    if (!window.confirm("Approve this submission? This updates the company database.")) return;
    const sid = String(id);
    setModApproving((prev) => new Set(prev).add(sid));
    try {
      await adminAPI.approveSubmission(id);
      await loadModList(modMeta.page);
      setModSelected((prev) => (prev && String(prev._id) === sid ? null : prev));
    } catch (e) {
      const msg =
        e?.response?.data?.details ||
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Could not approve submission.";
      window.alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setModApproving((prev) => {
        const next = new Set(prev);
        next.delete(sid);
        return next;
      });
    }
  };

  const handleModReject = async (id) => {
    if (!window.confirm("Reject will permanently delete this submission.")) return;
    const sid = String(id);
    setModRejecting((prev) => new Set(prev).add(sid));
    try {
      await adminAPI.rejectSubmission(id);
      await loadModList(modMeta.page);
      setModSelected((prev) => (prev && String(prev._id) === String(id) ? null : prev));
    } catch (e) {
      window.alert(
        e?.response?.data?.error || e?.response?.data?.message || "Could not reject submission."
      );
    } finally {
      setModRejecting((prev) => {
        const next = new Set(prev);
        next.delete(sid);
        return next;
      });
    }
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClass}`}>
      <div className={pageShellInnerClass}>
        {!showSubmissions && !showStudentMod ? (
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
                <button
                  type="button"
                  onClick={() => {
                    setModMeta((m) => ({ ...m, page: 1 }));
                    setSearchParams({ view: "student-contributions" });
                  }}
                  className={PRIMARY_ACTION_BTN_CLASS}
                >
                  Review student contributions
                </button>
              </div>
            </div>
          </div>
        ) : showStudentMod ? (
          <>
            <PageBackNavRow>
              <PageBackButton onClick={() => setSearchParams({})} label="Back to Dashboard" />
            </PageBackNavRow>

            <div className="mx-auto w-full max-w-6xl">
              <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
                <div className="flex flex-wrap items-center gap-3 border-b border-theme-input pb-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-theme-primary">Pending student contributions</h2>
                    <p className="mt-1 text-sm text-theme-secondary">
                      Approve or reject company submissions from students.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadModList(modMeta.page)}
                    disabled={modLoading}
                    className="h-10 shrink-0 rounded-xl border border-theme-input bg-theme-input px-4 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {modLoading ? "Refreshing…" : "Refresh"}
                  </button>
                </div>

                {modError ? (
                  <div
                    className="mt-4 rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-300"
                    role="alert"
                  >
                    {modError}
                  </div>
                ) : null}

                {modLoading && modList.length === 0 ? (
                  <p className="mt-6 text-sm text-theme-muted">Loading pending submissions…</p>
                ) : null}

                {!modLoading && modList.length === 0 ? (
                  <p className="mt-6 text-sm text-theme-muted">No pending submissions.</p>
                ) : modList.length > 0 ? (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-theme-input">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-theme-input bg-theme-input/80 text-theme-secondary">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">Submitted by</th>
                          <th className="px-3 py-2.5 font-medium">Company</th>
                          <th className="px-3 py-2.5 font-medium">Type</th>
                          <th className="hidden px-3 py-2.5 font-medium md:table-cell">Preview</th>
                          <th className="px-3 py-2.5 font-medium">When</th>
                          <th className="px-3 py-2.5 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-input text-theme-primary">
                        {modList.map((row) => {
                          const parsed = parseSubmissionContentJson(row.content);
                          return (
                            <tr
                              key={row._id}
                              className="cursor-pointer bg-theme-card hover:bg-theme-nav/40"
                              onClick={() => openModRow(row)}
                            >
                              <td className="px-3 py-2 align-top">
                                <div className="font-medium">{row.submittedBy?.name || "—"}</div>
                                <div className="text-xs text-theme-secondary">{row.submittedBy?.email || ""}</div>
                                {row.isAnonymous ? (
                                  <span className="mt-1 inline-block text-xs text-amber-600 dark:text-amber-400">
                                    Anonymous
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-3 py-2 align-top">
                                {row.companyId?.name || "—"}
                                <div className="text-xs text-theme-secondary">
                                  {row.placementYear != null ? `Year ${row.placementYear}` : ""}
                                  {row.cluster ? ` · ${row.cluster}` : ""}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 align-top">
                                {getSubmissionTypeLabel(row.type)}
                              </td>
                              <td className="hidden max-w-xs px-3 py-2 align-top text-theme-secondary md:table-cell">
                                {parsed.question ? (
                                  <span className="line-clamp-2">Q: {parsed.question}</span>
                                ) : (
                                  <span className="line-clamp-2">{row.content}</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 align-top text-theme-secondary">
                                {formatSubmissionDate(row.submittedAt)}
                              </td>
                              <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-col gap-1 sm:flex-row">
                                  <button
                                    type="button"
                                    onClick={() => handleModApprove(row._id)}
                                    disabled={
                                      modApproving.has(String(row._id)) ||
                                      modRejecting.has(String(row._id)) ||
                                      modLoading
                                    }
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {modApproving.has(String(row._id)) ? "…" : "Approve"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleModReject(row._id)}
                                    disabled={
                                      modApproving.has(String(row._id)) ||
                                      modRejecting.has(String(row._id)) ||
                                      modLoading
                                    }
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {modRejecting.has(String(row._id)) ? "…" : "Reject"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {modMeta.total > 0 ? (
                  <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-theme-input pt-4 text-sm text-theme-secondary sm:flex-row">
                    <p>
                      Page {modMeta.page} of {modMeta.totalPages} ({modMeta.total} total)
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={modMeta.page <= 1 || modLoading}
                        onClick={() => setModMeta((m) => ({ ...m, page: Math.max(1, m.page - 1) }))}
                        className="rounded-lg border border-theme-input px-3 py-1.5 text-sm font-medium hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={modMeta.page >= modMeta.totalPages || modLoading}
                        onClick={() => setModMeta((m) => ({ ...m, page: Math.min(m.totalPages, m.page + 1) }))}
                        className="rounded-lg border border-theme-input px-3 py-1.5 text-sm font-medium hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
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
                        onClick={() => {
                          setModMeta((m) => ({ ...m, page: 1 }));
                          setSearchParams({ view: "student-contributions" });
                        }}
                        className="h-10 shrink-0 rounded-xl border border-theme-accent/40 bg-theme-accent/10 px-4 text-sm font-semibold text-theme-accent transition-colors hover:bg-theme-accent/20"
                      >
                        Student contributions
                      </button>
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
      {modSelected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-theme bg-theme-card p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-theme-primary">Submission detail</h3>
                <p className="text-sm text-theme-secondary">
                  {modSelected.companyId?.name || "Company"} · {getSubmissionTypeLabel(modSelected.type)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModModal}
                className="h-9 rounded-xl border border-theme-input px-3 text-sm font-medium text-theme-primary hover:bg-theme-nav"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-sm text-theme-secondary">
              <p>
                <span className="font-medium text-theme-primary">From:</span>{" "}
                {modSelected.submittedBy?.name || "—"} ({modSelected.submittedBy?.email || "—"})
                {modSelected.isAnonymous ? (
                  <span className="ml-2 text-amber-600 dark:text-amber-400">Anonymous</span>
                ) : null}
              </p>
              <p>
                <span className="font-medium text-theme-primary">Submitted:</span>{" "}
                {formatSubmissionDate(modSelected.submittedAt)}
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-theme-input bg-theme-input/30 p-4">
              {(() => {
                const c = parseSubmissionContentJson(modSelected.content);
                if (c.question || c.solution) {
                  return (
                    <div className="space-y-3 text-sm">
                      {c.question ? (
                        <div>
                          <p className="font-semibold text-theme-primary">Question</p>
                          <p className="mt-1 whitespace-pre-wrap text-theme-secondary">{c.question}</p>
                        </div>
                      ) : null}
                      {c.solution ? (
                        <div>
                          <p className="font-semibold text-theme-primary">Solution</p>
                          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap font-sans text-theme-secondary">
                            {c.solution}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  );
                }
                return (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-theme-secondary">
                    {modSelected.content}
                  </pre>
                );
              })()}
            </div>
            {modSelected.status !== "approved" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await handleModApprove(modSelected._id);
                    closeModModal();
                  }}
                  disabled={
                    modApproving.has(String(modSelected._id)) ||
                    modRejecting.has(String(modSelected._id)) ||
                    modLoading
                  }
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {modApproving.has(String(modSelected._id)) ? "Approving…" : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleModReject(modSelected._id);
                    closeModModal();
                  }}
                  disabled={
                    modApproving.has(String(modSelected._id)) ||
                    modRejecting.has(String(modSelected._id)) ||
                    modLoading
                  }
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {modRejecting.has(String(modSelected._id)) ? "Rejecting…" : "Reject"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
