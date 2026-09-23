import { describe, expect, it } from "vitest";
import {
  buildPrepPathCompanyHref,
  buildPrepPathMockInterviewHref,
  displayPrepEvidenceLabel,
  findFocusIndex,
  parsePrepPathMockPrefill,
  readCompanyFocusFromLocation,
  tabForPrepEvidence,
  textMatchesFocus,
} from "../../utils/prepPathCompanyFocus.js";

describe("prepPathCompanyFocus", () => {
  it("maps evidence types onto company tabs", () => {
    expect(tabForPrepEvidence("oa")).toBe("oa");
    expect(tabForPrepEvidence("coding")).toBe("coding");
    expect(tabForPrepEvidence("interview_question")).toBe("interview");
    expect(tabForPrepEvidence("interview_experience")).toBe("interview");
    expect(tabForPrepEvidence("must_do")).toBe("mustdo");
    expect(tabForPrepEvidence("platform_role")).toBeNull();
  });

  it("matches truncated snippets to full question text", () => {
    const full = "Two Sum: given an array of integers, return indices of the two numbers.";
    expect(textMatchesFocus(full, "Two Sum: given an array of integers")).toBe(true);
    expect(findFocusIndex([full, "Other"], "Two Sum")).toBe(0);
  });

  it("builds a company deep-link that can return to PrepPath", () => {
    const href = buildPrepPathCompanyHref((p) => `/general${p}`, "abc123", {
      tab: "oa",
      focus: "Two Sum",
    });
    expect(href).toContain("/general/companies/abc123?");
    expect(href).toContain("tab=oa");
    expect(href).toContain("focus=Two");
    expect(href).toContain("from=preppath");
  });

  it("rewrites leftover RVCE labels on /general", () => {
    expect(
      displayPrepEvidenceLabel("Seen in RVCE visit data: OA", { isGeneral: true })
    ).toBe("Seen on the platform: OA");
  });

  it("builds a /general interviews deep-link from a PrepPath mock suggestion", () => {
    const href = buildPrepPathMockInterviewHref((p) => `/general${p}`, "abc123", {
      role: "Software Engineer (SDE)",
      difficulty: "medium",
      rounds: ["DSA", "CS Fundamentals", "HR"],
    });
    expect(href).toContain("/general/interviews?");
    expect(href).toContain("companyId=abc123");
    expect(href).toContain("role=Software");
    expect(href).toContain("difficulty=medium");
    expect(href).toContain("rounds=DSA");
    expect(href).toContain("from=preppath");
  });

  it("parses interviews-hub prefill params", () => {
    expect(
      parsePrepPathMockPrefill(
        "?companyId=abc&role=Frontend+Engineer&difficulty=easy&rounds=DSA,HR&from=preppath"
      )
    ).toEqual({
      role: "Frontend Engineer",
      difficulty: "easy",
      rounds: ["DSA", "HR"],
      fromPrepPath: true,
    });
  });

  it("reads tab, focus, and PrepPath return flag from the company URL", () => {
    expect(
      readCompanyFocusFromLocation({
        search: "?tab=oa&focus=Two+Sum&from=preppath",
        state: {},
      })
    ).toEqual({
      tab: "oa",
      focus: "Two Sum",
      fromPrepPath: true,
    });
  });
});
