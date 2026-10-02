import { describe, expect, it } from "vitest";
import {
  assignSubtopicsToDays,
  topicMatchesFocus,
} from "../../utils/prepPathSlotSubtopics.js";
import {
  resolvePrepResourceById,
  resolvePrepResourceLink,
} from "../../utils/prepPathResourceLinks.js";

describe("assignSubtopicsToDays", () => {
  it("nests matching topic subtopics under that day's slot tasks", () => {
    const days = [
      {
        day: 1,
        hours: 2,
        focus: "DSA fundamentals",
        slots: [
          {
            index: 1,
            minutes: 60,
            tasks: [{ title: "Review arrays and strings", minutes: 45 }],
          },
          {
            index: 2,
            minutes: 60,
            tasks: [{ title: "Practice binary search", minutes: 60 }],
          },
        ],
      },
      {
        day: 2,
        hours: 2,
        focus: "CS fundamentals",
        slots: [
          {
            index: 1,
            minutes: 120,
            tasks: [{ title: "Revise OS and DBMS", minutes: 120 }],
          },
        ],
      },
    ];
    const topics = [
      {
        title: "DSA fundamentals",
        subtopics: [
          { title: "Arrays & hashing", hours: 1 },
          { title: "Binary search", hours: 1 },
        ],
      },
      {
        title: "CS fundamentals",
        subtopics: [{ title: "OOPs + DBMS", hours: 2 }],
      },
    ];

    const out = assignSubtopicsToDays(days, topics);
    const day1Subs = out[0].slots.flatMap((slot) =>
      (slot.tasks || []).flatMap((task) => (task.subtopics || []).map((s) => s.title))
    );
    const day2Subs = out[1].slots.flatMap((slot) =>
      (slot.tasks || []).flatMap((task) => (task.subtopics || []).map((s) => s.title))
    );

    expect(day1Subs).toEqual(["Arrays & hashing", "Binary search"]);
    expect(day2Subs).toEqual(["OOPs + DBMS"]);
    expect(out[0].slots[0].tasks[0].subtopics[0].linkUrl).toContain("takeuforward.org");
    expect(out[0].slots[1].tasks[0].subtopics[0].title).toBe("Binary search");
    expect(days[0].slots[0].tasks[0].subtopics).toBeUndefined();
  });

  it("gives every task in a slot subtopics with minutes that sum to the task budget", () => {
    const out = assignSubtopicsToDays(
      [
        {
          day: 1,
          hours: 4,
          focus: "Core DS & Algorithms",
          slots: [
            {
              index: 1,
              minutes: 120,
              tasks: [
                { title: "String manipulation practice", minutes: 60 },
                { title: "Linked list cycle detection", minutes: 60 },
              ],
            },
            {
              index: 2,
              minutes: 120,
              tasks: [
                { title: "BST insertion implementation", minutes: 60 },
                { title: "Dijkstra shortest path problem", minutes: 60 },
              ],
            },
          ],
        },
      ],
      [
        {
          title: "Core DS & Algorithms",
          subtopics: [
            { title: "Strings & Arrays", hours: 1.1 },
            { title: "Linked Lists", hours: 1.1 },
            { title: "Trees & BST", hours: 1 },
            { title: "Graphs & shortest paths", hours: 1.1 },
          ],
        },
      ]
    );

    const slot1Tasks = out[0].slots[0].tasks;
    const slot2Tasks = out[0].slots[1].tasks;

    slot1Tasks.forEach((task) => {
      expect(task.subtopics?.length).toBeGreaterThan(0);
      const subSum = (task.subtopics || []).reduce((sum, sub) => sum + (sub.minutes || 0), 0);
      expect(subSum).toBe(task.minutes);
    });
    slot2Tasks.forEach((task) => {
      expect(task.subtopics?.length).toBeGreaterThan(0);
      const subSum = (task.subtopics || []).reduce((sum, sub) => sum + (sub.minutes || 0), 0);
      expect(subSum).toBe(task.minutes);
    });

    expect(slot1Tasks[0].subtopics.some((s) => /string|array/i.test(s.title))).toBe(true);
    expect(slot1Tasks[1].subtopics.some((s) => /linked/i.test(s.title))).toBe(true);
    expect(slot2Tasks[0].subtopics.some((s) => /tree|bst/i.test(s.title))).toBe(true);
    expect(slot2Tasks[1].subtopics.some((s) => /graph|shortest|dijkstra/i.test(s.title))).toBe(true);
  });

  it("still attaches subtopics when a day has tasks but no slots", () => {
    const out = assignSubtopicsToDays(
      [{ day: 1, hours: 2, focus: "System design", tasks: [{ title: "Read HLD", minutes: 120 }] }],
      [{ title: "System design", subtopics: [{ title: "Load balancing", hours: 2 }] }]
    );
    expect(out[0].tasks[0].subtopics.map((s) => s.title)).toEqual(["Load balancing"]);
    expect(
      (out[0].tasks[0].subtopics || []).reduce((sum, sub) => sum + (sub.minutes || 0), 0)
    ).toBe(120);
  });

  it("does not attach OOP subtopics to a DSA OA task", () => {
    const out = assignSubtopicsToDays(
      [
        {
          day: 1,
          hours: 2,
          focus: "OA prep",
          slots: [
            {
              index: 1,
              minutes: 45,
              tasks: [{ title: "Solve Two Sum OA", minutes: 45 }],
            },
          ],
        },
      ],
      [
        {
          title: "OOP concepts",
          subtopics: [{ title: "Polymorphism", hours: 1 }],
        },
        {
          title: "DSA",
          subtopics: [{ title: "Arrays & hashing", hours: 1 }],
        },
      ]
    );

    const subs = out[0].slots[0].tasks[0].subtopics.map((s) => s.title);
    expect(subs.some((title) => /polymorphism|oop/i.test(title))).toBe(false);
    expect(subs.some((title) => /two sum|array|hash/i.test(title))).toBe(true);
  });

  it("resolves Swift subtopics to Swift docs, not LeetCode", () => {
    const out = assignSubtopicsToDays(
      [
        {
          day: 1,
          hours: 1,
          focus: "Swift fundamentals",
          slots: [
            {
              index: 1,
              minutes: 45,
              tasks: [{ title: "Complete Swift syntax tutorial", minutes: 45 }],
            },
          ],
        },
      ],
      [
        {
          title: "Swift fundamentals",
          subtopics: [
            { title: "Syntax & Types", hours: 0.35 },
            { title: "Collections", hours: 0.4 },
          ],
        },
      ]
    );

    const links = out[0].slots[0].tasks[0].subtopics.map((s) => s.linkUrl);
    expect(links.every((url) => url.includes("swift.org"))).toBe(true);
    expect(links.some((url) => url.includes("leetcode"))).toBe(false);
  });

  it("injects platform review subtopics when campus evidence exists", () => {
    const out = assignSubtopicsToDays(
      [
        {
          day: 1,
          hours: 2,
          focus: "DSA",
          campusEvidence: [
            { sourceType: "oa", label: "Seen on the platform", snippet: "Two Sum asked in OA" },
            { sourceType: "must_do", label: "Must-do topic", snippet: "Graph BFS" },
          ],
          slots: [
            {
              index: 1,
              minutes: 60,
              tasks: [{ title: "Array practice", minutes: 60 }],
            },
          ],
        },
      ],
      [{ title: "DSA", subtopics: [{ title: "Arrays", hours: 1 }] }],
      { isGeneral: true }
    );

    const subs = out[0].slots[0].tasks[0].subtopics;
    expect(subs.some((s) => s.isPlatformItem)).toBe(true);
    expect(subs.filter((s) => s.isPlatformItem).length).toBe(2);
    const subSum = subs.reduce((sum, sub) => sum + (sub.minutes || 0), 0);
    expect(subSum).toBe(out[0].slots[0].tasks[0].minutes);
  });

  it("skips platform review when no campus evidence", () => {
    const out = assignSubtopicsToDays(
      [
        {
          day: 1,
          hours: 1,
          focus: "DSA",
          slots: [
            {
              index: 1,
              minutes: 60,
              tasks: [{ title: "Array practice", minutes: 60 }],
            },
          ],
        },
      ],
      [{ title: "DSA", subtopics: [{ title: "Arrays", hours: 1 }] }]
    );

    expect(out[0].slots[0].tasks[0].subtopics.some((s) => s.isPlatformItem)).toBe(false);
  });
});

describe("topicMatchesFocus", () => {
  it("matches overlapping topic titles", () => {
    expect(topicMatchesFocus("DSA fundamentals", "DSA fundamentals")).toBe(true);
    expect(topicMatchesFocus("CS fundamentals", "Revise CS fundamentals")).toBe(true);
    expect(topicMatchesFocus("CS fundamentals", "DSA fundamentals")).toBe(false);
  });
});

describe("resolvePrepResourceLink", () => {
  it("resolves trusted resourceId directly", () => {
    const hit = resolvePrepResourceById("kotlin-docs");
    expect(hit?.url).toContain("kotlinlang.org");
  });

  it("prefers resourceId over keyword fallback", () => {
    const hit = resolvePrepResourceLink({
      resourceId: "kotlin-docs",
      title: "Syntax & Types",
      taskTitle: "Complete Kotlin syntax tutorial",
    });
    expect(hit?.resourceId).toBe("kotlin-docs");
    expect(hit?.url).toContain("kotlinlang.org");
  });

  it("maps Swift topics to Swift docs", () => {
    const link = resolvePrepResourceLink({
      title: "Syntax & Types",
      topicTitle: "Swift fundamentals",
      taskTitle: "Complete Swift syntax tutorial",
    });
    expect(link?.url).toContain("swift.org");
  });

  it("returns null for unrelated topics instead of a generic fallback", () => {
    expect(
      resolvePrepResourceLink({
        title: "Team standup notes",
        topicTitle: "Weekly sync",
      })
    ).toBeNull();
  });
});
