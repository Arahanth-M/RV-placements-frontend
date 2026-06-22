import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { spcAPI, adminAPI } from "../utils/api";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";
import {
  FaDatabasePlus,
  FaArrowRight,
  FaClipboardList,
  FaUsers,
  FaSync,
} from "react-icons/fa";
import { formatPpoBranchLabel, PPO_BRANCH_CODES } from "../constants/ppoBranchCodes.js";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
} from "../constants/placementYears.js";
import SpcCompanySuggestField from "./SpcCompanySuggestField.jsx";
import SpcRoleField from "./SpcRoleField.jsx";
import SpcFormField from "./SpcFormField.jsx";
import SpcThemeSelect from "./SpcThemeSelect.jsx";
import {
  compensationVisibilityForTypeOfOffer,
  SPC_COMPENSATION_TBD_HINT,
  validateSpcEditPlacement,
} from "../utils/spcFormValidation.js";

function placementContextHintForSpc(companyId) {
  if (!companyId) return "";
  try {
    return String(
      sessionStorage.getItem(`company_detail_placement_ctx:${companyId}`) || ""
    ).trim();
  } catch {
    return "";
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
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

function submissionSupportsEnhancement(type) {
  return String(type || "").trim() !== "mustDoTopics";
}

function submissionSupportsAddAnswer(type) {
  const t = String(type || "").trim();
  return t === "onlineQuestions" || t === "interviewQuestions";
}

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
  placementYear: DEFAULT_PLACEMENT_DETAIL_YEAR,
  branchCode: "",
  typeOfOffer: "",
  role: "",
  ctc: "",
  base: "",
  stipend: "",
  ppoConversionType: "",
  sixMonthsInternshipStipend: "",
};

const SPC_EDIT_YEAR_OPTIONS = PLACEMENT_DETAIL_VISIT_YEARS.map((y) => ({
  value: y,
  label: String(y),
}));

const SPC_EDIT_BRANCH_OPTIONS = [
  { value: "", label: "Select program" },
  ...PPO_BRANCH_CODES.map((b) => ({ value: b, label: formatPpoBranchLabel(b) })),
];

const SPC_EDIT_TYPE_OF_OFFER_OPTIONS = [
  { value: "", label: "Select type of offer" },
  { value: "Internship(PPO)", label: "Internship(PPO)" },
  { value: "FTE", label: "FTE" },
  { value: "Internship+FTE", label: "Internship+FTE" },
  { value: "Internship + FTE (PBC)", label: "Internship + FTE (PBC)" },
  { value: "Only internship(6 months)", label: "Only internship(6 months)" },
];

const SPC_EDIT_PPO_CONV_OPTIONS = [
  { value: "", label: "None" },
  { value: "FTE", label: "FTE" },
  { value: "Internship+FTE", label: "Internship+FTE" },
];

const PRIMARY_ACTION_BTN_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-theme-accent px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90";

const MOD_BTN_BASE =
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Helper actions (add answer, enhance) — same language as Header secondary buttons */
const MOD_BTN_SECONDARY = `${MOD_BTN_BASE} border border-theme bg-theme-card px-4 py-2 text-theme-primary hover:bg-theme-hero hover:border-theme-accent/50`;

const MOD_BTN_PRIMARY = `${MOD_BTN_BASE} bg-theme-accent px-4 py-2 text-white hover:opacity-90`;

const MOD_BTN_MUTED = `${MOD_BTN_BASE} border border-theme bg-theme-input px-4 py-2 text-theme-secondary hover:bg-theme-nav hover:text-theme-primary`;

const MOD_BTN_DANGER = `${MOD_BTN_BASE} border border-theme bg-theme-card px-4 py-2 text-theme-secondary hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`;

const MOD_BTN_SM_PRIMARY = `${MOD_BTN_BASE} bg-theme-accent px-3 py-1.5 text-xs text-white hover:opacity-90`;

const MOD_BTN_SM_DANGER = `${MOD_BTN_BASE} border border-theme bg-theme-card px-3 py-1.5 text-xs text-theme-secondary hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`;

const MOD_PREVIEW_PANEL = "mt-4 rounded-xl border border-theme-accent/25 bg-theme-hero p-4";

// ─── Dashboard landing ────────────────────────────────────────────────────────

function DashboardLanding({ onNavigate, pendingCount, pendingLoading }) {
  const actions = [
    {
      key: "add",
      title: "Add placement data",
      desc: "Submit the data of a newly placed student.",
      cta: "Get started",
      accent: "border-l-violet-500",
      ctaColor: "text-violet-500",
      badge: null,
    },
    {
      key: "conversion",
      title: "Update conversion details",
      desc: "Update the conversion details of a student who received a PPO.",
      cta: "Get started",
      accent: "border-l-emerald-500",
      ctaColor: "text-violet-600",
      badge: null,
    },
    {
      key: "submissions",
      title: "View submissions",
      desc: "View all your submitted placement related reocords",
      cta: "See all",
      accent: "border-l-amber-500",
      ctaColor: "text-amber-600",
      badge: null,
    },
    {
      key: "mod",
      title: "Review student contributions",
      desc: "Approve, reject, or enhance student submissions.",
      cta: "Start review",
      accent: "border-l-amber-500",
      ctaColor: "text-amber-600",
      badge:
        pendingLoading
          ? null
          : pendingCount > 0
            ? { label: `${pendingCount} pending`, color: "bg-amber-500/10 text-amber-600 border border-amber-500/20" }
            : null,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeroHeader subtitle="Manage SPC placement workflows and review what you have submitted.">
        SPC <em style={{ color: "#818CF8", fontStyle: "italic" }}>Dashboard</em>
      </PageHeroHeader>

      {/* Pending review stat card */}
      {/* <div className="mb-6">
        <div className="inline-flex flex-col rounded-xl border border-theme bg-theme-card px-5 py-3.5 shadow-sm">
          <span className="text-xs font-medium text-theme-secondary mb-1">Pending review</span>
          <span className="text-2xl font-bold text-amber-400">
            {pendingLoading ? "…" : pendingCount}
          </span>
        </div>
      </div> */}

      {/* Action cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map(({ key, title, desc, cta, accent, ctaColor, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className={`group flex flex-col gap-3.5 rounded-xl border border-theme bg-theme-card p-5 sm:p-6 text-left shadow-sm transition-colors hover:bg-theme-hero/40 border-l-[3px] ${accent}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-lg font-semibold text-theme-primary sm:text-xl">{title}</p>
              {badge ? (
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-theme-secondary sm:text-base sm:leading-7">{desc}</p>

            {/* Footer CTA */}
            <div className={`flex items-center gap-1.5 text-sm font-medium sm:text-base ${ctaColor}`}>
              <span>{cta}</span>
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M4 8a.75.75 0 0 1 .75-.75h5.69L8.22 5.03a.75.75 0 0 1 1.06-1.06l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06-1.06l2.22-2.22H4.75A.75.75 0 0 1 4 8z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [selectedCompany, setSelectedCompany] = useState(null);
  const selectedCompanyRef = useRef(null);

  const editPlacementContext = useMemo(
    () => placementContextHintForSpc(selectedCompany?.id),
    [selectedCompany?.id]
  );
  const editCompVisibility = useMemo(
    () => compensationVisibilityForTypeOfOffer(editForm.typeOfOffer),
    [editForm.typeOfOffer]
  );
  const showEditSixMonthStipend =
    String(editForm.ppoConversionType || "").trim() === "Internship+FTE";

  // pending count for stat card
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    adminAPI
      .getSubmissions({ params: { status: "pending", page: 1, limit: 1 } })
      .then(({ data }) => {
        if (isMounted) setPendingCount(data?.total ?? 0);
      })
      .catch(() => {
        if (isMounted) setPendingCount(0);
      })
      .finally(() => {
        if (isMounted) setPendingLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (companySuggestDebounceRef.current) clearTimeout(companySuggestDebounceRef.current);
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
    if (showSubmissions) loadSubmissions();
  }, [showSubmissions, loadSubmissions]);

  const [modList, setModList] = useState([]);
  const [modMeta, setModMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState("");
  const [modApproving, setModApproving] = useState(() => new Set());
  const [modRejecting, setModRejecting] = useState(() => new Set());
  const [modEnhancedContent, setModEnhancedContent] = useState(null);
  const [modAnswerGenerated, setModAnswerGenerated] = useState(false);
  const [modEnhancing, setModEnhancing] = useState(false);
  const [modAddingAnswer, setModAddingAnswer] = useState(false);
  const [modEnhanceError, setModEnhanceError] = useState("");
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
    if (showStudentMod) loadModList(modMeta.page);
  }, [showStudentMod, loadModList, modMeta.page]);

  useEffect(() => {
    try { window.scrollTo(0, 0); } catch { /* no-op */ }
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
          const nameKey = String(item?.name || "").trim().toLowerCase();
          if (!nameKey || seenNames.has(nameKey)) return false;
          seenNames.add(nameKey);
          return true;
        });
        setCompanySuggestions(items);
        const locked = selectedCompanyRef.current;
        const matchesLocked =
          locked?.id && q.trim() === String(locked.name || "").trim();
        setCompanySuggestOpen(Boolean(items.length > 0 && !matchesLocked));
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
    const companyName = String(row?.companyPlaced || row?.companyName || "").trim();
    const companyId = row?.companyId ? String(row.companyId) : "";
    setEditForm({
      studentName: String(row?.studentName || ""),
      studentEmail: String(row?.studentEmail || ""),
      studentUsn: String(row?.studentUsn || ""),
      companyPlaced: companyName,
      placementYear:
        row?.placementYear == null ? DEFAULT_PLACEMENT_DETAIL_YEAR : Number(row.placementYear),
      branchCode: String(row?.branchCode || "").trim().toLowerCase(),
      typeOfOffer: String(row?.typeOfOffer || ""),
      role: String(row?.role || ""),
      ctc: String(row?.ctc || ""),
      base: String(row?.base || ""),
      stipend: String(row?.stipend || ""),
      ppoConversionType: String(row?.ppoConversionType || ""),
      sixMonthsInternshipStipend: String(row?.sixMonthsInternshipStipend || ""),
    });
    if (companyId && companyName) {
      const linked = { id: companyId, name: companyName };
      setSelectedCompany(linked);
      selectedCompanyRef.current = linked;
    } else {
      setSelectedCompany(null);
      selectedCompanyRef.current = null;
    }
    setCompanySuggestions([]);
    setCompanySuggestOpen(false);
    setCompanySuggestLoading(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const closeRecordModal = () => {
    if (isSaving) return;
    setSelectedRecord(null);
    setEditForm(EDIT_INITIAL);
    setSelectedCompany(null);
    selectedCompanyRef.current = null;
    setCompanySuggestions([]);
    setCompanySuggestOpen(false);
    setCompanySuggestLoading(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    if (name === "companyPlaced") {
      const next = String(value || "").trim();
      const locked = selectedCompanyRef.current;
      if (!locked?.id || next !== String(locked.name || "").trim()) {
        setSelectedCompany(null);
        selectedCompanyRef.current = null;
      }
      setEditForm((prev) => ({
        ...prev,
        companyPlaced: value,
        role: next !== String(prev.companyPlaced || "").trim() ? "" : prev.role,
      }));
    } else if (name === "branchCode" || name === "placementYear") {
      setEditForm((prev) => ({
        ...prev,
        [name]: name === "placementYear" ? Number(value) : value,
        role: "",
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
    setSaveError("");
    setSaveSuccess("");
  };

  const pickSuggestedCompany = (item) => {
    const pickedName = String(item?.name || "").trim();
    if (!pickedName || !item?.id) return;
    if (companySuggestDebounceRef.current) {
      clearTimeout(companySuggestDebounceRef.current);
      companySuggestDebounceRef.current = null;
    }
    const linked = { id: String(item.id), name: pickedName };
    setSelectedCompany(linked);
    selectedCompanyRef.current = linked;
    setEditForm((prev) => ({ ...prev, companyPlaced: pickedName, role: "" }));
    setCompanySuggestions([]);
    setCompanySuggestOpen(false);
    setCompanySuggestLoading(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const saveRecord = async () => {
    if (!selectedRecord?._id) return;
    const validationErrors = validateSpcEditPlacement(editForm, selectedCompany);
    if (validationErrors.length > 0) {
      setSaveError(validationErrors.join(" "));
      return;
    }
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const updatePayload = {
        ...editForm,
        placementYear: Number(editForm.placementYear) || null,
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
    setModEnhancedContent(null);
    setModAnswerGenerated(false);
    setModEnhanceError("");
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

  const closeModModal = () => {
    setModSelected(null);
    setModEnhancedContent(null);
    setModAnswerGenerated(false);
    setModEnhanceError("");
  };

  const handleModEnhance = async (id) => {
    setModEnhancing(true);
    setModEnhanceError("");
    setModEnhancedContent(null);
    setModAnswerGenerated(false);
    try {
      const { data } = await adminAPI.enhanceSubmission(id);
      const next = data?.content;
      if (typeof next !== "string" || !next.trim()) {
        setModEnhanceError("Enhancement returned empty content.");
        return;
      }
      setModEnhancedContent(next);
      setModAnswerGenerated(false);
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Could not enhance submission.";
      setModEnhanceError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setModEnhancing(false);
    }
  };

  const handleModAddAnswer = async (id) => {
    setModAddingAnswer(true);
    setModEnhanceError("");
    setModEnhancedContent(null);
    setModAnswerGenerated(false);
    try {
      if (modSelected?.contentTruncated && String(modSelected._id) === String(id)) {
        const res = await adminAPI.getSubmission(id);
        setModSelected(res.data);
      }
      const { data } = await adminAPI.addAnswerToSubmission(id);
      const next = data?.content;
      if (typeof next !== "string" || !next.trim()) {
        setModEnhanceError("Answer generation returned empty content.");
        return;
      }
      setModEnhancedContent(next);
      setModAnswerGenerated(true);
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Could not generate answer.";
      setModEnhanceError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setModAddingAnswer(false);
    }
  };

  const handleModApprove = async (id, mergeContent) => {
    const withEnhanced = typeof mergeContent === "string" && mergeContent.trim().length > 0;
    const confirmMsg = withEnhanced
      ? modAnswerGenerated
        ? "Approve using the generated answer? This updates the company database."
        : "Approve using the AI-enhanced text? This updates the company database."
      : "Approve this submission? This updates the company database.";
    if (!window.confirm(confirmMsg)) return;
    const sid = String(id);
    const listSnapshot = modList.find((row) => String(row._id) === sid) || null;
    const listPage = modMeta.page;

    setModList((prev) => prev.filter((row) => String(row._id) !== sid));
    setModMeta((prev) => ({
      ...prev,
      total: Math.max(0, (prev.total || 0) - 1),
    }));
    setPendingCount((n) => Math.max(0, n - 1));

    setModApproving((prev) => new Set(prev).add(sid));
    try {
      await adminAPI.approveSubmission(id, withEnhanced ? { mergeContent } : {});

      setModSelected((prev) => (prev && String(prev._id) === sid ? null : prev));
      setModEnhancedContent(null);
      setModAnswerGenerated(false);
      setModEnhanceError("");

      void loadModList(listPage).catch((refreshErr) => {
        console.error("Error refreshing SPC mod list after approval:", refreshErr);
      });
    } catch (e) {
      if (listSnapshot) {
        setModList((prev) => {
          if (prev.some((row) => String(row._id) === sid)) return prev;
          return [listSnapshot, ...prev];
        });
        setModMeta((prev) => ({
          ...prev,
          total: (prev.total || 0) + 1,
        }));
        setPendingCount((n) => n + 1);
      }
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

  const modAiBusy = modEnhancing || modAddingAnswer;

  const handleModReject = async (id) => {
    if (!window.confirm("Reject will permanently delete this submission.")) return;
    const sid = String(id);
    setModRejecting((prev) => new Set(prev).add(sid));
    try {
      await adminAPI.rejectSubmission(id);
      await loadModList(modMeta.page);
      setModSelected((prev) => (prev && String(prev._id) === String(id) ? null : prev));
      setPendingCount((n) => Math.max(0, n - 1));
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

  // Navigation handler for action cards
  const handleDashboardNavigate = (key) => {
    if (key === "add") navigate("/spc/form");
    else if (key === "conversion") navigate("/spc/conversion-details");
    else if (key === "submissions") setSearchParams({ view: "submissions" });
    else if (key === "mod") {
      setModMeta((m) => ({ ...m, page: 1 }));
      setSearchParams({ view: "student-contributions" });
    }
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>

        {/* ── Landing ── */}
        {!showSubmissions && !showStudentMod ? (
          <DashboardLanding
            onNavigate={handleDashboardNavigate}
            pendingCount={pendingCount}
            pendingLoading={pendingLoading}
          />
        ) : showStudentMod ? (

          /* ── Student contributions ── */
          <>
            <PageBackNavRow>
              <PageBackButton onClick={() => setSearchParams({})} label="Back to Dashboard" />
            </PageBackNavRow>

            <div className="mx-auto w-full max-w-6xl">
              <div className="rounded-3xl border border-theme bg-theme-card p-6 shadow-xl sm:p-8">
                <div className="flex flex-wrap items-center gap-3 border-b border-theme-input pb-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-theme-primary">Pending student contributions</h2>
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
                                      modEnhancing ||
                                      modApproving.has(String(row._id)) ||
                                      modRejecting.has(String(row._id)) ||
                                      modLoading
                                    }
                                    className={MOD_BTN_SM_PRIMARY}
                                  >
                                    {modApproving.has(String(row._id)) ? "…" : "Approve"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleModReject(row._id)}
                                    disabled={
                                      modEnhancing ||
                                      modApproving.has(String(row._id)) ||
                                      modRejecting.has(String(row._id)) ||
                                      modLoading
                                    }
                                    className={MOD_BTN_SM_DANGER}
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

          /* ── My submissions / placements ── */
          <>
            <PageBackNavRow>
              <PageBackButton onClick={() => setSearchParams({})} label="Back to Dashboard" />
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
                      <h2 className="min-w-0 flex-1 text-xl font-semibold text-theme-primary">
                        Placement &amp; conversion records
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setModMeta((m) => ({ ...m, page: 1 }));
                          setSearchParams({ view: "student-contributions" });
                        }}
                        className="hidden h-10 shrink-0 items-center rounded-xl border border-theme-accent/40 bg-theme-accent/10 px-4 text-sm font-semibold text-theme-accent transition-colors hover:bg-theme-accent/20 sm:inline-flex"
                      >
                        Student contributions
                      </button>
                      <button
                        type="button"
                        onClick={loadSubmissions}
                        disabled={loading}
                        className="h-10 shrink-0 rounded-xl border border-theme-input bg-theme-input px-4 text-sm font-medium text-theme-primary transition-colors hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Refreshing…" : "Refresh"}
                      </button>
                    </div>
                    {placements.length === 0 && !loading ? (
                      <p className="text-sm text-theme-muted">No placement or conversion entries yet.</p>
                    ) : placements.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-theme">
                        <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
                          <thead className="bg-theme-hero">
                            <tr>
                              <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-muted">Updated</th>
                              <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-muted">Student</th>
                              <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-muted">Company</th>
                              <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-muted">Year</th>
                              <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-muted">Program</th>
                              <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-muted">Offer</th>
                              <th className="min-w-[11.5rem] px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-theme-muted">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-theme-card text-theme-primary">
                            {placements.map((row) => (
                              <tr key={row._id} className="hover:bg-theme-nav/50">
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
                                <td className="min-w-[11.5rem] px-3 py-2 align-middle">
                                  <button
                                    type="button"
                                    onClick={() => openRecordModal(row)}
                                    className="inline-flex w-full min-w-0 items-center justify-center whitespace-nowrap rounded-xl bg-theme-accent px-3 py-2 text-xs font-semibold leading-snug text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4 sm:text-sm"
                                  >
                                    View details / Edit
                                  </button>
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

      {/* ── Edit record modal ── */}
      {selectedRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-theme bg-theme-card p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-theme-primary">Placement record details</h3>
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
              <p><span className="font-medium text-theme-primary">Program:</span> {String(selectedRecord.branchCode || "—").toUpperCase()}</p>
              <p><span className="font-medium text-theme-primary">Type Of Offer:</span> {selectedRecord.typeOfOffer || "—"}</p>
            </div>

            <div className="space-y-5">
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SpcFormField
                  label="Student name"
                  name="studentName"
                  value={editForm.studentName}
                  onChange={onEditChange}
                  required
                  idPrefix="spc-edit"
                />
                <SpcFormField
                  label="Student email"
                  name="studentEmail"
                  type="email"
                  value={editForm.studentEmail}
                  onChange={onEditChange}
                  required
                  idPrefix="spc-edit"
                />
                <SpcFormField
                  label="Student USN"
                  name="studentUsn"
                  value={editForm.studentUsn}
                  onChange={onEditChange}
                  required
                  idPrefix="spc-edit"
                />
              </section>

              <section className="space-y-4 rounded-xl border border-theme-input bg-theme-input/30 p-4">
                <h4 className="text-sm font-semibold text-theme-primary">Placement details</h4>
                <SpcCompanySuggestField
                  inputId="spc-edit-company"
                  fieldName="companyPlaced"
                  label="Company"
                  companyQuery={editForm.companyPlaced}
                  selectedCompany={selectedCompany}
                  suggestions={companySuggestions}
                  suggestOpen={companySuggestOpen}
                  suggestLoading={companySuggestLoading}
                  suggestRootRef={companySuggestRootRef}
                  onQueryChange={onEditChange}
                  onPickCompany={pickSuggestedCompany}
                  onFocusOpen={() => {
                    if (
                      String(editForm.companyPlaced || "").trim().length >= 2 &&
                      companySuggestions.length > 0
                    ) {
                      setCompanySuggestOpen(true);
                    }
                  }}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                    <label
                      htmlFor="spc-edit-year"
                      id="spc-edit-year-label"
                      className="block text-sm font-medium text-theme-primary"
                    >
                      Placement year <span className="text-theme-accent">*</span>
                    </label>
                    <SpcThemeSelect
                      id="spc-edit-year"
                      name="placementYear"
                      required
                      value={editForm.placementYear}
                      onChange={onEditChange}
                      options={SPC_EDIT_YEAR_OPTIONS}
                      labelId="spc-edit-year-label"
                    />
                  </div>
                  <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                    <label
                      htmlFor="spc-edit-branch"
                      id="spc-edit-branch-label"
                      className="block text-sm font-medium text-theme-primary"
                    >
                      Program <span className="text-theme-accent">*</span>
                    </label>
                    <SpcThemeSelect
                      id="spc-edit-branch"
                      name="branchCode"
                      required
                      value={editForm.branchCode}
                      onChange={onEditChange}
                      options={SPC_EDIT_BRANCH_OPTIONS}
                      labelId="spc-edit-branch-label"
                    />
                  </div>
                  <div className="flex min-h-0 w-full flex-col gap-2 self-start sm:col-span-2">
                    <label
                      htmlFor="spc-edit-offer"
                      id="spc-edit-offer-label"
                      className="block text-sm font-medium text-theme-primary"
                    >
                      Type of offer <span className="text-theme-accent">*</span>
                    </label>
                    <SpcThemeSelect
                      id="spc-edit-offer"
                      name="typeOfOffer"
                      required
                      value={editForm.typeOfOffer}
                      onChange={onEditChange}
                      options={SPC_EDIT_TYPE_OF_OFFER_OPTIONS}
                      labelId="spc-edit-offer-label"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-theme-input bg-theme-input/30 p-4">
                <h4 className="text-sm font-semibold text-theme-primary">Role &amp; compensation</h4>
                <p className="text-xs text-theme-muted">
                  With company, placement year, and program from the list, roles load from that hub&apos;s visit.
                  If not known, use TBD.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-start">
                  <SpcRoleField
                    inputId="spc-edit-role"
                    companyId={selectedCompany?.id}
                    placementYear={Number(editForm.placementYear) || DEFAULT_PLACEMENT_DETAIL_YEAR}
                    placementContext={editPlacementContext}
                    branchCode={editForm.branchCode}
                    value={editForm.role}
                    onChange={onEditChange}
                  />
                  {editCompVisibility.stipend ? (
                    <SpcFormField
                      label="Stipend"
                      name="stipend"
                      value={editForm.stipend}
                      onChange={onEditChange}
                      placeholder="e.g. 50,000 or TBD"
                      required
                      hint={SPC_COMPENSATION_TBD_HINT}
                      idPrefix="spc-edit"
                    />
                  ) : null}
                  {editCompVisibility.fte ? (
                    <>
                      <SpcFormField
                        label="CTC"
                        name="ctc"
                        value={editForm.ctc}
                        onChange={onEditChange}
                        placeholder="e.g. 18 LPA or TBD"
                        required
                        hint={SPC_COMPENSATION_TBD_HINT}
                        idPrefix="spc-edit"
                      />
                      <SpcFormField
                        label="Base"
                        name="base"
                        value={editForm.base}
                        onChange={onEditChange}
                        placeholder="e.g. 12 LPA or TBD"
                        required
                        hint={SPC_COMPENSATION_TBD_HINT}
                        idPrefix="spc-edit"
                      />
                    </>
                  ) : null}
                </div>
              </section>

              {(String(editForm.typeOfOffer || "").trim() === "Internship(PPO)" ||
                editForm.ppoConversionType ||
                editForm.sixMonthsInternshipStipend) ? (
                <section className="space-y-4 rounded-xl border border-theme-input bg-theme-input/30 p-4">
                  <h4 className="text-sm font-semibold text-theme-primary">PPO conversion</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex min-h-0 w-full flex-col gap-2 self-start">
                      <label
                        htmlFor="spc-edit-conv"
                        id="spc-edit-conv-label"
                        className="block text-sm font-medium text-theme-primary"
                      >
                        PPO conversion type
                      </label>
                      <SpcThemeSelect
                        id="spc-edit-conv"
                        name="ppoConversionType"
                        value={editForm.ppoConversionType}
                        onChange={onEditChange}
                        options={SPC_EDIT_PPO_CONV_OPTIONS}
                        labelId="spc-edit-conv-label"
                      />
                    </div>
                    {showEditSixMonthStipend ? (
                      <SpcFormField
                        label="6-month internship stipend"
                        name="sixMonthsInternshipStipend"
                        value={editForm.sixMonthsInternshipStipend}
                        onChange={onEditChange}
                        placeholder="e.g. 50,000 or TBD"
                        required
                        hint={SPC_COMPENSATION_TBD_HINT}
                        idPrefix="spc-edit"
                      />
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>

            {saveError ? <p className="mt-3 text-sm text-red-400">{saveError}</p> : null}
            {saveSuccess ? <p className="mt-3 text-sm text-theme-accent">{saveSuccess}</p> : null}

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

      {/* ── Mod detail modal ── */}
      {modSelected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-theme bg-theme-card p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-theme-primary">Submission detail</h3>
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
            {modEnhanceError ? (
              <p className="mt-3 rounded-xl border border-red-300/60 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-300">
                {modEnhanceError}
              </p>
            ) : null}
            {modEnhancedContent ? (
              <div className={MOD_PREVIEW_PANEL}>
                <p className="text-base font-semibold text-theme-primary">
                  {modAnswerGenerated ? "Generated answer preview" : "AI-enhanced preview"}
                </p>
                <div className="mt-2 text-sm text-theme-secondary">
                  {(() => {
                    const c = parseSubmissionContentJson(modEnhancedContent);
                    if (c.question || c.solution) {
                      return (
                        <div className="space-y-3">
                          {c.question ? (
                            <div>
                              <p className="font-semibold text-theme-primary">Question</p>
                              <p className="mt-1 whitespace-pre-wrap">{c.question}</p>
                            </div>
                          ) : null}
                          {c.solution ? (
                            <div>
                              <p className="font-semibold text-theme-primary">Solution</p>
                              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-sans">
                                {c.solution}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                    return (
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-sans">
                        {modEnhancedContent}
                      </pre>
                    );
                  })()}
                </div>
              </div>
            ) : null}
            {modSelected.status !== "approved" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {submissionSupportsAddAnswer(modSelected.type) ? (
                  <button
                    type="button"
                    onClick={() => handleModAddAnswer(modSelected._id)}
                    disabled={
                      modAiBusy ||
                      modApproving.has(String(modSelected._id)) ||
                      modRejecting.has(String(modSelected._id)) ||
                      modLoading
                    }
                    className={MOD_BTN_SECONDARY}
                  >
                    {modAddingAnswer ? "Generating answer…" : "Add answer"}
                  </button>
                ) : null}
                {submissionSupportsEnhancement(modSelected.type) ? (
                  <button
                    type="button"
                    onClick={() => handleModEnhance(modSelected._id)}
                    disabled={
                      modAiBusy ||
                      modApproving.has(String(modSelected._id)) ||
                      modRejecting.has(String(modSelected._id)) ||
                      modLoading
                    }
                    className={MOD_BTN_SECONDARY}
                  >
                    {modEnhancing ? "Enhancing…" : "Enhance with AI"}
                  </button>
                ) : null}
                {modEnhancedContent ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleModApprove(modSelected._id, modEnhancedContent);
                        closeModModal();
                      }}
                      disabled={
                        modAiBusy ||
                        modApproving.has(String(modSelected._id)) ||
                        modRejecting.has(String(modSelected._id)) ||
                        modLoading
                      }
                      className={MOD_BTN_PRIMARY}
                    >
                      {modApproving.has(String(modSelected._id))
                        ? "Approving…"
                        : modAnswerGenerated
                          ? "Approve with answer"
                          : "Approve with enhanced"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleModApprove(modSelected._id);
                        closeModModal();
                      }}
                      disabled={
                        modAiBusy ||
                        modApproving.has(String(modSelected._id)) ||
                        modRejecting.has(String(modSelected._id)) ||
                        modLoading
                      }
                      className={MOD_BTN_MUTED}
                    >
                      {modApproving.has(String(modSelected._id)) ? "Approving…" : "Approve original"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleModApprove(modSelected._id);
                      closeModModal();
                    }}
                    disabled={
                      modAiBusy ||
                      modApproving.has(String(modSelected._id)) ||
                      modRejecting.has(String(modSelected._id)) ||
                      modLoading
                    }
                    className={MOD_BTN_PRIMARY}
                  >
                    {modApproving.has(String(modSelected._id)) ? "Approving…" : "Approve"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await handleModReject(modSelected._id);
                    closeModModal();
                  }}
                  disabled={
                    modAiBusy ||
                    modApproving.has(String(modSelected._id)) ||
                    modRejecting.has(String(modSelected._id)) ||
                    modLoading
                  }
                  className={MOD_BTN_DANGER}
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