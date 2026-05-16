import SolutionSyntaxBlock from "./SolutionSyntaxBlock";
import { inferSolutionLanguage } from "../utils/inferSolutionLanguage";

const CODING_ROUND_TYPES = new Set(["dsa"]);

function normalizeRoundType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isCodingRoundType(roundType) {
  const t = normalizeRoundType(roundType);
  return CODING_ROUND_TYPES.has(t) || t.includes("coding");
}

function looksLikeSourceCode(text) {
  const s = String(text || "").trim();
  if (!s || s.length < 8) return false;
  const lang = inferSolutionLanguage(s);
  if (lang !== "markdown") return true;
  return /^\s*(def |class |#include|public class|function |const |let |var |import )/m.test(s);
}

export function isCodingInterviewAnswer(item, roundType) {
  if (!item) return false;
  const strat = String(item.evaluationStrategy || "").toLowerCase();
  if (strat === "code_execution") return true;
  const mode = String(item.evaluationTrace?.expectedAnswerMode || "").toLowerCase();
  if (mode === "code") return true;
  if (Array.isArray(item.supportedCodingLanguages) && item.supportedCodingLanguages.length > 0) {
    return true;
  }
  if (isCodingRoundType(roundType) && looksLikeSourceCode(item.answer)) return true;
  return looksLikeSourceCode(item.answer) && /[;{}]/.test(String(item.answer || ""));
}

function CodeExecutionStats({ execution }) {
  if (!execution || typeof execution !== "object") return null;
  const total = Number(execution.totalCount);
  const passed = Number(execution.passedCount);
  if (!Number.isFinite(total) || total < 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-theme bg-theme-card/80 px-3 py-2 text-xs text-theme-secondary">
      <p className="font-semibold text-theme-primary mb-1">Automated tests</p>
      <p className="tabular-nums">
        <span className="text-theme-muted">Passed — </span>
        <span className="font-medium text-theme-primary">
          {Number.isFinite(passed) ? passed : "—"}/{total}
        </span>
        {Number.isFinite(Number(execution.visibleTotalCount)) ? (
          <>
            {" "}
            <span className="text-theme-muted">· Visible </span>
            {execution.visiblePassedCount}/{execution.visibleTotalCount}
          </>
        ) : null}
        {Number.isFinite(Number(execution.hiddenTotalCount)) ? (
          <>
            {" "}
            <span className="text-theme-muted">· Hidden </span>
            {execution.hiddenPassedCount}/{execution.hiddenTotalCount}
          </>
        ) : null}
      </p>
    </div>
  );
}

/** Question + answer block for interview history (coding answers use syntax highlighting). */
export function InterviewQuestionAnswerBlock({ item, roundType }) {
  const answerText = String(item?.answer || "").trim();
  const isCoding = isCodingInterviewAnswer(item, roundType);
  const execution = item?.evaluationTrace?.execution;

  return (
    <div className="p-3 rounded-md border border-theme bg-theme-input space-y-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted mb-1">
          Question
        </p>
        <p className="text-theme-primary whitespace-pre-wrap leading-relaxed text-sm">
          {item?.question || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted mb-1">
          Your answer
        </p>
        {!answerText ? (
          <p className="text-theme-secondary text-sm">N/A</p>
        ) : isCoding ? (
          <div className="rounded-xl border border-theme bg-theme-card overflow-hidden">
            <div className="px-3 py-2 border-b border-theme bg-theme-input/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-theme-accent uppercase tracking-wide">
                Code submission
              </span>
              <span className="text-[10px] text-theme-muted font-mono">
                {inferSolutionLanguage(answerText)}
              </span>
            </div>
            <SolutionSyntaxBlock code={answerText} />
          </div>
        ) : (
          <p className="text-theme-secondary whitespace-pre-wrap leading-relaxed text-sm">
            {answerText}
          </p>
        )}
        {isCoding ? <CodeExecutionStats execution={execution} /> : null}
      </div>

      <p className="text-theme-secondary text-sm">
        <span className="font-semibold text-theme-primary">Feedback:</span>{" "}
        <span className="whitespace-pre-wrap">{item?.feedback || "N/A"}</span>
      </p>
      <p className="text-theme-secondary text-sm tabular-nums">
        <span className="font-semibold text-theme-primary">Score:</span>{" "}
        {typeof item?.score === "number" ? `${item.score}/10` : "N/A"}
      </p>
    </div>
  );
}

export function resolveReadinessFromFinalReport(finalReport) {
  if (!finalReport || typeof finalReport !== "object") {
    return { score: null, label: null, verdict: null };
  }

  let score =
    typeof finalReport.readinessScore === "number" && Number.isFinite(finalReport.readinessScore)
      ? Math.round(finalReport.readinessScore)
      : null;

  if (
    score == null &&
    typeof finalReport.overallScore === "number" &&
    Number.isFinite(finalReport.overallScore)
  ) {
    score = Math.max(0, Math.min(100, Math.round(finalReport.overallScore * 10)));
  }

  const verdict = String(finalReport.verdict || "").trim().toLowerCase() || null;

  let label = String(finalReport.readinessLabel || "").trim() || null;
  if (!label && verdict) {
    if (verdict === "ready") label = "Ready";
    else if (verdict === "not_ready") label = "Not ready";
    else if (verdict === "needs_improvement") label = "Needs improvement";
  }
  if (!label && score != null) {
    if (score >= 80) label = "Ready";
    else if (score >= 60) label = "Needs improvement";
    else label = "Not ready";
  }

  return { score, label, verdict };
}

function readinessTone(verdict, score) {
  if (verdict === "ready" || (score != null && score >= 80)) {
    return {
      ring: "border-emerald-500/50",
      fill: "bg-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
    };
  }
  if (verdict === "not_ready" || (score != null && score < 60)) {
    return {
      ring: "border-red-500/40",
      fill: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      bar: "bg-red-500",
    };
  }
  return {
    ring: "border-theme-accent/40",
    fill: "bg-theme-accent/10",
    text: "text-theme-accent",
    bar: "bg-theme-accent",
  };
}

/** Company-specific readiness at end of final summary. */
export function CompanyInterviewReadinessCard({ companyName, finalReport }) {
  const { score, label, verdict } = resolveReadinessFromFinalReport(finalReport);
  if (score == null && !label) return null;

  const tone = readinessTone(verdict, score);
  const company = String(companyName || "this company").trim() || "this company";

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 ${tone.ring} ${tone.fill}`}
      aria-label={`Interview readiness for ${company}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
        Company readiness
      </p>
      <p className="mt-1 text-sm text-theme-secondary">
        Your readiness for <span className="font-semibold text-theme-primary">{company}</span>
      </p>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {score != null ? (
          <div className="flex items-baseline gap-1 shrink-0">
            <span className={`text-4xl font-bold tabular-nums ${tone.text}`}>{score}</span>
            <span className="text-lg font-medium text-theme-muted">/100</span>
          </div>
        ) : null}
        <div className="flex-1 min-w-0 space-y-2">
          {label ? (
            <p className={`text-base font-semibold ${tone.text}`}>{label}</p>
          ) : null}
          {score != null ? (
            <div className="h-2 rounded-full bg-theme-input overflow-hidden border border-theme/60">
              <div
                className={`h-full rounded-full transition-all ${tone.bar}`}
                style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
              />
            </div>
          ) : null}
          {typeof finalReport?.overallScore === "number" ? (
            <p className="text-xs text-theme-muted tabular-nums">
              Session average: {finalReport.overallScore}/10
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
