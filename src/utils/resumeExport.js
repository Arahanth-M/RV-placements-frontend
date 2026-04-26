import { resumeAPI } from "./api";

export async function exportResume({ payload, previewElement }) {
  try {
    if (!previewElement) {
      throw new Error("Preview element not available");
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(previewElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save("resume.pdf");
    return { mode: "client" };
  } catch (clientError) {
    const response = await resumeAPI.exportPdf(payload);
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { mode: "server", clientError };
  }
}
