/**
 * Auto-resolve learning / practice links for free-text must-do topics.
 * No manual URLs — curated catalog + search fallback.
 */

/** @typedef {{ label: string, source: string, url: string }} MustDoResourceLink */
/** @typedef {{ id: string, label: string, aliases: string[], links: MustDoResourceLink[] }} MustDoResourceEntry */
/** @typedef {{ id: string, label: string, links: MustDoResourceLink[] }} MustDoResolvedTopic */

/**
 * Prefer stable public hubs (GFG articles, LeetCode tags, InterviewBit, Take U Forward).
 * @type {MustDoResourceEntry[]}
 */
export const MUST_DO_RESOURCE_CATALOG = [
  {
    id: "arrays",
    label: "Arrays",
    aliases: ["arrays", "array"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/array-data-structure/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/array/" },
      { label: "Sheet", source: "TUF", url: "https://takeuforward.org/category/arrays/" },
    ],
  },
  {
    id: "strings",
    label: "Strings",
    aliases: ["strings", "string"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/string-data-structure/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/string/" },
    ],
  },
  {
    id: "linked-lists",
    label: "Linked Lists",
    aliases: ["linked lists", "linked list", "linkedin list"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/data-structures/linked-list/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/linked-list/" },
    ],
  },
  {
    id: "stacks",
    label: "Stacks",
    aliases: ["stacks", "stack"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/stack-data-structure/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/stack/" },
    ],
  },
  {
    id: "queues",
    label: "Queues",
    aliases: ["queues", "queue"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/queue-data-structure/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/queue/" },
    ],
  },
  {
    id: "trees",
    label: "Trees",
    aliases: ["binary trees", "binary tree", "trees", "tree", "bst", "binary search tree"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/binary-tree-data-structure/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/tree/" },
      { label: "Sheet", source: "TUF", url: "https://takeuforward.org/category/binary-tree/" },
    ],
  },
  {
    id: "heaps",
    label: "Heaps",
    aliases: ["priority queue", "heaps", "heap"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/heap-data-structure/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/heap-priority-queue/" },
    ],
  },
  {
    id: "graphs",
    label: "Graphs",
    aliases: ["graphs", "graph"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/graph/" },
      { label: "Sheet", source: "TUF", url: "https://takeuforward.org/category/graph/" },
    ],
  },
  {
    id: "hashing",
    label: "Hashing",
    aliases: ["hash maps", "hash map", "hash table", "hashing"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/hashing-data-structure/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/hash-table/" },
    ],
  },
  {
    id: "recursion",
    label: "Recursion",
    aliases: ["recursion", "recursive"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/recursion/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/recursion/" },
    ],
  },
  {
    id: "backtracking",
    label: "Backtracking",
    aliases: ["backtracking"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/backtracking-algorithms/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/backtracking/" },
    ],
  },
  {
    id: "dynamic-programming",
    label: "Dynamic Programming",
    aliases: ["dynamic programming", "dyn prog", "dp"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/dynamic-programming/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/dynamic-programming/" },
      { label: "Sheet", source: "TUF", url: "https://takeuforward.org/category/dynamic-programming/" },
    ],
  },
  {
    id: "greedy",
    label: "Greedy",
    aliases: ["greedy algorithms", "greedy"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/greedy-algorithms/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/greedy/" },
    ],
  },
  {
    id: "sorting",
    label: "Sorting",
    aliases: ["sorting", "sort"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/sorting-algorithms/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/sorting/" },
    ],
  },
  {
    id: "binary-search",
    label: "Binary Search",
    aliases: ["binary search", "searching"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/binary-search/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/binary-search/" },
    ],
  },
  {
    id: "two-pointers",
    label: "Two Pointers",
    aliases: ["two pointers", "two pointer"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/two-pointers-technique/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/two-pointers/" },
    ],
  },
  {
    id: "sliding-window",
    label: "Sliding Window",
    aliases: ["sliding window"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/window-sliding-technique/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/sliding-window/" },
    ],
  },
  {
    id: "bit-manipulation",
    label: "Bit Manipulation",
    aliases: ["bit manipulation", "bitwise", "bit masking"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/bits-manipulation-important-tactics/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/bit-manipulation/" },
    ],
  },
  {
    id: "tries",
    label: "Tries",
    aliases: ["tries", "trie", "prefix tree"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/trie-insert-and-search/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/trie/" },
    ],
  },
  {
    id: "bfs",
    label: "BFS",
    aliases: ["breadth first search", "bfs"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/breadth-first-search-or-bfs-for-a-graph/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/breadth-first-search/" },
    ],
  },
  {
    id: "dfs",
    label: "DFS",
    aliases: ["depth first search", "dfs"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/depth-first-search-or-dfs-for-a-graph/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/tag/depth-first-search/" },
    ],
  },
  {
    id: "dsa",
    label: "DSA",
    aliases: ["data structures and algorithms", "dsa", "data structures", "algorithms"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/data-structures/" },
      { label: "Sheet", source: "TUF", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/" },
      { label: "Practice", source: "InterviewBit", url: "https://www.interviewbit.com/courses/programming/" },
    ],
  },
  {
    id: "os",
    label: "Operating Systems",
    aliases: ["operating systems", "operating system", "os"],
    links: [
      { label: "Notes", source: "GFG", url: "https://www.geeksforgeeks.org/operating-systems/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/operating-system-interview-questions/" },
    ],
  },
  {
    id: "dbms",
    label: "DBMS",
    aliases: ["database management", "dbms", "databases", "database"],
    links: [
      { label: "Notes", source: "GFG", url: "https://www.geeksforgeeks.org/dbms/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/dbms-interview-questions/" },
    ],
  },
  {
    id: "sql",
    label: "SQL",
    aliases: ["sql", "structured query"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/sql-tutorial/" },
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/problemset/database/" },
    ],
  },
  {
    id: "cn",
    label: "Computer Networks",
    aliases: ["computer networks", "computer network", "networking", "cn"],
    links: [
      { label: "Notes", source: "GFG", url: "https://www.geeksforgeeks.org/computer-network-tutorials/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/networking-interview-questions/" },
    ],
  },
  {
    id: "oops",
    label: "OOPs",
    aliases: ["object oriented programming", "object-oriented", "oops", "oop"],
    links: [
      { label: "Notes", source: "GFG", url: "https://www.geeksforgeeks.org/object-oriented-programming-in-cpp/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/oops-interview-questions/" },
    ],
  },
  {
    id: "system-design",
    label: "System Design",
    aliases: ["system design", "hld", "high level design", "lld", "low level design"],
    links: [
      { label: "Guide", source: "GFG", url: "https://www.geeksforgeeks.org/system-design-tutorial/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/system-design-interview-questions/" },
    ],
  },
  {
    id: "cs-fundamentals",
    label: "CS Fundamentals",
    aliases: ["cs fundamentals", "core cs", "core fundamentals", "computer fundamentals"],
    links: [
      { label: "Notes", source: "GFG", url: "https://www.geeksforgeeks.org/gate-gate-cs-notes-gq/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/technical-interview-questions/" },
    ],
  },
  {
    id: "aptitude",
    label: "Aptitude",
    aliases: ["quantitative aptitude", "technical aptitude", "aptitude", "quant"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/aptitude-questions-and-answers/" },
      { label: "Practice", source: "IndiaBix", url: "https://www.indiabix.com/aptitude/questions-and-answers/" },
    ],
  },
  {
    id: "logical-reasoning",
    label: "Logical Reasoning",
    aliases: ["logical reasoning", "reasoning"],
    links: [
      { label: "Practice", source: "IndiaBix", url: "https://www.indiabix.com/logical-reasoning/questions-and-answers/" },
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/logical-reasoning/" },
    ],
  },
  {
    id: "verbal",
    label: "Verbal Ability",
    aliases: ["verbal ability", "verbal"],
    links: [
      { label: "Practice", source: "IndiaBix", url: "https://www.indiabix.com/verbal-ability/questions-and-answers/" },
    ],
  },
  {
    id: "puzzles",
    label: "Puzzles",
    aliases: ["puzzles", "puzzle"],
    links: [
      { label: "Practice", source: "GFG", url: "https://www.geeksforgeeks.org/puzzles/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/puzzles/" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    aliases: ["communication skills", "soft skills", "communication"],
    links: [
      { label: "Guide", source: "GFG", url: "https://www.geeksforgeeks.org/communication-skills/" },
    ],
  },
  {
    id: "hr",
    label: "HR Interview",
    aliases: ["hr interview", "behavioral", "hr round"],
    links: [
      { label: "Questions", source: "GFG", url: "https://www.geeksforgeeks.org/hr-interview-questions/" },
      { label: "Guide", source: "InterviewBit", url: "https://www.interviewbit.com/hr-interview-questions/" },
    ],
  },
  {
    id: "java",
    label: "Java",
    aliases: ["java"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/java/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/java-interview-questions/" },
    ],
  },
  {
    id: "python",
    label: "Python",
    aliases: ["python"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/python-programming-language/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/python-interview-questions/" },
    ],
  },
  {
    id: "cpp",
    label: "C++",
    aliases: ["c++", "cpp"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/c-plus-plus/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/cpp-interview-questions/" },
    ],
  },
  {
    id: "javascript",
    label: "JavaScript",
    aliases: ["javascript", "js"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/javascript/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/javascript-interview-questions/" },
    ],
  },
  {
    id: "react",
    label: "React",
    aliases: ["react.js", "reactjs", "react"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/reactjs-tutorials/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/react-interview-questions/" },
    ],
  },
  {
    id: "nodejs",
    label: "Node.js",
    aliases: ["node.js", "nodejs", "node"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/nodejs/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/node-js-interview-questions/" },
    ],
  },
  {
    id: "ml",
    label: "Machine Learning",
    aliases: ["machine learning", "ml"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/machine-learning/" },
      { label: "Interview", source: "InterviewBit", url: "https://www.interviewbit.com/machine-learning-interview-questions/" },
    ],
  },
  {
    id: "ai",
    label: "Artificial Intelligence",
    aliases: ["artificial intelligence", "ai"],
    links: [
      { label: "Learn", source: "GFG", url: "https://www.geeksforgeeks.org/artificial-intelligence-an-introduction/" },
    ],
  },
  {
    id: "leetcode",
    label: "Coding Practice",
    aliases: ["leetcode", "coding practice", "competitive programming"],
    links: [
      { label: "Practice", source: "LeetCode", url: "https://leetcode.com/problemset/" },
      { label: "Sheet", source: "TUF", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/" },
    ],
  },
];

const SHORT_ALIASES = new Set([
  "os",
  "ai",
  "ml",
  "dp",
  "bfs",
  "dfs",
  "lld",
  "hld",
  "sql",
  "cpp",
  "cn",
  "js",
  "oop",
  "dsa",
  "hr",
]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} alias
 * @returns {RegExp|null}
 */
function aliasRegex(alias) {
  const normalized = String(alias || "").trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("+")) {
    return new RegExp(`(?<![a-z0-9])${escapeRegExp(normalized)}(?![a-z0-9])`, "i");
  }

  if (SHORT_ALIASES.has(normalized)) {
    return new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i");
  }

  if (normalized.includes(" ")) {
    const words = normalized
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => escapeRegExp(w));
    return new RegExp(`\\b${words.join("[^a-z0-9]+")}\\b`, "i");
  }

  return new RegExp(`\\b${escapeRegExp(normalized)}\\b`, "i");
}

/** Longest aliases first so "dynamic programming" wins over "dp" ordering within an entry. */
const CATALOG_MATCHERS = MUST_DO_RESOURCE_CATALOG.map((entry) => {
  const aliases = [...entry.aliases].sort((a, b) => b.length - a.length);
  return {
    entry,
    matchers: aliases
      .map((alias) => ({ alias, re: aliasRegex(alias) }))
      .filter((m) => m.re),
  };
}).sort((a, b) => {
  const aLen = Math.max(...a.entry.aliases.map((x) => x.length));
  const bLen = Math.max(...b.entry.aliases.map((x) => x.length));
  return bLen - aLen;
});

/**
 * @param {string} topicText
 * @returns {MustDoResourceLink[]}
 */
export function buildFallbackSearchLinks(topicText) {
  const q = String(topicText || "").trim().replace(/\s+/g, " ").slice(0, 120);
  if (!q) return [];
  const encoded = encodeURIComponent(q);
  return [
    {
      label: "Search",
      source: "GFG",
      url: `https://www.geeksforgeeks.org/search/${encoded}/`,
    },
    {
      label: "Problems",
      source: "LeetCode",
      url: `https://leetcode.com/problemset/?search=${encoded}`,
    },
  ];
}

/**
 * Resolve curated resource hubs for a free-text must-do topic line.
 * @param {unknown} topicText
 * @param {{ maxTopics?: number }} [opts]
 * @returns {{ matches: MustDoResolvedTopic[], fallbackLinks: MustDoResourceLink[], hasCurated: boolean }}
 */
export function resolveMustDoTopicResources(topicText, opts = {}) {
  const maxTopics = Number.isFinite(opts.maxTopics) ? opts.maxTopics : 4;
  const raw = String(topicText ?? "").trim();
  if (!raw) {
    return { matches: [], fallbackLinks: [], hasCurated: false };
  }

  /** @type {MustDoResolvedTopic[]} */
  const matches = [];
  const seen = new Set();

  for (const { entry, matchers } of CATALOG_MATCHERS) {
    if (matches.length >= maxTopics) break;
    if (seen.has(entry.id)) continue;
    const hit = matchers.some(({ re }) => re.test(raw));
    if (!hit) continue;
    seen.add(entry.id);
    matches.push({
      id: entry.id,
      label: entry.label,
      links: entry.links,
    });
  }

  const hasCurated = matches.length > 0;
  return {
    matches,
    fallbackLinks: hasCurated ? [] : buildFallbackSearchLinks(raw),
    hasCurated,
  };
}

/** Theme-safe link chip (works in light + dark via CSS variables). */
export function resourceLinkChipClass(_source) {
  return "inline-flex items-center gap-1.5 rounded-lg border border-theme bg-theme-card px-2.5 py-1 text-[11px] font-semibold tracking-wide text-theme-secondary shadow-sm transition hover:border-theme-accent hover:bg-theme-accent/10 hover:text-theme-primary";
}

/** @deprecated Prefer resourceLinkChipClass — kept for any older imports. */
export function resourceSourceTone(source) {
  return resourceLinkChipClass(source);
}
