import { resumeAPI } from "./api";
import { createBlankResumeDraft, RESUME_TEMPLATE_IDS } from "../components/resume/defaultDraft";

async function parseBlobError(response) {
  const data = response?.data;
  if (!data || typeof data.text !== "function") return null;
  try {
    const text = await data.text();
    const json = JSON.parse(text);
    if (Array.isArray(json.errors) && json.errors.length > 0) {
      return json.errors.join(" ");
    }
    return json.error || json.message || null;
  } catch {
    return null;
  }
}

async function downloadDocxResponse(response) {
  const contentType = String(response.headers?.["content-type"] || "");
  if (!contentType.includes("wordprocessingml")) {
    const message = await parseBlobError(response);
    throw new Error(message || "Server did not return a Word document.");
  }

  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

  if (!blob.size) {
    throw new Error("Received an empty Word document.");
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume.docx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function pickBullets(bullets = []) {
  return (Array.isArray(bullets) ? bullets : [])
    .map((b) => ({ text: String(b?.text ?? "").trim() }))
    .filter((b) => b.text.length > 0);
}

function pickEducation(item = {}) {
  return {
    institution: String(item.institution ?? ""),
    degree: String(item.degree ?? ""),
    field: String(item.field ?? ""),
    startDate: String(item.startDate ?? ""),
    endDate: String(item.endDate ?? ""),
    score: String(item.score ?? ""),
    location: String(item.location ?? ""),
  };
}

function pickProject(item = {}) {
  return {
    name: String(item.name ?? ""),
    techStack: String(item.techStack ?? ""),
    link: String(item.link ?? ""),
    startDate: String(item.startDate ?? ""),
    endDate: String(item.endDate ?? ""),
    bullets: pickBullets(item.bullets),
  };
}

function pickExperience(item = {}) {
  return {
    company: String(item.company ?? ""),
    role: String(item.role ?? ""),
    techStack: String(item.techStack ?? ""),
    location: String(item.location ?? ""),
    startDate: String(item.startDate ?? ""),
    endDate: String(item.endDate ?? ""),
    bullets: pickBullets(item.bullets),
  };
}

function pickTitledDetail(item = {}) {
  return {
    title: String(item.title ?? ""),
    detail: String(item.detail ?? ""),
  };
}

function pickCertification(item = {}) {
  const link = String(item.link ?? "").trim();
  const legacyDetail = String(item.detail ?? "").trim();
  const legacyLink =
    legacyDetail && (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(legacyDetail) || legacyDetail.includes("."))
      ? legacyDetail
      : "";
  return {
    title: String(item.title ?? ""),
    link: link || legacyLink,
  };
}

/** API-safe payload only (no version/updatedAt/etc.). */
export function normalizeResumePayload(draft = {}) {
  const base = createBlankResumeDraft();
  const templateIds = Object.values(RESUME_TEMPLATE_IDS);
  const templateId = templateIds.includes(draft.templateId)
    ? draft.templateId
    : base.templateId;

  return {
    templateId,
    personal: {
      ...base.personal,
      ...(draft.personal || {}),
    },
    education: (Array.isArray(draft.education) ? draft.education : []).map(pickEducation),
    skills: (Array.isArray(draft.skills) ? draft.skills : [])
      .map((s) => String(s).trim())
      .filter(Boolean),
    projects: (Array.isArray(draft.projects) ? draft.projects : []).map(pickProject),
    experience: (Array.isArray(draft.experience) ? draft.experience : []).map(pickExperience),
    certifications: (Array.isArray(draft.certifications) ? draft.certifications : []).map(
      pickCertification
    ),
    achievements: (Array.isArray(draft.achievements) ? draft.achievements : []).map(pickTitledDetail),
  };
}

/** @deprecated Use normalizeResumePayload */
export const prepareDraftForExport = normalizeResumePayload;

export async function exportResumeAsDocx({ payload }) {
  try {
    const response = await resumeAPI.exportDocx(payload);
    await downloadDocxResponse(response);
    return { mode: "server" };
  } catch (error) {
    const data = error?.response?.data;
    let serverMessage = null;
    if (data instanceof Blob) {
      serverMessage = await parseBlobError(error?.response);
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        serverMessage = data.errors.join(" ");
      } else {
        serverMessage = data.error || data.message || null;
      }
    }
    throw new Error(
      serverMessage || error?.message || "Failed to export as Word document"
    );
  }
}
