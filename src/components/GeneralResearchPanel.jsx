import { useEffect, useRef, useState } from "react";
import { companyAPI } from "../utils/api";
import ResearchLimitRecovery from "./ResearchLimitRecovery.jsx";
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
  return readApiFailure(err, fallback).message;
}

function readApiFailure(err, fallback, defaultSecretId = "") {
  const data = err?.response?.data;
  const error = data?.error;
  const message =
    typeof error === "string" && error.trim()
      ? error.trim()
      : error && typeof error.message === "string" && error.message.trim()
        ? error.message.trim()
        : typeof data?.message === "string" && data.message.trim()
          ? data.message.trim()
          : fallback;
  const tokenLimit = error?.tokenLimit === true || looksLikeTokenLimit(message);
  return {
    message,
    tokenLimit,
    secretId: tokenLimit ? error?.secretId || defaultSecretId : "",
  };
}

function looksLikeTokenLimit(value) {
  const lower = String(value || "").toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("tokens per minute") ||
    lower.includes("tokens per day") ||
    lower.includes("token limit") ||
    lower.includes("too many requests") ||
    lower.includes("quota") ||
    /\btpm\b/.test(lower) ||
    /\b429\b/.test(lower)
  );
}

function uiStorageKey(companyId, jobId) {
  return `lmpp-company-research:${companyId}:${jobId}`;
}

function readUiState(companyId, jobId) {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(uiStorageKey(companyId, jobId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeUiState(companyId, jobId, state) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(uiStorageKey(companyId, jobId), JSON.stringify(state));
  } catch {
    // The research job itself is stored on the server.
  }
}

function integerList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((index) => Number.isInteger(index) && index >= 0);
}

function indexesWithAnswers(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => (item && (item.answer || item.solutions) ? index : -1))
    .filter((index) => index >= 0);
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

const MAX_SELECTED_ROLES = 6;

function normalizeRole(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function roleIdentity(value) {
  return normalizeRole(value).toLowerCase();
}

function canonicalRole(value) {
  const text = normalizeRole(value);
  const match = OA_ROLE_OPTIONS.find((option) => option.value.toLowerCase() === text.toLowerCase());
  return match ? match.value : text;
}

function isOaResearchRole(value) {
  return OA_ROLE_OPTIONS.some((option) => option.value.toLowerCase() === roleIdentity(value));
}

function slotKey(field, role) {
  return `${field}:${roleIdentity(role)}`;
}

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

function hasCodingSolutions(item) {
  const solutions = item?.solutions;
  if (solutions && typeof solutions === "object") {
    if (["cpp", "java", "python"].some((key) => String(solutions[key] || "").trim())) return true;
  }
  return item?.form === "coding" || item?.kind === "coding";
}

function ResearchItemEditor({
  item,
  mode,
  showAnswers,
  saving,
  onSave,
  onCancel,
  idPrefix = "item",
}) {
  const isExperience = mode === "experience";
  const isMcq = item?.form === "mcq" && Array.isArray(item?.mcqMetadata?.options);
  const isCoding = hasCodingSolutions(item);
  const [question, setQuestion] = useState(item?.question || "");
  const [content, setContent] = useState(item?.content || "");
  const [answer, setAnswer] = useState(item?.answer || "");
  const [intuition, setIntuition] = useState(item?.intuition || "");
  const [options, setOptions] = useState(() =>
    isMcq ? item.mcqMetadata.options.map((opt) => ({ id: opt.id, text: opt.text || "" })) : []
  );
  const [correctOptionId, setCorrectOptionId] = useState(item?.mcqMetadata?.correctOptionId || "");
  const [solutions, setSolutions] = useState({
    cpp: item?.solutions?.cpp || "",
    java: item?.solutions?.java || "",
    python: item?.solutions?.python || "",
  });

  const save = async () => {
    const patch = isExperience
      ? { content }
      : {
          question,
          ...(isMcq ? { options, correctOptionId } : {}),
          ...(showAnswers
            ? {
                answer,
                intuition,
                ...(isCoding ? { solutions } : {}),
              }
            : {}),
        };
    const ok = await onSave(patch);
    if (ok) onCancel();
  };

  return (
    <div className="space-y-3">
      {isExperience ? (
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-experience`}>
            Experience writeup
          </label>
          <textarea
            id={`${idPrefix}-experience`}
            className={`${inputClass} min-h-[160px]`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            aria-label="Experience writeup"
          />
        </div>
      ) : (
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-question`}>
            Question
          </label>
          <textarea
            id={`${idPrefix}-question`}
            className={`${inputClass} min-h-[100px]`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            aria-label="Question text"
          />
        </div>
      )}
      {isMcq ? (
        <div className="space-y-2">
          {options.map((opt, optionIndex) => (
            <div key={opt.id}>
              <label className={labelClass} htmlFor={`${idPrefix}-option-${opt.id}`}>
                Option {opt.id}
              </label>
              <input
                id={`${idPrefix}-option-${opt.id}`}
                className={inputClass}
                value={opt.text}
                aria-label={`Option ${opt.id}`}
                onChange={(e) => {
                  const text = e.target.value;
                  setOptions((current) =>
                    current.map((row, rowIndex) => (rowIndex === optionIndex ? { ...row, text } : row))
                  );
                }}
              />
            </div>
          ))}
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-correct`}>
              Correct option
            </label>
            <select
              id={`${idPrefix}-correct`}
              className={inputClass}
              value={correctOptionId}
              aria-label="Correct option"
              onChange={(e) => setCorrectOptionId(e.target.value)}
            >
              <option value="">Not set</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      {showAnswers && !isExperience ? (
        <>
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-answer`}>
              Answer
            </label>
            <textarea
              id={`${idPrefix}-answer`}
              className={`${inputClass} min-h-[120px]`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              aria-label="Answer"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-intuition`}>
              Intuition
            </label>
            <textarea
              id={`${idPrefix}-intuition`}
              className={`${inputClass} min-h-[80px]`}
              value={intuition}
              onChange={(e) => setIntuition(e.target.value)}
              aria-label="Intuition"
            />
          </div>
          {isCoding ? (
            ["cpp", "java", "python"].map((language) => (
              <div key={language}>
                <label className={labelClass} htmlFor={`${idPrefix}-solution-${language}`}>
                  {language === "cpp" ? "C++" : language === "java" ? "Java" : "Python"} solution
                </label>
                <textarea
                  id={`${idPrefix}-solution-${language}`}
                  className={`${inputClass} min-h-[120px] font-mono`}
                  value={solutions[language]}
                  aria-label={language === "cpp" ? "C++ solution" : language === "java" ? "Java solution" : "Python solution"}
                  onChange={(e) =>
                    setSolutions((current) => ({ ...current, [language]: e.target.value }))
                  }
                />
              </div>
            ))
          ) : null}
        </>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-lg bg-theme-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : isExperience ? "Save experience" : "Save question"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary disabled:opacity-60"
        >
          Cancel edit
        </button>
      </div>
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
  canEdit = false,
  savingIndex = null,
  onSaveEdit,
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
          <QuestionCard
            key={`${item?.sourceUrl || "question"}-${index}`}
            index={index}
            item={item}
            heading={heading}
            questionLabel={questionLabel}
            supporting={supporting}
            selectable={selectable}
            selectedIndexes={selectedIndexes}
            onToggle={onToggle}
            disabled={disabled}
            showAnswers={showAnswers}
            hideSourceLinks={hideSourceLinks}
            canEdit={canEdit}
            saving={savingIndex === index}
            onSaveEdit={onSaveEdit}
          />
        );
      })}
    </div>
  );
}

function QuestionCard({
  index,
  item,
  heading,
  questionLabel,
  supporting,
  selectable,
  selectedIndexes,
  onToggle,
  disabled,
  showAnswers,
  hideSourceLinks,
  canEdit,
  saving,
  onSaveEdit,
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <article className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4">
        <ResearchItemEditor
          item={item}
          mode="question"
          showAnswers={showAnswers}
          saving={saving}
          idPrefix={`question-${index}`}
          onCancel={() => setEditing(false)}
          onSave={(patch) => onSaveEdit(index, patch)}
        />
      </article>
    );
  }
  return (
      <article className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
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
            {item?.sourceQuestion && item.sourceQuestion !== item.question ? (
              <p className="text-xs text-theme-secondary">Original: {item.sourceQuestion}</p>
            ) : null}
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary"
            >
              Edit question
            </button>
          ) : null}
        </div>
        <div className="space-y-3">
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
        </div>
      </article>
  );
}

export function ResearchExperiences({
  items,
  itemIndexes,
  selectedIndexes,
  onToggle,
  disabled,
  selectable = true,
  canEdit = false,
  savingIndex = null,
  onSaveEdit,
}) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const rows = itemIndexes
    ? itemIndexes.map((index) => ({ index, item: items[index] })).filter((row) => row.item)
    : items.map((item, index) => ({ index, item }));
  return (
    <div className="space-y-3">
      {rows.map(({ index, item }) => (
        <ExperienceCard
          key={`${item?.sourceUrl || "experience"}-${index}`}
          index={index}
          item={item}
          selectable={selectable}
          selectedIndexes={selectedIndexes}
          onToggle={onToggle}
          disabled={disabled}
          canEdit={canEdit}
          saving={savingIndex === index}
          onSaveEdit={onSaveEdit}
        />
      ))}
    </div>
  );
}

function ExperienceCard({
  index,
  item,
  selectable,
  selectedIndexes,
  onToggle,
  disabled,
  canEdit,
  saving,
  onSaveEdit,
}) {
  const [editing, setEditing] = useState(false);
  const supporting = Array.isArray(item?.supportingSources) ? item.supportingSources : [];
  if (editing) {
    return (
      <article className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4">
        <ResearchItemEditor
          item={item}
          mode="experience"
          showAnswers={false}
          saving={saving}
          idPrefix={`experience-${index}`}
          onCancel={() => setEditing(false)}
          onSave={(patch) => onSaveEdit(index, patch)}
        />
      </article>
    );
  }
  return (
    <article className="space-y-3 rounded-xl border border-theme bg-theme-hero/30 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
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
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary"
          >
            Edit experience
          </button>
        ) : null}
      </div>
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
                <SourceLink url={source?.sourceUrl}>{source?.sourceTitle || source?.sourceUrl}</SourceLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
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
    return "OA questions run for SDE, Analyst, or Data Scientist. Questions are normalized to coding (DSA), SQL, or MCQ. Links are not saved. Finalize, generate answers, then publish.";
  }
  if (field === "interviewExperiences") {
    return "Interview experiences stay with the role they were researched for. The full writeup is kept unless it is longer than 12,000 characters, in which case a summary is saved.";
  }
  return "Interview questions stay with the role they were researched for. Finalize the list, generate answers, then publish.";
}

export default function GeneralResearchPanel({ companyId, companyName }) {
  const [contentField, setContentField] = useState("interviewQuestions");
  const [jobField, setJobField] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleDraft, setRoleDraft] = useState("");
  const [viewRole, setViewRole] = useState("");
  const [jobsBySlot, setJobsBySlot] = useState({});
  const [fresherRoles, setFresherRoles] = useState([]);
  const [pollKey, setPollKey] = useState("");
  const [fresherRolesLoading, setFresherRolesLoading] = useState(false);
  const [country, setCountry] = useState("India");
  const [maxSources, setMaxSources] = useState(3);
  const [searchDepth, setSearchDepth] = useState("basic");
  const [researchStarting, setResearchStarting] = useState(false);
  const [researchJobId, setResearchJobId] = useState("");
  const [researchStatus, setResearchStatus] = useState("");
  const [researchResult, setResearchResult] = useState(null);
  const [researchError, setResearchError] = useState("");
  const [researchLimit, setResearchLimit] = useState(null);
  const [selectedIndexes, setSelectedIndexes] = useState(() => new Set());
  const [reviewTab, setReviewTab] = useState("sources");
  const [publishingSources, setPublishingSources] = useState(false);
  const [sourcesPublishSummary, setSourcesPublishSummary] = useState(null);
  const [questionsFinalized, setQuestionsFinalized] = useState(false);
  const [finalizedIndexes, setFinalizedIndexes] = useState([]);
  const [generatingAnswers, setGeneratingAnswers] = useState(false);
  const [enhancingQuestions, setEnhancingQuestions] = useState(false);
  const [enhanceSummary, setEnhanceSummary] = useState("");
  const [answersGenerated, setAnswersGenerated] = useState(false);
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSummary, setPublishSummary] = useState(null);
  const [researchJobSnapshot, setResearchJobSnapshot] = useState(null);
  const [linksSummaryText, setLinksSummaryText] = useState("");
  const [generatingLinksSummary, setGeneratingLinksSummary] = useState(false);
  const [savingLinksSummary, setSavingLinksSummary] = useState(false);
  const [savingItemIndex, setSavingItemIndex] = useState(null);
  const statusRef = useRef("");
  const deadlineRef = useRef({ id: "", at: 0 });
  const generationRef = useRef(0);
  const jobsBySlotRef = useRef({});
  const contentFieldRef = useRef(contentField);
  const viewRoleRef = useRef(viewRole);
  const researchJobIdRef = useRef("");
  const showJobRef = useRef(() => {});
  const clearJobRef = useRef(() => {});
  const skipFieldResetRef = useRef(true);
  const deadlinesRef = useRef({});
  contentFieldRef.current = contentField;
  viewRoleRef.current = viewRole;
  researchJobIdRef.current = researchJobId;

  const rememberJob = (job) => {
    if (!job?.jobId || !job?.field) return;
    const key = slotKey(job.field, job.role);
    const next = {
      ...jobsBySlotRef.current,
      [key]: { ...jobsBySlotRef.current[key], ...job, field: job.field },
    };
    jobsBySlotRef.current = next;
    setJobsBySlot(next);
  };

  const mergePolledJob = (job) => {
    const jobId = String(job?.jobId || "");
    if (!jobId) return null;
    const next = { ...jobsBySlotRef.current };
    let matched = null;
    for (const [key, row] of Object.entries(next)) {
      if (row?.jobId !== jobId) continue;
      matched = {
        ...row,
        ...job,
        field: job.field || row.field,
        role: job.role || row.role,
        result: job.result ?? row.result,
      };
      next[key] = matched;
    }
    if (!matched) return null;
    jobsBySlotRef.current = next;
    setJobsBySlot(next);
    return matched;
  };

  const noteJobFailure = (error) => {
    setResearchError(error?.message || "Research failed.");
    setResearchLimit(
      error?.tokenLimit ? { secretId: error.secretId || "groq-web-search" } : null
    );
  };

  const noteApiFailure = (err, fallback, defaultSecretId) => {
    const failure = readApiFailure(err, fallback, defaultSecretId);
    setResearchError(failure.message);
    setResearchLimit(failure.tokenLimit ? { secretId: failure.secretId || defaultSecretId } : null);
  };

  showJobRef.current = (job) => {
    if (!job?.jobId) return;
    const field = typeof job.field === "string" && job.field ? job.field : contentFieldRef.current;
    const status = typeof job.status === "string" ? job.status : "";
    rememberJob({ ...job, field });
    statusRef.current = status;
    setJobField(field);
    setResearchStatus(status);
    setResearchResult(job.result ?? null);
    if (status === "failed") noteJobFailure(job.error);
    else {
      setResearchError("");
      setResearchLimit(null);
    }
    setResearchJobSnapshot({
      role: typeof job.role === "string" ? job.role : "",
      linksSummaryDraft: job.linksSummaryDraft ?? null,
    });
    const draftSummary =
      typeof job.linksSummaryDraft?.summary === "string" ? job.linksSummaryDraft.summary : "";
    const ui = readUiState(companyId, job.jobId);
    const items = Array.isArray(job.result?.items) ? job.result.items : [];
    const answered = indexesWithAnswers(items);
    const canReview = status === "review" || status === "published";
    const finalizedFromUi = integerList(ui?.finalizedIndexes);
    const questionsFinal = canReview && (Boolean(ui?.questionsFinalized) || answered.length > 0);
    setResearchStarting(false);
    setSelectedIndexes(new Set(integerList(ui?.selectedIndexes)));
    setReviewTab(
      ui?.reviewTab === "questions" || ui?.reviewTab === "sources"
        ? ui.reviewTab
        : field === "interviewQuestions"
          ? "sources"
          : "questions"
    );
    setPublishingSources(false);
    setSourcesPublishSummary(
      ui?.sourcesPublishSummary ||
        (job.sourcesPublication
          ? {
              insertedSourceCount: Number(job.sourcesPublication.insertedSourceCount) || 0,
              duplicateSourceCount: Number(job.sourcesPublication.duplicateSourceCount) || 0,
            }
          : null)
    );
    setQuestionsFinalized(questionsFinal);
    setFinalizedIndexes(questionsFinal ? (finalizedFromUi.length ? finalizedFromUi : answered) : []);
    setGeneratingAnswers(false);
    setAnswersGenerated(canReview && (Boolean(ui?.answersGenerated) || answered.length > 0));
    setConfirmingPublish(false);
    setPublishing(false);
    setPublishSummary(
      ui?.publishSummary ||
        (job.publication
          ? {
              insertedCount: Number(job.publication.insertedCount) || 0,
              duplicateCount: Number(job.publication.duplicateCount) || 0,
            }
          : null)
    );
    setLinksSummaryText(typeof ui?.linksSummaryText === "string" ? ui.linksSummaryText : draftSummary);
    setGeneratingLinksSummary(false);
    setSavingLinksSummary(false);
    if (typeof job.role === "string" && job.role.trim()) setViewRole(job.role);
    setResearchJobId(String(job.jobId));
  };

  clearJobRef.current = () => {
    statusRef.current = "";
    setResearchStarting(false);
    setResearchJobId("");
    setResearchStatus("");
    setResearchResult(null);
    setResearchError("");
    setSelectedIndexes(new Set());
    setReviewTab(contentFieldRef.current === "interviewQuestions" ? "sources" : "questions");
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
    setJobField("");
  };

  useEffect(() => {
    statusRef.current = researchStatus;
  }, [researchStatus]);

  const runningJobIds = () =>
    [
      ...new Set(
        Object.values(jobsBySlotRef.current)
          .filter((job) => job?.status === "queued" || job?.status === "running")
          .map((job) => job.jobId)
          .filter(Boolean)
      ),
    ].sort();

  const syncPollKey = () => {
    const next = runningJobIds().join(",");
    setPollKey((current) => (current === next ? current : next));
  };

  useEffect(() => {
    const ids = pollKey.split(",").filter(Boolean);
    if (ids.length === 0) return undefined;
    let cancelled = false;
    let timer = 0;

    const stop = () => {
      cancelled = true;
      window.clearInterval(timer);
    };

    const poll = async () => {
      if (cancelled) return;
      const pending = runningJobIds();
      if (pending.length === 0) {
        stop();
        return;
      }
      await Promise.all(
        pending.map(async (jobId) => {
          if (!deadlinesRef.current[jobId]) {
            deadlinesRef.current[jobId] = Date.now() + RESEARCH_POLL_MAX_MS;
          }
          if (Date.now() >= deadlinesRef.current[jobId]) {
            mergePolledJob({ jobId, status: "timed_out", result: null });
            if (researchJobIdRef.current === jobId) {
              statusRef.current = "timed_out";
              setResearchStatus("timed_out");
            }
            return;
          }
          try {
            const res = await companyAPI.getCompanyResearchStatus(jobId);
            if (cancelled) return;
            const job = res?.data || {};
            if (job.jobId && job.jobId !== jobId) return;
            const merged = mergePolledJob(job);
            if (researchJobIdRef.current !== jobId) return;
            const visibleSlot =
              Object.values(jobsBySlotRef.current).find(
                (row) =>
                  row?.jobId === jobId &&
                  row.field === contentFieldRef.current &&
                  roleIdentity(row.role) === roleIdentity(viewRoleRef.current)
              ) || merged;
            const next = typeof job.status === "string" ? job.status : "";
            if (next === "review") {
              statusRef.current = "review";
              setResearchStatus("review");
              setResearchResult(job.result ?? visibleSlot?.result ?? null);
              if (visibleSlot?.field) setJobField(visibleSlot.field);
              setResearchJobSnapshot({
                role: visibleSlot?.role || job.role || "",
                linksSummaryDraft: job.linksSummaryDraft ?? visibleSlot?.linksSummaryDraft ?? null,
              });
              const draftSummary =
                typeof job.linksSummaryDraft?.summary === "string" ? job.linksSummaryDraft.summary : "";
              setLinksSummaryText(draftSummary);
              setResearchError("");
              setResearchLimit(null);
              return;
            }
            if (next === "failed") {
              statusRef.current = "failed";
              setResearchStatus("failed");
              setResearchResult(null);
              noteJobFailure(job.error);
              return;
            }
            if (next === "queued" || next === "running") {
              statusRef.current = next;
              setResearchStatus(next);
            }
          } catch {
            // Keep polling until the deadline. A single status read can fail transiently.
          }
        })
      );
      if (!cancelled && runningJobIds().length === 0) stop();
    };

    timer = window.setInterval(() => {
      void poll();
    }, RESEARCH_POLL_MS);
    void poll();

    return () => {
      stop();
    };
  }, [pollKey]);

  useEffect(() => {
    const id = String(companyId || "").trim();
    const name = String(companyName || "").trim();
    if (!id || !name) return undefined;
    let cancelled = false;
    setFresherRolesLoading(true);
    (async () => {
      try {
        const res = await companyAPI.listCompanyFresherRoles(id, name);
        if (cancelled) return;
        const roles = Array.isArray(res?.data?.roles) ? res.data.roles : [];
        setFresherRoles(
          roles
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        );
      } catch {
        if (!cancelled) setFresherRoles([]);
      } finally {
        if (!cancelled) setFresherRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, companyName]);

  useEffect(() => {
    const id = String(companyId || "").trim();
    if (!id) return undefined;
    let cancelled = false;
    const generation = generationRef.current;
    (async () => {
      try {
        const res = await companyAPI.listCompanyResearchJobs(id);
        if (cancelled || generationRef.current !== generation) return;
        const jobs = Array.isArray(res?.data?.jobs) ? res.data.jobs : [];
        const map = {};
        const restoredRoles = [];
        for (const job of jobs) {
          if (!job?.jobId || !job?.field) continue;
          map[slotKey(job.field, job.role)] = job;
          const name = canonicalRole(job.role);
          if (name && !restoredRoles.some((role) => roleIdentity(role) === roleIdentity(name))) {
            restoredRoles.push(name);
          }
        }
        jobsBySlotRef.current = map;
        setJobsBySlot(map);
        if (restoredRoles.length > 0) setSelectedRoles(restoredRoles);
        const visible =
          map[slotKey(contentFieldRef.current, viewRoleRef.current)] ||
          Object.values(map).find((job) => job.field === contentFieldRef.current) ||
          Object.values(map)[0] ||
          null;
        if (visible) {
          skipFieldResetRef.current = true;
          showJobRef.current(visible);
        }
      } catch {
        // The company page still lets the admin start a new research run.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (skipFieldResetRef.current) {
      skipFieldResetRef.current = false;
      return;
    }
    const jobs = Object.values(jobsBySlotRef.current).filter((job) => job?.field === contentField);
    const job =
      jobs.find((row) => roleIdentity(row.role) === roleIdentity(viewRole)) || jobs[0] || null;
    if (!job) {
      clearJobRef.current();
      return;
    }
    if (job.jobId === researchJobIdRef.current && job.field === contentField) return;
    showJobRef.current(job);
  }, [contentField, viewRole]);

  useEffect(() => {
    if (!companyId || !researchJobId) return;
    writeUiState(companyId, researchJobId, {
      selectedIndexes: [...selectedIndexes],
      reviewTab,
      questionsFinalized,
      finalizedIndexes,
      answersGenerated,
      linksSummaryText,
      sourcesPublishSummary,
      publishSummary,
    });
  }, [
    companyId,
    researchJobId,
    selectedIndexes,
    reviewTab,
    questionsFinalized,
    finalizedIndexes,
    answersGenerated,
    linksSummaryText,
    sourcesPublishSummary,
    publishSummary,
  ]);

  const addRole = (raw) => {
    const name = canonicalRole(raw);
    if (!name) return;
    if (selectedRoles.some((role) => roleIdentity(role) === roleIdentity(name))) {
      setRoleDraft("");
      setViewRole(name);
      return;
    }
    if (selectedRoles.length >= MAX_SELECTED_ROLES) {
      setResearchError(`You can research up to ${MAX_SELECTED_ROLES} roles at once.`);
      return;
    }
    setResearchError("");
    setSelectedRoles((current) =>
      current.some((role) => roleIdentity(role) === roleIdentity(name)) ? current : [...current, name]
    );
    setRoleDraft("");
    setViewRole(name);
  };

  const removeRole = (name) => {
    setSelectedRoles((current) => current.filter((role) => roleIdentity(role) !== roleIdentity(name)));
  };

  const startResearch = async () => {
    const company = String(companyName || "").trim();
    const id = String(companyId || "").trim();
    const sources = Number(maxSources);
    const roles = selectedRoles.map((role) => canonicalRole(role)).filter(Boolean);
    if (!id || !company) {
      setResearchError("Company name is required.");
      return;
    }
    if (roles.length === 0) {
      setResearchError("Add at least one role.");
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

    const runs = [];
    for (const roleName of roles) {
      runs.push({ field: "interviewQuestions", role: roleName });
      runs.push({ field: "interviewExperiences", role: roleName });
      if (isOaResearchRole(roleName)) {
        runs.push({ field: "onlineQuestions", role: canonicalRole(roleName) });
      }
    }

    generationRef.current += 1;
    const generation = generationRef.current;
    setResearchStarting(true);
    setResearchError("");
    setResearchResult(null);
    setResearchStatus("");
    setResearchJobId("");
    setSelectedIndexes(new Set());
    setReviewTab("sources");
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
    if (
      contentFieldRef.current !== "interviewQuestions" ||
      roleIdentity(viewRoleRef.current) !== roleIdentity(roles[0])
    ) {
      skipFieldResetRef.current = true;
    }
    setContentField("interviewQuestions");
    setViewRole(roles[0]);
    setJobField("interviewQuestions");
    try {
      const started = await Promise.allSettled(
        runs.map(async (run) => {
          const res = await companyAPI.startCompanyResearch({
            companyId: id,
            companyName: company,
            field: run.field,
            role: run.role,
            country: String(country || "").trim(),
            maxSources: sources,
            searchDepth,
          });
          const jobId = res?.data?.jobId;
          if (!jobId) return null;
          return {
            jobId: String(jobId),
            status: res.data.status || "queued",
            field: run.field,
            companyId: id,
            companyName: company,
            role: run.role,
            result: null,
          };
        })
      );
      if (generationRef.current !== generation) return;
      const queued = started
        .filter((row) => row.status === "fulfilled" && row.value)
        .map((row) => row.value);
      if (queued.length === 0) {
        setResearchError("Research could not be started.");
        return;
      }
      for (const job of queued) rememberJob(job);
      const visible =
        queued.find(
          (job) => job.field === "interviewQuestions" && roleIdentity(job.role) === roleIdentity(roles[0])
        ) || queued[0];
      statusRef.current = visible.status;
      setResearchStatus(visible.status);
      setResearchJobId(visible.jobId);
      setJobField(visible.field);
      setResearchJobSnapshot({ role: visible.role, linksSummaryDraft: null });
      syncPollKey();
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
    String(researchJobSnapshot?.role || viewRole || "").trim() || "General (all roles)";

  const generateLinksSummary = async () => {
    if (!researchJobId || published) return;
    setGeneratingLinksSummary(true);
    setResearchError("");
    try {
      const res = await companyAPI.generateCompanyResearchLinksSummary(researchJobId);
      const summary = String(res?.data?.summary || "").trim();
      if (summary) setLinksSummaryText(summary);
      setResearchJobSnapshot((current) => ({
        role: current?.role ?? String(viewRole || "").trim(),
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
        role: current?.role ?? String(viewRole || "").trim(),
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

  const applyEnhancedQuestions = (updates) => {
    setResearchResult((current) => {
      if (!current || !Array.isArray(current.items)) return current;
      const items = [...current.items];
      for (const row of updates) {
        const index = row?.index;
        if (typeof index !== "number" || index < 0 || index >= items.length) continue;
        items[index] = {
          ...items[index],
          question: row.question || items[index].question,
          sourceQuestion: row.sourceQuestion || items[index].sourceQuestion,
        };
      }
      const next = { ...current, items };
      const jobId = researchJobIdRef.current;
      const nextMap = { ...jobsBySlotRef.current };
      for (const [key, row] of Object.entries(nextMap)) {
        if (row?.jobId === jobId) nextMap[key] = { ...row, result: next };
      }
      jobsBySlotRef.current = nextMap;
      return next;
    });
  };

  const enhanceQuestions = async () => {
    if (!researchJobId || published || isExperience) return;
    const indexes = questionsFinalized
      ? finalizedIndexes
      : selectedIndexes.size > 0
        ? [...selectedIndexes].sort((a, b) => a - b)
        : questions.map((_, index) => index);
    if (indexes.length === 0) return;
    setEnhancingQuestions(true);
    setEnhanceSummary("");
    setResearchError("");
    setResearchLimit(null);
    try {
      const res = await companyAPI.enhanceCompanyResearchQuestions(researchJobId, indexes);
      const updates = Array.isArray(res?.data?.items) ? res.data.items : [];
      applyEnhancedQuestions(updates);
      setEnhanceSummary(
        updates.length > 0
          ? `Enhanced ${updates.length} ${updates.length === 1 ? "question" : "questions"} into full statements.`
          : "Those questions were already full statements."
      );
    } catch (err) {
      noteApiFailure(err, "Questions could not be enhanced.", "groq-admin");
    } finally {
      setEnhancingQuestions(false);
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

  const saveResearchItem = async (index, patch) => {
    if (!researchJobId || published) return false;
    setSavingItemIndex(index);
    setResearchError("");
    try {
      const res = await companyAPI.updateCompanyResearchItem(researchJobId, index, patch);
      const saved = res?.data?.item;
      setResearchResult((current) => {
        if (!current || !Array.isArray(current.items)) return current;
        const items = current.items.map((row, rowIndex) =>
          rowIndex === index ? saved || { ...row, ...patch } : row
        );
        const next = { ...current, items };
        const jobId = researchJobIdRef.current;
        const nextMap = { ...jobsBySlotRef.current };
        for (const [key, row] of Object.entries(nextMap)) {
          if (row?.jobId === jobId) nextMap[key] = { ...row, result: next };
        }
        jobsBySlotRef.current = nextMap;
        return next;
      });
      return true;
    } catch (err) {
      setResearchError(apiErrorMessage(err, "This item could not be saved."));
      return false;
    } finally {
      setSavingItemIndex(null);
    }
  };

  const addAnswers = async () => {
    if (!researchJobId || !questionsFinalized || finalizedIndexes.length === 0) return;
    setGeneratingAnswers(true);
    setResearchError("");
    setResearchLimit(null);
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
      noteApiFailure(err, "Answers could not be generated.", "groq-admin");
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
      const publishedId = researchJobId;
      const publishedSlots = { ...jobsBySlotRef.current };
      for (const [key, row] of Object.entries(publishedSlots)) {
        if (row?.jobId === publishedId) publishedSlots[key] = { ...row, status: "published" };
      }
      jobsBySlotRef.current = publishedSlots;
      setJobsBySlot(publishedSlots);
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

  const runningCount = Object.values(jobsBySlot).filter(
    (job) => job?.status === "queued" || job?.status === "running"
  ).length;
  const rolesForTab = [];
  const addTabRole = (roleName) => {
    const name = canonicalRole(roleName);
    if (!name) return;
    if (contentField === "onlineQuestions" && !isOaResearchRole(name)) return;
    if (rolesForTab.some((item) => roleIdentity(item) === roleIdentity(name))) return;
    rolesForTab.push(name);
  };
  for (const roleName of selectedRoles) addTabRole(roleName);
  for (const job of Object.values(jobsBySlot)) {
    if (job?.field === contentField) addTabRole(job.role);
  }

  return (
    <section className={sectionCardClass}>
      <h2 className="text-lg font-semibold text-theme-primary">AI research</h2>
      <p className="mt-1 text-sm text-theme-secondary">
        One run researches interview questions, interview experiences, and OA questions for every role you add. Each role stays separate.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Company">
          <input className={inputClass} value={companyName || ""} readOnly aria-label="Company" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Roles">
            {fresherRolesLoading && fresherRoles.length === 0 ? (
              <p className="mb-2 text-xs text-theme-secondary">Looking up usual fresher roles…</p>
            ) : null}
            {fresherRoles.length > 0 ? (
              <div className="mb-2">
                <p className="mb-1 text-xs text-theme-secondary">Usually recruits freshers for</p>
                <div className="flex flex-wrap gap-2">
                  {fresherRoles.map((name) => {
                    const selected = selectedRoles.some((role) => roleIdentity(role) === roleIdentity(name));
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={selected}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          selected
                            ? "border-theme-accent bg-theme-accent text-white"
                            : "border-theme bg-theme-card text-theme-primary"
                        }`}
                        onClick={() => (selected ? removeRole(name) : addRole(name))}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {selectedRoles.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedRoles.map((name) => (
                  <span
                    key={name}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-theme bg-theme-card px-3 py-1 text-xs text-theme-primary"
                  >
                    <span className="truncate">{name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      className="px-1 text-sm leading-none"
                      onClick={() => removeRole(name)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className={`${inputClass} min-w-0 flex-1`}
                value={roleDraft}
                onChange={(e) => setRoleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRole(roleDraft);
                  }
                }}
                placeholder="Software Engineer"
                aria-label="Add a role"
              />
              <button
                type="button"
                className="shrink-0 rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-primary"
                onClick={() => addRole(roleDraft)}
              >
                Add role
              </button>
            </div>
            <p className="mt-1 text-xs text-theme-secondary">
              OA questions are included when a role is SDE, Analyst, or Data Scientist.
            </p>
          </Field>
        </div>
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
        className="mt-4 w-full rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {researchStarting ? "Starting…" : "Research all roles"}
      </button>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Research content">
        {CONTENT_FIELDS.map((row) => (
          <button
            key={row.id}
            type="button"
            role="tab"
            aria-selected={contentField === row.id}
            onClick={() => setContentField(row.id)}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${
              contentField === row.id
                ? "bg-theme-accent text-white"
                : "border border-theme text-theme-primary"
            }`}
          >
            {row.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-theme-secondary">{contentCopy(contentField)}</p>
      {rolesForTab.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Roles for this tab">
          {rolesForTab.map((name) => {
            const active = roleIdentity(name) === roleIdentity(viewRole);
            const slot = jobsBySlot[slotKey(contentField, name)];
            const pending = slot?.status === "queued" || slot?.status === "running";
            return (
              <button
                key={name}
                type="button"
                aria-label={`Show ${name}`}
                aria-pressed={active}
                onClick={() => setViewRole(name)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-theme-accent bg-theme-accent text-white"
                    : "border-theme text-theme-primary"
                }`}
              >
                {pending ? `${name}…` : name}
              </button>
            );
          })}
        </div>
      ) : null}
      {contentField === "onlineQuestions" && rolesForTab.length === 0 ? (
        <p className="mt-3 text-sm text-theme-secondary">
          OA questions run for SDE, Analyst, and Data Scientist. Add one of those roles to include them.
        </p>
      ) : null}
      {runningCount > 1 ? (
        <p className="mt-3 text-sm text-theme-secondary">{runningCount} research runs in progress.</p>
      ) : null}

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
      {researchError && researchLimit ? (
        <ResearchLimitRecovery secretId={researchLimit.secretId} />
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
                  {isExperience ? null : (
                    <button
                      type="button"
                      disabled={published || publishing || enhancingQuestions || questions.length === 0}
                      onClick={enhanceQuestions}
                      className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary disabled:opacity-60"
                    >
                      {enhancingQuestions ? "Enhancing…" : "Enhance questions"}
                    </button>
                  )}
                </div>
              ) : null}
              {enhanceSummary ? (
                <p className="text-sm text-emerald-500">{enhanceSummary}</p>
              ) : null}
              {!isExperience && !questionsFinalized && questions.length > 0 ? (
                <p className="text-xs text-theme-secondary">
                  Enhance turns headings and one-word topics into full question statements. Selected
                  questions are enhanced. If none are selected, every question in this list is enhanced.
                </p>
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
                  canEdit={!published && !publishing}
                  savingIndex={savingItemIndex}
                  onSaveEdit={saveResearchItem}
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
                  canEdit={!published && !publishing}
                  savingIndex={savingItemIndex}
                  onSaveEdit={saveResearchItem}
                />
              )}
              {questionsFinalized ? (
                <div className="space-y-3">
                  {isExperience ? null : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={published || enhancingQuestions || generatingAnswers || publishing}
                        onClick={enhanceQuestions}
                        className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-primary disabled:opacity-60"
                      >
                        {enhancingQuestions ? "Enhancing…" : "Enhance questions"}
                      </button>
                      <button
                        type="button"
                        disabled={published || generatingAnswers || publishing || enhancingQuestions}
                        onClick={addAnswers}
                        className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-primary disabled:opacity-60"
                      >
                        {generatingAnswers ? "Generating answers…" : "Add answers"}
                      </button>
                    </div>
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
