import { BASE_URL } from "./constants";
import { resolveLogoDomainFromName } from "./companyLogoDomains";

function getCompanyInitials(name) {
  if (!name || !name.trim()) return "XX";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return words[0].substring(0, 2).toUpperCase();
}

export function getDefaultLogoSrc(name) {
  const initials = getCompanyInitials(name);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%236366F1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='18' font-weight='bold' fill='white'%3E${encodeURIComponent(initials)}%3C/text%3E%3C/svg%3E`;
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
export function resolveCompanyLogoTarget(company, pixelSize = 96) {
  const name = company?.name;
  const rawDomain = company?.domain?.trim() || "";
  const normalizedDomain = normalizeDomain(rawDomain);
  const domain =
    (normalizedDomain && !isSocialProfileDomain(normalizedDomain) ? normalizedDomain : "") ||
    domainFromName(name);
  const size = Number.isFinite(Number(pixelSize))
    ? Math.min(800, Math.max(32, Math.trunc(Number(pixelSize))))
    : 96;
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
