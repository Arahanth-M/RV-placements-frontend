export function normalizeWebUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return raw;
  return `https://${raw.replace(/^\/\//, "")}`;
}

/** Short label for project/repo links (never the full URL). */
export function pickProjectLinkLabel(entry = {}) {
  const url = normalizeWebUrl(entry.link);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host.includes("github.com")) return "GitHub";
    if (host.includes("gitlab.com")) return "GitLab";
    if (host.includes("bitbucket.org")) return "Bitbucket";
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && (host.includes("github") || host.includes("gitlab"))) {
      return segments[1];
    }
    if (segments.length) return segments[segments.length - 1];
    return "Link";
  } catch {
    return "Link";
  }
}
