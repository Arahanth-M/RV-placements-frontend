import {
  composeStoredInterviewExperience,
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
      {
        label: "Round 1",
        number: 1,
        type: "OA",
        subtitle: "",
        body: "OA with 2 DSA questions.",
      },
      {
        label: "Round 2",
        number: 2,
        type: "Technical",
        subtitle: "",
        body: "Technical on graphs and OS.",
      },
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
      {
        label: "Round 1",
        number: 1,
        type: "OA",
        subtitle: "",
        body: "Online Assessment with 2 coding questions.",
      },
      {
        label: "Round 2",
        number: 2,
        type: "Technical",
        subtitle: "",
        body: "Technical Interview on OS.",
      },
    ]);
  });

  test("splits inline OA, technical, and HR headings into ordered rounds", () => {
    const { intro, rounds } = splitExperienceNarrative(
      "OA : Logical Reasoning and 2 hard coding questions Interview : There were 3 technical rounds and 1 HR round Technical Round1: Interviewer asked about a project and cycle detection. Technical Round2 Interviewer asked about libraries and number of islands. Technical Round3 Two hard questions, sliding window and topo sort.\n\nHR Round-Asked general stuff about how Ive collaborated on projects."
    );
    expect(intro).toBe("There were 3 technical rounds and 1 HR round");
    expect(rounds.map((round) => ({ number: round.number, type: round.type }))).toEqual([
      { number: 1, type: "OA" },
      { number: 2, type: "Technical" },
      { number: 3, type: "Technical" },
      { number: 4, type: "Technical" },
      { number: 5, type: "HR" },
    ]);
    expect(rounds[0].body).toMatch(/Logical Reasoning/);
    expect(rounds[1].body).toMatch(/cycle detection/);
    expect(rounds[4].body).toMatch(/collaborated/);
    expect(rounds[1].body).not.toMatch(/Technical Round2/);
  });

  test("keeps an explicit Round number when every heading is numbered", () => {
    const { rounds } = splitExperienceNarrative("Round 3: Onsite system design.");
    expect(rounds).toEqual([
      {
        label: "Round 3",
        number: 3,
        type: "",
        subtitle: "",
        body: "Onsite system design.",
      },
    ]);
  });
});

describe("composeStoredInterviewExperience", () => {
  test("keeps overview, type, title, and details on separate lines", () => {
    expect(
      composeStoredInterviewExperience({
        overview: "I was selected.",
        rounds: [{ type: "OA", title: "HackerRank", details: "Two coding problems." }],
      })
    ).toBe("I was selected.\n\nRound 1: OA\nHackerRank\n\nTwo coding problems.");
  });
});
