/** Mirrors backend {@link inferQuestionCount} / {@link clampQuestionCountForRound}. */

export const MAX_DSA_QUESTIONS_PER_ROUND = 2;
export const MAX_HR_QUESTIONS_PER_ROUND = 1;

export function inferInterviewQuestionCount(roundType) {
  const t = String(roundType || "").trim();
  if (t === "DSA") return MAX_DSA_QUESTIONS_PER_ROUND;
  if (t === "SQL") return 4;
  if (t === "System Design") return 3;
  if (t === "HR") return MAX_HR_QUESTIONS_PER_ROUND;
  if (t === "CS Fundamentals") return 3;
  return 3;
}

export function clampInterviewQuestionCountForRound(roundType, questionCount, slots = 0) {
  const planned = inferInterviewQuestionCount(roundType || "");
  let count =
    typeof questionCount === "number" && Number.isFinite(questionCount)
      ? Math.round(questionCount)
      : null;
  if (count == null || count < 1) {
    count = Math.max(slots, planned);
  }
  count = Math.min(planned, Math.max(1, count));
  if (roundType === "DSA") {
    count = Math.min(MAX_DSA_QUESTIONS_PER_ROUND, count);
  }
  if (roundType === "HR") {
    count = Math.min(MAX_HR_QUESTIONS_PER_ROUND, count);
  }
  return count;
}
