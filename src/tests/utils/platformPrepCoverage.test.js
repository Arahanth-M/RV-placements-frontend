import { describe, expect, it } from "vitest";
import { formatPlatformPrepCoverageLine } from "../../utils/platformPrepCoverage.js";

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
