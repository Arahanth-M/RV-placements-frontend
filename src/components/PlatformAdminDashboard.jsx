import { useCallback, useEffect, useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { platformAdminAPI } from "../utils/api";
import { GENERAL_BASE } from "../constants/tenant.js";
import { CAMPUS_ADMIN_SITES } from "../utils/collegeScope.js";
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

const TAB_KEYS = new Set(["stats", "submissions", "onboarding", "billing", "campus"]);
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

const inputClass =
  "w-full rounded-xl border border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary";

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
        key: "companies",
        title: "Company prep content",
        description: "Edit OA, interviews, and experiences on company_platform_content.",
        cta: "Open editor",
        accent: "border-l-emerald-500",
        ctaColor: "text-emerald-600",
        href: `${GENERAL_BASE}/data-entry`,
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
      </div>
    </div>
  );
}

function CampusDashboardPicker() {
  const navigate = useNavigate();

  return (
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
                <select
                  className={inputClass}
                  value={row.status}
                  disabled={savingId === String(row._id)}
                  onChange={(event) => updateStatus(String(row._id), event.target.value)}
                >
                  {ONBOARDING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
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
