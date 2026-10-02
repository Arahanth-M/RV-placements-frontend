/**
 * Same skeleton pattern as RVCE company tab loading (CompanyDetails year shimmer).
 */
export default function PrepRoleSwitchShimmer({ variant = "theme" }) {
  const isDark = variant === "dark";
  const shell = isDark
    ? "bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-6"
    : "bg-theme-card border border-theme rounded-xl p-4 sm:p-6";
  const statusClass = isDark
    ? "text-sm text-slate-400 mb-4 animate-pulse"
    : "text-sm text-theme-secondary mb-4 animate-pulse";

  return (
    <div
      className={shell}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading role content"
      data-testid="prep-role-switch-shimmer"
    >
      <p className={statusClass}>Updating content for this role…</p>
      <div className="space-y-4">
        <div className="shimmer-box h-6 w-48 rounded-md" />
        <div className="shimmer-box h-4 w-full rounded-md" />
        <div className="shimmer-box h-4 w-[92%] rounded-md" />
        <div className="shimmer-box h-4 w-[85%] rounded-md" />
        <div className="shimmer-box h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
