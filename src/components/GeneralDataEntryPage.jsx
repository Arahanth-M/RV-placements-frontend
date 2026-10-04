import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { GENERAL_BASE } from "../constants/tenant.js";
import GeneralResearchPanel from "./GeneralResearchPanel.jsx";
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

export default function GeneralDataEntryPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [listError, setListError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [detailError, setDetailError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

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
      setCompanyName("");
      setDetailError("");
      return undefined;
    }
    let cancelled = false;
    setLoadingDetail(true);
    (async () => {
      try {
        const res = await companyAPI.getPlatformContent(companyId);
        if (cancelled) return;
        setCompanyName(String(res.data?.name || "").trim());
        setDetailError("");
      } catch (err) {
        if (!cancelled) {
          setCompanyName("");
          setDetailError(err?.response?.data?.error || "Could not load company.");
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

  const resolvedName =
    companyName ||
    companies.find((row) => String(row._id) === String(companyId))?.name ||
    "";

  if (companyId) {
    return (
      <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
        <PageHeroFontStyles />
        <div className={pageShellInnerClass}>
          <PageBackNavRow>
            <PageBackButton onClick={() => navigate(`${GENERAL_BASE}/data-entry`)} label="Back" />
          </PageBackNavRow>
          <PageHeroHeader>{resolvedName || "Company content"}</PageHeroHeader>

          {loadingDetail ? (
            <p className="text-center text-sm text-theme-secondary">Loading…</p>
          ) : null}
          {detailError ? (
            <p className="mb-4 text-center text-sm text-red-500">{detailError}</p>
          ) : null}

          {!loadingDetail && !detailError ? (
            <GeneralResearchPanel key={companyId} companyId={companyId} companyName={resolvedName} />
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
        <PageHeroHeader subtitle="Choose a company to research interview questions, OA questions, or interview experiences.">
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
