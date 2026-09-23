/**
 * PrepPath → company-card deep links (?tab=&focus=&from=preppath).
 */

export const PREP_PATH_COMPANY_TABS = new Set([
  "oa",
  "interview",
  "mustdo",
  "internship",
  "coding",
]);

export function tabForPrepEvidence(sourceType) {
  switch (String(sourceType || "").trim().toLowerCase()) {
    case "oa":
      return "oa";
    case "coding":
      return "coding";
    case "interview_question":
      return "interview";
    case "interview_experience":
      return "interview";
    case "must_do":
      return "mustdo";
    default:
      return null;
  }
}

export function normalizeFocusText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function textMatchesFocus(itemText, focus) {
  const item = normalizeFocusText(itemText);
  const needle = normalizeFocusText(focus);
  if (!item || !needle) return false;
  return item.includes(needle) || needle.includes(item);
}

export function findFocusIndex(items, focus, getText = (item) => item) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length || !normalizeFocusText(focus)) return -1;
  return list.findIndex((item) => textMatchesFocus(getText(item), focus));
}

export function displayPrepEvidenceLabel(label, { isGeneral } = {}) {
  const text = String(label || "").trim();
  if (!text) {
    return isGeneral ? "Seen on the platform" : "Seen in RVCE visit data";
  }
  if (isGeneral) {
    return text.replace("Seen in RVCE visit data", "Seen on the platform");
  }
  return text;
}

export function buildPrepPathMockInterviewHref(appPath, companyId, suggestion) {
  const id = String(companyId || "").trim();
  if (!id || typeof appPath !== "function") return "";
  const params = new URLSearchParams();
  params.set("companyId", id);
  const role = String(suggestion?.role || "").trim();
  if (role) params.set("role", role);
  const difficulty = String(suggestion?.difficulty || "").trim().toLowerCase();
  if (difficulty) params.set("difficulty", difficulty);
  const rounds = (Array.isArray(suggestion?.rounds) ? suggestion.rounds : [])
    .map((round) => (typeof round === "string" ? round : round?.type))
    .map((type) => String(type || "").trim())
    .filter(Boolean);
  if (rounds.length) params.set("rounds", rounds.join(","));
  params.set("from", "preppath");
  return appPath(`/interviews?${params.toString()}`);
}

export function parsePrepPathMockPrefill(search) {
  let params;
  try {
    params =
      search instanceof URLSearchParams
        ? search
        : new URLSearchParams(String(search || "").replace(/^\?/, ""));
  } catch {
    params = new URLSearchParams();
  }
  const rounds = String(params.get("rounds") || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    role: String(params.get("role") || "").trim(),
    difficulty: String(params.get("difficulty") || "")
      .trim()
      .toLowerCase(),
    rounds,
    fromPrepPath: params.get("from") === "preppath",
  };
}

export function buildPrepPathCompanyHref(appPath, companyId, { tab, focus } = {}) {
  const id = String(companyId || "").trim();
  if (!id || typeof appPath !== "function") return "";
  const params = new URLSearchParams();
  if (tab && PREP_PATH_COMPANY_TABS.has(tab)) params.set("tab", tab);
  const snippet = String(focus || "").trim();
  if (snippet) params.set("focus", snippet.slice(0, 180));
  params.set("from", "preppath");
  return appPath(`/companies/${id}?${params.toString()}`);
}

export function prepPathReturnPath(pathname, search, planId) {
  const base = String(pathname || "").split("?")[0] || "/prep-path";
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  if (planId) params.set("plan", String(planId));
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function readCompanyFocusFromLocation(location) {
  let params;
  try {
    params = new URLSearchParams(location?.search || "");
  } catch {
    params = new URLSearchParams();
  }
  const tab = String(params.get("tab") || "").trim();
  return {
    tab: PREP_PATH_COMPANY_TABS.has(tab) ? tab : "",
    focus: String(params.get("focus") || "").trim(),
    fromPrepPath:
      location?.state?.fromPrepPath === true || params.get("from") === "preppath",
  };
}

export function copyPrepPathFocusParams(fromSearch, intoParams) {
  if (!intoParams) return intoParams;
  let current;
  try {
    current = new URLSearchParams(fromSearch || "");
  } catch {
    return intoParams;
  }
  for (const key of ["tab", "focus", "from"]) {
    const value = current.get(key);
    if (value) intoParams.set(key, value);
  }
  return intoParams;
}

export function scrollFocusNode(node) {
  if (!node || typeof node.scrollIntoView !== "function") return;
  requestAnimationFrame(() => {
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export const PREP_FOCUS_HIGHLIGHT_CLASS =
  "ring-2 ring-theme-accent bg-theme-accent/10";

