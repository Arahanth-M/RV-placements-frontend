export const GENERAL_PREP_ROLE_KEY = "";

function compact(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * @param {unknown[]} prepRoles Catalog from API (`{ key, label }`).
 * @param {unknown[]} itemRoleKeys `prepRoleKey` values present on content rows.
 */
function labelForPrepRoleKey(key, prepRoles) {
  if (!key) return "General";
  const hit = (Array.isArray(prepRoles) ? prepRoles : []).find(
    (row) => String(row?.key ?? "") === key
  );
  return compact(hit?.label) || key;
}

/**
 * Role tabs only for keys that appear on at least one content row (e.g. link with URL).
 * @param {unknown[]} prepRoles
 * @param {unknown[]} itemRoleKeys
 * @param {{ requireGeneralContent?: boolean, excludeGeneralTab?: boolean }} [options]
 */
export function buildPrepRoleTabs(prepRoles, itemRoleKeys = [], options = {}) {
  const map = new Map();
  const keys = (Array.isArray(itemRoleKeys) ? itemRoleKeys : []).map((raw) =>
    String(raw ?? "")
  );
  const hasGeneralContent = keys.some((key) => key === "");
  const catalogHasGeneral = (Array.isArray(prepRoles) ? prepRoles : []).some(
    (row) => String(row?.key ?? "") === ""
  );

  const allowGeneral =
    !options.excludeGeneralTab &&
    (hasGeneralContent || (!options.requireGeneralContent && catalogHasGeneral));
  if (allowGeneral && hasGeneralContent) {
    map.set(GENERAL_PREP_ROLE_KEY, { key: GENERAL_PREP_ROLE_KEY, label: "General" });
  }

  for (const row of Array.isArray(prepRoles) ? prepRoles : []) {
    const key = String(row?.key ?? "");
    if (!key) continue;
    const label = compact(row?.label) || key;
    if (!map.has(key)) map.set(key, { key, label });
  }

  for (const key of keys) {
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, { key, label: labelForPrepRoleKey(key, prepRoles) });
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.key === GENERAL_PREP_ROLE_KEY) return -1;
    if (b.key === GENERAL_PREP_ROLE_KEY) return 1;
    return a.label.localeCompare(b.label);
  });
}

export function prepRoleTabsVisible(tabs) {
  const list = Array.isArray(tabs) ? tabs : [];
  if (list.length <= 1) return false;
  return list.some((tab) => String(tab?.key ?? "") !== GENERAL_PREP_ROLE_KEY);
}

export function hasRoleScopedPrepContent(prepRoles, itemRoleKeys = []) {
  if (
    (Array.isArray(prepRoles) ? prepRoles : []).some((row) => String(row?.key ?? "") !== "")
  ) {
    return true;
  }
  return (Array.isArray(itemRoleKeys) ? itemRoleKeys : []).some(
    (key) => String(key ?? "") !== ""
  );
}

export function prepRoleLabelForKey(prepRoleKey, prepRoles) {
  return labelForPrepRoleKey(String(prepRoleKey ?? ""), prepRoles);
}

/**
 * Quick Links / lists: tabs only for roles that have at least one row in `entries`.
 * @param {unknown[]} prepRoles
 * @param {{ prepRoleKey?: string }[]} entries
 */
export function buildPrepRoleTabsFromEntries(prepRoles, entries = []) {
  const rows = Array.isArray(entries) ? entries : [];
  const keys = rows.map((row) => String(row?.prepRoleKey ?? ""));
  return buildPrepRoleTabs(prepRoles, keys, { requireGeneralContent: true });
}

export function hasRoleScopedPrepContentFromEntries(prepRoles, entries = []) {
  const rows = Array.isArray(entries) ? entries : [];
  return rows.some((row) => String(row?.prepRoleKey ?? "") !== "");
}

export function itemMatchesPrepRoleTab(itemPrepRoleKey, activePrepRoleKey) {
  const itemKey = String(itemPrepRoleKey ?? "");
  const activeKey = String(activePrepRoleKey ?? "");
  return itemKey === activeKey;
}

/**
 * Prefer the role tab that actually has the most tagged items (avoids landing on empty General).
 * @param {unknown[]} prepRoles
 * @param {unknown[]} itemRoleKeys
 */
export function pickDefaultPrepRoleTab(prepRoles, itemRoleKeys = [], options = {}) {
  const tabs = buildPrepRoleTabs(prepRoles, itemRoleKeys, options);
  if (!tabs.length) return GENERAL_PREP_ROLE_KEY;
  let best = tabs[0];
  let bestCount = -1;
  for (const tab of tabs) {
    const count = itemRoleKeys.filter((key) => itemMatchesPrepRoleTab(key, tab.key)).length;
    const preferThisOnTie =
      count === bestCount &&
      count > 0 &&
      best.key === GENERAL_PREP_ROLE_KEY &&
      tab.key !== GENERAL_PREP_ROLE_KEY;
    if (count > bestCount || preferThisOnTie) {
      bestCount = count;
      best = tab;
    }
  }
  return best?.key ?? GENERAL_PREP_ROLE_KEY;
}
