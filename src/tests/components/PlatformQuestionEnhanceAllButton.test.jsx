import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlatformQuestionEnhanceAllButton, {
  isCodingOnlyEnhanceField,
  isCodingQuestionKind,
  runEnhanceEverythingForCompany,
} from "../../components/platform/PlatformQuestionEnhanceAllButton.jsx";

describe("coding-only enhance helpers", () => {
  it("treats intuition and languages as coding-only", () => {
    expect(isCodingOnlyEnhanceField("intuition")).toBe(true);
    expect(isCodingOnlyEnhanceField("cpp")).toBe(true);
    expect(isCodingOnlyEnhanceField("java")).toBe(true);
    expect(isCodingOnlyEnhanceField("python")).toBe(true);
    expect(isCodingOnlyEnhanceField("question")).toBe(false);
    expect(isCodingOnlyEnhanceField("explanation")).toBe(false);
  });

  it("recognizes coding kinds only", () => {
    expect(isCodingQuestionKind("coding")).toBe(true);
    expect(isCodingQuestionKind("non_coding")).toBe(false);
    expect(isCodingQuestionKind("sql")).toBe(false);
    expect(isCodingQuestionKind(undefined)).toBe(false);
  });
});

describe("runEnhanceEverythingForCompany", () => {
  it("skips coding-only fields when shouldEnhance returns false", async () => {
    const enhanceOne = vi.fn().mockResolvedValue({});
    const kinds = ["non_coding", "coding"];

    const summary = await runEnhanceEverythingForCompany({
      indexes: [0, 1],
      fields: ["question", "intuition", "cpp"],
      enhanceOne,
      shouldEnhance: (index, field) => {
        if (!isCodingOnlyEnhanceField(field)) return true;
        return isCodingQuestionKind(kinds[index]);
      },
    });

    expect(enhanceOne).toHaveBeenCalledTimes(4);
    expect(enhanceOne).toHaveBeenCalledWith(0, "question");
    expect(enhanceOne).toHaveBeenCalledWith(1, "question");
    expect(enhanceOne).toHaveBeenCalledWith(1, "intuition");
    expect(enhanceOne).toHaveBeenCalledWith(1, "cpp");
    expect(enhanceOne).not.toHaveBeenCalledWith(0, "intuition");
    expect(enhanceOne).not.toHaveBeenCalledWith(0, "cpp");
    expect(summary.attempted).toBe(4);
    expect(summary.skippedCount).toBe(2);
    expect(summary.successCount).toBe(4);
    expect(summary.fieldStats.question.successCount).toBe(2);
    expect(summary.fieldStats.intuition.successCount).toBe(1);
    expect(summary.fieldStats.intuition.skippedCount).toBe(1);
  });
});

describe("PlatformQuestionEnhanceAllButton completion ticks", () => {
  it("shows completed labels for finished categories", () => {
    render(
      <PlatformQuestionEnhanceAllButton
        questionCount={3}
        completedFields={{
          question: { passed: 3, remaining: 0, total: 3, complete: true },
          cpp: { passed: 2, remaining: 0, total: 2, complete: true },
          all: { passed: 5, remaining: 0, total: 5, complete: true },
        }}
        onEnhanceField={vi.fn()}
        onEnhanceEverything={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Enhance all questions (completed)")).toBeInTheDocument();
    expect(screen.getByLabelText("Enhance all C++ solutions (completed)")).toBeInTheDocument();
    expect(screen.getByLabelText("Enhance everything (completed)")).toBeInTheDocument();
    expect(screen.getByLabelText("Enhance all intuitions")).toBeInTheDocument();
  });

  it("shows passed and remaining counts after partial failures", () => {
    render(
      <PlatformQuestionEnhanceAllButton
        questionCount={5}
        completedFields={{
          python: { passed: 3, remaining: 2, total: 5, complete: false },
          all: { passed: 10, remaining: 4, total: 14, complete: false },
        }}
        onEnhanceField={vi.fn()}
        onEnhanceEverything={vi.fn()}
      />
    );

    expect(
      screen.getByLabelText("Enhance all Python solutions (3 passed, 2 remaining)")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Enhance everything (10 passed, 4 remaining)")
    ).toBeInTheDocument();
    expect(screen.getByText("3✓")).toBeInTheDocument();
    expect(screen.getByText("2 left")).toBeInTheDocument();
  });
});
