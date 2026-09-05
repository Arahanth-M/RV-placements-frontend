import { memo, useMemo } from "react";

function scoreBand(score) {
  if (score >= 85) return { label: "Excellent", tone: "text-emerald-500" };
  if (score >= 75) return { label: "Strong", tone: "text-cyan-500" };
  if (score >= 68) return { label: "Good", tone: "text-amber-500" };
  return { label: "Needs Improvement", tone: "text-rose-500" };
}

function CircularScore({ score }) {
  const safe = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const band = scoreBand(safe);

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ width: 132, height: 132 }}
    >
      <svg
        width="132"
        height="132"
        viewBox="0 0 132 132"
        className="-rotate-90"
        style={{ width: 132, height: 132, display: "block" }}
      >
        <circle cx="66" cy="66" r={radius} className="stroke-theme" strokeWidth="10" fill="transparent" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          className="stroke-theme-accent transition-[stroke-dashoffset] duration-700 ease-out"
          strokeWidth="10"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-bold text-theme-primary">{safe}</p>
        <p className={`text-xs font-semibold uppercase tracking-wide ${band.tone}`}>{band.label}</p>
      </div>
    </div>
  );
}

function Sparkline({ values }) {
  const safeValues = Array.isArray(values)
    ? values
        .map((v) => (Number.isFinite(v) ? Math.max(0, Math.min(100, Number(v))) : null))
        .filter((v) => v != null)
    : [];

  if (safeValues.length < 2) return null;

  const width = 180;
  const height = 44;
  const pad = 6;
  const step = (width - pad * 2) / (safeValues.length - 1);
  const delta = safeValues[safeValues.length - 1] - safeValues[0];
  const stroke = delta >= 0 ? "#22c55e" : "#f43f5e";

  const points = safeValues
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + (1 - v / 100) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="mt-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points} />
      </svg>
    </div>
  );
}

function BreakdownCard({ label, score }) {
  const safe = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  return (
    <div className="rounded-xl border border-theme bg-theme-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-theme-secondary">{label}</p>
        <p className="text-lg font-semibold text-theme-primary">{safe}</p>
      </div>
    </div>
  );
}

function AnalyzePanel({
  analysis,
  isAnalyzing,
  onTipAction,
  previousAnalysis,
  scoreHistory,
  sourceLabel,
}) {
  const breakdown = useMemo(() => {
    const b = analysis?.breakdown || {};
    return [
      { key: "completeness", label: "Completeness", score: b.completeness },
      { key: "structure", label: "Structure", score: b.structure },
      { key: "bulletQuality", label: "Bullet Quality", score: b.bulletQuality },
      { key: "skills", label: "Skills", score: b.skills },
      { key: "professionalism", label: "Professionalism", score: b.professionalism },
    ].filter((item) => item.score != null);
  }, [analysis]);

  const normalizedTips = useMemo(() => {
    const raw = Array.isArray(analysis?.tips) ? analysis.tips : [];
    return raw.map((tip, idx) => {
      if (typeof tip === "string") {
        return {
          id: `tip-${idx}`,
          category: "improvements",
          severity: "medium",
          title: tip,
          message: tip,
          kind: "improvement",
        };
      }
      if (tip && typeof tip === "object") return tip;
      return {
        id: `tip-${idx}`,
        category: "improvements",
        severity: "medium",
        title: String(tip ?? ""),
        message: String(tip ?? ""),
        kind: "improvement",
      };
    });
  }, [analysis]);

  const improvementTips = useMemo(
    () => normalizedTips.filter((t) => t?.kind !== "praise"),
    [normalizedTips]
  );

  const praiseTips = useMemo(
    () => normalizedTips.filter((t) => t?.kind === "praise"),
    [normalizedTips]
  );

  if (!analysis) return null;

  return (
    <section
      className={`mb-4 rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 shadow-sm ${isAnalyzing ? "opacity-70 pointer-events-none" : ""}`}
      aria-busy={isAnalyzing}
      data-tour="resume-ats-score"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-theme-primary">ATS Analysis</h2>
        <p className="text-sm text-theme-secondary">
          {sourceLabel || "Resume readiness score and improvement areas."}
        </p>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-theme bg-theme-app/40 p-4 overflow-hidden" data-tour="resume-ats-score-ring">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-theme-secondary">Overall ATS Score</p>
              <p className="mt-1 text-sm text-theme-secondary">
                Composite score from completeness, structure, impact, and professionalism.
              </p>
              {previousAnalysis?.overallScore != null ? (
                <p className="mt-2 text-xs text-theme-secondary">
                  Previous: <span className="font-semibold">{previousAnalysis.overallScore}</span>{" "}
                  → Now: <span className="font-semibold">{analysis.overallScore}</span>
                </p>
              ) : null}
              <Sparkline values={scoreHistory?.map((h) => h?.overallScore)} />
            </div>
            <div className="lg:ml-auto">
              <CircularScore score={analysis.overallScore} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-theme-primary">Score Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {breakdown.map((item) => (
              <BreakdownCard key={item.key} label={item.label} score={item.score} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-theme bg-theme-app/30 p-3 overflow-hidden">
          <h3 className="mb-2 text-sm font-semibold text-theme-primary">Improvement Checklist</h3>
          {improvementTips.length === 0 ? (
            <p className="text-sm text-theme-secondary">No critical improvement tips right now.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {improvementTips.map((tip, idx) => (
                <li
                  key={tip.id || `${tip.title || "tip"}-${idx}`}
                  className="rounded-lg border border-theme bg-theme-app/30 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-theme-secondary">
                      {tip.category || "improvements"}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        tip.severity === "high"
                          ? "text-rose-500"
                          : tip.severity === "medium"
                            ? "text-amber-500"
                            : "text-theme-secondary"
                      }`}
                    >
                      {String(tip.severity || "medium").toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-theme-primary">{tip.title}</p>
                  <p className="text-xs text-theme-secondary mt-1">{tip.message}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    {Number.isFinite(tip.estimatedDelta) ? (
                      <span className="text-[11px] text-theme-secondary">
                        ~+{tip.estimatedDelta} pts if fixed
                      </span>
                    ) : (
                      <span />
                    )}
                    {onTipAction && (tip.action || tip.section) ? (
                      <button
                        type="button"
                        className="text-xs font-medium text-theme-accent hover:underline"
                        onClick={() => onTipAction(tip)}
                      >
                        {tip.action || "Fix this"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {praiseTips.length > 0 ? (
            <div className="mt-3 border-t border-theme pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Strengths
              </p>
              <ul className="space-y-1 text-sm text-theme-secondary">
                {praiseTips.map((tip) => (
                  <li key={tip.id}>{tip.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default memo(AnalyzePanel);
