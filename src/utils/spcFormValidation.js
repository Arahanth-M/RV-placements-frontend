/** Shown under CTC / Base / Stipend when value is not yet known. */
export const SPC_COMPENSATION_TBD_HINT = "If not known, enter TBD.";

export const SPC_COMPANY_LIST_ONLY_MESSAGE =
  "This company is not in the list yet. Please wait for it to be added, then select it from the suggestions.";

/** @param {string} companyQuery @param {{ id?: string, name?: string } | null} selectedCompany */
export function isCompanyLinkedFromSuggestions(companyQuery, selectedCompany) {
  if (!selectedCompany?.id) return false;
  return (
    String(companyQuery || "").trim() === String(selectedCompany.name || "").trim()
  );
}

/**
 * Inline hint under the company search field.
 * @param {string} companyQuery
 * @param {{ id?: string, name?: string } | null} selectedCompany
 * @param {{ suggestLoading?: boolean, suggestions?: { id: string, name: string }[] }} opts
 */
export function getSpcCompanyListHint(companyQuery, selectedCompany, opts = {}) {
  const q = String(companyQuery || "").trim();
  const { suggestLoading = false, suggestions = [] } = opts;

  if (isCompanyLinkedFromSuggestions(companyQuery, selectedCompany)) {
    return { type: "linked", message: "Company selected from the list." };
  }
  if (q.length < 2) {
    return {
      type: "idle",
      message: "Type at least 2 characters and choose a company from the list only.",
    };
  }
  if (suggestLoading) {
    return { type: "loading", message: "Searching…" };
  }
  if (suggestions.length > 0) {
    return {
      type: "pick",
      message: "Select a company from the list — only listed companies can be submitted.",
    };
  }
  return { type: "missing", message: SPC_COMPANY_LIST_ONLY_MESSAGE };
}

/** Which compensation inputs apply for the selected type of offer (placement form). */
export function compensationVisibilityForTypeOfOffer(typeOfOffer) {
  const t = String(typeOfOffer || "").trim();
  if (t === "FTE") return { stipend: false, fte: true };
  if (t === "Internship(PPO)" || t === "Only internship(6 months)") {
    return { stipend: true, fte: false };
  }
  if (t === "Internship+FTE" || t === "Internship + FTE (PBC)") {
    return { stipend: true, fte: true };
  }
  return { stipend: true, fte: true };
}

/**
 * @param {Record<string, unknown>} form
 * @param {{ id?: string } | null} selectedCompany
 * @returns {string[]} error messages
 */
export function validateSpcPlacementSubmit(form, selectedCompany) {
  const errors = [];
  if (!String(form.email || "").trim()) errors.push("Email is required.");
  if (!String(form.name || "").trim()) errors.push("Name is required.");
  if (!String(form.usn || "").trim()) errors.push("USN is required.");
  if (!isCompanyLinkedFromSuggestions(form.companyQuery, selectedCompany)) {
    const q = String(form.companyQuery || "").trim();
    errors.push(
      q.length >= 2 ? SPC_COMPANY_LIST_ONLY_MESSAGE : "Select a company from the suggestions list."
    );
  }
  if (!String(form.typeOfOffer || "").trim()) errors.push("Type of offer is required.");
  if (!form.placementYear) errors.push("Placement year is required.");
  if (!String(form.branchCode || "").trim()) errors.push("Branch is required.");
  if (!String(form.role || "").trim()) errors.push("Role is required.");

  const comp = compensationVisibilityForTypeOfOffer(form.typeOfOffer);
  if (comp.stipend && !String(form.stipend || "").trim()) {
    errors.push(`Stipend is required. ${SPC_COMPENSATION_TBD_HINT}`);
  }
  if (comp.fte && !String(form.ctc || "").trim()) {
    errors.push(`CTC is required. ${SPC_COMPENSATION_TBD_HINT}`);
  }
  if (comp.fte && !String(form.base || "").trim()) {
    errors.push(`Base is required. ${SPC_COMPENSATION_TBD_HINT}`);
  }

  return errors;
}

/**
 * @param {Record<string, unknown>} form
 * @param {{ id?: string } | null} selectedCompany
 * @returns {string[]} error messages
 */
export function validateSpcConversionSubmit(form, selectedCompany) {
  const errors = [];
  if (!String(form.email || "").trim()) errors.push("Email is required.");
  if (!String(form.name || "").trim()) errors.push("Name is required.");
  if (!String(form.usn || "").trim()) errors.push("USN is required.");
  if (!isCompanyLinkedFromSuggestions(form.companyQuery, selectedCompany)) {
    const q = String(form.companyQuery || "").trim();
    errors.push(
      q.length >= 2 ? SPC_COMPANY_LIST_ONLY_MESSAGE : "Select a company from the suggestions list."
    );
  }
  if (!form.placementYear) errors.push("Placement year is required.");
  if (!String(form.branchCode || "").trim()) errors.push("Branch is required.");
  if (!String(form.conversionType || "").trim()) errors.push("Conversion type is required.");
  if (!String(form.role || "").trim()) errors.push("Role is required.");
  if (!String(form.ctc || "").trim()) errors.push(`CTC is required. ${SPC_COMPENSATION_TBD_HINT}`);
  if (!String(form.base || "").trim()) errors.push(`Base is required. ${SPC_COMPENSATION_TBD_HINT}`);
  if (
    form.conversionType === "fte_internship" &&
    !String(form.stipend || "").trim()
  ) {
    errors.push(`Stipend is required. ${SPC_COMPENSATION_TBD_HINT}`);
  }
  return errors;
}

/**
 * SPC dashboard — edit placement record (view submissions modal).
 * @param {Record<string, unknown>} form
 * @param {{ id?: string, name?: string } | null} selectedCompany
 * @returns {string[]} error messages
 */
export function validateSpcEditPlacement(form, selectedCompany) {
  const errors = [];
  if (!String(form.studentName || "").trim()) errors.push("Student name is required.");
  if (!String(form.studentEmail || "").trim()) errors.push("Student email is required.");
  if (!String(form.studentUsn || "").trim()) errors.push("Student USN is required.");
  if (!isCompanyLinkedFromSuggestions(form.companyPlaced, selectedCompany)) {
    const q = String(form.companyPlaced || "").trim();
    errors.push(
      q.length >= 2 ? SPC_COMPANY_LIST_ONLY_MESSAGE : "Select a company from the suggestions list."
    );
  }
  if (!String(form.typeOfOffer || "").trim()) errors.push("Type of offer is required.");
  if (!form.placementYear) errors.push("Placement year is required.");
  if (!String(form.branchCode || "").trim()) errors.push("Branch is required.");
  if (!String(form.role || "").trim()) errors.push("Role is required.");

  const comp = compensationVisibilityForTypeOfOffer(form.typeOfOffer);
  if (comp.stipend && !String(form.stipend || "").trim()) {
    errors.push(`Stipend is required. ${SPC_COMPENSATION_TBD_HINT}`);
  }
  if (comp.fte && !String(form.ctc || "").trim()) {
    errors.push(`CTC is required. ${SPC_COMPENSATION_TBD_HINT}`);
  }
  if (comp.fte && !String(form.base || "").trim()) {
    errors.push(`Base is required. ${SPC_COMPENSATION_TBD_HINT}`);
  }

  const convType = String(form.ppoConversionType || "").trim();
  if (convType === "Internship+FTE" && !String(form.sixMonthsInternshipStipend || "").trim()) {
    errors.push(`6-month internship stipend is required. ${SPC_COMPENSATION_TBD_HINT}`);
  }

  return errors;
}
