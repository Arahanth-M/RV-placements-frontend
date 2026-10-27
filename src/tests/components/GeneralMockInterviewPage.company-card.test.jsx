import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GeneralMockInterviewPage from "../../components/GeneralMockInterviewPage.jsx";

const getCompany = vi.fn();
const getCompanyNames = vi.fn();

vi.mock("../../utils/api", () => ({
  companyAPI: {
    getCompany: (...args) => getCompany(...args),
    getCompanyNames: (...args) => getCompanyNames(...args),
  },
}));

vi.mock("../../utils/InterviewLockContext", () => ({
  useInterviewLock: () => ({ setIsInterviewLocked: vi.fn() }),
}));

vi.mock("../../context/TenantShellContext.jsx", () => ({
  useTenantShell: () => ({
    base: "/general",
    isGeneral: true,
    appPath: (path) => `/general${path}`,
  }),
}));

vi.mock("../../components/CompanyTabs/AIInterviewTab", () => ({
  default: () => <h2>Interview configuration</h2>,
}));

vi.mock("../../components/AIInterviews", () => ({
  default: () => null,
}));

vi.mock("../../components/InterviewSlotsPage", () => ({
  default: () => null,
}));

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/interviews${search}`]}>
      <GeneralMockInterviewPage />
    </MemoryRouter>
  );
}

describe("GeneralMockInterviewPage company stats card", () => {
  beforeEach(() => {
    getCompany.mockReset();
    getCompanyNames.mockReset();
    getCompanyNames.mockResolvedValue({ data: [{ _id: "co-1", name: "PhonePe" }] });
  });

  it("shows a company-card link and must-do topics between selection and interview setup", async () => {
    getCompany.mockResolvedValue({
      data: {
        _id: "co-1",
        name: "PhonePe",
        focusTags: ["DSA"],
        Must_Do_Topics: ["Dynamic Programming", "SQL"],
      },
    });

    renderPage("?companyId=co-1");

    expect(await screen.findByRole("heading", { name: "Company stats" })).toBeInTheDocument();
    const cardLink = screen.getByTestId("mock-company-card-link");
    expect(cardLink).toHaveTextContent("Open PhonePe card");
    expect(cardLink).toHaveAttribute("href", "/general/companystats?card=co-1");
    expect(screen.getByText("Dynamic Programming")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText(/Before you configure the interview/)).toBeInTheDocument();
    expect(screen.queryByTestId("company-card")).not.toBeInTheDocument();

    const stats = screen.getByTestId("mock-company-stats");
    const setup = screen.getByRole("heading", { name: "Interview configuration" });
    expect(stats.compareDocumentPosition(setup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getCompany).toHaveBeenCalledWith("co-1", { scope: "platform" });
  });

  it("hides the stats section until a company is selected", async () => {
    renderPage();
    await waitFor(() => expect(getCompanyNames).toHaveBeenCalled());
    expect(screen.queryByTestId("mock-company-stats")).not.toBeInTheDocument();
    expect(getCompany).not.toHaveBeenCalled();
  });

  it("shows a locked message without must-do topics when the company is premium", async () => {
    getCompany.mockRejectedValue({
      response: {
        status: 402,
        data: { company: { _id: "co-1", name: "PhonePe" } },
      },
    });

    renderPage("?companyId=co-1");

    expect(await screen.findByTestId("mock-company-card-link")).toHaveAttribute(
      "href",
      "/general/companystats?card=co-1"
    );
    expect(screen.getByText(/This company card is locked/)).toBeInTheDocument();
    expect(screen.queryByText("What they expect")).not.toBeInTheDocument();
  });
});
