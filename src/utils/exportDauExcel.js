import * as XLSX from "xlsx";

/**
 * Download full DAU history as .xlsx
 * @param {Array<Record<string, unknown>>} rows
 */
export function downloadDauExcel(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const sheetRows = list.map((r) => ({
    Date: r.date || "",
    "Day count": r.count ?? "",
    Username: r.username || "",
    Email: r.email || "",
    Role: r.role || "",
    "Last login (UTC)": r.lastLoginAt || "",
    Activity: r.activity || (Array.isArray(r.actions) ? r.actions.join(", ") : ""),
    "Time spent": r.activeLabel || "—",
    "User ID": r.userId || "",
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(
    sheetRows.length > 0 ? sheetRows : [{ Date: "", Username: "", Email: "" }]
  );
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Active Users");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  link.download = `daily-active-users-${stamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
