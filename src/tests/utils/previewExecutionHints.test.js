import { buildPreviewCodeExecutionHints } from "../../utils/previewExecutionHints.js";

describe("buildPreviewCodeExecutionHints", () => {
  test("surfaces C++ int main() grader-contract compilation errors", () => {
    const error =
      "Your C++ code defines int main(), but the grader already provides main() to run the test cases. Remove your main() and implement only the required function or class Solution method from the contract.";
    const hints = buildPreviewCodeExecutionHints({
      status: "EXECUTION_COMPILATION_ERROR",
      error,
      results: [
        { passed: false, isHidden: false, error },
        { passed: false, isHidden: false, error },
      ],
      passedCount: 0,
      failedCount: 2,
      totalCount: 2,
    });
    expect(hints.hints.some((h) => h.includes("int main()"))).toBe(true);
    expect(hints.hints.filter((h) => h.includes("int main()"))).toHaveLength(1);
  });

  test("surfaces compilation errors even when no test rows exist", () => {
    const hints = buildPreviewCodeExecutionHints({
      status: "EXECUTION_COMPILATION_ERROR",
      error: "error: expected ';' before '}' token",
      results: [],
      passedCount: 0,
      failedCount: 0,
      totalCount: 0,
    });
    expect(hints.hints[0]).toMatch(/Compilation failed/i);
  });
});
