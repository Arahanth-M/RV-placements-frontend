import React, { useCallback, useEffect, useMemo, useState } from "react";
import { interviewAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import InterviewAnalyticsCharts from "./InterviewAnalyticsCharts";

function InterviewAnalytics() {
  const { user } = useAuth();
  const [skillBreakdown, setSkillBreakdown] = useState({});
  const [progress, setProgress] = useState([]);
  const [companyBreakdown, setCompanyBreakdown] = useState([]);
  const [roundTypeDetail, setRoundTypeDetail] = useState([]);
  const [readinessRows, setReadinessRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    if (user?.betaAccess === false) {
      setLoading(false);
      return;
    }

    setLoading(true);
    interviewAPI
      .getUserAnalytics(user.userId)
      .then((res) => {
        setSkillBreakdown(res.data.skillBreakdown || {});
        setProgress(Array.isArray(res.data.progress) ? res.data.progress : []);
        setCompanyBreakdown(Array.isArray(res.data.companyBreakdown) ? res.data.companyBreakdown : []);
        setRoundTypeDetail(Array.isArray(res.data.roundTypeDetail) ? res.data.roundTypeDetail : []);
        setReadinessRows(Array.isArray(res.data.readinessRows) ? res.data.readinessRows : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.userId, user?.betaAccess]);

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-theme-card border border-theme rounded-lg p-3 shadow-2xl">
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
  }, []);

  const skillData = useMemo(
    () =>
      Object.entries(skillBreakdown).map(([key, value]) => ({
        skill: key,
        score: value,
      })),
    [skillBreakdown]
  );

  const progressData = useMemo(
    () =>
      progress.map((p, index) => ({
        name: `Mock Interview ${index + 1}`,
        score: p.score,
        company: p.companyName,
        role: p.role || null,
        totalRounds: p.totalRounds ?? null,
        roundTypes: Array.isArray(p.roundTypes) ? p.roundTypes : [],
        questionsAnswered: p.questionsAnswered ?? null,
        readinessScore: p.readinessScore ?? null,
        readinessLabel: p.readinessLabel || null,
      })),
    [progress]
  );

  if (loading) {
    return (
      <p className="text-sm text-theme-secondary py-2" aria-live="polite">
        Loading analytics…
      </p>
    );
  }

  return (
    <InterviewAnalyticsCharts
      skillData={skillData}
      progressData={progressData}
      companyBreakdown={companyBreakdown}
      roundTypeDetail={roundTypeDetail}
      readinessRows={readinessRows}
      CustomTooltip={CustomTooltip}
    />
  );
}

export default InterviewAnalytics;
