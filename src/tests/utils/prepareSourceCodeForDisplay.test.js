import { describe, expect, it } from "vitest";
import {
  applyBasicIndent,
  prepareSourceCodeForDisplay,
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

  it("indents a reflowed Python solution with 4 spaces", () => {
    const oneLine =
      "import sys def main(): data = sys.stdin.read().strip().split() if not data: return n = int(data[0])";
    const out = prepareSourceCodeForDisplay(oneLine, "python");
    expect(out).toMatch(/^import sys/m);
    expect(out).toMatch(/^def main\(\):/m);
    expect(out).toMatch(/^    if not data:/m);
    expect(out).toMatch(/^        return/m);
    expect(out).toMatch(/^    n = int\(data\[0\]\)/m);
  });
});
