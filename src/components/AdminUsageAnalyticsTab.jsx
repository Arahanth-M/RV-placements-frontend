import React, { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { adminAPI } from "../utils/api";
import DashboardRefreshButton from "./DashboardRefreshButton.jsx";

const CHART_MARGIN = { top: 8, right: 12, left: -12, bottom: 0 };
const AXIS_TICK = { fill: "var(--chart-axis-tick)", fontSize: 11 };
const AXIS_LINE = { stroke: "var(--chart-axis-line)" };

function formatChartDate(value) {
  if (!value) return "";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function sumCounts(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((sum, row) => sum + (Number(row?.count) || 0), 0);
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-theme-primary">{formatChartDate(label)}</p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          className="flex items-center justify-between gap-4 text-theme-secondary"
        >
          <span>{entry.name || entry.dataKey}</span>
          <span className="font-semibold tabular-nums text-theme-primary">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="min-w-[6.5rem] rounded-lg border border-theme bg-theme-hero px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-muted">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-theme-primary">{value}</p>
    </div>
  );
}

function DayChart({ title, subtitle, data, accent, gradientId }) {
  return (
    <div className="overflow-hidden rounded-xl border border-theme bg-theme-card p-5 shadow-sm sm:p-6">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
          <p className="mt-0.5 text-xs text-theme-secondary">{subtitle}</p>
        </div>
        <Kpi label="Range total" value={sumCounts(data)} />
      </div>
      <div className="mt-4 h-64 min-w-0">
        {Array.isArray(data) && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={CHART_MARGIN}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                tickLine={AXIS_LINE}
                axisLine={AXIS_LINE}
                tickFormatter={formatChartDate}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                name="Count"
                stroke={accent}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={false}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Count"
                stroke={accent}
                strokeWidth={3}
                dot={{ r: 3, fill: "var(--bg-card)", strokeWidth: 2, stroke: accent }}
                activeDot={{ r: 5, fill: accent, strokeWidth: 2, stroke: "var(--bg-card)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-theme-muted">
            No data in this range.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Admin miscellaneous: AI mock interview + PrepPath generation usage.
 */
export default function AdminUsageAnalyticsTab() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await adminAPI.getUsageAnalytics({ days });
      setData(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load usage analytics.");
      if (!silent) setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const interviews = data?.interviews;
  const prepPaths = data?.prepPaths;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-theme bg-theme-card p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-2xl font-semibold text-theme-accent">AI &amp; PrepPath usage</h2>
            <p className="mt-1 max-w-2xl text-sm text-theme-secondary">
              Day-wise AI mock interviews and PrepPath plans generated by students (IST calendar
              days).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
              Range
              <select
                className="ml-2 rounded-lg border border-theme bg-theme-input px-2 py-1.5 text-sm font-medium text-theme-primary"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
            <DashboardRefreshButton
              loading={refreshing || loading}
              onClick={() => load({ silent: true })}
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        {loading && !data ? (
          <div className="mt-6 rounded-lg border border-theme bg-theme-hero p-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-theme border-t-theme-accent" />
            <p className="mt-4 text-sm text-theme-secondary">Loading usage analytics…</p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Interviews (all-time)" value={interviews?.total ?? 0} />
              <Kpi label="Interviews (range)" value={interviews?.totalInRange ?? 0} />
              <Kpi label="PrepPaths (all-time)" value={prepPaths?.total ?? 0} />
              <Kpi label="PrepPaths (range)" value={prepPaths?.totalInRange ?? 0} />
            </div>
            {data?.rangeStart && data?.rangeEnd ? (
              <p className="mt-3 text-xs text-theme-muted">
                Showing {data.rangeStart} → {data.rangeEnd} ({data.timezone || "Asia/Kolkata"})
              </p>
            ) : null}
          </>
        )}
      </div>

      {!loading || data ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DayChart
            title="AI mock interviews by day"
            subtitle="Sessions started each IST day"
            data={interviews?.byDay}
            accent="var(--accent)"
            gradientId="adminUsageInterviewGrad"
          />
          <DayChart
            title="PrepPaths generated by day"
            subtitle="Plans created each IST day"
            data={prepPaths?.byDay}
            accent="var(--green)"
            gradientId="adminUsagePrepPathGrad"
          />
        </div>
      ) : null}

      {!loading || data ? (
        <div className="overflow-hidden rounded-xl border border-theme bg-theme-card shadow-sm">
          <div className="border-b border-theme px-5 py-4 sm:px-6">
            <h3 className="text-lg font-semibold text-theme-primary">
              PrepPaths by company
            </h3>
            <p className="mt-0.5 text-xs text-theme-secondary">
              Companies students generated PrepPath plans for in this range (highest first).
            </p>
          </div>
          {Array.isArray(prepPaths?.byCompany) && prepPaths.byCompany.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-theme-hero text-xs uppercase tracking-wide text-theme-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold sm:px-6">#</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Company</th>
                    <th className="px-5 py-3 font-semibold sm:px-6 text-right">Plans</th>
                  </tr>
                </thead>
                <tbody>
                  {prepPaths.byCompany.map((row, index) => (
                    <tr
                      key={row.companyId || `${row.companyName}-${index}`}
                      className="border-t border-theme text-theme-primary"
                    >
                      <td className="px-5 py-3 tabular-nums text-theme-muted sm:px-6">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3 font-medium sm:px-6">
                        {row.companyName || "Unknown company"}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold sm:px-6">
                        {row.count ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-theme-muted sm:px-6">
              No PrepPath plans in this range yet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
