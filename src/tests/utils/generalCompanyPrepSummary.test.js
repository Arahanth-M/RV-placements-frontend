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

  it("treats MCQs as OA content when coverage counts are missing", () => {
    const labels = prepRoleLabelsWithContent({
      prepRoles: [
        { key: "sde", label: "SDE" },
        { key: "analyst", label: "Analyst" },
      ],
      mcqQuestions: [{ question: "Page faults?", prepRoleKey: "analyst" }],
    });
    expect(labels).toEqual(["Analyst"]);

    const summary = buildGeneralCompanyPrepSummary({
      onlineQuestions: ["Two sum"],
      mcqQuestions: [
        { question: "Page faults?", prepRoleKey: "analyst" },
        { question: "   " },
      ],
      interviewQuestions: [],
      interviewProcess: [],
    });
    expect(summary.countsLine).toMatch(/^2 OA questions/);
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
    expect(summary.roleCoverage).toEqual([]);
  });

  it("builds a compact coverage line for each role", () => {
    const summary = buildGeneralCompanyPrepSummary({
      platformPrepCoverageByRole: [
        { key: "sde", label: "SDE", oa: 8, interview: 3, experiences: 2 },
        { key: "analyst", label: "Analyst", oa: 4, interview: 2, experiences: 1 },
      ],
    });
    expect(summary.roleCoverage).toEqual([
      { key: "sde", label: "SDE", line: "8 OA · 3 interview q's · 2 interview exprs" },
      { key: "analyst", label: "Analyst", line: "4 OA · 2 interview q's · 1 interview expr" },
    ]);
  });
});
