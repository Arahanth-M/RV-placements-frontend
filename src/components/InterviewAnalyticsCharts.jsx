import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreLabel(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value}/10`;
}

function scoreBadgeClass(value) {
  if (value == null || !Number.isFinite(value)) return "text-theme-secondary";
  if (value >= 7) return "text-emerald-500";
  if (value >= 5) return "text-amber-500";
  return "text-red-500";
}

// ─── Reusable DataTable primitive ───────────────────────────────────────────

function cellAlignClass(align) {
  if (align === "right") return "text-right tabular-nums";
  return "text-left";
}

/**
 * columns: Array<{ key: string; label: string; align?: "left" | "right"; width?: string; colorFn?: (val) => string; isRowHeader?: boolean; wrap?: boolean; cellClass?: string }>
 * rows:    Array<Record<string, any>>
 */
function DataTable({ columns, rows }) {
  if (!rows.length) return null;

  const cellPad = "px-2 py-1.5 sm:px-3 sm:py-2";
  const headerBorder = "border-b border-theme/60";
  const bodyRowBorder = "border-b border-theme/50";
  const hasColWidths = columns.some((col) => col.width);

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-theme/60">
      <table
        className={[
          "w-full border-collapse text-xs sm:text-sm",
          hasColWidths ? "table-fixed" : "",
        ].join(" ")}
      >
        {hasColWidths ? (
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
        ) : null}
        <thead>
          <tr className="bg-theme-hero/40">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  cellPad,
                  headerBorder,
                  "font-semibold text-theme-primary",
                  col.align === "right" ? "whitespace-nowrap" : "whitespace-normal",
                  cellAlignClass(col.align),
                  col.cellClass || "",
                ].join(" ")}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isLastRow = i === rows.length - 1;
            return (
            <tr
              key={i}
              className="hover:bg-theme-hero/20 transition-colors"
            >
              {columns.map((col) => {
                const raw = row[`${col.key}__raw`];
                const display = row[col.key] ?? "—";
                const colorClass = col.colorFn ? col.colorFn(raw) : "text-theme-primary";
                const displayText = typeof display === "string" ? display : String(display);
                return (
                  <td
                    key={col.key}
                    scope={col.isRowHeader ? "row" : undefined}
                    title={displayText}
                    className={[
                      cellPad,
                      cellAlignClass(col.align),
                      !isLastRow ? bodyRowBorder : "",
                      col.wrap || col.isRowHeader
                        ? "whitespace-normal break-words"
                        : "whitespace-nowrap",
                      colorClass,
                      col.cellClass || "",
                    ].join(" ")}
                  >
                    {display}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function TableSection({ label, children, className = "" }) {
  return (
    <div className={["flex w-full min-w-0 flex-col", className].filter(Boolean).join(" ")}>
      {label ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-secondary">
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

// ─── PerformanceOverviewTable ────────────────────────────────────────────────

const SCORE_BANDS = [
  { key: "strong", label: "Strong (7–10)", min: 7, max: 10 },
  { key: "good", label: "Good (5–7)", min: 5, max: 7 },
  { key: "below", label: "Below avg (3–5)", min: 3, max: 5 },
  { key: "needs", label: "Needs work (0–3)", min: 0, max: 3 },
];

function PerformanceOverviewTable({
  skillData,
  progressData,
  companyBreakdown = [],
  roundTypeDetail = [],
  readinessRows = [],
}) {
  // Derive scores once; overview and sortedSkills both depend on them.
  const scores = useMemo(
    () => progressData.map((d) => Number(d.score)).filter(Number.isFinite),
    [progressData]
  );

  const overview = useMemo(() => {
    if (!scores.length) return null;
    const sum = scores.reduce((t, v) => t + v, 0);
    return {
      total: scores.length,
      average: Math.round((sum / scores.length) * 10) / 10,
      best: Math.max(...scores),
      latest: scores[scores.length - 1],
    };
  }, [scores]);

  const sortedSkills = useMemo(
    () => [...skillData].sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill)),
    [skillData]
  );

  const scoreBands = useMemo(() => {
    if (!scores.length) return [];
    return SCORE_BANDS.map((band) => {
      const count = scores.filter((score) => {
        if (band.key === "strong") return score >= band.min && score <= band.max;
        if (band.key === "needs") return score >= band.min && score < band.max;
        return score >= band.min && score < band.max;
      }).length;
      const pct = Math.round((count / scores.length) * 100);
      return { label: band.label, count, pct };
    }).filter((row) => row.count > 0);
  }, [scores]);

  const hasContent =
    overview ||
    sortedSkills.length > 0 ||
    progressData.length > 0 ||
    companyBreakdown.length > 0 ||
    roundTypeDetail.length > 0 ||
    readinessRows.length > 0;

  if (!hasContent) {
    return (
      <section className="bg-theme-card border border-theme rounded-xl p-6 text-center">
        <p className="text-sm text-theme-secondary">
          Complete a mock interview to see your performance overview here.
        </p>
      </section>
    );
  }

  const companyColumns = [
    { key: "companyName", label: "Company", isRowHeader: true },
    { key: "attempts", label: "Attempts", align: "right" },
    { key: "avgScore", label: "Avg", align: "right", colorFn: (v) => scoreBadgeClass(v) },
    { key: "bestScore", label: "Best", align: "right", colorFn: (v) => scoreBadgeClass(v) },
  ];

  const companyRows = companyBreakdown.map((row) => ({
    companyName: row.companyName,
    attempts: row.attempts,
    avgScore: scoreLabel(row.avgScore),
    avgScore__raw: row.avgScore,
    bestScore: scoreLabel(row.bestScore),
    bestScore__raw: row.bestScore,
  }));

  const bandColumns = [
    { key: "label", label: "Score range", isRowHeader: true },
    { key: "count", label: "Interviews", align: "right" },
    { key: "pct", label: "Share", align: "right" },
  ];

  const bandRows = scoreBands.map((row) => ({
    label: row.label,
    count: row.count,
    pct: `${row.pct}%`,
  }));

  const roundDetailColumns = [
    { key: "type", label: "Round type", isRowHeader: true },
    { key: "avgScore", label: "Avg score", align: "right", colorFn: (v) => scoreBadgeClass(v) },
  ];

  const roundDetailRows = (roundTypeDetail.length > 0 ? roundTypeDetail : sortedSkills.map((r) => ({
    type: r.skill,
    avgScore: r.score,
  }))).map((row) => ({
    type: row.type || row.skill,
    avgScore: scoreLabel(row.avgScore ?? row.score),
    avgScore__raw: row.avgScore ?? row.score,
  }));

  const readinessColumns = [
    { key: "companyName", label: "Company", isRowHeader: true, width: "30%" },
    {
      key: "overallScore",
      label: "Score",
      align: "left",
      width: "5.25rem",
      colorFn: (v) => scoreBadgeClass(v),
      cellClass: "pr-1 sm:pr-2",
    },
    {
      key: "readiness",
      label: "Readiness",
      wrap: true,
      cellClass: "pl-4 sm:pl-6",
    },
  ];

  const readinessTableRows = readinessRows.map((row) => {
    const readinessParts = [];
    if (row.readinessScore != null) readinessParts.push(`${row.readinessScore}%`);
    if (row.readinessLabel) readinessParts.push(row.readinessLabel);
    return {
      companyName: row.companyName,
      overallScore: scoreLabel(row.overallScore),
      overallScore__raw: row.overallScore,
      readiness: readinessParts.length > 0 ? readinessParts.join(" · ") : "—",
    };
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  const summaryColumns = [
    { key: "metric", label: "Metric", isRowHeader: true },
    {
      key: "value",
      label: "Value",
      align: "right",
      colorFn: (raw) => scoreBadgeClass(raw),
    },
  ];

  const summaryRows = overview
    ? [
        { metric: "Total mock interviews", value: overview.total },
        { metric: "Average score", value: scoreLabel(overview.average), value__raw: overview.average },
        { metric: "Best score",    value: scoreLabel(overview.best),    value__raw: overview.best    },
        { metric: "Latest score",  value: scoreLabel(overview.latest),  value__raw: overview.latest  },
      ]
    : [];

  return (
    <section className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 space-y-5">
      <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
        <div className="w-1.5 h-5 bg-theme-accent rounded-full" />
        Performance Overview
      </h2>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {overview ? (
          <TableSection label="Summary">
            <DataTable columns={summaryColumns} rows={summaryRows} />
          </TableSection>
        ) : null}

        {scoreBands.length > 0 ? (
          <TableSection label="Score distribution">
            <DataTable columns={bandColumns} rows={bandRows} />
          </TableSection>
        ) : null}

        {roundDetailRows.length > 0 ? (
          <TableSection label="Round type detail">
            <DataTable columns={roundDetailColumns} rows={roundDetailRows} />
          </TableSection>
        ) : null}

        {companyRows.length > 0 || readinessTableRows.length > 0 ? (
          <div className="sm:col-span-2 xl:col-span-3 grid gap-5 sm:grid-cols-2">
            {companyRows.length > 0 ? (
              <TableSection label="Performance by company">
                <DataTable columns={companyColumns} rows={companyRows} />
              </TableSection>
            ) : null}

            {readinessTableRows.length > 0 ? (
              <TableSection label="Company readiness">
                <DataTable columns={readinessColumns} rows={readinessTableRows} />
              </TableSection>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── InterviewAnalyticsCharts ────────────────────────────────────────────────

function InterviewAnalyticsCharts({
  skillData,
  progressData,
  companyBreakdown = [],
  roundTypeDetail = [],
  readinessRows = [],
  CustomTooltip,
}) {
  const axisTick    = { fill: "var(--chart-axis-tick)", fontSize: 10 };
  const axisLine    = { stroke: "var(--chart-axis-line)" };
  const axisTickLine = { stroke: "var(--chart-axis-line)" };

  return (
    <div className="space-y-6">
      <PerformanceOverviewTable
        skillData={skillData}
        progressData={progressData}
        companyBreakdown={companyBreakdown}
        roundTypeDetail={roundTypeDetail}
        readinessRows={readinessRows}
      />

      <div className="grid gap-6 xl:grid-cols-2">
      {/* Skill Breakdown bar chart */}
      <section className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 overflow-hidden">
        <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
          <div className="w-1.5 h-5 bg-theme-accent rounded-full" />
          Skill Breakdown
        </h2>
        <div className="w-full h-[280px] sm:h-[320px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="skill"
                tick={axisTick}
                tickLine={axisTickLine}
                axisLine={axisLine}
                height={40}
              />
              <YAxis
                domain={[0, 10]}
                tick={axisTick}
                tickLine={axisTickLine}
                axisLine={axisLine}
                width={50}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--chart-cursor)", radius: [6, 6, 0, 0] }}
                animationDuration={150}
              />
              <Bar
                dataKey="score"
                fill="var(--chart-bar)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Progress Over Time line chart */}
      <section className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6 overflow-hidden">
        <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
          <div className="w-1.5 h-5 bg-theme-accent rounded-full" />
          Progress Over Time
        </h2>
        <div className="w-full h-[280px] sm:h-[320px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={axisTick}
                tickLine={axisTickLine}
                axisLine={axisLine}
                interval="preserveStartEnd"
                height={40}
              />
              <YAxis
                domain={[0, 10]}
                tick={axisTick}
                tickLine={axisTickLine}
                axisLine={axisLine}
                width={50}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1, strokeDasharray: "5 5" }}
                animationDuration={150}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--chart-line)"
                strokeWidth={3}
                dot={{
                  fill: "var(--chart-line-dot)",
                  strokeWidth: 2,
                  r: 5,
                  stroke: "var(--bg-card)",
                }}
                activeDot={{
                  fill: "var(--accent-secondary)",
                  r: 7,
                  stroke: "var(--bg-card)",
                  strokeWidth: 2,
                }}
                animationDuration={400}
                isAnimationActive={progressData.length <= 12}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      </div>
    </div>
  );
}

export default InterviewAnalyticsCharts;