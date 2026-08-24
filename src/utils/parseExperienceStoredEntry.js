/**
 * Parse visit-array experience strings for display. Does not rewrite stored data.
 */

function asDateIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function laterIso(a, b) {
  const left = asDateIso(a);
  const right = asDateIso(b);
  if (!left) return right;
  if (!right) return left;
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

/**
 * @param {unknown} entry
 * @param {unknown} [sidecarDate]
 * @returns {{ content: string, isAnonymous: boolean, submittedBy: unknown, updatedAt: string|null }}
 */
export function parseExperienceStoredEntry(entry, sidecarDate = null) {
  const sidecar = asDateIso(sidecarDate);

  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const content = String(entry.content || entry.experience || "").trim();
    return {
      content,
      isAnonymous: entry.isAnonymous === true || entry.isAnonymous === "true",
      submittedBy: entry.submittedBy || null,
      updatedAt: laterIso(
        laterIso(entry.updatedAt, laterIso(entry.approvedAt, entry.submittedAt)),
        sidecar
      ),
    };
  }

  const trimmed = String(entry || "").trim();
  if (!trimmed) {
    return { content: "", isAnonymous: false, submittedBy: null, updatedAt: sidecar };
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      const content = String(parsed.content || parsed.experience || "").trim();
      if (content || parsed.submittedBy || parsed.isAnonymous != null) {
        return {
          content: content || trimmed,
          isAnonymous: parsed.isAnonymous === true || parsed.isAnonymous === "true",
          submittedBy: parsed.submittedBy || null,
          updatedAt: laterIso(
            laterIso(parsed.updatedAt, laterIso(parsed.approvedAt, parsed.submittedAt)),
            sidecar
          ),
        };
      }
    }
  } catch {
    // legacy plain string
  }

  return {
    content: trimmed,
    isAnonymous: false,
    submittedBy: null,
    updatedAt: sidecar,
  };
}

/**
 * Display-ready internship write-ups from a company/visit payload.
 * Empty or unreadable entries are omitted.
 */
export function listInternshipExperienceEntries(company) {
  const internDates = Array.isArray(company?.internshipExperienceUpdatedAt)
    ? company.internshipExperienceUpdatedAt
    : [];
  const raw = company?.internshipExperience;

  if (Array.isArray(raw)) {
    return raw
      .map((exp, index) => {
        if (!exp || (typeof exp !== "string" && typeof exp !== "object")) return null;
        const parsed = parseExperienceStoredEntry(exp, internDates[index]);
        if (!parsed.content) return null;
        return parsed;
      })
      .filter((exp) => exp !== null);
  }

  if (typeof raw === "string" && raw.trim().length > 0) {
    const parsed = parseExperienceStoredEntry(raw, internDates[0]);
    return parsed.content ? [parsed] : [];
  }

  return [];
}

export function companyHasInternshipExperience(company) {
  return listInternshipExperienceEntries(company).length > 0;
}

/** Month + year in IST, e.g. "March 2026". */
export function formatExperienceMonth(dateLike) {
  const iso = asDateIso(dateLike);
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
