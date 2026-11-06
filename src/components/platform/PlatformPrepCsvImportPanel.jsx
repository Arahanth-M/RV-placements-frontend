import { useMemo, useRef, useState } from "react";
import {
  FaDownload,
  FaEdit,
  FaFileAlt,
  FaLink,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { platformAdminAPI } from "../../utils/api";
import PlatformQuestionEditModal from "./PlatformQuestionEditModal.jsx";

const inputClass =
  "w-full rounded-xl border-2 border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary";

const KIND_LABELS = {
  coding: "Coding",
  non_coding: "Non-coding",
  sql: "SQL",
};

function roleTabLabel(item) {
  return item?.prepRoleLabel || item?.prepRoleKey || "General";
}

function roleTabKey(item) {
  return String(item?.prepRoleKey ?? "");
}

function toEditDraft(item) {
  return {
    question: item.question || "",
    explanation: item.answer || "",
    intuition: item.intuition || "",
    solutions: {
      cpp: item.solutions?.cpp || "",
      java: item.solutions?.java || "",
      python: item.solutions?.python || "",
    },
  };
}

function fromEditDraft(item, draft) {
  const next = {
    ...item,
    question: String(draft.question || "").trim(),
    answer: String(draft.explanation || "").trim(),
    intuition: String(draft.intuition || "").trim(),
  };
  if (item.kind === "coding") {
    next.solutions = {
      cpp: String(draft.solutions?.cpp || "").trim(),
      java: String(draft.solutions?.java || "").trim(),
      python: String(draft.solutions?.python || "").trim(),
    };
  } else {
    delete next.solutions;
  }
  return next;
}

function validateStagingItem(item, index) {
  if (!String(item?.question || "").trim()) return `Question ${index + 1}: question is required.`;
  if (!String(item?.answer || "").trim()) return `Question ${index + 1}: answer is required.`;
  if (item?.kind === "coding") {
    if (!String(item?.intuition || "").trim()) {
      return `Question ${index + 1}: intuition is required for coding questions.`;
    }
    if (
      !String(item?.solutions?.cpp || "").trim() ||
      !String(item?.solutions?.java || "").trim() ||
      !String(item?.solutions?.python || "").trim()
    ) {
      return `Question ${index + 1}: C++, Java, and Python solutions are required for coding questions.`;
    }
  }
  return "";
}

/**
 * Platform admin: upload company-prep interview-question CSV, review role-wise, finalize into DB.
 */
export default function PlatformPrepCsvImportPanel({ companyId, companyName }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");
  const [previewErrors, setPreviewErrors] = useState([]);
  const [items, setItems] = useState([]);
  const [activeRole, setActiveRole] = useState("");
  const [editIndex, setEditIndex] = useState(-1);
  const [editDraft, setEditDraft] = useState(null);
  const [finalizeSummary, setFinalizeSummary] = useState(null);
  const [importedRoles, setImportedRoles] = useState([]);
  const [fetchingLinks, setFetchingLinks] = useState(false);
  const [linksSummary, setLinksSummary] = useState(null);
  const [generatingSummaries, setGeneratingSummaries] = useState(false);
  const [roleSummaries, setRoleSummaries] = useState(null);

  const roles = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const key = roleTabKey(item);
      if (!map.has(key)) map.set(key, roleTabLabel(item));
    }
    return [...map.entries()].map(([key, label]) => ({ key, label }));
  }, [items]);

  const quickLinkRoles = useMemo(() => {
    if (importedRoles.length) return importedRoles.filter((role) => role?.key);
    return roles.filter((role) => role.key);
  }, [importedRoles, roles]);

  const visibleItems = useMemo(() => {
    if (!roles.length) return [];
    const key = roles.some((role) => role.key === activeRole) ? activeRole : roles[0]?.key;
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => roleTabKey(item) === key);
  }, [items, roles, activeRole]);

  const selectedRoleKey = roles.some((role) => role.key === activeRole)
    ? activeRole
    : roles[0]?.key || "";

  const downloadTemplate = async () => {
    setError("");
    try {
      const res = await platformAdminAPI.downloadPrepInterviewCsvTemplate(companyId);
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${String(companyName || "company")
        .replace(/\s+/g, "-")
        .toLowerCase()}-interview-questions-template.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not download the CSV template.");
    }
  };

  const previewCsv = async () => {
    setError("");
    setFinalizeSummary(null);
    setLinksSummary(null);
    setImportedRoles([]);
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    setUploading(true);
    try {
      // Send CSV as JSON text — avoids multipart/multer failures in Safari/prod proxies.
      const csvText = await file.text();
      if (!String(csvText || "").trim()) {
        setError("The selected file is empty.");
        return;
      }
      const res = await platformAdminAPI.previewPrepInterviewCsv(companyId, { csvText });
      const nextItems = Array.isArray(res.data?.items) ? res.data.items : [];
      setItems(nextItems);
      setPreviewErrors(Array.isArray(res.data?.errors) ? res.data.errors : []);
      setActiveRole(nextItems[0] ? roleTabKey(nextItems[0]) : "");
      if (!nextItems.length && res.data?.failed) {
        setError("No valid rows. Fix the CSV errors and upload again.");
      }
    } catch (err) {
      setItems([]);
      setPreviewErrors([]);
      const apiError =
        typeof err?.response?.data?.error === "string"
          ? err.response.data.error
          : typeof err?.response?.data === "string"
            ? err.response.data.slice(0, 240)
            : "";
      const status = err?.response?.status;
      setError(
        apiError ||
          (status
            ? `CSV preview failed (HTTP ${status}).`
            : err?.message || "CSV preview failed.")
      );
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (index) => {
    const item = items[index];
    if (!item) return;
    setEditIndex(index);
    setEditDraft(toEditDraft(item));
  };

  const saveEdit = (event) => {
    event.preventDefault();
    if (editIndex < 0 || !editDraft) return;
    const nextItem = fromEditDraft(items[editIndex], editDraft);
    const validationError = validateStagingItem(nextItem, editIndex);
    if (validationError) {
      setError(validationError);
      return;
    }
    setItems((prev) => prev.map((row, i) => (i === editIndex ? nextItem : row)));
    setEditIndex(-1);
    setEditDraft(null);
    setError("");
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(-1);
      setEditDraft(null);
    }
  };

  const finalize = async () => {
    setError("");
    setFinalizeSummary(null);
    if (!items.length) {
      setError("Nothing to finalize. Upload a valid CSV first.");
      return;
    }
    for (let i = 0; i < items.length; i += 1) {
      const validationError = validateStagingItem(items[i], i);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setFinalizing(true);
    try {
      const rolesForLinks = roles
        .filter((role) => role.key)
        .map((role) => ({ key: role.key, label: role.label }));
      const res = await platformAdminAPI.finalizePrepInterviewCsv(companyId, { items });
      setFinalizeSummary(res.data || null);
      const returnedRoles = Array.isArray(res.data?.roles) ? res.data.roles : [];
      setImportedRoles(returnedRoles.length ? returnedRoles : rolesForLinks);
      setLinksSummary(null);
      setItems([]);
      setPreviewErrors([]);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err?.response?.data?.error || "Finalize failed.");
    } finally {
      setFinalizing(false);
    }
  };

  const fetchQuickLinks = async () => {
    setError("");
    setLinksSummary(null);
    setRoleSummaries(null);
    if (!quickLinkRoles.length) {
      setError("No roles from the CSV to fetch quick links for.");
      return;
    }
    setFetchingLinks(true);
    try {
      const res = await platformAdminAPI.fetchPrepQuickLinks(companyId, {
        roles: quickLinkRoles,
        country: "India",
        maxPerRole: 5,
      });
      setLinksSummary(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Quick links fetch failed.");
    } finally {
      setFetchingLinks(false);
    }
  };

  const generateRoleSummaries = async () => {
    setError("");
    setRoleSummaries(null);
    if (!quickLinkRoles.length) {
      setError("No roles available for summary generation.");
      return;
    }
    setGeneratingSummaries(true);
    try {
      const res = await platformAdminAPI.generatePrepRoleSummaries(companyId, {
        roles: quickLinkRoles,
      });
      setRoleSummaries(res.data || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Role summary generation failed.");
    } finally {
      setGeneratingSummaries(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-theme bg-theme-card p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-theme-primary sm:text-lg">
            CSV import · interview questions
          </h2>
          <p className="mt-1 text-sm text-theme-secondary">
            Upload role-wise questions for {companyName || "this company"}. Coding rows must
            include intuition and C++ / Java / Python solutions. Review, edit or delete, then
            finalize into the company card.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-theme px-3 py-2 text-sm font-medium text-theme-primary hover:bg-theme-hero/40"
        >
          <FaDownload aria-hidden /> Template
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-theme-muted">
            CSV file
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className={inputClass}
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setFinalizeSummary(null);
              setLinksSummary(null);
              setRoleSummaries(null);
              setImportedRoles([]);
            }}
          />
        </label>
        <button
          type="button"
          disabled={uploading || !file}
          onClick={previewCsv}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <FaUpload aria-hidden /> {uploading ? "Validating…" : "Validate CSV"}
        </button>
      </div>

      <p className="mt-2 text-xs text-theme-muted">
        Columns: role, kind, question, answer, intuition, solutions_cpp, solutions_java,
        solutions_python. kind = coding | non_coding | sql.
      </p>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
      {finalizeSummary ? (
        <div className="mt-3 space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="text-sm text-emerald-600">
            Added {finalizeSummary.inserted} question
            {finalizeSummary.inserted === 1 ? "" : "s"}
            {finalizeSummary.rolesAdded
              ? ` · ${finalizeSummary.rolesAdded} new role${
                  finalizeSummary.rolesAdded === 1 ? "" : "s"
                }`
              : ""}
            .
          </p>
          {quickLinkRoles.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="w-full text-xs text-theme-muted">
                Roles: {quickLinkRoles.map((role) => role.label).join(", ")}
              </p>
              <button
                type="button"
                disabled={fetchingLinks || generatingSummaries}
                onClick={fetchQuickLinks}
                className="inline-flex items-center gap-2 rounded-xl border border-theme bg-theme-card px-4 py-2 text-sm font-semibold text-theme-primary hover:bg-theme-hero/40 disabled:opacity-60"
              >
                <FaLink aria-hidden />
                {fetchingLinks ? "Fetching quick links…" : "Get quick links for CSV roles"}
              </button>
              <button
                type="button"
                disabled={generatingSummaries || fetchingLinks || !linksSummary}
                onClick={generateRoleSummaries}
                title={
                  linksSummary
                    ? "Generate LLM role summaries from the fetched quick links"
                    : "Fetch quick links first"
                }
                className="inline-flex items-center gap-2 rounded-xl border border-theme bg-theme-card px-4 py-2 text-sm font-semibold text-theme-primary hover:bg-theme-hero/40 disabled:opacity-60"
              >
                {generatingSummaries ? "Generating summaries…" : "Generate role summaries"}
              </button>
            </div>
          ) : null}
          {linksSummary ? (
            <div className="rounded-xl border border-theme bg-theme-input/30 p-3">
              <p className="text-sm text-emerald-600">
                Added {linksSummary.inserted} quick link
                {linksSummary.inserted === 1 ? "" : "s"}
                {linksSummary.duplicates
                  ? ` · ${linksSummary.duplicates} duplicate${
                      linksSummary.duplicates === 1 ? "" : "s"
                    } skipped`
                  : ""}
                .
              </p>
              {Array.isArray(linksSummary?.perRole) && linksSummary.perRole.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-theme-secondary">
                  {linksSummary.perRole.map((row) => (
                    <li key={row.key || row.label}>
                      {row.label}:{" "}
                      {row.status === "ok"
                        ? `${row.inserted} new / ${row.found} found`
                        : row.error || "failed"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {roleSummaries ? (
            <div className="rounded-xl border border-theme bg-theme-input/30 p-3">
              <p className="text-sm text-emerald-600">
                Generated {roleSummaries.generated} role summar
                {roleSummaries.generated === 1 ? "y" : "ies"}
                {roleSummaries.failed
                  ? ` · ${roleSummaries.failed} failed`
                  : ""}
                .
              </p>
              {Array.isArray(roleSummaries?.perRole) && roleSummaries.perRole.length > 0 ? (
                <ul className="mt-2 space-y-2 text-xs text-theme-secondary">
                  {roleSummaries.perRole.map((row) => (
                    <li key={row.key || row.label}>
                      <span className="font-semibold text-theme-primary">{row.label}:</span>{" "}
                      {row.status === "ok" ? row.summary : row.error || "failed"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {previewErrors.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {previewErrors.length} row{previewErrors.length === 1 ? "" : "s"} failed validation
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-theme-secondary">
            {previewErrors.slice(0, 30).map((row) => (
              <li key={`${row.row}-${row.error}`}>
                Row {row.row}: {row.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-theme-secondary">
              <FaFileAlt className="mr-1.5 inline" aria-hidden />
              {items.length} valid question{items.length === 1 ? "" : "s"} ready to review
              {quickLinkRoles.length > 0 ? (
                <span className="mt-1 block text-xs text-theme-muted sm:mt-0 sm:ml-2 sm:inline">
                  Roles for quick links: {quickLinkRoles.map((role) => role.label).join(", ")}
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={fetchingLinks || !quickLinkRoles.length || finalizing}
                onClick={fetchQuickLinks}
                className="inline-flex items-center gap-2 rounded-xl border border-theme bg-theme-card px-4 py-2 text-sm font-semibold text-theme-primary hover:bg-theme-hero/40 disabled:opacity-60"
              >
                <FaLink aria-hidden />
                {fetchingLinks ? "Fetching quick links…" : "Get quick links for CSV roles"}
              </button>
              <button
                type="button"
                disabled={finalizing || fetchingLinks}
                onClick={finalize}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {finalizing ? "Finalizing…" : "Finalize all into database"}
              </button>
            </div>
          </div>
          {linksSummary ? (
            <div className="mb-3 rounded-xl border border-theme bg-theme-input/30 p-3">
              <p className="text-sm text-emerald-600">
                Added {linksSummary.inserted} quick link
                {linksSummary.inserted === 1 ? "" : "s"}
                {linksSummary.duplicates
                  ? ` · ${linksSummary.duplicates} duplicate${
                      linksSummary.duplicates === 1 ? "" : "s"
                    } skipped`
                  : ""}
                .
              </p>
              {Array.isArray(linksSummary?.perRole) && linksSummary.perRole.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-theme-secondary">
                  {linksSummary.perRole.map((row) => (
                    <li key={row.key || row.label}>
                      {row.label}:{" "}
                      {row.status === "ok"
                        ? `${row.inserted} new / ${row.found} found`
                        : row.error || "failed"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {roles.length > 1 ? (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Roles">
              {roles.map((role) => {
                const active = role.key === selectedRoleKey;
                return (
                  <button
                    key={role.key || "general"}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveRole(role.key)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? "bg-theme-accent text-white"
                        : "border border-theme text-theme-secondary hover:text-theme-primary"
                    }`}
                  >
                    {role.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="space-y-3">
            {visibleItems.map(({ item, index }) => (
              <article
                key={`${index}-${item.question.slice(0, 24)}`}
                className="rounded-xl border border-theme bg-theme-input/40 p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-theme-muted">
                      {KIND_LABELS[item.kind] || item.kind} · {roleTabLabel(item)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-theme-primary">
                      {item.question}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(index)}
                      className="rounded-lg border border-theme p-2 text-theme-secondary hover:text-theme-primary"
                      aria-label="Edit question"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-lg border border-theme p-2 text-red-500 hover:bg-red-500/10"
                      aria-label="Delete question"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-theme-secondary">
                  {item.answer}
                </p>
                {item.kind === "coding" ? (
                  <p className="mt-2 text-xs text-theme-muted">
                    Intuition + C++ / Java / Python solutions included
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {editDraft ? (
        <PlatformQuestionEditModal
          title="Edit imported question"
          draft={editDraft}
          onChange={setEditDraft}
          onSubmit={saveEdit}
          showCodingFields={items[editIndex]?.kind === "coding"}
          onCancel={() => {
            setEditIndex(-1);
            setEditDraft(null);
          }}
        />
      ) : null}
    </section>
  );
}
