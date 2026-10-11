export const COMPANY_LIST_PAGE_PARAM = "page";
export const COMPANY_LIST_SEARCH_PARAM = "q";

export function parseCompanyListPageParam(raw) {
  const n = parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** @param {URLSearchParams} params */
export function setCompanyListPageParam(params, page) {
  const safe = parseCompanyListPageParam(page);
  if (safe <= 1) params.delete(COMPANY_LIST_PAGE_PARAM);
  else params.set(COMPANY_LIST_PAGE_PARAM, String(safe));
}

/** @param {URLSearchParams} params */
export function setCompanyListSearchParam(params, query) {
  const q = String(query ?? "").trim();
  if (q) params.set(COMPANY_LIST_SEARCH_PARAM, q);
  else params.delete(COMPANY_LIST_SEARCH_PARAM);
}
