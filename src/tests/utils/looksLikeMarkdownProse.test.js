import { describe, expect, it } from "vitest";
import { looksLikeMarkdownProse } from "../../utils/looksLikeMarkdownProse.js";

describe("looksLikeMarkdownProse", () => {
  it("flags pipe-heavy Python typing as prose (must not drive forced-python rendering)", () => {
    const src = [
      "def f(a: int | str | bytes, b: list[int] | None, c: dict[str, int] | set[int]) -> int | str | None | bool:",
      "    return a",
    ].join("\n");
    expect(looksLikeMarkdownProse(src)).toBe(true);
  });

  it("does not flag ordinary indented Python", () => {
    const src = [
      "def solve():",
      "    if k < 1 or k > m + n:",
      "        return",
      "    print(1)",
    ].join("\n");
    expect(looksLikeMarkdownProse(src)).toBe(false);
  });
});
