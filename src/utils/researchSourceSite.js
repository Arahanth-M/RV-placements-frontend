/** @typedef {{ id: string, label: string, order: number }} ResearchSourceSite */

const SITE_RULES = [
  { id: "gfg", label: "GFG", hosts: ["geeksforgeeks.org"] },
  { id: "leetcode", label: "LeetCode", hosts: ["leetcode.com"] },
  { id: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"] },
  { id: "glassdoor", label: "Glassdoor", hosts: ["glassdoor.com", "glassdoor.co.in"] },
  { id: "ambitionbox", label: "AmbitionBox", hosts: ["ambitionbox.com"] },
  { id: "naukri", label: "Naukri", hosts: ["naukri.com"] },
  { id: "reddit", label: "Reddit", hosts: ["reddit.com"] },
  { id: "quora", label: "Quora", hosts: ["quora.com"] },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { id: "medium", label: "Medium", hosts: ["medium.com"] },
  { id: "exponent", label: "Exponent", hosts: ["tryexponent.com", "exponent.com"] },
  { id: "interviewbit", label: "InterviewBit", hosts: ["interviewbit.com"] },
  { id: "prepbytes", label: "PrepBytes", hosts: ["prepbytes.com"] },
  { id: "indiacodingschool", label: "India Coding School", hosts: ["indiacodingschool.com"] },
  { id: "github", label: "GitHub", hosts: ["github.com"] },
  { id: "stackoverflow", label: "Stack Overflow", hosts: ["stackoverflow.com"] },
];

const OTHER_SITE = { id: "other", label: "Other", order: 999 };

/**
 * @param {string | undefined} url
 * @returns {ResearchSourceSite}
 */
export function classifyResearchSourceSite(url) {
  const href = String(url || "").trim();
  if (!href) return { ...OTHER_SITE, order: OTHER_SITE.order };

  let hostname = "";
  try {
    hostname = new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return { ...OTHER_SITE, order: OTHER_SITE.order };
  }

  for (let index = 0; index < SITE_RULES.length; index += 1) {
    const rule = SITE_RULES[index];
    if (rule.hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      return { id: rule.id, label: rule.label, order: index };
    }
  }

  const fallbackLabel = hostname
    .split(".")
    .slice(0, -1)
    .pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  if (fallbackLabel) {
    return { id: `host:${hostname}`, label: fallbackLabel, order: 500 };
  }

  return { ...OTHER_SITE, order: OTHER_SITE.order };
}

/**
 * @param {Array<{ url?: string }>} sources
 * @returns {Array<{ site: ResearchSourceSite, items: unknown[] }>}
 */
export function groupResearchSourcesBySite(sources) {
  const rows = Array.isArray(sources) ? sources : [];
  const buckets = new Map();

  for (const source of rows) {
    const site = classifyResearchSourceSite(source?.url);
    const key = site.id;
    if (!buckets.has(key)) {
      buckets.set(key, { site, items: [] });
    }
    buckets.get(key).items.push(source);
  }

  return [...buckets.values()].sort((a, b) => {
    if (a.site.order !== b.site.order) return a.site.order - b.site.order;
    return a.site.label.localeCompare(b.site.label);
  });
}
