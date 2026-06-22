export const RECRUITMENT_ROUND_TYPES = [
  "technical",
  "aptitude",
  "resume_based",
  "projects",
  "other",
];

export const RECRUITMENT_ROUND_TYPE_LABELS = {
  technical: "Technical",
  aptitude: "Aptitude",
  resume_based: "Resume Based",
  projects: "Projects",
  other: "Other",
};

export const RECRUITMENT_ROUND_TYPE_OPTIONS = RECRUITMENT_ROUND_TYPES.map((value) => ({
  value,
  label: RECRUITMENT_ROUND_TYPE_LABELS[value],
}));

export const OA_ASSESSMENT_MODES = ["online", "offline"];

export const OA_ASSESSMENT_MODE_LABELS = {
  online: "Online",
  offline: "Offline",
};

export const OA_ASSESSMENT_MODE_OPTIONS = OA_ASSESSMENT_MODES.map((value) => ({
  value,
  label: OA_ASSESSMENT_MODE_LABELS[value],
}));

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isRecruitmentProcessEmpty(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return true;
  const oa = value.onlineAssessment;
  const rounds = value.rounds;
  const oaOccurred = oa && typeof oa === "object" && oa.occurred === true;
  const hasRound =
    Array.isArray(rounds) &&
    rounds.some((r) => r && typeof r === "object" && r.occurred === true);
  return !oaOccurred && !hasRound;
}

/**
 * @param {unknown} value
 * @returns {{ onlineAssessment: object, rounds: object[] }|null}
 */
export function normalizeRecruitmentProcess(value) {
  if (isRecruitmentProcessEmpty(value)) return null;
  const oa = value.onlineAssessment && typeof value.onlineAssessment === "object"
    ? value.onlineAssessment
    : { occurred: false };
  const rounds = Array.isArray(value.rounds) ? value.rounds : [];
  return {
    onlineAssessment: oa,
    rounds: rounds.filter((r) => r && typeof r === "object"),
  };
}

export function getRecruitmentProcessSubmitter(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const sb = value.submittedBy;
  if (!sb || typeof sb !== "object" || Array.isArray(sb)) return null;
  const name = sb.name != null ? String(sb.name).trim() : "";
  const email = sb.email != null ? String(sb.email).trim() : "";
  const usn = sb.usn != null ? String(sb.usn).trim() : "";
  if (!name && !email && !usn) return null;
  return { name, email, usn };
}

/** @returns {{ onlineAssessment: object, rounds: object[] }} */
export function emptyRecruitmentProcessForm() {
  return {
    onlineAssessment: {
      occurred: false,
      mode: "online",
      topics: "",
      attended: "",
      cleared: "",
    },
    rounds: [
      {
        roundNumber: 1,
        occurred: false,
        type: "technical",
        mode: "online",
        otherTypeLabel: "",
        attended: "",
        cleared: "",
      },
    ],
  };
}

/**
 * @param {unknown} stored
 * @returns {{ onlineAssessment: object, rounds: object[] }}
 */
export function recruitmentProcessToForm(stored) {
  const normalized = normalizeRecruitmentProcess(stored);
  if (!normalized) return emptyRecruitmentProcessForm();

  const oa = normalized.onlineAssessment;
  return {
    onlineAssessment: {
      occurred: oa.occurred === true,
      mode: OA_ASSESSMENT_MODES.includes(oa.mode) ? oa.mode : "online",
      topics: oa.topics != null ? String(oa.topics) : "",
      attended: oa.attended != null ? String(oa.attended) : "",
      cleared: oa.cleared != null ? String(oa.cleared) : "",
    },
    rounds:
      normalized.rounds.length > 0
        ? normalized.rounds.map((r, i) => ({
            roundNumber: r.roundNumber ?? i + 1,
            occurred: r.occurred === true,
            type: RECRUITMENT_ROUND_TYPES.includes(r.type) ? r.type : "technical",
            mode: OA_ASSESSMENT_MODES.includes(r.mode) ? r.mode : "online",
            otherTypeLabel: r.otherTypeLabel != null ? String(r.otherTypeLabel) : "",
            attended: r.attended != null ? String(r.attended) : "",
            cleared: r.cleared != null ? String(r.cleared) : "",
          }))
        : emptyRecruitmentProcessForm().rounds,
  };
}

/**
 * @param {{ onlineAssessment: object, rounds: object[] }} form
 * @returns {{ ok: true, payload: object } | { ok: false, error: string }}
 */
export function validateRecruitmentProcessForm(form) {
  const oaOccurred = form.onlineAssessment?.occurred === true;
  const payload = {
    onlineAssessment: { occurred: oaOccurred },
    rounds: [],
  };

  if (oaOccurred) {
    const mode = String(form.onlineAssessment?.mode ?? "").trim().toLowerCase();
    if (!OA_ASSESSMENT_MODES.includes(mode)) {
      return { ok: false, error: "Select online or offline mode for the assessment." };
    }
    const topics = String(form.onlineAssessment?.topics ?? "").trim();
    if (!topics) return { ok: false, error: "Enter OA topics when online assessment occurred." };
    const attended = parseInt(String(form.onlineAssessment?.attended ?? "").trim(), 10);
    const cleared = parseInt(String(form.onlineAssessment?.cleared ?? "").trim(), 10);
    if (!Number.isFinite(attended) || attended < 0) {
      return { ok: false, error: "Enter a valid OA attended count (0 or more)." };
    }
    if (!Number.isFinite(cleared) || cleared < 0) {
      return { ok: false, error: "Enter a valid OA cleared count (0 or more)." };
    }
    if (cleared > attended) {
      return { ok: false, error: "OA cleared count cannot exceed attended count." };
    }
    payload.onlineAssessment.topics = topics;
    payload.onlineAssessment.mode = mode;
    payload.onlineAssessment.attended = attended;
    payload.onlineAssessment.cleared = cleared;
  }

  let anyRound = false;
  const rounds = Array.isArray(form.rounds) ? form.rounds : [];
  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    const roundNumber = i + 1;
    const occurred = r?.occurred === true;
    /** @type {Record<string, unknown>} */
    const round = { roundNumber, occurred };
    if (occurred) {
      anyRound = true;
      const type = String(r?.type ?? "").trim();
      if (!RECRUITMENT_ROUND_TYPES.includes(type)) {
        return { ok: false, error: `Round ${roundNumber}: select a round type.` };
      }
      round.type = type;
      if (type === "other") {
        const label = String(r?.otherTypeLabel ?? "").trim();
        if (!label) {
          return { ok: false, error: `Round ${roundNumber}: describe the round type.` };
        }
        round.otherTypeLabel = label;
      }
      const mode = String(r?.mode ?? "").trim().toLowerCase();
      if (!OA_ASSESSMENT_MODES.includes(mode)) {
        return { ok: false, error: `Round ${roundNumber}: select online or offline mode.` };
      }
      round.mode = mode;
      const attended = parseInt(String(r?.attended ?? "").trim(), 10);
      const cleared = parseInt(String(r?.cleared ?? "").trim(), 10);
      if (!Number.isFinite(attended) || attended < 0) {
        return { ok: false, error: `Round ${roundNumber}: enter a valid attended count.` };
      }
      if (!Number.isFinite(cleared) || cleared < 0) {
        return { ok: false, error: `Round ${roundNumber}: enter a valid cleared count.` };
      }
      if (cleared > attended) {
        return {
          ok: false,
          error: `Round ${roundNumber}: cleared count cannot exceed attended count.`,
        };
      }
      round.attended = attended;
      round.cleared = cleared;
    }
    payload.rounds.push(round);
  }

  if (!oaOccurred && !anyRound) {
    return {
      ok: false,
      error: "Mark online assessment or at least one interview round as occurred.",
    };
  }

  return { ok: true, payload };
}

/**
 * @param {unknown} type
 * @param {unknown} otherLabel
 */
export function recruitmentRoundTypeLabel(type, otherLabel) {
  if (type === "other") {
    const label = String(otherLabel ?? "").trim();
    return label || RECRUITMENT_ROUND_TYPE_LABELS.other;
  }
  return RECRUITMENT_ROUND_TYPE_LABELS[type] || String(type || "Round");
}

/**
 * @param {unknown} mode
 */
export function oaAssessmentModeLabel(mode) {
  const key = String(mode ?? "").trim().toLowerCase();
  return OA_ASSESSMENT_MODE_LABELS[key] || "";
}
