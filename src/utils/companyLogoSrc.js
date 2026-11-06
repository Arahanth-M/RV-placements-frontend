import { BASE_URL } from "./constants";
import { resolveLogoDomainFromName } from "./companyLogoDomains";

/**
 * Shared thumbnail size for companystats hub tiles + company cards.
 * One size → one cache key (`domain|size`), so opening a category reuses hub logos.
 */
export const LIST_LOGO_PIXEL_SIZE = 72;

/** Neutral blank tile — never show company initials while logos load or fail. */
export function getDefaultLogoSrc(_name) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='8' fill='%23E2E8F0'/%3E%3C/svg%3E`;
}

function normalizeDomain(domain) {
  if (!domain || typeof domain !== "string") return "";
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return "";
  try {
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    return url.hostname.replace(/^www\./, "") || "";
  } catch {
    return trimmed.replace(/^www\./, "").split("/")[0] || "";
  }
}

function matchesBlockedHost(hostname, blockedHosts) {
  return blockedHosts.some(
    (blockedHost) => hostname === blockedHost || hostname.endsWith(`.${blockedHost}`)
  );
}

function isSocialProfileDomain(domain) {
  const blockedHosts = [
    "linkedin.com",
    "lnkd.in",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
  ];
  return matchesBlockedHost(domain, blockedHosts);
}

function domainFromName(name) {
  const override = resolveLogoDomainFromName(name);
  if (override) return override;
  if (!name || typeof name !== "string") return "";
  const slug = name.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return slug ? `${slug}.com` : "";
}

/**
 * @param {{ name?: string, domain?: string }} company
 * @param {number} [pixelSize]
 */
export function resolveCompanyLogoTarget(company, pixelSize = LIST_LOGO_PIXEL_SIZE) {
  const name = company?.name;
  const rawDomain = company?.domain?.trim() || "";
  const normalizedDomain = normalizeDomain(rawDomain);
  const domain =
    (normalizedDomain && !isSocialProfileDomain(normalizedDomain) ? normalizedDomain : "") ||
    domainFromName(name);
  const size = Number.isFinite(Number(pixelSize))
    ? Math.min(800, Math.max(32, Math.trunc(Number(pixelSize))))
    : LIST_LOGO_PIXEL_SIZE;
  const fallback = getDefaultLogoSrc(name);
  const networkUrl = domain
    ? `${BASE_URL}/api/logo?domain=${encodeURIComponent(domain)}&size=${encodeURIComponent(String(size))}`
    : fallback;
  return {
    name,
    domain,
    size,
    cacheKey: domain ? `${domain}|${size}` : "",
    networkUrl,
    fallback,
  };
}
