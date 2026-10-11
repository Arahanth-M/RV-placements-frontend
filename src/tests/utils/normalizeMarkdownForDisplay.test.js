import { describe, expect, it } from "vitest";
import { normalizeMarkdownForDisplay } from "../../utils/normalizeMarkdownForDisplay.js";

describe("normalizeMarkdownForDisplay", () => {
  it("joins marker-only lines with the following title", () => {
    const input = `Intro.

1.
**Cluster Architecture** – An AKS cluster.

2.
**Networking Options** – Choose between Azure CNI.`;
    expect(normalizeMarkdownForDisplay(input)).toBe(
      `Intro.

1. **Cluster Architecture** – An AKS cluster.

2. **Networking Options** – Choose between Azure CNI.`
    );
  });

  it("joins across blank lines and unicode spaces", () => {
    const input = `1.\u2003\n\n**Cluster Architecture** – text`;
    expect(normalizeMarkdownForDisplay(input)).toBe(
      "1. **Cluster Architecture** – text"
    );
  });

  it("normalizes fullwidth periods in markers", () => {
    const input = `1．\n**Cluster Architecture** – text`;
    expect(normalizeMarkdownForDisplay(input)).toBe(
      "1. **Cluster Architecture** – text"
    );
  });
});
