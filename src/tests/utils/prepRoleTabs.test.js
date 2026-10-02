import { describe, expect, it } from "vitest";
import {
  buildPrepRoleTabs,
  itemMatchesPrepRoleTab,
  pickDefaultPrepRoleTab,
  prepRoleTabsVisible,
} from "../../utils/prepRoleTabs.js";

describe("prepRoleTabs", () => {
  it("omits General when all content is role-tagged", () => {
    const tabs = buildPrepRoleTabs([{ key: "sde", label: "SDE" }], ["sde", "sde"]);
    expect(tabs.some((tab) => tab.key === "")).toBe(false);
    expect(tabs).toHaveLength(1);
    expect(tabs[0].label).toBe("SDE");
  });

  it("includes General only when untagged content exists", () => {
    const tabs = buildPrepRoleTabs([{ key: "sde", label: "SDE" }], ["", "sde"]);
    expect(tabs[0].label).toBe("General");
    expect(tabs.some((tab) => tab.key === "sde")).toBe(true);
  });

  it("can hide General on company-facing role pickers", () => {
    const tabs = buildPrepRoleTabs([{ key: "sde", label: "SDE" }], ["", "sde"], {
      excludeGeneralTab: true,
    });
    expect(tabs.some((tab) => tab.key === "")).toBe(false);
    expect(tabs).toHaveLength(1);
  });

  it("shows tabs when multiple roles exist", () => {
    expect(prepRoleTabsVisible(buildPrepRoleTabs([], ["", "sde"]))).toBe(true);
    expect(prepRoleTabsVisible(buildPrepRoleTabs([], [""]))).toBe(false);
  });

  it("matches items to active tab key", () => {
    expect(itemMatchesPrepRoleTab("sde", "sde")).toBe(true);
    expect(itemMatchesPrepRoleTab("", "")).toBe(true);
    expect(itemMatchesPrepRoleTab("sde", "")).toBe(false);
  });

  it("defaults to the role tab with the most items", () => {
    expect(
      pickDefaultPrepRoleTab([{ key: "sde", label: "SDE" }], ["", "sde", "sde"])
    ).toBe("sde");
    expect(pickDefaultPrepRoleTab([], ["", ""])).toBe("");
  });
});
