import { beforeEach, describe, expect, it, vi } from "vitest";
import { companyAPI } from "../../utils/api";
import {
  requestCompanyLogo,
  resetCompanyLogoBatchState,
} from "../../utils/companyLogoBatch";

vi.mock("../../utils/api", () => ({
  companyAPI: {
    getLogoBatch: vi.fn(),
  },
}));

describe("companyLogoBatch", () => {
  beforeEach(() => {
    resetCompanyLogoBatchState();
    companyAPI.getLogoBatch.mockReset();
  });

  it("loads logos that mount together in one request", async () => {
    companyAPI.getLogoBatch.mockResolvedValue({
      data: {
        logos: {
          "amazon.com": "data:image/jpeg;base64,aaa",
          "adobe.com": "data:image/jpeg;base64,bbb",
        },
      },
    });

    const amazon = requestCompanyLogo({
      cacheKey: "amazon.com|72",
      domain: "amazon.com",
      size: 72,
    });
    const adobe = requestCompanyLogo({
      cacheKey: "adobe.com|72",
      domain: "adobe.com",
      size: 72,
    });

    await expect(Promise.all([amazon, adobe])).resolves.toEqual([
      "data:image/jpeg;base64,aaa",
      "data:image/jpeg;base64,bbb",
    ]);
    expect(companyAPI.getLogoBatch).toHaveBeenCalledTimes(1);
    expect(companyAPI.getLogoBatch).toHaveBeenCalledWith(
      ["amazon.com", "adobe.com"],
      72
    );
  });

  it("falls back to a direct image load when a logo is missing from the batch", async () => {
    companyAPI.getLogoBatch.mockResolvedValue({ data: { logos: {} } });
    await expect(
      requestCompanyLogo({
        cacheKey: "missing.com|72",
        domain: "missing.com",
        size: 72,
      })
    ).resolves.toBeUndefined();
  });

  it("reuses a logo already fetched in this session", async () => {
    companyAPI.getLogoBatch.mockResolvedValue({
      data: { logos: { "amazon.com": "data:image/jpeg;base64,aaa" } },
    });
    await requestCompanyLogo({
      cacheKey: "amazon.com|72",
      domain: "amazon.com",
      size: 72,
    });
    companyAPI.getLogoBatch.mockClear();

    await expect(
      requestCompanyLogo({
        cacheKey: "amazon.com|72",
        domain: "amazon.com",
        size: 72,
      })
    ).resolves.toBe("data:image/jpeg;base64,aaa");
    expect(companyAPI.getLogoBatch).not.toHaveBeenCalled();
  });
});
