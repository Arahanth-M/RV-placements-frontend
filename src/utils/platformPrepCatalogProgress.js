/**
 * Added only when the Tavily + Firecrawl pipeline has published content for
 * this company. Other saved questions stay remaining.
 * @param {{ researchPipelineAdded?: unknown }} company
 * @returns {boolean}
 */
export function companyHasPlatformPrepContent(company) {
  return company?.researchPipelineAdded === true;
}

/**
 * @param {Array<{ platformPrepCoverage?: unknown }>} companies
 * @returns {{ total: number, added: number, remaining: number }}
 */
export function summarizeCategoryPrepProgress(companies) {
  const list = Array.isArray(companies) ? companies : [];
  let added = 0;
  for (const company of list) {
    if (companyHasPlatformPrepContent(company)) added += 1;
  }
  return {
    total: list.length,
    added,
    remaining: list.length - added,
  };
}
