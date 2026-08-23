/**
 * Client-only split of interview-experience text into Round N sections.
 * Does not write or reshape stored data.
 */

const ROUND_SPLIT = /(?=Round\s+\d+\s*[:.\-–])/i;
const ROUND_HEAD = /^Round\s+(\d+)\s*[:.\-–]?\s*([\s\S]*)$/i;

/**
 * @param {unknown} content
 * @returns {{ intro: string, rounds: { label: string, body: string }[] }}
 */
export function splitExperienceNarrative(content) {
  const text = String(content || "").trim();
  if (!text) return { intro: "", rounds: [] };

  const chunks = text
    .split(ROUND_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);

  if (chunks.length === 0) return { intro: "", rounds: [] };

  /** @type {{ label: string, body: string }[]} */
  const rounds = [];
  let intro = "";

  for (const chunk of chunks) {
    const match = chunk.match(ROUND_HEAD);
    if (match) {
      rounds.push({
        label: `Round ${match[1]}`,
        body: String(match[2] || "").trim(),
      });
      continue;
    }
    if (rounds.length === 0) {
      intro = intro ? `${intro}\n\n${chunk}` : chunk;
    } else {
      const last = rounds[rounds.length - 1];
      last.body = last.body ? `${last.body}\n\n${chunk}` : chunk;
    }
  }

  return { intro, rounds };
}

/** Timeline when there are at least two Round N headings. */
export function shouldShowExperienceTimeline(narrative) {
  return Array.isArray(narrative?.rounds) && narrative.rounds.length >= 2;
}
