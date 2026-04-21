// When question + solution are pasted in one blob (e.g. "... Solution: ..."), keep only the part after the first label.
// Only treat "ans:" as a label, not "ans" followed by "=" (that would truncate C++ like: int ans = INT_MAX).
export function stripQuestionMarkers(str) {
  if (typeof str !== "string") return str;

  const markers = [
    /\bsolution\s*[:=-]\s*/i,
    /\banswer\s*[:=-]\s*/i,
    /\bans\s*:\s*/i,
    /\boutput\s*[:=-]\s*/i,
    /\bcode\s*[:=-]\s*/i,
  ];

  for (const marker of markers) {
    const match = str.match(marker);
    if (match) {
      return str.substring(match.index + match[0].length).trim();
    }
  }
  return str;
}
