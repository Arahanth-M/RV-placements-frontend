import { useCallback, useEffect, useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { platformAdminAPI } from "../utils/api";
import { GENERAL_BASE } from "../constants/tenant.js";
import { CAMPUS_ADMIN_SITES } from "../utils/collegeScope.js";
import { ONBOARDING_FEATURES } from "../constants/collegeOnboarding.js";
import { GENERAL_COMPANY_CATEGORIES } from "../utils/generalCompanyCategory.js";
import AdminSubmissionsTab from "./AdminSubmissionsTab";
import DashboardNavCard, { DashboardNavGrid } from "./DashboardNavCard.jsx";
import DashboardRefreshButton from "./DashboardRefreshButton.jsx";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";
import ThemedSelect from "./ThemedSelect.jsx";
import PlatformRuntimeSecretsPanel from "./PlatformRuntimeSecretsPanel.jsx";
import TestEmailPanel from "./TestEmailPanel.jsx";

const TAB_KEYS = new Set([
  "stats",
  "visitors",
  "submissions",
  "onboarding",
  "billing",
  "campus",
  "keys",
  "test-email",
]);
const ONBOARDING_STATUSES = [
  "demo_requested",
  "quotation_requested",
  "quotation_sent",
  "mou_pending",
  "payment_pending",
  "onboarded",
];
const PLAN_LABELS = {
  category: "Unlock one category",
  prep_path: "Unlimited PrepPath",
  mocks: "Unlimited AI mock interviews",
  all_premium: "All premium features",
  all_cards: "Unlock all company cards",
  mocks_prep: "AI mocks + PrepPath",
};

function planLabel(planId, categoryId) {
  const name = PLAN_LABELS[String(planId || "").trim()] || planId || "Premium";
  if (!categoryId) return name;
  const category = GENERAL_COMPANY_CATEGORIES.find((row) => row.id === categoryId);
  return `${name} · ${category?.label || categoryId}`;
}

function orderUserKey(order) {
  return (
    String(order?.userId || "").trim() ||
    String(order?.email || "").trim().toLowerCase() ||
    String(order?._id || "")
  );
}

function groupPaidOrdersByUser(orders) {
  const map = new Map();
  for (const order of Array.isArray(orders) ? orders : []) {
    const id = orderUserKey(order);
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, {
        id,
        email: String(order.email || "").trim() || "—",
        features: [],
        totalPaise: 0,
        latestAt: null,
      });
    }
    const row = map.get(id);
    if (order.email) row.email = String(order.email).trim();
    row.features.push({
      id: String(order._id),
      label: planLabel(order.planId, order.categoryId),
      createdAt: order.createdAt,
      amountPaise: Number(order.amountPaise) || 0,
      currency: order.currency || "INR",
    });
    row.totalPaise += Number(order.amountPaise) || 0;
    const when = order.createdAt ? new Date(order.createdAt) : null;
    if (when && !Number.isNaN(when.getTime()) && (!row.latestAt || when > row.latestAt)) {
      row.latestAt = when;
    }
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      features: [...row.features].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }),
    }))
    .sort((a, b) => {
      const aTime = a.latestAt ? a.latestAt.getTime() : 0;
      const bTime = b.latestAt ? b.latestAt.getTime() : 0;
      return bTime - aTime;
    });
}

function formatAmount(amountPaise, currency = "INR") {
  const rupees = Number(amountPaise);
  if (!Number.isFinite(rupees)) return "—";
  const amount = (rupees / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return currency === "INR" ? `₹${amount}` : `${amount} ${currency}`;
}

function emptyStats() {
  return {
    totalUsers: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    onboardingOpen: 0,
    paidOrders: 0,
    activeEntitlements: 0,
    platformMockSessions: 0,
    prepPathPlans: 0,
  };
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-theme-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-theme-secondary">{hint}</p> : null}
    </div>
  );
}

export default function PlatformAdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const activeTab = TAB_KEYS.has(searchParams.get("tab")) ? searchParams.get("tab") : null;

  const setTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (!tab) next.delete("tab");
    else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const loadStats = useCallback(async () => {
    const { data } = await platformAdminAPI.getStats();
    setStats({ ...emptyStats(), ...(data || {}) });
  }, []);

  const refresh = useCallback(
    async (setBusy = setLoading) => {
      setBusy(true);
      setError("");
      try {
        await loadStats();
      } catch (err) {
        setError(err?.response?.data?.error || "Could not load platform admin stats.");
      } finally {
        setBusy(false);
      }
    },
    [loadStats]
  );

  useEffect(() => {
    void refresh(setLoading);
  }, [refresh]);

  const navTabs = useMemo(
    () => [
      {
        key: "stats",
        title: "Platform stats",
        description: "/general users, mocks, PrepPath, and paid access.",
        cta: "View stats",
        accent: "border-l-violet-500",
        ctaColor: "text-violet-500",
      },
      {
        key: "visitors",
        title: "Visitors",
        description: "People who signed in on or after 1 October 2026.",
        cta: "View visitors",
        accent: "border-l-teal-500",
        ctaColor: "text-teal-600",
      },
      {
        key: "companies",
        title: "Company prep content",
        description: "Edit OA, interviews, and experiences, grouped like Student Corner.",
        cta: "Open editor",
        accent: "border-l-emerald-500",
        ctaColor: "text-emerald-600",
        href: `${GENERAL_BASE}/data-entry`,
      },
      {
        key: "keys",
        title: "Research API keys",
        description: "Replace Groq and Tavily keys when a token is used up.",
        cta: "Manage keys",
        accent: "border-l-amber-500",
        ctaColor: "text-amber-600",
      },
      {
        key: "bank",
        title: "Interview question bank",
        description: "Import and tag the shared mock-interview question bank.",
        cta: "Open importer",
        accent: "border-l-sky-500",
        ctaColor: "text-sky-600",
        href: `${GENERAL_BASE}/ai-interview-data-entry`,
      },
      {
        key: "submissions",
        title: "Platform submissions",
        description: "Approve /general student contributions onto platform company content.",
        cta: "Review submissions",
        accent: "border-l-rose-500",
        ctaColor: "text-rose-500",
        badge: stats.pendingSubmissions,
        badgeLabel: "pending",
      },
      {
        key: "onboarding",
        title: "Campus onboarding inbox",
        description: "Demo and full onboarding requests from /onboard.",
        cta: "Open inbox",
        accent: "border-l-amber-500",
        ctaColor: "text-amber-600",
        badge: stats.onboardingOpen,
        badgeLabel: "open",
      },
      {
        key: "test-email",
        title: "Set test emailId",
        description: "Give an email a timed window to try each feature once.",
        cta: "Set test email",
        accent: "border-l-cyan-500",
        ctaColor: "text-cyan-600",
      },
      {
        key: "billing",
        title: "Billing & access",
        description: "Premium users, plans unlocked, and amounts paid.",
        cta: "View billing",
        accent: "border-l-indigo-500",
        ctaColor: "text-indigo-500",
      },
      {
        key: "campus",
        title: "Visit campus dashboard",
        description: "Open a college campus admin platform.",
        cta: "View campuses",
        accent: "border-l-slate-500",
        ctaColor: "text-slate-500",
      },
    ],
    [stats.pendingSubmissions, stats.onboardingOpen]
  );

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        {activeTab ? (
          <PageBackNavRow>
            <PageBackButton onClick={() => setTab(null)} label="Back to platform admin" />
          </PageBackNavRow>
        ) : (
          <div className="mb-6">
            <PageHeroHeader>
              Platform <em style={{ color: "#818CF8", fontStyle: "italic" }}>admin</em>
            </PageHeroHeader>
            {!loading && !error ? (
              <div className="flex justify-end -mt-2">
                <DashboardRefreshButton
                  loading={refreshing}
                  onClick={() => void refresh(setRefreshing)}
                />
              </div>
            ) : null}
          </div>
        )}

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-9 w-64 shimmer-box rounded-lg" />
            <div className="h-24 shimmer-box rounded-xl" />
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-red-700 bg-red-900/30 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && !activeTab ? (
          <DashboardNavGrid aria-label="Platform admin sections">
            {navTabs.map((tab) => (
              <DashboardNavCard
                key={tab.key}
                title={tab.title}
                description={tab.description}
                cta={tab.cta}
                accent={tab.accent}
                ctaColor={tab.ctaColor}
                badge={tab.badge}
                badgeLabel={tab.badgeLabel}
                onClick={() => {
                  if (tab.href) {
                    navigate(tab.href);
                    return;
                  }
                  setTab(tab.key);
                }}
              />
            ))}
          </DashboardNavGrid>
        ) : null}

        {!loading && !error && activeTab === "stats" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="General users" value={stats.totalUsers} hint="Non-campus emails" />
            <StatCard label="Pending submissions" value={stats.pendingSubmissions} />
            <StatCard label="Approved submissions" value={stats.approvedSubmissions} />
            <StatCard label="Open onboarding" value={stats.onboardingOpen} />
            <StatCard label="Paid orders" value={stats.paidOrders} />
            <StatCard label="Active entitlements" value={stats.activeEntitlements} />
            <StatCard label="AI mock sessions" value={stats.platformMockSessions} />
            <StatCard label="PrepPath plans" value={stats.prepPathPlans} />
          </div>
        ) : null}

        {!loading && !error && activeTab === "visitors" ? <VisitorsPanel /> : null}

        {!loading && !error && activeTab === "submissions" ? (
          <AdminSubmissionsTab
            api={platformAdminAPI}
            pendingCount={stats.pendingSubmissions}
            approvedCount={stats.approvedSubmissions}
            onCountsChanged={() => void refresh(setRefreshing)}
          />
        ) : null}

        {!loading && !error && activeTab === "onboarding" ? (
          <OnboardingInbox />
        ) : null}

        {!loading && !error && activeTab === "billing" ? (
          <BillingPanel />
        ) : null}

        {!loading && !error && activeTab === "campus" ? (
          <CampusDashboardPicker />
        ) : null}

        {!loading && !error && activeTab === "keys" ? <PlatformRuntimeSecretsPanel /> : null}

        {!loading && !error && activeTab === "test-email" ? <TestEmailPanel /> : null}
      </div>
    </div>
  );
}

function visitorName(row) {
  const name = String(row?.username || "").trim();
  if (name) return name;
  const email = String(row?.email || "").trim();
  return email ? email.split("@")[0] : "Visitor";
}

function VisitorsPanel() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await platformAdminAPI.getVisitors({
        params: { page, limit: 50, q: query || undefined },
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total) || 0);
      setTotalPages(Math.max(1, Number(data?.totalPages) || 1));
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load visitors.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(draft.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-theme-primary">Signed-in visitors</h3>
          <p className="mt-1 text-sm text-theme-secondary">
            {total} {total === 1 ? "person" : "people"} signed in on or after 1 October 2026, newest first.
          </p>
        </div>
        <form className="flex gap-2" onSubmit={submitSearch}>
          <input
            className="w-full rounded-xl border border-theme bg-theme-card px-3 py-2 text-sm text-theme-primary sm:w-64"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search visitors"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-theme px-3 py-2 text-sm font-semibold text-theme-primary"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? <p className="text-sm text-theme-secondary">Loading visitors…</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-2xl border border-theme bg-theme-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-theme text-xs uppercase tracking-wide text-theme-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Audience</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-theme-secondary" colSpan={4}>
                    {query ? "No visitors match that search." : "No sign-ins yet."}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-b border-theme/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-theme-primary">{visitorName(row)}</td>
                    <td className="px-4 py-3 text-theme-secondary">{row.email || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-theme-secondary">
                      {formatWhen(row.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-theme-secondary">
                      {row.audience === "campus" ? "Campus" : "General"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && !error && totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-theme-secondary">
          <button
            type="button"
            className="rounded-xl border border-theme px-3 py-2 font-semibold text-theme-primary disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="rounded-xl border border-theme px-3 py-2 font-semibold text-theme-primary disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CampusDashboardPicker() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-theme-primary">Campus admin platforms</h3>
          <p className="mt-1 text-sm text-theme-secondary">
            Choose a college to open its campus admin dashboard.
          </p>
        </div>
        <DashboardNavGrid aria-label="Campus admin platforms">
          {CAMPUS_ADMIN_SITES.map((campus) => (
            <DashboardNavCard
              key={campus.id}
              title={campus.name}
              description={campus.description}
              cta="Open campus admin"
              accent="border-l-slate-500"
              ctaColor="text-slate-500"
              onClick={() => navigate(campus.href)}
            />
          ))}
        </DashboardNavGrid>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-theme-primary">Campus subscribed features</h3>
          <p className="mt-1 text-sm text-theme-secondary">
            Features shown to students on campus login. Changing this list will show the top-up
            again for students who dismissed it.
          </p>
        </div>
        {CAMPUS_ADMIN_SITES.map((campus) => (
          <CampusFeaturesEditor key={campus.id} campus={campus} />
        ))}
      </div>
    </div>
  );
}

function CampusFeaturesEditor({ campus }) {
  const [selected, setSelected] = useState([]);
  const [catalog, setCatalog] = useState(ONBOARDING_FEATURES);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await platformAdminAPI.getCollegeFeatures(campus.id);
      setSelected(Array.isArray(data?.selectedFeatures) ? data.selectedFeatures : []);
      if (Array.isArray(data?.catalog) && data.catalog.length) {
        setCatalog(data.catalog);
      }
      setUpdatedAt(data?.featuresUpdatedAt || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load campus features.");
    } finally {
      setLoading(false);
    }
  }, [campus.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (featureId) => {
    setSelected((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
    setSavedMsg("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const { data } = await platformAdminAPI.putCollegeFeatures(campus.id, {
        collegeName: campus.name,
        selectedFeatures: selected,
      });
      setSelected(Array.isArray(data?.selectedFeatures) ? data.selectedFeatures : selected);
      setUpdatedAt(data?.featuresUpdatedAt || null);
      setSavedMsg("Saved. Students will see this list on campus login.");
    } catch (err) {
      setError(err?.response?.data?.error || "Could not save campus features.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-theme-primary">{campus.name}</h4>
          <p className="text-xs text-theme-secondary mt-0.5">
            {updatedAt
              ? `Last updated ${new Date(updatedAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}`
              : "No features saved yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save features"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-theme-secondary">Loading features…</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {catalog.map((feature) => {
            const checked = selected.includes(feature.id);
            return (
              <label
                key={feature.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  checked
                    ? "border-theme-accent/50 bg-theme-accent/5"
                    : "border-theme bg-theme-hero/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(feature.id)}
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="font-semibold text-theme-primary block">{feature.title}</span>
                  <span className="text-xs text-theme-secondary">{feature.text}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
      {savedMsg ? <p className="text-sm text-theme-accent">{savedMsg}</p> : null}
    </div>
  );
}

function OnboardingInbox() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await platformAdminAPI.getOnboarding({ params: { limit: 50 } });
      setRows(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load onboarding requests.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id, status) => {
    setSavingId(id);
    try {
      await platformAdminAPI.updateOnboarding(id, { status });
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not update status.");
    } finally {
      setSavingId("");
    }
  };

  if (loading) return <p className="text-sm text-theme-secondary">Loading onboarding requests…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!rows.length) {
    return <p className="text-sm text-theme-secondary">No onboarding requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-theme bg-theme-card">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-theme text-xs uppercase tracking-wide text-theme-muted">
          <tr>
            <th className="px-4 py-3">College</th>
            <th className="px-4 py-3">POC</th>
            <th className="px-4 py-3">Path</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row._id)} className="border-b border-theme/60 last:border-0">
              <td className="px-4 py-3 font-medium text-theme-primary">{row.collegeName}</td>
              <td className="px-4 py-3 text-theme-secondary">
                <div>{row.pocName}</div>
                <div className="text-xs">{row.pocEmail}</div>
              </td>
              <td className="px-4 py-3 text-theme-secondary">{row.path}</td>
              <td className="px-4 py-3">
                <ThemedSelect
                  ariaLabel={`Onboarding status for ${row.collegeName}`}
                  value={row.status}
                  disabled={savingId === String(row._id)}
                  onChange={(status) => updateStatus(String(row._id), status)}
                  options={ONBOARDING_STATUSES.map((status) => ({
                    value: status,
                    label: status.replaceAll("_", " "),
                  }))}
                  triggerClassName="min-w-[12rem]"
                />
              </td>
              <td className="px-4 py-3 text-theme-secondary">{formatWhen(row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillingPanel() {
  const [orders, setOrders] = useState([]);
  const [premiumUserCount, setPremiumUserCount] = useState(0);
  const [totalPlansBought, setTotalPlansBought] = useState(0);
  const [totalMoneyPaise, setTotalMoneyPaise] = useState(0);
  const [openUserId, setOpenUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await platformAdminAPI.getBillingOrders({
        params: { view: "users" },
      });
      setOrders(Array.isArray(data?.items) ? data.items : []);
      setPremiumUserCount(Number(data?.premiumUserCount) || 0);
      setTotalPlansBought(Number(data?.totalPlansBought) || 0);
      setTotalMoneyPaise(Number(data?.totalMoneyPaise) || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const users = useMemo(() => groupPaidOrdersByUser(orders), [orders]);

  if (loading) return <p className="text-sm text-theme-secondary">Loading billing…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Premium users" value={premiumUserCount} />
        <StatCard label="Premium plans bought" value={totalPlansBought} />
        <StatCard label="Total money made" value={formatAmount(totalMoneyPaise)} />
      </div>

      <section>
        <h3 className="mb-3 text-base font-semibold text-theme-primary">Paid premium</h3>
        <div className="overflow-x-auto rounded-2xl border border-theme bg-theme-card">
          <table className="min-w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-10" />
              <col className="w-[28%]" />
              <col />
              <col className="w-48" />
              <col className="w-24" />
            </colgroup>
            <thead className="border-b border-theme text-xs uppercase tracking-wide text-theme-muted">
              <tr>
                <th className="pl-4 pr-0 py-3" aria-hidden="true" />
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Premium features unlocked</th>
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-theme-secondary" colSpan={5}>
                    No paid premium users yet.
                  </td>
                </tr>
              ) : (
                users.map((row) => {
                  const open = openUserId === row.id;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-theme/60 last:border-0 cursor-pointer hover:bg-theme-hero/40"
                      onClick={() => setOpenUserId(open ? "" : row.id)}
                      aria-expanded={open}
                    >
                      <td className="pl-4 pr-0 py-3 align-top">
                        <FaChevronDown
                          className={`mt-1 h-3 w-3 shrink-0 text-theme-secondary transition-transform duration-200 ${
                            open ? "text-indigo-500" : "-rotate-90"
                          }`}
                          aria-hidden
                        />
                      </td>
                      <td className="px-4 py-3 align-top font-medium text-theme-primary">
                        <span className="block truncate" title={row.email}>
                          {row.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-theme-secondary">
                        {open ? (
                          <ul className="list-disc space-y-1 pl-4 break-words">
                            {row.features.map((feature) => (
                              <li key={feature.id}>{feature.label}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-theme-muted">
                            {row.features.length}{" "}
                            {row.features.length === 1 ? "feature" : "features"} · click to view
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-theme-secondary">
                        {open ? (
                          <ul className="space-y-1">
                            {row.features.map((feature) => (
                              <li key={feature.id}>{formatWhen(feature.createdAt)}</li>
                            ))}
                          </ul>
                        ) : (
                          formatWhen(row.latestAt)
                        )}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap tabular-nums text-theme-primary">
                        {open ? (
                          <ul className="space-y-1">
                            {row.features.map((feature) => (
                              <li key={feature.id}>
                                {formatAmount(feature.amountPaise, feature.currency)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          formatAmount(row.totalPaise)
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
