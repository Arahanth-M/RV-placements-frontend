/**
 * Client-only split of interview-experience text into Round N sections.
 * Does not write or reshape stored data.
 */

const HEADING_SOURCE =
  "Online\\s+Assessment|Online\\s+Test|Group\\s+Discussion|System\\s+Design(?:\\s+Round)?|Technical\\s+(?:Round|Interview)|Tech\\s+Round|Coding\\s+Round|Managerial\\s+Round|Behavioral\\s+Round|Behavioural\\s+Round|HR\\s+(?:Round|Interview)|Aptitude(?:\\s+(?:Round|Test))?|GD|OA|Interview";

const TYPE_RULES = [
  [/^(online assessment|online test|oa)\b/i, "OA"],
  [/^(technical(?:\s+interview|\s+round)?|tech round)\b/i, "Technical"],
  [/^(hr(?:\s+round|\s+interview|\s+screen)?)\b/i, "HR"],
  [/^(coding(?:\s+round)?)\b/i, "Coding"],
  [/^(system design(?:\s+round)?)\b/i, "System Design"],
  [/^(aptitude(?:\s+round|\s+test)?)\b/i, "Aptitude"],
  [/^(managerial(?:\s+round)?)\b/i, "Managerial"],
  [/^(group discussion|gd)\b/i, "GD"],
  [/^(behavioral(?:\s+round)?|behavioural(?:\s+round)?)\b/i, "Behavioral"],
  [/^interview\b/i, "Interview"],
];

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

function headingParts(raw) {
  const trimmed = String(raw || "")
    .trim()
    .replace(/[:.\-–—]+\s*$/u, "")
    .trim();
  const numMatch = trimmed.match(/(\d+)\s*$/);
  const sourceNumber = numMatch ? Number(numMatch[1]) : null;
  const words = trimmed.replace(/\s*\d+\s*$/, "").replace(/\s+/g, " ").trim();
  return { words, sourceNumber };
}

function canonicalType(words) {
  const value = String(words || "").trim();
  if (!value || /^round$/i.test(value)) return "";
  for (const [pattern, type] of TYPE_RULES) {
    if (pattern.test(value)) return type;
  }
  return "";
}

function inferType(text) {
  return canonicalType(String(text || "").trim());
}

/**
 * Headings are real round labels, not words that happen to appear in a sentence.
 * "1 HR round" stays in the paragraph. "HR Round-" starts a section.
 * @param {string} text
 * @param {number} start
 * @param {string} raw
 */
function isExperienceHeading(text, start, raw) {
  const before = start === 0 ? "" : text[start - 1];
  if (before && !/\s/u.test(before)) return false;

  const original = raw.trim();
  const { words, sourceNumber } = headingParts(original);
  if (!words) return false;

  const atLineStart = start === 0 || text[start - 1] === "\n";
  const hasDelimiter = /[:.\-–—]\s*$/u.test(original);
  const wordKey = words.toLowerCase();

  if (wordKey === "round") {
    if (!sourceNumber) return false;
    return atLineStart || hasDelimiter || /^Round\s*\d/u.test(original);
  }

  if (["oa", "gd", "hr", "interview"].includes(wordKey)) return hasDelimiter;

  if (hasDelimiter || sourceNumber) return true;
  // "HR Round" on its own line, with a capital R, still starts a section.
  return atLineStart && /Round/u.test(original);
}

/**
 * @param {string} text
 * @returns {{ start: number, end: number, raw: string }[]}
 */
function findExperienceHeadings(text) {
  const re = new RegExp(
    `\\b(?:Round\\s*\\d+\\s*[:.\\-–—]?|(?:${HEADING_SOURCE})\\s*\\d*\\s*[:\\-–—]?)`,
    "giu"
  );
  /** @type {{ start: number, end: number, raw: string }[]} */
  const found = [];
  let match = re.exec(text);
  while (match) {
    const start = match.index;
    const raw = match[0];
    const end = start + raw.trimEnd().length;
    if (isExperienceHeading(text, start, text.slice(start, end))) {
      const previous = found[found.length - 1];
      if (!previous || start >= previous.end) {
        found.push({ start, end, raw: text.slice(start, end) });
      }
    }
    if (re.lastIndex <= start) re.lastIndex = start + 1;
    match = re.exec(text);
  }
  return found;
}

function subtitleRepeatsType(subtitle, type) {
  if (!subtitle || !type) return false;
  const value = subtitle.trim().toLowerCase();
  const kind = type.trim().toLowerCase();
  return (
    value === kind ||
    value === `${kind} round` ||
    value === `${kind} interview` ||
    value === `${kind} round:` ||
    value === `${kind} interview:`
  );
}

/**
 * @param {unknown} content
 * @returns {{ intro: string, rounds: { label: string, number: number, type: string, subtitle: string, body: string }[] }}
 */
export function splitExperienceNarrative(content) {
  const text = plainExperienceText(content);
  if (!text) return { intro: "", rounds: [] };

  const headings = findExperienceHeadings(text);
  if (headings.length === 0) return { intro: text, rounds: [] };

  let intro = text.slice(0, headings[0].start).trim();
  /** @type {{ sourceNumber: number|null, type: string, subtitle: string, body: string }[]} */
  const drafts = [];

  headings.forEach((heading, index) => {
    const next = headings[index + 1];
    const chunk = text.slice(heading.end, next ? next.start : text.length).trim();
    const parts = headingParts(heading.raw);
    const lead = roundLead(chunk);
    const type = canonicalType(parts.words) || inferType(lead.subtitle) || inferType(lead.body);
    const subtitle = subtitleRepeatsType(lead.subtitle, type) ? "" : lead.subtitle;

    if (type === "Interview" && !parts.sourceNumber) {
      const note = [subtitle, lead.body].filter(Boolean).join("\n\n");
      if (note) intro = intro ? `${intro}\n\n${note}` : note;
      return;
    }

    drafts.push({
      sourceNumber: parts.sourceNumber,
      type,
      subtitle,
      body: lead.body,
    });
  });

  const explicit = drafts.map((round) => round.sourceNumber).filter((n) => Number.isFinite(n));
  const unique = new Set(explicit);
  const useSourceNumbers = explicit.length === drafts.length && unique.size === drafts.length;

  const rounds = drafts.map((round, index) => {
    const number = useSourceNumbers ? round.sourceNumber : index + 1;
    return {
      label: `Round ${number}`,
      number,
      type: round.type,
      subtitle: round.subtitle,
      body: round.body,
    };
  });

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

/**
 * Plain text kept beside the stored overview and rounds.
 * @param {{ overview?: string, rounds?: { type?: string, title?: string, details?: string }[] }} input
 */
export function composeStoredInterviewExperience({ overview = "", rounds = [] } = {}) {
  const parts = [];
  const intro = String(overview || "").trim();
  if (intro) parts.push(intro);

  const filled = (Array.isArray(rounds) ? rounds : []).filter(
    (round) =>
      String(round?.type || "").trim() ||
      String(round?.title || "").trim() ||
      String(round?.details || "").trim()
  );

  filled.forEach((round, index) => {
    const type = String(round.type || "").replace(/\s+/g, " ").trim();
    const title = String(round.title || "").replace(/\s+/g, " ").trim();
    const details = String(round.details || "").trim();
    const heading = type ? `Round ${index + 1}: ${type}` : `Round ${index + 1}`;
    const lines = [heading];
    if (title) lines.push(title);
    if (details) lines.push("", details);
    parts.push(lines.join("\n"));
  });

  return parts.join("\n\n").trim();
}

/** Timeline when there are at least two Round N headings. */
export function shouldShowExperienceTimeline(narrative) {
  return Array.isArray(narrative?.rounds) && narrative.rounds.length >= 2;
}
