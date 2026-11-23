import { useMemo } from "react";
import { digestToPreviewSections } from "../utils/resumeDigestFields.js";

/**
 * Formal read-only resume digest preview (headings + body/bullets).
 * Used for PrepPath review (view mode) and View Profile.
 */
export default function ResumeDigestPreview({
  digest = "",
  className = "",
  maxHeightClass = "max-h-72",
}) {
  const sections = useMemo(() => digestToPreviewSections(digest), [digest]);

  if (!sections.length) {
    return (
      <p className="rounded-xl border border-theme bg-theme-card px-4 py-3 text-sm text-theme-secondary">
        No digest text.
      </p>
    );
  }

  return (
    <div
      className={`overflow-auto rounded-xl border border-theme bg-theme-card p-4 sm:p-5 ${maxHeightClass} ${className}`}
    >
      <div className="space-y-5">
        {sections.map((section) => (
          <section key={section.key} className="min-w-0">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-theme-accent">
              {section.title}
            </h4>
            <div className="mt-2 space-y-1.5 border-l-2 border-theme-accent/25 pl-3">
              {section.lines.map((line, index) => {
                if (!String(line || "").trim()) {
                  return (
                    <div
                      key={`${section.key}-gap-${index}`}
                      className="h-2"
                      aria-hidden
                    />
                  );
                }
                const isBullet = line.startsWith("• ");
                const text = isBullet ? line.slice(2) : line;
                return (
                  <p
                    key={`${section.key}-${index}`}
                    className={`break-words text-sm leading-relaxed text-theme-primary ${
                      isBullet ? "flex gap-2" : ""
                    }`}
                  >
                    {isBullet ? (
                      <>
                        <span className="shrink-0 text-theme-accent" aria-hidden>
                          •
                        </span>
                        <span className="min-w-0">{text}</span>
                      </>
                    ) : (
                      text
                    )}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
