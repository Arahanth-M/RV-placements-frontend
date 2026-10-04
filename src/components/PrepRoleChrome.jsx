import PrepRoleSubTabs from "./PrepRoleSubTabs.jsx";
import { buildPrepRoleTabs } from "../utils/prepRoleTabs.js";

/**
 * Always surfaces prep role on General company pages (badge or tabs).
 */
export default function PrepRoleChrome({
  prepRoles = [],
  itemRoleKeys = [],
  activeKey = "",
  onChange,
  ariaLabel = "Roles",
  className = "",
  badgeClassName = "",
  requireGeneralContent = false,
  excludeGeneralTab = true,
  variant = "theme",
  switching = false,
}) {
  const tabOptions = { requireGeneralContent, excludeGeneralTab };
  const tabs = buildPrepRoleTabs(prepRoles, itemRoleKeys, tabOptions);
  if (tabs.length === 0) return null;

  const isDark = variant === "dark";

  if (tabs.length === 1) {
    const tab = tabs[0];
    return (
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4 ${badgeClassName}`.trim()}
        data-testid="prep-role-badge"
      >
        <span
          className={`text-sm font-semibold sm:text-base ${isDark ? "text-slate-300" : "text-theme-primary"}`}
        >
          Roles:
        </span>
        <span
          className={`text-base font-bold sm:text-lg ${isDark ? "text-white" : "text-theme-primary"}`}
        >
          {tab.label}
        </span>
      </div>
    );
  }

  return (
    <PrepRoleSubTabs
      prepRoles={prepRoles}
      itemRoleKeys={itemRoleKeys}
      activeKey={activeKey}
      onChange={onChange}
      ariaLabel={ariaLabel}
      className={className}
      forceVisible
      excludeGeneralTab={excludeGeneralTab}
      requireGeneralContent={requireGeneralContent}
      variant={variant}
      switching={switching}
    />
  );
}

export function PrepRoleChromeDark(props) {
  return (
    <PrepRoleChrome
      {...props}
      variant="dark"
      badgeClassName="border-slate-700 bg-slate-800/60"
      className="border-slate-700 bg-slate-800/60"
    />
  );
}
