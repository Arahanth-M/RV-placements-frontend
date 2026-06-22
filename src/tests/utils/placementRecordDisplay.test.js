import { describe, expect, it } from "vitest";
import {
  formatPlacementRecordWhen,
  placementRecordTimestamp,
} from "../../utils/placementRecordDisplay.js";

describe("formatPlacementRecordWhen", () => {
  it("formats valid ISO timestamps", () => {
    const formatted = formatPlacementRecordWhen("2026-06-20T12:00:00.000Z");
    expect(formatted).not.toBe("—");
  });

  it("returns em dash for missing values", () => {
    expect(formatPlacementRecordWhen(null)).toBe("—");
    expect(formatPlacementRecordWhen("not-a-date")).toBe("—");
  });
});

describe("placementRecordTimestamp", () => {
  it("prefers updatedAt over createdAt", () => {
    expect(
      placementRecordTimestamp({
        updatedAt: "2026-06-20T12:00:00.000Z",
        createdAt: "2026-06-01T12:00:00.000Z",
      })
    ).toBe("2026-06-20T12:00:00.000Z");
  });

  it("falls back to createdAt", () => {
    expect(
      placementRecordTimestamp({
        createdAt: "2026-06-01T12:00:00.000Z",
      })
    ).toBe("2026-06-01T12:00:00.000Z");
  });
});
