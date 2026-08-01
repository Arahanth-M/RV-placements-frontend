/**
 * Turn stored role points text (skills or workDescription: string | string[]) into bullets for UI.
 * @param {unknown} raw
 * @returns {string[]}
 */
export function workDescriptionToPoints(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        String(item ?? "")
          .replace(/^[-*•●▪▸►]+\s*/, "")
          .replace(/^\d+[.)]\s*/, "")
          .trim()
      )
      .filter(Boolean);
  }

  const text = String(raw ?? "").trim();
  if (!text) return [];

  const parts = text
    .split(/\r?\n+|(?=\s*[•●▪▸►])|(?=\s+\d+[.)]\s+)/)
    .flatMap((chunk) => chunk.split(/(?:^|\s)[-*]\s+/))
    .map((line) =>
      line
        .replace(/^[-*•●▪▸►]+\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim()
    )
    .filter(Boolean);

  if (
    parts.length <= 1 &&
    !/[\n\r]/.test(text) &&
    !/[-*•●]/.test(text) &&
    !/\d+[.)]\s/.test(text)
  ) {
    return [text];
  }

  return parts.length > 0 ? parts : [text];
}

/** Alias — skills use the same points display as work. */
export const skillsToPoints = workDescriptionToPoints;

const ROLE_STRUCTURAL_KEYS = new Set([
  "rolename",
  "name",
  "ctc",
  "internshipstipend",
  "stipend",
  "_id",
  "id",
]);

/**
 * Point sections on a role, using the exact stored field names as labels.
 * @param {Record<string, unknown>|null|undefined} role
 * @returns {{ key: string, points: string[] }[]}
 */
export function listRolePointSections(role) {
  if (!role || typeof role !== "object") return [];
  /** @type {{ key: string, points: string[] }[]} */
  const out = [];
  for (const [key, value] of Object.entries(role)) {
    const nk = String(key || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    if (!nk || ROLE_STRUCTURAL_KEYS.has(nk)) continue;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      continue;
    }
    const points = workDescriptionToPoints(value);
    if (points.length === 0) continue;
    out.push({ key, points });
  }
  return out;
}
