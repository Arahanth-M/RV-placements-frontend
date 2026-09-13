import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaBuilding, FaSearch } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { useInterviewLock } from "../utils/InterviewLockContext";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import AIInterviewTab from "./CompanyTabs/AIInterviewTab";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

function GeneralMockInterviewPage() {
  const { base } = useTenantShell();
  const navigate = useNavigate();
  const { setIsInterviewLocked: setGlobalInterviewLocked } = useInterviewLock();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [isInterviewLocked, setIsInterviewLocked] = useState(false);

  const selectedId = String(searchParams.get("companyId") || "").trim();

  useEffect(() => {
    setGlobalInterviewLocked(isInterviewLocked);
    return () => setGlobalInterviewLocked(false);
  }, [isInterviewLocked, setGlobalInterviewLocked]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await companyAPI.getCompanyNames();
        if (cancelled) return;
        setCompanies(Array.isArray(res.data) ? res.data : []);
        setLoadError("");
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCompanies([]);
          setLoadError("Could not load companies. Please try again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCompany = useMemo(() => {
    if (!selectedId) return null;
    return (
      companies.find((c) => String(c._id) === selectedId) || {
        _id: selectedId,
        name: "Selected company",
      }
    );
  }, [companies, selectedId]);

  const searchQuery = search.trim();
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return [];
    return companies.filter((c) => String(c.name || "").toLowerCase().includes(q));
  }, [companies, searchQuery]);

  const showSuggestions = !selectedCompany && searchQuery.length > 0;

  const selectCompany = useCallback(
    (id) => {
      const next = new URLSearchParams(searchParams);
      if (id) next.set("companyId", String(id));
      else next.delete("companyId");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        {!isInterviewLocked ? (
          <PageBackNavRow>
            <PageBackButton onClick={() => navigate(base)} label="Back" />
          </PageBackNavRow>
        ) : null}

        <div className="mx-auto max-w-6xl">
          {!isInterviewLocked ? (
            <PageHeroHeader>
              AI mock <em style={{ color: "#818CF8", fontStyle: "italic" }}>interviews</em>
            </PageHeroHeader>
          ) : null}

          {!isInterviewLocked ? (
            <section className="mb-5 rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-theme-primary">Company</h2>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Search by name, then configure rounds and start.
                  </p>
                </div>
              </div>

              <div className="relative mt-4">
                <label htmlFor="mock-company-search" className="sr-only">
                  Search companies
                </label>
                <FaSearch
                  className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-theme-muted"
                  aria-hidden
                />
                <input
                  id="mock-company-search"
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                  value={selectedCompany ? selectedCompany.name : search}
                  onChange={(e) => {
                    if (selectedId) selectCompany("");
                    setSearch(e.target.value);
                  }}
                  placeholder="Type a company name…"
                  className="w-full rounded-xl border border-theme-input bg-theme-input py-2.5 pl-10 pr-4 text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />

                {showSuggestions ? (
                  <ul
                    className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-theme bg-theme-card py-1 shadow-xl"
                    role="listbox"
                    aria-label="Company suggestions"
                  >
                    {filtered.slice(0, 40).map((company) => (
                      <li key={String(company._id)} role="option">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearch("");
                            selectCompany(company._id);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-theme-primary hover:bg-theme-nav"
                        >
                          <FaBuilding className="h-3.5 w-3.5 shrink-0 text-theme-muted" aria-hidden />
                          <span className="truncate">{company.name}</span>
                        </button>
                      </li>
                    ))}
                    {filtered.length === 0 ? (
                      <li className="px-3 py-3 text-sm text-theme-muted">
                        No companies match that search.
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>

              {loadError ? (
                <p className="mt-2 text-sm text-red-400">{loadError}</p>
              ) : null}
            </section>
          ) : null}

          <AIInterviewTab
            company={selectedCompany}
            setupLocked={!selectedCompany}
            onInterviewLockChange={setIsInterviewLocked}
            onForceExitToGeneral={() => setIsInterviewLocked(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default GeneralMockInterviewPage;
