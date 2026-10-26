import { beforeEach, describe, expect, it } from "vitest";
import {
  clearGeneralCompanyListCache,
  readGeneralCompanyList,
  writeGeneralCompanyList,
} from "../../utils/generalCompanyListCache";

describe("generalCompanyListCache", () => {
  beforeEach(() => {
    clearGeneralCompanyListCache();
  });

  it("returns the list after it has been stored", () => {
    expect(readGeneralCompanyList()).toBeNull();
    writeGeneralCompanyList([{ _id: "1", name: "Amazon" }]);
    expect(readGeneralCompanyList()).toEqual([{ _id: "1", name: "Amazon" }]);
  });

  it("restores the list from sessionStorage when memory is empty", () => {
    sessionStorage.setItem(
      "general_companies_v1",
      JSON.stringify({
        cachedAt: Date.now(),
        list: [{ _id: "2", name: "Adobe" }],
      })
    );
    expect(readGeneralCompanyList()).toEqual([{ _id: "2", name: "Adobe" }]);
  });
});
