/**
 * Extra fields for company-detail student submissions.
 * `/general` writes to company_platform_content; campus stays visit-scoped.
 */
export function submissionTargetFields({
  isGeneral = false,
  placementYear,
  placementListContext,
  placementCompanyVisitId,
} = {}) {
  if (isGeneral) {
    return { contentScope: "platform" };
  }
  return {
    ...(placementYear != null ? { placementYear } : {}),
    ...(placementListContext ? { placementListContext } : {}),
    ...(placementCompanyVisitId ? { companyVisitId: placementCompanyVisitId } : {}),
  };
}
