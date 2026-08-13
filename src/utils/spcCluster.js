import { PLACEMENT_HUB_CLUSTER_LABELS } from "../constants/placementTiers.js";

const BRANCH_YEAR_TOKEN = /^([a-z]{2,4})(\d{2})$/i;
const USN_BRANCH = /^\d[A-Z]{2}\d{2}([A-Z]{2})\d+$/i;

const EMAIL_BRANCH_TO_HUB = {
  cd: "cs",
  cy: "cs",
  cs: "cs",
  is: "cs",
  ai: "cs",
  ise: "cs",
  cse: "cs",
  aiml: "cs",
  ec: "ec",
  et: "ec",
  ei: "ec",
  ee: "ec",
  ece: "ec",
  ete: "ec",
  eie: "ec",
  eee: "ec",
  as: "me",
  im: "me",
  me: "me",
  ase: "me",
  iem: "me",
  bt: "chem",
  ch: "chem",
  cv: "chem",
  civil: "chem",
};

function hubFromBranchToken(raw) {
  const bc = String(raw ?? "")
    .trim()
    .toLowerCase();
  return EMAIL_BRANCH_TO_HUB[bc] || null;
}

export function inferSpcClusterFromEmail(email) {
  const local = String(email || "")
    .trim()
    .toLowerCase()
    .split("@")[0];
  if (!local) return null;
  for (const part of local.split(".").filter(Boolean)) {
    const m = part.match(BRANCH_YEAR_TOKEN);
    if (!m) continue;
    const hub = hubFromBranchToken(m[1]);
    if (hub) return hub;
  }
  return null;
}

export function inferSpcClusterFromUsn(usn) {
  const u = String(usn || "").trim().toUpperCase();
  const m = u.match(USN_BRANCH);
  if (!m) return null;
  return hubFromBranchToken(m[1]);
}

export function inferSpcClusterFromEmailAndUsn(email, usn) {
  return inferSpcClusterFromEmail(email) || inferSpcClusterFromUsn(usn);
}

export function spcClusterLabel(cluster) {
  const key = String(cluster ?? "")
    .trim()
    .toLowerCase();
  return PLACEMENT_HUB_CLUSTER_LABELS[key] || "";
}
