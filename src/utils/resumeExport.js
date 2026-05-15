import { resumeAPI } from "./api";
import { createBlankResumeDraft, RESUME_TEMPLATE_IDS } from "../components/resume/defaultDraft";

async function loadHtml2Canvas() {
  const mod = await import("html2canvas");
  return mod.default ?? mod;
}

async function loadJsPDF() {
  const mod = await import("jspdf");
  const JsPDF = mod.jsPDF ?? mod.default;
  if (typeof JsPDF !== "function") {
    throw new Error("PDF library failed to load. Refresh the page and try again.");
  }
  return JsPDF;
}

const EXPORT_WIDTH_PX = 816;

function resolveExportTarget(previewElement) {
  if (!previewElement) return null;
  return (
    previewElement.querySelector("[data-resume-export-root]") ||
    previewElement.firstElementChild ||
    previewElement
  );
}

function injectExportSafeStyles(doc) {
  const style = doc.createElement("style");
  style.textContent = `
    [data-resume-export-root],
    [data-resume-export-root] * {
      color: #111827 !important;
      background-color: transparent !important;
      border-color: #d1d5db !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    [data-resume-export-root] {
      background-color: #ffffff !important;
      width: ${EXPORT_WIDTH_PX}px !important;
      max-width: ${EXPORT_WIDTH_PX}px !important;
      min-height: auto !important;
    }
  `;
  doc.head.appendChild(style);
}

async function capturePreviewCanvas(target) {
  const html2canvas = await loadHtml2Canvas();

  const sandbox = document.createElement("div");
  sandbox.setAttribute("aria-hidden", "true");
  sandbox.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${EXPORT_WIDTH_PX}px`,
    "background:#ffffff",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");
  const clone = target.cloneNode(true);
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    return await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: EXPORT_WIDTH_PX,
      windowWidth: EXPORT_WIDTH_PX,
      onclone: (doc) => {
        injectExportSafeStyles(doc);
        const clonedRoot = doc.querySelector("[data-resume-export-root]");
        if (clonedRoot) {
          clonedRoot.style.overflow = "visible";
          clonedRoot.style.minHeight = "auto";
        }
      },
    });
  } finally {
    document.body.removeChild(sandbox);
  }
}

function addCanvasToPdf(pdf, canvas, imageData) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
}

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

async function downloadPdfResponse(response) {
  const contentType = String(response.headers?.["content-type"] || "");
  if (!contentType.includes("application/pdf")) {
    const message = await parseBlobError(response);
    throw new Error(message || "Server did not return a PDF file.");
  }

  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: "application/pdf" });

  if (!blob.size) {
    throw new Error("Received an empty PDF file.");
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume.pdf";
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
    location: String(item.location ?? ""),
    startDate: String(item.startDate ?? ""),
    endDate: String(item.endDate ?? ""),
    bullets: pickBullets(item.bullets),
  };
}

function pickAchievement(item = {}) {
  return {
    title: String(item.title ?? ""),
    detail: String(item.detail ?? ""),
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
    achievements: (Array.isArray(draft.achievements) ? draft.achievements : []).map(
      pickAchievement
    ),
  };
}

/** @deprecated Use normalizeResumePayload */
export const prepareDraftForExport = normalizeResumePayload;

export async function exportResume({ payload, previewElement }) {
  const target = resolveExportTarget(previewElement);
  if (!target) {
    throw new Error("Preview is not ready. Wait for the live preview to load.");
  }

  const wrapper = previewElement;
  const prevOverflow = wrapper?.style?.overflow ?? "";
  if (wrapper) wrapper.style.overflow = "visible";

  try {
    const JsPDF = await loadJsPDF();
    const canvas = await capturePreviewCanvas(target);

    if (!canvas.width || !canvas.height) {
      throw new Error("Could not capture the resume preview.");
    }

    const imageData = canvas.toDataURL("image/png");
    if (!imageData || imageData === "data:,") {
      throw new Error("Could not render the resume preview.");
    }

    const pdf = new JsPDF({ orientation: "p", unit: "pt", format: "a4" });
    addCanvasToPdf(pdf, canvas, imageData);
    pdf.save("resume.pdf");
    return { mode: "client" };
  } catch (clientError) {
    console.warn("[resume export] client PDF failed, trying server fallback", clientError);
    try {
      const response = await resumeAPI.exportPdf(payload);
      await downloadPdfResponse(response);
      return { mode: "server", clientError };
    } catch (serverError) {
      const data = serverError?.response?.data;
      let serverMessage = null;
      if (data instanceof Blob) {
        serverMessage = await parseBlobError(serverError?.response);
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          serverMessage = data.errors.join(" ");
        } else {
          serverMessage = data.error || data.message || null;
        }
      }
      throw new Error(
        serverMessage || clientError?.message || "Export failed. Please try again."
      );
    }
  } finally {
    if (wrapper) wrapper.style.overflow = prevOverflow;
  }
}
