import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { adminAPI, eventAPI, getAdminStats } from '../utils/api';
import StudentPlacementStatsTab from './StudentPlacementStatsTab';
import {
  DEFAULT_PLACEMENT_DETAIL_YEAR,
  PLACEMENT_DETAIL_VISIT_YEARS,
} from '../constants/placementYears.js';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaFileAlt, FaBuilding, FaCalendar, FaChartLine, FaInfoCircle, FaChevronDown, FaUserShield, FaUpload, FaFileExcel } from 'react-icons/fa';

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

const AdminDashboard = () => {
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
  const [submissions, setSubmissions] = useState([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState([]);
  const [activeMainTab, setActiveMainTab] = useState('stats'); // 'stats', 'submissions', 'companies', 'events', 'student-placement-stats', 'assign-spc', 'add-next-batch'
  const [submissionsSubTab, setSubmissionsSubTab] = useState('pending'); // 'pending' or 'approved'
  const [companies, setCompanies] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [selectedCompanyYear, setSelectedCompanyYear] = useState('all');
  const [companiesSubTab, setCompaniesSubTab] = useState('pending'); // 'pending' or 'approved'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingIds, setApprovingIds] = useState(new Set());
  const [rejectingIds, setRejectingIds] = useState(new Set());
  const [approvingCompanyIds, setApprovingCompanyIds] = useState(new Set());
  const [rejectingCompanyIds, setRejectingCompanyIds] = useState(new Set());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    url: '',
    lastDateToRegister: '',
  });
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [deletingCompanyIds, setDeletingCompanyIds] = useState(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [approvingAllCompanies, setApprovingAllCompanies] = useState(false);
  const [subPendingMeta, setSubPendingMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [subApprovedMeta, setSubApprovedMeta] = useState({ page: 1, total: 0, totalPages: 1 });
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

  const loadPendingSubmissionsList = useCallback(async (page) => {
    const res = await adminAPI.getSubmissions({ params: { status: 'pending', page, limit: ADMIN_PAGE_SIZE } });
    const d = res.data;
    setSubmissions(d.items || []);
    setSubPendingMeta({
      page: d.page || page,
      total: d.total ?? 0,
      totalPages: Math.max(1, d.totalPages || 1),
    });
  }, []);

  const loadApprovedSubmissionsList = useCallback(async (page) => {
    const res = await adminAPI.getSubmissions({ params: { status: 'approved', page, limit: ADMIN_PAGE_SIZE } });
    const d = res.data;
    setApprovedSubmissions(d.items || []);
    setSubApprovedMeta({
      page: d.page || page,
      total: d.total ?? 0,
      totalPages: Math.max(1, d.totalPages || 1),
    });
  }, []);

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
    if (activeMainTab !== 'submissions') return;
    if (submissionsSubTab !== 'pending') return;
    let cancelled = false;
    (async () => {
      try {
        await loadPendingSubmissionsList(subPendingMeta.page);
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, activeMainTab, submissionsSubTab, subPendingMeta.page, loadPendingSubmissionsList]);

  useEffect(() => {
    if (loading) return;
    if (activeMainTab !== 'submissions') return;
    if (submissionsSubTab !== 'approved') return;
    let cancelled = false;
    (async () => {
      try {
        await loadApprovedSubmissionsList(subApprovedMeta.page);
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, activeMainTab, submissionsSubTab, subApprovedMeta.page, loadApprovedSubmissionsList]);

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

  const parseContent = (contentString) => {
    try {
      return JSON.parse(contentString);
    } catch {
      return { question: contentString, solution: '' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const handleApprove = async (submissionId) => {
    if (!window.confirm('Are you sure you want to approve this submission? This will update the company database.')) {
      return;
    }

    try {
      setApprovingIds(prev => new Set(prev).add(submissionId));
      
      await adminAPI.approveSubmission(submissionId);

      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      await loadPendingSubmissionsList(subPendingMeta.page);
      await loadApprovedSubmissionsList(subApprovedMeta.page);

      alert('Submission approved successfully!');
    } catch (err) {
      console.error('Error approving submission:', err);
      console.error('Error response:', err.response?.data);
      
      // Show detailed error message
      let errorMessage = 'Failed to approve submission. Please try again.';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.details) {
          // If it's a validation error with details
          const details = typeof errorData.details === 'object' 
            ? Object.entries(errorData.details).map(([key, value]) => `${key}: ${value}`).join('\n')
            : errorData.details;
          errorMessage = `Validation Error:\n${details}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }
      alert(errorMessage);
    } finally {
      setApprovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  const handleReject = async (submissionId) => {
    if (!window.confirm('Are you sure you want to reject this submission? This will permanently delete it from the database.')) {
      return;
    }

    try {
      setRejectingIds(prev => new Set(prev).add(submissionId));
      
      await adminAPI.rejectSubmission(submissionId);

      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      await loadPendingSubmissionsList(subPendingMeta.page);

      alert('Submission rejected and deleted successfully!');
    } catch (err) {
      console.error('Error rejecting submission:', err);
      console.error('Error response:', err.response?.data);
      
      // Show detailed error message
      let errorMessage = 'Failed to reject submission. Please try again.';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }
      alert(errorMessage);
    } finally {
      setRejectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
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

  const handleDeleteApprovedSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this approved submission? This will permanently remove it from the database.')) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(submissionId));
      
      await adminAPI.deleteApprovedSubmission(submissionId);

      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      await loadApprovedSubmissionsList(subApprovedMeta.page);

      alert('Approved submission deleted successfully!');
    } catch (err) {
      console.error('Error deleting approved submission:', err);
      alert('Failed to delete approved submission. Please try again.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
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

  const handleViewFullSubmission = async (submission) => {
    if (submission.contentTruncated) {
      try {
        const res = await adminAPI.getSubmission(submission._id);
        setSelectedSubmission(res.data);
      } catch {
        setSelectedSubmission(submission);
      }
    } else {
      setSelectedSubmission(submission);
    }
    setShowSubmissionModal(true);
  };

  const handleApproveAll = async () => {
    if (submissions.length === 0) {
      alert('No pending submissions to approve.');
      return;
    }

    const confirmMessage = `Approve all ${submissions.length} pending submission(s) on this page? (Up to ${ADMIN_BULK_FETCH_LIMIT} total can be loaded for bulk.) This will update the company database.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setApprovingAll(true);
      let bulkList = submissions;
      if (subPendingMeta.total > submissions.length) {
        const bulkRes = await adminAPI.getSubmissions({
          params: { status: 'pending', page: 1, limit: ADMIN_BULK_FETCH_LIMIT },
        });
        bulkList = bulkRes.data.items || [];
      }

      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (const submission of bulkList) {
        try {
          setApprovingIds(prev => new Set(prev).add(submission._id));
          await adminAPI.approveSubmission(submission._id);

          successCount++;
        } catch (err) {
          console.error(`Error approving submission ${submission._id}:`, err);
          failCount++;
          const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
          errors.push(`Submission ${submission.companyId?.name || submission._id}: ${errorMsg}`);
        } finally {
          setApprovingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(submission._id);
            return newSet;
          });
        }
      }

      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      await loadPendingSubmissionsList(subPendingMeta.page);
      await loadApprovedSubmissionsList(subApprovedMeta.page);

      if (failCount === 0) {
        alert(`Successfully approved all ${successCount} submission(s)!`);
      } else {
        const errorSummary = errors.slice(0, 5).join('\n');
        const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more error(s)` : '';
        alert(`Approved ${successCount} submission(s), but ${failCount} failed:\n\n${errorSummary}${moreErrors}`);
      }
    } catch (err) {
      console.error('Error in bulk approval:', err);
      alert('An error occurred during bulk approval. Please try again.');
    } finally {
      setApprovingAll(false);
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

  return (
    <div className="admin-dashboard-theme min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-theme-app text-theme-primary">
      {adminToast?.message && (
        <div
          className={`fixed right-4 top-4 z-[90] rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
            adminToast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {adminToast.message}
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-400">Manage and monitor platform activity</p>
        </div>

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
          <>
            {/* Main Tabs Navigation */}
            <div className="flex gap-2 sm:gap-4 mb-6 flex-wrap overflow-x-auto pb-2">
              <button
                onClick={() => setActiveMainTab('stats')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeMainTab === 'stats'
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FaChartLine />
                Stats
              </button>
              <button
                onClick={() => setActiveMainTab('submissions')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeMainTab === 'submissions'
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FaFileAlt />
                Submissions ({stats.pendingSubmissions ?? 0})
              </button>
              <button
                onClick={() => setActiveMainTab('companies')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeMainTab === 'companies'
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FaBuilding />
                Companies ({stats.pendingCompanies ?? 0})
              </button>
              <button
                onClick={() => setActiveMainTab('events')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeMainTab === 'events'
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FaCalendar />
                Events
              </button>
              <button
                onClick={() => setActiveMainTab('assign-spc')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeMainTab === 'assign-spc'
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FaUserShield />
                Assign SPC
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab('student-placement-stats')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeMainTab === 'student-placement-stats'
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FaBuilding />
                Student Placement Stats
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab('add-next-batch')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeMainTab === 'add-next-batch'
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FaUpload />
                Add next batch
              </button>
            </div>

            {/* Main Content Area */}
            {activeMainTab === 'stats' && (
              <div className="space-y-6">
                <div className="bg-theme-card border border-theme rounded-xl p-5 sm:p-6 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold text-theme-accent">Stats</h2>
                    <p className="mt-1 text-sm text-theme-secondary">
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

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-theme-primary">User Growth (Last 7 Days)</h3>
                      <InfoHint text="New users created each day over the last 7 days." />
                    </div>
                    <div className="mt-4 h-72">
                      {Array.isArray(stats.userGrowth) && stats.userGrowth.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#6366f1"
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-lg border border-theme bg-theme-hero text-sm text-theme-secondary">
                          No growth data available.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-theme-primary">Daily Active Users Trend</h3>
                      <InfoHint text="Tracked active-user counts for each of the last 7 days." />
                    </div>
                    <div className="mt-4 h-72">
                      {Array.isArray(stats.dauTrend) && stats.dauTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.dauTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-lg border border-theme bg-theme-hero text-sm text-theme-secondary">
                          No DAU trend data available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-theme-primary">Daily Submissions vs Acceptances</h3>
                      <InfoHint text="Daily platform submissions and daily approved submissions over the last 7 days." />
                    </div>
                    <div className="mt-4 h-80">
                      {Array.isArray(stats.submissionAcceptanceTrend) && stats.submissionAcceptanceTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.submissionAcceptanceTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="submissions"
                              name="Submissions"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="acceptances"
                              name="Acceptances"
                              stroke="#f59e0b"
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-lg border border-theme bg-theme-hero text-sm text-theme-secondary">
                          No submission trend data available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMainTab === 'student-placement-stats' && (
              <StudentPlacementStatsTab />
            )}

            {activeMainTab === 'assign-spc' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold text-theme-accent">Assign SPC Access</h2>
                    <p className="mt-1 text-sm text-theme-secondary">
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
                <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold text-theme-accent">Add next batch</h2>
                    <p className="mt-1 text-sm text-theme-secondary">
                      Upload an Excel workbook (.xlsx) with a header row. Required columns use common labels such as
                      Name, Email, and USN; optional Phone and Branch. Rows with validation errors block the entire
                      import. Duplicate USN or email in the file or in the database are skipped (first row in the file
                      wins). Inserts run in a single database transaction (all or nothing).
                    </p>
                  </div>

                  <div className="mb-6 overflow-x-auto rounded-lg border border-theme">
                    <table className="min-w-full divide-y divide-theme text-sm">
                      <thead className="bg-theme-hero">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                          <th className="px-4 py-3">Accepted header labels (examples)</th>
                          <th className="px-4 py-3">Stored as</th>
                          <th className="px-4 py-3">Required</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme text-theme-primary">
                        {(studentBatchColumnGuide.length
                          ? studentBatchColumnGuide
                          : [
                              { labels: ['Name'], field: 'name', required: true },
                              { labels: ['Email'], field: 'email', required: true },
                              { labels: ['USN'], field: 'usn', required: true },
                              { labels: ['Phone'], field: 'phoneNumber', required: false },
                              { labels: ['Branch'], field: 'branch', required: false },
                            ]
                        ).map((row) => (
                          <tr key={row.field}>
                            <td className="px-4 py-3 text-theme-secondary">
                              {Array.isArray(row.labels) ? row.labels.join(', ') : row.labels}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">{row.field}</td>
                            <td className="px-4 py-3">{row.required ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <form
                    key={studentBatchFileKey}
                    onSubmit={handleStudentBatchImport}
                    className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
                  >
                    <label className="block min-w-[220px] flex-1">
                      <span className="mb-2 block text-sm font-medium text-theme-primary">Excel file (.xlsx)</span>
                      <div className="mb-2 flex items-center gap-2">
                        <label
                          htmlFor="student-batch-file-input"
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-theme bg-theme-hero px-3 py-2 text-xs font-semibold text-theme-secondary transition hover:bg-theme-nav"
                        >
                          <FaFileExcel className="text-emerald-500" />
                          <span>Choose Excel file</span>
                        </label>
                        {studentBatchSelectedFileName ? (
                          <span className="truncate text-xs text-theme-secondary">
                            {studentBatchSelectedFileName}
                          </span>
                        ) : (
                          <span className="text-xs text-theme-muted">No file selected</span>
                        )}
                      </div>
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
                    <button
                      type="submit"
                      disabled={studentBatchImportLoading}
                      className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {studentBatchImportLoading ? 'Importing…' : 'Upload and import'}
                    </button>
                  </form>
                </div>

                {studentBatchImportResult && (
                  <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-theme-primary">Import result</h3>
                    <p
                      className={`mt-2 text-sm ${
                        studentBatchImportResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
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
                            <thead className="bg-theme-hero sticky top-0">
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
                            <thead className="bg-theme-hero sticky top-0">
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
                          <p className="mt-1 max-h-40 overflow-y-auto font-mono text-xs text-theme-secondary break-all">
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

            {activeMainTab === 'submissions' && (
            <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 className="text-xl font-semibold text-indigo-400">Submissions Management</h2>
                      <p className="text-sm text-slate-400 mt-1">Review and approve user submissions</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                      {submissionsSubTab === 'pending' && submissions.length > 0 && (
                      <button
                        onClick={handleApproveAll}
                        disabled={approvingAll}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          approvingAll
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {approvingAll ? 'Approving All...' : `Approve all on page (${submissions.length})`}
                      </button>
                    )}
                    <div className="flex gap-2 border border-slate-700 rounded-lg p-1 bg-slate-800/60">
                      <button
                          type="button"
                          onClick={() => {
                            setSubmissionsSubTab('pending');
                            setSubPendingMeta((m) => ({ ...m, page: 1 }));
                          }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            submissionsSubTab === 'pending'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Pending ({stats.pendingSubmissions || 0})
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                            setSubmissionsSubTab('approved');
                            setSubApprovedMeta((m) => ({ ...m, page: 1 }));
                          }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            submissionsSubTab === 'approved'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Approved ({stats.approvedSubmissions || 0})
                      </button>
                    </div>
                  </div>
                </div>
              </div>

                {submissionsSubTab === 'pending' ? (
                submissions.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <p className="text-slate-400 text-sm sm:text-base">No pending submissions found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800/60">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Submitted By
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Company
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
                              Content
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                              Submitted At
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-slate-800/40 divide-y divide-slate-700">
                          {submissions.map((submission) => {
                            const content = parseContent(submission.content);
                            return (
                              <tr 
                                key={submission._id} 
                                className="hover:bg-slate-700/50 cursor-pointer"
                                onClick={() => handleViewFullSubmission(submission)}
                              >
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium text-slate-200">
                                      {submission.submittedBy?.name || 'N/A'}
                                      {submission.isAnonymous && (
                                        <span className="ml-2 text-xs text-orange-600 font-normal">(Anonymous)</span>
                                      )}
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[120px] sm:max-w-none">{submission.submittedBy?.email || ''}</p>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <p className="text-xs sm:text-sm text-slate-200">
                                    {submission.companyId?.name || 'N/A'}
                                  </p>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                    {submission.type}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                                  <div className="text-xs sm:text-sm text-slate-300 max-w-md">
                                    {content.question && (
                                      <p className="font-medium mb-1 truncate">Q: {content.question}</p>
                                    )}
                                    {content.solution && (
                                      <p className="text-slate-400 truncate">A: {content.solution}</p>
                                    )}
                                    {!content.question && !content.solution && (
                                      <p className="text-slate-400 truncate">{submission.content}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400 hidden lg:table-cell">
                                  {formatDate(submission.submittedAt)}
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-1 sm:gap-2 flex-col sm:flex-row">
                                    <button
                                      onClick={() => handleApprove(submission._id)}
                                      disabled={approvingIds.has(submission._id) || rejectingIds.has(submission._id)}
                                      className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition w-full sm:w-auto ${
                                        approvingIds.has(submission._id) || rejectingIds.has(submission._id)
                                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                          : 'bg-green-600 text-white hover:bg-green-700'
                                      }`}
                                    >
                                      {approvingIds.has(submission._id) ? 'Approving...' : 'Approve'}
                                    </button>
                                    <button
                                      onClick={() => handleReject(submission._id)}
                                      disabled={approvingIds.has(submission._id) || rejectingIds.has(submission._id)}
                                      className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition w-full sm:w-auto ${
                                        approvingIds.has(submission._id) || rejectingIds.has(submission._id)
                                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                          : 'bg-red-600 text-white hover:bg-red-700'
                                      }`}
                                    >
                                      {rejectingIds.has(submission._id) ? 'Rejecting...' : 'Reject'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {renderAdminPagination(subPendingMeta, (p) =>
                      setSubPendingMeta((m) => ({ ...m, page: p }))
                    )}
                  </div>
                )
              ) : (
                approvedSubmissions.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <p className="text-slate-400 text-sm sm:text-base">No approved submissions found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800/60">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Submitted By
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Company
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                              Content
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                              Submitted At
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                              Approved At
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-slate-800/40 divide-y divide-slate-700">
                          {approvedSubmissions.map((submission) => {
                            const content = parseContent(submission.content);
                            return (
                              <tr 
                                key={submission._id} 
                                className="hover:bg-slate-700/50 cursor-pointer"
                                onClick={() => handleViewFullSubmission(submission)}
                              >
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium text-slate-200">
                                      {submission.submittedBy?.name || 'N/A'}
                                      {submission.isAnonymous && (
                                        <span className="ml-2 text-xs text-orange-400 font-normal">(Anonymous)</span>
                                      )}
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[120px] sm:max-w-none">{submission.submittedBy?.email || ''}</p>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <p className="text-xs sm:text-sm text-slate-200">
                                    {submission.companyId?.name || 'N/A'}
                                  </p>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-600 text-white capitalize">
                                    {submission.type}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                                  <div className="text-xs sm:text-sm text-slate-300 max-w-md">
                                    {content.question && (
                                      <p className="font-medium mb-1 truncate">Q: {content.question}</p>
                                    )}
                                    {content.solution && (
                                      <p className="text-slate-400 truncate">A: {content.solution}</p>
                                    )}
                                    {!content.question && !content.solution && (
                                      <p className="text-slate-400 truncate">{submission.content}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400 hidden lg:table-cell">
                                  {formatDate(submission.submittedAt)}
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400 hidden lg:table-cell">
                                  {submission.approvedAt ? formatDate(submission.approvedAt) : 'N/A'}
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-600 text-white">
                                    Approved
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleDeleteApprovedSubmission(submission._id)}
                                    disabled={deletingIds.has(submission._id)}
                                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition w-full sm:w-auto ${
                                      deletingIds.has(submission._id)
                                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                  >
                                    {deletingIds.has(submission._id) ? 'Deleting...' : 'Delete'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {renderAdminPagination(subApprovedMeta, (p) =>
                      setSubApprovedMeta((m) => ({ ...m, page: p }))
                    )}
                  </div>
                )
              )}
            </div>
            )}

            {activeMainTab === 'companies' && (
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 className="text-xl font-semibold text-indigo-400">Companies Management</h2>
                      <p className="text-sm text-slate-400 mt-1">Review and approve company submissions by placement year</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                      <label className="min-w-[170px] rounded-xl border border-theme bg-theme-card px-3 py-2.5 shadow-sm">
                        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-muted">
                          Placement year
                        </span>
                        <div className="relative">
                          <select
                            value={selectedCompanyYear}
                            onChange={(e) => {
                              const nextYear = e.target.value || 'all';
                              setSelectedCompanyYear(nextYear);
                              setCoPendingMeta((m) => ({ ...m, page: 1 }));
                              setCoApprovedMeta((m) => ({ ...m, page: 1 }));
                            }}
                            className="w-full appearance-none rounded-xl border border-theme-input bg-theme-input px-3 py-2.5 pr-10 text-sm font-medium text-theme-primary shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
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
                      </label>
                      {companiesSubTab === 'pending' && companies.length > 0 && (
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
                    )}
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
                        Pending ({coPendingMeta.total || 0})
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
                        Approved ({coApprovedMeta.total || 0})
                      </button>
                    </div>
                  </div>
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
                                  <p><span className="font-medium">Count:</span> {company.count || 'N/A'}</p>
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
                            
                            {/* Company Details */}
                            <div className="mt-4 space-y-3 text-sm">
                              {company.interviewExperience && company.interviewExperience.length > 0 && (
                                <div>
                                  <p className="font-medium text-slate-300 mb-1">Interview Experience:</p>
                                  <div className="bg-slate-900 rounded p-2 max-h-32 overflow-y-auto">
                                    {company.interviewExperience.map((exp, idx) => (
                                      <p key={idx} className="text-slate-400 mb-1">{exp}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {company.interviewQuestions && company.interviewQuestions.length > 0 && (
                                <div>
                                  <p className="font-medium text-slate-300 mb-1">Interview Questions:</p>
                                  <div className="bg-slate-900 rounded p-2 max-h-32 overflow-y-auto">
                                    {company.interviewQuestions.map((q, idx) => (
                                      <p key={idx} className="text-slate-400 mb-1">{q}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {company.onlineQuestions && company.onlineQuestions.length > 0 && (
                                <div>
                                  <p className="font-medium text-slate-300 mb-1">Online Questions:</p>
                                  <div className="bg-slate-900 rounded p-2 max-h-32 overflow-y-auto">
                                    {company.onlineQuestions.map((q, idx) => (
                                      <p key={idx} className="text-slate-400 mb-1">{q}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {company.Must_Do_Topics && company.Must_Do_Topics.length > 0 && (
                                <div>
                                  <p className="font-medium text-slate-300 mb-1">Must Do Topics:</p>
                                  <div className="bg-slate-900 rounded p-2 max-h-32 overflow-y-auto">
                                    {company.Must_Do_Topics.map((topic, idx) => (
                                      <p key={idx} className="text-slate-400 mb-1">{topic}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
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
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <div>
                    <h2 className="text-xl font-semibold text-indigo-400">Events Management</h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage off-campus placements, hackathons, and other events</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEventForm(!showEventForm);
                      setEditingEvent(null);
                      setEventForm({
                        title: '',
                        url: '',
                        lastDateToRegister: '',
                      });
                    }}
                    className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                  >
                    <FaPlus className="w-4 h-4" />
                    {showEventForm ? 'Cancel' : 'Post an Event'}
                  </button>
                </div>

              {/* Event Form */}
              {showEventForm && (
                <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-700 bg-slate-800/60">
                  <form onSubmit={handleEventSubmit} className="space-y-3 sm:space-y-4">
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
        )}
      </div>

      {/* Full Submission Details Modal */}
      {showSubmissionModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-indigo-400">Full Submission Details</h3>
              <button
                onClick={() => {
                  setShowSubmissionModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Submission Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Submitted By</p>
                  <p className="text-base text-slate-200 mt-1">
                    {selectedSubmission.submittedBy?.name || 'N/A'}
                    {selectedSubmission.isAnonymous && (
                      <span className="ml-2 text-sm text-orange-400">(Anonymous)</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">{selectedSubmission.submittedBy?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Company</p>
                  <p className="text-base text-slate-200 mt-1">{selectedSubmission.companyId?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Type</p>
                  <span className="inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full bg-indigo-600 text-white capitalize">
                    {selectedSubmission.type || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Status</p>
                  <span className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedSubmission.status === 'approved' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {selectedSubmission.status === 'approved' ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Submitted At</p>
                  <p className="text-base text-slate-200 mt-1">{formatDate(selectedSubmission.submittedAt)}</p>
                </div>
                {selectedSubmission.approvedAt && (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Approved At</p>
                    <p className="text-base text-slate-200 mt-1">{formatDate(selectedSubmission.approvedAt)}</p>
                  </div>
                )}
              </div>

              {/* Full Content */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm font-medium text-slate-400 mb-2">Full Submission Content</p>
                <div className="bg-slate-900 rounded-lg p-4">
                  {(() => {
                    const content = parseContent(selectedSubmission.content);
                    if (content.question || content.solution) {
                      return (
                        <div className="space-y-3">
                          {content.question && (
                            <div>
                              <p className="text-sm font-semibold text-slate-300 mb-1">Question:</p>
                              <p className="text-base text-slate-200 whitespace-pre-wrap break-words">{content.question}</p>
                            </div>
                          )}
                          {content.solution && (
                            <div>
                              <p className="text-sm font-semibold text-slate-300 mb-1">Solution:</p>
                              <pre className="text-base text-slate-200 whitespace-pre-wrap break-words font-sans bg-slate-800 p-3 rounded border border-slate-700 overflow-x-auto">
                                {content.solution}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-base text-slate-200 whitespace-pre-wrap break-words">{selectedSubmission.content}</p>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Action Buttons for Pending Submissions */}
              {selectedSubmission.status !== 'approved' && (
                <div className="border-t border-slate-700 pt-4 flex gap-3">
                  <button
                    onClick={async () => {
                      await handleApprove(selectedSubmission._id);
                      setShowSubmissionModal(false);
                      setSelectedSubmission(null);
                    }}
                    disabled={approvingIds.has(selectedSubmission._id) || rejectingIds.has(selectedSubmission._id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      approvingIds.has(selectedSubmission._id) || rejectingIds.has(selectedSubmission._id)
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {approvingIds.has(selectedSubmission._id) ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={async () => {
                      await handleReject(selectedSubmission._id);
                      setShowSubmissionModal(false);
                      setSelectedSubmission(null);
                    }}
                    disabled={approvingIds.has(selectedSubmission._id) || rejectingIds.has(selectedSubmission._id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      approvingIds.has(selectedSubmission._id) || rejectingIds.has(selectedSubmission._id)
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {rejectingIds.has(selectedSubmission._id) ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

