import { describe, it, expect } from "vitest";
import {
  prepRoleLabelsWithContent,
  buildGeneralCompanyPrepSummary,
} from "../../utils/generalCompanyPrepSummary.js";

describe("generalCompanyPrepSummary", () => {
  it("lists prep role labels that have tagged content", () => {
    const labels = prepRoleLabelsWithContent({
      prepRoles: [
        { key: "sde", label: "SDE" },
        { key: "ba", label: "Business analyst" },
      ],
      onlineQuestions_prepRoleKey: ["sde", "sde"],
      interviewQuestions_prepRoleKey: ["ba"],
      researchSources: [{ prepRoleKey: "ba" }],
    });
    expect(labels).toEqual(["SDE", "Business analyst"]);
  });

  it("builds header lines with counts and last updated", () => {
    const summary = buildGeneralCompanyPrepSummary({
      prepRoles: [{ key: "sde", label: "SDE" }],
      onlineQuestions_prepRoleKey: ["sde"],
      platformPrepCoverage: { oa: 2, interview: 1, experiences: 0 },
      platformContentUpdatedAt: "2026-03-15T00:00:00.000Z",
    });
    expect(summary.rolesLine).toBe("SDE");
    expect(summary.updatedLine).toMatch(/Last updated March 2026/);
    expect(summary.countsLine).toMatch(/2 OA questions/);
    expect(summary.countsLine).toMatch(/1 interview question/);
    expect(summary.countsLine).toMatch(/0 interview experiences/);
  });
});
