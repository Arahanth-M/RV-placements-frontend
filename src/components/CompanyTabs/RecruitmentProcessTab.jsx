import React, { useEffect, useMemo, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { DEFAULT_PLACEMENT_DETAIL_YEAR } from "../../constants/placementYears.js";
import { adminAPI, adminCompanyVisitOpts } from "../../utils/api";
import SpcThemeSelect from "../SpcThemeSelect.jsx";
import {
  emptyRecruitmentProcessForm,
  getRecruitmentProcessSubmitter,
  isRecruitmentProcessEmpty,
  normalizeRecruitmentProcess,
  OA_ASSESSMENT_MODE_OPTIONS,
  oaAssessmentModeLabel,
  RECRUITMENT_ROUND_TYPE_OPTIONS,
  recruitmentProcessToForm,
  recruitmentRoundTypeLabel,
  validateRecruitmentProcessForm,
} from "../../utils/recruitmentProcess.js";

const inputClass =
  "w-full rounded-lg border border-theme bg-theme-input px-3 py-2 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent";
const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-theme-muted mb-1.5";

function YesNoToggle({ value, onChange, disabled }) {
  return (
    <div className="flex gap-2">
      {[
        { id: true, label: "Yes" },
        { id: false, label: "No" },
      ].map(({ id, label }) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onChange(id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            value === id
              ? "bg-theme-accent text-white"
              : "border border-theme bg-theme-card text-theme-secondary hover:bg-theme-nav"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CountBadge({ attended, cleared }) {
  return (
    <p className="text-sm text-theme-muted mt-1">
      <span className="text-theme-secondary font-medium">{attended}</span> attended ·{" "}
      <span className="text-theme-accent font-semibold">{cleared}</span> cleared
    </p>
  );
}

function TimelineStep({ title, subtitle, children, isLast = false }) {
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast ? (
        <span
          className="absolute left-[11px] top-6 bottom-0 w-px bg-theme-accent/30"
          aria-hidden
        />
      ) : null}
      <div className="relative z-[1] mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-theme-accent bg-theme-card" />
      <div className="min-w-0 flex-1 rounded-xl border border-theme bg-theme-input/30 p-4 shadow-sm">
        <h3 className="text-base font-semibold text-theme-accent">{title}</h3>
        {subtitle ? <p className="text-sm text-theme-muted mt-0.5">{subtitle}</p> : null}
        {children ? (
          <div className="mt-3 text-theme-secondary text-sm leading-relaxed">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

function RecruitmentProcessSubmitter({ process }) {
  const submitter = getRecruitmentProcessSubmitter(process);
  if (!submitter) return null;

  return (
    <div className="mt-6 pt-5 border-t border-theme">
      <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted mb-2">
        Submitted by
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {submitter.name ? (
          <div>
            <dt className="text-theme-muted text-xs uppercase tracking-wide">Name</dt>
            <dd className="mt-0.5 font-medium text-theme-primary">{submitter.name}</dd>
          </div>
        ) : null}
        {submitter.email ? (
          <div>
            <dt className="text-theme-muted text-xs uppercase tracking-wide">Email</dt>
            <dd className="mt-0.5 font-medium text-theme-primary break-all">{submitter.email}</dd>
          </div>
        ) : null}
        {submitter.usn ? (
          <div>
            <dt className="text-theme-muted text-xs uppercase tracking-wide">USN</dt>
            <dd className="mt-0.5 font-medium text-theme-primary">{submitter.usn}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function RecruitmentProcessTimeline({ process }) {
  const data = normalizeRecruitmentProcess(process);
  if (!data) return null;

  const { onlineAssessment: oa, rounds } = data;
  const visibleRounds = rounds.filter((r) => r.occurred === true);
  const steps = [];

  if (oa?.occurred === true) {
    const modeLabel = oaAssessmentModeLabel(oa.mode);
    steps.push({
      key: "oa",
      title: "Online Assessment",
      subtitle: modeLabel ? `${modeLabel} mode` : "Pre-interview screening",
      body: (
        <>
          {modeLabel ? (
            <p>
              <span className="font-medium text-theme-primary">Mode: </span>
              {modeLabel}
            </p>
          ) : null}
          {oa.topics ? (
            <p>
              <span className="font-medium text-theme-primary">Topics: </span>
              {oa.topics}
            </p>
          ) : null}
          <CountBadge attended={oa.attended ?? 0} cleared={oa.cleared ?? 0} />
        </>
      ),
    });
  }

  visibleRounds.forEach((round) => {
    const modeLabel = oaAssessmentModeLabel(round.mode);
    const typeLabel = recruitmentRoundTypeLabel(round.type, round.otherTypeLabel);
    steps.push({
      key: `round-${round.roundNumber}`,
      title: `Round ${round.roundNumber}`,
      subtitle: modeLabel ? `${typeLabel} · ${modeLabel} mode` : typeLabel,
      body: (
        <>
          {modeLabel ? (
            <p>
              <span className="font-medium text-theme-primary">Mode: </span>
              {modeLabel}
            </p>
          ) : null}
          <CountBadge attended={round.attended ?? 0} cleared={round.cleared ?? 0} />
        </>
      ),
    });
  });

  return (
    <div className="mt-2">
      {steps.map((step, index) => (
        <TimelineStep
          key={step.key}
          title={step.title}
          subtitle={step.subtitle}
          isLast={index === steps.length - 1}
        >
          {step.body}
        </TimelineStep>
      ))}
      <RecruitmentProcessSubmitter process={process} />
    </div>
  );
}

function RecruitmentProcessEditor({ form, setForm, disabled }) {
  const updateOa = (patch) => {
    setForm((prev) => ({
      ...prev,
      onlineAssessment: { ...prev.onlineAssessment, ...patch },
    }));
  };

  const updateRound = (index, patch) => {
    setForm((prev) => {
      const rounds = [...prev.rounds];
      rounds[index] = { ...rounds[index], ...patch, roundNumber: index + 1 };
      return { ...prev, rounds };
    });
  };

  const addRound = () => {
    setForm((prev) => ({
      ...prev,
      rounds: [
        ...prev.rounds,
        {
          roundNumber: prev.rounds.length + 1,
          occurred: false,
          type: "technical",
          mode: "online",
          otherTypeLabel: "",
          attended: "",
          cleared: "",
        },
      ],
    }));
  };

  const removeRound = (index) => {
    setForm((prev) => {
      if (prev.rounds.length <= 1) return prev;
      const rounds = prev.rounds
        .filter((_, i) => i !== index)
        .map((r, i) => ({ ...r, roundNumber: i + 1 }));
      return { ...prev, rounds };
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-theme bg-theme-input/20 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-theme-accent">Online Assessment</h3>
        <div>
          <span className={labelClass}>Was there an online assessment?</span>
          <YesNoToggle
            value={form.onlineAssessment.occurred}
            onChange={(occurred) => updateOa({ occurred })}
            disabled={disabled}
          />
        </div>
        {form.onlineAssessment.occurred ? (
          <div className="space-y-3 pl-1 border-l-2 border-theme-accent/30 ml-1">
            <div>
              <label className={labelClass} id="rp-oa-mode-label" htmlFor="rp-oa-mode">
                Assessment mode
              </label>
              <SpcThemeSelect
                id="rp-oa-mode"
                name="oaMode"
                value={form.onlineAssessment.mode || "online"}
                onChange={(e) => updateOa({ mode: e.target.value })}
                options={OA_ASSESSMENT_MODE_OPTIONS}
                labelId="rp-oa-mode-label"
                disabled={disabled}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="rp-oa-topics">
                Topics covered
              </label>
              <textarea
                id="rp-oa-topics"
                value={form.onlineAssessment.topics}
                onChange={(e) => updateOa({ topics: e.target.value })}
                className={`${inputClass} min-h-[80px]`}
                placeholder="e.g. DSA, aptitude, SQL..."
                disabled={disabled}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="rp-oa-attended">
                  Attended
                </label>
                <input
                  id="rp-oa-attended"
                  type="number"
                  min={0}
                  value={form.onlineAssessment.attended}
                  onChange={(e) => updateOa({ attended: e.target.value })}
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="rp-oa-cleared">
                  Cleared
                </label>
                <input
                  id="rp-oa-cleared"
                  type="number"
                  min={0}
                  value={form.onlineAssessment.cleared}
                  onChange={(e) => updateOa({ cleared: e.target.value })}
                  className={inputClass}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-theme-accent">Interview Rounds</h3>
          <button
            type="button"
            onClick={addRound}
            disabled={disabled || form.rounds.length >= 20}
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-accent/50 px-3 py-1.5 text-xs font-semibold text-theme-accent hover:bg-theme-accent/10 disabled:opacity-50"
          >
            <FaPlus className="h-3 w-3" />
            Add Round
          </button>
        </div>

        {form.rounds.map((round, index) => (
          <div
            key={`round-form-${index}`}
            className="rounded-xl border border-theme bg-theme-input/20 p-4 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-theme-primary">Round {index + 1}</h4>
              {form.rounds.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRound(index)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-md border border-red-400/50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <FaTrash className="h-3 w-3" />
                  Remove
                </button>
              ) : null}
            </div>

            <div>
              <span className={labelClass}>Was this round conducted?</span>
              <YesNoToggle
                value={round.occurred}
                onChange={(occurred) => updateRound(index, { occurred })}
                disabled={disabled}
              />
            </div>

            {round.occurred ? (
              <div className="space-y-3 pl-1 border-l-2 border-theme-accent/30 ml-1">
                <div>
                  <label
                    className={labelClass}
                    id={`rp-round-type-label-${index}`}
                    htmlFor={`rp-round-type-${index}`}
                  >
                    Round type
                  </label>
                  <SpcThemeSelect
                    id={`rp-round-type-${index}`}
                    name={`roundType-${index}`}
                    value={round.type}
                    onChange={(e) => updateRound(index, { type: e.target.value })}
                    options={RECRUITMENT_ROUND_TYPE_OPTIONS}
                    labelId={`rp-round-type-label-${index}`}
                    disabled={disabled}
                    required
                  />
                </div>
                {round.type === "other" ? (
                  <div>
                    <label className={labelClass} htmlFor={`rp-round-other-${index}`}>
                      Describe round type
                    </label>
                    <input
                      id={`rp-round-other-${index}`}
                      type="text"
                      value={round.otherTypeLabel}
                      onChange={(e) => updateRound(index, { otherTypeLabel: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. HR + culture fit"
                      disabled={disabled}
                    />
                  </div>
                ) : null}
                <div>
                  <label
                    className={labelClass}
                    id={`rp-round-mode-label-${index}`}
                    htmlFor={`rp-round-mode-${index}`}
                  >
                    Round mode
                  </label>
                  <SpcThemeSelect
                    id={`rp-round-mode-${index}`}
                    name={`roundMode-${index}`}
                    value={round.mode || "online"}
                    onChange={(e) => updateRound(index, { mode: e.target.value })}
                    options={OA_ASSESSMENT_MODE_OPTIONS}
                    labelId={`rp-round-mode-label-${index}`}
                    disabled={disabled}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor={`rp-round-attended-${index}`}>
                      Attended
                    </label>
                    <input
                      id={`rp-round-attended-${index}`}
                      type="number"
                      min={0}
                      value={round.attended}
                      onChange={(e) => updateRound(index, { attended: e.target.value })}
                      className={inputClass}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`rp-round-cleared-${index}`}>
                      Cleared
                    </label>
                    <input
                      id={`rp-round-cleared-${index}`}
                      type="number"
                      min={0}
                      value={round.cleared}
                      onChange={(e) => updateRound(index, { cleared: e.target.value })}
                      className={inputClass}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}

function RecruitmentProcessTab({
  company = {},
  placementYear = DEFAULT_PLACEMENT_DETAIL_YEAR,
  placementListContext,
  placementCompanyVisitId,
  placementCluster,
  canManage = false,
  onCompanyUpdate,
}) {
  const stored = company.recruitment_process;
  const storedKey = useMemo(
    () => JSON.stringify(stored ?? null),
    [stored]
  );
  const hasProcess = useMemo(() => !isRecruitmentProcessEmpty(stored), [stored]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => recruitmentProcessToForm(stored));
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setEditing(false);
    setForm(recruitmentProcessToForm(company.recruitment_process));
    setFeedback(null);
  }, [placementYear, company?._id, company?.placementCompanyVisitId, storedKey]);

  const adminOpts = adminCompanyVisitOpts({
    placementYear,
    placementListContext,
    placementCompanyVisitId: placementCompanyVisitId || company?.placementCompanyVisitId,
    placementCluster,
  });

  const startEdit = () => {
    setForm(recruitmentProcessToForm(stored));
    setEditing(true);
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(recruitmentProcessToForm(stored));
    setFeedback(null);
  };

  const handleSave = async () => {
    const validated = validateRecruitmentProcessForm(form);
    if (!validated.ok) {
      setFeedback({ variant: "error", message: validated.error });
      return;
    }
    try {
      setActionLoading(true);
      await adminAPI.updateRecruitmentProcess(company._id, validated.payload, adminOpts);
      setEditing(false);
      setFeedback({ variant: "success", message: "Recruitment process saved." });
      if (typeof onCompanyUpdate === "function") await onCompanyUpdate();
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: "error",
        message: err?.response?.data?.error || "Failed to save recruitment process.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    const ok = window.confirm("Remove the entire recruitment process for this company visit?");
    if (!ok) return;
    try {
      setActionLoading(true);
      await adminAPI.deleteRecruitmentProcess(company._id, adminOpts);
      setEditing(false);
      setForm(emptyRecruitmentProcessForm());
      setFeedback({ variant: "success", message: "Recruitment process removed." });
      if (typeof onCompanyUpdate === "function") await onCompanyUpdate();
    } catch (err) {
      console.error(err);
      setFeedback({
        variant: "error",
        message: err?.response?.data?.error || "Failed to remove recruitment process.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-theme-primary">
      <div className="bg-theme-card border border-theme rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-theme-accent">Recruitment Process</h2>
            <p className="mt-1 text-xs text-theme-muted">
              Placement cycle{" "}
              <span className="font-semibold text-theme-secondary">{placementYear}</span>
              {company?.placementCompanyVisitId ? (
                <span className="hidden sm:inline"> · visit-specific data for this hub/year</span>
              ) : null}
            </p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {!editing ? (
                <>
                  <button
                    type="button"
                    onClick={startEdit}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent px-3 py-2 text-xs sm:text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <FaEdit className="h-3.5 w-3.5" />
                    {hasProcess ? "Edit Process" : "Add Process"}
                  </button>
                  {hasProcess ? (
                    <button
                      type="button"
                      onClick={handleDeleteAll}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/60 px-3 py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                      Delete All
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={actionLoading}
                    className="rounded-lg bg-theme-accent px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {actionLoading ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={actionLoading}
                    className="rounded-lg border border-theme bg-theme-card px-4 py-2 text-xs sm:text-sm font-semibold text-theme-secondary hover:bg-theme-nav disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>

        {feedback ? (
          <p
            className={`mb-4 text-sm ${
              feedback.variant === "error" ? "text-red-600" : "text-emerald-600"
            }`}
            role="status"
          >
            {feedback.message}
          </p>
        ) : null}

        {editing && canManage ? (
          <RecruitmentProcessEditor form={form} setForm={setForm} disabled={actionLoading} />
        ) : hasProcess ? (
          <RecruitmentProcessTimeline process={stored} />
        ) : (
          <div className="rounded-xl border border-dashed border-theme bg-theme-input/20 px-4 py-10 text-center">
            <p className="text-theme-primary font-medium">Not added yet</p>
            <p className="text-theme-muted text-sm mt-2">
              {canManage
                ? "Use Add Process to document the hiring pipeline for this company."
                : "SPC will add the recruitment process for this company soon."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecruitmentProcessTab;
