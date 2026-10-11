import { describe, expect, it } from "vitest";
import {
  COMPANY_LIST_PAGE_PARAM,
  parseCompanyListPageParam,
  setCompanyListPageParam,
  setCompanyListSearchParam,
} from "../../utils/companyListUrlState.js";

describe("companyListUrlState", () => {
  it("parses page param safely", () => {
    expect(parseCompanyListPageParam("2")).toBe(2);
    expect(parseCompanyListPageParam("0")).toBe(1);
    expect(parseCompanyListPageParam(null)).toBe(1);
  });

  it("writes page and search into URLSearchParams", () => {
    const params = new URLSearchParams("category=product&page=3&q=go");
    setCompanyListPageParam(params, 1);
    setCompanyListSearchParam(params, "");
    expect(params.get(COMPANY_LIST_PAGE_PARAM)).toBeNull();
    expect(params.get("q")).toBeNull();
    setCompanyListPageParam(params, 4);
    setCompanyListSearchParam(params, "amazon");
    expect(params.get(COMPANY_LIST_PAGE_PARAM)).toBe("4");
    expect(params.get("q")).toBe("amazon");
  });
});
