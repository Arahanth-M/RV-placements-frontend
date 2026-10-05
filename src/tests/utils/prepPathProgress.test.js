import { describe, expect, it, vi } from "vitest";
import {
  annotatePrepChecklist,
  checkState,
  loadPrepProgress,
  progressSummary,
  toggleTrackedId,
  toggleTrackedIds,
  writePrepProgress,
} from "../../utils/prepPathProgress.js";

function sampleDays() {
  return [
    {
      day: 1,
      slots: [
        {
          index: 1,
          tasks: [
            {
              title: "Arrays",
              subtopics: [
                { key: "a", title: "Two sum" },
                { key: "b", title: "Sliding window" },
              ],
            },
          ],
        },
      ],
    },
    {
      day: 2,
      tasks: [{ title: "Resume polish", subtopics: [] }],
    },
  ];
}

describe("prep path progress", () => {
  it("counts subtopics, and a topic with none as one item", () => {
    const { topics } = annotatePrepChecklist(sampleDays());
    expect(topics).toHaveLength(2);
    expect(topics[0].leafIds).toHaveLength(2);
    expect(topics[1].leafIds).toEqual([topics[1].id]);
    expect(progressSummary(topics, new Set())).toEqual({ done: 0, total: 3, percent: 0 });
  });

  it("marks every subtopic when the topic is ticked, and updates the percent immediately", () => {
    const { topics } = annotatePrepChecklist(sampleDays());
    const all = toggleTrackedIds(topics[0].leafIds, new Set());
    expect(checkState(topics[0].leafIds, all)).toBe("checked");
    expect(progressSummary(topics, all)).toMatchObject({ done: 2, total: 3, percent: 67 });

    const one = toggleTrackedId(topics[0].leafIds[0], all);
    expect(checkState(topics[0].leafIds, one)).toBe("mixed");
    expect(progressSummary(topics, one)).toMatchObject({ done: 1, total: 3, percent: 33 });

    const cleared = toggleTrackedIds(topics[0].leafIds, all);
    expect(checkState(topics[0].leafIds, cleared)).toBe("unchecked");
    expect(progressSummary(topics, cleared).done).toBe(0);
  });

  it("keeps saved ticks that still belong to this plan", () => {
    const store = {};
    vi.stubGlobal("localStorage", {
      getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
      setItem: (key, value) => {
        store[key] = String(value);
      },
      removeItem: (key) => {
        delete store[key];
      },
    });

    const { topics } = annotatePrepChecklist(sampleDays());
    writePrepProgress("plan-1", new Set([topics[0].leafIds[1], "stale-id"]));
    expect(loadPrepProgress("plan-1", topics)).toEqual(new Set([topics[0].leafIds[1]]));
    vi.unstubAllGlobals();
  });
});
