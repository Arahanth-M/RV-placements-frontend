import { formatExperienceMonth } from "./parseExperienceStoredEntry.js";
import { formatPlatformPrepCoverage } from "./platformPrepCoverage.js";

/** Dedupe prep-role catalog rows by key (keeps first label). */
export function uniquePrepRoleCatalog(prepRoles = []) {
  const seen = new Set();
  const out = [];
  for (const row of Array.isArray(prepRoles) ? prepRoles : []) {
    const key = String(row?.key ?? "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      label: String(row?.label || row?.key || "").trim() || key,
    });
  }
  return out;
}

/** Prep role labels that have at least one tagged row on the company. */
export function prepRoleLabelsWithContent(company = {}) {
  const catalog = uniquePrepRoleCatalog(company.prepRoles);
  const keysWithContent = new Set();

  const addKeys = (arr) => {
    for (const k of arr || []) {
      const key = String(k ?? "").trim();
      if (key) keysWithContent.add(key);
    }
  };

  addKeys(company.onlineQuestions_prepRoleKey);
  addKeys(company.interviewQuestions_prepRoleKey);
  for (const item of company.mcqQuestions || []) {
    const key = String(item?.prepRoleKey ?? "").trim();
    if (key) keysWithContent.add(key);
  }
  for (const source of company.researchSources || []) {
    const key = String(source?.prepRoleKey ?? "").trim();
    if (key) keysWithContent.add(key);
  }

  const fromKeys = catalog
    .filter((row) => keysWithContent.has(String(row?.key ?? "")))
    .map((row) => String(row?.label || row?.key || "").trim())
    .filter(Boolean);

  if (fromKeys.length) return fromKeys;

  return catalog.map((row) => String(row?.label || row?.key || "").trim()).filter(Boolean);
}

function countClientQuestions(items) {
  return (Array.isArray(items) ? items : []).filter((item) => {
    if (typeof item === "string") return item.trim().length > 0;
    return String(item?.question ?? "").trim().length > 0;
  }).length;
}

export function buildGeneralCompanyPrepSummary(company = {}) {
  const roles = prepRoleLabelsWithContent(company);
  const rolesLine = roles.length ? roles.join(", ") : "Not tagged by role yet";
  const updated = formatExperienceMonth(
    company.platformContentUpdatedAt || company.contentUpdatedAt || company.createdAt
  );
  const coverage = formatPlatformPrepCoverage(
    company.platformPrepCoverage || {
      oa:
        countClientQuestions(company.onlineQuestions) +
        countClientQuestions(company.mcqQuestions),
      interview: (company.interviewQuestions || []).length,
      experiences: (company.interviewProcess || []).length,
    }
  );
  const { oa, interview, experiences } = coverage;
  const oaLabel = oa === 1 ? "OA question" : "OA questions";
  const iqLabel = interview === 1 ? "interview question" : "interview questions";
  const exprLabel = experiences === 1 ? "interview experience" : "interview experiences";

  return {
    rolesLine,
    updatedLine: updated ? `Last updated ${updated}` : "Last updated —",
    countsLine: `${oa} ${oaLabel} · ${interview} ${iqLabel} · ${experiences} ${exprLabel}`,
    oa,
    interview,
    experiences,
    /** Compact single-line copy when a card has no role breakdown. */
    countsLineCard: coverage.line,
    /** Per-role compact lines for grid cards. */
    roleCoverage: roleCoverageFromCompany(company),
  };
}

function roleCoverageFromCompany(company = {}) {
  const raw = company.platformPrepCoverageByRole;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const seen = new Set();
  const rows = [];
  for (const row of raw) {
    const key = String(row?.key ?? "").trim();
    const label = String(row?.label || "").trim() || (key || "General");
    if (!label) continue;
    const dedupeKey = key || `label:${label.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const coverage = formatPlatformPrepCoverage(row);
    rows.push({
      key,
      label,
      oa: coverage.oa,
      interview: coverage.interview,
      experiences: coverage.experiences,
      line: coverage.line,
    });
  }
  return rows;
}
