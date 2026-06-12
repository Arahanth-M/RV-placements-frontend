import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "../../utils/ThemeContext";
import { deptAvgCtcColor, PLACEMENT_STATS_2026 } from "../../data/placementStats2026";

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

function ChartCard({ title, children, footer }) {
  return (
    <div className="rounded-2xl border border-theme bg-theme-card p-4 sm:p-[18px]">
      <h3 className="mb-3.5 text-[13px] font-medium text-theme-primary">{title}</h3>
      {children}
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
  const { month, offers } = payload[0].payload;
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-theme-primary">{month}</p>
      <p className="text-theme-secondary">{offers} offers</p>
    </div>
  );
}

function CtcTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { range, offers } = payload[0]?.payload || {};
  const pct = Math.round((offers / PLACEMENT_STATS_2026.totalOffers) * 100);
  return (
    <div className="rounded-lg border border-theme bg-theme-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-theme-primary">{range}</p>
      <p className="text-theme-secondary">
        {offers} offers ({pct}%)
      </p>
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

export default function PlacementStatsDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartColors = useMemo(
    () => ({
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      axis: isDark ? "#aaa" : "#666",
      bar: "#378ADD",
      barPpo: "#1D9E75",
      barLate: "#BA7517",
      barTop: "#5DCAA5",
      barTopLead: "#1D9E75",
      pieBorder: isDark ? "#1a1a1a" : "#fff",
    }),
    [isDark],
  );

  const {
    kpis,
    byDepartment,
    ctcDistribution,
    topCompanies,
    monthlyTimeline,
    departmentAvgCtc,
  } = PLACEMENT_STATS_2026;

  const monthlyData = monthlyTimeline.map((row) => ({
    ...row,
    fill:
      row.variant === "ppo"
        ? chartColors.barPpo
        : row.variant === "late"
          ? chartColors.barLate
          : chartColors.bar,
  }));

  const deptAvgChartData = [...departmentAvgCtc]
    .sort((a, b) => a.avgCtc - b.avgCtc)
    .map((row) => ({
      ...row,
      fill: deptAvgCtcColor(row.avgCtc),
    }));

  const topCompaniesData = topCompanies;

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
        >
          <div
            className="w-full"
            style={{ height: Math.max(360, deptAvgChartData.length * 28) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={deptAvgChartData}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                barCategoryGap="18%"
              >
                <CartesianGrid stroke={chartColors.grid} horizontal={false} />
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
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <ChartCard title="Offers by department">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment} margin={{ top: 4, right: 8, left: -12, bottom: 48 }}>
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
                <Tooltip content={<OfferTooltip />} />
                <Bar dataKey="offers" fill={chartColors.bar} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="CTC distribution (offers by range)"
          footer={
            <div className="mt-3 flex flex-wrap gap-2.5 text-[11px] text-theme-secondary">
              {ctcDistribution.map((item) => (
                <span key={item.range} className="inline-flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.range} ({item.offers})
                </span>
              ))}
            </div>
          }
        >
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ctcDistribution}
                  dataKey="offers"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="88%"
                  stroke={chartColors.pieBorder}
                  strokeWidth={2}
                >
                  {ctcDistribution.map((entry) => (
                    <Cell key={entry.range} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CtcTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Top 12 recruiting companies (by offers)">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topCompaniesData}
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
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
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Monthly offer timeline">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -12, bottom: 36 }}>
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
                <Bar dataKey="offers" radius={[3, 3, 0, 0]}>
                  {monthlyData.map((entry) => (
                    <Cell key={entry.month} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
