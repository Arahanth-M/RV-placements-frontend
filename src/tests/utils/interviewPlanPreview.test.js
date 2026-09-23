import { describe, expect, it } from "vitest";
import {
  buildInterviewPlanPreview,
  getRoundStructurePreview,
  resolveInterviewFocusTopic,
} from "../../utils/interviewPlanPreview";
import { PLATFORM_INTERVIEW_ROUND_TYPES } from "../../constants/interviewCatalog";

describe("interviewPlanPreview", () => {
  it("describes Web Dev as 2 MCQs + 1 theory", () => {
    const structure = getRoundStructurePreview("Web Dev");
    expect(structure.questionCount).toBe(3);
    expect(structure.mix).toMatch(/2 MCQs/i);
    expect(structure.mix).toMatch(/theory/i);
  });

  it("describes DSA as 2 coding problems and HR as one behavioral question", () => {
    expect(getRoundStructurePreview("DSA")).toMatchObject({
      questionCount: 2,
      mix: "2 coding problems",
    });
    expect(getRoundStructurePreview("HR")).toMatchObject({
      questionCount: 1,
      mix: "1 behavioral question",
    });
  });

  it("covers every platform round type", () => {
    for (const type of PLATFORM_INTERVIEW_ROUND_TYPES) {
      const structure = getRoundStructurePreview(type);
      expect(structure.mix).toBeTruthy();
      expect(structure.brief).toBeTruthy();
      expect(structure.questionCount).toBeGreaterThan(0);
    }
  });

  it("uses the selected focus label as the topic", () => {
    expect(resolveInterviewFocusTopic("Web Dev", "javascript")).toBe("JavaScript");
    expect(resolveInterviewFocusTopic("CS Fundamentals", "bank:Operating%20Systems")).toBe(
      "Operating Systems"
    );
  });

  it("builds a preview for a Backend Engineer Web Dev + System Design plan", () => {
    const preview = buildInterviewPlanPreview(
      [
        { type: "Web Dev", difficulty: "medium", focus: "javascript" },
        { type: "System Design", difficulty: "medium", focus: "scalability" },
      ],
      {
        role: "Backend Engineer",
        difficulty: "medium",
        companyName: "Google",
      }
    );

    expect(preview.totalRounds).toBe(2);
    expect(preview.totalQuestions).toBe(6);
    expect(preview.rounds[0]).toMatchObject({
      roundNumber: 1,
      type: "Web Dev",
      topic: "JavaScript",
      mix: "2 MCQs + 1 theory question",
    });
    expect(preview.rounds[1]).toMatchObject({
      roundNumber: 2,
      type: "System Design",
      topic: "Scalability",
      mix: "3 design questions",
    });
  });
});
