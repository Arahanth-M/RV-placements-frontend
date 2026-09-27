import PlatformAdminCodeBlock from "./PlatformAdminCodeBlock.jsx";

const LANG_ROWS = [
  ["C++", "cpp"],
  ["Java", "java"],
  ["Python", "python"],
];

/**
 * Stacked C++ / Java / Python blocks (platform admin research review).
 */
export default function PlatformCodingSolutions({ solutions }) {
  if (!solutions || typeof solutions !== "object") return null;
  const rows = LANG_ROWS.filter(([, key]) => String(solutions[key] || "").trim());
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-theme-secondary">Solutions</p>
      {rows.map(([label, key]) => (
        <div key={key} className="space-y-1">
          <p className="text-xs font-semibold text-theme-primary">{label}</p>
          <PlatformAdminCodeBlock
            code={solutions[key]}
            language={key}
          />
        </div>
      ))}
    </div>
  );
}
