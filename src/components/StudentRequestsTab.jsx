import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { tenantPath } from "../constants/tenant.js";
import { FaExternalLinkAlt, FaMicrophone, FaPaperPlane, FaUserCheck } from "react-icons/fa";
import { adminAPI } from "../utils/api";

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function StudentRequestsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyDetailRequests, setCompanyDetailRequests] = useState([]);
  const [profileDiscrepancies, setProfileDiscrepancies] = useState([]);
  const [interviewLimitRequests, setInterviewLimitRequests] = useState([]);
  const [actionId, setActionId] = useState("");
  const [actionError, setActionError] = useState("");
  const [totals, setTotals] = useState({
    companyDetailRequestCount: 0,
    companiesWithRequests: 0,
    profileDiscrepancyCount: 0,
    interviewLimitRequestCount: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await adminAPI.getStudentRequests();
      setCompanyDetailRequests(Array.isArray(data?.companyDetailRequests) ? data.companyDetailRequests : []);
      setProfileDiscrepancies(Array.isArray(data?.profileDiscrepancies) ? data.profileDiscrepancies : []);
      setInterviewLimitRequests(
        Array.isArray(data?.interviewLimitRequests) ? data.interviewLimitRequests : []
      );
      setTotals({
        companyDetailRequestCount: Number(data?.totals?.companyDetailRequestCount) || 0,
        companiesWithRequests: Number(data?.totals?.companiesWithRequests) || 0,
        profileDiscrepancyCount: Number(data?.totals?.profileDiscrepancyCount) || 0,
        interviewLimitRequestCount: Number(data?.totals?.interviewLimitRequestCount) || 0,
      });
    } catch (err) {
      console.error("Failed to load student requests:", err);
      setError("Failed to load student requests. Please try again.");
      setCompanyDetailRequests([]);
      setProfileDiscrepancies([]);
      setInterviewLimitRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveInterviewRequest = async (requestId) => {
    setActionId(requestId);
    setActionError("");
    try {
      await adminAPI.approveInterviewLimitRequest(requestId);
      await loadData();
    } catch (err) {
      console.error("Failed to approve interview limit request:", err);
      setActionError("Failed to approve interview request. Please try again.");
    } finally {
      setActionId("");
    }
  };

  const handleDismissInterviewRequest = async (requestId) => {
    setActionId(requestId);
    setActionError("");
    try {
      await adminAPI.dismissInterviewLimitRequest(requestId);
      await loadData();
    } catch (err) {
      console.error("Failed to dismiss interview limit request:", err);
      setActionError("Failed to dismiss interview request. Please try again.");
    } finally {
      setActionId("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-theme bg-theme-card p-8 text-center text-theme-secondary">
        Loading student requests…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
        <p>{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm text-center">
        <h2 className="text-2xl font-semibold text-theme-accent">Student requests</h2>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-theme-secondary">
          Requests for more company details, additional AI interviews, and profile discrepancy
          reports from students. These are not sent as bell notifications.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
          <span className="rounded-full border border-theme bg-theme-hero px-3 py-1 text-theme-primary">
            {totals.companyDetailRequestCount} detail request
            {totals.companyDetailRequestCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-theme bg-theme-hero px-3 py-1 text-theme-primary">
            {totals.interviewLimitRequestCount} interview request
            {totals.interviewLimitRequestCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-theme bg-theme-hero px-3 py-1 text-theme-primary">
            {totals.profileDiscrepancyCount} profile discrepanc
            {totals.profileDiscrepancyCount === 1 ? "y" : "ies"}
          </span>
        </div>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {actionError}
        </p>
      ) : null}

      <div className="rounded-xl border border-theme bg-theme-card overflow-hidden">
        <div className="border-b border-theme px-5 py-4 flex items-center gap-2">
          <FaMicrophone className="text-theme-accent" aria-hidden />
          <div>
            <h3 className="text-lg font-semibold text-theme-primary">Additional interview requests</h3>
            <p className="text-sm text-theme-secondary">
              Students hit the weekly interview cap and asked for another mock interview.
            </p>
          </div>
        </div>
        {interviewLimitRequests.length === 0 ? (
          <p className="px-5 py-8 text-sm text-theme-muted">No interview limit requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme text-sm">
              <thead className="bg-theme-hero text-theme-muted">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Student</th>
                  <th className="px-5 py-3 text-left font-medium">USN</th>
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Requested</th>
                  <th className="px-5 py-3 text-left font-medium">Available again</th>
                  <th className="px-5 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {interviewLimitRequests.map((row) => (
                  <tr key={row.requestId} className="text-theme-secondary">
                    <td className="px-5 py-3 font-medium text-theme-primary">
                      {row.name || row.email}
                    </td>
                    <td className="px-5 py-3">{row.usn || "—"}</td>
                    <td className="px-5 py-3">{row.email}</td>
                    <td className="px-5 py-3">{formatWhen(row.requestedAt)}</td>
                    <td className="px-5 py-3">{formatWhen(row.nextAvailableAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actionId === row.requestId}
                          onClick={() => handleApproveInterviewRequest(row.requestId)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actionId === row.requestId}
                          onClick={() => handleDismissInterviewRequest(row.requestId)}
                          className="rounded-lg border border-theme px-3 py-1.5 text-xs font-semibold text-theme-primary hover:bg-theme-hero disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-theme bg-theme-card overflow-hidden">
        <div className="border-b border-theme px-5 py-4 flex items-center gap-2">
          <FaPaperPlane className="text-theme-accent" aria-hidden />
          <div>
            <h3 className="text-lg font-semibold text-theme-primary">More details requested</h3>
            <p className="text-sm text-theme-secondary">
              Students asked for additional information on company pages.
            </p>
          </div>
        </div>
        {companyDetailRequests.length === 0 ? (
          <p className="px-5 py-8 text-sm text-theme-muted">No company detail requests yet.</p>
        ) : (
          <div className="divide-y divide-theme">
            {companyDetailRequests.map((row) => (
              <div key={row.companyId} className="px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      to={tenantPath(`/companies/${row.companyId}`)}
                      className="inline-flex items-center gap-2 text-base font-semibold text-theme-accent hover:underline"
                    >
                      {row.companyName}
                      <FaExternalLinkAlt className="h-3 w-3" aria-hidden />
                    </Link>
                    <p className="mt-1 text-xs text-theme-muted">
                      Last updated {formatWhen(row.updatedAt)} · {row.requestCount} request
                      {row.requestCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {row.requesters.map((requester) => (
                    <li
                      key={`${row.companyId}-${requester.email}`}
                      className="rounded-lg border border-theme bg-theme-hero px-3 py-2 text-sm text-theme-secondary"
                    >
                      <span className="font-medium text-theme-primary">
                        {requester.name || requester.email}
                      </span>
                      {requester.usn ? (
                        <span className="text-theme-muted"> · {requester.usn}</span>
                      ) : null}
                      {requester.name ? (
                        <div className="text-xs text-theme-muted">{requester.email}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-theme bg-theme-card overflow-hidden">
        <div className="border-b border-theme px-5 py-4 flex items-center gap-2">
          <FaUserCheck className="text-theme-accent" aria-hidden />
          <div>
            <h3 className="text-lg font-semibold text-theme-primary">Profile discrepancies</h3>
            <p className="text-sm text-theme-secondary">
              Students flagged incorrect information on their placement profile.
            </p>
          </div>
        </div>
        {profileDiscrepancies.length === 0 ? (
          <p className="px-5 py-8 text-sm text-theme-muted">No profile discrepancy reports yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme text-sm">
              <thead className="bg-theme-hero text-theme-muted">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Student</th>
                  <th className="px-5 py-3 text-left font-medium">USN</th>
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {profileDiscrepancies.map((row) => (
                  <tr key={row.studentId} className="text-theme-secondary">
                    <td className="px-5 py-3 font-medium text-theme-primary">{row.name}</td>
                    <td className="px-5 py-3">{row.usn}</td>
                    <td className="px-5 py-3">{row.email}</td>
                    <td className="px-5 py-3">{formatWhen(row.reportedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
