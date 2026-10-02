import { buildPrepRoleTabs, prepRoleTabsVisible } from "../utils/prepRoleTabs.js";

export default function PrepRoleSubTabs({
  prepRoles = [],
  itemRoleKeys = [],
  activeKey = "",
  onChange,
  ariaLabel = "Roles",
  className = "",
  forceVisible = false,
  excludeGeneralTab = true,
  requireGeneralContent = false,
  variant = "theme",
  switching = false,
}) {
  const tabs = buildPrepRoleTabs(prepRoles, itemRoleKeys, {
    excludeGeneralTab,
    requireGeneralContent,
  });
  if (!forceVisible && !prepRoleTabsVisible(tabs)) return null;
  if (!tabs.length) return null;

  const isDark = variant === "dark";
  const shell = isDark
    ? "border-slate-700/90 bg-slate-900/50 shadow-sm shadow-black/20"
    : "border-theme bg-theme-card shadow-sm";
  const labelClass = isDark
    ? "text-sm font-semibold text-slate-300"
    : "text-sm font-semibold text-theme-primary";
  const idleTab = isDark
    ? "text-slate-300 hover:bg-slate-800 hover:text-white"
    : "text-theme-secondary hover:bg-theme-nav hover:text-theme-primary";
  const activeTab = isDark
    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
    : "bg-theme-accent text-white shadow-md";

  return (
    <div
      className={`flex w-full min-w-0 flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4 ${shell} ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
      aria-busy={switching || undefined}
    >
      <span className={labelClass}>Roles:</span>
      <div className="flex min-w-0 flex-wrap gap-2">
        {tabs.map((tab) => {
          const selected = tab.key === activeKey || (!activeKey && tab.key === "");
          return (
            <button
              key={tab.key || "__general__"}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={switching}
              onClick={() => onChange?.(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 sm:px-5 sm:text-base ${
                selected ? activeTab : idleTab
              } ${switching ? "opacity-70" : ""}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
