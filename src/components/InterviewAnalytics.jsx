import React, { useEffect, useState } from "react";
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
import { interviewAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";

function InterviewAnalytics() {
  const { user } = useAuth();
  const [skillBreakdown, setSkillBreakdown] = useState({});
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    interviewAPI
      .getUserAnalytics(user.userId)
      .then((res) => {
        setSkillBreakdown(res.data.skillBreakdown || {});
        setProgress(res.data.progress || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <p className="text-sm text-theme-secondary py-2" aria-live="polite">
        Loading analytics…
      </p>
    );
  }

  const skillData = Object.entries(skillBreakdown).map(([key, value]) => ({
    skill: key,
    score: value,
  }));

  const progressData = progress.map((p, index) => ({
    name: `Interview ${index + 1}`,
    score: p.score,
  }));

  const tooltipStyles = {
    contentStyle: {
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      color: "var(--text-primary)",
      boxShadow: "var(--shadow-soft)",
    },
    labelStyle: { color: "var(--text-primary)", fontWeight: 600 },
    itemStyle: { color: "var(--text-secondary)" },
    wrapperStyle: { outline: "none" },
  };

  const axisTick = { fill: "var(--chart-axis-tick)", fontSize: 12 };
  const axisLine = { stroke: "var(--chart-axis-line)" };
  const axisTickLine = { stroke: "var(--chart-axis-line)" };

  return (
    <div className="space-y-6">
      <section className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-theme-primary mb-4">
          Skill Breakdown
        </h2>
        <div className="w-full h-[280px] sm:h-[300px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="skill"
                tick={axisTick}
                tickLine={axisTickLine}
                axisLine={axisLine}
              />
              <YAxis
                domain={[0, 10]}
                tick={axisTick}
                tickLine={axisTickLine}
                axisLine={axisLine}
                width={36}
              />
              <Tooltip {...tooltipStyles} />
              <Bar dataKey="score" fill="var(--chart-bar)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-theme-card border border-theme rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-theme-primary mb-4">
          Progress Over Time
        </h2>
        <div className="w-full h-[280px] sm:h-[300px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={axisTick}
                tickLine={axisTickLine}
                axisLine={axisLine}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 10]}
                tick={axisTick}
                tickLine={axisTickLine}
                axisLine={axisLine}
                width={36}
              />
              <Tooltip {...tooltipStyles} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--chart-line)"
                strokeWidth={2}
                dot={{ fill: "var(--chart-line-dot)", strokeWidth: 0, r: 4 }}
                activeDot={{ fill: "var(--accent-secondary)", r: 6, stroke: "var(--bg-card)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default InterviewAnalytics;
