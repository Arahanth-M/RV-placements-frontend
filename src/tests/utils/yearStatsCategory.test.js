import { describe, expect, it } from "vitest";
import {
  resolveYearStatsRowCategory,
  resolveYearStatsRowCtcRupees,
} from "../../utils/yearStatsCategory.js";

describe("yearStatsCategory", () => {
  it("uses the highest CTC column, not the first low value", () => {
    const row = { ctc: "8 LPA", package: "18 LPA" };
    expect(resolveYearStatsRowCtcRupees(row)).toBe(1_800_000);
    expect(resolveYearStatsRowCategory(row, 10)).toBe("open_dream");
  });

  it("averages CTC ranges like the backend", () => {
    const row = { CTC: "9-12 LPA" };
    expect(resolveYearStatsRowCtcRupees(row)).toBe(1_050_000);
    expect(resolveYearStatsRowCategory(row, 10)).toBe("open_dream");
  });

  it("reads nested ctc objects using only the CTC total key", () => {
    const row = { ctc: { CTC: "18 LPA", Base: "8 LPA" } };
    expect(resolveYearStatsRowCtcRupees(row)).toBe(1_800_000);
    expect(resolveYearStatsRowCategory(row, 10)).toBe("open_dream");
  });

  it("does not inflate dream tier by summing CTC and Base on the same object", () => {
    const row = { ctc: { CTC: "8 LPA", Base: "6 LPA" } };
    expect(resolveYearStatsRowCategory(row, 10)).toBe("dream");
  });

  it("falls back to Base only when no CTC column is present", () => {
    const row = { Base: "12 LPA" };
    expect(resolveYearStatsRowCategory(row, 10)).toBe("open_dream");
  });

  it("honors explicit open-dream tier when CTC is missing", () => {
    const row = { category: "Open Dream", company: "Acme" };
    expect(resolveYearStatsRowCategory(row, 10)).toBe("open_dream");
  });

  it("keeps open-dream rows out of dream when type says open-dream but base CTC is low", () => {
    const row = { type: "open-dream", ctc: "8 LPA" };
    expect(resolveYearStatsRowCategory(row, 10)).toBe("open_dream");
  });

  it("classifies under-threshold packages as dream", () => {
    const row = { ctc: "7 LPA" };
    expect(resolveYearStatsRowCategory(row, 10)).toBe("dream");
  });
});
