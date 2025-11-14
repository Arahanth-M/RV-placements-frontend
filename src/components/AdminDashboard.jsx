import React, { useState, useEffect } from 'react';
import { adminAPI, eventAPI } from '../utils/api';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubmissions: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
  });
  const [submissions, setSubmissions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingIds, setApprovingIds] = useState(new Set());
  const [rejectingIds, setRejectingIds] = useState(new Set());
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    url: '',
    lastDateToRegister: '',
  });
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, submissionsResponse, eventsResponse] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getSubmissions(),
        eventAPI.getAllEvents().catch(() => ({ data: [] })), // Handle errors gracefully
      ]);

      setStats(statsResponse.data);
      setSubmissions(submissionsResponse.data || []);
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
      
      await adminAPI.approveSubmission(submissionId);
      
      // Remove the approved submission from the list
      setSubmissions(prev => prev.filter(sub => sub._id !== submissionId));
      
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and monitor platform activity</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSubmissions}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved Companies</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCompanies}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Companies</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingCompanies}</p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
                <p className="text-sm text-gray-600 mt-1">All user submissions across the platform</p>
              </div>

              {submissions.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <p className="text-gray-600 text-sm sm:text-base">No submissions found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
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
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((submission) => {
                          const content = parseContent(submission.content);
                          return (
                            <tr key={submission._id} className="hover:bg-gray-50">
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-900">{submission.submittedBy.name}</p>
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
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 sm:gap-2 flex-col sm:flex-row">
                                  <button
                                    onClick={() => handleApprove(submission._id)}
                                    disabled={approvingIds.has(submission._id) || rejectingIds.has(submission._id)}
                                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition w-full sm:w-auto ${
                                      approvingIds.has(submission._id) || rejectingIds.has(submission._id)
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
              )}
            </div>

            {/* Events Management Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6 sm:mt-8">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Events Management</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage off-campus placements, hackathons, and other events</p>
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
                <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 bg-gray-50">
                  <form onSubmit={handleEventSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                        placeholder="Event title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={eventForm.url}
                        onChange={(e) => setEventForm({ ...eventForm, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                        placeholder="https://example.com/register"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Date to Register *
                      </label>
                      <input
                        type="date"
                        required
                        value={eventForm.lastDateToRegister}
                        onChange={(e) => setEventForm({ ...eventForm, lastDateToRegister: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
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
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
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
                  <FaCalendarAlt className="mx-auto text-gray-400 text-3xl sm:text-4xl mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base">No events found. Create your first event!</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
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
                      <tbody className="bg-white divide-y divide-gray-200">
                        {events.map((event) => {
                          const isPastDeadline = new Date(event.lastDateToRegister) < new Date();
                          return (
                            <tr key={event._id} className={`hover:bg-gray-50 ${isPastDeadline ? 'opacity-60' : ''}`}>
                              <td className="px-3 sm:px-6 py-4">
                                <p className="text-xs sm:text-sm font-medium text-gray-900">{event.title}</p>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-xs sm:text-sm text-gray-900">
                                  {formatEventDate(event.lastDateToRegister)}
                                </div>
                                {isPastDeadline && (
                                  <span className="text-xs text-red-600">Past Deadline</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                                <a
                                  href={event.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs sm:text-sm"
                                >
                                  <FaExternalLinkAlt className="w-3 h-3" />
                                  View Link
                                </a>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1 sm:gap-2 flex-col sm:flex-row">
                                  <button
                                    onClick={() => handleEditEvent(event)}
                                    className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-md text-xs sm:text-sm hover:bg-blue-700 flex items-center gap-1 w-full sm:w-auto justify-center"
                                  >
                                    <FaEdit className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event._id)}
                                    disabled={deletingIds.has(event._id)}
                                    className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center gap-1 w-full sm:w-auto justify-center ${
                                      deletingIds.has(event._id)
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

