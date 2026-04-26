import { useEffect, useMemo, useRef, useState } from "react";
import { FaPlus, FaTrash, FaFileDownload, FaChevronDown, FaSave } from "react-icons/fa";
import { resumeAPI } from "../utils/api";
import { exportResume } from "../utils/resumeExport";
import {
  createBlankResumeDraft,
  RESUME_TEMPLATE_IDS,
} from "./resume/defaultDraft";
import StandardClassic from "./resume/templates/StandardClassic";
import IIITVLatexStyle from "./resume/templates/IIITVLatexStyle";

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
    location: "",
    startDate: "",
    endDate: "",
    bullets: [createBullet()],
  };
}

function createAchievementItem() {
  return { title: "", detail: "" };
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

function formatFieldLabel(field) {
  const labels = {
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    location: "Location",
    linkedin: "LinkedIn",
    github: "GitHub",
    summary: "Summary",
  };
  return labels[field] || field;
}

export default function ResumeBuilderPage() {
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

  useEffect(() => {
    let isMounted = true;
    async function loadDraft() {
      try {
        const res = await resumeAPI.getDraft();
        if (!isMounted) return;
        const responseData = res.data || {};
        const nextDraft = {
          ...createBlankResumeDraft(),
          ...responseData,
          personal: {
            ...createBlankResumeDraft().personal,
            ...(responseData.personal || {}),
          },
        };
        setDraft(nextDraft);
        setSkillsInput((nextDraft.skills || []).join(", "));
        setVersion(Number(responseData.version || 0));
      } catch {
        if (!isMounted) return;
        setDraft(createBlankResumeDraft());
        setSkillsInput("");
        setVersion(0);
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
  }, []);

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

  const renderArraySection = (title, sectionKey, createItem) => (
    <div className="bg-theme-card border border-theme rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-theme-primary">{title}</h3>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-theme-accent text-white text-sm"
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
      {(draft[sectionKey] || []).map((item, idx) => (
        <div key={`${sectionKey}-${idx}`} className="border border-theme rounded-md p-3 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.keys(item)
              .filter((field) => field !== "bullets")
              .map((field) => (
                <div key={field} className="space-y-1">
                  <label className="block text-[11px] font-medium text-theme-secondary">{formatFieldLabel(field)}</label>
                  <input
                    className="resume-field w-full rounded-md border border-theme bg-theme-app px-3 text-sm text-theme-primary"
                    placeholder={`Enter ${formatFieldLabel(field).toLowerCase()}`}
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
            <div className="mt-2 space-y-2">
              {(item.bullets || []).map((bullet, bulletIdx) => (
                <div key={`${sectionKey}-bullet-${idx}-${bulletIdx}`} className="flex gap-2">
                  <span className="flex items-center text-xs font-medium text-theme-secondary px-2">Explain</span>
                  <input
                    className="resume-field w-full rounded-md border border-theme bg-theme-app px-3 text-sm text-theme-primary"
                    placeholder="Explain"
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

  const handleExport = async () => {
    const normalizedSkills = skillsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const nextDraft = {
      ...draft,
      skills: normalizedSkills,
    };
    const validationErrors = validateDraft(nextDraft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setIsExporting(true);
    try {
      const result = await exportResume({ payload: nextDraft, previewElement: previewRef.current });
      setStatusText(result.mode === "server" ? "Exported using server fallback." : "Exported");
    } catch {
      setStatusText("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveDraft = async () => {
    const normalizedSkills = skillsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const nextDraft = {
      ...draft,
      skills: normalizedSkills,
    };
    const validationErrors = validateDraft(nextDraft);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setIsSaving(true);
    setSaveState("saving");
    setStatusText("Saving...");
    try {
      const res = await resumeAPI.saveDraft({ payload: nextDraft, version });
      setDraft(nextDraft);
      setVersion(Number(res.data?.version || version));
      setSaveState("saved");
      setStatusText("Saved");
      hasUnsavedChangesRef.current = false;
    } catch (error) {
      if (error?.response?.status === 409) {
        setSaveState("conflict");
        setStatusText("Draft conflict: refresh page to sync latest version.");
      } else {
        setSaveState("error");
        setStatusText("Save failed. Try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-theme-primary">Loading resume builder...</div>;
  }

  return (
    <div className="resume-builder-form min-h-screen bg-theme-app px-4 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-theme-primary">Resume Builder</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-theme-secondary">{statusText || "Ready"}</span>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-theme text-theme-primary disabled:opacity-60"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <FaSave /> {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-theme-accent text-white disabled:opacity-60"
              onClick={handleExport}
              disabled={isExporting || isSaving}
            >
              <FaFileDownload /> {isExporting ? "Exporting..." : "Export PDF"}
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
              <div className="relative" ref={templateMenuRef}>
                <button
                  type="button"
                  className="resume-field w-full rounded-md border border-theme bg-theme-app px-3 text-sm text-theme-primary flex items-center justify-between"
                  onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
                >
                  <span>{selectedTemplateLabel}</span>
                  <FaChevronDown
                    className={`text-theme-secondary transition-transform ${isTemplateMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isTemplateMenuOpen ? (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-theme bg-theme-card shadow-lg overflow-hidden">
                    {templateOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          draft.templateId === option.id
                            ? "bg-theme-accent text-white"
                            : "text-theme-primary hover:bg-theme-card-hover"
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
                  <div key={field} className="space-y-1">
                    <label className="block text-[11px] font-medium text-theme-secondary">{formatFieldLabel(field)}</label>
                    <input
                      className="resume-field w-full rounded-md border border-theme bg-theme-app px-3 text-sm text-theme-primary"
                      placeholder={`Enter ${formatFieldLabel(field).toLowerCase()}`}
                      value={draft.personal[field] || ""}
                      onChange={(event) => updatePersonalField(field, event.target.value)}
                    />
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
                  applyDraftUpdate((prev) => ({
                    ...prev,
                    skills: prev.skills,
                  }));
                }}
                placeholder="JavaScript, React, Node.js"
              />
            </div>

            {renderArraySection("Education", "education", createEducationItem)}
            {renderArraySection("Projects", "projects", createProjectItem)}
            {renderArraySection("Experience", "experience", createExperienceItem)}
            {renderArraySection("Achievements", "achievements", createAchievementItem)}
          </div>

          <div>
            <div className="sticky top-20">
              <h2 className="font-semibold text-theme-primary mb-2">Live Preview</h2>
              <div ref={previewRef} className="border border-theme rounded-lg overflow-hidden">
                {previewNode}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
