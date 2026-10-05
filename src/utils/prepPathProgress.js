import { assignSubtopicsToDays } from "./prepPathSlotSubtopics.js";

const STORAGE_PREFIX = "prepPath:progress:";

function trackToken(value) {
  const token = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return token || "item";
}

function attachStudyLinks(topics, studyLinks) {
  const sections = Array.isArray(topics) ? topics : [];
  const links = Array.isArray(studyLinks) ? studyLinks : [];
  const hasAny = sections.some((topic) =>
    (topic?.subtopics || []).some((sub) => sub?.linkUrl || sub?.link?.url)
  );
  if (hasAny || !links.length) return sections;
  let index = 0;
  return sections.map((topic) => ({
    ...topic,
    subtopics: (topic?.subtopics || []).map((sub) => {
      if (sub?.linkUrl || sub?.link?.url) return sub;
      const link = links[index % links.length];
      index += 1;
      return {
        ...sub,
        linkTitle: link?.title || "",
        linkUrl: link?.url || "",
        linkWhy: link?.why || "",
      };
    }),
  }));
}

/**
 * Stamp stable ids onto each day task (topic) and subtopic.
 * A topic with subtopics is complete only when every subtopic is done.
 * A topic with no subtopics counts as a single item.
 */
export function annotatePrepChecklist(days) {
  const topics = [];
  const nextDays = (Array.isArray(days) ? days : []).map((day) => {
    const useSlots = Array.isArray(day?.slots) && day.slots.length > 0;
    const mapTasks = (tasks, slotIndex) =>
      (Array.isArray(tasks) ? tasks : []).map((task, taskIndex) => {
        const topicId = `d${Number(day?.day) || 0}-s${slotIndex}-t${taskIndex}-${trackToken(task?.title)}`;
        const rawSubs = (Array.isArray(task?.subtopics) ? task.subtopics : []).filter(
          (sub) => sub?.title
        );
        const subtopics = rawSubs.map((sub, subIndex) => ({
          ...sub,
          trackId: `${topicId}--${String(sub?.key || subIndex)}`,
        }));
        const leafIds = subtopics.length ? subtopics.map((sub) => sub.trackId) : [topicId];
        topics.push({
          id: topicId,
          title: String(task?.title || "Topic"),
          leafIds,
        });
        return { ...task, trackId: topicId, leafIds, subtopics };
      });

    if (useSlots) {
      return {
        ...day,
        slots: day.slots.map((slot) => ({
          ...slot,
          tasks: mapTasks(slot.tasks, slot?.index ?? 0),
        })),
      };
    }
    return { ...day, tasks: mapTasks(day.tasks, 0) };
  });
  return { days: nextDays, topics };
}

export function buildTrackedPrepDays(plan, { isGeneral = false } = {}) {
  if (!plan) return { days: [], topics: [] };
  const roadmap = plan.roadmap || {};
  const days = Array.isArray(roadmap.days) ? roadmap.days : [];
  const topics = Array.isArray(roadmap.topicSections) ? roadmap.topicSections : [];
  const studyLinks = Array.isArray(roadmap.studyLinks) ? roadmap.studyLinks : [];
  const displayed = assignSubtopicsToDays(days, attachStudyLinks(topics, studyLinks), {
    isGeneral,
  });
  return annotatePrepChecklist(displayed);
}

export function prepPlanStorageKey(plan) {
  if (!plan) return "";
  return String(plan._id || `${plan.companyName}-${plan.role}-${plan.createdAt}` || "").trim();
}

export function readPrepProgress(planKey) {
  if (!planKey || typeof localStorage === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${planKey}`);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string" && id));
  } catch {
    return new Set();
  }
}

export function writePrepProgress(planKey, ids) {
  if (!planKey || typeof localStorage === "undefined") return;
  try {
    const list = ids instanceof Set ? [...ids] : [];
    localStorage.setItem(`${STORAGE_PREFIX}${planKey}`, JSON.stringify(list));
  } catch {
    // ignore quota / private browsing
  }
}

export function loadPrepProgress(planKey, topics) {
  const known = new Set((Array.isArray(topics) ? topics : []).flatMap((topic) => topic.leafIds || []));
  return new Set([...readPrepProgress(planKey)].filter((id) => known.has(id)));
}

/** @returns {"unchecked" | "mixed" | "checked"} */
export function checkState(leafIds, completedIds) {
  const ids = Array.isArray(leafIds) ? leafIds : [];
  if (!ids.length || !(completedIds instanceof Set)) return "unchecked";
  let done = 0;
  ids.forEach((id) => {
    if (completedIds.has(id)) done += 1;
  });
  if (done === 0) return "unchecked";
  if (done === ids.length) return "checked";
  return "mixed";
}

export function toggleTrackedIds(leafIds, completedIds) {
  const next = new Set(completedIds instanceof Set ? completedIds : []);
  const ids = Array.isArray(leafIds) ? leafIds : [];
  const allOn = ids.length > 0 && ids.every((id) => next.has(id));
  if (allOn) ids.forEach((id) => next.delete(id));
  else ids.forEach((id) => next.add(id));
  return next;
}

export function toggleTrackedId(id, completedIds) {
  return toggleTrackedIds([id], completedIds);
}

export function progressSummary(topics, completedIds) {
  const leaves = (Array.isArray(topics) ? topics : []).flatMap((topic) => topic?.leafIds || []);
  const total = leaves.length;
  const done = leaves.reduce(
    (count, id) => count + (completedIds instanceof Set && completedIds.has(id) ? 1 : 0),
    0
  );
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}
