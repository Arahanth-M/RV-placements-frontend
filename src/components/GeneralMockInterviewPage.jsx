import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowRight, FaBuilding, FaSearch } from "react-icons/fa";
import { companyAPI } from "../utils/api";
import { useInterviewLock } from "../utils/InterviewLockContext";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import {
  buildPrepPathCompanyCardHref,
  parsePrepPathMockPrefill,
} from "../utils/prepPathCompanyFocus.js";
import AIInterviewTab from "./CompanyTabs/AIInterviewTab";
import AIInterviews from "./AIInterviews";
import InterviewSlotsPage from "./InterviewSlotsPage";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

const HUB_TABS = [
  { id: "mock", label: "Mock interview" },
  { id: "slots", label: "Interview slots" },
  { id: "analytics", label: "Interview analytics" },
];

function expectationTopicsFromCompany(company) {
  const raw = company?.Must_Do_Topics ?? company?.must_do_topics ?? [];
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const topics = [];
  for (const item of raw) {
    const text =
      typeof item === "string"
        ? item.trim()
        : item && typeof item === "object" && typeof item.topic === "string"
          ? item.topic.trim()
          : "";
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(text);
  }
  return topics;
}

function normalizeHubTab(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "slots" || value === "slot") return "slots";
  if (value === "analytics" || value === "analytics-page") return "analytics";
  return "mock";
}

function GeneralMockInterviewPage() {
  const { base, appPath } = useTenantShell();
  const navigate = useNavigate();
  const { setIsInterviewLocked: setGlobalInterviewLocked } = useInterviewLock();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [isInterviewLocked, setIsInterviewLocked] = useState(false);
  const [companyCard, setCompanyCard] = useState(null);
  const [companyCardLocked, setCompanyCardLocked] = useState(false);
  const [companyCardLoading, setCompanyCardLoading] = useState(false);
  const [companyCardError, setCompanyCardError] = useState("");

  const activeTab = normalizeHubTab(searchParams.get("tab"));
  const selectedId = String(searchParams.get("companyId") || "").trim();
  const mockPrefill = useMemo(
    () => parsePrepPathMockPrefill(searchParams),
    [searchParams]
  );
  const fromPrepPath = mockPrefill.fromPrepPath;
  const initialMockPlan = useMemo(() => {
    if (!mockPrefill.role && !mockPrefill.rounds.length) return null;
    return {
      role: mockPrefill.role,
      difficulty: mockPrefill.difficulty,
      rounds: mockPrefill.rounds,
    };
  }, [mockPrefill.role, mockPrefill.difficulty, mockPrefill.rounds]);

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

  useEffect(() => {
    if (!selectedId) {
      setCompanyCard(null);
      setCompanyCardLocked(false);
      setCompanyCardError("");
      setCompanyCardLoading(false);
      return undefined;
    }
    let cancelled = false;
    setCompanyCard(null);
    setCompanyCardLocked(false);
    setCompanyCardError("");
    setCompanyCardLoading(true);
    companyAPI
      .getCompany(selectedId, { scope: "platform" })
      .then((res) => {
        if (cancelled) return;
        setCompanyCardLocked(false);
        setCompanyCard(res?.data && typeof res.data === "object" ? res.data : null);
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        const lockedCompany = err?.response?.data?.company;
        if (err?.response?.status === 402 && lockedCompany && typeof lockedCompany === "object") {
          setCompanyCard(lockedCompany);
          setCompanyCardLocked(true);
          setCompanyCardError("");
          return;
        }
        setCompanyCard(null);
        setCompanyCardLocked(false);
        setCompanyCardError("Could not load this company's card.");
      })
      .finally(() => {
        if (!cancelled) setCompanyCardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const expectationTopics = useMemo(
    () => expectationTopicsFromCompany(companyCard),
    [companyCard]
  );

  const selectedCompany = useMemo(() => {
    if (!selectedId) return null;
    return (
      companies.find((c) => String(c._id) === selectedId) || {
        _id: selectedId,
        name: "Selected company",
      }
    );
  }, [companies, selectedId]);

  const companyCardHref = useMemo(
    () => (selectedId ? buildPrepPathCompanyCardHref(appPath, selectedId) : ""),
    [appPath, selectedId]
  );

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

  const setHubTab = useCallback(
    (tabId) => {
      const next = new URLSearchParams(searchParams);
      if (tabId === "mock") next.delete("tab");
      else next.set("tab", tabId);
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
            <PageBackButton
              onClick={() => (fromPrepPath ? navigate(-1) : navigate(base))}
              label="Back"
            />
          </PageBackNavRow>
        ) : null}

        <div className="mx-auto max-w-6xl">
          {!isInterviewLocked ? (
            <PageHeroHeader>
              AI mock <em style={{ color: "#818CF8", fontStyle: "italic" }}>interviews</em>
            </PageHeroHeader>
          ) : null}

          {!isInterviewLocked ? (
            <div
              className="mb-6 flex w-fit flex-wrap gap-2 rounded-xl border border-theme bg-theme-card p-1"
              role="tablist"
              aria-label="AI mock interview sections"
            >
              {HUB_TABS.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setHubTab(tab.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      selected
                        ? "bg-theme-hero text-theme-accent shadow-md"
                        : "text-theme-secondary hover:bg-theme-nav hover:text-theme-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {activeTab === "slots" && !isInterviewLocked ? (
            <InterviewSlotsPage embedded />
          ) : null}

          {activeTab === "analytics" && !isInterviewLocked ? (
            <AIInterviews embedded hideSlotsTab />
          ) : null}

          {activeTab === "mock" || isInterviewLocked ? (
            <>
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

                  {fromPrepPath && selectedCompany ? (
                    <p className="mt-3 text-xs text-theme-muted">
                      PrepPath suggested this mock. You can still change role, difficulty, or
                      rounds before starting.
                    </p>
                  ) : null}
                </section>
              ) : null}

              {!isInterviewLocked && selectedCompany ? (
                <section
                  className="mb-5 rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 shadow-sm"
                  aria-label="Company stats card"
                  data-testid="mock-company-stats"
                >
                  <h2 className="text-base font-semibold text-theme-primary">Company stats</h2>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Before you configure the interview, review{" "}
                    {selectedCompany.name ? `${selectedCompany.name}'s` : "this company's"}{" "}
                    prep notes. The focus areas are what they expect you to know.
                  </p>

                  {companyCardHref ? (
                    <div className="mt-4">
                      <Link
                        to={companyCardHref}
                        data-testid="mock-company-card-link"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-theme-accent hover:underline"
                      >
                        Open {selectedCompany.name || "company"} card
                        <FaArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    </div>
                  ) : null}

                  {companyCardLoading ? (
                    <p className="mt-4 text-sm text-theme-muted">Loading company prep notes…</p>
                  ) : null}
                  {companyCardError ? (
                    <p className="mt-4 text-sm text-red-400">{companyCardError}</p>
                  ) : null}

                  {companyCard ? (
                    <div className="mt-4">
                      {companyCardLocked ? (
                        <p className="text-sm text-theme-secondary">
                          This company card is locked. Unlock it to review the focus areas and
                          must-do topics before you start.
                        </p>
                      ) : expectationTopics.length > 0 ? (
                        <div className="min-w-0 rounded-2xl border border-theme bg-theme-input/40 p-4">
                          <p className="text-sm font-semibold text-theme-primary">
                            What they expect
                          </p>
                          <p className="mt-1 text-xs text-theme-muted">
                            Must-do topics from this company card. These show up as tips while
                            your answers are being scored.
                          </p>
                          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                            {expectationTopics.map((topic) => (
                              <li
                                key={topic}
                                className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary"
                              >
                                {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-theme-muted">
                          This company does not have must-do topics yet. You can still open the
                          card for the rest of its prep notes.
                        </p>
                      )}
                    </div>
                  ) : null}
                </section>
              ) : null}

              <AIInterviewTab
                company={selectedCompany}
                setupLocked={!selectedCompany}
                onInterviewLockChange={setIsInterviewLocked}
                onForceExitToGeneral={() => setIsInterviewLocked(false)}
                initialMockPlan={initialMockPlan}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default GeneralMockInterviewPage;
