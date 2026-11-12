const LANGUAGES = ["cpp", "java", "python"];

function asText(value) {
  return String(value ?? "");
}

function normalizeKind(raw) {
  const value = asText(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (value === "coding" || value === "dsa" || value === "code") return "coding";
  if (value === "sql") return "sql";
  if (value === "non_coding" || value === "noncoding" || value === "theory") return "non_coding";
  return "non_coding";
}

/**
 * Draft for the platform-admin question editor.
 * Language solutions stay separate from the written explanation.
 */
export function platformQuestionEditDraft({
  question = "",
  solutions = null,
  intuition = "",
  explanation = "",
  kind = "non_coding",
  prepRoleKey = "",
} = {}) {
  const sols = solutions && typeof solutions === "object" ? solutions : {};
  return {
    question: asText(question),
    intuition: asText(intuition),
    explanation: asText(explanation),
    kind: normalizeKind(kind),
    prepRoleKey: asText(prepRoleKey),
    solutions: {
      cpp: asText(sols.cpp),
      java: asText(sols.java),
      python: asText(sols.python),
    },
  };
}

export function platformQuestionEditPayload(draft) {
  const sols = draft?.solutions && typeof draft.solutions === "object" ? draft.solutions : {};
  const kind = normalizeKind(draft?.kind);
  const payload = {
    question: asText(draft?.question),
    intuition: asText(draft?.intuition),
    explanation: asText(draft?.explanation),
    kind,
    prepRoleKey: asText(draft?.prepRoleKey).trim(),
  };
  if (kind === "coding") {
    payload.solutions = Object.fromEntries(
      LANGUAGES.map((language) => [language, asText(sols[language])])
    );
  }
  return payload;
}

export function isCodingDraftKind(kind) {
  return normalizeKind(kind) === "coding";
}
