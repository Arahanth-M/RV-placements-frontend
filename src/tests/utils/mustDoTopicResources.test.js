import {
  buildFallbackSearchLinks,
  resolveMustDoTopicResources,
} from "../../utils/mustDoTopicResources.js";

describe("resolveMustDoTopicResources", () => {
  test("matches short curated topics", () => {
    const { matches, hasCurated, fallbackLinks } = resolveMustDoTopicResources("OS");
    expect(hasCurated).toBe(true);
    expect(fallbackLinks).toEqual([]);
    expect(matches.some((m) => m.id === "os")).toBe(true);
    expect(matches[0].links.length).toBeGreaterThan(0);
  });

  test("extracts multiple focus areas from a sentence", () => {
    const { matches, hasCurated } = resolveMustDoTopicResources(
      "Revise DBMS, Operating Systems and Dynamic Programming thoroughly"
    );
    expect(hasCurated).toBe(true);
    const ids = matches.map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(["dbms", "os", "dynamic-programming"]));
  });

  test("falls back to search when nothing curated matches", () => {
    const topic = "Company-specific domain knowledge for semiconductor tools";
    const { matches, hasCurated, fallbackLinks } = resolveMustDoTopicResources(topic);
    expect(hasCurated).toBe(false);
    expect(matches).toEqual([]);
    expect(fallbackLinks.length).toBeGreaterThan(0);
    expect(fallbackLinks[0].url).toContain(encodeURIComponent(topic.slice(0, 120)));
  });

  test("buildFallbackSearchLinks encodes query", () => {
    const links = buildFallbackSearchLinks("sliding window");
    expect(links[0].source).toBe("GFG");
    expect(links[0].url).toContain("sliding%20window");
  });
});
