import {
  companyHasInternshipExperience,
  formatExperienceMonth,
  listInternshipExperienceEntries,
  parseExperienceStoredEntry,
} from "../../utils/parseExperienceStoredEntry.js";

describe("parseExperienceStoredEntry", () => {
  test("reads content JSON and prefers sidecar when later", () => {
    const parsed = parseExperienceStoredEntry(
      JSON.stringify({
        content: "Round 1: OA",
        isAnonymous: true,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      "2026-03-15T00:00:00.000Z"
    );
    expect(parsed.content).toBe("Round 1: OA");
    expect(parsed.isAnonymous).toBe(true);
    expect(parsed.updatedAt).toBe("2026-03-15T00:00:00.000Z");
  });

  test("reads internship experience payloads", () => {
    const parsed = parseExperienceStoredEntry(
      JSON.stringify({ experience: "Great intern project" })
    );
    expect(parsed.content).toBe("Great intern project");
    expect(parsed.isAnonymous).toBe(false);
  });

  test("keeps legacy plain strings", () => {
    const parsed = parseExperienceStoredEntry("just a note", "2026-04-01T00:00:00.000Z");
    expect(parsed.content).toBe("just a note");
    expect(parsed.updatedAt).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("formatExperienceMonth", () => {
  test("formats an IST month and year", () => {
    expect(formatExperienceMonth("2026-03-15T10:00:00.000Z")).toBe("March 2026");
  });

  test("returns null for invalid dates", () => {
    expect(formatExperienceMonth(null)).toBeNull();
    expect(formatExperienceMonth("not-a-date")).toBeNull();
  });
});

describe("listInternshipExperienceEntries", () => {
  test("keeps entries with content and drops empty ones", () => {
    const entries = listInternshipExperienceEntries({
      internshipExperience: [
        JSON.stringify({ experience: "Shipped a dashboard" }),
        "   ",
        { experience: "" },
      ],
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].content).toBe("Shipped a dashboard");
  });

  test("companyHasInternshipExperience is false when nothing usable is stored", () => {
    expect(companyHasInternshipExperience({ internshipExperience: [] })).toBe(false);
    expect(companyHasInternshipExperience({ internshipExperience: ["  "] })).toBe(false);
    expect(companyHasInternshipExperience(null)).toBe(false);
    expect(
      companyHasInternshipExperience({
        internshipExperience: JSON.stringify({ experience: "Interned on payments" }),
      })
    ).toBe(true);
  });
});
