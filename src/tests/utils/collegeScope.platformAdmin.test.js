import { describe, it, expect } from "vitest";
import {
  CAMPUS_ADMIN_SITES,
  canAccessRvceTenant,
  canAccessGeneralTenant,
  getAppHomePathForUser,
  getProductHomePathForUser,
  isPlatformAdminUser,
  isOnboardedInstitutionUser,
} from "../../utils/collegeScope.js";

describe("platform admin tenant access", () => {
  const owner = {
    email: "owner@gmail.com",
    isSuperAdmin: true,
    adminScope: "platform",
  };
  const rvceStudent = { email: "student@rvce.edu.in" };
  const generalStudent = { email: "student@gmail.com" };

  it("detects platform owners from JWT claims", () => {
    expect(isPlatformAdminUser(owner)).toBe(true);
    expect(isPlatformAdminUser(rvceStudent)).toBe(false);
  });

  it("lets platform owners enter both shells", () => {
    expect(canAccessRvceTenant(owner)).toBe(true);
    expect(canAccessGeneralTenant(owner)).toBe(true);
    expect(isOnboardedInstitutionUser(owner)).toBe(false);
    expect(getAppHomePathForUser(owner)).toBe("/general/admin/dashboard");
    expect(getProductHomePathForUser(owner)).toBe("/general");
    expect(getProductHomePathForUser(null)).toBe("/");
  });

  it("lists RVCE as the only campus admin platform for now", () => {
    expect(CAMPUS_ADMIN_SITES).toEqual([
      expect.objectContaining({
        id: "rvce",
        name: "RVCE",
        href: "/rvce/admin/dashboard",
      }),
    ]);
  });

  it("keeps RVCE students on campus and general students on /general", () => {
    expect(canAccessRvceTenant(rvceStudent)).toBe(true);
    expect(canAccessGeneralTenant(rvceStudent)).toBe(false);
    expect(getAppHomePathForUser(rvceStudent)).toBe("/rvce");
    expect(getProductHomePathForUser(rvceStudent)).toBe("/rvce");
    expect(canAccessRvceTenant(generalStudent)).toBe(false);
    expect(canAccessGeneralTenant(generalStudent)).toBe(true);
    expect(getAppHomePathForUser(generalStudent)).toBe("/general");
    expect(getProductHomePathForUser(generalStudent)).toBe("/general");
  });
});
