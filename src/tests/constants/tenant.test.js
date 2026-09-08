import { describe, it, expect } from "vitest";
import {
  TENANT_BASE,
  GENERAL_BASE,
  tenantPath,
  generalPath,
  isTenantAppPath,
  isGeneralAppPath,
  isAppShellPath,
  toTenantAppPath,
  toPostLoginAppPath,
} from "../../constants/tenant.js";

describe("tenantPath", () => {
  it("maps dashboard home to /rvce", () => {
    expect(tenantPath("/")).toBe("/rvce");
    expect(tenantPath("")).toBe(TENANT_BASE);
  });

  it("prefixes app routes and keeps query strings", () => {
    expect(tenantPath("/category")).toBe("/rvce/category");
    expect(tenantPath("/companystats?tier=dream")).toBe("/rvce/companystats?tier=dream");
  });

  it("does not double-prefix", () => {
    expect(tenantPath("/rvce/login")).toBe("/rvce/login");
  });
});

describe("generalPath", () => {
  it("maps onto /general", () => {
    expect(generalPath("/")).toBe(GENERAL_BASE);
    expect(generalPath("/interviews")).toBe("/general/interviews");
  });
});

describe("isTenantAppPath", () => {
  it("detects nested dashboard URLs", () => {
    expect(isTenantAppPath("/rvce")).toBe(true);
    expect(isTenantAppPath("/rvce/category")).toBe(true);
    expect(isTenantAppPath("/")).toBe(false);
    expect(isGeneralAppPath("/general")).toBe(true);
    expect(isAppShellPath("/general/prep-path")).toBe(true);
  });
});

describe("toTenantAppPath", () => {
  it("maps legacy bookmarks onto /rvce", () => {
    expect(toTenantAppPath("/")).toBe("/rvce");
    expect(toTenantAppPath("/category")).toBe("/rvce/category");
    expect(toTenantAppPath("/companystats?tier=dream")).toBe(
      "/rvce/companystats?tier=dream"
    );
  });

  it("sends login and OAuth callback paths to dashboard home", () => {
    expect(toTenantAppPath("/login")).toBe("/rvce");
    expect(toTenantAppPath("/rvce/login")).toBe("/rvce");
    expect(toTenantAppPath("/auth/callback")).toBe("/rvce");
  });
});

describe("toPostLoginAppPath", () => {
  it("sends non-onboarded users to /general", () => {
    expect(toPostLoginAppPath("/", { useGeneral: true })).toBe("/general");
    expect(toPostLoginAppPath("/rvce/interviews", { useGeneral: true })).toBe(
      "/general/interviews"
    );
    expect(toPostLoginAppPath("/prep-path", { useGeneral: true })).toBe(
      "/general/prep-path"
    );
  });

  it("keeps RVCE users on /rvce", () => {
    expect(toPostLoginAppPath("/", { useGeneral: false })).toBe("/rvce");
    expect(toPostLoginAppPath("/general", { useGeneral: false })).toBe("/rvce");
  });
});
