import { displayPrepEvidenceLabel } from "./prepPathCompanyFocus.js";
import { resolvePrepResourceLink } from "./prepPathResourceLinks.js";

const MATCH_STOPWORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "basics",
  "basic",
  "fundamentals",
  "fundamental",
  "intro",
  "introduction",
  "core",
  "advanced",
  "overview",
  "topics",
  "topic",
  "practice",
  "revision",
  "revise",
  "review",
  "implementation",
  "problem",
  "problems",
  "solve",
  "complete",
  "tutorial",
]);

const DSA_HINTS = [
  "array",
  "string",
  "tree",
  "graph",
  "binary",
  "search",
  "hash",
  "linked",
  "list",
  "bst",
  "dijkstra",
  "shortest",
  "two sum",
  "oa",
  "coding",
  "leetcode",
  "algorithm",
  "dsa",
  "dynamic",
  "stack",
  "queue",
  "heap",
];

const OOP_HINTS = ["oop", "polymorphism", "inheritance", "encapsulation", "abstraction", "class", "object"];
const SWIFT_HINTS = ["swift", "ios", "xcode", "syntax", "collection", "uikit", "swiftui"];

const MIN_MATCH_SCORE = 35;

function normText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .trim();
}

function distinctiveTokens(text) {
  return String(text || "")
    .split(" ")
    .filter((w) => w.length > 2 && !MATCH_STOPWORDS.has(w));
}

function containsHint(text, hints) {
  const blob = normText(text);
  return hints.some((hint) => blob.includes(hint));
}

export function topicMatchesFocus(topicTitle, focus) {
  const a = normText(topicTitle);
  const b = normText(focus);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aTokens = distinctiveTokens(a);
  const bTokens = distinctiveTokens(b);
  if (!aTokens.length || !bTokens.length) return false;
  const aSet = new Set(aTokens);
  return bTokens.some(
    (token) =>
      aSet.has(token) ||
      aTokens.some(
        (other) =>
          other.length >= 4 &&
          token.length >= 4 &&
          (other.startsWith(token) || token.startsWith(other))
      )
  );
}

function tokenOverlapScore(a, b) {
  const aTokens = distinctiveTokens(a);
  const bTokens = distinctiveTokens(b);
  if (!aTokens.length || !bTokens.length) return 0;
  const bSet = new Set(bTokens);
  return aTokens.filter((t) => bSet.has(t)).length;
}

function domainConflict(taskTitle, subtopic) {
  const taskBlob = `${taskTitle} ${subtopic?.topicTitle || ""}`;
  const subBlob = `${subtopic?.title || ""} ${subtopic?.topicTitle || ""}`;
  const taskDsa = containsHint(taskBlob, DSA_HINTS);
  const taskSwift = containsHint(taskBlob, SWIFT_HINTS);
  const taskOop = containsHint(taskBlob, OOP_HINTS);
  const subDsa = containsHint(subBlob, DSA_HINTS);
  const subSwift = containsHint(subBlob, SWIFT_HINTS);
  const subOop = containsHint(subBlob, OOP_HINTS);

  if (taskSwift && !subSwift) return true;
  if (subSwift && !taskSwift) return true;
  if (taskDsa && subOop && !subDsa) return true;
  if (taskOop && subDsa && !subOop) return true;
  return false;
}

function subtopicWeight(item) {
  const hours = Number(item?.hours);
  if (Number.isFinite(hours) && hours > 0) return Math.max(6, Math.round(hours * 60));
  return 30;
}

function roundHoursFromMinutes(minutes) {
  const mins = Math.max(1, Math.round(Number(minutes) || 0));
  const hours = Math.round((mins / 60) * 10) / 10;
  return hours < 0.1 ? 0.1 : hours;
}

function applyResourceLink(sub, taskTitle, dayFocus) {
  const resolved = resolvePrepResourceLink({
    resourceId: sub.resourceId,
    title: sub.title,
    topicTitle: sub.topicTitle || dayFocus,
    taskTitle,
    notes: sub.notes,
  });
  if (!resolved) {
    return { ...sub, resourceId: "", linkTitle: "", linkUrl: "", linkWhy: "" };
  }
  return {
    ...sub,
    resourceId: resolved.resourceId || sub.resourceId || "",
    linkTitle: resolved.title,
    linkUrl: resolved.url,
    linkWhy: resolved.why,
  };
}

function flattenSubtopics(topics) {
  const out = [];
  (Array.isArray(topics) ? topics : []).forEach((topic, ti) => {
    const subs =
      Array.isArray(topic?.subtopics) && topic.subtopics.length
        ? topic.subtopics
        : [
            {
              title: topic?.title || "Topic",
              hours: topic?.hours,
              notes: topic?.why || "",
              linkTitle: "",
              linkUrl: "",
              linkWhy: "",
            },
          ];
    subs.forEach((sub, si) => {
      out.push({
        key: `${ti}-${si}-${sub?.title || "sub"}`,
        title: String(sub?.title || "Subtopic").trim() || "Subtopic",
        hours: Number(sub?.hours) || 0,
        notes: String(sub?.notes || "").trim(),
        resourceId: String(sub?.resourceId || "").trim(),
        linkTitle: String(sub?.linkTitle || sub?.link?.title || "").trim(),
        linkUrl: String(sub?.linkUrl || sub?.link?.url || "").trim(),
        linkWhy: String(sub?.linkWhy || sub?.link?.why || "").trim(),
        topicTitle: String(topic?.title || "").trim(),
      });
    });
  });
  return out;
}

function cloneDay(day) {
  return {
    ...day,
    tasks: Array.isArray(day?.tasks) ? day.tasks.map((task) => ({ ...task })) : [],
    slots: Array.isArray(day?.slots)
      ? day.slots.map((slot) => ({
          ...slot,
          tasks: Array.isArray(slot?.tasks) ? slot.tasks.map((task) => ({ ...task })) : [],
        }))
      : [],
  };
}

function daySlotViews(day) {
  if (Array.isArray(day.slots) && day.slots.length) {
    return day.slots.map((slot) => ({
      ...slot,
      tasks: Array.isArray(slot.tasks) ? slot.tasks.map((task) => ({ ...task })) : [],
      synthetic: false,
    }));
  }
  const taskMinutes = (day.tasks || []).reduce(
    (sum, task) => sum + (Number(task?.minutes) || 0),
    0
  );
  return [
    {
      index: 1,
      minutes: Math.round((Number(day.hours) || 0) * 60) || taskMinutes || 60,
      tasks: Array.isArray(day.tasks) ? day.tasks.map((task) => ({ ...task })) : [],
      synthetic: true,
    },
  ];
}

function scoreTaskSubtopicMatch(taskTitle, subtopic, dayFocus) {
  if (domainConflict(taskTitle, subtopic)) return 0;

  const task = normText(taskTitle);
  const subTitle = normText(subtopic?.title);
  const topicTitle = normText(subtopic?.topicTitle);
  if (!task || !subTitle) return 0;

  let score = 0;
  if (task === subTitle) score += 100;
  else if (task.includes(subTitle) || subTitle.includes(task)) score += 85;
  else score += tokenOverlapScore(taskTitle, subtopic.title) * 22;

  if (topicTitle && topicMatchesFocus(topicTitle, dayFocus)) score += 12;
  if (topicMatchesFocus(subTitle, taskTitle)) score += 20;
  if (topicMatchesFocus(topicTitle, taskTitle)) score += 15;

  return score;
}

function splitByCapacity(items, capacities) {
  const list = Array.isArray(items) ? items.slice() : [];
  const caps = (Array.isArray(capacities) ? capacities : []).map((c) =>
    Math.max(0, Number(c) || 0)
  );
  if (!list.length || !caps.length) return caps.map(() => []);

  const totalCap = caps.reduce((sum, c) => sum + c, 0) || caps.length;
  const targetCounts = caps.map((cap) =>
    Math.max(0, Math.round((list.length * cap) / totalCap))
  );

  let countSum = targetCounts.reduce((a, b) => a + b, 0);
  while (countSum > list.length && targetCounts.some((n) => n > 0)) {
    const idx = targetCounts.indexOf(Math.max(...targetCounts));
    targetCounts[idx] -= 1;
    countSum -= 1;
  }
  while (countSum < list.length) {
    const idx = targetCounts.indexOf(Math.min(...targetCounts));
    targetCounts[idx] += 1;
    countSum += 1;
  }

  const buckets = caps.map(() => []);
  let cursor = 0;
  targetCounts.forEach((count, bucketIndex) => {
    for (let i = 0; i < count && cursor < list.length; i += 1) {
      buckets[bucketIndex].push(list[cursor]);
      cursor += 1;
    }
  });
  while (cursor < list.length) {
    buckets[buckets.length - 1].push(list[cursor]);
    cursor += 1;
  }
  return buckets;
}

function rescaleSubtopicMinutes(subtopics, totalMinutes) {
  const list = Array.isArray(subtopics) ? subtopics : [];
  const budget = Math.max(1, Number(totalMinutes) || 0);
  if (!list.length) return [];

  const weights = list.map((sub) => Math.max(1, subtopicWeight(sub)));
  const weightSum = weights.reduce((a, b) => a + b, 0) || list.length;
  let used = 0;

  return list.map((sub, index) => {
    const isLast = index === list.length - 1;
    const minutes = isLast
      ? Math.max(1, budget - used)
      : Math.max(1, Math.round((budget * weights[index]) / weightSum));
    if (!isLast) used += minutes;
    return {
      ...sub,
      minutes,
      hours: roundHoursFromMinutes(minutes),
    };
  });
}

function fallbackSubtopicsForTask(task, dayFocus) {
  const title = String(task?.title || "Focus block").trim();
  const sub = applyResourceLink(
    {
      key: `fallback-${title}`,
      title,
      topicTitle: dayFocus,
      notes: "",
      hours: 0,
    },
    title,
    dayFocus
  );
  return rescaleSubtopicMinutes([sub], task.minutes);
}

function assignSubtopicsToTasks(tasks, subtopics, dayFocus) {
  const nextTasks = (Array.isArray(tasks) && tasks.length ? tasks : []).map((task) => ({
    ...task,
    subtopics: [],
  }));
  const pool = (Array.isArray(subtopics) ? subtopics : []).map((sub) => ({ ...sub }));

  if (!nextTasks.length) {
    return pool.length
      ? [{ title: "Cover these subtopics", minutes: 0, subtopics: pool }]
      : [];
  }

  if (nextTasks.length === 1) {
    const compatible = pool.filter((sub) => !domainConflict(nextTasks[0].title, sub));
    nextTasks[0].subtopics = compatible.length ? compatible : pool;
  } else {
    const assignments = pool.map((sub) => {
      const scores = nextTasks.map((task) => scoreTaskSubtopicMatch(task.title, sub, dayFocus));
      const bestScore = Math.max(...scores, 0);
      const bestIndex = scores.indexOf(bestScore);
      return { sub, bestScore, bestIndex };
    });

    assignments
      .filter(({ bestScore }) => bestScore >= MIN_MATCH_SCORE)
      .sort((a, b) => b.bestScore - a.bestScore || a.sub.title.localeCompare(b.sub.title))
      .forEach(({ sub, bestIndex }) => {
        nextTasks[bestIndex].subtopics.push(sub);
      });
  }

  return nextTasks.map((task) => {
    const linked = (task.subtopics.length ? task.subtopics : [])
      .map((sub) => applyResourceLink(sub, task.title, dayFocus));
    const finalSubs = linked.length
      ? rescaleSubtopicMinutes(linked, task.minutes)
      : fallbackSubtopicsForTask(task, dayFocus);
    return { ...task, subtopics: finalSubs };
  });
}

function platformReviewMinutes(dayMinutes, itemCount) {
  if (!itemCount) return 0;
  const budget = Math.max(1, Number(dayMinutes) || 0);
  const perItem = 12;
  return Math.min(30, Math.max(15, Math.min(perItem * itemCount, Math.round(budget * 0.15))));
}

function buildPlatformReviewSubtopics(evidence, totalMinutes, isGeneral) {
  const items = (Array.isArray(evidence) ? evidence : []).filter(
    (ev) => ev?.label || ev?.snippet
  );
  if (!items.length || totalMinutes <= 0) return [];

  const per = Math.max(8, Math.floor(totalMinutes / items.length));
  let used = 0;
  return items.map((ev, index) => {
    const isLast = index === items.length - 1;
    const minutes = isLast ? Math.max(8, totalMinutes - used) : per;
    if (!isLast) used += minutes;
    const label =
      displayPrepEvidenceLabel(ev.label, { isGeneral }) ||
      String(ev.sourceType || "Platform item").replace(/_/g, " ");
    return {
      key: `platform-${index}-${ev.sourceType || "item"}`,
      title: label,
      topicTitle: "Company platform data",
      notes: String(ev.snippet || "").trim(),
      minutes,
      hours: roundHoursFromMinutes(minutes),
      isPlatformItem: true,
      sourceType: ev.sourceType,
      platformSnippet: ev.snippet,
      linkTitle: "",
      linkUrl: "",
      linkWhy: "",
    };
  });
}

function injectPlatformReviewIntoDay(day, { isGeneral } = {}) {
  const evidence = Array.isArray(day.campusEvidence) ? day.campusEvidence : [];
  if (!evidence.length) return day;

  const slots = daySlotViews(day);
  if (!slots.length) return day;

  const dayMinutes =
    slots.reduce((sum, slot) => sum + (Number(slot.minutes) || 0), 0) ||
    Math.round((Number(day.hours) || 0) * 60);
  const platformMinutes = platformReviewMinutes(dayMinutes, evidence.length);
  if (platformMinutes <= 0) return day;

  const firstSlot = slots[0];
  const tasks = Array.isArray(firstSlot.tasks) ? firstSlot.tasks.map((t) => ({ ...t })) : [];
  if (!tasks.length) return day;

  const shrinkEach = Math.ceil(platformMinutes / tasks.length);
  tasks.forEach((task, index) => {
    if (index === 0) return;
    task.minutes = Math.max(15, (Number(task.minutes) || 0) - shrinkEach);
  });
  const firstTask = tasks[0];
  firstTask.minutes = Math.max(15, (Number(firstTask.minutes) || 0) - shrinkEach + platformMinutes);

  const platformSubs = buildPlatformReviewSubtopics(evidence, platformMinutes, isGeneral);
  const existing = Array.isArray(firstTask.subtopics) ? firstTask.subtopics : [];
  firstTask.subtopics = rescaleSubtopicMinutes(
    [...platformSubs, ...existing],
    firstTask.minutes
  );
  firstTask.isPlatformReview = true;
  firstSlot.tasks = tasks;

  if (slots.length === 1 && slots[0].synthetic) {
    day.tasks = firstSlot.tasks;
  } else {
    day.slots = slots.map(({ synthetic, ...slot }) => slot);
  }
  return day;
}

/**
 * Fold topic/subtopic hour split into each day's slot tasks as nested points.
 * Display-only — does not mutate the original plan arrays.
 */
export function assignSubtopicsToDays(days, topics, options = {}) {
  const result = (Array.isArray(days) ? days : []).map(cloneDay);
  const leftover = flattenSubtopics(topics);
  if (!result.length) return result;

  result.forEach((day, dayIndex) => {
    const isLastDay = dayIndex === result.length - 1;
    const slots = daySlotViews(day);
    const dayMinutes =
      slots.reduce((sum, slot) => sum + (Number(slot.minutes) || 0), 0) ||
      Math.round((Number(day.hours) || 0) * 60);

    const dayPool = [];
    for (let i = 0; i < leftover.length; ) {
      if (topicMatchesFocus(leftover[i].topicTitle, day.focus)) {
        dayPool.push(leftover.splice(i, 1)[0]);
      } else {
        i += 1;
      }
    }

    let dayPoolMinutes = dayPool.reduce((sum, sub) => sum + subtopicWeight(sub), 0);
    while (leftover.length && (isLastDay || dayPoolMinutes < dayMinutes)) {
      const nextMins = subtopicWeight(leftover[0]);
      if (
        !isLastDay &&
        dayPool.length &&
        dayPoolMinutes >= dayMinutes &&
        dayPoolMinutes + nextMins > dayMinutes + 20
      ) {
        break;
      }
      dayPool.push(leftover.shift());
      dayPoolMinutes += nextMins;
    }

    const slotBuckets = splitByCapacity(
      dayPool,
      slots.map((slot) => Number(slot.minutes) || 0)
    );

    slots.forEach((slot, slotIndex) => {
      slot.tasks = assignSubtopicsToTasks(slot.tasks, slotBuckets[slotIndex] || [], day.focus);
      delete slot.subtopics;
    });

    if (slots.length === 1 && slots[0].synthetic) {
      day.tasks = slots[0].tasks;
      delete day.subtopics;
    } else {
      day.slots = slots.map(({ synthetic, ...slot }) => slot);
    }

    injectPlatformReviewIntoDay(day, options);
  });

  if (leftover.length) {
    const lastDay = result[result.length - 1];
    const focus = lastDay.focus || "";
    if (Array.isArray(lastDay.slots) && lastDay.slots.length) {
      const lastSlot = lastDay.slots[lastDay.slots.length - 1];
      lastSlot.tasks = assignSubtopicsToTasks(lastSlot.tasks, leftover, focus);
    } else if (Array.isArray(lastDay.tasks)) {
      lastDay.tasks = assignSubtopicsToTasks(lastDay.tasks, leftover, focus);
    }
  }

  return result;
}
