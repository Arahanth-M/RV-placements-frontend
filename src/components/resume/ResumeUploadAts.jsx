import { useRef } from "react";
import { FaFileUpload, FaCheck } from "react-icons/fa";

/**
 * Dedicated upload step for the Score your resume tab. File is not saved.
 */
export default function ResumeUploadAts({
  quota,
  isUploading,
  fileName,
  onFileChosen,
  onScore,
  disabled,
}) {
  const inputRef = useRef(null);
  const remaining = Number.isFinite(quota?.remaining) ? quota.remaining : null;
  const usedUp = remaining === 0;

  return (
    <section className="rounded-2xl border border-theme bg-theme-card p-5 sm:p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-theme-primary">Upload your resume</h2>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          onFileChosen?.(file);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        className="mt-6 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-theme bg-theme-app/40 px-4 py-10 text-center transition-colors hover:border-theme-accent/60 hover:bg-theme-hero/40 disabled:opacity-60"
        disabled={disabled || isUploading || usedUp}
        onClick={() => inputRef.current?.click()}
      >
        <FaFileUpload className="h-8 w-8 text-theme-accent" aria-hidden />
        <span className="text-sm font-semibold text-theme-primary">
          {fileName ? "Choose a different file" : "Click to choose a resume"}
        </span>
        <span className="text-xs text-theme-secondary">Accepted: .pdf, .docx</span>
      </button>

      {fileName ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-theme-primary">
          <FaCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
          <span className="min-w-0 truncate">{fileName}</span>
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="resume-accent-btn inline-flex items-center justify-center rounded-md bg-theme-accent px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          disabled={disabled || isUploading || usedUp || !fileName}
          onClick={onScore}
        >
          {isUploading ? "Generating score…" : usedUp ? "Daily limit reached" : "Generate score"}
        </button>
      </div>
    </section>
  );
}
