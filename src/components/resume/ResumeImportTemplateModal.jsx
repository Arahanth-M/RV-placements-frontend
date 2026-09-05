import { RESUME_TEMPLATE_IDS } from "./defaultDraft";

/**
 * Choose Standard ATS vs IIITV LaTeX Style before opening an uploaded resume in the editor.
 */
export default function ResumeImportTemplateModal({ open, onClose, onChoose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-import-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-theme bg-theme-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="resume-import-title" className="text-lg font-semibold text-theme-primary">
          Choose a format
        </h2>
        <p className="mt-1 text-sm text-theme-secondary">
          This platform supports two resume formats. Your uploaded file will open in the editor
          using the one you pick. The original layout will not be kept.
        </p>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            className="rounded-xl border border-theme bg-theme-app/40 px-4 py-3 text-left transition-colors hover:border-theme-accent/60 hover:bg-theme-hero/50"
            onClick={() => onChoose(RESUME_TEMPLATE_IDS.ATS)}
          >
            <span className="block text-sm font-semibold text-theme-primary">Standard ATS</span>
            <span className="mt-0.5 block text-xs text-theme-secondary">
              Recruiter-friendly single-column layout
            </span>
          </button>
          <button
            type="button"
            className="rounded-xl border border-theme bg-theme-app/40 px-4 py-3 text-left transition-colors hover:border-theme-accent/60 hover:bg-theme-hero/50"
            onClick={() => onChoose(RESUME_TEMPLATE_IDS.IIITV)}
          >
            <span className="block text-sm font-semibold text-theme-primary">IIITV LaTeX Style</span>
            <span className="mt-0.5 block text-xs text-theme-secondary">
              Compact academic look inspired by LaTeX resumes
            </span>
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm font-medium text-theme-secondary hover:text-theme-primary"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
