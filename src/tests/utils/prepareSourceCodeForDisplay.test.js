import { describe, expect, it } from "vitest";
import {
  applyBasicIndent,
  prepareSourceCodeForDisplay,
  preservePythonSourceForDisplay,
  repairSplitForLoopHeaders,
} from "../../utils/prepareSourceCodeForDisplay.js";

describe("prepareSourceCodeForDisplay", () => {
  it("restores indentation for flat multiline C++", () => {
    const flat = [
      "#include <iostream>",
      "using namespace std;",
      "int main() {",
      "cout << hi;",
      "return 0;",
      "}",
    ].join("\n");
    const out = applyBasicIndent(flat, "cpp");
    expect(out).toContain("  cout");
    expect(out).toContain("  return");
  });

  it("reflows and indents a one-line C++ blob", () => {
    const oneLine = "#include <iostream> int main() { return 0; }";
    const out = prepareSourceCodeForDisplay(oneLine, "cpp");
    expect(out.split("\n").length).toBeGreaterThan(2);
  });

  it("preserves long long on one line when already multiline", () => {
    const src = "int main() {\n  long long total = 0;\n  return 0;\n}";
    expect(prepareSourceCodeForDisplay(src, "cpp")).toContain("long long total = 0;");
  });

  it("repairs a for-loop header split across lines", () => {
    const broken = "for (int i = 0;\ni < n;\n++i) {";
    expect(repairSplitForLoopHeaders(broken)).toBe("for (int i = 0; i < n; ++i) {");
  });

  it("does not reflow Java that is already multiline", () => {
    const src = [
      "public class Main {",
      "  public static void main(String[] args) {",
      "    System.out.println(1);",
      "  }",
      "}",
    ].join("\n");
    expect(prepareSourceCodeForDisplay(src, "java")).toContain("System.out.println(1);");
  });
});

describe("prepareSourceCodeForDisplay python preservation", () => {
  const normalizeLineEndings = (source) =>
    String(source).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  it("preserves nested functions exactly", () => {
    const src = [
      "import sys",
      "",
      "def solve():",
      "    data = sys.stdin.read().strip().split()",
      "",
      "    if not data:",
      "        return",
      "",
      "    def helper():",
      '        print("Hello")',
      "",
      "    helper()",
      "",
      "if __name__ == '__main__':",
      "    solve()",
    ].join("\n");
    expect(prepareSourceCodeForDisplay(src, "python")).toBe(normalizeLineEndings(src));
  });

  it("preserves nested if-else exactly", () => {
    const src = [
      "def check(x):",
      "    if x > 0:",
      "        if x % 2 == 0:",
      '            print("Positive Even")',
      "        else:",
      '            print("Positive Odd")',
      "    else:",
      '        print("Non-positive")',
    ].join("\n");
    expect(prepareSourceCodeForDisplay(src, "python")).toBe(normalizeLineEndings(src));
  });

  it("preserves nested loops exactly", () => {
    const src = [
      "def solve():",
      "    for i in range(5):",
      "        for j in range(3):",
      "            if i > j:",
      "                print(i, j)",
    ].join("\n");
    expect(prepareSourceCodeForDisplay(src, "python")).toBe(normalizeLineEndings(src));
  });

  it("preserves blank lines, leading indentation, and tabs", () => {
    const src = "def solve():\n\n\tprint(1)\n    print(2)\n";
    expect(prepareSourceCodeForDisplay(src, "python")).toBe(src);
    expect(prepareSourceCodeForDisplay(src, "python")).toContain("\tprint(1)");
    expect(prepareSourceCodeForDisplay(src, "python")).toContain("    print(2)");
  });

  it("normalizes Windows and old Mac line endings only", () => {
    const src = "def solve():\r\n    if True:\r        return\r\n";
    expect(prepareSourceCodeForDisplay(src, "python")).toBe(
      "def solve():\n    if True:\n        return\n"
    );
  });

  it("does not trim leading or trailing whitespace on Python source", () => {
    const src = "\n\ndef solve():\n    return 1\n\n";
    expect(prepareSourceCodeForDisplay(src, "python")).toBe(src);
  });

  it("does not heuristically reflow a one-line Python blob", () => {
    const oneLine =
      "import sys def main(): data = sys.stdin.read().strip().split() if not data: return";
    expect(prepareSourceCodeForDisplay(oneLine, "python")).toBe(oneLine);
  });

  it("preserves a correctly formatted kth-element Python solution", () => {
    const src = [
      "import sys",
      "",
      "def kth(A, B, k):",
      "    i = j = 0",
      "    m = len(A)",
      "    n = len(B)",
      "",
      "    while True:",
      "        if i == m:",
      "            return B[j + k - 1]",
      "",
      "        if j == n:",
      "            return A[i + k - 1]",
      "",
      "        if k == 1:",
      "            return min(A[i], B[j])",
      "",
      "        p = min(k // 2, m - i)",
      "        q = min(k // 2, n - j)",
      "",
      "        if A[i + p - 1] <= B[j + q - 1]:",
      "            i += p",
      "            k -= p",
      "        else:",
      "            j += q",
      "            k -= q",
      "",
      "",
      "def solve():",
      "    data = sys.stdin.read().strip().split()",
      "",
      "    if not data:",
      "        return",
      "",
      "    m = int(data[0])",
      "    n = int(data[1])",
      "    k = int(data[2])",
      "",
      "    idx = 3",
      "",
      "    A = list(map(int, data[idx:idx + m]))",
      "    idx += m",
      "",
      "    B = list(map(int, data[idx:idx + n]))",
      "",
      "    if k < 1 or k > m + n:",
      "        print(-1)",
      "        return",
      "",
      "    print(kth(A, B, k))",
      "",
      "",
      "if __name__ == '__main__':",
      "    solve()",
    ].join("\n");
    expect(prepareSourceCodeForDisplay(src, "python")).toBe(src);
  });

  it("preservePythonSourceForDisplay matches prepareSourceCodeForDisplay for python", () => {
    const src = "def f():\n    return 1\n";
    expect(preservePythonSourceForDisplay(src)).toBe(
      prepareSourceCodeForDisplay(src, "python")
    );
  });

  it("preserves 4 / 8 / 12-space nested indentation exactly", () => {
    const src = [
      "def outer():",
      "    x = 1",
      "    if x:",
      "        if True:",
      "            print(x)",
      "            def inner():",
      "                return x",
      "            return inner()",
    ].join("\n");
    const out = prepareSourceCodeForDisplay(src, "python");
    expect(out).toBe(src);
    expect(out).toMatch(/^    x = 1$/m);
    expect(out).toMatch(/^        if True:$/m);
    expect(out).toMatch(/^            print\(x\)$/m);
    expect(out).toMatch(/^                return x$/m);
  });
});
