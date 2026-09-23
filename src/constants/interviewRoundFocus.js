/** Mirrors backend `config/interviewRoundFocus.js` for custom plan UI. */

export const INTERVIEW_ROUND_FOCUS_BY_TYPE = {
  DSA: [
    { id: "general", label: "Any topic" },
    { id: "arrays", label: "Arrays & hashing" },
    { id: "trees", label: "Trees & BST" },
    { id: "graphs", label: "Graphs & BFS/DFS" },
    { id: "dp", label: "Dynamic programming" },
    { id: "strings", label: "Strings" },
  ],
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
  "Web Dev": [
    { id: "general", label: "General web" },
    { id: "javascript", label: "JavaScript" },
    { id: "react", label: "React" },
    { id: "html_css", label: "HTML & CSS" },
    { id: "networks", label: "Web & HTTP" },
  ],
  HR: [
    { id: "general", label: "General behavioral" },
    { id: "teamwork", label: "Teamwork" },
    { id: "conflict", label: "Conflict" },
    { id: "leadership", label: "Leadership" },
    { id: "failure", label: "Failure & learning" },
    { id: "why_company", label: "Why this company" },
  ],
  Aptitude: [
    { id: "general", label: "General aptitude" },
    { id: "quant", label: "Quantitative" },
    { id: "logical", label: "Logical reasoning" },
  ],
  "ML/AI Technical": [
    { id: "general", label: "General ML/AI" },
    { id: "supervised", label: "Supervised learning" },
    { id: "deep_learning", label: "Deep learning" },
  ],
  "Case Interview": [
    { id: "general", label: "General case" },
    { id: "profitability", label: "Profitability" },
    { id: "market_entry", label: "Market entry" },
  ],
  "Core Technical": [{ id: "general", label: "General technical" }],
  "Circuit Design": [{ id: "general", label: "General circuit design" }],
  "Embedded Systems": [{ id: "general", label: "General embedded" }],
  "Project/Resume Deep Dive": [{ id: "general", label: "General deep dive" }],
};

export const roundTypeHasFocusPicker = (roundType) =>
  Boolean(INTERVIEW_ROUND_FOCUS_BY_TYPE[roundType]);

export const getFocusOptionsForRoundType = (roundType) => {
  const type = String(roundType || "").trim();
  return INTERVIEW_ROUND_FOCUS_BY_TYPE[type] || [];
};

export const getDefaultFocusForRoundType = (roundType) =>
  getFocusOptionsForRoundType(roundType)[0]?.id || "general";
