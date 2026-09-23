import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CompanyCard from "../../components/CompanyCard.jsx";
import { TenantShellProvider } from "../../context/TenantShellContext.jsx";
import { GENERAL_BASE, TENANT_BASE } from "../../constants/tenant.js";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock("../../utils/AuthContext", () => ({
  useAuth: () => ({ user: null, isAdmin: false }),
}));

vi.mock("../../utils/api", () => ({
  companyAPI: {
    getHelpfulStatus: vi.fn(),
    prefetchCompany: vi.fn(),
  },
}));

vi.mock("../../components/CompanyLogo.jsx", () => ({
  default: () => <div data-testid="company-logo-mock" />,
}));

const baseCompany = {
  _id: "507f1f77bcf86cd799439011",
  name: "Google",
  type: "FTE",
  business_model: "B2C",
  focusTags: ["DSA"],
  helpfulCount: 0,
  platformPrepCoverage: { oa: 12, interview: 5, experiences: 3 },
};

function renderCard(base, company = baseCompany) {
  return render(
    <MemoryRouter>
      <TenantShellProvider base={base}>
        <CompanyCard company={company} hidePlacementGotInCounts />
      </TenantShellProvider>
    </MemoryRouter>
  );
}

describe("CompanyCard /general prep coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows per-company OA, interview, and experience counts", () => {
    renderCard(GENERAL_BASE);
    expect(screen.getByTestId("company-prep-coverage")).toHaveTextContent(
      /12 OA\s*·\s*5 interview q's\s*·\s*3 interview exprs/
    );
    expect(screen.getByTestId("company-prep-coverage")).toHaveClass("whitespace-nowrap");
    expect(screen.queryByText("Company prep")).not.toBeInTheDocument();
    expect(screen.queryByText("FTE")).not.toBeInTheDocument();
  });

  it("keeps campus visit type on tenant cards", () => {
    renderCard(TENANT_BASE);
    expect(screen.getByText("FTE")).toBeInTheDocument();
    expect(screen.queryByTestId("company-prep-coverage")).not.toBeInTheDocument();
  });
});
