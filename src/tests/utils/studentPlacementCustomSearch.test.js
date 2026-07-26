import { describe, expect, it } from "vitest";
import {
  CUSTOM_SEARCH_BRANCH_ALL,
  CUSTOM_SEARCH_OFFER_ALL,
  filterPlacementStudentsForCustomSearch,
  flattenStudentsWithBranch,
  searchPlacementStudentsByStudentQuery,
  studentMatchesCustomSearchFilters,
  studentMeetsCompanyFilter,
  studentMeetsCtcRangeFilter,
  studentMeetsStudentQueryFilter,
  suggestPlacementStudentsForCustomSearch,
} from "../../utils/studentPlacementCustomSearch.js";

const sampleBranches = [
  {
    branchCode: "cse",
    students: [
      { name: "A", usn: "1", typeOfOffer: "FTE", ctc: "14 LPA", companyPlaced: "Amazon India" },
      { name: "B", usn: "2", typeOfOffer: "Internship(PPO)", ctc: "8 LPA", companyPlaced: "Google" },
    ],
  },
  {
    branchCode: "ece",
    students: [{ name: "C", usn: "3", typeOfOffer: "FTE", ctc: "12 LPA" }],
  },
];

describe("flattenStudentsWithBranch", () => {
  it("attaches branchCode to each student", () => {
    const flat = flattenStudentsWithBranch(sampleBranches);
    expect(flat).toHaveLength(3);
    expect(flat[0].branchCode).toBe("cse");
    expect(flat[2].branchCode).toBe("ece");
  });
});

describe("studentMeetsCtcRangeFilter", () => {
  it("passes when no range is set", () => {
    expect(studentMeetsCtcRangeFilter("10 LPA", null, null)).toBe(true);
  });

  it("filters by min, max, or both", () => {
    expect(studentMeetsCtcRangeFilter("14 LPA", 12, null)).toBe(true);
    expect(studentMeetsCtcRangeFilter("8 LPA", 12, null)).toBe(false);
    expect(studentMeetsCtcRangeFilter("8 LPA", null, 10)).toBe(true);
    expect(studentMeetsCtcRangeFilter("14 LPA", null, 10)).toBe(false);
    expect(studentMeetsCtcRangeFilter("12 LPA", 10, 13)).toBe(true);
    expect(studentMeetsCtcRangeFilter("14 LPA", 10, 13)).toBe(false);
    expect(studentMeetsCtcRangeFilter("TBD", 10, 13)).toBe(false);
  });
});

describe("studentMeetsCompanyFilter", () => {
  it("passes when query is empty", () => {
    expect(studentMeetsCompanyFilter("Amazon India", "")).toBe(true);
  });

  it("matches company placed case-insensitively with contains", () => {
    expect(studentMeetsCompanyFilter("Amazon India Pvt Ltd", "amazon")).toBe(true);
    expect(studentMeetsCompanyFilter("Google LLC", "amazon")).toBe(false);
  });
});

describe("studentMatchesCustomSearchFilters", () => {
  it("matches all when filters are default", () => {
    const student = { branchCode: "cse", typeOfOffer: "FTE", ctc: "10 LPA", companyPlaced: "Amazon" };
    expect(
      studentMatchesCustomSearchFilters(student, {
        branch: CUSTOM_SEARCH_BRANCH_ALL,
        offerType: CUSTOM_SEARCH_OFFER_ALL,
        companyQuery: "",
        minCtcLpa: null,
        maxCtcLpa: null,
      })
    ).toBe(true);
  });

  it("filters by company query", () => {
    const student = { branchCode: "cse", typeOfOffer: "FTE", companyPlaced: "Microsoft India" };
    expect(
      studentMatchesCustomSearchFilters(student, {
        branch: CUSTOM_SEARCH_BRANCH_ALL,
        offerType: CUSTOM_SEARCH_OFFER_ALL,
        companyQuery: "micro",
        minCtcLpa: null,
        maxCtcLpa: null,
      })
    ).toBe(true);
    expect(
      studentMatchesCustomSearchFilters(student, {
        branch: CUSTOM_SEARCH_BRANCH_ALL,
        offerType: CUSTOM_SEARCH_OFFER_ALL,
        companyQuery: "google",
        minCtcLpa: null,
        maxCtcLpa: null,
      })
    ).toBe(false);
  });

  it("filters by branch, offer type, and CTC range", () => {
    const student = { branchCode: "cse", typeOfOffer: "FTE", ctc: "14 LPA", companyPlaced: "Amazon" };
    expect(
      studentMatchesCustomSearchFilters(student, {
        branch: "cse",
        offerType: "FTE",
        minCtcLpa: 12,
        maxCtcLpa: null,
      })
    ).toBe(true);
    expect(
      studentMatchesCustomSearchFilters(student, {
        branch: "ece",
        offerType: "FTE",
        minCtcLpa: 12,
        maxCtcLpa: null,
      })
    ).toBe(false);
    expect(
      studentMatchesCustomSearchFilters(student, {
        branch: "cse",
        offerType: "Internship(PPO)",
        minCtcLpa: 12,
        maxCtcLpa: null,
      })
    ).toBe(false);
    expect(
      studentMatchesCustomSearchFilters(student, {
        branch: "cse",
        offerType: "FTE",
        minCtcLpa: 10,
        maxCtcLpa: 13,
      })
    ).toBe(false);
  });
});

describe("filterPlacementStudentsForCustomSearch", () => {
  it("returns filtered students from branches", () => {
    const results = filterPlacementStudentsForCustomSearch(sampleBranches, {
      branch: "cse",
      offerType: "FTE",
      companyQueryInput: "Amazon",
      ctcMinInput: "12",
      ctcMaxInput: "15",
    });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("A");
  });
});

describe("studentMeetsStudentQueryFilter", () => {
  it("matches name, usn, or email with contains", () => {
    const student = { name: "Alice Kumar", usn: "1RV22CS001", email: "alice@rvce.edu" };
    expect(studentMeetsStudentQueryFilter(student, "alice")).toBe(true);
    expect(studentMeetsStudentQueryFilter(student, "1rv22")).toBe(true);
    expect(studentMeetsStudentQueryFilter(student, "rvce")).toBe(true);
    expect(studentMeetsStudentQueryFilter(student, "bob")).toBe(false);
    expect(studentMeetsStudentQueryFilter(student, "")).toBe(false);
  });
});

describe("searchPlacementStudentsByStudentQuery", () => {
  it("returns students matching the student query", () => {
    const results = searchPlacementStudentsByStudentQuery(sampleBranches, {
      studentQueryInput: "1",
    });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("A");
  });

  it("returns no students when query is empty", () => {
    expect(
      searchPlacementStudentsByStudentQuery(sampleBranches, { studentQueryInput: "" })
    ).toHaveLength(0);
  });
});

describe("suggestPlacementStudentsForCustomSearch", () => {
  it("returns suggestions only for queries with at least two characters", () => {
    const branches = [
      {
        branchCode: "cse",
        students: [{ name: "Alice", usn: "1RV22CS001", email: "alice@rvce.edu" }],
      },
    ];
    expect(suggestPlacementStudentsForCustomSearch(branches, "a")).toHaveLength(0);
    const suggestions = suggestPlacementStudentsForCustomSearch(branches, "ali");
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].name).toBe("Alice");
  });
});
