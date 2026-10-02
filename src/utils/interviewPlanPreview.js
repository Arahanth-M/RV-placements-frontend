import { getFocusOptionsForRoundType } from "../constants/interviewRoundFocus";
import { inferInterviewQuestionCount } from "./interviewRoundLimits";

const toSafeString = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const capitalize = (value) => {
  const safe = toSafeString(value);
  if (!safe) return "";
  return safe.charAt(0).toUpperCase() + safe.slice(1);
};

export const decodeBankFocusLabel = (focusId) => {
  const raw = toSafeString(focusId);
  if (!raw.startsWith("bank:")) return "";
  try {
    return decodeURIComponent(raw.slice(5)).trim();
  } catch {
    return raw.slice(5).trim();
  }
};

export function resolveInterviewFocusTopic(roundType, focusId) {
  const type = toSafeString(roundType);
  const focus = toSafeString(focusId);
  if (focus.startsWith("bank:")) {
    return decodeBankFocusLabel(focus) || "Selected topic";
  }
  const options = getFocusOptionsForRoundType(type);
  if (!focus) return options[0]?.label || type || "General";
  const match = options.find((opt) => opt.id === focus);
  if (match?.label) return match.label;
  return focus === "general" ? options[0]?.label || "General" : focus;
}

/**
 * Planned mix + brief for every mock round type.
 * Counts stay aligned with backend `inferQuestionCount`.
 */
const ROUND_STRUCTURE_BY_TYPE = {
  DSA: {
    mix: "2 coding problems",
    brief:
      "Write and run working solutions. You will see visible test cases, then hidden cases after you submit.",
  },
  SQL: {
    mix: "4 SQL questions",
    brief:
      "Write or reason about queries: joins, filters, aggregations, and practical schema trade-offs.",
  },
  "System Design": {
    mix: "3 design questions",
    brief:
      "Walk through architecture, trade-offs, scale, and failure handling for a fresher-level system.",
  },
  HR: {
    mix: "1 behavioral question",
    brief:
      "Answer in STAR form (situation, action, result) about teamwork, conflict, ownership, or motivation.",
  },
  "CS Fundamentals": {
    mix: "2 MCQs + 1 theory question",
    brief:
      "Two short multiple-choice checks, then one written explanation of a core CS concept.",
  },
  "Web Dev": {
    mix: "2 MCQs + 1 theory question",
    brief:
      "Two multiple-choice web questions, then one written answer on frontend, HTTP, or backend web basics.",
  },
  Aptitude: {
    mix: "3 MCQs",
    brief:
      "Self-contained quantitative, logical, or data-interpretation questions. No coding.",
  },
  "Core Technical": {
    mix: "3 written technical questions",
    brief:
      "Explain engineering fundamentals, assumptions, units, and practical constraints for the role.",
  },
  "Circuit Design": {
    mix: "3 circuit questions",
    brief:
      "Analyze analog/digital circuits, timing, CMOS, or trade-offs. Mix of MCQ and written answers.",
  },
  "Low-Level Design": {
    mix: "3 design questions",
    brief:
      "Sketch objects, interfaces, and extensibility for a small machine-coding / OOP design problem.",
  },
  "ML/AI Technical": {
    mix: "3 conceptual questions",
    brief:
      "Discuss models, metrics, data prep, overfitting, and how you would evaluate a solution.",
  },
  "Embedded Systems": {
    mix: "3 technical questions",
    brief:
      "Cover C, microcontrollers, interrupts, memory, peripherals, or hardware-software debugging.",
  },
  "Case Interview": {
    mix: "3 case questions",
    brief:
      "Structure a business case or guesstimate: clarify, assume, analyze, and recommend.",
  },
  "Project/Resume Deep Dive": {
    mix: "3 deep-dive questions",
    brief:
      "Talk through a project you actually did: your role, decisions, trade-offs, and outcomes.",
  },
};

const DEFAULT_STRUCTURE = {
  mix: "3 questions",
  brief: "Answer role-relevant interview questions for this round type.",
};

export function getRoundStructurePreview(roundType) {
  const type = toSafeString(roundType);
  const structure = ROUND_STRUCTURE_BY_TYPE[type] || {
    ...DEFAULT_STRUCTURE,
    mix: `${inferInterviewQuestionCount(type)} questions`,
  };
  return {
    type,
    questionCount: inferInterviewQuestionCount(type),
    mix: structure.mix,
    brief: structure.brief,
  };
}

export function buildInterviewPlanPreview(
  rounds,
  { role = "", difficulty = "", companyName = "" } = {}
) {
  const items = (Array.isArray(rounds) ? rounds : [])
    .map((round, index) => {
      const type = toSafeString(round?.type);
      if (!type) return null;
      const structure = getRoundStructurePreview(type);
      return {
        roundNumber: index + 1,
        type,
        topic: resolveInterviewFocusTopic(type, round?.focus),
        difficulty: capitalize(round?.difficulty || difficulty) || "Medium",
        mix: structure.mix,
        brief: structure.brief,
        questionCount: structure.questionCount,
      };
    })
    .filter(Boolean);

  return {
    companyName: toSafeString(companyName),
    role: toSafeString(role),
    difficulty: capitalize(difficulty),
    totalRounds: items.length,
    totalQuestions: items.reduce((sum, item) => sum + item.questionCount, 0),
    rounds: items,
  };
}

export default buildInterviewPlanPreview;
