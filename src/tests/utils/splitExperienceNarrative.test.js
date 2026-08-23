import {
  shouldShowExperienceTimeline,
  splitExperienceNarrative,
} from "../../utils/splitExperienceNarrative.js";

describe("splitExperienceNarrative", () => {
  test("returns empty for blank input", () => {
    expect(splitExperienceNarrative("")).toEqual({ intro: "", rounds: [] });
    expect(splitExperienceNarrative(null)).toEqual({ intro: "", rounds: [] });
  });

  test("keeps unstructured notes as intro with no rounds", () => {
    const { intro, rounds } = splitExperienceNarrative(
      "They asked about my projects more than DSA."
    );
    expect(intro).toBe("They asked about my projects more than DSA.");
    expect(rounds).toEqual([]);
    expect(shouldShowExperienceTimeline({ intro, rounds })).toBe(false);
  });

  test("splits Round 1 / Round 2 into a timeline", () => {
    const { intro, rounds } = splitExperienceNarrative(
      "Round 1: OA with 2 DSA questions.\nRound 2: Technical on graphs and OS."
    );
    expect(intro).toBe("");
    expect(rounds).toEqual([
      { label: "Round 1", body: "OA with 2 DSA questions." },
      { label: "Round 2", body: "Technical on graphs and OS." },
    ]);
    expect(shouldShowExperienceTimeline({ intro, rounds })).toBe(true);
  });

  test("keeps a preface before the first Round heading", () => {
    const { intro, rounds } = splitExperienceNarrative(
      "Overall positive.\nRound 1: HR screen\nRound 2: Onsite"
    );
    expect(intro).toBe("Overall positive.");
    expect(rounds.map((r) => r.label)).toEqual(["Round 1", "Round 2"]);
  });

  test("splits hyphen-style Round headings used in the add placeholder", () => {
    const { rounds } = splitExperienceNarrative(
      "Round 1 - Online Assessment with 2 coding questions.\nRound 2 - Technical Interview on OS."
    );
    expect(rounds).toEqual([
      { label: "Round 1", body: "Online Assessment with 2 coding questions." },
      { label: "Round 2", body: "Technical Interview on OS." },
    ]);
  });
});
