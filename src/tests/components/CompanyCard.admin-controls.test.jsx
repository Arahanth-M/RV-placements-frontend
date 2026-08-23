import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CompanyCard from "../../components/CompanyCard.jsx";

const mockNavigate = vi.fn();
const mockPrefetchCompany = vi.fn();
const mockGetHelpfulStatus = vi.fn();
const mockAdjustCompanyTotalGotIn = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../utils/AuthContext", () => ({
  useAuth: () => ({
    user: { userId: "admin-user", email: "admin@example.com" },
    isAdmin: true,
  }),
}));

vi.mock("../../utils/api", () => ({
  companyAPI: {
    getHelpfulStatus: (...args) => mockGetHelpfulStatus(...args),
    prefetchCompany: (...args) => mockPrefetchCompany(...args),
  },
  adminAPI: {
    adjustCompanyTotalGotIn: (...args) => mockAdjustCompanyTotalGotIn(...args),
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
  date_of_visit: "2026-08-10",
  focusTags: ["DSA"],
  helpfulCount: 0,
  totalGotIn: 3,
};

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <CompanyCard company={baseCompany} {...props} />
    </MemoryRouter>
  );
}

describe("CompanyCard admin got in controls", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPrefetchCompany.mockReset();
    mockGetHelpfulStatus.mockReset();
    mockAdjustCompanyTotalGotIn.mockReset();
    mockGetHelpfulStatus.mockResolvedValue({
      data: { hasUpvoted: false, helpfulCount: 0 },
    });
  });

  it("shows increment and decrement controls only for admins", async () => {
    const { rerender } = render(
      <MemoryRouter>
        <CompanyCard company={baseCompany} isAdmin />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("button", { name: /increase got in count/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /decrease got in count/i })
    ).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CompanyCard company={baseCompany} isAdmin={false} />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("button", { name: /increase got in count/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /decrease got in count/i })
    ).not.toBeInTheDocument();
  });

  it("shows visit click count as views only for admins", async () => {
    render(
      <MemoryRouter>
        <CompanyCard company={{ ...baseCompany, views: 1240 }} isAdmin />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText("1240 views")).toBeInTheDocument();
    expect(screen.getByText("Views")).toBeInTheDocument();
  });

  it("hides views from students and SPCs", () => {
    render(
      <MemoryRouter>
        <CompanyCard company={{ ...baseCompany, views: 1240 }} isAdmin={false} />
      </MemoryRouter>
    );

    expect(screen.queryByText("Views")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("1240 views")).not.toBeInTheDocument();
  });

  it("updates the got in count from the admin controls", async () => {
    const onStatsUpdated = vi.fn();
    mockAdjustCompanyTotalGotIn.mockResolvedValue({
      data: {
        totalGotIn: 4,
        totalGotInByYear: { 2026: 4, 2027: 0, 2028: 0 },
      },
    });

    renderCard({ isAdmin: true, onStatsUpdated });

    fireEvent.click(
      await screen.findByRole("button", { name: /increase got in count/i })
    );

    await waitFor(() => {
      expect(mockAdjustCompanyTotalGotIn).toHaveBeenCalledWith(
        baseCompany._id,
        1,
        { year: 2026 }
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/2026:\s*4/)).toBeInTheDocument();
    });

    expect(onStatsUpdated).toHaveBeenCalledWith(baseCompany._id, {
      totalGotIn: 4,
      totalGotInByYear: { 2026: 4, 2027: 0, 2028: 0 },
    });
  });

  it("sends year 2027 when adjusting got in on a 2027-scoped card", async () => {
    mockAdjustCompanyTotalGotIn.mockResolvedValue({
      data: {
        totalGotIn: 2,
        totalGotInByYear: { 2026: 0, 2027: 2, 2028: 0 },
      },
    });

    renderCard({
      isAdmin: true,
      detailDefaultYear: 2027,
      company: {
        ...baseCompany,
        totalGotInByYear: { 2026: 0, 2027: 1 },
        totalGotIn: 1,
      },
    });

    fireEvent.click(
      await screen.findByRole("button", { name: /increase got in count/i })
    );

    await waitFor(() => {
      expect(mockAdjustCompanyTotalGotIn).toHaveBeenCalledWith(
        baseCompany._id,
        1,
        { year: 2027 }
      );
    });
  });

  it("maps legacy totalGotIn to placement year 2027", async () => {
    renderCard({
      isAdmin: true,
      placementYear: 2027,
      company: {
        ...baseCompany,
        totalGotIn: 5,
        totalGotInByYear: undefined,
      },
    });

    expect(await screen.findByText(/2027:\s*5/)).toBeInTheDocument();
    expect(screen.getByText(/2026:\s*0/)).toBeInTheDocument();
    expect(screen.getByText(/2028:\s*0/)).toBeInTheDocument();
  });
});
