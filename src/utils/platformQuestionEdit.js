const LANGUAGES = ["cpp", "java", "python"];

function asText(value) {
  return String(value ?? "");
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
} = {}) {
  const sols = solutions && typeof solutions === "object" ? solutions : {};
  return {
    question: asText(question),
    intuition: asText(intuition),
    explanation: asText(explanation),
    solutions: {
      cpp: asText(sols.cpp),
      java: asText(sols.java),
      python: asText(sols.python),
    },
  };
}

export function platformQuestionEditPayload(draft) {
  const sols = draft?.solutions && typeof draft.solutions === "object" ? draft.solutions : {};
  return {
    question: asText(draft?.question),
    intuition: asText(draft?.intuition),
    explanation: asText(draft?.explanation),
    solutions: Object.fromEntries(LANGUAGES.map((language) => [language, asText(sols[language])])),
  };
}
