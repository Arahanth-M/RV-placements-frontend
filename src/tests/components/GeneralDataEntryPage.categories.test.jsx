import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GeneralDataEntryPage from "../../components/GeneralDataEntryPage.jsx";
import { companyAPI } from "../../utils/api";

vi.mock("../../utils/api", () => ({
  companyAPI: {
    getPlatformPrepCatalog: vi.fn(),
    getPlatformContent: vi.fn(),
  },
}));

vi.mock("../../components/AnimatedLogoGrid", () => ({
  default: () => <div data-testid="category-logos" />,
}));

const catalog = [
  {
    _id: "fin-added",
    name: "Razorpay",
    business_model: "Fintech",
    logo: "",
    platformPrepCoverage: { oa: 4, interview: 2, experiences: 1 },
    researchPipelineAdded: true,
  },
  {
    _id: "fin-empty",
    name: "Blank Pay",
    business_model: "Payments",
    logo: "",
    platformPrepCoverage: { oa: 6, interview: 1, experiences: 0 },
    researchPipelineAdded: false,
  },
  {
    _id: "ecom-added",
    name: "Amazon",
    business_model: "E-commerce",
    logo: "",
    platformPrepCoverage: { oa: 0, interview: 3, experiences: 0 },
    researchPipelineAdded: true,
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/general/data-entry"]}>
      <Routes>
        <Route path="/general/data-entry" element={<GeneralDataEntryPage />} />
        <Route path="/general/data-entry/:companyId" element={<GeneralDataEntryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("GeneralDataEntryPage categories", () => {
  beforeEach(() => {
    companyAPI.getPlatformPrepCatalog.mockResolvedValue({ data: catalog });
    companyAPI.getPlatformContent.mockResolvedValue({ data: { name: "Razorpay" } });
  });

  it("groups companies like Student Corner and shows added versus remaining", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("heading", { name: "Fintech" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "E-commerce" })).toBeInTheDocument();
    expect(screen.getByText("2 added · 1 remaining across 3 companies")).toBeInTheDocument();
    expect(screen.getByText("1 added · 1 remaining")).toBeInTheDocument();
    expect(screen.queryByText("Razorpay")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Fintech/ }));

    expect(await screen.findByText("Razorpay")).toBeInTheDocument();
    expect(screen.getByText("Blank Pay")).toBeInTheDocument();
    expect(screen.getByText("Research pipeline published")).toBeInTheDocument();
    expect(screen.getByText("Research pipeline not published")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remaining" }));
    expect(screen.queryByText("Razorpay")).not.toBeInTheDocument();
    expect(screen.getByText("Blank Pay")).toBeInTheDocument();
  });
});
