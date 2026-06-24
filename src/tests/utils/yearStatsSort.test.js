import { describe, expect, it } from "vitest";
import { sortYearStatsRows } from "../../utils/yearStatsSort.js";

describe("yearStatsSort", () => {
  it("sorts rows ascending by Sl. No", () => {
    const rows = [
      { "Sl. No": 10, name: "Z" },
      { "Sl. No": 2, name: "A" },
      { "Sl. No": 5, name: "M" },
    ];
    expect(sortYearStatsRows(rows).map((r) => r.name)).toEqual(["A", "M", "Z"]);
  });
});
