import * as XLSX from "xlsx";
import {
  customSearchExportFileName,
  customSearchStudentToExportRow,
} from "./studentPlacementCustomSearch.js";

/**
 * @param {object[]} students
 * @param {unknown} year
 */
export function downloadPlacementSearchExcel(students, year) {
  const rows = (Array.isArray(students) ? students : []).map(customSearchStudentToExportRow);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : []);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = customSearchExportFileName(year);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
