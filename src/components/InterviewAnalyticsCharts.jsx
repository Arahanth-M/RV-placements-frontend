import React from "react";
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

function InterviewAnalyticsCharts({ skillData, progressData, CustomTooltip }) {
  const axisTick = { fill: "var(--chart-axis-tick)", fontSize: 10 };
  const axisLine = { stroke: "var(--chart-axis-line)" };
  const axisTickLine = { stroke: "var(--chart-axis-line)" };

  return (
    <div className="space-y-6">
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
              <Bar dataKey="score" fill="var(--chart-bar)" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

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
                dot={{ fill: "var(--chart-line-dot)", strokeWidth: 2, r: 5, stroke: "var(--bg-card)" }}
                activeDot={{ fill: "var(--accent-secondary)", r: 7, stroke: "var(--bg-card)", strokeWidth: 2 }}
                animationDuration={400}
                isAnimationActive={progressData.length <= 12}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default InterviewAnalyticsCharts;