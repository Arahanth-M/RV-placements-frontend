import { describe, expect, it } from "vitest";
import {
  formatSolutionCode,
  newlineAfterStatementSemicolons,
  reflowSpacedSourceCode,
} from "../../utils/formatSolutionCode.js";

describe("formatSolutionCode", () => {
  it("unescapes literal newlines in stored strings", () => {
    expect(formatSolutionCode("line1\\nline2")).toBe("line1\nline2");
  });

  it("reflows space-separated C++ includes onto separate lines", () => {
    const oneLine = '#include <iostream> #include <thread> int main() { return 0; }';
    const out = reflowSpacedSourceCode(oneLine, "cpp");
    expect(out).toContain("#include <iostream>");
    expect(out).toContain("\n#include <thread>");
  });

  it("keeps for-loop header semicolons on one line when reflowing a one-liner", () => {
    const oneLine =
      "int main() { for (int i = 0; i < n; ++i) { long long x; cin >> x; } return 0; }";
    const out = reflowSpacedSourceCode(oneLine, "cpp");
    expect(out).toMatch(/for \(int i = 0; i < n; \+\+i\)/);
    expect(out).not.toMatch(/for \(int i = 0;\ni < n;/);
  });

  it("newlineAfterStatementSemicolons respects parentheses", () => {
    expect(newlineAfterStatementSemicolons("for (int i = 0; i < n; ++i) { x; y; }")).toBe(
      "for (int i = 0; i < n; ++i) { x; y; }"
    );
    expect(newlineAfterStatementSemicolons("int a; int b;")).toBe("int a;\nint b;");
  });

  it("does not split long long or break a normal multiline for-loop", () => {
    const multiline = [
      "for (int i = 0; i < n; ++i) {",
      "  long long x;",
      "  cin >> x;",
      "  total += x;",
      "}",
    ].join("\n");
    const out = reflowSpacedSourceCode(multiline, "cpp");
    expect(out).toBe(multiline);
    expect(out).not.toMatch(/^long\n/m);
  });

  it("reflows a one-line Python def into multiple lines", () => {
    const oneLine = "import sys def main(): n = int(data[0]) return n";
    const out = reflowSpacedSourceCode(oneLine, "python");
    expect(out).toContain("import sys");
    expect(out).toContain("def main():");
    expect(out.split("\n").length).toBeGreaterThan(2);
  });
});
