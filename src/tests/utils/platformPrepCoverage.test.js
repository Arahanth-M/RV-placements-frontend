import { describe, expect, it } from "vitest";
import {
  applyCardDisplayPrepBoost,
  formatPlatformPrepCoverageLine,
  stableCardDisplayCount,
} from "../../utils/platformPrepCoverage.js";

describe("formatPlatformPrepCoverageLine", () => {
  it("formats counts on one compact line", () => {
    expect(
      formatPlatformPrepCoverageLine({ oa: 12, interview: 5, experiences: 3 })
    ).toBe("12 OA · 5 interview q's · 3 interview exprs");
  });

  it("keeps interview expr singular for one", () => {
    expect(
      formatPlatformPrepCoverageLine({ oa: 0, interview: 1, experiences: 1 })
    ).toBe("0 OA · 1 interview q's · 1 interview expr");
  });

  it("treats missing coverage as zeros", () => {
    expect(formatPlatformPrepCoverageLine(undefined)).toBe(
      "0 OA · 0 interview q's · 0 interview expr"
    );
  });
});

describe("applyCardDisplayPrepBoost", () => {
  it("replaces zeros with stable 5–10 counts", () => {
    const boosted = applyCardDisplayPrepBoost(
      { oa: 0, interview: 0, experiences: 0 },
      { companySeed: "co-1", roleKey: "analyst" }
    );
    expect(boosted.oa).toBeGreaterThanOrEqual(5);
    expect(boosted.oa).toBeLessThanOrEqual(10);
    expect(boosted.interview).toBeGreaterThanOrEqual(5);
    expect(boosted.experiences).toBeGreaterThanOrEqual(5);
    expect(stableCardDisplayCount("co-1::analyst:oa")).toBe(boosted.oa);
  });

  it("keeps non-zero counts as-is", () => {
    expect(
      applyCardDisplayPrepBoost(
        { oa: 7, interview: 11, experiences: 3 },
        { companySeed: "co-1", roleKey: "sde" }
      )
    ).toEqual({ oa: 7, interview: 11, experiences: 3 });
  });
});
