import { describe, it, expect } from "vitest";
import {
  platformQuestionEditDraft,
  platformQuestionEditPayload,
} from "../../utils/platformQuestionEdit.js";

describe("platformQuestionEdit", () => {
  it("keeps explanation separate from each language solution", () => {
    const draft = platformQuestionEditDraft({
      question: "Two Sum",
      intuition: "Hash map",
      explanation: "One pass",
      solutions: { cpp: "cpp", java: "", python: "py" },
    });
    expect(platformQuestionEditPayload(draft)).toEqual({
      question: "Two Sum",
      intuition: "Hash map",
      explanation: "One pass",
      solutions: { cpp: "cpp", java: "", python: "py" },
    });
  });
});
