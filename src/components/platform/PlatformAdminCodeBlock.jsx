import PrepSolutionBody from "../PrepSolutionBody.jsx";

/**
 * Code surface used in platform admin answer review (indentation + syntax highlight).
 */
export default function PlatformAdminCodeBlock({ code, language, toolbar = null }) {
  if (!String(code || "").trim()) return null;
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-theme bg-theme-card">
      <div className="p-2 sm:p-3">
        <PrepSolutionBody
          code={code}
          language={language}
          richTextVariant="theme"
          toolbar={toolbar}
        />
      </div>
    </div>
  );
}
