import { describe, it, expect } from "vitest";
import {
  classifyResearchSourceSite,
  groupResearchSourcesBySite,
} from "../../utils/researchSourceSite.js";

describe("researchSourceSite", () => {
  it("classifies known hosts", () => {
    expect(classifyResearchSourceSite("https://www.geeksforgeeks.org/foo").label).toBe("GFG");
    expect(classifyResearchSourceSite("https://linkedin.com/posts/1").label).toBe("LinkedIn");
    expect(classifyResearchSourceSite("https://www.glassdoor.co.in/Interview/").label).toBe("Glassdoor");
  });

  it("groups sources by site", () => {
    const groups = groupResearchSourcesBySite([
      { url: "https://leetcode.com/discuss/a" },
      { url: "https://www.geeksforgeeks.org/a" },
      { url: "https://geeksforgeeks.org/b" },
    ]);
    expect(groups.map((g) => g.site.label)).toEqual(["GFG", "LeetCode"]);
    expect(groups[0].items).toHaveLength(2);
  });
});
