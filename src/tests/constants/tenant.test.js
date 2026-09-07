import { describe, it, expect } from "vitest";
import {
  TENANT_BASE,
  tenantPath,
  isTenantAppPath,
  toTenantAppPath,
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

describe("isTenantAppPath", () => {
  it("detects nested dashboard URLs", () => {
    expect(isTenantAppPath("/rvce")).toBe(true);
    expect(isTenantAppPath("/rvce/category")).toBe(true);
    expect(isTenantAppPath("/")).toBe(false);
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
