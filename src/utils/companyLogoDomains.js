/** Normalize company name for logo domain override lookup. */
export function normalizeCompanyNameKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Exact name → logo.dev domain overrides (keys use normalizeCompanyNameKey).
 * Fixes naive name→domain guesses (e.g. "TCS NQT" → tcsnqt.com).
 */
export const COMPANY_LOGO_DOMAIN_OVERRIDES = {
  walmart: "walmart.com",
  confluent: "confluent.io",
  nokia: "nokia.com",
  auxia: "auxia.io",
  netapp: "netapp.com",
  egdk: "egsoftware.com",
  rapido: "rapido.bike",
  aviatrix: "aviatrix.com",
  blinkit: "blinkit.com",
  "common wealth bank": "commbank.com.au",
  "commonwealth bank": "commbank.com.au",
  "commonwealth bank of australia": "commbank.com.au",
  "ethos technolgies": "ethos.com",
  "ethos technologies": "ethos.com",
  "glance inmobi": "inmobi.com",
  "glance in mobi": "inmobi.com",
  "tcs nqt": "tcs.com",
  "eternal blinkit": "blinkit.com",
  axella: "axxela.in",
  axxela: "axxela.in",
  "axxela research analytics": "axxela.in",
  "chevron engine": "chevron.com",
  "chevron engines": "chevron.com",
  "green light technolgy": "greenlight.com",
  "green light technology": "greenlight.com",
  "greenlight technolgy": "greenlight.com",
  "greenlight technology": "greenlight.com",
  "greenlight technologies": "greenlight.com",
  etg: "etg.digital",
  "etg digital": "etg.digital",
  netgear: "netgear.com",
  hyperface: "hyperface.co",
  "hevo data": "hevodata.com",
  hevo: "hevodata.com",
  onetrust: "onetrust.com",
  "one trust": "onetrust.com",
  havells: "havells.com",
  "havells india ltd": "havells.com",
  "havells india limited": "havells.com",
  "tvs motors": "tvsmotor.com",
  "tvs motor": "tvsmotor.com",
};

/** Partial-name rules checked when no exact override matches. */
const COMPANY_LOGO_DOMAIN_PATTERNS = [
  { test: (k) => k.includes("chevron") && k.includes("engine"), domain: "chevron.com" },
  { test: (k) => k.includes("commonwealth") && k.includes("bank"), domain: "commbank.com.au" },
  { test: (k) => k.includes("common wealth") && k.includes("bank"), domain: "commbank.com.au" },
  { test: (k) => k.includes("ethos") && k.includes("technolog"), domain: "ethos.com" },
  { test: (k) => k.includes("glance") && k.includes("inmobi"), domain: "inmobi.com" },
  { test: (k) => k === "glance" || k.startsWith("glance "), domain: "inmobi.com" },
  { test: (k) => k.includes("eternal") && k.includes("blinkit"), domain: "blinkit.com" },
  { test: (k) => k.includes("tcs") && k.includes("nqt"), domain: "tcs.com" },
  { test: (k) => k.includes("axella") || k.includes("axxela"), domain: "axxela.in" },
  { test: (k) => k === "egdk" || k.startsWith("egdk "), domain: "egsoftware.com" },
  { test: (k) => k.includes("walmart"), domain: "walmart.com" },
  { test: (k) => k.includes("nokia"), domain: "nokia.com" },
  {
    test: (k) =>
      (k.includes("green light") || k.includes("greenlight")) && k.includes("technolog"),
    domain: "greenlight.com",
  },
  {
    test: (k) => k === "etg" || k.startsWith("etg ") || k.includes("etg digital"),
    domain: "etg.digital",
  },
  { test: (k) => k.includes("netgear"), domain: "netgear.com" },
  { test: (k) => k.includes("hyperface"), domain: "hyperface.co" },
  { test: (k) => k.includes("hevo"), domain: "hevodata.com" },
  { test: (k) => k.includes("onetrust") || k.includes("one trust"), domain: "onetrust.com" },
  { test: (k) => k.includes("havells"), domain: "havells.com" },
  {
    test: (k) => k.includes("tvs") && k.includes("motor"),
    domain: "tvsmotor.com",
  },
];

export function resolveLogoDomainFromName(name) {
  const key = normalizeCompanyNameKey(name);
  if (!key) return "";

  if (COMPANY_LOGO_DOMAIN_OVERRIDES[key]) {
    return COMPANY_LOGO_DOMAIN_OVERRIDES[key];
  }

  for (const { test, domain } of COMPANY_LOGO_DOMAIN_PATTERNS) {
    if (test(key)) return domain;
  }

  return "";
}
