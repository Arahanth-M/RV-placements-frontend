/**
 * @param {unknown} iso
 * @returns {string}
 */
export function formatPlacementRecordWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/**
 * @param {{ updatedAt?: unknown, createdAt?: unknown } | null | undefined}
 * @returns {unknown}
 */
export function placementRecordTimestamp(student) {
  return student?.updatedAt ?? student?.createdAt ?? null;
}
