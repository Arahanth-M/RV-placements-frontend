import { describe, expect, it } from "vitest";
import { listStudyScheduleOptions } from "../../utils/prepPathStudySchedule.js";

describe("listStudyScheduleOptions", () => {
  it("builds stretch and even batch options from hours per day", () => {
    const labels = listStudyScheduleOptions(2).map((o) => o.label);
    expect(labels).toContain("One stretch · 2h");
    expect(labels).toContain("2 slots · 1h each");
    expect(labels).toContain("4 slots · 30 min each");
  });

  it("only offers a single stretch for a 30-minute day", () => {
    expect(listStudyScheduleOptions(0.5)).toEqual([
      expect.objectContaining({
        style: "stretch",
        slotsPerDay: 1,
        slotMinutes: 30,
      }),
    ]);
  });
});
