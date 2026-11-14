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
  alwaysIncludeGeneral = false,
  variant = "theme",
  switching = false,
}) {
  const tabs = buildPrepRoleTabs(prepRoles, itemRoleKeys, {
    excludeGeneralTab,
    requireGeneralContent,
    alwaysIncludeGeneral,
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
      className={`flex w-full min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-2 rounded-2xl border px-3 py-3 sm:gap-x-4 sm:px-5 sm:py-4 ${shell} ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
      aria-busy={switching || undefined}
    >
      <span className={`shrink-0 ${labelClass}`}>Roles:</span>
      {/* Compact horizontal chips — wrap left-aligned, all visible (no scroll) */}
      <div className="flex min-w-0 flex-1 flex-wrap content-start justify-start gap-1.5 sm:gap-2">
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
              className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-semibold leading-none whitespace-nowrap transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm md:px-5 md:text-base ${
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
