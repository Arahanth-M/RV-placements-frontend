/**
 * @param {{ title?: string, url?: string }} source
 */
export function researchSourceLinkLabel(source) {
  const title = String(source?.title || "").trim();
  if (title) return title;
  const url = String(source?.url || "").trim();
  if (!url) return "Source";
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url.length > 48 ? `${url.slice(0, 45)}…` : url;
  }
}
