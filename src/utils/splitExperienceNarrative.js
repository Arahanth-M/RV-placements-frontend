/**
 * Client-only split of interview-experience text into Round N sections.
 * Does not write or reshape stored data.
 */

const ROUND_SPLIT = /(?=^Round\s+\d+\b)/im;
const ROUND_HEAD = /^Round\s+(\d+)\b\s*[:.\-–]?\s*([\s\S]*)$/i;

/**
 * Display text only. Removes markdown markers that research writeups often include.
 * @param {unknown} value
 */
export function plainExperienceText(value) {
  let text = String(value ?? "").replace(/\r\n/g, "\n");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1");
  text = text.replace(/^\s*(?:\*\s*){1,3}$/gm, "");
  text = text.replace(/^\s*(?:-{3,}|_{3,})\s*$/gm, "");
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "$1");
  text = text.replace(/__([^_\n]+)__/g, "$1");
  text = text.replace(/\*\*/g, "");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

/**
 * A short label before the narrative, such as "Technical Interview 1 (1–1.5 hrs)".
 * @param {string} body
 */
function roundLead(body) {
  const text = plainExperienceText(body);
  if (!text) return { subtitle: "", body: "" };

  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) {
    const head = lines[0].replace(/:\s*$/, "");
    if (head.length <= 110 && !/[.!?]$/.test(head)) {
      return { subtitle: head, body: lines.slice(1).join("\n\n") };
    }
  }

  const inline = text.match(/^(.{8,110}?):\s+([\s\S]+)$/);
  if (inline && !/[.!?]$/.test(inline[1].trim())) {
    return { subtitle: inline[1].trim(), body: inline[2].trim() };
  }

  return { subtitle: "", body: text };
}

/**
 * @param {unknown} content
 * @returns {{ intro: string, rounds: { label: string, subtitle: string, body: string }[] }}
 */
export function splitExperienceNarrative(content) {
  const text = plainExperienceText(content);
  if (!text) return { intro: "", rounds: [] };

  const chunks = text
    .split(ROUND_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);

  if (chunks.length === 0) return { intro: "", rounds: [] };

  /** @type {{ label: string, subtitle: string, body: string }[]} */
  const rounds = [];
  let intro = "";

  for (const chunk of chunks) {
    const match = chunk.match(ROUND_HEAD);
    if (match) {
      const lead = roundLead(match[2]);
      rounds.push({
        label: `Round ${match[1]}`,
        subtitle: lead.subtitle,
        body: lead.body,
      });
      continue;
    }
    if (rounds.length === 0) {
      intro = intro ? `${intro}\n\n${chunk}` : chunk;
    } else {
      const last = rounds[rounds.length - 1];
      const extra = plainExperienceText(chunk);
      if (!extra) continue;
      last.body = last.body ? `${last.body}\n\n${extra}` : extra;
    }
  }

  return { intro: plainExperienceText(intro), rounds };
}

/**
 * Store a structured writeup as the plain text the experience card already displays.
 * @param {{ overview?: string, rounds?: { title?: string, details?: string }[] }} input
 */
export function composeInterviewProcess({ overview = "", rounds = [] } = {}) {
  const parts = [];
  const intro = String(overview || "").trim();
  if (intro) parts.push(intro);

  const filled = (Array.isArray(rounds) ? rounds : []).filter(
    (round) => String(round?.title || "").trim() || String(round?.details || "").trim()
  );

  filled.forEach((round, index) => {
    const title = String(round.title || "").replace(/\s+/g, " ").trim();
    const details = String(round.details || "").trim();
    const lines = [`Round ${index + 1}`];
    if (title) lines.push(title);
    if (details) lines.push(details);
    parts.push(lines.join("\n"));
  });

  return parts.join("\n\n").trim();
}

/** Timeline when there are at least two Round N headings. */
export function shouldShowExperienceTimeline(narrative) {
  return Array.isArray(narrative?.rounds) && narrative.rounds.length >= 2;
}
