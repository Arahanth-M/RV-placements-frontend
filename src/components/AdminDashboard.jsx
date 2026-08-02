import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { adminAPI, eventAPI, getAdminStats } from '../utils/api';
import StudentPlacementStatsTab from './StudentPlacementStatsTab';
import PlacementHubSettingsTab from './PlacementHubSettingsTab';
import StudentRequestsTab from './StudentRequestsTab';
import AdminGeneralStatsUpload from './AdminGeneralStatsUpload';
import AdminSubmissionsTab from './AdminSubmissionsTab';
import AdminUsageAnalyticsTab from './AdminUsageAnalyticsTab';
import DashboardNavCard, { DashboardNavGrid } from './DashboardNavCard.jsx';
import DashboardRefreshButton from './DashboardRefreshButton.jsx';
import { PageBackButton, PageBackNavRow, PageHeroFontStyles, PageHeroHeader, pageShellInnerClass, pageShellOuterClassCompact } from './PageBackNav.jsx';
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
} from '../constants/placementYears.js';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaBuilding, FaCalendar, FaChartLine, FaInfoCircle, FaChevronDown, FaUserShield, FaUpload, FaFileExcel, FaInbox } from 'react-icons/fa';

const ADMIN_MISCELLANEOUS_TAB = 'miscellaneous';

const ADMIN_HUB_TAB_KEYS = new Set([
  'stats',
  'events',
  'companies',
  'student-placement-stats',
  ADMIN_MISCELLANEOUS_TAB,
]);

const ADMIN_MISC_TAB_KEYS = new Set([
  'assign-spc',
  'general-stats-upload',
  'student-requests',
  'submissions',
  'add-next-batch',
  'placement-settings',
  'usage-analytics',
]);

const ADMIN_HUB_POLL_MS = 60_000;

function buildAdminMiscNavTabs(stats) {
  return [
    {
      key: 'assign-spc',
      title: 'Assign SPC',
      description: 'Assign or remove SPC roles for placement coordinators.',
      cta: 'Assign SPC',
      accent: 'border-l-indigo-500',
      ctaColor: 'text-indigo-500',
    },
    {
      key: 'general-stats-upload',
      title: 'Update the placement General stats',
      description: 'Upload and manage general placement statistics files.',
      cta: 'Update stats',
      accent: 'border-l-violet-500',
      ctaColor: 'text-violet-500',
    },
    {
      key: 'student-requests',
      title: 'Student requests',
      description: 'Review student-submitted requests and support tickets.',
      cta: 'View requests',
      accent: 'border-l-amber-500',
      ctaColor: 'text-amber-600',
    },
    {
      key: 'submissions',
      title: 'Submissions Management',
      description: 'Review and approve user company contribution submissions.',
      cta: 'Manage submissions',
      accent: 'border-l-rose-500',
      ctaColor: 'text-rose-500',
      badge: stats.pendingSubmissions ?? 0,
      badgeLabel: 'pending',
    },
    {
      key: 'add-next-batch',
      title: 'Add next batch',
      description: 'Import the next student batch from an Excel file.',
      cta: 'Import batch',
      accent: 'border-l-emerald-500',
      ctaColor: 'text-emerald-600',
    },
    {
      key: 'placement-settings',
      title: 'Dream thresholds',
      description: 'Configure dream company CTC thresholds by branch.',
      cta: 'Edit thresholds',
      accent: 'border-l-violet-500',
      ctaColor: 'text-violet-500',
    },
    {
      key: 'usage-analytics',
      title: 'AI & PrepPath usage',
      description:
        'Day-wise AI mock interviews and PrepPath plans generated (with company breakdown).',
      cta: 'View usage',
      accent: 'border-l-cyan-500',
      ctaColor: 'text-cyan-600',
    },
  ];
}

function buildAdminPrimaryNavTabs(stats) {
  return [
    {
      key: 'stats',
      title: 'Stats of the platform',
      description: 'Platform growth, usage, and the most demanded company data.',
      cta: 'View stats',
      accent: 'border-l-violet-500',
      ctaColor: 'text-violet-500',
    },
    {
      key: 'events',
      title: 'Upload an event/Announcement',
      description: 'Create and manage placement events shown to students.',
      cta: 'Manage events',
      accent: 'border-l-sky-500',
      ctaColor: 'text-sky-600',
    },
    {
      key: 'companies',
      title: 'Approve/Reject a company',
      description: 'Approve new companies and manage approved company records.',
      cta: 'Manage companies',
      accent: 'border-l-emerald-500',
      ctaColor: 'text-emerald-600',
      badge: stats.pendingCompanies ?? 0,
      badgeLabel: 'companies pending',
    },
    {
      key: 'student-placement-stats',
      title: 'Student Placement Stats',
      description: 'Browse placed students and run custom placement searches.',
      cta: 'View placement stats',
      accent: 'border-l-violet-500',
      ctaColor: 'text-violet-500',
    },
    {
      key: ADMIN_MISCELLANEOUS_TAB,
      title: 'Miscellaneous Features',
      description: 'SPC tools, batch import, general stats, and other admin utilities.',
      cta: 'View features',
      accent: 'border-l-amber-500',
      ctaColor: 'text-amber-600',
      badge: stats.pendingSubmissions ?? 0,
      badgeLabel: 'submissions pending',
    },
  ];
}

const ADMIN_PAGE_SIZE = 25;
const ADMIN_BULK_FETCH_LIMIT = 5000;
const ADMIN_COMPANY_YEARS = [
  { value: 'all', label: 'All years' },
  ...PLACEMENT_DETAIL_VISIT_YEARS.map((y) => ({
    value: String(y),
    label: String(y),
  })),
];

const InfoHint = ({ text }) => (
  <span className="group relative inline-flex items-center">
    <span
      className="inline-flex h-4 w-4 cursor-help items-center justify-center text-theme-muted transition-colors hover:text-theme-accent"
      aria-label={text}
      title={text}
    >
      <FaInfoCircle className="h-3.5 w-3.5" />
    </span>
    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-theme bg-theme-card px-3 py-2 text-center text-xs font-medium text-theme-secondary shadow-xl group-hover:block">
      {text}
    </span>
  </span>
);

const ADMIN_CHART_MARGIN = { top: 8, right: 12, left: -12, bottom: 0 };
const ADMIN_AXIS_TICK = { fill: 'var(--chart-axis-tick)', fontSize: 11 };
const ADMIN_AXIS_LINE = { stroke: 'var(--chart-axis-line)' };

function formatAdminChartDate(value) {
  if (!value) return '';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function sumChartValues(data, key = 'count') {
  if (!Array.isArray(data)) return 0;
  return data.reduce((sum, row) => sum + (Number(row?.[key]) || 0), 0);
}

function latestChartValue(data, key = 'count') {
  if (!Array.isArray(data) || data.length === 0) return 0;
  return Number(data[data.length - 1]?.[key]) || 0;
}

function AdminChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-theme-primary">{formatAdminChartDate(label)}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <p key={String(entry.dataKey)} className="flex items-center justify-between gap-4 text-theme-secondary">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name || entry.dataKey}
            </span>
            <span className="font-semibold tabular-nums text-theme-primary">{entry.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function AdminChartKpi({ label, value }) {
  return (
    <div className="min-w-[5.5rem] shrink-0 rounded-lg border border-theme bg-theme-hero px-3 py-2 text-right">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-theme-primary">{value}</p>
    </div>
  );
}

function AdminChartHeader({ eyebrow, title, hint, subtitle, accentClass, children }) {
  return (
    <div className="flex flex-col gap-3 border-b border-theme/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted">{eyebrow}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`h-5 w-1 shrink-0 rounded-full ${accentClass}`} aria-hidden />
          <h3 className="text-base font-semibold text-theme-primary">{title}</h3>
          <InfoHint text={hint} />
        </div>
        {subtitle ? (
          <p className="mt-1 pl-3 text-xs leading-relaxed text-theme-secondary">{subtitle}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-row flex-nowrap items-stretch gap-2">{children}</div>
      ) : null}
    </div>
  );
}

function AdminChartEmpty({ message }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-theme bg-theme-hero px-4 text-center">
      <FaChartLine className="mb-2 h-7 w-7 text-theme-muted opacity-40" aria-hidden />
      <p className="text-sm text-theme-secondary">{message}</p>
    </div>
  );
}

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({
    totalUsers: 0,
    dau: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    dailySubmissions: 0,
    approvedSubmissions: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    topSubmittedCompanies: [],
    mostViewedCompanies: [],
    mostHelpfulCompanies: [],
    userGrowth: [],
    dauTrend: [],
    submissionAcceptanceTrend: [],
  });
  const [companies, setCompanies] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [activeMainTab, setActiveMainTab] = useState(null);
  const [selectedCompanyYear, setSelectedCompanyYear] = useState('all');
  const [companiesSubTab, setCompaniesSubTab] = useState('pending'); // 'pending' or 'approved'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingCompanyIds, setApprovingCompanyIds] = useState(new Set());
  const [rejectingCompanyIds, setRejectingCompanyIds] = useState(new Set());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    type: '',
    organizer: '',
    title: '',
    url: '',
    lastDateToRegister: '',
  });
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [deletingCompanyIds, setDeletingCompanyIds] = useState(new Set());
  const [approvingAllCompanies, setApprovingAllCompanies] = useState(false);
  const [coPendingMeta, setCoPendingMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [coApprovedMeta, setCoApprovedMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [adminToast, setAdminToast] = useState(null);
  const [spcForm, setSpcForm] = useState({ email: '', usn: '' });
  const [assigningSpc, setAssigningSpc] = useState(false);
  const [spcUsers, setSpcUsers] = useState([]);
  const [spcUsersLoading, setSpcUsersLoading] = useState(false);
  const [spcUsersLoaded, setSpcUsersLoaded] = useState(false);
  const [revokingSpcIds, setRevokingSpcIds] = useState(new Set());
  const [studentBatchColumnGuide, setStudentBatchColumnGuide] = useState([]);
  const [studentBatchImportLoading, setStudentBatchImportLoading] = useState(false);
  const [studentBatchImportResult, setStudentBatchImportResult] = useState(null);
  const [studentBatchFileKey, setStudentBatchFileKey] = useState(0);
  const [studentBatchSelectedFileName, setStudentBatchSelectedFileName] = useState('');
  const [hubRefreshing, setHubRefreshing] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [companiesRefreshing, setCompaniesRefreshing] = useState(false);

  const navigateAdminTab = useCallback(
    (tabKey) => {
      if (tabKey == null) {
        setActiveMainTab(null);
        setSearchParams({}, { replace: true });
        return;
      }
      if (ADMIN_HUB_TAB_KEYS.has(tabKey)) {
        setActiveMainTab(tabKey);
        setSearchParams({ tab: tabKey }, { replace: true });
        return;
      }
      if (ADMIN_MISC_TAB_KEYS.has(tabKey)) {
        setActiveMainTab(tabKey);
        if (searchParams.get('tab') !== ADMIN_MISCELLANEOUS_TAB) {
          setSearchParams({ tab: ADMIN_MISCELLANEOUS_TAB }, { replace: true });
        }
      }
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) {
      setActiveMainTab(null);
      return;
    }
    if (!ADMIN_HUB_TAB_KEYS.has(tab)) return;
    setActiveMainTab((prev) => {
      if (tab === ADMIN_MISCELLANEOUS_TAB && ADMIN_MISC_TAB_KEYS.has(prev)) {
        return prev;
      }
      return tab;
    });
  }, [searchParams]);

  // Tab / hub swaps often keep the same pathname, so App ScrollToTop does not run.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [activeMainTab]);

  const companyYearLabel = selectedCompanyYear === 'all' ? 'all years' : selectedCompanyYear;
  const resolveCompanyActionYear = (placementYear) => {
    if (placementYear != null && placementYear !== '') return String(placementYear);
    if (selectedCompanyYear !== 'all') return String(selectedCompanyYear);
    return String(DEFAULT_PLACEMENT_DETAIL_YEAR);
  };
  const getCompanyActionKey = (companyId, placementYear, companyVisitId) =>
    `${companyId}:${resolveCompanyActionYear(placementYear)}:${companyVisitId ?? ''}`;

  const loadPendingCompaniesList = useCallback(async (page) => {
    const res = await adminAPI.getCompanies({
      params: { status: 'pending', year: selectedCompanyYear, page, limit: ADMIN_PAGE_SIZE },
    });
    const d = res.data;
    setCompanies(d.items || []);
    setCoPendingMeta({
      page: d.page || page,
      total: d.total ?? 0,
      totalPages: Math.max(1, d.totalPages || 1),
    });
  }, [selectedCompanyYear]);

  const loadApprovedCompaniesList = useCallback(async (page) => {
    const res = await adminAPI.getCompanies({
      params: { status: 'approved', year: selectedCompanyYear, page, limit: ADMIN_PAGE_SIZE },
    });
    const d = res.data;
    setApprovedCompanies(d.items || []);
    setCoApprovedMeta({
      page: d.page || page,
      total: d.total ?? 0,
      totalPages: Math.max(1, d.totalPages || 1),
    });
  }, [selectedCompanyYear]);

  const refreshAdminStats = useCallback(async () => {
    const statsRes = await getAdminStats();
    setStats(statsRes.data);
  }, []);

  const refreshCompaniesView = useCallback(async () => {
    await refreshAdminStats();
    if (companiesSubTab === 'pending') {
      await loadPendingCompaniesList(coPendingMeta.page);
    } else {
      await loadApprovedCompaniesList(coApprovedMeta.page);
    }
  }, [
    refreshAdminStats,
    companiesSubTab,
    coPendingMeta.page,
    coApprovedMeta.page,
    loadPendingCompaniesList,
    loadApprovedCompaniesList,
  ]);

  const runRefresh = useCallback(async (runner, setRefreshingFlag) => {
    try {
      setRefreshingFlag(true);
      await runner();
    } catch (err) {
      console.error('Dashboard refresh failed:', err);
      setAdminToast({ type: 'error', message: 'Failed to refresh. Please try again.' });
    } finally {
      setRefreshingFlag(false);
    }
  }, []);

  useEffect(() => {
    if (!adminToast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setAdminToast(null);
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [adminToast]);

  const loadSpcUsers = useCallback(async () => {
    setSpcUsersLoading(true);
    try {
      const response = await adminAPI.getSpcs();
      setSpcUsers(Array.isArray(response.data?.items) ? response.data.items : []);
      setSpcUsersLoaded(true);
    } finally {
      setSpcUsersLoading(false);
    }
  }, []);

  const handleAssignSpc = async (event) => {
    event.preventDefault();
    const email = String(spcForm.email || '').trim().toLowerCase();
    const usn = String(spcForm.usn || '').trim().toUpperCase();

    if (!email || !usn) {
      setAdminToast({ type: 'error', message: 'Email and USN are required to assign SPC access.' });
      return;
    }

    try {
      setAssigningSpc(true);
      await adminAPI.assignSpc({ email, usn });
      setSpcForm({ email: '', usn: '' });
      setAdminToast({ type: 'success', message: `SPC role assigned successfully for ${email}.` });
      await loadSpcUsers();
    } catch (assignError) {
      const errorMessage =
        assignError?.response?.data?.error ||
        assignError?.response?.data?.message ||
        'Failed to assign SPC role.';
      setAdminToast({ type: 'error', message: errorMessage });
    } finally {
      setAssigningSpc(false);
    }
  };

  const handleRevokeSpc = async (spcUser) => {
    if (!window.confirm(`Revoke SPC access for ${spcUser?.email || 'this user'}?`)) {
      return;
    }

    try {
      setRevokingSpcIds((prev) => new Set(prev).add(String(spcUser._id)));
      await adminAPI.revokeSpc(spcUser._id);
      setSpcUsers((prev) => prev.filter((item) => item._id !== spcUser._id));
      setAdminToast({
        type: 'success',
        message: `SPC access revoked successfully for ${spcUser?.email || 'user'}.`,
      });
    } catch (revokeError) {
      const errorMessage =
        revokeError?.response?.data?.error ||
        revokeError?.response?.data?.message ||
        'Failed to revoke SPC access.';
      setAdminToast({ type: 'error', message: errorMessage });
    } finally {
      setRevokingSpcIds((prev) => {
        const next = new Set(prev);
        next.delete(String(spcUser._id));
        return next;
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const statsRes = await getAdminStats();
        setStats(statsRes.data);
      } catch (err) {
        console.error('Error loading admin stats:', err);
        setError('Failed to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (activeMainTab === 'stats') {
      void refreshAdminStats().catch((err) => {
        console.error('Failed to refresh stats on section open:', err);
      });
    }
  }, [activeMainTab, loading, refreshAdminStats]);

  useEffect(() => {
    if (loading || activeMainTab != null) return undefined;
    const intervalId = window.setInterval(() => {
      void refreshAdminStats().catch((err) => {
        console.error('Hub stats poll failed:', err);
      });
    }, ADMIN_HUB_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [loading, activeMainTab, refreshAdminStats]);

  useEffect(() => {
    if (loading) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (activeMainTab == null) {
        void refreshAdminStats().catch((err) => {
          console.error('Hub visibility refresh failed:', err);
        });
        return;
      }
      if (activeMainTab === 'stats') {
        void refreshAdminStats().catch((err) => {
          console.error('Stats visibility refresh failed:', err);
        });
        return;
      }
      if (activeMainTab === 'companies') {
        void refreshCompaniesView().catch((err) => {
          console.error('Companies visibility refresh failed:', err);
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [loading, activeMainTab, refreshAdminStats, refreshCompaniesView]);

  useEffect(() => {
    if (loading) return;
    if (activeMainTab !== 'companies') return;
    if (companiesSubTab !== 'pending') return;
    let cancelled = false;
    (async () => {
      try {
        await loadPendingCompaniesList(coPendingMeta.page);
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, activeMainTab, companiesSubTab, coPendingMeta.page, loadPendingCompaniesList]);

  useEffect(() => {
    if (loading) return;
    if (activeMainTab !== 'companies') return;
    if (companiesSubTab !== 'approved') return;
    let cancelled = false;
    (async () => {
      try {
        await loadApprovedCompaniesList(coApprovedMeta.page);
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, activeMainTab, companiesSubTab, coApprovedMeta.page, loadApprovedCompaniesList]);

  useEffect(() => {
    if (loading) return;
    if (activeMainTab !== 'events') return;
    if (eventsLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await eventAPI.getAllEvents();
        if (!cancelled) setEvents(res.data || []);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setEventsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, activeMainTab, eventsLoaded]);

  useEffect(() => {
    if (loading) return;
    if (activeMainTab !== 'assign-spc') return;
    if (spcUsersLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        await loadSpcUsers();
      } catch (e) {
        if (!cancelled) {
          const errorMessage =
            e?.response?.data?.error ||
            e?.response?.data?.message ||
            'Failed to load SPC users.';
          setAdminToast({ type: 'error', message: errorMessage });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, activeMainTab, spcUsersLoaded, loadSpcUsers]);

  useEffect(() => {
    if (loading) return;
    if (activeMainTab !== 'add-next-batch') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await adminAPI.getStudentBatchColumnGuide();
        if (!cancelled) {
          setStudentBatchColumnGuide(Array.isArray(res.data?.columns) ? res.data.columns : []);
        }
      } catch (e) {
        if (!cancelled) {
          setStudentBatchColumnGuide([]);
          setAdminToast({
            type: 'error',
            message:
              e?.response?.data?.error ||
              e?.response?.data?.message ||
              'Could not load the student column guide.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, activeMainTab]);

  const handleStudentBatchImport = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.querySelector('input[type="file"]');
    const file = input?.files?.[0];
    if (!file) {
      setAdminToast({ type: 'error', message: 'Choose an .xlsx file first.' });
      return;
    }
    setStudentBatchImportLoading(true);
    setStudentBatchImportResult(null);
    try {
      const res = await adminAPI.importStudentsBatch(file);
      setStudentBatchImportResult(res.data);
      if (res.data?.success) {
        setAdminToast({ type: 'success', message: res.data.message || 'Import finished.' });
        setStudentBatchFileKey((k) => k + 1);
        setStudentBatchSelectedFileName('');
      } else {
        setAdminToast({
          type: 'error',
          message: res.data?.message || res.data?.error || 'Import was rejected.',
        });
      }
    } catch (err) {
      const body = err?.response?.data;
      setStudentBatchImportResult(
        body && typeof body === 'object' ? body : { success: false, message: err?.message || 'Request failed.' }
      );
      setAdminToast({
        type: 'error',
        message: body?.message || body?.error || 'Import request failed.',
      });
    } finally {
      setStudentBatchImportLoading(false);
    }
  };

  const renderStatsList = (title, description, items, valueKey, valueLabel) => (
    <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
        <InfoHint text={description} />
      </div>
      {Array.isArray(items) && items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={`${title}-${item._id || item.name}`}
              className="flex items-center justify-between rounded-lg border border-theme bg-theme-hero px-4 py-3"
            >
              <span className="text-sm font-medium text-theme-primary">{item.name || 'N/A'}</span>
              <span className="text-sm text-theme-secondary">
                {valueLabel}: {item?.[valueKey] ?? 0}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-theme bg-theme-hero px-4 py-6 text-center text-sm text-theme-secondary">
          No data available.
        </div>
      )}
    </div>
  );

  const renderAdminPagination = (meta, setPage) => {
    if (meta.total <= 0) return null;
    const from = (meta.page - 1) * ADMIN_PAGE_SIZE + 1;
    const to = Math.min(meta.page * ADMIN_PAGE_SIZE, meta.total);
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-700 bg-slate-800/40">
        <p className="text-xs text-slate-400">
          {from}–{to} of {meta.total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => setPage(meta.page - 1)}
            className="px-3 py-1.5 text-xs rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-slate-300 tabular-nums">
            Page {meta.page} / {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage(meta.page + 1)}
            className="px-3 py-1.5 text-xs rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const handleApproveCompany = async (companyId, placementYear, companyVisitId) => {
    const companyYear = resolveCompanyActionYear(placementYear);
    const actionKey = getCompanyActionKey(companyId, placementYear, companyVisitId);
    if (!window.confirm(`Are you sure you want to approve this company for ${companyYear}? It will be visible to all users for that placement year.`)) {
      return;
    }

    try {
      setApprovingCompanyIds(prev => new Set(prev).add(actionKey));
      
      const response = await adminAPI.approveCompany(companyId, {
        year: companyYear,
        ...(companyVisitId ? { companyVisitId } : {}),
      });
      const alreadyApproved = response?.data?.alreadyApproved === true;

      try {
        const statsResponse = await adminAPI.getStats();
        setStats(statsResponse.data);
        await loadPendingCompaniesList(coPendingMeta.page);
        await loadApprovedCompaniesList(coApprovedMeta.page);
      } catch (refreshErr) {
        console.error('Company approval refresh failed:', refreshErr);
        alert(
          alreadyApproved
            ? 'Company was already approved. The dashboard refresh failed, so please reload once.'
            : 'Company approved successfully, but the dashboard refresh failed. Please reload once.'
        );
        return;
      }

      alert(
        alreadyApproved
          ? `Company was already approved for ${companyYear}.`
          : `Company approved successfully for ${companyYear}!`
      );
    } catch (err) {
      console.error('Error approving company:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to approve company. Please try again.';
      alert(errorMessage);
    } finally {
      setApprovingCompanyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleRejectCompany = async (companyId, placementYear, companyVisitId) => {
    const companyYear = resolveCompanyActionYear(placementYear);
    const actionKey = getCompanyActionKey(companyId, placementYear, companyVisitId);
    if (!window.confirm(`Are you sure you want to reject this company for ${companyYear}? This removes only the selected year's company visit.`)) {
      return;
    }

    try {
      setRejectingCompanyIds(prev => new Set(prev).add(actionKey));
      
      await adminAPI.rejectCompany(companyId, {
        year: companyYear,
        ...(companyVisitId ? { companyVisitId } : {}),
      });

      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      await loadPendingCompaniesList(coPendingMeta.page);

      alert(`Company visit rejected successfully for ${companyYear}!`);
    } catch (err) {
      console.error('Error rejecting company:', err);
      alert('Failed to reject company. Please try again.');
    } finally {
      setRejectingCompanyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleDeleteApprovedCompany = async (companyId, placementYear, companyVisitId) => {
    const companyYear = resolveCompanyActionYear(placementYear);
    const actionKey = getCompanyActionKey(companyId, placementYear, companyVisitId);
    if (!window.confirm(`Are you sure you want to delete this approved company for ${companyYear}? This removes only the selected year's company visit.`)) {
      return;
    }

    try {
      setDeletingCompanyIds(prev => new Set(prev).add(actionKey));
      
      await adminAPI.deleteApprovedCompany(companyId, {
        year: companyYear,
        ...(companyVisitId ? { companyVisitId } : {}),
      });

      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      await loadApprovedCompaniesList(coApprovedMeta.page);

      alert(`Approved company visit deleted successfully for ${companyYear}!`);
    } catch (err) {
      console.error('Error deleting approved company:', err);
      alert('Failed to delete approved company. Please try again.');
    } finally {
      setDeletingCompanyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleApproveAllCompanies = async () => {
    if (companies.length === 0) {
      alert('No pending companies to approve.');
      return;
    }

    const confirmMessage = `Approve all ${companies.length} pending company/companies for ${companyYearLabel} on this page? (Loads up to ${ADMIN_BULK_FETCH_LIMIT} if more exist.) They will be visible to all users for the matching placement year on each row.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setApprovingAllCompanies(true);
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      let bulkCompanies = companies;
      if (coPendingMeta.total > companies.length) {
        const bulkRes = await adminAPI.getCompanies({
          params: { status: 'pending', year: selectedCompanyYear, page: 1, limit: ADMIN_BULK_FETCH_LIMIT },
        });
        bulkCompanies = bulkRes.data.items || [];
      }

      for (const company of bulkCompanies) {
        const actionKey = getCompanyActionKey(
          company._id,
          company.placementYear,
          company.companyVisitId
        );
        try {
          setApprovingCompanyIds(prev => new Set(prev).add(actionKey));
          await adminAPI.approveCompany(company._id, {
            year: resolveCompanyActionYear(company.placementYear),
            ...(company.companyVisitId ? { companyVisitId: company.companyVisitId } : {}),
          });

          successCount++;
        } catch (err) {
          console.error(`Error approving company ${company._id}:`, err);
          failCount++;
          const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
          errors.push(`Company ${company.name || company._id}: ${errorMsg}`);
        } finally {
          setApprovingCompanyIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(actionKey);
            return newSet;
          });
        }
      }

      try {
        const statsResponse = await adminAPI.getStats();
        setStats(statsResponse.data);
        await loadPendingCompaniesList(coPendingMeta.page);
        await loadApprovedCompaniesList(coApprovedMeta.page);
      } catch (refreshErr) {
        console.error('Bulk company approval refresh failed:', refreshErr);
        alert('Companies were processed, but the dashboard refresh failed. Please reload once.');
        return;
      }

      if (failCount === 0) {
        alert(`Successfully approved all ${successCount} company/companies for ${companyYearLabel}! They are now visible to all users.`);
      } else {
        const errorSummary = errors.slice(0, 5).join('\n');
        const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more error(s)` : '';
        alert(`Approved ${successCount} company/companies, but ${failCount} failed:\n\n${errorSummary}${moreErrors}`);
      }
    } catch (err) {
      console.error('Error in bulk company approval:', err);
      alert('An error occurred during bulk approval. Please try again.');
    } finally {
      setApprovingAllCompanies(false);
    }
  };

  // Event Management Functions
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEvent) {
        await eventAPI.updateEvent(editingEvent._id, eventForm);
        alert('Event updated successfully!');
      } else {
        await eventAPI.createEvent(eventForm);
        alert('Event created successfully!');
      }
      
      // Reset form
      setEventForm({
        type: '',
        organizer: '',
        title: '',
        url: '',
        lastDateToRegister: '',
      });
      setShowEventForm(false);
      setEditingEvent(null);
      
      // Refresh events
      const eventsResponse = await eventAPI.getAllEvents();
      setEvents(eventsResponse.data || []);
    } catch (err) {
      console.error('Error saving event:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to save event. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      type: event.type || '',
      organizer: event.organizer || '',
      title: event.title,
      url: event.url,
      lastDateToRegister: new Date(event.lastDateToRegister).toISOString().split('T')[0],
    });
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(eventId));
      await eventAPI.deleteEvent(eventId);
      
      // Remove from list
      setEvents(prev => prev.filter(event => event._id !== eventId));
      alert('Event deleted successfully!');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const adminPrimaryNavTabs = useMemo(
    () => buildAdminPrimaryNavTabs(stats),
    [stats.pendingCompanies, stats.pendingSubmissions]
  );

  const adminMiscNavTabs = useMemo(
    () => buildAdminMiscNavTabs(stats),
    [stats.pendingSubmissions]
  );

  const handleAdminBack = () => {
    if (ADMIN_MISC_TAB_KEYS.has(activeMainTab)) {
      navigateAdminTab(ADMIN_MISCELLANEOUS_TAB);
      return;
    }
    navigateAdminTab(null);
    void refreshAdminStats().catch((err) => {
      console.error('Failed to refresh hub stats on back:', err);
    });
  };

  const adminBackLabel = ADMIN_MISC_TAB_KEYS.has(activeMainTab)
    ? 'Back to Miscellaneous Features'
    : 'Back to Admin Dashboard';

  return (
    <div className={`admin-dashboard-theme min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      {adminToast?.message && (
        <div
          className={`fixed right-4 top-4 z-[90] rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
            adminToast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {adminToast.message}
        </div>
      )}
      <div className={pageShellInnerClass}>
        {!loading && !error && activeMainTab != null ? (
          <PageBackNavRow>
            <PageBackButton onClick={handleAdminBack} label={adminBackLabel} />
          </PageBackNavRow>
        ) : null}

        {/* Header — hub only (tab views keep Back at the top like Resources) */}
        {activeMainTab == null ? (
          <div className="mb-6">
            <PageHeroHeader
              subtitle="Manage and monitor platform activity"
              subtitleClassName="text-slate-400"
            >
              Admin <em style={{ color: '#818CF8', fontStyle: 'italic' }}>Dashboard</em>
            </PageHeroHeader>
            {!loading && !error ? (
              <div className="flex justify-end -mt-2">
                <DashboardRefreshButton
                  loading={hubRefreshing}
                  onClick={() => runRefresh(refreshAdminStats, setHubRefreshing)}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6" aria-live="polite" aria-busy="true">
            <div className="space-y-2">
              <div className="h-9 w-64 shimmer-box rounded-lg"></div>
              <div className="h-5 w-80 max-w-full shimmer-box rounded-md"></div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <div className="h-6 w-52 shimmer-box rounded"></div>
              </div>
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={`row-skeleton-${idx}`} className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 h-4 shimmer-box rounded"></div>
                    <div className="col-span-2 h-4 shimmer-box rounded"></div>
                    <div className="col-span-2 h-4 shimmer-box rounded"></div>
                    <div className="col-span-3 h-4 shimmer-box rounded hidden md:block"></div>
                    <div className="col-span-2 h-4 shimmer-box rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 mb-8">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {!loading && !error && (
          activeMainTab == null ? (
            <DashboardNavGrid className="mb-6" aria-label="Admin dashboard sections">
              {adminPrimaryNavTabs.map((tab) => (
                <DashboardNavCard
                  key={tab.key}
                  title={tab.title}
                  description={tab.description}
                  cta={tab.cta}
                  accent={tab.accent}
                  ctaColor={tab.ctaColor}
                  badge={tab.badge}
                  badgeLabel={tab.badgeLabel}
                  onClick={() => navigateAdminTab(tab.key)}
                />
              ))}
            </DashboardNavGrid>
          ) : activeMainTab === ADMIN_MISCELLANEOUS_TAB ? (
            <>
              <div className="mb-5 text-center">
                <h2 className="text-2xl font-semibold text-theme-accent">Miscellaneous Features</h2>
                <p className="mx-auto mt-1 max-w-xl text-sm text-theme-secondary">
                  Additional admin tools grouped in one place.
                </p>
              </div>

              <DashboardNavGrid className="mb-6" aria-label="Miscellaneous admin features">
                {adminMiscNavTabs.map((tab) => (
                  <DashboardNavCard
                    key={tab.key}
                    title={tab.title}
                    description={tab.description}
                    cta={tab.cta}
                    accent={tab.accent}
                    ctaColor={tab.ctaColor}
                    badge={tab.badge}
                    badgeLabel={tab.badgeLabel}
                    onClick={() => navigateAdminTab(tab.key)}
                  />
                ))}
              </DashboardNavGrid>
            </>
          ) : (
            <>
            {/* Main Content Area */}
            {activeMainTab === 'stats' && (
              <div className="space-y-6">
                <div className="bg-theme-card border border-theme rounded-xl p-5 sm:p-6 shadow-sm">
                  <div className="mb-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <div aria-hidden="true" />
                      <h2 className="text-center text-2xl font-semibold text-theme-accent">
                        Stats of the platform
                      </h2>
                      <div className="justify-self-end">
                        <DashboardRefreshButton
                          loading={statsRefreshing}
                          onClick={() => runRefresh(refreshAdminStats, setStatsRefreshing)}
                        />
                      </div>
                    </div>
                    <p className="mx-auto mt-1 max-w-2xl text-center text-sm text-theme-secondary">
                      Platform growth, usage, and the most demanded company data in one place.
                    </p>
                  </div>

                  {loading ? (
                    <div className="rounded-lg border border-theme bg-theme-hero p-8 text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-theme border-t-theme-accent"></div>
                      <p className="mt-4 text-sm text-theme-secondary">Loading stats...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {[
                        {
                          label: 'Total Users',
                          value: stats.totalUsers ?? 0,
                          description: 'All user accounts currently stored on the platform.',
                        },
                        {
                          label: 'Pending Submissions',
                          value: stats.pendingSubmissions ?? 0,
                          description: 'User submissions still waiting for admin review and action.',
                        },
                        {
                          label: 'Approved Submissions',
                          value: stats.approvedSubmissions ?? 0,
                          description: 'Experience submissions that have been approved.',
                        },
                        {
                          label: 'Pending Companies',
                          value: stats.pendingCompanies ?? 0,
                          description:
                            'Company placement listings awaiting admin approval for the configured placement year.',
                        },
                        {
                          label: 'Total Companies',
                          value: stats.totalCompanies ?? 0,
                          description: 'All companies currently present in the main company collection.',
                        },
                        {
                          label: 'Daily Active Users',
                          value: stats.dau ?? 0,
                          description: 'Users with tracked activity today, based on lastActiveAt.',
                        },
                        {
                          label: 'Daily Submissions',
                          value: stats.dailySubmissions ?? 0,
                          description: 'All submissions created by users today across every company.',
                        },
                      ].map((card) => (
                        <div
                          key={card.label}
                          className="rounded-xl border border-theme bg-theme-hero p-4 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-theme-secondary">{card.label}</p>
                            <InfoHint text={card.description} />
                          </div>
                          <p className="mt-2 text-2xl font-bold text-theme-primary">{card.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  {renderStatsList(
                    'Top Submitted Companies',
                    'Companies with the highest number of user submissions overall.',
                    stats.topSubmittedCompanies,
                    'submissionCount',
                    'Submissions'
                  )}
                  {renderStatsList(
                    'Most Viewed Companies',
                    'Company profiles with the highest number of detail-page views.',
                    stats.mostViewedCompanies,
                    'views',
                    'Views'
                  )}
                  {renderStatsList(
                    'Most Helpful Companies',
                    'Companies that received the most helpful/upvote interactions from users.',
                    stats.mostHelpfulCompanies,
                    'helpfulCount',
                    'Helpful'
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-0.5">
                    <span className="h-5 w-1 rounded-full bg-theme-accent" aria-hidden />
                    <div>
                      <h3 className="text-lg font-semibold text-theme-primary">Platform trends</h3>
                      <p className="text-xs text-theme-secondary">Rolling seven-day activity across users, engagement, and submissions.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-xl border border-theme bg-theme-card p-5 shadow-sm sm:p-6">
                      <AdminChartHeader
                        eyebrow="Growth"
                        title="User Growth (Last 7 Days)"
                        hint="New users created each day over the last 7 days."
                        subtitle="Daily new sign-ups across the platform."
                        accentClass="bg-indigo-500"
                      >
                        <AdminChartKpi label="7-day total" value={sumChartValues(stats.userGrowth)} />
                        <AdminChartKpi label="Latest day" value={latestChartValue(stats.userGrowth)} />
                      </AdminChartHeader>
                      <div className="mt-4 h-64 min-w-0">
                        {Array.isArray(stats.userGrowth) && stats.userGrowth.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.userGrowth} margin={ADMIN_CHART_MARGIN}>
                              <defs>
                                <linearGradient id="adminGradUserGrowth" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.22} />
                                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                              <XAxis
                                dataKey="date"
                                tick={ADMIN_AXIS_TICK}
                                tickLine={ADMIN_AXIS_LINE}
                                axisLine={ADMIN_AXIS_LINE}
                                tickFormatter={formatAdminChartDate}
                                interval="preserveStartEnd"
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={ADMIN_AXIS_TICK}
                                tickLine={false}
                                axisLine={false}
                                width={36}
                              />
                              <Tooltip content={<AdminChartTooltip />} cursor={{ stroke: 'var(--chart-grid)', strokeWidth: 1 }} />
                              <Area
                                type="monotone"
                                dataKey="count"
                                name="New users"
                                stroke="var(--accent)"
                                strokeWidth={1.5}
                                fill="url(#adminGradUserGrowth)"
                                dot={false}
                                activeDot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                name="New users"
                                stroke="var(--accent)"
                                strokeWidth={3}
                                dot={{ r: 3.5, fill: 'var(--bg-card)', strokeWidth: 2, stroke: 'var(--accent)' }}
                                activeDot={{ r: 5.5, fill: 'var(--accent-secondary)', strokeWidth: 2, stroke: 'var(--bg-card)' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <AdminChartEmpty message="No growth data available for the last 7 days." />
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-theme bg-theme-card p-5 shadow-sm sm:p-6">
                      <AdminChartHeader
                        eyebrow="Engagement"
                        title="Daily Active Users Trend"
                        hint="Tracked active-user counts for each of the last 7 days."
                        subtitle="Users with recorded activity on each calendar day."
                        accentClass="bg-emerald-500"
                      >
                        <AdminChartKpi label="7-day total" value={sumChartValues(stats.dauTrend)} />
                        <AdminChartKpi label="Latest day" value={latestChartValue(stats.dauTrend)} />
                      </AdminChartHeader>
                      <div className="mt-4 h-64 min-w-0">
                        {Array.isArray(stats.dauTrend) && stats.dauTrend.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.dauTrend} margin={ADMIN_CHART_MARGIN}>
                              <defs>
                                <linearGradient id="adminGradDau" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                              <XAxis
                                dataKey="date"
                                tick={ADMIN_AXIS_TICK}
                                tickLine={ADMIN_AXIS_LINE}
                                axisLine={ADMIN_AXIS_LINE}
                                tickFormatter={formatAdminChartDate}
                                interval="preserveStartEnd"
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={ADMIN_AXIS_TICK}
                                tickLine={false}
                                axisLine={false}
                                width={36}
                              />
                              <Tooltip content={<AdminChartTooltip />} cursor={{ stroke: 'var(--chart-grid)', strokeWidth: 1 }} />
                              <Area
                                type="monotone"
                                dataKey="count"
                                name="Active users"
                                stroke="var(--green)"
                                strokeWidth={1.5}
                                fill="url(#adminGradDau)"
                                dot={false}
                                activeDot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                name="Active users"
                                stroke="var(--green)"
                                strokeWidth={3}
                                dot={{ r: 3.5, fill: 'var(--bg-card)', strokeWidth: 2, stroke: 'var(--green)' }}
                                activeDot={{ r: 5.5, fill: '#34d399', strokeWidth: 2, stroke: 'var(--bg-card)' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <AdminChartEmpty message="No daily active user data available for the last 7 days." />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-theme bg-theme-card p-5 shadow-sm sm:p-6">
                    <AdminChartHeader
                      eyebrow="Activity"
                      title="Daily Submissions vs Acceptances"
                      hint="Daily platform submissions and daily approved submissions over the last 7 days."
                      subtitle="Compare incoming submissions with approvals processed each day."
                      accentClass="bg-violet-500"
                    >
                      <AdminChartKpi label="Submissions" value={sumChartValues(stats.submissionAcceptanceTrend, 'submissions')} />
                      <AdminChartKpi label="Acceptances" value={sumChartValues(stats.submissionAcceptanceTrend, 'acceptances')} />
                    </AdminChartHeader>

                    <div className="mt-3 flex flex-wrap gap-4 border-b border-theme/40 pb-3">
                      <span className="inline-flex items-center gap-2 text-xs text-theme-secondary">
                        <span className="inline-block h-0.5 w-5 rounded-full bg-violet-500" />
                        Submissions
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs text-theme-secondary">
                        <span
                          className="inline-block h-0.5 w-5"
                          style={{
                            background:
                              'repeating-linear-gradient(90deg, var(--warning) 0, var(--warning) 4px, transparent 4px, transparent 7px)',
                          }}
                        />
                        Acceptances
                      </span>
                    </div>

                    <div className="mt-4 h-72 min-w-0">
                      {Array.isArray(stats.submissionAcceptanceTrend) && stats.submissionAcceptanceTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.submissionAcceptanceTrend} margin={ADMIN_CHART_MARGIN}>
                            <defs>
                              <linearGradient id="adminGradSubmissions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                            <XAxis
                              dataKey="date"
                              tick={ADMIN_AXIS_TICK}
                              tickLine={ADMIN_AXIS_LINE}
                              axisLine={ADMIN_AXIS_LINE}
                              tickFormatter={formatAdminChartDate}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={ADMIN_AXIS_TICK}
                              tickLine={false}
                              axisLine={false}
                              width={36}
                            />
                            <Tooltip content={<AdminChartTooltip />} cursor={{ stroke: 'var(--chart-grid)', strokeWidth: 1 }} />
                            <Area
                              type="monotone"
                              dataKey="submissions"
                              name="Submissions"
                              stroke="#8b5cf6"
                              strokeWidth={1.5}
                              fill="url(#adminGradSubmissions)"
                              dot={false}
                              activeDot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="submissions"
                              name="Submissions"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              dot={{ r: 3.5, fill: 'var(--bg-card)', strokeWidth: 2, stroke: '#8b5cf6' }}
                              activeDot={{ r: 5.5, fill: '#a78bfa', strokeWidth: 2, stroke: 'var(--bg-card)' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="acceptances"
                              name="Acceptances"
                              stroke="var(--warning)"
                              strokeWidth={2.5}
                              strokeDasharray="6 4"
                              dot={{ r: 3.5, fill: 'var(--warning)', strokeWidth: 2, stroke: 'var(--bg-card)' }}
                              activeDot={{ r: 5.5, fill: '#fbbf24', strokeWidth: 2, stroke: 'var(--bg-card)' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <AdminChartEmpty message="No submission trend data available for the last 7 days." />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMainTab === 'student-placement-stats' && (
              <StudentPlacementStatsTab />
            )}

            {activeMainTab === 'student-requests' && (
              <StudentRequestsTab />
            )}

            {activeMainTab === 'submissions' && (
              <AdminSubmissionsTab
                pendingCount={stats.pendingSubmissions ?? 0}
                approvedCount={stats.approvedSubmissions ?? 0}
                onCountsChanged={refreshAdminStats}
              />
            )}

            {activeMainTab === 'assign-spc' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
                  <div className="mb-5 text-center">
                    <h2 className="text-2xl font-semibold text-theme-accent">Assign SPC Access</h2>
                    <p className="mx-auto mt-1 max-w-2xl text-sm text-theme-secondary">
                      Assign SPC access by validating the student email ID and USN, then manage all current SPC users from the same place.
                    </p>
                  </div>

                  <form onSubmit={handleAssignSpc} className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-theme-primary">Student Email ID</span>
                      <input
                        type="email"
                        value={spcForm.email}
                        onChange={(event) =>
                          setSpcForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        placeholder="student@rvce.edu.in"
                        className="w-full rounded-lg border border-theme bg-theme-hero px-4 py-3 text-sm text-theme-primary outline-none focus:border-theme-accent"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-theme-primary">USN</span>
                      <input
                        type="text"
                        value={spcForm.usn}
                        onChange={(event) =>
                          setSpcForm((prev) => ({ ...prev, usn: event.target.value.toUpperCase() }))
                        }
                        placeholder="1RV22CS001"
                        className="w-full rounded-lg border border-theme bg-theme-hero px-4 py-3 text-sm text-theme-primary outline-none focus:border-theme-accent"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={assigningSpc}
                      className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {assigningSpc ? 'Assigning...' : 'Assign SPC'}
                    </button>
                  </form>
                </div>

                <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-theme-primary">Assigned SPC Users</h3>
                      <p className="mt-1 text-sm text-theme-secondary">
                        Review all current SPC users and revoke access when needed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadSpcUsers}
                      disabled={spcUsersLoading}
                      className="rounded-lg border border-theme px-4 py-2 text-sm font-medium text-theme-primary transition hover:bg-theme-nav disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {spcUsersLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>

                  {spcUsersLoading && !spcUsersLoaded ? (
                    <div className="rounded-lg border border-theme bg-theme-hero p-8 text-center text-sm text-theme-secondary">
                      Loading SPC users...
                    </div>
                  ) : spcUsers.length === 0 ? (
                    <div className="rounded-lg border border-theme bg-theme-hero p-8 text-center text-sm text-theme-secondary">
                      No SPC users assigned yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-theme">
                        <thead>
                          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Assigned Role</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                          {spcUsers.map((spcUser) => (
                            <tr key={spcUser._id} className="text-sm text-theme-primary">
                              <td className="px-4 py-3">{spcUser.username || '-'}</td>
                              <td className="px-4 py-3">{spcUser.email || '-'}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex rounded-full bg-indigo-600/15 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                                  {spcUser.role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {spcUser.createdAt ? new Date(spcUser.createdAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRevokeSpc(spcUser)}
                                  disabled={revokingSpcIds.has(String(spcUser._id))}
                                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {revokingSpcIds.has(String(spcUser._id)) ? 'Revoking...' : 'Revoke Access'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

       
            {activeMainTab === 'add-next-batch' && (
  <div className="space-y-6">
    <div className="rounded-xl border border-theme bg-theme-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 text-center">
        {/* <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-theme-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Batch import
        </p> */}
        <h2 className="text-2xl font-semibold text-theme-accent">Add next batch</h2>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-theme-secondary">
          Upload an Excel sheet (.xlsx) with a header row. Required columns use common labels such as Name, Email, and USN.
        </p>
      </div>

      <form
        key={studentBatchFileKey}
        onSubmit={handleStudentBatchImport}
        className="flex flex-col gap-5"
      >
        {/* Drop zone */}
        <label
          htmlFor="student-batch-file-input"
          className={`group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors
            ${studentBatchSelectedFileName
              ? 'border-indigo-400 dark:border-indigo-500'
              : 'border-theme hover:border-indigo-400 hover:bg-indigo-50 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20'
            }`}
        >
          {studentBatchSelectedFileName ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <p className="text-sm font-semibold text-indigo-400 dark:text-indigo-400">
                  {studentBatchSelectedFileName}
                </p>
                <p className="mt-0.5 text-xs text-theme-secondary">Ready to import · click to replace</p>
              </div>
            </>
          ) : (
            <>
            
              {/* Empty state */}
              <div className="flex h-12 w-12 items-center justify-center">
                <FaFileExcel className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-theme-primary">Drop your Excel file here</p>
                <p className="mt-0.5 text-xs text-theme-secondary">Supports .xlsx files with a header row</p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-theme bg-theme-card px-4 py-1.5 text-xs font-semibold text-theme-secondary transition hover:bg-theme-hero">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Choose file
              </span>
            </>
          )}
          <input
            id="student-batch-file-input"
            type="file"
            name="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setStudentBatchSelectedFileName(file?.name || '');
            }}
            className="hidden"
          />
        </label>

        {/* Expected columns table */}
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-theme-secondary">
            Expected columns
          </p>
          <div className="overflow-x-auto rounded-xl border border-theme">
            <table className="min-w-full divide-y divide-theme text-sm">
              <thead className="bg-theme-hero">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                  <th className="px-4 py-3">Accepted header labels</th>
                  <th className="px-4 py-3">Stored as</th>
                  <th className="px-4 py-3 text-center">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-theme-primary">
                {(studentBatchColumnGuide.length
                  ? studentBatchColumnGuide
                  : [
                      { labels: ['Name'], field: 'name', required: true },
                      { labels: ['Email', 'Email ID'], field: 'email', required: true },
                      { labels: ['USN'], field: 'usn', required: true },
                    ]
                ).map((row) => (
                  <tr key={row.field}>
                    <td className="px-4 py-3 text-theme-secondary">
                      {Array.isArray(row.labels) ? row.labels.join(', ') : row.labels}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-theme-hero px-2 py-0.5 font-mono text-xs text-theme-secondary">
                        {row.field}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.required ? (
                        <span className="rounded-md bg-theme-hero px-2 py-0.5 font-mono text-xs text-theme-secondary">
                          {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> */}
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-theme-muted">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-theme pt-4">
          <p className="flex items-center gap-1.5 text-xs text-theme-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Column names are case-insensitive
          </p>
          <button
            type="submit"
            disabled={studentBatchImportLoading || !studentBatchSelectedFileName}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            {studentBatchImportLoading ? 'Importing…' : 'Upload and import'}
          </button>
        </div>
      </form>
    </div>

    {/* Import result section — unchanged */}
    {studentBatchImportResult && (
      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-theme-primary">Import result</h3>
        <p
          className={`mt-2 text-sm ${
            studentBatchImportResult.success
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {studentBatchImportResult.message ||
            studentBatchImportResult.error ||
            (studentBatchImportResult.success ? 'Completed.' : 'Import did not complete.')}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-theme bg-theme-hero px-4 py-3">
            <p className="text-xs font-semibold uppercase text-theme-secondary">Inserted</p>
            <p className="mt-1 text-2xl font-bold text-theme-primary">
              {studentBatchImportResult.inserted ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-hero px-4 py-3">
            <p className="text-xs font-semibold uppercase text-theme-secondary">Skipped</p>
            <p className="mt-1 text-2xl font-bold text-theme-primary">
              {studentBatchImportResult.skippedCount ??
                (Array.isArray(studentBatchImportResult.skipped)
                  ? studentBatchImportResult.skipped.length
                  : 0)}
            </p>
          </div>
          <div className="rounded-lg border border-theme bg-theme-hero px-4 py-3">
            <p className="text-xs font-semibold uppercase text-theme-secondary">Failed (validation)</p>
            <p className="mt-1 text-2xl font-bold text-theme-primary">
              {studentBatchImportResult.failedCount ??
                (Array.isArray(studentBatchImportResult.failed)
                  ? studentBatchImportResult.failed.length
                  : 0)}
            </p>
          </div>
        </div>

        {Array.isArray(studentBatchImportResult.failed) && studentBatchImportResult.failed.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-theme-primary">Failed rows</h4>
            <p className="mt-1 text-xs text-theme-secondary">
              Each sheet row number matches Excel (row 1 is the header; the first data row is 2). Fix these
              cells and upload again — nothing was saved for this attempt.
            </p>
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-theme">
              <table className="min-w-full divide-y divide-theme text-sm">
                <thead className="sticky top-0 bg-theme-hero">
                  <tr className="text-left text-xs font-semibold uppercase text-theme-secondary">
                    <th className="px-3 py-2">Sheet row</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {studentBatchImportResult.failed.map((f, idx) => (
                    <tr key={`${f.excelRow}-${idx}`}>
                      <td className="px-3 py-2 font-mono text-theme-primary">{f.excelRow}</td>
                      <td className="px-3 py-2 text-theme-secondary">{f.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {Array.isArray(studentBatchImportResult.skipped) && studentBatchImportResult.skipped.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-theme-primary">Skipped rows</h4>
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-theme">
              <table className="min-w-full divide-y divide-theme text-sm">
                <thead className="sticky top-0 bg-theme-hero">
                  <tr className="text-left text-xs font-semibold uppercase text-theme-secondary">
                    <th className="px-3 py-2">Sheet row</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {studentBatchImportResult.skipped.map((s, idx) => (
                    <tr key={`${s.excelRow}-${idx}`}>
                      <td className="px-3 py-2 font-mono text-theme-primary">{s.excelRow}</td>
                      <td className="px-3 py-2 text-theme-secondary">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {studentBatchImportResult.success &&
          Array.isArray(studentBatchImportResult.insertedExcelRows) &&
          studentBatchImportResult.insertedExcelRows.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-theme-primary">Inserted sheet rows</h4>
              <p className="mt-1 max-h-40 overflow-y-auto break-all font-mono text-xs text-theme-secondary">
                {(() => {
                  const rows = studentBatchImportResult.insertedExcelRows;
                  const cap = 200;
                  const head = rows.slice(0, cap);
                  const more = rows.length - head.length;
                  return more > 0
                    ? `${head.join(', ')} …and ${more} more row number(s).`
                    : head.join(', ');
                })()}
              </p>
            </div>
          )}
      </div>
    )}
  </div>
)}

            {activeMainTab === 'placement-settings' && (
              <PlacementHubSettingsTab
                onToast={(message) => setAdminToast({ type: 'success', message })}
              />
            )}

            {activeMainTab === 'usage-analytics' && <AdminUsageAnalyticsTab />}

            {activeMainTab === 'general-stats-upload' && <AdminGeneralStatsUpload />}

            {activeMainTab === 'companies' && (
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <div className="mb-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="relative min-w-[140px] justify-self-start">
                      <select
                        value={selectedCompanyYear}
                        onChange={(e) => {
                          const nextYear = e.target.value || 'all';
                          setSelectedCompanyYear(nextYear);
                          setCoPendingMeta((m) => ({ ...m, page: 1 }));
                          setCoApprovedMeta((m) => ({ ...m, page: 1 }));
                        }}
                        className="h-[38px] w-full appearance-none rounded-lg border border-theme-input bg-theme-input px-3 pr-9 text-sm font-medium text-theme-primary shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
                        aria-label="Placement year"
                      >
                        {ADMIN_COMPANY_YEARS.map((year) => (
                          <option key={year.value} value={year.value}>
                            {year.label}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-theme-muted">
                        <FaChevronDown className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <h2 className="text-center text-2xl font-semibold text-indigo-400">
                      Approve/Reject a company
                    </h2>
                    <div className="justify-self-end">
                      <DashboardRefreshButton
                        loading={companiesRefreshing}
                        onClick={() => runRefresh(refreshCompaniesView, setCompaniesRefreshing)}
                      />
                    </div>
                  </div>
                  <p className="mx-auto mt-1 max-w-2xl text-center text-sm text-slate-400">
                    Review and approve company submissions by placement year
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2 border border-slate-700 rounded-lg p-1 bg-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        setCompaniesSubTab('pending');
                        setCoPendingMeta((m) => ({ ...m, page: 1 }));
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        companiesSubTab === 'pending'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCompaniesSubTab('approved');
                        setCoApprovedMeta((m) => ({ ...m, page: 1 }));
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        companiesSubTab === 'approved'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Approved
                    </button>
                  </div>
                  {companiesSubTab === 'pending' && companies.length > 0 ? (
                    <button
                      onClick={handleApproveAllCompanies}
                      disabled={approvingAllCompanies}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                        approvingAllCompanies
                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {approvingAllCompanies ? 'Approving All...' : `Approve all on page (${companies.length})`}
                    </button>
                  ) : (
                    <div aria-hidden="true" />
                  )}
                </div>
              </div>

                {companiesSubTab === 'pending' ? (
                companies.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <p className="text-slate-400 text-sm sm:text-base">No pending companies found for {companyYearLabel}.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="p-4 sm:p-6 space-y-4">
                        {companies.map((company) => (
                          <div
                            key={`${company._id}-${company.placementYear || 'na'}-${company.companyVisitId || ''}`}
                            className="border border-slate-700 rounded-lg p-4 sm:p-6 bg-slate-800/60 hover:bg-slate-800"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-200 mb-2">{company.name}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-400">
                                  <p><span className="font-medium">Year:</span> {company.placementYear || 'N/A'}</p>
                                  <p><span className="font-medium">Type:</span> {company.type || 'N/A'}</p>
                                  {company.submittedBy && (
                                    <>
                                      <p><span className="font-medium">Submitted By:</span> {company.submittedBy.name || 'N/A'}</p>
                                      <p><span className="font-medium">Email:</span> {company.submittedBy.email || 'N/A'}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                              {(() => {
                                const companyActionKey = getCompanyActionKey(
                                  company._id,
                                  company.placementYear,
                                  company.companyVisitId
                                );
                                return (
                              <div className="flex items-center gap-2 flex-col sm:flex-row w-full sm:w-auto">
                                <button
                                  onClick={() =>
                                    handleApproveCompany(
                                      company._id,
                                      company.placementYear,
                                      company.companyVisitId
                                    )
                                  }
                                  disabled={approvingCompanyIds.has(companyActionKey) || rejectingCompanyIds.has(companyActionKey)}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                                    approvingCompanyIds.has(companyActionKey) || rejectingCompanyIds.has(companyActionKey)
                                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                      : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                >
                                  {approvingCompanyIds.has(companyActionKey) ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() =>
                                    handleRejectCompany(
                                      company._id,
                                      company.placementYear,
                                      company.companyVisitId
                                    )
                                  }
                                  disabled={approvingCompanyIds.has(companyActionKey) || rejectingCompanyIds.has(companyActionKey)}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                                    approvingCompanyIds.has(companyActionKey) || rejectingCompanyIds.has(companyActionKey)
                                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                      : 'bg-red-600 text-white hover:bg-red-700'
                                  }`}
                                >
                                  {rejectingCompanyIds.has(companyActionKey) ? 'Rejecting...' : 'Reject'}
                                </button>
                              </div>
                                );
                              })()}
                            </div>

                            {/* <p className="mt-4 rounded-lg border border-slate-600/80 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
                              OA questions, interview Q&amp;A, interview process, must-do topics, and internship write-ups
                              are reviewed under{" "}
                              <span className="font-medium text-slate-300">Submissions</span>, not on this card.
                            </p> */}
                          </div>
                        ))}
                      </div>
                      {renderAdminPagination(coPendingMeta, (p) =>
                        setCoPendingMeta((m) => ({ ...m, page: p }))
                      )}
                    </div>
                  </div>
                )
              ) : (
                approvedCompanies.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <p className="text-slate-400 text-sm sm:text-base">No approved companies found for {companyYearLabel}.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {approvedCompanies.map((company) => (
                            <div
                              key={`${company._id}-${company.placementYear || 'na'}-${company.companyVisitId || ''}`}
                              className="border border-slate-700 rounded-lg p-4 bg-slate-800/60"
                            >
                              {(() => {
                                const companyActionKey = getCompanyActionKey(
                                  company._id,
                                  company.placementYear,
                                  company.companyVisitId
                                );
                                return (
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="flex-1">
                                    <h3 className="text-base sm:text-lg font-semibold text-slate-200">{company.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">Year: {company.placementYear || 'N/A'}</p>
                                  </div>
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-600 text-white">
                                    Approved
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleDeleteApprovedCompany(
                                      company._id,
                                      company.placementYear,
                                      company.companyVisitId
                                    )
                                  }
                                  disabled={deletingCompanyIds.has(companyActionKey)}
                                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                                    deletingCompanyIds.has(companyActionKey)
                                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                      : 'bg-red-600 text-white hover:bg-red-700'
                                  }`}
                                >
                                  {deletingCompanyIds.has(companyActionKey) ? 'Deleting...' : <FaTrash />}
                                </button>
                              </div>
                                );
                              })()}
                            </div>
                          ))}
                        </div>
                      </div>
                      {renderAdminPagination(coApprovedMeta, (p) =>
                        setCoApprovedMeta((m) => ({ ...m, page: p }))
                      )}
                    </div>
                  </div>
                )
                )}
              </div>
            )}

            {activeMainTab === 'events' && (
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-4">
                    <div className="min-w-0 text-center sm:pl-16">
                      <h2 className="text-2xl font-semibold text-indigo-400">Upload an event/Announcement</h2>
                      <p className="mt-1 text-xs sm:text-sm text-slate-400">
                        Manage off-campus placements, hackathons, and other events
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEventForm(!showEventForm);
                        setEditingEvent(null);
                        setEventForm({
                          type: '',
                          organizer: '',
                          title: '',
                          url: '',
                          lastDateToRegister: '',
                        });
                      }}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <FaPlus className="h-3.5 w-3.5" />
                      {showEventForm ? 'Cancel' : 'Post an Event'}
                    </button>
                  </div>
                </div>

              {/* Event Form */}
              {showEventForm && (
                <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-700 bg-slate-800/60">
                  <form onSubmit={handleEventSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Type
                        </label>
                        <select
                          value={eventForm.type}
                          onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                        >
                          <option value="">Select type</option>
                          <option value="hackathon">Hackathon</option>
                          <option value="workshop">Workshop</option>
                          <option value="competition">Competition</option>
                          <option value="preplacement talk">Preplacement talk</option>
                          <option value="placement">Placement</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Organizer
                        </label>
                        <input
                          type="text"
                          value={eventForm.organizer}
                          onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                          placeholder="Company / Community / Platform"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                        placeholder="Event title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Registration URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={eventForm.url}
                        onChange={(e) => setEventForm({ ...eventForm, url: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-900 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                        placeholder="https://example.com/register"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Last Date to Register *
                      </label>
                      <input
                        type="date"
                        required
                        value={eventForm.lastDateToRegister}
                        onChange={(e) => setEventForm({ ...eventForm, lastDateToRegister: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEventForm(false);
                          setEditingEvent(null);
                          setEventForm({
                            type: '',
                            organizer: '',
                            title: '',
                            url: '',
                            lastDateToRegister: '',
                          });
                        }}
                        className="px-4 py-2 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-700 text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm sm:text-base"
                      >
                        {editingEvent ? 'Update Event' : 'Create Event'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Events List */}
              {events.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <FaCalendarAlt className="mx-auto text-slate-500 text-3xl sm:text-4xl mb-4" />
                  <p className="text-slate-400 text-sm sm:text-base">No events found. Create your first event!</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-slate-700">
                      <thead className="bg-slate-800/60">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Date
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            URL
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-slate-800/40 divide-y divide-slate-700">
                        {events.map((event) => {
                          const isPastDeadline = new Date(event.lastDateToRegister) < new Date();
                          return (
                            <tr key={event._id} className={`hover:bg-slate-700/50 ${isPastDeadline ? 'opacity-60' : ''}`}>
                              <td className="px-3 sm:px-6 py-4">
                                <p className="text-xs sm:text-sm font-medium text-slate-200">{event.title}</p>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-xs sm:text-sm text-slate-200">
                                  {formatEventDate(event.lastDateToRegister)}
                                </div>
                                {isPastDeadline && (
                                  <span className="text-xs text-red-400">Past Deadline</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                                <a
                                  href={event.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs sm:text-sm"
                                >
                                  <FaExternalLinkAlt className="w-3 h-3" />
                                  View Link
                                </a>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 sm:gap-2 flex-col sm:flex-row">
                                  <button
                                    onClick={() => handleEditEvent(event)}
                                    className="px-2 sm:px-3 py-1 bg-indigo-600 text-white rounded-md text-xs sm:text-sm hover:bg-indigo-700 flex items-center gap-1 w-full sm:w-auto justify-center"
                                  >
                                    <FaEdit className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event._id)}
                                    disabled={deletingIds.has(event._id)}
                                    className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1 w-full sm:w-auto justify-center ${
                                      deletingIds.has(event._id)
                                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                  >
                                    <FaTrash className="w-3 h-3" />
                                    {deletingIds.has(event._id) ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </div>
            )}
            </>
          )
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;

