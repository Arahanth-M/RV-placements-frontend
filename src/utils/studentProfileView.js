/**
 * Pure helpers for mapping roster-shaped profile documents into UI sections.
 */

const PERSONAL_INFO_FIELDS = ["USN", "Name", "Email", "Phone", "DOB", "Gender"];
const ACADEMIC_FIELDS = ["Branch", "Semester", "CGPA", "Year", "Section"];

const HIDDEN_PROFILE_KEYS = new Set([
  "companyid",
  "placementcompanies",
  "primarycompanyname",
  "profilesource",
  "student",
  "placements",
]);

const PRIMARY_COMPANY_KEY_NORMALS = new Set([
  "company",
  "companyname",
  "nameofcompany",
]);
const PRIMARY_COMPANY_PRIORITY = ["company", "companyname", "nameofcompany"];

const EMAIL_KEY_NORMALS = new Set([
  "email",
  "emailaddress",
  "studentemail",
  "collegeemail",
]);
const EMAIL_PRIORITY = ["email", "emailaddress", "studentemail", "collegeemail"];

export function normalizeProfileStorageKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function formatProfileLabel(key) {
  const spaced = String(key || "")
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  if (!spaced) return "";

  return spaced
    .split(/\s+/)
    .map((word) => {
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function unwrapDisplayString(s) {
  if (typeof s !== "string") return s;
  let t = s.trim();
  if (
    t.length >= 2 &&
    ((t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith("'") && t.endsWith("'")))
  ) {
    t = t.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return t;
}

/** Omit noisy Mongo/metadata keys when flattening nested objects for display. */
const NESTED_INTERNAL_KEYS = new Set([
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "studentId",
  "createdBy",
]);

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function formatStudentLikeObject(obj) {
  const name = obj.name ?? obj.Name ?? obj.studentName;
  const email = obj.email ?? obj.Email;
  const usn = obj.usn ?? obj.USN;
  const phone = obj.phoneNumber ?? obj.phone ?? obj.Phone ?? obj.Mobile;
  const lines = [];
  if (name) lines.push(`Name: ${name}`);
  if (email) lines.push(`Email: ${email}`);
  if (usn) lines.push(`USN: ${usn}`);
  if (phone != null && String(phone).trim()) lines.push(`Phone: ${phone}`);
  return lines.length ? lines.join("\n") : null;
}

function formatPlacementRecord(obj) {
  const company =
    obj.companyPlaced ??
    obj.company ??
    obj.Company ??
    obj.companyName ??
    obj.company_name ??
    "—";
  const offer =
    obj.typeOfOffer ?? obj.offerType ?? obj.offer ?? obj.type ?? "";
  const stipend = obj.stipend ?? obj.Stipend;
  const baseVal = obj.base ?? obj.Base;
  const ctcVal = obj.ctc ?? obj.CTC;
  const parts = [String(company).trim()];
  if (offer) parts.push(`(${String(offer).trim()})`);
  let line = parts.filter(Boolean).join(" ");
  if (stipend != null && String(stipend).trim())
    line += ` · Stipend: ${String(stipend).trim()}`;
  if (baseVal != null && String(baseVal).trim())
    line += ` · Base: ${String(baseVal).trim()}`;
  if (ctcVal != null && String(ctcVal).trim())
    line += ` · CTC: ${String(ctcVal).trim()}`;
  return line || "—";
}

function isPlacementLikeRecord(obj) {
  if (!isPlainObject(obj)) return false;
  return (
    obj.companyPlaced != null ||
    obj.company != null ||
    obj.companyName != null ||
    obj.typeOfOffer != null ||
    obj.offerType != null
  );
}

/**
 * Turn roster/API nested structures into readable text (never raw JSON for known shapes).
 */
export function getProfileDisplayValue(value) {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return String(unwrapDisplayString(value));

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    const objects = value.filter(isPlainObject);
    if (
      objects.length === value.length &&
      value.some(isPlacementLikeRecord)
    ) {
      return value
        .map((item, i) => `${i + 1}. ${formatPlacementRecord(item)}`)
        .join("\n");
    }
    return JSON.stringify(value, null, 2);
  }

  if (isPlainObject(value)) {
    const studentLines = formatStudentLikeObject(value);
    if (studentLines) return studentLines;

    if (isPlacementLikeRecord(value)) return formatPlacementRecord(value);

    const primitives = Object.entries(value).filter(
      ([k, v]) =>
        !NESTED_INTERNAL_KEYS.has(k) &&
        v !== null &&
        v !== undefined &&
        (typeof v === "string" || typeof v === "number") &&
        String(v).trim() !== ""
    );
    if (primitives.length > 0) {
      return primitives
        .map(([k, v]) => `${formatProfileLabel(k)}: ${v}`)
        .join("\n");
    }

    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function isHiddenProfileKey(key) {
  if (key === "company") return true;
  return HIDDEN_PROFILE_KEYS.has(normalizeProfileStorageKey(key));
}

export function isProfileFieldAvailable(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value))
    return value.some((item) => isProfileFieldAvailable(item));
  if (typeof value === "object") {
    return Object.values(value).some((item) => isProfileFieldAvailable(item));
  }
  return true;
}

function normFieldKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isPrimaryCompanySemanticKey(key) {
  return PRIMARY_COMPANY_KEY_NORMALS.has(normFieldKey(key));
}

function normalizeCompanyValueForDedupe(v) {
  return String(unwrapDisplayString(v) ?? "").trim().toLowerCase();
}

function getCanonicalPrimaryCompanyKey(data) {
  const keys = Object.keys(data).filter(
    (k) =>
      PRIMARY_COMPANY_KEY_NORMALS.has(normFieldKey(k)) &&
      isProfileFieldAvailable(data[k])
  );
  if (keys.length === 0) return null;
  for (const norm of PRIMARY_COMPANY_PRIORITY) {
    const hit = keys.find((k) => normFieldKey(k) === norm);
    if (hit) return hit;
  }
  return keys[0];
}

function shouldHideDuplicateCompanyField(data, key) {
  if (!PRIMARY_COMPANY_KEY_NORMALS.has(normFieldKey(key))) return false;
  const canonical = getCanonicalPrimaryCompanyKey(data);
  if (!canonical || key === canonical) return false;
  return (
    normalizeCompanyValueForDedupe(data[key]) ===
    normalizeCompanyValueForDedupe(data[canonical])
  );
}

function normalizeEmailValueForDedupe(v) {
  return String(unwrapDisplayString(v) ?? "").trim().toLowerCase();
}

function getCanonicalEmailKey(data) {
  const keys = Object.keys(data).filter(
    (k) => EMAIL_KEY_NORMALS.has(normFieldKey(k)) && isProfileFieldAvailable(data[k])
  );
  if (keys.length === 0) return null;
  for (const norm of EMAIL_PRIORITY) {
    const hit = keys.find((k) => normFieldKey(k) === norm);
    if (hit) return hit;
  }
  return keys[0];
}

function shouldHideDuplicateEmailField(data, key) {
  if (!EMAIL_KEY_NORMALS.has(normFieldKey(key))) return false;
  const canonical = getCanonicalEmailKey(data);
  if (!canonical || key === canonical) return false;
  return (
    normalizeEmailValueForDedupe(data[key]) ===
    normalizeEmailValueForDedupe(data[canonical])
  );
}

function shouldHideDuplicateProfileField(data, key) {
  return (
    shouldHideDuplicateCompanyField(data, key) ||
    shouldHideDuplicateEmailField(data, key)
  );
}

function matchesPersonalField(key) {
  const lowerKey = key.toLowerCase();
  if (isPrimaryCompanySemanticKey(key)) return false;
  if (lowerKey.includes("company")) return false;
  return PERSONAL_INFO_FIELDS.some((f) => lowerKey.includes(f.toLowerCase()));
}

function matchesAcademicField(key) {
  const lowerKey = key.toLowerCase();
  return ACADEMIC_FIELDS.some((f) => lowerKey.includes(f.toLowerCase()));
}

export function getProfileFieldCategory(key) {
  if (matchesPersonalField(key)) return "personal";
  if (matchesAcademicField(key)) return "academic";
  return "company";
}

/** Keys to show on the profile page in stable object iteration order. */
export function getStudentProfileValidKeys(profileData) {
  if (!profileData || typeof profileData !== "object") return [];

  return Object.keys(profileData).filter(
    (key) =>
      key &&
      key !== "_id" &&
      key !== "__v" &&
      !isHiddenProfileKey(key) &&
      !shouldHideDuplicateProfileField(profileData, key) &&
      isProfileFieldAvailable(profileData[key])
  );
}
