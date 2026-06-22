import React, { useEffect, useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../utils/ThemeContext";
import { deptAvgCtcColor } from "../../utils/generalStatsChartColors";

function useMinWidth(minWidth) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [minWidth]);

  return matches;
}

function KpiCard({ label, value, sub, valueClassName = "" }) {
  return (
    <div className="rounded-xl bg-theme-hero px-4 py-3.5">
      <p className="text-xs text-theme-secondary">{label}</p>
      <p className={`mt-1.5 text-2xl font-medium leading-none text-theme-primary sm:text-[26px] ${valueClassName}`}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-[11px] text-theme-secondary/80">{sub}</p> : null}
    </div>
  );
}

function ChartAxisLegend({ xLabel, yLabel }) {
  return (
    <div className="mt-2.5 flex flex-col gap-1 border-t border-theme/60 pt-2.5 text-[11px] text-theme-secondary sm:flex-row sm:flex-wrap sm:gap-x-5">
      <p>
        <span className="font-medium text-theme-primary/85">X-axis:</span> {xLabel}
      </p>
      <p>
        <span className="font-medium text-theme-primary/85">Y-axis:</span> {yLabel}
      </p>
    </div>
  );
}

function ChartCard({ title, children, footer, xAxisLabel, yAxisLabel }) {
  return (
    <div className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-[18px]">
      <h3 className="mb-3.5 text-[13px] font-medium text-theme-primary">{title}</h3>
      {children}
      {xAxisLabel && yAxisLabel ? <ChartAxisLegend xLabel={xAxisLabel} yLabel={yAxisLabel} /> : null}
      {footer}
    </div>
  );
}

function OfferTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-theme-primary">{label}</p>
      <p className="text-theme-secondary">{value} offers</p>
    </div>
  );
}

function MonthOfferTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { month, offers, companies } = payload[0].payload;
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-theme-primary">{month}</p>
      <p className="text-theme-secondary">{offers} offers</p>
      <p className="text-theme-secondary">{companies ?? 0} companies</p>
    </div>
  );
}

function BusinessModelRowDetails({ row, ctcColorMap, showCompanies, onToggleCompanies }) {
  const ctcRows = Array.isArray(row.ctcBreakdown) ? row.ctcBreakdown : [];
  const companyRows = Array.isArray(row.companyList) ? row.companyList : [];
  const hasCtc = ctcRows.length > 0;
  const maxCtcOffers = hasCtc ? Math.max(...ctcRows.map((item) => item.offers)) : 0;

  return (
    <div className="border-t border-theme/40 bg-theme-hero/25 px-3 py-2.5">
      {/* {row.ctcRange ? (
        <p className="mb-2 text-sm text-theme-primary">
          <span className="font-semibold">CTC range: </span>
          <span className="text-theme-secondary">{row.ctcRange}</span>
        </p>
      ) : null} */}
      <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-theme-secondary">
          Offers by CTC range
        </p>
        {hasCtc ? (
          <ul className="space-y-1.5">
            {ctcRows.map((item) => (
              <li key={item.range}>
                <div className="mb-0.5 flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-theme-primary">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: ctcColorMap[item.range] || "#378ADD" }}
                    />
                    {item.range}
                  </span>
                  <span className="tabular-nums text-theme-secondary">
                    {item.offers} offers · {item.pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-theme/60">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${maxCtcOffers > 0 ? (item.offers / maxCtcOffers) * 100 : 0}%`,
                      backgroundColor: ctcColorMap[item.range] || "#378ADD",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-theme-secondary">
            CTC breakdown unavailable until the full placement Excel is re-uploaded.
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">
            Recruiting companies
          </p>
          {companyRows.length > 0 ? (
            <button
              type="button"
              onClick={onToggleCompanies}
              className="rounded-md border border-theme/60 bg-theme-card px-2.5 py-1 text-xs font-medium text-theme-primary transition hover:border-indigo-400/50 hover:bg-theme-hero"
            >
              {showCompanies ? "Hide list" : `Show ${companyRows.length} companies`}
            </button>
          ) : null}
        </div>
        {companyRows.length === 0 ? (
          <p className="text-sm text-theme-secondary">No company names available for this row.</p>
        ) : showCompanies ? (
          <ul className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-theme/50 bg-theme-card/80 p-2">
            {companyRows.map((item) => (
              <li
                key={item.company}
                className="flex items-center justify-between gap-3 text-sm text-theme-primary"
              >
                <span className="min-w-0 truncate">{item.company}</span>
                <span className="shrink-0 tabular-nums text-theme-secondary">{item.offers} offers</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-theme-secondary">
            {row.companies} companies · {row.offers} offers total. Use the button above to view names.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}

function BusinessModelSummaryTable({ rows, ctcColorMap = {} }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const [showCompaniesFor, setShowCompaniesFor] = useState(null);

  if (!rows?.length) return null;

  const cellPad = "px-3 py-2";

  const toggleRow = (modelKey) => {
    if (expandedKey === modelKey) {
      setExpandedKey(null);
      setShowCompaniesFor(null);
      return;
    }
    setExpandedKey(modelKey);
    setShowCompaniesFor(null);
  };

  return (
    <div className="overflow-x-auto">
      <p className="mb-1.5 text-xs text-theme-secondary">
        Click a business model row to view CTC breakdown and company names.
      </p>
      <table className="w-full min-w-[560px] table-fixed text-sm">
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-theme/60">
            <th className={`${cellPad} text-left font-semibold text-theme-primary`}>Business model</th>
            <th className={`${cellPad} text-right font-semibold tabular-nums text-theme-primary`}>Recruited</th>
            <th className={`${cellPad} text-right font-semibold tabular-nums text-theme-primary`}>Visited</th>
            <th className={`${cellPad} text-right font-semibold tabular-nums text-theme-primary`}>Offers</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowKey = row.modelKey || row.model;
            const isExpanded = expandedKey === rowKey;

            return (
              <React.Fragment key={rowKey}>
                <tr
                  className={`border-b border-theme/30 text-theme-primary transition-colors ${
                    isExpanded ? "bg-theme-hero/40" : "hover:bg-theme-hero/25"
                  }`}
                >
                  <td className={cellPad}>
                    <button
                      type="button"
                      onClick={() => toggleRow(rowKey)}
                      className="flex w-full items-center gap-2 text-left font-medium text-theme-primary"
                      aria-expanded={isExpanded}
                    >
                      <FaChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-theme-secondary transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                      <span className="min-w-0 truncate">{row.model}</span>
                    </button>
                  </td>
                  <td className={`${cellPad} text-right tabular-nums`}>{row.companies}</td>
                  <td className={`${cellPad} text-right tabular-nums text-theme-secondary`}>
                    {row.hubCompanies ?? "—"}
                  </td>
                  <td className={`${cellPad} text-right tabular-nums`}>{row.offers}</td>
                </tr>
                {isExpanded ? (
                  <tr className="border-b border-theme/30">
                    <td colSpan={4} className="p-0">
                      <BusinessModelRowDetails
                        row={row}
                        ctcColorMap={ctcColorMap}
                        showCompanies={showCompaniesFor === rowKey}
                        onToggleCompanies={() =>
                          setShowCompaniesFor((current) => (current === rowKey ? null : rowKey))
                        }
                      />
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BusinessModelDepartmentTable({ departments = [], rows = [] }) {
  if (!rows.length || !departments.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-theme/60">
            <th className="sticky left-0 z-[1] bg-theme-card pb-1.5 pr-3 text-left font-semibold text-theme-primary">
              Business model
            </th>
            {departments.map((department) => (
              <th
                key={department}
                className="pb-1.5 px-2 text-right font-semibold tabular-nums whitespace-nowrap text-theme-primary"
              >
                {department}
              </th>
            ))}
            <th className="pb-1.5 pl-2 text-right font-semibold tabular-nums text-theme-primary">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.model} className="border-b border-theme/30 text-theme-primary">
              <td className="sticky left-0 z-[1] bg-theme-card py-1.5 pr-3 font-medium whitespace-nowrap">
                {row.model}
              </td>
              {departments.map((department) => (
                <td key={department} className="py-1.5 px-2 text-right tabular-nums">
                  {row.byDepartment?.[department] || 0}
                </td>
              ))}
              <td className="py-1.5 pl-2 text-right font-semibold tabular-nums">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BusinessModelMetaNotes({ meta }) {
  if (!meta) return null;

  return (
    <div className="mt-2 space-y-1 text-xs text-theme-secondary">
      {/* <p>
        <span className="font-medium text-theme-primary/85">Recruited</span> = unique companies
        from this year&apos;s placement Excel linked to that business model.{" "}
        <span className="font-medium text-theme-primary/85">Visited</span> = total companies
        tagged with that model in the database (includes ones that did not recruit this year).
      </p>
      {meta.partial ? (
        <p>
          CTC range and department breakdown need a full Excel re-upload. Recruited counts may
          reflect top recruiters only until then.
        </p>
      ) : null} */}
      {/* {meta.unmatchedCompanies > 0 ? (
        <p>
          {meta.unmatchedCompanies} recruiting companies could not be matched to a hub profile (
          {meta.unmatchedOffers} offers under Not specified). Check company name spelling in Excel
          vs hub.
        </p>
      ) : null} */}
      {meta.unmatchedOffers > 0 && meta.unmatchedCompanies === 0 ? (
        <p>
          {meta.matchedOfferPct}% of offers matched a company profile ({meta.unmatchedOffers}{" "}
          offers grouped as not specified).
        </p>
      ) : null}
    </div>
  );
}

function CtcDeptTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((entry) => Number(entry.value) > 0);
  const total = items.reduce((sum, entry) => sum + Number(entry.value), 0);
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-theme-primary">{label}</p>
      {items.map((entry) => (
        <p key={entry.dataKey} className="text-theme-secondary">
          {entry.dataKey}: {entry.value}
        </p>
      ))}
      <p className="mt-1 border-t border-theme/60 pt-1 text-theme-secondary">{total} offers total</p>
    </div>
  );
}

function CtcTooltip({ active, payload, totalOffers }) {
  if (!active || !payload?.length) return null;
  const { range, offers } = payload[0]?.payload || {};
  const pct = totalOffers > 0 ? Math.round((offers / totalOffers) * 100) : 0;
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-theme-primary">{range}</p>
      <p className="text-theme-secondary">
        {offers} offers ({pct}%)
      </p>
    </div>
  );
}

function DeptPlacementTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { department, offers, students, placementPct } = payload[0].payload;
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-theme-primary">{department}</p>
      {placementPct != null ? (
        <>
          <p className="text-theme-secondary">{placementPct}% placed</p>
          <p className="text-theme-secondary">
            {offers} offers / {students} students
          </p>
        </>
      ) : (
        <p className="text-theme-secondary">{offers} offers</p>
      )}
    </div>
  );
}

function DeptAvgCtcTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-theme-primary">{label}</p>
      <p className="text-theme-secondary">₹{value}L avg CTC</p>
    </div>
  );
}

function chartValueLabelStyle(fill, fontSize = 11) {
  return {
    fill,
    fontSize,
    fontWeight: 600,
  };
}

function DeptPlacementSidePanel({ rows, showPlacementPct = false }) {
  const midpoint = Math.ceil(rows.length / 2);
  const leftCol = rows.slice(0, midpoint);
  const rightCol = rows.slice(midpoint);

  const renderRow = (row) => (
    <div key={row.department} className="leading-tight">
      <p className="text-[11px] font-medium text-theme-primary">{row.department}</p>
      <p className="text-[11px] text-theme-secondary">
        {showPlacementPct && row.placementPct != null ? (
          <>
            <span className="font-medium text-theme-primary">{row.placementPct}%</span>
            {" · "}
          </>
        ) : null}
        {row.offers} placed / {row.students} total
      </p>
    </div>
  );

  return (
    <div className="grid w-full grid-cols-1 gap-y-2 border-t border-theme/60 pt-3 content-start sm:grid-cols-2 sm:gap-x-4 lg:w-[268px] lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
      <div className="flex flex-col gap-2">
        {leftCol.map(renderRow)}
      </div>
      <div className="flex flex-col gap-2">
        {rightCol.map(renderRow)}
      </div>
    </div>
  );
}

function CtcRangeLegend({ ranges }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2.5 text-[10px] text-theme-secondary">
      {ranges.map((item) => (
        <span key={item.range} className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          {item.range}
        </span>
      ))}
    </div>
  );
}

function MonthlyChartLegend({ offersColor, companiesColor, textColor }) {
  return (
    <div
      className="flex justify-center gap-5 pt-1 text-[11px]"
      style={{ color: textColor }}
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: offersColor }}
        />
        Offers
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: companiesColor }}
        />
        Companies
      </span>
    </div>
  );
}

function MonthlyDepartmentStatsPanel({ months, offersColor, companiesColor, monthlyTotalsByMonth = {} }) {
  if (!months?.length) {
    return (
      <p className="py-8 text-center text-sm text-theme-secondary">
        Re-upload the placement statistics Excel to see department-wise offers and companies by month.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {months.map((monthRow) => {
        const departments = monthRow.departments || [];
        const fallback = monthlyTotalsByMonth[monthRow.month];
        const totalOffers =
          monthRow.totalOffers ??
          fallback?.offers ??
          departments.reduce((sum, row) => sum + row.offers, 0);
        const totalCompanies =
          monthRow.totalCompanies ?? fallback?.companies ?? 0;

        return (
          <div
            key={monthRow.month}
            className="min-w-0 w-full max-w-full rounded-lg border border-theme/60 bg-theme-hero/30 px-3 py-2.5 sm:w-fit sm:max-w-none sm:shrink-0"
          >
            <p className="mb-2 text-sm font-semibold text-theme-primary">
              {monthRow.chartLabel || monthRow.month}
            </p>
            <div className="overflow-x-auto sm:overflow-visible">
              <table className="w-full min-w-[220px] table-fixed text-xs sm:w-auto sm:table-auto">
                <thead>
                  <tr className="text-theme-secondary">
                    <th className="pb-1 pr-3 text-left font-medium sm:pr-4">Dept</th>
                    <th
                      className="pb-1 px-2 text-right font-medium tabular-nums"
                      style={{ color: offersColor }}
                    >
                      Offers
                    </th>
                    <th
                      className="pb-1 text-right font-medium tabular-nums"
                      style={{ color: companiesColor }}
                    >
                      Companies
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((row) => (
                    <tr key={row.department} className="border-t border-theme/30 text-theme-primary">
                      <td className="py-1 pr-3 sm:pr-4">{row.department}</td>
                      <td className="py-1 px-2 text-right tabular-nums">{row.offers}</td>
                      <td className="py-1 text-right tabular-nums">{row.companies ?? 0}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-theme/60 font-semibold text-theme-primary">
                    <td className="py-1.5 pr-3 sm:pr-4">Total</td>
                    <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: offersColor }}>
                      {totalOffers}
                    </td>
                    <td className="py-1.5 text-right tabular-nums" style={{ color: companiesColor }}>
                      {totalCompanies}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CtcDistributionSidePanel({ rows = [], total = 0 }) {
  return (
    <div className="grid w-full shrink-0 grid-cols-2 gap-x-3 gap-y-2 border-t border-theme/60 pt-3 sm:w-[172px] sm:flex sm:flex-col sm:gap-2.5 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.offers / total) * 1000) / 10 : 0;
        return (
          <div key={row.range} className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: row.color }}
              />
              <p className="text-[10px] font-medium text-theme-primary">{row.range}</p>
            </div>
            <p className="mt-0.5 pl-4 text-[10px] text-theme-secondary">
              {row.offers} offers · {pct}%
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function PlacementStatsDashboard({ stats }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isLgUp = useMinWidth(1024);
  const showChartValueLabels = isLgUp;

  const chartColors = useMemo(
    () => ({
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      axis: isDark ? "#aaa" : "#666",
      bar: "#378ADD",
      barPpo: "#1D9E75",
      barLate: "#BA7517",
      barTop: "#5DCAA5",
      barTopLead: "#1D9E75",
      barCompanies: isDark ? "#C4B5FD" : "#8B7FD4",
      pieBorder: isDark ? "#1a1a1a" : "#fff",
      chartLabel: isDark ? "#f0f0f0" : "#1a1a1a",
    }),
    [isDark],
  );

  const {
    kpis = {},
    byDepartment = [],
    ctcDistribution = [],
    ctcByDepartment = [],
    businessModelSummary = [],
    businessModelByDepartment = { departments: [], rows: [] },
    businessModelMeta = {},
    topCompanies = [],
    monthlyTimeline = [],
    monthlyByDepartment = [],
    departmentAvgCtc = [],
    totalOffers = 0,
  } = stats ?? {};

  const monthlyData = monthlyTimeline.map((row) => ({
    ...row,
    companies: row.companies ?? 0,
  }));

  const deptAvgChartData = [...departmentAvgCtc]
    .sort((a, b) => a.avgCtc - b.avgCtc)
    .map((row) => ({
      ...row,
      fill: deptAvgCtcColor(row.avgCtc),
    }));

  const topCompaniesData = topCompanies;

  const hasDeptPlacementPct = byDepartment.some((row) => row.placementPct != null);
  const deptChartData = hasDeptPlacementPct
    ? [...byDepartment].filter((row) => row.placementPct != null)
    : [...byDepartment].sort((a, b) => b.offers - a.offers);
  const deptPlacementChartHeight = hasDeptPlacementPct ? (isLgUp ? 280 : 240) : 220;
  const deptBarChartMinWidth = Math.max(320, deptChartData.length * 40);
  const ctcOffersTotal = ctcDistribution.reduce((sum, row) => sum + row.offers, 0);
  const ctcByDepartmentData = Array.isArray(ctcByDepartment) ? ctcByDepartment : [];
  const ctcDeptBarChartMinWidth = Math.max(320, ctcByDepartmentData.length * 40);
  const ctcRangeKeys = useMemo(() => ctcDistribution.map((row) => row.range), [ctcDistribution]);
  const ctcRangeColorMap = useMemo(
    () => Object.fromEntries(ctcDistribution.map((row) => [row.range, row.color])),
    [ctcDistribution],
  );
  const ctcByDeptChartHeight = Math.min(280, Math.max(240, ctcByDepartmentData.length * 12 + 80));
  const businessModelSummaryRows = Array.isArray(businessModelSummary) ? businessModelSummary : [];
  const businessModelDeptRows = Array.isArray(businessModelByDepartment?.rows)
    ? businessModelByDepartment.rows
    : [];
  const businessModelDepartments = Array.isArray(businessModelByDepartment?.departments)
    ? businessModelByDepartment.departments
    : [];
  const monthlyByDepartmentData = Array.isArray(monthlyByDepartment) ? monthlyByDepartment : [];
  const monthlyTotalsByMonth = useMemo(
    () =>
      Object.fromEntries(
        monthlyData.map((row) => [
          row.month,
          { offers: row.offers, companies: row.companies ?? 0 },
        ]),
      ),
    [monthlyData],
  );

  return (
    <div className="pb-2">
      <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Total offers" value={kpis.totalOffers} sub="across all departments" />
        <KpiCard label="Companies recruited" value={kpis.companiesRecruited} sub="unique organisations" />
        <KpiCard label="Highest CTC" value={kpis.highestCtc.value} sub={kpis.highestCtc.note} />
        <KpiCard label="Average CTC" value={kpis.averageCtc.value} sub={kpis.averageCtc.note} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <KpiCard
          label="PPO offers"
          value={kpis.ppoOffers.value}
          sub={kpis.ppoOffers.note}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Campus placements"
          value={kpis.campusPlacements.value}
          sub={kpis.campusPlacements.note}
          valueClassName="text-sky-600 dark:text-sky-400"
        />
        <KpiCard
          label="Offers > ₹30L"
          value={kpis.offersAbove30L.value}
          sub={kpis.offersAbove30L.note}
          valueClassName="text-amber-600 dark:text-amber-400"
        />
      </div>

      <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-theme-secondary">
        Department-wise average CTC
      </p>

      <div className="mb-6">
        <ChartCard
          title={
            <>
              Avg CTC by department{" "}
              <span className="font-normal text-theme-secondary">(weighted by offers)</span>
            </>
          }
          xAxisLabel="Average CTC (₹ lakhs per annum, offer-weighted)"
          yAxisLabel="Department"
        >
          <div
            className="w-full"
            style={{ height: Math.max(360, deptAvgChartData.length * 28) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={deptAvgChartData}
                margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
                barCategoryGap="18%"
              >                <CartesianGrid stroke={chartColors.grid} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 24]}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  tickFormatter={(v) => `₹${v}L`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="department"
                  width={80}
                  interval={0}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DeptAvgCtcTooltip />} />
                <Bar dataKey="avgCtc" radius={[0, 3, 3, 0]}>
                  {deptAvgChartData.map((entry) => (
                    <Cell key={entry.department} fill={entry.fill} />
                  ))}
                  {showChartValueLabels ? (
                    <LabelList
                      dataKey="avgCtc"
                      position="right"
                      formatter={(value) => `₹${value}L`}
                      style={chartValueLabelStyle(chartColors.chartLabel)}
                    />
                  ) : null}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mb-3.5 flex flex-col gap-3.5">
        <ChartCard
          title={
            hasDeptPlacementPct ? (
              <>
                Placement rate by department{" "}
                <span className="font-normal text-theme-secondary">(% of batch placed)</span>
              </>
            ) : (
              "Offers by department"
            )
          }
          xAxisLabel="Department"
          yAxisLabel={
            hasDeptPlacementPct
              ? "Placement rate (% of students with offers)"
              : "Number of placement offers"
          }
        >
          <div
            className={
              hasDeptPlacementPct
                ? "flex flex-col gap-4 lg:flex-row lg:items-start"
                : "block"
            }
          >
            <div
              className="min-w-0 w-full overflow-x-auto pb-1 lg:flex-1 lg:overflow-visible"
            >
              <div
                className="w-full"
                style={{
                  height: deptPlacementChartHeight,
                  minWidth: isLgUp ? undefined : deptBarChartMinWidth,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptChartData}
                    margin={{
                      top: hasDeptPlacementPct && showChartValueLabels ? 20 : 8,
                      right: 8,
                      left: 4,
                      bottom: 48,
                    }}
                  >
                  <CartesianGrid stroke={chartColors.grid} vertical={false} />
                  <XAxis
                    dataKey="department"
                    tick={{ fill: chartColors.axis, fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={56}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartColors.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={hasDeptPlacementPct ? [0, 100] : undefined}
                    tickFormatter={hasDeptPlacementPct ? (value) => `${value}%` : undefined}
                  />
                  <Tooltip
                    content={
                      hasDeptPlacementPct ? <DeptPlacementTooltip /> : <OfferTooltip />
                    }
                  />
                  <Bar
                    dataKey={hasDeptPlacementPct ? "placementPct" : "offers"}
                    fill={chartColors.bar}
                    radius={[3, 3, 0, 0]}
                  >
                    {hasDeptPlacementPct ? (
                      showChartValueLabels ? (
                        <LabelList
                          dataKey="placementPct"
                          position="top"
                          formatter={(value) => `${value}%`}
                          style={chartValueLabelStyle(chartColors.chartLabel, 10)}
                        />
                      ) : null
                    ) : showChartValueLabels ? (
                      <LabelList
                        dataKey="offers"
                        position="top"
                        style={chartValueLabelStyle(chartColors.chartLabel)}
                      />
                    ) : null}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
            {hasDeptPlacementPct ? (
              <DeptPlacementSidePanel
                rows={deptChartData}
                showPlacementPct={!showChartValueLabels}
              />
            ) : null}
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <ChartCard title="CTC distribution (offers by range)">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 flex-1 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ctcDistribution}
                      dataKey="offers"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="84%"
                      stroke={chartColors.pieBorder}
                      strokeWidth={2}
                    >
                      {ctcDistribution.map((entry) => (
                        <Cell key={entry.range} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={(props) => <CtcTooltip {...props} totalOffers={totalOffers} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <CtcDistributionSidePanel rows={ctcDistribution} total={ctcOffersTotal} />
            </div>
          </ChartCard>

          <ChartCard
            title="CTC range by department"
            xAxisLabel="Department"
            yAxisLabel="Number of offers (stacked by CTC range)"
            footer={<CtcRangeLegend ranges={ctcDistribution} />}
          >
            {ctcByDepartmentData.length > 0 ? (
              <div className="overflow-x-auto pb-1 lg:overflow-visible">
                <div
                  className="w-full"
                  style={{
                    height: ctcByDeptChartHeight,
                    minWidth: isLgUp ? undefined : ctcDeptBarChartMinWidth,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ctcByDepartmentData}
                    margin={{ top: 8, right: 8, left: -12, bottom: 48 }}
                  >
                    <CartesianGrid stroke={chartColors.grid} vertical={false} />
                    <XAxis
                      dataKey="department"
                      tick={{ fill: chartColors.axis, fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={56}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: chartColors.axis, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CtcDeptTooltip />} />
                    {ctcRangeKeys.map((range) => (
                      <Bar
                        key={range}
                        dataKey={range}
                        stackId="ctc"
                        fill={ctcRangeColorMap[range]}
                        radius={
                          range === ctcRangeKeys[ctcRangeKeys.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]
                        }
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-theme-secondary">
                Re-upload the placement statistics Excel to see CTC breakdown by department.
              </p>
            )}
          </ChartCard>
        </div>
      </div>

      <div className="mb-3.5 flex flex-col gap-3.5">
        <ChartCard
          title={
            <>
              Business model summary{" "}
              <span className="font-normal text-theme-secondary">(from company profiles)</span>
            </>
          }
        >
          {businessModelSummaryRows.length > 0 ? (
            <>
              <BusinessModelSummaryTable
                rows={businessModelSummaryRows}
                ctcColorMap={ctcRangeColorMap}
              />
              <BusinessModelMetaNotes meta={businessModelMeta} />
            </>
          ) : (
            <p className="py-8 text-center text-sm text-theme-secondary">
              Add business models to company profiles in the placement hub, then upload the
              placement statistics Excel to see this table.
            </p>
          )}
        </ChartCard>

        <ChartCard title="Business model × department (offers)">
          {businessModelDeptRows.length > 0 && businessModelDepartments.length > 0 ? (
            <BusinessModelDepartmentTable
              departments={businessModelDepartments}
              rows={businessModelDeptRows}
            />
          ) : (
            <p className="py-8 text-center text-sm text-theme-secondary">
              Department-wise offer counts by business model appear after a full Excel upload with
              company profile links.
            </p>
          )}
        </ChartCard>
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title={
            <>
              Top 12 recruiting companies{" "}
              <span className="font-normal text-theme-secondary">(PPO + campus offers)</span>
            </>
          }
          xAxisLabel="Total placement offers (PPO and campus combined)"
          yAxisLabel="Company name"
        >
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topCompaniesData}
                margin={{ top: 4, right: showChartValueLabels ? 40 : 8, left: 4, bottom: 4 }}
              >
                <CartesianGrid stroke={chartColors.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="company"
                  width={118}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<OfferTooltip />} />
                <Bar dataKey="offers" radius={[0, 3, 3, 0]}>
                  {topCompaniesData.map((entry, index) => (
                    <Cell
                      key={entry.company}
                      fill={index <= 1 ? chartColors.barTopLead : chartColors.barTop}
                    />
                  ))}
                  {showChartValueLabels ? (
                    <LabelList
                      dataKey="offers"
                      position="right"
                      style={chartValueLabelStyle(chartColors.chartLabel)}
                    />
                  ) : null}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Monthly offers & companies"
          xAxisLabel="Recruitment month or period"
          yAxisLabel="Count (offers and unique companies)"
          footer={
            <MonthlyChartLegend
              offersColor={chartColors.bar}
              companiesColor={chartColors.barCompanies}
              textColor={chartColors.axis}
            />
          }
        >
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: showChartValueLabels ? 24 : 8,
                  right: 8,
                  left: -12,
                  bottom: 8,
                }}
              >
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis
                  dataKey="chartLabel"
                  tick={{ fill: chartColors.axis, fontSize: 10 }}
                  angle={-40}
                  textAnchor="end"
                  height={48}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MonthOfferTooltip />} />
                <Bar
                  dataKey="offers"
                  name="Offers"
                  fill={chartColors.bar}
                  radius={[3, 3, 0, 0]}
                >
                  {showChartValueLabels ? (
                    <LabelList
                      dataKey="offers"
                      position="top"
                      style={chartValueLabelStyle(chartColors.chartLabel, 10)}
                    />
                  ) : null}
                </Bar>
                <Bar
                  dataKey="companies"
                  name="Companies"
                  fill={chartColors.barCompanies}
                  radius={[3, 3, 0, 0]}
                >
                  {showChartValueLabels ? (
                    <LabelList
                      dataKey="companies"
                      position="top"
                      style={chartValueLabelStyle(chartColors.chartLabel, 10)}
                    />
                  ) : null}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mb-3.5">
        <ChartCard title="Offers & companies by department (month-wise)">
          <MonthlyDepartmentStatsPanel
            months={monthlyByDepartmentData}
            offersColor={chartColors.bar}
            companiesColor={chartColors.barCompanies}
            monthlyTotalsByMonth={monthlyTotalsByMonth}
          />
        </ChartCard>
      </div>
    </div>
  );
}
