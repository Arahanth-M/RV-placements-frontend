import React, { useState, useEffect } from 'react';
import { adminAPI, eventAPI } from '../utils/api';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaFileAlt, FaBuilding, FaCalendar } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
  });
  const [submissions, setSubmissions] = useState([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState([]);
  const [activeMainTab, setActiveMainTab] = useState('submissions'); // 'submissions', 'companies', 'events'
  const [submissionsSubTab, setSubmissionsSubTab] = useState('pending'); // 'pending' or 'approved'
  const [companies, setCompanies] = useState([]);
  const [approvedCompanies, setApprovedCompanies] = useState([]);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, pendingSubmissionsResponse, approvedSubmissionsResponse, pendingCompaniesResponse, approvedCompaniesResponse, eventsResponse] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getSubmissions({ params: { status: 'pending' } }),
        adminAPI.getSubmissions({ params: { status: 'approved' } }),
        adminAPI.getCompanies({ params: { status: 'pending' } }),
        adminAPI.getCompanies({ params: { status: 'approved' } }),
        eventAPI.getAllEvents().catch(() => ({ data: [] })), // Handle errors gracefully
      ]);

      setStats(statsResponse.data);
      setSubmissions(pendingSubmissionsResponse.data || []);
      setApprovedSubmissions(approvedSubmissionsResponse.data || []);
      setCompanies(pendingCompaniesResponse.data || []);
      setApprovedCompanies(approvedCompaniesResponse.data || []);
      setEvents(eventsResponse.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
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

  const handleApprove = async (submissionId) => {
    if (!window.confirm('Are you sure you want to approve this submission? This will update the company database.')) {
      return;
    }

    try {
      setApprovingIds(prev => new Set(prev).add(submissionId));
      
      const response = await adminAPI.approveSubmission(submissionId);
      
      // Move the approved submission from pending to approved list
      const approvedSubmission = submissions.find(sub => sub._id === submissionId);
      if (approvedSubmission) {
        approvedSubmission.status = 'approved';
        approvedSubmission.approvedAt = new Date();
        setApprovedSubmissions(prev => [approvedSubmission, ...prev]);
        setSubmissions(prev => prev.filter(sub => sub._id !== submissionId));
      }
      
      // Refresh stats
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      
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
      
      // Remove the rejected submission from the list
      setSubmissions(prev => prev.filter(sub => sub._id !== submissionId));
      
      // Refresh stats
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      
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
      
      // Move the approved company from pending to approved list
      const approvedCompany = companies.find(comp => comp._id === companyId);
      if (approvedCompany) {
        approvedCompany.status = 'approved';
        approvedCompany.approvedAt = new Date();
        setApprovedCompanies(prev => [approvedCompany, ...prev]);
        setCompanies(prev => prev.filter(comp => comp._id !== companyId));
      }
      
      // Refresh stats
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      
      alert('Company approved successfully!');
    } catch (err) {
      console.error('Error approving company:', err);
      alert('Failed to approve company. Please try again.');
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
      
      // Remove the rejected company from the list
      setCompanies(prev => prev.filter(comp => comp._id !== companyId));
      
      // Refresh stats
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      
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
      
      // Remove the deleted submission from the approved list
      setApprovedSubmissions(prev => prev.filter(sub => sub._id !== submissionId));
      
      // Refresh stats
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      
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
      
      // Remove the deleted company from the approved list
      setApprovedCompanies(prev => prev.filter(comp => comp._id !== companyId));
      
      // Refresh stats
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);
      
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

  const handleViewFullSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleApproveAll = async () => {
    if (submissions.length === 0) {
      alert('No pending submissions to approve.');
      return;
    }

    const confirmMessage = `Are you sure you want to approve all ${submissions.length} pending submission(s)? This will update the company database.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setApprovingAll(true);
      const totalSubmissions = submissions.length;
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Approve all submissions sequentially to avoid overwhelming the server
      for (const submission of submissions) {
        try {
          setApprovingIds(prev => new Set(prev).add(submission._id));
          await adminAPI.approveSubmission(submission._id);
          
          // Move the approved submission from pending to approved list
          const approvedSubmission = { ...submission };
          approvedSubmission.status = 'approved';
          approvedSubmission.approvedAt = new Date();
          setApprovedSubmissions(prev => [approvedSubmission, ...prev]);
          setSubmissions(prev => prev.filter(sub => sub._id !== submission._id));
          
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

      // Refresh stats
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);

      // Show summary
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

    const confirmMessage = `Are you sure you want to approve all ${companies.length} pending company/companies? They will be visible to all users.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setApprovingAllCompanies(true);
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Approve all companies sequentially to avoid overwhelming the server
      for (const company of companies) {
        try {
          setApprovingCompanyIds(prev => new Set(prev).add(company._id));
          await adminAPI.approveCompany(company._id);
          
          // Move the approved company from pending to approved list
          const approvedCompany = { ...company };
          approvedCompany.status = 'approved';
          approvedCompany.approvedAt = new Date();
          setApprovedCompanies(prev => [approvedCompany, ...prev]);
          setCompanies(prev => prev.filter(comp => comp._id !== company._id));
          
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

      // Refresh stats
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data);

      // Show summary
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#302C2C' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-400">Manage and monitor platform activity</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
            <p className="mt-4 text-slate-400">Loading dashboard...</p>
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
                        {approvingAll ? 'Approving All...' : `Approve All (${submissions.length})`}
                      </button>
                    )}
                    <div className="flex gap-2 border border-slate-700 rounded-lg p-1 bg-slate-800/60">
                      <button
                          onClick={() => setSubmissionsSubTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            submissionsSubTab === 'pending'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Pending ({stats.pendingSubmissions || 0})
                      </button>
                      <button
                          onClick={() => setSubmissionsSubTab('approved')}
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
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleViewFullSubmission(submission)}
                              >
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                                      {submission.submittedBy.name}
                                      {submission.isAnonymous && (
                                        <span className="ml-2 text-xs text-orange-600 font-normal">(Anonymous)</span>
                                      )}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{submission.submittedBy.email}</p>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <p className="text-xs sm:text-sm text-gray-900">
                                    {submission.companyId?.name || 'N/A'}
                                  </p>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                    {submission.type}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                                  <div className="text-xs sm:text-sm text-gray-900 max-w-md">
                                    {content.question && (
                                      <p className="font-medium mb-1 truncate">Q: {content.question}</p>
                                    )}
                                    {content.solution && (
                                      <p className="text-gray-600 truncate">A: {content.solution}</p>
                                    )}
                                    {!content.question && !content.solution && (
                                      <p className="text-gray-500 truncate">{submission.content}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
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
                                      {submission.submittedBy.name}
                                      {submission.isAnonymous && (
                                        <span className="ml-2 text-xs text-orange-400 font-normal">(Anonymous)</span>
                                      )}
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[120px] sm:max-w-none">{submission.submittedBy.email}</p>
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
                        {approvingAllCompanies ? 'Approving All...' : `Approve All (${companies.length})`}
                      </button>
                    )}
                    <div className="flex gap-2 border border-slate-700 rounded-lg p-1 bg-slate-800/60">
                      <button
                          onClick={() => setCompaniesSubTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            companiesSubTab === 'pending'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Pending ({stats.pendingCompanies || 0})
                      </button>
                      <button
                          onClick={() => setCompaniesSubTab('approved')}
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

