import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaCheckCircle,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaTimes,
  FaUpload,
} from "react-icons/fa";
import { interviewQuestionBankAPI } from "../utils/api";
import {
  INTERVIEW_DIFFICULTIES,
  PLATFORM_FRESHER_ROLES,
  PLATFORM_INTERVIEW_ROUND_TYPES,
} from "../constants/interviewCatalog.js";
import { GENERAL_BASE } from "../constants/tenant.js";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const EVALUATION_OPTIONS = [
  { value: "rubric_llm", label: "Rubric-based answer" },
  { value: "behavioral_llm", label: "Behavioral / HR answer" },
  { value: "mcq_exact", label: "Multiple choice (exact)" },
  { value: "code_execution", label: "Executable coding question" },
  { value: "sql_execution", label: "Executable SQL question" },
];

const inputClass =
  "w-full rounded-xl border-2 border-theme bg-theme-input px-3 py-2.5 text-sm text-theme-primary outline-none transition focus:border-theme-accent";
const cardClass = "rounded-2xl border border-theme bg-theme-card shadow-sm";

const TEMPLATE_COLUMNS = [
  "questionId",
  "title",
  "question",
  "companyTags",
  "topics",
  "subtopics",
  "url",
  "rubric",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctOptionId",
  "explanation",
  "functionSignature",
  "supportedLanguages",
  "starterCode",
  "testCases",
  "databaseSchema",
  "seedData",
  "expectedResult",
  "validationRules",
  "requiredConcepts",
  "behavioralSignals",
  "timeComplexity",
  "spaceComplexity",
  "source",
  "verified",
  "qualityScore",
];

const csvEscape = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

function templateRow(evaluationStrategy) {
  const base = Object.fromEntries(TEMPLATE_COLUMNS.map((column) => [column, ""]));
  Object.assign(base, {
    questionId: "unique-question-id",
    title: "Question title",
    question: "Write the complete interview question here",
    companyTags: "Company One|Company Two",
    topics: "primary-topic|secondary-topic",
    subtopics: "specific-subtopic",
    source: "curated_csv",
    verified: "false",
    qualityScore: "0.8",
  });
  if (evaluationStrategy === "mcq_exact") {
    Object.assign(base, {
      optionA: "First option",
      optionB: "Second option",
      optionC: "Third option",
      optionD: "Fourth option",
      correctOptionId: "A",
      explanation: "Why option A is correct",
    });
  } else if (evaluationStrategy === "code_execution") {
    Object.assign(base, {
      functionSignature: "solve(input)",
      supportedLanguages: "python|cpp|java",
      starterCode: JSON.stringify({ python: "def solve(input):\n    pass" }),
      testCases: JSON.stringify([
        { input: [1], expectedOutput: 1, isHidden: false },
        { input: [2], expectedOutput: 2, isHidden: false },
        { input: [3], expectedOutput: 3, isHidden: true },
        { input: [4], expectedOutput: 4, isHidden: true },
      ]),
    });
  } else {
    base.rubric = JSON.stringify([
      {
        text: "Covers the essential concept",
        category: "coverage",
        importance: "mustHave",
        expectedAnswerMode:
          evaluationStrategy === "behavioral_llm" ? "story" : "conceptual",
      },
    ]);
  }
  return base;
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-theme-secondary">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-theme-muted">{hint}</p> : null}
    </div>
  );
}

function StepHeading({ number, title, description }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-theme-accent text-xs font-bold text-white">
        {number}
      </span>
      <div>
        <h2 className="text-base font-semibold text-theme-primary">{title}</h2>
        <p className="mt-0.5 text-sm text-theme-secondary">{description}</p>
      </div>
    </div>
  );
}

function RoleSelector({ value, onChange }) {
  const selected = new Set(value);
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {PLATFORM_FRESHER_ROLES.map((role) => {
        const active = selected.has(role);
        return (
          <button
            type="button"
            key={role}
            onClick={() =>
              onChange(active ? value.filter((item) => item !== role) : [...value, role])
            }
            className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-xs transition ${
              active
                ? "border-theme-accent bg-theme-accent/10 text-theme-primary"
                : "border-theme bg-theme-input text-theme-secondary hover:border-theme-accent"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                active ? "border-theme-accent bg-theme-accent text-white" : "border-theme"
              }`}
            >
              {active ? <FaCheck className="h-2.5 w-2.5" /> : null}
            </span>
            {role}
          </button>
        );
      })}
    </div>
  );
}

function ImportResult({ result, onDismiss }) {
  if (!result) return null;
  const hasErrors = Array.isArray(result.errors) && result.errors.length > 0;
  return (
    <section className={`${cardClass} mt-5 overflow-hidden`}>
      <div className="flex items-start justify-between gap-3 border-b border-theme p-4 sm:p-5">
        <div className="flex gap-3">
          {hasErrors ? (
            <FaExclamationTriangle className="mt-0.5 text-amber-500" />
          ) : (
            <FaCheckCircle className="mt-0.5 text-emerald-500" />
          )}
          <div>
            <h2 className="text-base font-semibold text-theme-primary">Import complete</h2>
            <p className="mt-1 text-sm text-theme-secondary">
              Existing questions changed: <strong>0</strong>. Duplicate IDs were safely skipped.
            </p>
          </div>
        </div>
        <button type="button" onClick={onDismiss} className="rounded-lg p-2 text-theme-muted hover:bg-theme-nav">
          <FaTimes />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5 sm:p-5">
        {[
          ["CSV rows", result.totalRows],
          ["Inserted", result.inserted],
          ["Duplicates", result.duplicates],
          ["Failed", result.failed],
          ["Valid rows", result.validRows],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-theme bg-theme-input p-3">
            <p className="text-xs text-theme-muted">{label}</p>
            <p className="mt-1 text-xl font-bold text-theme-primary">{Number(value || 0)}</p>
          </div>
        ))}
      </div>
      {hasErrors ? (
        <div className="border-t border-theme p-4 sm:p-5">
          <p className="mb-2 text-sm font-semibold text-theme-primary">Skipped rows</p>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {result.errors.map((entry, index) => (
              <div key={`${entry.row}-${entry.questionId}-${index}`} className="rounded-lg bg-theme-input px-3 py-2 text-xs">
                <span className="font-semibold text-theme-primary">Row {entry.row}</span>
                {entry.questionId ? <span className="text-theme-muted"> · {entry.questionId}</span> : null}
                <p className="mt-1 text-red-400">{entry.error}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function AIInterviewDataEntryPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [roleTags, setRoleTags] = useState([]);
  const [roundType, setRoundType] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [evaluationStrategy, setEvaluationStrategy] = useState("rubric_llm");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectedEvaluationLabel = useMemo(
    () =>
      EVALUATION_OPTIONS.find((option) => option.value === evaluationStrategy)?.label ||
      evaluationStrategy,
    [evaluationStrategy]
  );

  const chooseFile = (candidate) => {
    if (!candidate) return;
    if (!/\.csv$/i.test(candidate.name || "")) {
      setError("Select a .csv file.");
      setFile(null);
      return;
    }
    setFile(candidate);
    setError("");
    setResult(null);
  };

  const downloadTemplate = () => {
    const row = templateRow(evaluationStrategy);
    const csv = [
      TEMPLATE_COLUMNS.map(csvEscape).join(","),
      TEMPLATE_COLUMNS.map((column) => csvEscape(row[column])).join(","),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `interview-question-${evaluationStrategy}-template.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const importCsv = async () => {
    setError("");
    setResult(null);
    if (!roleTags.length) {
      setError("Select at least one fresher role.");
      return;
    }
    if (!roundType) {
      setError("Select a round type.");
      return;
    }
    if (!file) {
      setError("Upload a CSV file.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roleTags", JSON.stringify(roleTags));
    formData.append("roundType", roundType);
    formData.append("difficulty", difficulty);
    formData.append("evaluationStrategy", evaluationStrategy);
    setUploading(true);
    try {
      const response = await interviewQuestionBankAPI.importCsv(formData);
      setResult(response.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (uploadError) {
      setError(uploadError?.response?.data?.error || "CSV import failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton
            onClick={() => navigate(`${GENERAL_BASE}/interviews`)}
            label="Back to interviews"
          />
        </PageBackNavRow>

        <div className="mx-auto max-w-6xl">
          <PageHeroHeader>
            Import interview <em style={{ color: "#818CF8", fontStyle: "italic" }}>questions</em>
          </PageHeroHeader>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-theme-secondary">
            Select targeting defaults, upload a structured CSV, and append validated questions to
            the bank. Existing documents are never updated or deleted.
          </p>

          <div className="mt-6 space-y-4">
            <section className={`${cardClass} p-4 sm:p-6`}>
              <StepHeading
                number="1"
                title="Select applicable fresher roles"
                description="Every imported row receives all selected role tags."
              />
              <div className="mt-5">
                <RoleSelector value={roleTags} onChange={setRoleTags} />
              </div>
              <p className="mt-3 text-xs font-medium text-theme-accent">
                {roleTags.length} role{roleTags.length === 1 ? "" : "s"} selected
              </p>
            </section>

            <section className={`${cardClass} p-4 sm:p-6`}>
              <StepHeading
                number="2"
                title="Configure the imported questions"
                description="These values apply consistently to every row in this upload."
              />
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Field label="Round type">
                  <select className={inputClass} value={roundType} onChange={(event) => setRoundType(event.target.value)}>
                    <option value="">Select round type</option>
                    {PLATFORM_INTERVIEW_ROUND_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Difficulty">
                  <select className={inputClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                    {INTERVIEW_DIFFICULTIES.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Evaluation">
                  <select className={inputClass} value={evaluationStrategy} onChange={(event) => setEvaluationStrategy(event.target.value)}>
                    {EVALUATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className={`${cardClass} p-4 sm:p-6`}>
              <StepHeading
                number="3"
                title="Upload CSV"
                description={`Use the ${selectedEvaluationLabel} template so evaluation metadata is valid.`}
              />

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-theme-primary">Start from the standard template</p>
                  <p className="mt-1 text-xs text-theme-muted">
                    Company names belong in <code>companyTags</code>, separated with a vertical bar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-theme px-4 py-2.5 text-sm font-semibold text-theme-secondary hover:border-theme-accent hover:text-theme-primary"
                >
                  <FaDownload /> Download CSV template
                </button>
              </div>

              <div
                className={`mt-4 rounded-2xl border-2 border-dashed p-7 text-center transition sm:p-10 ${
                  dragActive
                    ? "border-theme-accent bg-theme-accent/10"
                    : "border-theme bg-theme-input"
                }`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  chooseFile(event.dataTransfer.files?.[0]);
                }}
              >
                {file ? (
                  <div className="flex flex-col items-center">
                    <FaFileAlt className="h-9 w-9 text-theme-accent" />
                    <p className="mt-3 max-w-full truncate text-sm font-semibold text-theme-primary">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-theme-muted">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-400"
                    >
                      <FaTimes /> Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <FaUpload className="mx-auto h-9 w-9 text-theme-accent" />
                    <p className="mt-3 text-sm font-semibold text-theme-primary">
                      Drop your CSV here
                    </p>
                    <p className="mt-1 text-xs text-theme-muted">or choose a file, up to 8 MB and 1,000 rows</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Choose CSV
                    </button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => chooseFile(event.target.files?.[0])}
                />
              </div>

              <div className="mt-4 rounded-xl border border-theme bg-theme-input p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                  Required common columns
                </p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-theme-muted">
                  questionId, title, question, companyTags
                </p>
                <p className="mt-2 text-xs text-theme-muted">
                  Duplicate <code>questionId</code> rows are skipped. Existing questions remain unchanged.
                </p>
              </div>
            </section>

            {error ? (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={uploading}
              onClick={importCsv}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaUpload /> {uploading ? "Validating and importing…" : "Validate and insert questions"}
            </button>
          </div>

          <ImportResult result={result} onDismiss={() => setResult(null)} />
        </div>
      </div>
    </div>
  );
}
