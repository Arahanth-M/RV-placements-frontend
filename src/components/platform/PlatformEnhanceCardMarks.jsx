import {
  listEnhanceFieldMarks,
  loadPlatformEnhanceCompletion,
} from "../../utils/platformEnhanceCompletion.js";

function FieldMark({ mark }) {
  if (mark.complete) {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700"
        title={`${mark.label} enhance complete`}
      >
        <span aria-hidden="true">✓</span>
        {mark.label}
      </span>
    );
  }

  if (mark.remaining > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-amber-500/45 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800"
        title={`${mark.label}: ${mark.passed} passed, ${mark.remaining} remaining`}
      >
        {mark.label}
        <span className="normal-case tracking-normal tabular-nums">
          {mark.passed}✓ · {mark.remaining} left
        </span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-theme bg-theme-input px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-theme-secondary"
      title={`${mark.label} enhance in progress`}
    >
      {mark.label}
    </span>
  );
}

function ScopeRow({ title, marks }) {
  if (!Array.isArray(marks) || marks.length < 1) return null;
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-theme-secondary">
        {title}
      </p>
      <div className="flex flex-wrap gap-1">
        {marks.map((mark) => (
          <FieldMark key={mark.field} mark={mark} />
        ))}
      </div>
    </div>
  );
}

/**
 * Platform-admin only: which OA / Interview enhance fields are done, under focus areas.
 */
export default function PlatformEnhanceCardMarks({ company }) {
  const companyId = company?._id;
  const oaMarks = listEnhanceFieldMarks(
    loadPlatformEnhanceCompletion(companyId, "oa", company?.platformEnhanceCompletion)
  );
  const interviewMarks = listEnhanceFieldMarks(
    loadPlatformEnhanceCompletion(
      companyId,
      "interview",
      company?.platformEnhanceCompletion
    )
  );
  if (oaMarks.length < 1 && interviewMarks.length < 1) return null;

  return (
    <div
      className="mt-2 flex flex-col gap-2"
      data-testid="platform-enhance-card-marks"
      aria-label="Enhance progress by field"
    >
      <ScopeRow title="OA enhanced" marks={oaMarks} />
      <ScopeRow title="Interview enhanced" marks={interviewMarks} />
    </div>
  );
}
