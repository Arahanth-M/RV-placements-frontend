import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../utils/api";
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
} from "../constants/placementYears.js";
import { COMPANY_VISIT_CLUSTER_FORM_OPTIONS } from "../constants/placementTiers.js";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const STORE_AS_PRESETS = ["skills", "workDescription"];

function guessStoreAs(sourceField) {
  const raw = String(sourceField || "").trim();
  if (!raw) return "";
  const compact = raw.toLowerCase().replace(/\s+/g, "");
  // Only exact canonical names collapse; keep "Bonus Skills", "Technical Skills", etc.
  if (compact === "skills" || compact === "skill") return "skills";
  if (compact === "workdescription" || compact === "work") return "workDescription";
  return raw;
}

function isUsableExtractedValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.some((v) => String(v ?? "").trim());
  if (typeof value === "object") return false;
  const s = String(value).trim();
  if (!s) return false;
  if (
    /^(n\/?a|na|none|null|undefined|not\s+(specified|mentioned|found|available|provided)|unknown|-|—|–|\.|tbd|tba)$/i.test(
      s
    )
  ) {
    return false;
  }
  return true;
}

function fieldValueToEditString(value, fieldName = "") {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function editStringToPayloadValue(fieldName, text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return undefined;
  if (!isUsableExtractedValue(trimmed) && !trimmed.includes("\n")) return undefined;
  const nk = fieldName.toLowerCase().replace(/\s+/g, "");
  const isPointsField =
    nk === "skills" ||
    nk.includes("skill") ||
    nk === "workdescription" ||
    nk === "work" ||
    nk === "responsibilities" ||
    nk.includes("responsib") ||
    nk.includes("duties");
  if (isPointsField) {
    const lines = trimmed
      .split(/\r?\n/)
      .map((line) =>
        line
          .replace(/^[-*•]+\s*/, "")
          .replace(/^\d+[.)]\s*/, "")
          .trim()
      )
      .filter(Boolean);
    if (lines.length === 0) return undefined;
    return lines.length === 1 ? lines[0] : lines;
  }
  if (!isUsableExtractedValue(trimmed)) return undefined;
  return trimmed;
}

export default function JdImportPage() {
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestRootRef = useRef(null);
  const debounceRef = useRef(null);

  const [year, setYear] = useState(DEFAULT_PLACEMENT_DETAIL_YEAR);
  const [cluster, setCluster] = useState("Computer Science and Engineering");
  const [roleName, setRoleName] = useState("");
  const [file, setFile] = useState(null);

  const [scanning, setScanning] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  /** @type {[{ id: string, sourceField: string, storeAs: string, selected: boolean }]} */
  const [mappings, setMappings] = useState([]);
  const [scanned, setScanned] = useState(false);
  const [extracted, setExtracted] = useState(null);
  /** @type {[{ id: string, storeAs: string, value: string, sourceField?: string }]} */
  const [editRows, setEditRows] = useState([]);
  const [rawPreview, setRawPreview] = useState("");
  const [pdfMeta, setPdfMeta] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const q = String(companyQuery ?? "").trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (selectedCompany && q === selectedCompany.name) {
      setSuggestions([]);
      setSuggestOpen(false);
      return undefined;
    }

    if (q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return undefined;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await adminAPI.companySuggest(q);
        const items = Array.isArray(data?.items) ? data.items : [];
        setSuggestions(items);
        setSuggestOpen(items.length > 0);
      } catch {
        setSuggestions([]);
        setSuggestOpen(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [companyQuery, selectedCompany]);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target instanceof Node ? event.target : null;
      if (target && suggestRootRef.current?.contains(target)) return;
      setSuggestOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const pickCompany = (item) => {
    const id = item?.id || item?._id;
    const name = String(item?.name || "").trim();
    if (!id || !name) return;
    setSelectedCompany({ id: String(id), name });
    setCompanyQuery(name);
    setSuggestOpen(false);
    setSuggestions([]);
  };

  const updateMapping = (id, patch) => {
    setMappings((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const addCustomMapping = () => {
    setMappings((prev) => [
      ...prev,
      {
        id: `map-custom-${Date.now()}`,
        sourceField: "",
        storeAs: "",
        selected: true,
      },
    ]);
  };

  const removeMapping = (id) => {
    setMappings((prev) => prev.filter((row) => row.id !== id));
  };

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Choose a JD PDF first.");
      return;
    }

    try {
      setScanning(true);
      setExtracted(null);
      setEditRows([]);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roleName", roleName.trim());

      const { data } = await adminAPI.scanJdImport(formData);
      const suggested = Array.isArray(data?.suggestedFields)
        ? data.suggestedFields
        : [];
      setRawPreview(data?.rawTextPreview || "");
      setPdfMeta({
        pdfPages: data?.pdfPages ?? null,
        pagesWithText: data?.pagesWithText ?? null,
        pagesRendered: data?.pagesRendered ?? null,
        textChars: data?.textChars ?? (data?.rawTextPreview || "").length,
      });
      setScanned(true);
      setMappings(
        suggested.map((name, index) => ({
          id: `map-${Date.now()}-${index}`,
          sourceField: name,
          storeAs: guessStoreAs(name),
          selected: Boolean(guessStoreAs(name)),
        }))
      );
      const pageNote =
        data?.pdfPages != null
          ? ` Read ${data.pagesWithText ?? "?"}/${data.pdfPages} page(s) with text.`
          : "";
      setToast({
        type: "success",
        message:
          suggested.length > 0
            ? `Found ${suggested.length} field(s).${pageNote} Pick what to extract.`
            : `PDF read.${pageNote} No fields suggested — add your own below.`,
      });
    } catch (err) {
      console.error(err);
      setScanned(false);
      setMappings([]);
      setPdfMeta(null);
      setError(
        err.response?.data?.error ||
          err.response?.data?.details ||
          "Failed to read PDF."
      );
    } finally {
      setScanning(false);
    }
  };

  const handleExtract = async () => {
    setError("");
    if (!file) {
      setError("Choose a JD PDF first.");
      return;
    }

    const selected = mappings
      .map((row) => ({
        sourceField: String(row.sourceField || "").trim(),
        storeAs: String(row.storeAs || "").trim(),
        selected: row.selected,
      }))
      .filter((row) => row.selected);

    if (selected.length === 0) {
      setError("Select at least one field to extract.");
      return;
    }
    for (const row of selected) {
      if (!row.sourceField) {
        setError("Every selected row needs a PDF field name.");
        return;
      }
      if (!row.storeAs) {
        setError(`Choose “Save as” for "${row.sourceField}".`);
        return;
      }
    }

    const sourceFields = [...new Set(selected.map((r) => r.sourceField))];

    try {
      setExtracting(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fields", JSON.stringify(sourceFields));
      formData.append("roleName", roleName.trim());
      if (selectedCompany?.id) {
        formData.append("companyId", selectedCompany.id);
      }
      formData.append("year", String(year));

      const { data } = await adminAPI.extractJdImport(formData);
      const extractedObj =
        data?.extracted && typeof data.extracted === "object"
          ? data.extracted
          : {};
      setExtracted(extractedObj);
      if (data?.rawTextPreview) setRawPreview(data.rawTextPreview);

      const rows = selected.map((row, index) => {
        const raw =
          extractedObj[row.sourceField] ??
          Object.entries(extractedObj).find(
            ([k]) => k.toLowerCase() === row.sourceField.toLowerCase()
          )?.[1];
        return {
          id: `extract-${Date.now()}-${index}`,
          sourceField: row.sourceField,
          storeAs: row.storeAs,
          value: isUsableExtractedValue(raw)
            ? fieldValueToEditString(raw, row.storeAs)
            : "",
        };
      });
      setEditRows(rows);
      setToast({ type: "success", message: "Extracted — review values, then save." });
    } catch (err) {
      console.error(err);
      setExtracted(null);
      setEditRows([]);
      setError(
        err.response?.data?.error ||
          err.response?.data?.details ||
          "Extraction failed."
      );
    } finally {
      setExtracting(false);
    }
  };

  const updateEditRowStoreAs = (id, storeAs) => {
    setEditRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, storeAs } : row))
    );
  };

  const updateEditRowValue = (id, value) => {
    setEditRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, value } : row))
    );
  };

  const removeEditRow = (id) => {
    setEditRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSave = async () => {
    setError("");
    if (!selectedCompany?.id) {
      setError("Select a company from suggestions before saving.");
      return;
    }

    /** @type {Record<string, unknown>} */
    const payload = {};
    const seen = new Set();
    for (const row of editRows) {
      const storeAs = String(row.storeAs ?? "").trim();
      if (!storeAs) {
        setError("Every row needs a Save as name.");
        return;
      }
      const keyLower = storeAs.toLowerCase();
      if (seen.has(keyLower)) {
        setError(`Duplicate Save as name "${storeAs}".`);
        return;
      }
      seen.add(keyLower);
      const value = editStringToPayloadValue(storeAs, row.value);
      if (value !== undefined) payload[storeAs] = value;
    }
    if (Object.keys(payload).length === 0) {
      setError("Nothing to save — fill at least one value.");
      return;
    }

    try {
      setSaving(true);
      await adminAPI.applyJdImport(
        {
          companyId: selectedCompany.id,
          roleName: roleName.trim(),
          payload,
          placementCluster: cluster || undefined,
        },
        {
          year,
          placementCluster: cluster || undefined,
        }
      );
      setToast({
        type: "success",
        message: `Saved to company_visits_with_rvitm · ${selectedCompany.name} (${year}${
          cluster ? `, ${cluster}` : ", CS hub"
        }).`,
      });
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const apiMsg =
        err.response?.data?.details || err.response?.data?.error || "";
      setError(
        apiMsg
          ? status
            ? `Save failed (${status}): ${apiMsg}`
            : apiMsg
          : "Save failed."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      {toast?.message ? (
        <div
          className={`fixed right-4 top-4 z-[90] rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton
            onClick={() => {
              window.history.back();
            }}
            label="Back"
          />
        </PageBackNavRow>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
            Temporary tool · 2026 JD ingest
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-100 sm:text-3xl">
            JD PDF import
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            1) Read the PDF → 2) pick fields and Save as → 3) extract → 4) save.
            Skills / work only (no CTC). Open via{" "}
            <code className="text-slate-300">/admin/jd-import</code>.
          </p>
        </div>

        <form
          onSubmit={handleScan}
          className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6"
        >
          <div ref={suggestRootRef} className="relative">
            <label
              htmlFor="jd-company"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Company
            </label>
            <input
              id="jd-company"
              type="text"
              autoComplete="off"
              value={companyQuery}
              onChange={(e) => {
                setCompanyQuery(e.target.value);
                setSelectedCompany(null);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setSuggestOpen(true);
              }}
              placeholder="Search company name (pick a suggestion)"
              className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {selectedCompany ? (
              <p className="mt-1.5 text-xs text-emerald-400/90">
                Selected: {selectedCompany.name}{" "}
                <span className="text-slate-500">({selectedCompany.id})</span>
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                Pick from suggestions so save can target the correct company.
              </p>
            )}
            {suggestOpen && suggestions.length > 0 ? (
              <ul
                className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-lg"
                role="listbox"
              >
                {suggestions.map((item) => (
                  <li key={item.id || item._id} role="presentation">
                    <button
                      type="button"
                      className="flex w-full px-4 py-2.5 text-left text-sm text-slate-100 hover:bg-slate-800"
                      onClick={() => pickCompany(item)}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="jd-year"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Placement year
              </label>
              <select
                id="jd-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PLACEMENT_DETAIL_VISIT_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="jd-cluster"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Visit cluster (optional)
              </label>
              <select
                id="jd-cluster"
                value={cluster}
                onChange={(e) => setCluster(e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {COMPANY_VISIT_CLUSTER_FORM_OPTIONS.map((o) => (
                  <option key={o.value || "default"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="jd-role-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Role name (optional)
            </label>
            <input
              id="jd-role-name"
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Leave blank to save without a role name"
              className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="jd-file"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              JD PDF
            </label>
            <input
              id="jd-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setScanned(false);
                setMappings([]);
                setExtracted(null);
                setEditRows([]);
                setPdfMeta(null);
                setRawPreview("");
              }}
              className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500"
            />
          </div>

          {error ? (
            <p className="rounded-md border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={scanning}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
            >
              {scanning ? "Reading PDF…" : "1. Read PDF"}
            </button>
            {selectedCompany?.id ? (
              <Link
                to={`/companies/${selectedCompany.id}?year=${year}`}
                className="text-sm text-indigo-300 hover:text-indigo-200"
              >
                Open company page
              </Link>
            ) : null}
          </div>
        </form>

        {scanned ? (
          <div className="mt-6 space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-indigo-400">
                2. Choose fields to extract
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Tick what to pull from the PDF, and set{" "}
                <span className="text-slate-400">Save as</span> to the storage
                key shown in the UI (exact name is kept — e.g.{" "}
                <code className="text-slate-300">Bonus Skills</code>). Use{" "}
                <code className="text-slate-300">skills</code> /{" "}
                <code className="text-slate-300">workDescription</code> only
                when you want those canonical keys.
              </p>
            </div>

            {pdfMeta?.pdfPages != null ? (
              <p className="text-xs text-slate-400">
                PDF pages:{" "}
                <span className="text-slate-200">
                  {pdfMeta.pagesWithText ?? "?"}/{pdfMeta.pdfPages}
                </span>{" "}
                with extractable text
                {pdfMeta.textChars != null
                  ? ` · ${pdfMeta.textChars.toLocaleString()} characters`
                  : ""}
                {pdfMeta.pdfPages > 1 &&
                pdfMeta.pagesWithText != null &&
                pdfMeta.pagesWithText < pdfMeta.pdfPages
                  ? " — some pages had no text (may be scanned images)."
                  : ""}
              </p>
            ) : null}

            {rawPreview ? (
              <details className="rounded-md border border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-400" open>
                <summary className="cursor-pointer text-slate-300">
                  Full PDF text (all pages)
                </summary>
                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap">
                  {rawPreview}
                </pre>
              </details>
            ) : null}

            <div className="space-y-3">
              {mappings.length === 0 ? (
                <p className="text-sm italic text-slate-500">
                  No suggested fields — add a custom row below.
                </p>
              ) : null}
              {mappings.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-2 rounded-lg border border-slate-700/80 bg-slate-950/40 p-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end"
                >
                  <label className="flex items-center gap-2 pb-2 text-sm text-slate-300 sm:pb-2">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(e) =>
                        updateMapping(row.id, { selected: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    Use
                  </label>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      From PDF
                    </label>
                    <input
                      type="text"
                      value={row.sourceField}
                      onChange={(e) =>
                        updateMapping(row.id, {
                          sourceField: e.target.value,
                          storeAs:
                            row.storeAs || guessStoreAs(e.target.value),
                        })
                      }
                      placeholder="Section / field in JD"
                      className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Save as
                    </label>
                    <input
                      type="text"
                      list={`store-as-${row.id}`}
                      value={row.storeAs}
                      onChange={(e) =>
                        updateMapping(row.id, { storeAs: e.target.value })
                      }
                      placeholder="Keep PDF name, or skills / workDescription"
                      className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <datalist id={`store-as-${row.id}`}>
                      {STORE_AS_PRESETS.map((preset) => (
                        <option key={preset} value={preset} />
                      ))}
                    </datalist>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMapping(row.id)}
                    className="rounded-md border border-slate-600 px-3 py-2 text-xs text-red-300 hover:border-red-500/60 hover:bg-slate-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addCustomMapping}
                className="text-sm text-indigo-300 hover:text-indigo-200"
              >
                + Add custom field
              </button>
              <button
                type="button"
                disabled={extracting}
                onClick={handleExtract}
                className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
              >
                {extracting ? "Extracting…" : "3. Extract selected"}
              </button>
            </div>
          </div>
        ) : null}

        {extracted !== null ? (
          <div className="mt-6 space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-indigo-400">
              4. Review &amp; save
            </h2>
            <div className="space-y-4">
              {editRows.length === 0 ? (
                <p className="text-sm italic text-slate-500">
                  Nothing extracted — go back and adjust field mappings.
                </p>
              ) : null}
              {editRows.map((row) => {
                const storeKey = String(row.storeAs || "").toLowerCase();
                const isPointsField =
                  storeKey.includes("skill") ||
                  storeKey.includes("work") ||
                  storeKey.includes("responsib") ||
                  storeKey.includes("duties");
                return (
                  <div
                    key={row.id}
                    className="space-y-2 rounded-lg border border-slate-700/80 bg-slate-950/40 p-3"
                  >
                    {row.sourceField ? (
                      <p className="text-xs text-slate-500">
                        From PDF:{" "}
                        <span className="text-slate-400">{row.sourceField}</span>
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Save as
                        </label>
                        <input
                          type="text"
                          list={`review-store-${row.id}`}
                          value={row.storeAs}
                          onChange={(e) =>
                            updateEditRowStoreAs(row.id, e.target.value)
                          }
                          className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <datalist id={`review-store-${row.id}`}>
                          {STORE_AS_PRESETS.map((preset) => (
                            <option key={preset} value={preset} />
                          ))}
                        </datalist>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEditRow(row.id)}
                        className="shrink-0 rounded-md border border-slate-600 px-3 py-2 text-xs text-red-300 hover:border-red-500/60 hover:bg-slate-800"
                      >
                        Remove
                      </button>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Value
                      </label>
                      {isPointsField ? (
                        <textarea
                          value={row.value}
                          onChange={(e) =>
                            updateEditRowValue(row.id, e.target.value)
                          }
                          placeholder="One point per line"
                          className="min-h-[96px] w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) =>
                            updateEditRowValue(row.id, e.target.value)
                          }
                          className="w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save to company"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
