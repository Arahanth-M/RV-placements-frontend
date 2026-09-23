/** Mirrors backend college scoping for client-side UI decisions. */

export const COLLEGE_ID_RVCE = "rvce";
export const COLLEGE_ID_RVITM = "rvitm";

/** Campus admin platforms a platform owner can open. Add colleges here as they onboard. */
export const CAMPUS_ADMIN_SITES = [
  {
    id: COLLEGE_ID_RVCE,
    name: "RVCE",
    description: "R.V. College of Engineering — placement visits, SPC, events, and campus student stats.",
    href: "/rvce/admin/dashboard",
  },
];

export const RVCE_PLACEMENT_EMAIL = "placement@rvce.edu.in";
export const RVITM_PLACEMENT_EMAIL = "placement.rvitm@rvei.edu.in";

const RVCE_EMAIL_SUFFIX = "@rvce.edu.in";
const RVITM_EMAIL_SUFFIX = ".rvitm@rvei.edu.in";

/** TEMP: keep in sync with backend TEST_RVITM_EMAILS. */
const TEST_RVITM_EMAILS = new Set(["arahanthmahaveer76@gmail.com","akshathaanilkumar@gmail.com"]);

/**
 * True when email is an RVCE institutional address (`*@rvce.edu.in`).
 * @param {unknown} email
 * @returns {boolean}
 */
export function isRvceEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
    .endsWith(RVCE_EMAIL_SUFFIX);
}

/**
 * True when the signed-in JWT is a platform owner / super admin.
 * @param {{ isSuperAdmin?: unknown, adminScope?: unknown }|null|undefined} user
 * @returns {boolean}
 */
export function isPlatformAdminUser(user) {
  if (!user) return false;
  if (user.isSuperAdmin === true) return true;
  return String(user.adminScope || "")
    .trim()
    .toLowerCase() === "platform";
}

/**
 * RVCE tenant (`/rvce`) is only for signed-in `@rvce.edu.in` accounts.
 * Platform owners may also enter campus dashboards.
 * @param {{ email?: unknown, isSuperAdmin?: unknown, adminScope?: unknown }|null|undefined} user
 * @returns {boolean}
 */
export function canAccessRvceTenant(user) {
  if (!user) return false;
  if (isPlatformAdminUser(user)) return true;
  return isRvceEmail(user.email);
}

/**
 * Institutions that currently have a dedicated campus shell (today: RVCE only).
 * Everyone else lands on `/general` after login.
 * @param {{ email?: unknown }|null|undefined} user
 * @returns {boolean}
 */
export function isOnboardedInstitutionUser(user) {
  return Boolean(user && isRvceEmail(user.email));
}

/**
 * General product shell for signed-in students outside an onboarded campus tenant.
 * Platform owners may also stay on `/general`.
 * @param {{ email?: unknown, isSuperAdmin?: unknown, adminScope?: unknown }|null|undefined} user
 * @returns {boolean}
 */
export function canAccessGeneralTenant(user) {
  if (!user) return false;
  if (isPlatformAdminUser(user)) return true;
  return !isOnboardedInstitutionUser(user);
}

/**
 * @param {{ email?: unknown, isSuperAdmin?: unknown, adminScope?: unknown }|null|undefined} user
 * @returns {"/rvce"|"/general"|"/general/admin/dashboard"|null}
 */
export function getAppHomePathForUser(user) {
  if (!user) return null;
  if (isPlatformAdminUser(user)) return "/general/admin/dashboard";
  return isOnboardedInstitutionUser(user) ? "/rvce" : "/general";
}

/**
 * Product home (not an admin dashboard). Used by public pages such as /onboard.
 * Guests go to `/`; campus students go to `/rvce`; everyone else, including
 * platform owners, goes to `/general`.
 * @param {{ email?: unknown, isSuperAdmin?: unknown, adminScope?: unknown }|null|undefined} user
 * @returns {"/"|"/rvce"|"/general"}
 */
export function getProductHomePathForUser(user) {
  if (!user) return "/";
  if (isPlatformAdminUser(user)) return "/general";
  return isOnboardedInstitutionUser(user) ? "/rvce" : "/general";
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeCollegeId(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === COLLEGE_ID_RVITM) return COLLEGE_ID_RVITM;
  if (s === COLLEGE_ID_RVCE) return COLLEGE_ID_RVCE;
  return COLLEGE_ID_RVCE;
}

/**
 * @param {unknown} email
 * @returns {string}
 */
export function collegeIdFromEmail(email) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (TEST_RVITM_EMAILS.has(normalized)) return COLLEGE_ID_RVITM;
  if (normalized.endsWith(RVITM_EMAIL_SUFFIX)) return COLLEGE_ID_RVITM;
  if (normalized.endsWith(RVCE_EMAIL_SUFFIX)) return COLLEGE_ID_RVCE;
  return COLLEGE_ID_RVCE;
}

/**
 * Prefer JWT `collegeId`, else derive from email.
 * @param {{ collegeId?: unknown, email?: unknown }|null|undefined} user
 * @returns {string}
 */
export function collegeIdFromUser(user) {
  if (user?.collegeId != null && String(user.collegeId).trim() !== "") {
    return normalizeCollegeId(user.collegeId);
  }
  return collegeIdFromEmail(user?.email);
}

/**
 * RVITM admins can view company pages but cannot edit shared content
 * (roles/CTC, eligibility, program got-in, OA, interview Qs/experiences)
 * or approve/reject companies. RVCE admins are unchanged.
 */
export function adminMayMutateSharedCompanyContent(user, isAdmin = false) {
  if (!isAdmin) return false;
  if (isPlatformAdminUser(user)) return true;
  return collegeIdFromUser(user) !== COLLEGE_ID_RVITM;
}

/**
 * @param {unknown} role
 * @returns {boolean}
 */
export function roleHasUsableCompensationForDisplay(role) {
  if (!role || typeof role !== "object") return false;
  const stip = Number(role.internshipStipend);
  if (Number.isFinite(stip) && stip > 0) return true;

  const raw = role.ctc;
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
  if (!obj) return false;
  for (const v of Object.values(obj)) {
    if (v == null) continue;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return true;
    if (typeof v === "string") {
      const s = v.trim();
      if (!s || /^n\/?a$/i.test(s)) continue;
      if (/\d/.test(s)) return true;
    }
  }
  return false;
}
