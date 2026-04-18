import React, { useState, useMemo, useEffect } from "react";

const LOGO_DEV_PUBLIC_KEY = "pk_B8XNckD9R3eqItbtBQtP3g";

function getCompanyInitials(name) {
  if (!name || !name.trim()) return "XX";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return words[0].substring(0, 2).toUpperCase();
}

function getDefaultLogoSrc(name) {
  const initials = getCompanyInitials(name);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%236366F1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='18' font-weight='bold' fill='white'%3E${encodeURIComponent(initials)}%3C/text%3E%3C/svg%3E`;
}

/**
 * Normalize domain: strip protocol and path, return hostname (e.g. "google.com").
 */
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
    (blockedHost) =>
      hostname === blockedHost || hostname.endsWith(`.${blockedHost}`)
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

function isSocialProfileLogoUrl(url) {
  const hostname = normalizeDomain(url);
  if (!hostname) return false;
  return isSocialProfileDomain(hostname);
}

/** Derive a best-effort domain from company name (e.g. "Google" -> "google.com"). */
function domainFromName(name) {
  if (!name || typeof name !== "string") return "";
  const slug = name.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  return slug ? `${slug}.com` : "";
}

/**
 * Renders a company logo using logo.dev when domain is available,
 * otherwise falls back to company.logo or initials.
 * @param {Object} company - { name, logo?, domain? }
 * @param {string} [className] - applied to the img
 * @param {string} [alt] - alt text (defaults to company name or "Company logo")
 */
function CompanyLogo({ company, className = "", alt }) {
  const name = company?.name;
  const rawLogoUrl = company?.logo?.trim() || "";
  const logoUrl = isSocialProfileLogoUrl(rawLogoUrl) ? "" : rawLogoUrl;
  const rawDomain = company?.domain?.trim() || "";
  const normalizedDomain = normalizeDomain(rawDomain);
  const domain = (
    normalizedDomain && !isSocialProfileDomain(normalizedDomain)
      ? normalizedDomain
      : ""
  ) || domainFromName(name);

  const getInitialSrc = () => {
    if (domain) return `https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLIC_KEY}`;
    if (logoUrl) return logoUrl;
    return getDefaultLogoSrc(name);
  };

  const [src, setSrc] = useState(getInitialSrc);

  useEffect(() => {
    setSrc(getInitialSrc());
  }, [company?._id, name, logoUrl, domain]);

  const fallbackLogoSrc = useMemo(() => getDefaultLogoSrc(name), [name]);

  const handleError = () => {
    setSrc((current) => {
      if (domain && current.includes("logo.dev")) {
        if (logoUrl) return logoUrl;
        return fallbackLogoSrc;
      }
      return fallbackLogoSrc;
    });
  };

  return (
    <img
      src={src}
      alt={alt ?? name ?? "Company logo"}
      className={className}
      onError={handleError}
    />
  );
}

export default CompanyLogo;
