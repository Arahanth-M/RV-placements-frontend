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
    name: `Mock Interview ${index + 1}`,
    score: p.score,
    company: p.companyName,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-theme-card border border-theme rounded-lg p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <p className="text-theme-primary font-bold text-sm mb-1">{label}</p>
          {data.company && (
            <p className="text-theme-accent text-[10px] uppercase tracking-wider font-bold mb-2">
              {data.company}
            </p>
          )}
          <div className="flex items-center gap-2 py-1 border-t border-theme/50">
            <div 
              className="w-2.5 h-2.5 rounded-full shadow-sm" 
              style={{ backgroundColor: payload[0].color || payload[0].fill }} 
            />
            <p className="text-theme-secondary text-xs">
              Score: <span className="text-theme-primary font-bold">{payload[0].value}/10</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

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
                animationDuration={200}
              />
              <Bar dataKey="score" fill="var(--chart-bar)" radius={[6, 6, 0, 0]} maxBarSize={40} />
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
                animationDuration={200}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--chart-line)"
                strokeWidth={3}
                dot={{ fill: "var(--chart-line-dot)", strokeWidth: 2, r: 5, stroke: "var(--bg-card)" }}
                activeDot={{ fill: "var(--accent-secondary)", r: 7, stroke: "var(--bg-card)", strokeWidth: 2 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default InterviewAnalytics;
