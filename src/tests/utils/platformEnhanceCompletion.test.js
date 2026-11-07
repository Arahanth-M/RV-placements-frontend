import { describe, it, expect } from "vitest";
import {
  getEnhanceCategoryProgress,
  getFailedIndexesForField,
  isEnhanceCategoryComplete,
  listEnhanceFieldMarks,
  mergePlatformEnhanceCompletion,
  resolveEnhanceRunIndexes,
  summarizeEnhanceScope,
} from "../../utils/platformEnhanceCompletion.js";

describe("mergePlatformEnhanceCompletion", () => {
  it("marks a single successful field as complete", () => {
    const next = mergePlatformEnhanceCompletion(
      {},
      {
        fields: ["cpp"],
        fieldStats: { cpp: { failureCount: 0, successCount: 2, attempted: 2 } },
      }
    );
    expect(next.cpp).toEqual({
      passed: 2,
      remaining: 0,
      total: 2,
      complete: true,
      failedIndexes: [],
    });
    expect(isEnhanceCategoryComplete(next.cpp)).toBe(true);
  });

  it("does not mark Everything complete after only question or explanation", () => {
    const afterQuestion = mergePlatformEnhanceCompletion(
      {},
      {
        fields: ["question"],
        fieldStats: { question: { failureCount: 0, successCount: 3, attempted: 3 } },
      }
    );
    expect(afterQuestion.question.complete).toBe(true);
    expect(afterQuestion.all?.complete).toBe(false);
    expect(afterQuestion.all?.passed).toBe(1);
    expect(afterQuestion.all?.remaining).toBe(5);
    expect(isEnhanceCategoryComplete(afterQuestion.all)).toBe(false);

    const afterExplanation = mergePlatformEnhanceCompletion(afterQuestion, {
      fields: ["explanation"],
      fieldStats: {
        explanation: { failureCount: 0, successCount: 3, attempted: 3 },
      },
    });
    expect(afterExplanation.explanation.complete).toBe(true);
    expect(afterExplanation.all?.complete).toBe(false);
    expect(afterExplanation.all?.passed).toBe(2);
    expect(afterExplanation.all?.remaining).toBe(4);
    expect(
      getEnhanceCategoryProgress(afterExplanation.all)?.complete
    ).toBe(false);
  });

  it("stores passed and remaining when a field partially fails", () => {
    const next = mergePlatformEnhanceCompletion(
      {},
      {
        fields: ["cpp"],
        fieldStats: {
          cpp: {
            failureCount: 2,
            successCount: 3,
            attempted: 5,
            failedIndexes: [1, 4],
          },
        },
      }
    );
    expect(next.cpp).toEqual({
      passed: 3,
      remaining: 2,
      total: 5,
      complete: false,
      failedIndexes: [1, 4],
    });
    expect(isEnhanceCategoryComplete(next.cpp)).toBe(false);
  });

  it("aggregates Everything progress across fields", () => {
    const fields = ["question", "intuition", "explanation", "cpp", "java", "python"];
    const fieldStats = {
      question: { failureCount: 1, successCount: 4, attempted: 5 },
      intuition: { failureCount: 0, successCount: 2, attempted: 2 },
      explanation: { failureCount: 0, successCount: 5, attempted: 5 },
      cpp: { failureCount: 2, successCount: 0, attempted: 2 },
      java: { failureCount: 0, successCount: 2, attempted: 2 },
      python: { failureCount: 0, successCount: 2, attempted: 2 },
    };
    const next = mergePlatformEnhanceCompletion({}, { fields, fieldStats });
    expect(next.all.complete).toBe(false);
    // Everything counts categories: 4 complete, 2 still open (question + cpp).
    expect(next.all.passed).toBe(4);
    expect(next.all.remaining).toBe(2);
    expect(next.question.remaining).toBe(1);
    expect(next.cpp.remaining).toBe(2);
  });

  it("marks Everything complete when every field succeeded", () => {
    const fields = ["question", "intuition", "explanation", "cpp", "java", "python"];
    const fieldStats = Object.fromEntries(
      fields.map((field) => [
        field,
        { failureCount: 0, successCount: 1, attempted: 1 },
      ])
    );
    const next = mergePlatformEnhanceCompletion({}, { fields, fieldStats });
    expect(next.all.complete).toBe(true);
    expect(next.all.remaining).toBe(0);
  });
});

describe("summarizeEnhanceScope / listEnhanceFieldMarks", () => {
  it("summarizes complete and partial scopes for cards", () => {
    expect(
      summarizeEnhanceScope({
        question: { passed: 2, remaining: 0, total: 2, complete: true },
        intuition: { passed: 2, remaining: 0, total: 2, complete: true },
        explanation: { passed: 2, remaining: 0, total: 2, complete: true },
        cpp: { passed: 2, remaining: 0, total: 2, complete: true },
        java: { passed: 2, remaining: 0, total: 2, complete: true },
        python: { passed: 2, remaining: 0, total: 2, complete: true },
        all: { passed: 12, remaining: 0, total: 12, complete: true },
      })?.complete
    ).toBe(true);

    const partial = summarizeEnhanceScope({
      python: { passed: 3, remaining: 2, total: 5, complete: false },
    });
    expect(partial.partial).toBe(true);
    expect(partial.passed).toBe(3);
    expect(partial.remaining).toBe(2);
  });

  it("lists only fields that have been enhanced for card marks", () => {
    const marks = listEnhanceFieldMarks({
      question: { passed: 2, remaining: 0, total: 2, complete: true },
      explanation: { passed: 1, remaining: 1, total: 2, complete: false },
    });
    expect(marks).toEqual([
      {
        field: "question",
        label: "Q",
        complete: true,
        passed: 2,
        remaining: 0,
      },
      {
        field: "explanation",
        label: "Expl",
        complete: false,
        passed: 1,
        remaining: 1,
      },
    ]);
  });
});

describe("retry failed enhance indexes", () => {
  it("stores failedIndexes and retries only those on the next run", () => {
    const first = mergePlatformEnhanceCompletion(
      {},
      {
        fields: ["intuition"],
        fieldStats: {
          intuition: {
            attempted: 5,
            successCount: 3,
            failureCount: 2,
            failedIndexes: [2, 4],
          },
        },
      }
    );
    expect(getFailedIndexesForField(first, "intuition")).toEqual([2, 4]);

    const resolved = resolveEnhanceRunIndexes({
      allIndexes: [0, 1, 2, 3, 4],
      completion: first,
      fields: ["intuition"],
    });
    expect(resolved.retryFailedOnly).toBe(true);
    expect(resolved.indexes).toEqual([2, 4]);

    const second = mergePlatformEnhanceCompletion(first, {
      fields: ["intuition"],
      fieldStats: {
        intuition: {
          attempted: 2,
          successCount: 1,
          failureCount: 1,
          failedIndexes: [4],
        },
      },
      indexes: [2, 4],
      retryFailedOnly: true,
    });
    expect(second.intuition).toMatchObject({
      passed: 4,
      remaining: 1,
      total: 5,
      complete: false,
      failedIndexes: [4],
    });
  });
});
