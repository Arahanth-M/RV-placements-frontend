import { describe, expect, it } from "vitest";
import {
  categorizeTypeOfOffer,
  computePlacementStatsSummary,
  bucketStudentCtc,
  parseCtcThresholdLpa,
} from "../../utils/studentPlacementStatsSummary.js";

describe("categorizeTypeOfOffer", () => {
  it("maps SPC offer types to summary buckets", () => {
    expect(categorizeTypeOfOffer("FTE")).toBe("fte");
    expect(categorizeTypeOfOffer("Internship+FTE")).toBe("internshipFte");
    expect(categorizeTypeOfOffer("Internship + FTE (PBC)")).toBe("internshipFte");
    expect(categorizeTypeOfOffer("Internship(PPO)")).toBe("internshipOnly");
    expect(categorizeTypeOfOffer("Only internship(6 months)")).toBe("internshipOnly");
    expect(categorizeTypeOfOffer("")).toBe("other");
  });
});

describe("computePlacementStatsSummary", () => {
  it("counts offer types and CTC buckets", () => {
    const students = [
      { typeOfOffer: "FTE", ctc: "14 LPA" },
      { typeOfOffer: "FTE", ctc: "8 LPA" },
      { typeOfOffer: "Internship+FTE", ctc: "TBD" },
      { typeOfOffer: "Internship(PPO)", ctc: "" },
    ];
    const summary = computePlacementStatsSummary(students, 12);
    expect(summary.total).toBe(4);
    expect(summary.offer.fte).toBe(2);
    expect(summary.offer.internshipFte).toBe(1);
    expect(summary.offer.internshipOnly).toBe(1);
    expect(summary.ctc.above).toBe(1);
    expect(summary.ctc.below).toBe(1);
    expect(summary.ctc.unknown).toBe(2);
  });
});

describe("parseCtcThresholdLpa", () => {
  it("parses valid threshold", () => {
    expect(parseCtcThresholdLpa("12")).toBe(12);
    expect(parseCtcThresholdLpa("10.5")).toBe(10.5);
    expect(parseCtcThresholdLpa("")).toBeNull();
    expect(parseCtcThresholdLpa("-1")).toBeNull();
  });
});

describe("bucketStudentCtc", () => {
  it("classifies against threshold", () => {
    expect(bucketStudentCtc("15 LPA", 12)).toBe("above");
    expect(bucketStudentCtc("9 LPA", 12)).toBe("below");
    expect(bucketStudentCtc("TBD", 12)).toBe("unknown");
  });
});
