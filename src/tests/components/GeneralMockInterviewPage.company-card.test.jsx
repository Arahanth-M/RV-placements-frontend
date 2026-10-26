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

vi.mock("../../components/CompanyCard.jsx", () => ({
  default: ({ company, detailLocked }) => (
    <article data-testid="company-card">
      {company?.name}
      {detailLocked ? " locked" : ""}
    </article>
  ),
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

  it("shows the company card and must-do topics between selection and interview setup", async () => {
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
    expect(screen.getByTestId("company-card")).toHaveTextContent("PhonePe");
    expect(screen.getByText("Dynamic Programming")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText(/Before you configure the interview/)).toBeInTheDocument();

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

  it("shows a locked card without must-do topics when the company is premium", async () => {
    getCompany.mockRejectedValue({
      response: {
        status: 402,
        data: { company: { _id: "co-1", name: "PhonePe" } },
      },
    });

    renderPage("?companyId=co-1");

    expect(await screen.findByTestId("company-card")).toHaveTextContent("locked");
    expect(screen.getByText(/This company card is locked/)).toBeInTheDocument();
    expect(screen.queryByText("What they expect")).not.toBeInTheDocument();
  });
});
