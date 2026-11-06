import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CompanyLogo from "../../components/CompanyLogo.jsx";
import {
  peekCompanyLogo,
  requestCompanyLogo,
  resetCompanyLogoBatchState,
} from "../../utils/companyLogoBatch";

vi.mock("../../utils/companyLogoBatch", () => ({
  peekCompanyLogo: vi.fn(),
  requestCompanyLogo: vi.fn(),
  resetCompanyLogoBatchState: vi.fn(),
}));

describe("CompanyLogo", () => {
  beforeEach(() => {
    resetCompanyLogoBatchState();
    peekCompanyLogo.mockReset();
    requestCompanyLogo.mockReset();
    peekCompanyLogo.mockReturnValue(null);
  });

  it("shows a shimmer placeholder instead of initials while the logo loads", async () => {
    let resolveLogo;
    requestCompanyLogo.mockReturnValue(
      new Promise((resolve) => {
        resolveLogo = resolve;
      })
    );

    render(<CompanyLogo company={{ name: "Arcesium", domain: "arcesium.com" }} />);

    expect(screen.getByRole("img", { name: /Loading Arcesium/i })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Arcesium" })).not.toBeInTheDocument();
    // Initials SVG must not appear as an image src while loading
    expect(document.querySelector("img")).toBeNull();

    resolveLogo("data:image/jpeg;base64,abc");
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Arcesium" })).toHaveAttribute(
        "src",
        "data:image/jpeg;base64,abc"
      );
    });
  });

  it("paints a cached logo immediately without a loading flash", () => {
    peekCompanyLogo.mockReturnValue("data:image/jpeg;base64,cached");

    render(<CompanyLogo company={{ name: "Arcesium", domain: "arcesium.com" }} />);

    expect(screen.getByRole("img", { name: "Arcesium" })).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,cached"
    );
    expect(requestCompanyLogo).not.toHaveBeenCalled();
  });

  it("supports eager loading for above-the-fold hub tiles", async () => {
    requestCompanyLogo.mockResolvedValue("data:image/jpeg;base64,abc");

    render(
      <CompanyLogo
        company={{ name: "Arcesium", domain: "arcesium.com" }}
        loading="eager"
      />
    );

    await waitFor(() => {
      const img = screen.getByRole("img", { name: "Arcesium" });
      expect(img).toHaveAttribute("loading", "eager");
      expect(img).toHaveAttribute("fetchPriority", "high");
    });
  });
});
