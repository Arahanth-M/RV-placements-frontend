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

  it("keeps indented Python that mentions backticks", () => {
    const src = [
      "class DependencyGraph:",
      '    """An edge `A -> B` means `A` depends on `B`."""',
      "    def add_edge(self, src: str, dst: str) -> None:",
      "        self.adj[src].add(dst)",
      "        self.nodes.update([src, dst])",
      "    def add_node(self, node: str) -> None:",
      "        self.nodes.add(node)",
    ].join("\n");
    expect(prepareSourceCodeForDisplay(src, "python")).toBe(src);
  });

  it("indents sibling Python methods instead of nesting them", () => {
    const oneLine =
      "class Graph: def add_edge(self, src: str, dst: str) -> None: self.adj[src].add(dst) def add_node(self, node: str) -> None: self.nodes.add(node)";
    const out = prepareSourceCodeForDisplay(oneLine, "python");
    expect(out).toMatch(/^class Graph:/m);
    expect(out).toMatch(/^    def add_edge\(self, src: str, dst: str\) -> None:/m);
    expect(out).toMatch(/^        self\.adj\[src\]\.add\(dst\)/m);
    expect(out).toMatch(/^    def add_node\(self, node: str\) -> None:/m);
    expect(out).toMatch(/^        self\.nodes\.add\(node\)/m);
  });

  it("repairs an already-broken Python layout from the solution view", () => {
    const broken = [
      "def main():",
      "    import argparse parser = argparse.ArgumentParser(description='DI relationship analyzer') parser.add_argument('--x')",
      "    if cycles:",
      "        print('Cyclic DI dependencies detected:')",
      "        for idx, cycle in enumerate(cycles, 1):",
      "            print(f'{idx}. ' + ' -> '.join(cycle) + f' -> {cycle[0]}')",
      "        else:",
      "            print('No cyclic DI dependencies found.')",
      "            if __name__ == '__main__':",
      "                main()",
    ].join("\n");
    const out = prepareSourceCodeForDisplay(broken, "python");
    expect(out).toMatch(/^    import argparse$/m);
    expect(out).toMatch(/^    parser = argparse\.ArgumentParser\(description='DI relationship analyzer'\)$/m);
    expect(out).toMatch(/^    parser\.add_argument\('--x'\)$/m);
    expect(out).toMatch(/^    if cycles:/m);
    expect(out).toMatch(/^        for idx, cycle in enumerate\(cycles, 1\):/m);
    expect(out).toMatch(/^    else:/m);
    expect(out).toMatch(/^if __name__ == '__main__':/m);
    expect(out).toMatch(/^    main\(\)$/m);
    expect(out).not.toMatch(/import argparse parser/);
    expect(out).not.toMatch(/^        else:/m);
  });

  it("splits glued Python statements and keeps else with if", () => {
    const oneLine =
      "def main(): import argparse parser = argparse.ArgumentParser(description='DI relationship analyzer') parser.add_argument('--x') if cycles: print('Cyclic DI dependencies detected:') for idx, cycle in enumerate(cycles, 1): print(f'{idx}') else: print('No cyclic DI dependencies found.') if __name__ == '__main__': main()";
    const out = prepareSourceCodeForDisplay(oneLine, "python");
    expect(out).toMatch(/^def main\(\):/m);
    expect(out).toMatch(/^    import argparse$/m);
    expect(out).toMatch(/^    parser = argparse\.ArgumentParser\(description='DI relationship analyzer'\)$/m);
    expect(out).toMatch(/^    parser\.add_argument\('--x'\)$/m);
    expect(out).toMatch(/^    if cycles:/m);
    expect(out).toMatch(/^        for idx, cycle in enumerate\(cycles, 1\):/m);
    expect(out).toMatch(/^    else:/m);
    expect(out).toMatch(/^if __name__ == '__main__':/m);
    expect(out).toMatch(/^    main\(\)$/m);
    expect(out).not.toMatch(/^        else:/m);
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
