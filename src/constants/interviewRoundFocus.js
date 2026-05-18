/** Mirrors backend `config/interviewRoundFocus.js` for custom plan UI. */

export const INTERVIEW_ROUND_FOCUS_BY_TYPE = {
  "System Design": [
    { id: "general", label: "General design" },
    { id: "scalability", label: "Scalability" },
    { id: "storage", label: "Storage & databases" },
    { id: "messaging", label: "Messaging & queues" },
  ],
  SQL: [
    { id: "general", label: "General SQL" },
    { id: "joins", label: "Joins" },
    { id: "aggregations", label: "Aggregations" },
    { id: "indexing", label: "Indexing & performance" },
    { id: "window", label: "Window functions" },
  ],
  "CS Fundamentals": [
    { id: "general", label: "General CS" },
    { id: "oop", label: "OOP" },
    { id: "dbms", label: "DBMS" },
    { id: "os", label: "Operating systems" },
    { id: "networks", label: "Networks" },
  ],
  HR: [
    { id: "general", label: "General behavioral" },
    { id: "teamwork", label: "Teamwork" },
    { id: "conflict", label: "Conflict" },
    { id: "leadership", label: "Leadership" },
    { id: "failure", label: "Failure & learning" },
    { id: "why_company", label: "Why this company" },
  ],
};

export const roundTypeHasFocusPicker = (roundType) =>
  Boolean(INTERVIEW_ROUND_FOCUS_BY_TYPE[roundType]);

export const getFocusOptionsForRoundType = (roundType) => {
  if (roundType === "DSA") return [];
  return INTERVIEW_ROUND_FOCUS_BY_TYPE[roundType] || [];
};

export const getDefaultFocusForRoundType = (roundType) =>
  getFocusOptionsForRoundType(roundType)[0]?.id || "general";
