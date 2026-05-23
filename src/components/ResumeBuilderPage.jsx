import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaFileDownload, FaSave, FaChevronDown } from "react-icons/fa";
import { resumeAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import {
  readResumeDraftCache,
  writeResumeDraftCache,
} from "../utils/resumeDraftCache";
import { exportResumeAsDocx, normalizeResumePayload } from "../utils/resumeExport";
import {
  createBlankResumeDraft,
  RESUME_TEMPLATE_IDS,
} from "./resume/defaultDraft";
import StandardClassic from "./resume/templates/StandardClassic";
import IIITVLatexStyle from "./resume/templates/IIITVLatexStyle";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

/** Same row styling as Header student-corner links */
const HEADER_DROPDOWN_ITEM_CLASS =
  "flex w-full items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary hover:bg-theme-nav rounded-md transition-colors";

function createBullet() {
  return { text: "" };
}

function createEducationItem() {
  return {
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    score: "",
    location: "",
  };
}

function createProjectItem() {
  return {
    name: "",
    techStack: "",
    link: "",
    startDate: "",
    endDate: "",
    bullets: [createBullet()],
  };
}

function createExperienceItem() {
  return {
    company: "",
    role: "",
    techStack: "",
    location: "",
    startDate: "",
    endDate: "",
    bullets: [createBullet()],
  };
}

function createAchievementItem() {
  return { title: "", detail: "" };
}

function createCertificationItem() {
  return { title: "", link: "" };
}

function hasAtLeastOneFilledEducation(education = []) {
  return education.some((item) => Object.values(item || {}).some((value) => String(value || "").trim()));
}

function sanitizeSkills(skills = []) {
  return skills.map((item) => String(item || "").trim()).filter(Boolean);
}

function validateDraft(draft) {
  const errors = [];
  if (!String(draft.personal?.fullName || "").trim()) errors.push("Name is required.");
  if (!String(draft.personal?.email || "").trim()) errors.push("Email is required.");
  if (!hasAtLeastOneFilledEducation(draft.education)) errors.push("At least one education entry is required.");
  if (sanitizeSkills(draft.skills).length === 0) errors.push("At least one skill is required.");
  if (String(draft.personal?.summary || "").length > 500) errors.push("Summary can be at most 500 characters.");

  for (const section of [...(draft.projects || []), ...(draft.experience || [])]) {
    for (const bullet of section.bullets || []) {
      if (String(bullet?.text || "").length > 250) errors.push("Bullets can be at most 250 characters.");
    }
  }
  return errors;
}

function updateAtIndex(array, index, nextValue) {
  return array.map((item, idx) => (idx === index ? nextValue : item));
}

const FIELD_LABELS = {
  fullName: "Full Name",
  email: "Email",
  phone: "Phone",
  location: "Location",
  linkedin: "LinkedIn",
  github: "GitHub",
  summary: "Summary",
  institution: "Institution",
  degree: "Degree",
  field: "Field of study",
  startDate: "Start date",
  endDate: "End date",
  score: "Score",
  name: "Project name",
  techStack: "Tech stack",
  link: "Link",
  company: "Company",
  role: "Role",
  title: "Title",
  detail: "Detail",
};

const FIELD_PLACEHOLDERS = {
  fullName: "e.g. Jane Doe",
  email: "enter mail",
  phone: "+91 98765 43210",
  location: "Bengaluru, Karnataka",
  linkedin: "https://linkedin.com/in/your-profile",
  github: "https://github.com/your-username",
  summary: "Your skills, experience, and goals (max 500 characters)",
  institution: "e.g. RV College of Engineering",
  degree: "e.g. B.E. ",
  field: "e.g. Computer Science",
  startDate: "e.g. Aug 2022",
  endDate: "e.g. May 2026",
  score: "e.g. 9.2 CGPA or 85%",
  name: "e.g. Placement Dashboard",
  techStack: "e.g. React, Node.js, MongoDB",
  link: "https://github.com/you/project",
  company: "e.g. Acme Corp",
  role: "e.g. Software Engineer Intern",
  title: "e.g. Google Code Jam Qualifier",
  detail: "Description (optional)",
};

const CERTIFICATION_PLACEHOLDERS = {
  title: "e.g. AWS Cloud Practitioner",
  link: "Link (Optional)",
};

function formatFieldLabel(field) {
  return FIELD_LABELS[field] || field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function formatFieldPlaceholder(field, sectionKey) {
  if (sectionKey === "certifications" && CERTIFICATION_PLACEHOLDERS[field]) {
    return CERTIFICATION_PLACEHOLDERS[field];
  }
  return (
    FIELD_PLACEHOLDERS[field] ??
    `Enter ${formatFieldLabel(field).toLowerCase()}`
  );
}

const BULLET_PLACEHOLDERS = {
  projects: [
    "e.g. Built a full-stack feature  with React and Node.js",
    "e.g. Improved load time by caching and query optimization",
    "e.g. Wrote unit tests and docs",
  ],
  experience: [
    "e.g. Built a full-stack feature  with React and Node.js",
    "e.g. Improved load time by caching and query optimization",
    "e.g. Wrote unit tests and docs",
  ],
};

function getBulletPlaceholder(sectionKey, index) {
  const hints = BULLET_PLACEHOLDERS[sectionKey];
  if (hints?.length) return hints[index % hints.length];
  return "Describe what you did, how you did it, and the outcome";
}

const AUTO_SAVE_DELAY_MS = 2000;

function buildDraftPayload(draft, skillsInput) {
  const normalizedSkills = String(skillsInput || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return normalizeResumePayload({
    ...draft,
    skills: normalizedSkills,
  });
}

function draftSnapshot(payload, version) {
  return JSON.stringify({ payload, version });
}

export default function ResumeBuilderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ownerEmail = String(user?.email || "").trim().toLowerCase();
  const [draft, setDraft] = useState(createBlankResumeDraft());
  const [skillsInput, setSkillsInput] = useState("");
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle");
  const [statusText, setStatusText] = useState("");
  const [errors, setErrors] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const previewRef = useRef(null);
  const templateMenuRef = useRef(null);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const isHydratingRef = useRef(true);
  const hasUnsavedChangesRef = useRef(false);
  const savedSnapshotRef = useRef("");
  const versionRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    const beforeUnloadHandler = (event) => {
      if (!hasUnsavedChangesRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => window.removeEventListener("beforeunload", beforeUnloadHandler);
  }, []);

  useEffect(() => {
    const onDocumentClick = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (templateMenuRef.current && !templateMenuRef.current.contains(target)) {
        setIsTemplateMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, []);

  const applyLoadedDraft = useCallback((responseData) => {
    const nextDraft = normalizeResumePayload(responseData);
    const nextVersion = Number(responseData.version || 0);
    setDraft(nextDraft);
    setSkillsInput((nextDraft.skills || []).join(", "));
    setVersion(nextVersion);
    versionRef.current = nextVersion;
    savedSnapshotRef.current = draftSnapshot(nextDraft, nextVersion);
    hasUnsavedChangesRef.current = false;
    setSaveState("saved");
    setStatusText("Draft loaded");
  }, []);

  const persistDraft = useCallback(
    async ({ manual = false } = {}) => {
      if (isHydratingRef.current || saveInFlightRef.current) return false;

      const nextDraft = buildDraftPayload(draft, skillsInput);
      const currentVersion = versionRef.current;
      const snapshot = draftSnapshot(nextDraft, currentVersion);
      if (!manual && snapshot === savedSnapshotRef.current) return true;

      saveInFlightRef.current = true;
      setIsSaving(true);
      setSaveState("saving");
      setStatusText("Saving draft...");

      writeResumeDraftCache(ownerEmail, {
        payload: nextDraft,
        version: currentVersion,
      });

      try {
        const res = await resumeAPI.saveDraft({ payload: nextDraft, version: currentVersion });
        const nextVersion = Number(res.data?.version ?? currentVersion);
        setDraft(nextDraft);
        setVersion(nextVersion);
        versionRef.current = nextVersion;
        savedSnapshotRef.current = draftSnapshot(nextDraft, nextVersion);
        hasUnsavedChangesRef.current = false;
        setSaveState("saved");
        setStatusText(manual ? "Draft saved" : "All changes saved");
        writeResumeDraftCache(ownerEmail, { payload: nextDraft, version: nextVersion });
        return true;
      } catch (error) {
        if (error?.response?.status === 409) {
          const latestVersion = Number(error?.response?.data?.latestVersion ?? currentVersion);
          versionRef.current = latestVersion;
          setVersion(latestVersion);
          try {
            const retry = await resumeAPI.saveDraft({
              payload: nextDraft,
              version: latestVersion,
            });
            const nextVersion = Number(retry.data?.version ?? latestVersion);
            setDraft(nextDraft);
            setVersion(nextVersion);
            versionRef.current = nextVersion;
            savedSnapshotRef.current = draftSnapshot(nextDraft, nextVersion);
            hasUnsavedChangesRef.current = false;
            setSaveState("saved");
            setStatusText(manual ? "Draft saved" : "All changes saved");
            writeResumeDraftCache(ownerEmail, { payload: nextDraft, version: nextVersion });
            return true;
          } catch {
            // fall through to error state
          }
        }
        const apiErrors = error?.response?.data?.errors;
        const apiMessage =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message;
        if (Array.isArray(apiErrors) && apiErrors.length > 0) {
          setErrors(apiErrors);
        }
        setSaveState("error");
        setStatusText(
          manual
            ? Array.isArray(apiErrors) && apiErrors.length > 0
              ? apiErrors[0]
              : apiMessage || "Save failed. Try again."
            : Array.isArray(apiErrors) && apiErrors.length > 0
              ? apiErrors[0]
              : "Could not save draft. Changes are kept in this browser session."
        );
        return false;
      } finally {
        saveInFlightRef.current = false;
        setIsSaving(false);
      }
    },
    [applyLoadedDraft, draft, ownerEmail, skillsInput]
  );

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  useEffect(() => {
    let isMounted = true;
    async function loadDraft() {
      try {
        const res = await resumeAPI.getDraft();
        if (!isMounted) return;
        applyLoadedDraft(res.data || {});
      } catch {
        if (!isMounted) return;
        const cached = readResumeDraftCache(ownerEmail);
        if (cached?.payload) {
          applyLoadedDraft({
            ...cached.payload,
            version: Number(cached.version || 0),
          });
          setStatusText("Loaded draft from this browser session");
        } else {
          setDraft(createBlankResumeDraft());
          setSkillsInput("");
          setVersion(0);
          versionRef.current = 0;
          savedSnapshotRef.current = draftSnapshot(createBlankResumeDraft(), 0);
          setSaveState("idle");
          setStatusText("");
        }
      } finally {
        if (isMounted) {
          isHydratingRef.current = false;
          setLoading(false);
        }
      }
    }
    loadDraft();
    return () => {
      isMounted = false;
    };
  }, [applyLoadedDraft, ownerEmail]);

  useEffect(() => {
    if (isHydratingRef.current) return undefined;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (hasUnsavedChangesRef.current) {
        persistDraft();
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [draft, skillsInput, persistDraft]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && hasUnsavedChangesRef.current) {
        persistDraft();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [persistDraft]);

  const previewNode = useMemo(() => {
    if (draft.templateId === RESUME_TEMPLATE_IDS.IIITV) {
      return <IIITVLatexStyle draft={draft} />;
    }
    return <StandardClassic draft={draft} />;
  }, [draft]);

  const applyDraftUpdate = (updater) => {
    setDraft((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (!isHydratingRef.current) {
        hasUnsavedChangesRef.current = true;
        setSaveState("dirty");
        setStatusText("Unsaved changes");
      }
      return next;
    });
  };

  const updatePersonalField = (field, value) => {
    applyDraftUpdate((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
  };

  const templateOptions = [
    { id: RESUME_TEMPLATE_IDS.ATS, label: "Standard ATS" },
    { id: RESUME_TEMPLATE_IDS.IIITV, label: "IIITV LaTeX Style" },
  ];
  const selectedTemplateLabel =
    templateOptions.find((option) => option.id === draft.templateId)?.label || "Select template";

  const SECTION_ORDER_HINTS = {
    education: "List your latest education first.",
    projects: "List your latest projects first.",
    experience: "List your latest experience first.",
  };

  const renderArraySection = (title, sectionKey, createItem) => {
    const orderHint = SECTION_ORDER_HINTS[sectionKey];
    return (
    <div className="bg-theme-card border border-theme rounded-lg p-4">
      <div className={`flex items-center justify-between ${orderHint ? "mb-1" : "mb-3"}`}>
        <h3 className="font-semibold text-theme-primary">{title}</h3>
        <button
          type="button"
          className="resume-accent-btn inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-theme-accent text-sm font-medium"
          onClick={() =>
            applyDraftUpdate((prev) => ({
              ...prev,
              [sectionKey]: [...(prev[sectionKey] || []), createItem()],
            }))
          }
        >
          <FaPlus /> Add
        </button>
      </div>
      {orderHint ? (
        <p className="text-xs text-theme-secondary mb-3">{orderHint}</p>
      ) : null}
      {(draft[sectionKey] || []).map((item, idx) => (
        <div key={`${sectionKey}-${idx}`} className="border border-theme rounded-md p-3 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.keys(item)
              .filter((field) => field !== "bullets")
              .map((field) => (
                <div key={field} className="space-y-1">
                  <label className="block text-[11px] font-medium text-theme-secondary">{formatFieldLabel(field)}</label>
                  <input
                    className="resume-field w-full rounded-md border border-theme bg-theme-app text-sm text-theme-primary"
                    placeholder={formatFieldPlaceholder(field, sectionKey)}
                    value={item[field] || ""}
                    onChange={(event) =>
                      applyDraftUpdate((prev) => ({
                        ...prev,
                        [sectionKey]: updateAtIndex(prev[sectionKey], idx, {
                          ...item,
                          [field]: event.target.value,
                        }),
                      }))
                    }
                  />
                </div>
              ))}
          </div>
          {Array.isArray(item.bullets) ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-medium text-theme-secondary">Bullet points</p>
              {(item.bullets || []).map((bullet, bulletIdx) => (
                <div key={`${sectionKey}-bullet-${idx}-${bulletIdx}`} className="flex gap-2">
                  <input
                    className="resume-field min-w-0 flex-1 rounded-md border border-theme bg-theme-app text-sm text-theme-primary"
                    placeholder={getBulletPlaceholder(sectionKey, bulletIdx)}
                    value={bullet.text || ""}
                    onChange={(event) => {
                      const bullets = updateAtIndex(item.bullets, bulletIdx, { text: event.target.value });
                      applyDraftUpdate((prev) => ({
                        ...prev,
                        [sectionKey]: updateAtIndex(prev[sectionKey], idx, { ...item, bullets }),
                      }));
                    }}
                  />
                  <button
                    type="button"
                    className="px-2 rounded border border-theme"
                    onClick={() => {
                      const bullets = item.bullets.filter((_, position) => position !== bulletIdx);
                      applyDraftUpdate((prev) => ({
                        ...prev,
                        [sectionKey]: updateAtIndex(prev[sectionKey], idx, { ...item, bullets }),
                      }));
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-theme-accent"
                onClick={() => {
                  const bullets = [...item.bullets, createBullet()];
                  applyDraftUpdate((prev) => ({
                    ...prev,
                    [sectionKey]: updateAtIndex(prev[sectionKey], idx, { ...item, bullets }),
                  }));
                }}
              >
                + Add bullet
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="mt-2 text-xs text-red-500"
            onClick={() =>
              applyDraftUpdate((prev) => ({
                ...prev,
                [sectionKey]: prev[sectionKey].filter((_, position) => position !== idx),
              }))
            }
          >
            Remove item
          </button>
        </div>
      ))}
    </div>
    );
  };

  const handleExportDocx = async () => {
    const normalizedSkills = skillsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const nextDraft = normalizeResumePayload({
      ...draft,
      skills: normalizedSkills,
    });
    const validationErrors = validateDraft(nextDraft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setIsExporting(true);
    try {
      await exportResumeAsDocx({ payload: nextDraft });
      setStatusText("Word document downloaded.");
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        setErrors(apiErrors);
        setStatusText("Validation error");
      } else {
        setStatusText(err?.message || "Export failed");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveDraft = async () => {
    setErrors([]);
    await persistDraft({ manual: true });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-theme-primary">Loading resume builder...</div>;
  }

  return (
    <div className={`resume-builder-form events-page-theme min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(-1)} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Your draft saves automatically while you are logged in. Export Word when you are ready.">
          Resume <em style={{ color: "#818CF8", fontStyle: "italic" }}>Builder</em>
        </PageHeroHeader>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-6">
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-sm">
            <span
              className={`text-theme-secondary ${
                saveState === "error" || saveState === "conflict" ? "text-amber-600 dark:text-amber-400" : ""
              }`}
              aria-live="polite"
            >
              {statusText ||
                (saveState === "dirty" ? "Unsaved changes" : "Draft auto-saves while you work")}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-theme text-theme-primary disabled:opacity-60"
              onClick={handleSaveDraft}
              disabled={isSaving || isExporting}
            >
              <FaSave /> {isSaving ? "Saving..." : "Save now"}
            </button>
            <button
              type="button"
              className="resume-accent-btn inline-flex items-center gap-2 px-3 py-2 rounded-md bg-theme-accent disabled:opacity-60"
              onClick={handleExportDocx}
              disabled={isExporting || isSaving}
            >
              <FaFileDownload className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
              {isExporting ? "Exporting..." : "Export Word"}
            </button>
          </div>
        </div>

        {errors.length > 0 ? (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {errors.map((error, idx) => (
              <p key={`error-${idx}`}>{error}</p>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-theme-card border border-theme rounded-lg p-4 shadow-sm">
              <h2 className="font-semibold text-theme-primary mb-3">Template</h2>
              <div className="relative shrink-0 inline-block w-full" ref={templateMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isTemplateMenuOpen}
                  className={`inline-flex w-full min-w-0 items-center justify-between gap-2 whitespace-nowrap rounded-full border-2 text-left text-sm font-semibold transition-[background-color,border-color,color] duration-200 min-h-[2.75rem] px-4 py-2 sm:px-5 ${
                    isTemplateMenuOpen
                      ? "border-theme-accent bg-theme-accent/12 text-theme-primary"
                      : "box-border border-theme bg-theme-card text-theme-primary hover:bg-theme-hero hover:border-theme-accent/55"
                  }`}
                >
                  <span className="min-w-0 truncate">{selectedTemplateLabel}</span>
                  <FaChevronDown
                    className={`h-3 w-3 shrink-0 text-theme-secondary transition ${isTemplateMenuOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {isTemplateMenuOpen ? (
                  <div
                    className="absolute left-0 right-0 top-full z-[100] mt-1 overflow-hidden rounded-md border border-theme bg-theme-card shadow-lg py-1"
                    role="listbox"
                  >
                    {templateOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={draft.templateId === option.id}
                        className={`${HEADER_DROPDOWN_ITEM_CLASS} w-full text-left ${
                          draft.templateId === option.id
                            ? "bg-theme-accent/12 text-theme-primary font-semibold"
                            : ""
                        }`}
                        onClick={() => {
                          setIsTemplateMenuOpen(false);
                          applyDraftUpdate((prev) => ({ ...prev, templateId: option.id }));
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <h2 className="font-semibold text-theme-primary mb-3">Personal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.keys(draft.personal).map((field) => (
                  <div
                    key={field}
                    className={`space-y-1 ${field === "summary" ? "md:col-span-2" : ""}`}
                  >
                    <label className="block text-[11px] font-medium text-theme-secondary">{formatFieldLabel(field)}</label>
                    {field === "summary" ? (
                      <textarea
                        className="resume-field resume-field-textarea w-full rounded-md border border-theme bg-theme-app text-sm text-theme-primary"
                        placeholder={formatFieldPlaceholder(field)}
                        rows={3}
                        value={draft.personal[field] || ""}
                        onChange={(event) => updatePersonalField(field, event.target.value)}
                      />
                    ) : (
                      <input
                        className="resume-field w-full rounded-md border border-theme bg-theme-app text-sm text-theme-primary"
                        placeholder={formatFieldPlaceholder(field)}
                        value={draft.personal[field] || ""}
                        onChange={(event) => updatePersonalField(field, event.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-lg p-4">
              <h2 className="font-semibold text-theme-primary mb-3">Skills (comma separated)</h2>
              <input
                className="resume-field w-full rounded-md border border-theme bg-theme-app px-3 text-sm text-theme-primary"
                value={skillsInput}
                onChange={(event) => {
                  const rawValue = event.target.value;
                  setSkillsInput(rawValue);
                  const skills = rawValue
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
                  applyDraftUpdate((prev) => ({
                    ...prev,
                    skills,
                  }));
                }}
                placeholder="JavaScript, React, Node.js"
              />
            </div>

            {renderArraySection("Education", "education", createEducationItem)}
            {renderArraySection("Projects", "projects", createProjectItem)}
            {renderArraySection("Experience", "experience", createExperienceItem)}
            {renderArraySection("Certifications", "certifications", createCertificationItem)}
            {renderArraySection("Achievements", "achievements", createAchievementItem)}
          </div>

          <div className="min-w-0">
            <div className="sticky top-20 min-w-0">
              <h2 className="font-semibold text-theme-primary mb-2">Live Preview</h2>
              <div ref={previewRef} className="min-w-0 border border-theme rounded-lg overflow-x-hidden overflow-y-auto max-h-[calc(100vh-6rem)]">
                {previewNode}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
