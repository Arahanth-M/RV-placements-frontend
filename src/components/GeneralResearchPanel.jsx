import { useEffect, useRef, useState } from "react";
import { companyAPI } from "../utils/api";
import PrepRichText from "./PrepRichText.jsx";
import PlatformGeneratedSolutionView from "./platform/PlatformGeneratedSolutionView.jsx";
import SpcThemeSelect from "./SpcThemeSelect.jsx";

const inputClass =
  "w-full rounded-xl border-2 border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary";
const selectButtonClass = `${inputClass} outline-none focus:border-theme-accent`;
const labelClass = "mb-1 block text-xs font-medium text-theme-secondary";
const sectionCardClass = "rounded-2xl border border-theme bg-theme-card p-4 sm:p-5";

export const RESEARCH_POLL_MS = 2000;
/** BullMQ research (Tavily + Firecrawl + Groq) can exceed several minutes for many sources. */
export const RESEARCH_POLL_MAX_MS = 900000;
const MAX_SOURCES = 8;

const STATUS_COPY = {
  queued: "Research queued...",
  running: "Researching web sources...",
  review: "Research completed — review the results below.",
  published: "Published.",
  failed: "Research failed.",
  timed_out: "Research timed out. The job may still be running; refresh or check again in a minute.",
};

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function apiErrorMessage(err, fallback) {
  const data = err?.response?.data?.error;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data.message === "string" && data.message.trim()) return data.message.trim();
  return fallback;
}

function httpUrl(value) {
  const url = String(value || "").trim();
  if (!/^https?:\/\//i.test(url)) return "";
  return url;
}

function kindLabel(kind) {
  if (kind === "coding") return "Coding (DSA)";
  if (kind === "sql") return "SQL";
  if (kind === "mcq") return "MCQ";
  if (kind === "non_coding") return "Non-coding";
  return typeof kind === "string" ? kind : "";
}

function oaFormLabel(item) {
  const form = item?.form || item?.kind;
  return kindLabel(form);
}

const OA_ROLE_OPTIONS = [
  { value: "SDE", label: "SDE" },
  { value: "Analyst", label: "Analyst" },
  { value: "Data Scientist", label: "Data Scientist" },
];

function SourceLink({ url, children }) {
  const href = httpUrl(url);
  if (!href) return <span className="break-all text-theme-secondary">{children || url || "Source"}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-theme-accent underline"
    >
      {children || href}
    </a>
  );
}

function ResearchStats({ stats, itemNoun = "Questions" }) {
  if (!stats || typeof stats !== "object") return null;
  const noun = String(itemNoun || "Questions");
  const rows = [
    ["Search queries", stats.searchQueries],
    ["Sources found", stats.searchedResults],
    ["Sources selected", stats.selectedSources],
    ["Sources extracted", stats.extractedSources],
    ["Sources failed", stats.failedSources],
    [`${noun} extracted`, stats.extractedCandidates],
    ["Duplicates removed", stats.duplicateCandidates],
    [`Final ${noun.toLowerCase()}`, stats.finalCandidates],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-theme-secondary">{label}</dt>
          <dd className="text-sm font-semibold text-theme-primary">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ResearchSources({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  return (
    <div className="space-y-3">
      {sources.map((source, index) => (
        <div
          key={`${source?.url || "source"}-${index}`}
          className="space-y-1 rounded-xl border border-theme bg-theme-hero/30 p-3"
        >
          <p className="text-sm font-medium text-theme-primary">{source?.title || "Untitled source"}</p>
          <SourceLink url={source?.url}>{source?.url}</SourceLink>
          {typeof source?.tavilyScore === "number" && Number.isFinite(source.tavilyScore) ? (
            <p className="text-xs text-theme-secondary">Tavily score {source.tavilyScore}</p>
          ) : null}
          <p className="text-xs text-theme-secondary">
            Extraction {source?.extractionStatus || "—"} · Structure {source?.structureStatus || "—"}
            {source?.errorCode ? ` · ${source.errorCode}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ResearchQuestions({
  items,
  itemIndexes,
  selectedIndexes,
  onToggle,
  disabled,
  showAnswers = false,
  selectable = true,
  heading = "Interview question",
  hideSourceLinks = false,
}) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const rows = itemIndexes
    ? itemIndexes.map((index) => ({ index, item: items[index] })).filter((row) => row.item)
    : items.map((item, index) => ({ index, item }));
  return (
    <div className="space-y-3">
      {rows.map(({ index, item }) => {
        const supporting = Array.isArray(item?.supportingSources) ? item.supportingSources : [];
        const questionLabel = item?.question || `Question ${index + 1}`;
        return (
          <article
            key={`${item?.sourceUrl || "question"}-${index}`}
            className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4"
          >
            {selectable ? (
              <label className="flex items-center gap-2 text-sm text-theme-primary">
                <input
                  type="checkbox"
                  checked={selectedIndexes.has(index)}
                  disabled={disabled}
                  onChange={() => onToggle(index)}
                  aria-label={`Select ${questionLabel}`}
                />
                Select
              </label>
            ) : null}
            <p className="text-xs font-medium uppercase tracking-wide text-theme-secondary">{heading}</p>
            <p className="text-sm font-semibold text-theme-primary">{item?.question || ""}</p>
            <p className="text-xs text-theme-secondary">
              Form{" "}
              <span className="font-medium text-theme-primary">{oaFormLabel(item)}</span>
            </p>
            {item?.form === "mcq" && Array.isArray(item?.mcqMetadata?.options) ? (
              <ul className="list-none space-y-1 text-sm text-theme-secondary">
                {item.mcqMetadata.options.map((opt) => (
                  <li key={opt.id}>
                    <span className="font-semibold text-theme-accent">{opt.id}.</span> {opt.text}
                  </li>
                ))}
              </ul>
            ) : null}
            {!hideSourceLinks ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Evidence
                </p>
                <p className="whitespace-pre-wrap text-sm text-theme-primary">{item?.evidence || ""}</p>
              </div>
            ) : null}
            {!hideSourceLinks ? (
              <>
                <div className="text-sm text-theme-secondary">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide">Source</p>
                  <SourceLink url={item?.sourceUrl}>{item?.sourceTitle || item?.sourceUrl}</SourceLink>
                </div>
                {supporting.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-theme-secondary">
                      Supported by {supporting.length} {supporting.length === 1 ? "source" : "sources"}
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {supporting.map((source, sourceIndex) => (
                        <li key={`${source?.sourceUrl || "support"}-${sourceIndex}`}>
                          <SourceLink url={source?.sourceUrl}>
                            {source?.sourceTitle || source?.sourceUrl}
                          </SourceLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}
            {showAnswers ? (
              <PlatformGeneratedSolutionView
                answer={item?.answer}
                solutions={item?.solutions}
                intuition={item?.intuition}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export function ResearchExperiences({
  items,
  itemIndexes,
  selectedIndexes,
  onToggle,
  disabled,
  selectable = true,
}) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const rows = itemIndexes
    ? itemIndexes.map((index) => ({ index, item: items[index] })).filter((row) => row.item)
    : items.map((item, index) => ({ index, item }));
  return (
    <div className="space-y-3">
      {rows.map(({ index, item }) => {
        const supporting = Array.isArray(item?.supportingSources) ? item.supportingSources : [];
        return (
          <article
            key={`${item?.sourceUrl || "experience"}-${index}`}
            className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4"
          >
            {selectable ? (
              <label className="flex items-center gap-2 text-sm text-theme-primary">
                <input
                  type="checkbox"
                  checked={selectedIndexes.has(index)}
                  disabled={disabled}
                  onChange={() => onToggle(index)}
                  aria-label={`Select experience ${index + 1}`}
                />
                Select
              </label>
            ) : null}
            <p className="text-xs font-medium uppercase tracking-wide text-theme-secondary">
              Interview experience
              {item?.summarized ? " · Summarized" : ""}
            </p>
            <PrepRichText variant="theme">{item?.content || ""}</PrepRichText>
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Evidence
              </p>
              <p className="whitespace-pre-wrap text-sm text-theme-primary">{item?.evidence || ""}</p>
            </div>
            <div className="text-sm text-theme-secondary">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide">Source</p>
              <SourceLink url={item?.sourceUrl}>{item?.sourceTitle || item?.sourceUrl}</SourceLink>
            </div>
            {supporting.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-medium text-theme-secondary">
                  Supported by {supporting.length} {supporting.length === 1 ? "source" : "sources"}
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {supporting.map((source, sourceIndex) => (
                    <li key={`${source?.sourceUrl || "support"}-${sourceIndex}`}>
                      <SourceLink url={source?.sourceUrl}>
                        {source?.sourceTitle || source?.sourceUrl}
                      </SourceLink>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function ReviewTabs({ active, onChange, sourceCount, questionCount }) {
  const tabs = [
    { id: "sources", label: `Research links (${sourceCount})` },
    { id: "questions", label: `Interview questions (${questionCount})` },
  ];
  return (
    <div className="flex flex-wrap gap-2 border-b border-theme pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
            active === tab.id
              ? "bg-theme-accent text-white"
              : "border border-theme text-theme-primary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const CONTENT_FIELDS = [
  { id: "interviewQuestions", label: "Interview questions", action: "Research interview questions" },
  { id: "onlineQuestions", label: "OA questions", action: "Research OA questions" },
  { id: "interviewExperiences", label: "Interview experiences", action: "Research interview experiences" },
];

function contentCopy(field) {
  if (field === "onlineQuestions") {
    return "Research OA questions for SDE, Analyst, or Data Scientist. Questions are normalized to coding (DSA), SQL, or MCQ. Links are not saved. Finalize, generate answers, then publish.";
  }
  if (field === "interviewExperiences") {
    return "Research interview experiences for this company. The full writeup is kept unless it is longer than 12,000 characters, in which case a summary is saved. Source links are published to Quick Links with the experiences.";
  }
  return "Approve research links and interview questions separately. Finalize your question list, generate answers, then publish questions to the company.";
}

export default function GeneralResearchPanel({ companyId, companyName }) {
  const [contentField, setContentField] = useState("interviewQuestions");
  const [jobField, setJobField] = useState("");
  const [role, setRole] = useState("");
  const [country, setCountry] = useState("India");
  const [maxSources, setMaxSources] = useState(3);
  const [searchDepth, setSearchDepth] = useState("basic");
  const [researchStarting, setResearchStarting] = useState(false);
  const [researchJobId, setResearchJobId] = useState("");
  const [researchStatus, setResearchStatus] = useState("");
  const [researchResult, setResearchResult] = useState(null);
  const [researchError, setResearchError] = useState("");
  const [selectedIndexes, setSelectedIndexes] = useState(() => new Set());
  const [reviewTab, setReviewTab] = useState("sources");
  const [publishingSources, setPublishingSources] = useState(false);
  const [sourcesPublishSummary, setSourcesPublishSummary] = useState(null);
  const [questionsFinalized, setQuestionsFinalized] = useState(false);
  const [finalizedIndexes, setFinalizedIndexes] = useState([]);
  const [generatingAnswers, setGeneratingAnswers] = useState(false);
  const [answersGenerated, setAnswersGenerated] = useState(false);
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSummary, setPublishSummary] = useState(null);
  const [researchJobSnapshot, setResearchJobSnapshot] = useState(null);
  const [linksSummaryText, setLinksSummaryText] = useState("");
  const [generatingLinksSummary, setGeneratingLinksSummary] = useState(false);
  const [savingLinksSummary, setSavingLinksSummary] = useState(false);
  const statusRef = useRef("");
  const deadlineRef = useRef({ id: "", at: 0 });
  const generationRef = useRef(0);

  useEffect(() => {
    statusRef.current = researchStatus;
  }, [researchStatus]);

  useEffect(() => {
    if (!researchJobId) return undefined;
    const jobId = researchJobId;
    const generation = generationRef.current;
    if (deadlineRef.current.id !== jobId) {
      deadlineRef.current = { id: jobId, at: Date.now() + RESEARCH_POLL_MAX_MS };
    }
    let cancelled = false;
    let timer = 0;

    const stop = () => {
      cancelled = true;
      window.clearInterval(timer);
    };

    const poll = async () => {
      if (cancelled || generationRef.current !== generation) return;
      const current = statusRef.current;
      if (current && current !== "queued" && current !== "running") {
        stop();
        return;
      }
      if (Date.now() >= deadlineRef.current.at) {
        if (generationRef.current !== generation) return;
        statusRef.current = "timed_out";
        setResearchStatus("timed_out");
        stop();
        return;
      }
      try {
        const res = await companyAPI.getCompanyResearchStatus(jobId);
        if (cancelled || generationRef.current !== generation) return;
        const job = res?.data || {};
        if (job.jobId && job.jobId !== jobId) return;
        const next = typeof job.status === "string" ? job.status : "";
        if (next === "review") {
          statusRef.current = "review";
          setResearchStatus("review");
          setResearchResult(job.result ?? null);
          if (typeof job.field === "string" && job.field) setJobField(job.field);
          setResearchJobSnapshot({
            role: typeof job.role === "string" ? job.role : "",
            linksSummaryDraft: job.linksSummaryDraft ?? null,
          });
          const draftSummary =
            typeof job.linksSummaryDraft?.summary === "string"
              ? job.linksSummaryDraft.summary
              : "";
          setLinksSummaryText(draftSummary);
          setResearchError("");
          stop();
          return;
        }
        if (next === "failed") {
          statusRef.current = "failed";
          setResearchStatus("failed");
          setResearchResult(null);
          setResearchError(job.error?.message || "Research failed.");
          stop();
          return;
        }
        if (next === "queued" || next === "running") {
          statusRef.current = next;
          setResearchStatus(next);
        }
      } catch {
        // Keep polling until the deadline. A single status read can fail transiently.
      }
    };

    timer = window.setInterval(() => {
      void poll();
    }, RESEARCH_POLL_MS);
    void poll();

    return () => {
      stop();
    };
  }, [researchJobId]);

  const startResearch = async () => {
    const company = String(companyName || "").trim();
    const id = String(companyId || "").trim();
    const sources = Number(maxSources);
    if (!id || !company) {
      setResearchError("Company name is required.");
      return;
    }
    if (!Number.isInteger(sources) || sources < 1 || sources > MAX_SOURCES) {
      setResearchError(`Maximum sources must be an integer from 1 to ${MAX_SOURCES}.`);
      return;
    }
    if (searchDepth !== "basic" && searchDepth !== "advanced") {
      setResearchError("Search depth must be basic or advanced.");
      return;
    }
    if (contentField === "onlineQuestions" && !String(role || "").trim()) {
      setResearchError("Choose a role: SDE, Analyst, or Data Scientist.");
      return;
    }

    generationRef.current += 1;
    setResearchStarting(true);
    setResearchError("");
    setResearchResult(null);
    setResearchStatus("");
    setResearchJobId("");
    setSelectedIndexes(new Set());
    setReviewTab(contentField === "interviewQuestions" ? "sources" : "questions");
    setPublishingSources(false);
    setSourcesPublishSummary(null);
    setQuestionsFinalized(false);
    setFinalizedIndexes([]);
    setGeneratingAnswers(false);
    setAnswersGenerated(false);
    setConfirmingPublish(false);
    setPublishing(false);
    setPublishSummary(null);
    setResearchJobSnapshot(null);
    setLinksSummaryText("");
    setGeneratingLinksSummary(false);
    setSavingLinksSummary(false);
    statusRef.current = "";
    setJobField(contentField);
    const generation = generationRef.current;
    try {
      const res = await companyAPI.startCompanyResearch({
        companyId: id,
        companyName: company,
        field: contentField,
        role: String(role || "").trim(),
        country: String(country || "").trim(),
        maxSources: sources,
        searchDepth,
      });
      const jobId = res?.data?.jobId;
      if (generationRef.current !== generation) return;
      if (!jobId) {
        setResearchError("Research could not be started.");
        return;
      }
      statusRef.current = res.data.status || "queued";
      setResearchStatus(statusRef.current);
      setResearchJobId(String(jobId));
    } catch (err) {
      if (generationRef.current === generation) {
        setResearchError(apiErrorMessage(err, "Research could not be started."));
      }
    } finally {
      if (generationRef.current === generation) setResearchStarting(false);
    }
  };

  const reviewField = jobField || contentField;
  const savesLinks = reviewField === "interviewQuestions";
  const isExperience = reviewField === "interviewExperiences";
  const selectedContent =
    CONTENT_FIELDS.find((row) => row.id === contentField) || CONTENT_FIELDS[0];
  const questions = Array.isArray(researchResult?.items) ? researchResult.items : [];
  const published = researchStatus === "published";
  const statusCopy = STATUS_COPY[researchStatus] || "";
  const statusIsError = researchStatus === "failed" || researchStatus === "timed_out";
  const showResult = (researchStatus === "review" || published) && researchResult;

  const sourceList = Array.isArray(researchResult?.sources) ? researchResult.sources : [];

  const toggleQuestion = (index) => {
    if (published || publishing || questionsFinalized) return;
    setConfirmingPublish(false);
    setSelectedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAllQuestions = () => {
    if (published || publishing || questionsFinalized) return;
    setConfirmingPublish(false);
    setSelectedIndexes(new Set(questions.map((_, index) => index)));
  };

  const clearSelectedQuestions = () => {
    if (published || publishing || questionsFinalized) return;
    setConfirmingPublish(false);
    setSelectedIndexes(new Set());
  };

  const activeResearchRole =
    String(researchJobSnapshot?.role || role || "").trim() || "General (all roles)";

  const generateLinksSummary = async () => {
    if (!researchJobId || published) return;
    setGeneratingLinksSummary(true);
    setResearchError("");
    try {
      const res = await companyAPI.generateCompanyResearchLinksSummary(researchJobId);
      const summary = String(res?.data?.summary || "").trim();
      if (summary) setLinksSummaryText(summary);
      setResearchJobSnapshot((current) => ({
        role: current?.role ?? String(role || "").trim(),
        linksSummaryDraft: {
          prepRoleKey: res?.data?.prepRoleKey ?? "",
          summary,
        },
      }));
    } catch (err) {
      setResearchError(apiErrorMessage(err, "Links summary could not be generated."));
    } finally {
      setGeneratingLinksSummary(false);
    }
  };

  const saveLinksSummaryDraft = async () => {
    if (!researchJobId || published) return;
    const summary = String(linksSummaryText || "").trim();
    if (!summary) {
      setResearchError("Write or generate a summary before saving.");
      return;
    }
    setSavingLinksSummary(true);
    setResearchError("");
    try {
      const res = await companyAPI.saveCompanyResearchLinksSummaryDraft(researchJobId, summary);
      setResearchJobSnapshot((current) => ({
        role: current?.role ?? String(role || "").trim(),
        linksSummaryDraft: {
          prepRoleKey: res?.data?.prepRoleKey ?? "",
          summary: res?.data?.summary ?? summary,
        },
      }));
    } catch (err) {
      setResearchError(apiErrorMessage(err, "Links summary could not be saved."));
    } finally {
      setSavingLinksSummary(false);
    }
  };

  const approveAllLinks = async () => {
    if (!researchJobId || published) return;
    setPublishingSources(true);
    setResearchError("");
    try {
      const res = await companyAPI.publishCompanyResearchSources(researchJobId);
      setSourcesPublishSummary({
        insertedSourceCount: Number(res?.data?.insertedSourceCount) || 0,
        duplicateSourceCount: Number(res?.data?.duplicateSourceCount) || 0,
      });
    } catch (err) {
      setResearchError(apiErrorMessage(err, "Research links could not be approved."));
    } finally {
      setPublishingSources(false);
    }
  };

  const finalizeQuestions = () => {
    if (selectedIndexes.size === 0) return;
    const indexes = [...selectedIndexes].sort((a, b) => a - b);
    setFinalizedIndexes(indexes);
    setQuestionsFinalized(true);
    setConfirmingPublish(false);
    setAnswersGenerated(false);
  };

  const addAnswers = async () => {
    if (!researchJobId || !questionsFinalized || finalizedIndexes.length === 0) return;
    setGeneratingAnswers(true);
    setResearchError("");
    try {
      const res = await companyAPI.generateCompanyResearchAnswers(researchJobId, finalizedIndexes);
      const updates = Array.isArray(res?.data?.items) ? res.data.items : [];
      setResearchResult((current) => {
        if (!current || !Array.isArray(current.items)) return current;
        const items = [...current.items];
        for (const row of updates) {
          const index = row?.index;
          if (typeof index !== "number" || index < 0 || index >= items.length) continue;
          const { index: _drop, ...rest } = row;
          items[index] = { ...items[index], ...rest };
        }
        return { ...current, items };
      });
      setAnswersGenerated(true);
    } catch (err) {
      setResearchError(apiErrorMessage(err, "Answers could not be generated."));
    } finally {
      setGeneratingAnswers(false);
    }
  };

  const confirmPublish = async () => {
    if (!researchJobId || finalizedIndexes.length === 0 || published || !questionsFinalized) return;
    setPublishing(true);
    setResearchError("");
    try {
      const res = await companyAPI.publishCompanyResearch(researchJobId, finalizedIndexes);
      setResearchStatus("published");
      statusRef.current = "published";
      setPublishSummary({
        insertedCount: Number(res?.data?.insertedCount) || 0,
        duplicateCount: Number(res?.data?.duplicateCount) || 0,
      });
      setConfirmingPublish(false);
    } catch (err) {
      setResearchError(apiErrorMessage(err, "Research could not be published."));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className={sectionCardClass}>
      <h2 className="text-lg font-semibold text-theme-primary">AI research</h2>
      <p className="mt-1 text-sm text-theme-secondary">{contentCopy(contentField)}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Content">
          <SpcThemeSelect
            name="content"
            value={contentField}
            onChange={(e) => setContentField(e.target.value)}
            ariaLabel="Content"
            buttonClassName={selectButtonClass}
            options={CONTENT_FIELDS.map((row) => ({ value: row.id, label: row.label }))}
          />
        </Field>
        <Field label="Company">
          <input className={inputClass} value={companyName || ""} readOnly aria-label="Company" />
        </Field>
        <Field label="Role">
          {contentField === "onlineQuestions" ? (
            <SpcThemeSelect
              name="oaRole"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              ariaLabel="OA role"
              buttonClassName={selectButtonClass}
              placeholder="Select role"
              options={OA_ROLE_OPTIONS}
            />
          ) : (
            <input
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Software Engineer"
              aria-label="Role"
            />
          )}
        </Field>
        <Field label="Country">
          <input
            className={inputClass}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Country"
          />
        </Field>
        <Field label="Maximum sources">
          <input
            className={inputClass}
            type="number"
            min={1}
            max={MAX_SOURCES}
            value={maxSources}
            onChange={(e) => setMaxSources(e.target.value === "" ? "" : Number(e.target.value))}
            aria-label="Maximum sources"
          />
        </Field>
        <Field label="Search depth">
          <SpcThemeSelect
            name="searchDepth"
            value={searchDepth}
            onChange={(e) => setSearchDepth(e.target.value)}
            ariaLabel="Search depth"
            buttonClassName={selectButtonClass}
            options={[
              { value: "basic", label: "Basic" },
              { value: "advanced", label: "Advanced" },
            ]}
          />
        </Field>
      </div>

      <button
        type="button"
        disabled={researchStarting}
        onClick={startResearch}
        className="mt-4 rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {researchStarting ? "Starting…" : selectedContent.action}
      </button>

      {statusCopy ? (
        <p
          className={`mt-4 text-sm ${statusIsError ? "text-red-500" : researchStatus === "review" || researchStatus === "published" ? "text-emerald-500" : "text-theme-secondary"}`}
          role="status"
        >
          {statusCopy}
        </p>
      ) : null}
      {researchError && researchError !== statusCopy ? (
        <p className="mt-2 text-sm text-red-500">{researchError}</p>
      ) : null}

      {showResult ? (
        <div className="mt-5 space-y-5">
          <ResearchStats stats={researchResult.stats} itemNoun={isExperience ? "Experiences" : "Questions"} />
          {savesLinks ? (
            <ReviewTabs
              active={reviewTab}
              onChange={setReviewTab}
              sourceCount={sourceList.length}
              questionCount={questionsFinalized ? finalizedIndexes.length : questions.length}
            />
          ) : null}

          {savesLinks && reviewTab === "sources" ? (
            <div className="space-y-4" role="tabpanel">
              <p className="text-sm text-theme-secondary">
                Content from this job will be tagged for role{" "}
                <span className="font-semibold text-theme-primary">{activeResearchRole}</span>.
              </p>
              <ResearchSources sources={sourceList} />
              <div className="space-y-2 rounded-xl border border-theme bg-theme-hero/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                  What this company tests on (optional)
                </p>
                <p className="text-xs text-theme-muted">
                  Generate a short summary from the research links. It is saved to the company when you
                  approve links (same role as above).
                </p>
                <textarea
                  className={`${inputClass} min-h-[120px]`}
                  value={linksSummaryText}
                  onChange={(e) => setLinksSummaryText(e.target.value)}
                  placeholder="5–6 sentences on typical interview focus for this role…"
                  aria-label="Research links summary"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={published || generatingLinksSummary || sourceList.length === 0}
                    onClick={generateLinksSummary}
                    className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary disabled:opacity-60"
                  >
                    {generatingLinksSummary ? "Generating…" : "Generate summary"}
                  </button>
                  <button
                    type="button"
                    disabled={published || savingLinksSummary || !String(linksSummaryText || "").trim()}
                    onClick={saveLinksSummaryDraft}
                    className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary disabled:opacity-60"
                  >
                    {savingLinksSummary ? "Saving…" : "Save draft"}
                  </button>
                </div>
              </div>
              <button
                type="button"
                disabled={published || publishingSources || sourceList.length === 0}
                onClick={approveAllLinks}
                className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {publishingSources ? "Approving links…" : "Approve all links"}
              </button>
              {sourcesPublishSummary ? (
                <p className="text-sm text-emerald-500">
                  Inserted {sourcesPublishSummary.insertedSourceCount} link
                  {sourcesPublishSummary.insertedSourceCount === 1 ? "" : "s"}. Duplicates skipped{" "}
                  {sourcesPublishSummary.duplicateSourceCount}.
                </p>
              ) : null}
            </div>
          ) : null}

          {!savesLinks || reviewTab === "questions" ? (
            <div className="space-y-4" role="tabpanel">
              {!questionsFinalized && questions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllQuestions}
                    disabled={published || publishing}
                    className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary disabled:opacity-60"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedQuestions}
                    disabled={published || publishing || selectedIndexes.size === 0}
                    className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary disabled:opacity-60"
                  >
                    Clear selection
                  </button>
                  <button
                    type="button"
                    disabled={published || publishing || selectedIndexes.size === 0}
                    onClick={finalizeQuestions}
                    className="rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {isExperience ? "Finalize experiences" : "Finalize questions"}
                  </button>
                </div>
              ) : null}
              {questionsFinalized ? (
                <p className="text-sm text-theme-secondary">
                  Finalized {finalizedIndexes.length}{" "}
                  {isExperience
                    ? finalizedIndexes.length === 1
                      ? "experience"
                      : "experiences"
                    : finalizedIndexes.length === 1
                      ? "question"
                      : "questions"}
                  . Unselected items are discarded from this review.
                </p>
              ) : null}
              {isExperience ? (
                <ResearchExperiences
                  items={questions}
                  itemIndexes={questionsFinalized ? finalizedIndexes : null}
                  selectedIndexes={selectedIndexes}
                  onToggle={toggleQuestion}
                  disabled={published || publishing}
                  selectable={!questionsFinalized}
                />
              ) : (
                <ResearchQuestions
                  items={questions}
                  itemIndexes={questionsFinalized ? finalizedIndexes : null}
                  selectedIndexes={selectedIndexes}
                  onToggle={toggleQuestion}
                  disabled={published || publishing}
                  selectable={!questionsFinalized}
                  showAnswers={questionsFinalized && answersGenerated}
                  heading={reviewField === "onlineQuestions" ? "OA question" : "Interview question"}
                  hideSourceLinks={reviewField === "onlineQuestions"}
                />
              )}
              {questionsFinalized ? (
                <div className="space-y-3">
                  {isExperience ? null : (
                    <button
                      type="button"
                      disabled={published || generatingAnswers || publishing}
                      onClick={addAnswers}
                      className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-primary disabled:opacity-60"
                    >
                      {generatingAnswers ? "Generating answers…" : "Add answers"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={published || publishing || (!isExperience && !answersGenerated)}
                    onClick={() => setConfirmingPublish(true)}
                    className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {publishing
                      ? "Publishing…"
                      : isExperience
                        ? "Publish finalized experiences"
                        : "Publish finalized questions"}
                  </button>
                  {confirmingPublish && !published ? (
                    <div className="rounded-xl border border-theme bg-theme-hero/30 p-3">
                      <p className="text-sm text-theme-primary">
                        Publish {finalizedIndexes.length} finalized{" "}
                        {isExperience
                          ? finalizedIndexes.length === 1
                            ? "interview experience"
                            : "interview experiences"
                          : reviewField === "onlineQuestions"
                            ? finalizedIndexes.length === 1
                              ? "OA question"
                              : "OA questions"
                            : finalizedIndexes.length === 1
                              ? "interview question"
                              : "interview questions"}{" "}
                        to this company?
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={publishing}
                          onClick={confirmPublish}
                          className="rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          Confirm publish
                        </button>
                        <button
                          type="button"
                          disabled={publishing}
                          onClick={() => setConfirmingPublish(false)}
                          className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {publishSummary ? (
                    <p className="text-sm text-emerald-500">
                      Inserted {publishSummary.insertedCount}{" "}
                      {isExperience
                        ? publishSummary.insertedCount === 1
                          ? "experience"
                          : "experiences"
                        : publishSummary.insertedCount === 1
                          ? "question"
                          : "questions"}
                      . Duplicates skipped{" "}
                      {publishSummary.duplicateCount}.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
