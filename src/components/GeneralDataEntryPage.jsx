import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaChevronRight, FaPlus, FaTrash } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { GENERAL_BASE } from "../constants/tenant.js";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const inputClass =
  "w-full rounded-xl border-2 border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary";
const labelClass = "mb-1 block text-xs font-medium text-theme-secondary";
const sectionCardClass = "rounded-2xl border border-theme bg-theme-card p-4 sm:p-5";

function emptyQuestion() {
  return {
    kind: "non_coding",
    question: "",
    answer: "",
    solutions: { cpp: "", java: "", python: "" },
    intuition: "",
    status: "approved",
    isAnonymous: false,
  };
}

function emptyExperience() {
  return { content: "", status: "approved", isAnonymous: false };
}

function emptyMustDo() {
  return { topic: "", status: "approved" };
}

function emptyCoding() {
  return {
    questionJson: "{\n  \"Title\": \"\"\n}",
    solutions: { cpp: "", java: "", python: "" },
    intuition: "",
    status: "approved",
  };
}

function emptyMcq() {
  return { json: "{\n  \"question\": \"\"\n}" };
}

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <select className={inputClass} value={value || "approved"} onChange={(e) => onChange(e.target.value)}>
      <option value="approved">approved</option>
      <option value="pending">pending</option>
    </select>
  );
}

function QuestionEditor({ item, onChange, onRemove, title }) {
  const sols = item.solutions || { cpp: "", java: "", python: "" };
  return (
    <div className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-theme-primary">{title}</p>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme px-2 py-1 text-xs text-theme-secondary hover:text-red-500"
        >
          <FaTrash className="h-3 w-3" />
          Remove
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kind">
          <select
            className={inputClass}
            value={item.kind || "non_coding"}
            onChange={(e) => onChange({ ...item, kind: e.target.value })}
          >
            <option value="non_coding">non_coding</option>
            <option value="coding">coding</option>
          </select>
        </Field>
        <Field label="Status">
          <StatusSelect value={item.status} onChange={(status) => onChange({ ...item, status })} />
        </Field>
      </div>
      <Field label="Question">
        <textarea
          className={`${inputClass} min-h-[96px]`}
          value={item.question || ""}
          onChange={(e) => onChange({ ...item, question: e.target.value })}
        />
      </Field>
      <Field label="Answer">
        <textarea
          className={`${inputClass} min-h-[80px]`}
          value={item.answer || ""}
          onChange={(e) => onChange({ ...item, answer: e.target.value })}
        />
      </Field>
      <Field label="Intuition">
        <textarea
          className={`${inputClass} min-h-[80px]`}
          value={item.intuition || ""}
          onChange={(e) => onChange({ ...item, intuition: e.target.value })}
        />
      </Field>
      <Field label="C++ solution">
        <textarea
          className={`${inputClass} min-h-[88px] font-mono text-xs`}
          value={sols.cpp || ""}
          onChange={(e) => onChange({ ...item, solutions: { ...sols, cpp: e.target.value } })}
        />
      </Field>
      <Field label="Java solution">
        <textarea
          className={`${inputClass} min-h-[88px] font-mono text-xs`}
          value={sols.java || ""}
          onChange={(e) => onChange({ ...item, solutions: { ...sols, java: e.target.value } })}
        />
      </Field>
      <Field label="Python solution">
        <textarea
          className={`${inputClass} min-h-[88px] font-mono text-xs`}
          value={sols.python || ""}
          onChange={(e) => onChange({ ...item, solutions: { ...sols, python: e.target.value } })}
        />
      </Field>
    </div>
  );
}

function ExperienceEditor({ item, onChange, onRemove, title }) {
  return (
    <div className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-theme-primary">{title}</p>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme px-2 py-1 text-xs text-theme-secondary hover:text-red-500"
        >
          <FaTrash className="h-3 w-3" />
          Remove
        </button>
      </div>
      <Field label="Status">
        <StatusSelect value={item.status} onChange={(status) => onChange({ ...item, status })} />
      </Field>
      <Field label="Content">
        <textarea
          className={`${inputClass} min-h-[120px]`}
          value={item.content || ""}
          onChange={(e) => onChange({ ...item, content: e.target.value })}
        />
      </Field>
      <label className="inline-flex items-center gap-2 text-sm text-theme-secondary">
        <input
          type="checkbox"
          checked={item.isAnonymous === true}
          onChange={(e) => onChange({ ...item, isAnonymous: e.target.checked })}
        />
        Anonymous
      </label>
    </div>
  );
}

export default function GeneralDataEntryPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [listError, setListError] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await companyAPI.getCompanyNames();
        if (cancelled) return;
        setCompanies(Array.isArray(res.data) ? res.data : []);
        setListError("");
      } catch (err) {
        if (!cancelled) {
          setCompanies([]);
          setListError(err?.response?.data?.error || "Could not load companies.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!companyId) {
      setDetail(null);
      setDetailError("");
      return undefined;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setSaveMessage("");
    (async () => {
      try {
        const res = await companyAPI.getPlatformContent(companyId);
        if (cancelled) return;
        setDetail(res.data);
        setDetailError("");
      } catch (err) {
        if (!cancelled) {
          setDetail(null);
          setDetailError(err?.response?.data?.error || "Could not load company content.");
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((row) => String(row.name || "").toLowerCase().includes(q));
  }, [companies, search]);

  const updateList = (key, next) => {
    setDetail((prev) => (prev ? { ...prev, [key]: next } : prev));
  };

  const save = async () => {
    if (!companyId || !detail) return;
    setSaving(true);
    setSaveMessage("");
    setDetailError("");
    try {
      const res = await companyAPI.savePlatformContent(companyId, {
        onlineQuestions: detail.onlineQuestions,
        interviewQuestions: detail.interviewQuestions,
        interviewExperiences: detail.interviewExperiences,
        internshipExperiences: detail.internshipExperiences,
        mustDoTopics: detail.mustDoTopics,
        codingQuestions: detail.codingQuestions,
        mcqQuestions: detail.mcqQuestions,
      });
      setDetail(res.data);
      setSaveMessage("Saved.");
    } catch (err) {
      setDetailError(err?.response?.data?.error || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  if (companyId) {
    return (
      <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
        <PageHeroFontStyles />
        <div className={pageShellInnerClass}>
          <PageBackNavRow>
            <PageBackButton onClick={() => navigate(`${GENERAL_BASE}/data-entry`)} label="Back" />
          </PageBackNavRow>
          <PageHeroHeader subtitle={detail?.exists === false ? "No platform document yet. Saving will create one." : ""}>
            {detail?.name || "Company content"}
          </PageHeroHeader>

          {loadingDetail ? (
            <p className="text-center text-sm text-theme-secondary">Loading…</p>
          ) : null}
          {detailError ? (
            <p className="mb-4 text-center text-sm text-red-500">{detailError}</p>
          ) : null}
          {saveMessage ? (
            <p className="mb-4 text-center text-sm text-emerald-500">{saveMessage}</p>
          ) : null}

          {detail ? (
            <div className="space-y-6">
              <section className={sectionCardClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-theme-primary">OA questions</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() => updateList("onlineQuestions", [...(detail.onlineQuestions || []), emptyQuestion()])}
                  >
                    <FaPlus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(detail.onlineQuestions || []).map((item, index) => (
                    <QuestionEditor
                      key={item._id || `oa-${index}`}
                      title={`OA ${index + 1}`}
                      item={item}
                      onChange={(next) => {
                        const list = [...(detail.onlineQuestions || [])];
                        list[index] = next;
                        updateList("onlineQuestions", list);
                      }}
                      onRemove={() =>
                        updateList(
                          "onlineQuestions",
                          (detail.onlineQuestions || []).filter((_, i) => i !== index)
                        )
                      }
                    />
                  ))}
                </div>
              </section>

              <section className={sectionCardClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-theme-primary">Interview questions</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() =>
                      updateList("interviewQuestions", [...(detail.interviewQuestions || []), emptyQuestion()])
                    }
                  >
                    <FaPlus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(detail.interviewQuestions || []).map((item, index) => (
                    <QuestionEditor
                      key={item._id || `iq-${index}`}
                      title={`Interview Q ${index + 1}`}
                      item={item}
                      onChange={(next) => {
                        const list = [...(detail.interviewQuestions || [])];
                        list[index] = next;
                        updateList("interviewQuestions", list);
                      }}
                      onRemove={() =>
                        updateList(
                          "interviewQuestions",
                          (detail.interviewQuestions || []).filter((_, i) => i !== index)
                        )
                      }
                    />
                  ))}
                </div>
              </section>

              <section className={sectionCardClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-theme-primary">Interview experiences</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() =>
                      updateList("interviewExperiences", [
                        ...(detail.interviewExperiences || []),
                        emptyExperience(),
                      ])
                    }
                  >
                    <FaPlus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(detail.interviewExperiences || []).map((item, index) => (
                    <ExperienceEditor
                      key={item._id || `ie-${index}`}
                      title={`Experience ${index + 1}`}
                      item={item}
                      onChange={(next) => {
                        const list = [...(detail.interviewExperiences || [])];
                        list[index] = next;
                        updateList("interviewExperiences", list);
                      }}
                      onRemove={() =>
                        updateList(
                          "interviewExperiences",
                          (detail.interviewExperiences || []).filter((_, i) => i !== index)
                        )
                      }
                    />
                  ))}
                </div>
              </section>

              <section className={sectionCardClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-theme-primary">Internship experiences</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() =>
                      updateList("internshipExperiences", [
                        ...(detail.internshipExperiences || []),
                        emptyExperience(),
                      ])
                    }
                  >
                    <FaPlus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(detail.internshipExperiences || []).map((item, index) => (
                    <ExperienceEditor
                      key={item._id || `ix-${index}`}
                      title={`Internship ${index + 1}`}
                      item={item}
                      onChange={(next) => {
                        const list = [...(detail.internshipExperiences || [])];
                        list[index] = next;
                        updateList("internshipExperiences", list);
                      }}
                      onRemove={() =>
                        updateList(
                          "internshipExperiences",
                          (detail.internshipExperiences || []).filter((_, i) => i !== index)
                        )
                      }
                    />
                  ))}
                </div>
              </section>

              <section className={sectionCardClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-theme-primary">Must-do topics</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() => updateList("mustDoTopics", [...(detail.mustDoTopics || []), emptyMustDo()])}
                  >
                    <FaPlus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(detail.mustDoTopics || []).map((item, index) => (
                    <div
                      key={item._id || `md-${index}`}
                      className="grid gap-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:grid-cols-[1fr_140px_auto] sm:items-end"
                    >
                      <Field label="Topic">
                        <input
                          className={inputClass}
                          value={item.topic || ""}
                          onChange={(e) => {
                            const list = [...(detail.mustDoTopics || [])];
                            list[index] = { ...item, topic: e.target.value };
                            updateList("mustDoTopics", list);
                          }}
                        />
                      </Field>
                      <Field label="Status">
                        <StatusSelect
                          value={item.status}
                          onChange={(status) => {
                            const list = [...(detail.mustDoTopics || [])];
                            list[index] = { ...item, status };
                            updateList("mustDoTopics", list);
                          }}
                        />
                      </Field>
                      <button
                        type="button"
                        onClick={() =>
                          updateList(
                            "mustDoTopics",
                            (detail.mustDoTopics || []).filter((_, i) => i !== index)
                          )
                        }
                        className="mb-0.5 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-theme px-3 text-xs text-theme-secondary hover:text-red-500"
                      >
                        <FaTrash className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className={sectionCardClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-theme-primary">Coding questions</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() =>
                      updateList("codingQuestions", [...(detail.codingQuestions || []), emptyCoding()])
                    }
                  >
                    <FaPlus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(detail.codingQuestions || []).map((item, index) => {
                    const sols = item.solutions || { cpp: "", java: "", python: "" };
                    return (
                      <div
                        key={item._id || `cq-${index}`}
                        className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-theme-primary">Coding {index + 1}</p>
                          <button
                            type="button"
                            onClick={() =>
                              updateList(
                                "codingQuestions",
                                (detail.codingQuestions || []).filter((_, i) => i !== index)
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-theme px-2 py-1 text-xs text-theme-secondary hover:text-red-500"
                          >
                            <FaTrash className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                        <Field label="Question JSON">
                          <textarea
                            className={`${inputClass} min-h-[140px] font-mono text-xs`}
                            value={item.questionJson || ""}
                            onChange={(e) => {
                              const list = [...(detail.codingQuestions || [])];
                              list[index] = { ...item, questionJson: e.target.value };
                              updateList("codingQuestions", list);
                            }}
                          />
                        </Field>
                        <Field label="Intuition">
                          <textarea
                            className={`${inputClass} min-h-[80px]`}
                            value={item.intuition || ""}
                            onChange={(e) => {
                              const list = [...(detail.codingQuestions || [])];
                              list[index] = { ...item, intuition: e.target.value };
                              updateList("codingQuestions", list);
                            }}
                          />
                        </Field>
                        <Field label="Status">
                          <StatusSelect
                            value={item.status}
                            onChange={(status) => {
                              const list = [...(detail.codingQuestions || [])];
                              list[index] = { ...item, status };
                              updateList("codingQuestions", list);
                            }}
                          />
                        </Field>
                        {["cpp", "java", "python"].map((lang) => (
                          <Field key={lang} label={`${lang} solution`}>
                            <textarea
                              className={`${inputClass} min-h-[88px] font-mono text-xs`}
                              value={sols[lang] || ""}
                              onChange={(e) => {
                                const list = [...(detail.codingQuestions || [])];
                                list[index] = {
                                  ...item,
                                  solutions: { ...sols, [lang]: e.target.value },
                                };
                                updateList("codingQuestions", list);
                              }}
                            />
                          </Field>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={sectionCardClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-theme-primary">MCQ questions</h2>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() => updateList("mcqQuestions", [...(detail.mcqQuestions || []), emptyMcq()])}
                  >
                    <FaPlus className="h-3 w-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(detail.mcqQuestions || []).map((item, index) => (
                    <div
                      key={item.key || `mcq-${index}`}
                      className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-theme-primary">MCQ {index + 1}</p>
                        <button
                          type="button"
                          onClick={() =>
                            updateList(
                              "mcqQuestions",
                              (detail.mcqQuestions || []).filter((_, i) => i !== index)
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-theme px-2 py-1 text-xs text-theme-secondary hover:text-red-500"
                        >
                          <FaTrash className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                      <Field label="JSON">
                        <textarea
                          className={`${inputClass} min-h-[120px] font-mono text-xs`}
                          value={item.json || ""}
                          onChange={(e) => {
                            const list = [...(detail.mcqQuestions || [])];
                            list[index] = { ...item, json: e.target.value };
                            updateList("mcqQuestions", list);
                          }}
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </section>

              <div className="sticky bottom-4 z-10 flex justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="rounded-xl bg-theme-accent px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(`${GENERAL_BASE}/admin/dashboard`)} label="Back to platform admin" />
        </PageBackNavRow>
        <PageHeroHeader subtitle="Platform admin editor for company_platform_content. Open a company to view, add, or edit fields.">
          Data entry
        </PageHeroHeader>

        <div className="mx-auto mb-4 max-w-3xl">
          <input
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies"
            aria-label="Search companies"
          />
        </div>
        {listError ? (
          <p className="mb-4 text-center text-sm text-red-500">{listError}</p>
        ) : null}

        <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-theme bg-theme-card">
          {filtered.map((row) => (
            <button
              key={row._id}
              type="button"
              onClick={() => navigate(`${GENERAL_BASE}/data-entry/${row._id}`)}
              className="flex w-full items-center justify-between gap-3 border-b border-theme px-4 py-3 text-left last:border-b-0 hover:bg-theme-hero/50"
            >
              <span className="min-w-0 truncate text-sm font-medium text-theme-primary">{row.name}</span>
              <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-theme-muted" />
            </button>
          ))}
          {!filtered.length ? (
            <p className="px-4 py-6 text-center text-sm text-theme-secondary">No companies found.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
