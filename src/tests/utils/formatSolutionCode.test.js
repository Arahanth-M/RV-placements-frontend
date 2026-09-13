import { formatSolutionCode } from "../../utils/formatSolutionCode.js";

describe("formatSolutionCode", () => {
  test("unwraps a JSON array of one escaped C++ string", () => {
    const stored = JSON.stringify([
      "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}",
    ]);
    const out = formatSolutionCode(stored);
    expect(out).toContain("#include <bits/stdc++.h>");
    expect(out).toContain("using namespace std;");
    expect(out).not.toContain("\\n");
    expect(out.startsWith("[")).toBe(false);
  });

  test("turns literal \\n into newlines when the blob is one line", () => {
    const out = formatSolutionCode("int main() {\\n  return 0;\\n}");
    expect(out).toBe("int main() {\n  return 0;\n}");
  });

  test("leaves already-formatted source alone", () => {
    const src = "#include <iostream>\nint main() {\n  return 0;\n}";
    expect(formatSolutionCode(src)).toBe(src);
  });

  test("unwraps pretty-printed JSON the way Mongo often stores it", () => {
    const stored = JSON.stringify(
      ["#include <bits/stdc++.h>\nusing namespace std;\nint main() { return 0; }"],
      null,
      2
    );
    const out = formatSolutionCode(stored);
    expect(out.startsWith("#include")).toBe(true);
    expect(out).toContain("\nusing namespace std;");
    expect(out).not.toMatch(/^\[/);
  });
});
