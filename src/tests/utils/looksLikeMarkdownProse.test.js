import { describe, expect, it } from "vitest";
import { looksLikeMarkdownProse } from "../../utils/looksLikeMarkdownProse.js";

describe("looksLikeMarkdownProse", () => {
  it("detects bold markdown", () => {
    expect(looksLikeMarkdownProse("**High-level architecture**")).toBe(true);
  });

  it("detects pipe tables", () => {
    const table = "| a | b |\n|---|---|\n| 1 | 2 |";
    expect(looksLikeMarkdownProse(table)).toBe(true);
  });
});
