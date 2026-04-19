import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { adminAPI, eventAPI, getAdminStats } from '../utils/api';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaFileAlt, FaBuilding, FaCalendar, FaChartLine, FaInfoCircle } from 'react-icons/fa';

const ADMIN_PAGE_SIZE = 25;
const ADMIN_BULK_FETCH_LIMIT = 5000;

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
    missingCompaniesCount: 0,
    topMissingCompanies: [],
    topSubmittedCompanies: [],
    mostViewedCompanies: [],
    mostHelpfulCompanies: [],
    userGrowth: [],
    dauTrend: [],
    submissionAcceptanceTrend: [],
  });
  const [submissions, setSubmissions] = useState([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState([]);
  const [activeMainTab, setActiveMainTab] = useState('submissions'); // 'stats', 'submissions', 'companies', 'missing-companies', 'events'
  const [submissionsSubTab, setSubmissionsSubTab] = useState('pending'); // 'pending' or 'approved'
  const [companies, setCompanies] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
  const [missingCompanies, setMissingCompanies] = useState([]);
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
  const [updatingMissingCompanyIds, setUpdatingMissingCompanyIds] = useState(new Set());
  const [deletingMissingCompanyIds, setDeletingMissingCompanyIds] = useState(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [approvingAllCompanies, setApprovingAllCompanies] = useState(false);
  const [subPendingMeta, setSubPendingMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [subApprovedMeta, setSubApprovedMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [coPendingMeta, setCoPendingMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [coApprovedMeta, setCoApprovedMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [missingCompaniesLoaded, setMissingCompaniesLoaded] = useState(false);
  const [missingCompaniesLoading, setMissingCompaniesLoading] = useState(false);
  const [adminToast, setAdminToast] = useState(null);

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

  const loadPendingCompaniesList = useCallback(async (page) => {
    const res = await adminAPI.getCompanies({ params: { status: 'pending', page, limit: ADMIN_PAGE_SIZE } });
    const d = res.data;
    setCompanies(d.items || []);
    setCoPendingMeta({
      page: d.page || page,
      total: d.total ?? 0,
      totalPages: Math.max(1, d.totalPages || 1),
    });
  }, []);

  const loadApprovedCompaniesList = useCallback(async (page) => {
    const res = await adminAPI.getCompanies({ params: { status: 'approved', page, limit: ADMIN_PAGE_SIZE } });
    const d = res.data;
    setApprovedCompanies(d.items || []);
    setCoApprovedMeta({
      page: d.page || page,
      total: d.total ?? 0,
      totalPages: Math.max(1, d.totalPages || 1),
    });
  }, []);

  const loadMissingCompanies = useCallback(async () => {
    setMissingCompaniesLoading(true);
    try {
      const res = await adminAPI.getMissingCompanies();
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      items.sort((a, b) => (b?.requestCount || 0) - (a?.requestCount || 0));
      setMissingCompanies(items);
    } finally {
      setMissingCompaniesLoading(false);
      setMissingCompaniesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!adminToast) return undefined;
    const timeoutId = window.setTimeout(() => {
      setAdminToast(null);
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [adminToast]);

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
    if (activeMainTab !== 'missing-companies') return;
    if (missingCompaniesLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        await loadMissingCompanies();
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, activeMainTab, missingCompaniesLoaded, loadMissingCompanies]);

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

  const sortedMissingCompanies = [...missingCompanies].sort(
    (a, b) => (b?.requestCount || 0) - (a?.requestCount || 0)
  );

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

  const handleApproveCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to approve this company? It will be visible to all users.')) {
      return;
    }

    try {
      setApprovingCompanyIds(prev => new Set(prev).add(companyId));
      
      const response = await adminAPI.approveCompany(companyId);
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

      alert(alreadyApproved ? 'Company was already approved.' : 'Company approved successfully!');
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
        newSet.delete(companyId);
        return newSet;
      });
    }
  };

  const handleRejectCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to reject this company? This will permanently delete it from the database.')) {
      return;
    }

    try {
      setRejectingCompanyIds(prev => new Set(prev).add(companyId));
      
      await adminAPI.rejectCompany(companyId);

      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      await loadPendingCompaniesList(coPendingMeta.page);

      alert('Company rejected and deleted successfully!');
    } catch (err) {
      console.error('Error rejecting company:', err);
      alert('Failed to reject company. Please try again.');
    } finally {
      setRejectingCompanyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(companyId);
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

  const handleDeleteApprovedCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this approved company? This will permanently remove it from the database.')) {
      return;
    }

    try {
      setDeletingCompanyIds(prev => new Set(prev).add(companyId));
      
      await adminAPI.deleteApprovedCompany(companyId);

      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      await loadApprovedCompaniesList(coApprovedMeta.page);

      alert('Approved company deleted successfully!');
    } catch (err) {
      console.error('Error deleting approved company:', err);
      alert('Failed to delete approved company. Please try again.');
    } finally {
      setDeletingCompanyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(companyId);
        return newSet;
      });
    }
  };

  const handleUpdateMissingCompanyStatus = async (id, status) => {
    try {
      setUpdatingMissingCompanyIds(prev => new Set(prev).add(id));
      const res = await adminAPI.updateMissingCompanyStatus(id, status);
      const updatedItem = res.data?.missingCompany;

      setMissingCompanies(prev => {
        const next = prev.map((item) =>
          item._id === id
            ? {
                ...item,
                ...(updatedItem || {}),
                status: updatedItem?.status || status,
              }
            : item
        );
        next.sort((a, b) => (b?.requestCount || 0) - (a?.requestCount || 0));
        return next;
      });
    } catch (err) {
      console.error('Error updating missing company status:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to update missing company status. Please try again.';
      setAdminToast({ type: 'error', message: errorMessage });
    } finally {
      setUpdatingMissingCompanyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteMissingCompany = async (id) => {
    if (!window.confirm('Are you sure you want to delete this missing company request?')) {
      return;
    }

    try {
      setDeletingMissingCompanyIds(prev => new Set(prev).add(id));
      await adminAPI.deleteMissingCompany(id);
      setMissingCompanies(prev => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error('Error deleting missing company request:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to delete missing company request. Please try again.';
      setAdminToast({ type: 'error', message: errorMessage });
    } finally {
      setDeletingMissingCompanyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
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

      const totalSubmissions = bulkList.length;
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

    const confirmMessage = `Approve all ${companies.length} pending company/companies on this page? (Loads up to ${ADMIN_BULK_FETCH_LIMIT} if more exist.) They will be visible to all users.`;
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
          params: { status: 'pending', page: 1, limit: ADMIN_BULK_FETCH_LIMIT },
        });
        bulkCompanies = bulkRes.data.items || [];
      }

      for (const company of bulkCompanies) {
        try {
          setApprovingCompanyIds(prev => new Set(prev).add(company._id));
          await adminAPI.approveCompany(company._id);

          successCount++;
        } catch (err) {
          console.error(`Error approving company ${company._id}:`, err);
          failCount++;
          const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
          errors.push(`Company ${company.name || company._id}: ${errorMsg}`);
        } finally {
          setApprovingCompanyIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(company._id);
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
        alert(`Successfully approved all ${successCount} company/companies! They are now visible to all users.`);
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={`stats-skeleton-${idx}`} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="h-3 w-24 shimmer-box rounded"></div>
                  <div className="h-7 w-16 shimmer-box rounded"></div>
                </div>
              ))}
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

        {/* Stats Cards */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Total Users</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-indigo-600 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Pending Submissions</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.pendingSubmissions || 0}</p>
                  </div>
                  <div className="bg-yellow-600 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Approved Submissions</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.approvedSubmissions || 0}</p>
                  </div>
                  <div className="bg-green-600 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Pending Companies</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.pendingCompanies}</p>
                  </div>
                  <div className="bg-yellow-600 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Approved Companies</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalCompanies}</p>
                  </div>
                  <div className="bg-purple-600 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

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
                Submissions
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
                Companies
              </button>
              <button
                onClick={() => setActiveMainTab('missing-companies')}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm sm:text-base whitespace-nowrap flex items-center gap-2 ${
                  activeMainTab === 'missing-companies'
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FaBuilding />
                Missing Companies
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                      {[
                        {
                          label: 'Total Users',
                          value: stats.totalUsers ?? 0,
                          description: 'All user accounts currently stored on the platform.',
                        },
                        {
                          label: 'Total Companies',
                          value: stats.totalCompanies ?? 0,
                          description: 'All companies currently present in the main company collection.',
                        },
                        {
                          label: 'Pending Submissions',
                          value: stats.pendingSubmissions ?? 0,
                          description: 'User submissions still waiting for admin review and action.',
                        },
                        {
                          label: 'Missing Companies',
                          value: stats.missingCompaniesCount ?? 0,
                          description: 'Missing-company requests submitted by users for admin review.',
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
                    'Top Missing Companies',
                    'Companies most frequently requested by users as missing from the platform.',
                    stats.topMissingCompanies,
                    'requestCount',
                    'Requests'
                  )}
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
                      <p className="text-sm text-slate-400 mt-1">Review and approve company submissions</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
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
                        Pending ({stats.pendingCompanies || 0})
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
                        Approved ({stats.totalCompanies || 0})
                      </button>
                    </div>
                  </div>
                </div>
              </div>

                {companiesSubTab === 'pending' ? (
                companies.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center">
                    <p className="text-slate-400 text-sm sm:text-base">No pending companies found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="p-4 sm:p-6 space-y-4">
                        {companies.map((company) => (
                          <div key={company._id} className="border border-slate-700 rounded-lg p-4 sm:p-6 bg-slate-800/60 hover:bg-slate-800">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-200 mb-2">{company.name}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-400">
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
                              <div className="flex items-center gap-2 flex-col sm:flex-row w-full sm:w-auto">
                                <button
                                  onClick={() => handleApproveCompany(company._id)}
                                  disabled={approvingCompanyIds.has(company._id) || rejectingCompanyIds.has(company._id)}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                                    approvingCompanyIds.has(company._id) || rejectingCompanyIds.has(company._id)
                                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                      : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                >
                                  {approvingCompanyIds.has(company._id) ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleRejectCompany(company._id)}
                                  disabled={approvingCompanyIds.has(company._id) || rejectingCompanyIds.has(company._id)}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                                    approvingCompanyIds.has(company._id) || rejectingCompanyIds.has(company._id)
                                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                      : 'bg-red-600 text-white hover:bg-red-700'
                                  }`}
                                >
                                  {rejectingCompanyIds.has(company._id) ? 'Rejecting...' : 'Reject'}
                                </button>
                              </div>
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
                    <p className="text-slate-400 text-sm sm:text-base">No approved companies found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {approvedCompanies.map((company) => (
                            <div key={company._id} className="border border-slate-700 rounded-lg p-4 bg-slate-800/60">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <h3 className="text-base sm:text-lg font-semibold text-slate-200">{company.name}</h3>
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-600 text-white">
                                    Approved
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteApprovedCompany(company._id)}
                                  disabled={deletingCompanyIds.has(company._id)}
                                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                                    deletingCompanyIds.has(company._id)
                                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                      : 'bg-red-600 text-white hover:bg-red-700'
                                  }`}
                                >
                                  {deletingCompanyIds.has(company._id) ? 'Deleting...' : <FaTrash />}
                                </button>
                              </div>
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

            {activeMainTab === 'missing-companies' && (
              <div className="bg-theme-card border border-theme rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-theme">
                  <div>
                    <h2 className="text-xl font-semibold text-theme-accent">Missing Companies</h2>
                    <p className="text-sm text-theme-secondary mt-1">
                      Review missing company requests submitted by beta users.
                    </p>
                  </div>
                </div>

                <div className="px-6 py-5">
                  {missingCompaniesLoading ? (
                    <div className="rounded-lg border border-theme bg-theme-hero p-6 text-center">
                      <p className="text-theme-primary text-sm sm:text-base">Loading missing companies...</p>
                    </div>
                  ) : sortedMissingCompanies.length === 0 ? (
                    <div className="rounded-lg border border-theme bg-theme-hero p-6 text-center">
                      <p className="text-theme-secondary text-sm sm:text-base">No missing company requests found.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <table className="min-w-full divide-y divide-theme">
                        <thead className="bg-theme-hero">
                          <tr>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Request Count
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Categories
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme bg-theme-card">
                          {sortedMissingCompanies.map((company) => {
                            const isUpdating = updatingMissingCompanyIds.has(company._id);
                            const isDeleting = deletingMissingCompanyIds.has(company._id);
                            const isBusy = isUpdating || isDeleting;
                            const categoriesText = Array.isArray(company.categories) && company.categories.length > 0
                              ? company.categories.join(', ')
                              : 'N/A';

                            return (
                              <tr key={company._id} className="hover:bg-theme-nav transition-colors">
                                <td className="px-3 sm:px-4 py-4 text-sm font-medium text-theme-primary">
                                  {company.name}
                                </td>
                                <td className="px-3 sm:px-4 py-4 text-sm text-theme-secondary">
                                  {company.requestCount || 0}
                                </td>
                                <td className="px-3 sm:px-4 py-4 text-sm text-theme-secondary">
                                  {categoriesText}
                                </td>
                                <td className="px-3 sm:px-4 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      company.status === 'ADDED'
                                        ? 'bg-green-600 text-white'
                                        : company.status === 'REJECTED'
                                          ? 'bg-red-600 text-white'
                                          : 'bg-amber-600 text-white'
                                    }`}
                                  >
                                    {company.status || 'PENDING'}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-4">
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateMissingCompanyStatus(company._id, 'ADDED')}
                                      disabled={isBusy || company.status === 'ADDED'}
                                      className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                                        isBusy || company.status === 'ADDED'
                                          ? 'bg-theme-nav text-theme-muted cursor-not-allowed'
                                          : 'bg-green-600 text-white hover:bg-green-700'
                                      }`}
                                    >
                                      {isUpdating && company.status !== 'ADDED' ? 'Updating...' : 'Mark as Added'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateMissingCompanyStatus(company._id, 'REJECTED')}
                                      disabled={isBusy || company.status === 'REJECTED'}
                                      className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                                        isBusy || company.status === 'REJECTED'
                                          ? 'bg-theme-nav text-theme-muted cursor-not-allowed'
                                          : 'bg-amber-600 text-white hover:bg-amber-700'
                                      }`}
                                    >
                                      {isUpdating && company.status !== 'REJECTED' ? 'Updating...' : 'Reject'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMissingCompany(company._id)}
                                      disabled={isBusy}
                                      className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                                        isBusy
                                          ? 'bg-theme-nav text-theme-muted cursor-not-allowed'
                                          : 'bg-red-600 text-white hover:bg-red-700'
                                      }`}
                                    >
                                      {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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

