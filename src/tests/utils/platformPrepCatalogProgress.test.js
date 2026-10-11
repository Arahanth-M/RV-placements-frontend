import { describe, expect, it } from "vitest";
import {
  companyHasPlatformPrepContent,
  summarizeCategoryPrepProgress,
} from "../../utils/platformPrepCatalogProgress.js";

describe("platformPrepCatalogProgress", () => {
  it("counts a company as added only after the research pipeline publishes", () => {
    expect(companyHasPlatformPrepContent({ researchPipelineAdded: true })).toBe(true);
    expect(
      companyHasPlatformPrepContent({
        researchPipelineAdded: false,
        platformPrepCoverage: { oa: 4, interview: 2, experiences: 1 },
      })
    ).toBe(false);
    expect(companyHasPlatformPrepContent(undefined)).toBe(false);
  });

  it("counts added and remaining companies in a category", () => {
    expect(
      summarizeCategoryPrepProgress([
        { researchPipelineAdded: true },
        { researchPipelineAdded: false },
        { researchPipelineAdded: true },
      ])
    ).toEqual({ total: 3, added: 2, remaining: 1 });
  });
});
