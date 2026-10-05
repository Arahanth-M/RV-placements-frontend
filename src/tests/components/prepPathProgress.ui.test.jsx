import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PrepPathPage from "../../components/PrepPathPage.jsx";
import { TenantShellProvider } from "../../context/TenantShellContext.jsx";
import { TENANT_BASE } from "../../constants/tenant.js";
import { prepPathAPI } from "../../utils/api.js";

vi.mock("../../utils/api.js", () => ({
  companyAPI: {
    getCompanyNames: vi.fn(),
  },
  prepPathAPI: {
    getQuota: vi.fn(),
    listPlans: vi.fn(),
    getPlan: vi.fn(),
    getPeerDemand: vi.fn(),
  },
}));

const plan = {
  _id: "plan-1",
  companyId: "co-1",
  companyName: "Acme",
  role: "SDE",
  track: "full_time",
  days: 1,
  hoursPerDay: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  roadmap: {
    summary: "Focus on arrays.",
    days: [
      {
        day: 1,
        hours: 2,
        focus: "DSA",
        tasks: [{ title: "Arrays", minutes: 60 }],
      },
    ],
    topicSections: [
      {
        title: "DSA",
        subtopics: [
          { title: "Two sum", hours: 1 },
          { title: "Sliding window", hours: 1 },
        ],
      },
    ],
  },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/prep-path?plan=plan-1"]}>
      <TenantShellProvider base={TENANT_BASE}>
        <PrepPathPage />
      </TenantShellProvider>
    </MemoryRouter>
  );
}

describe("PrepPath completion tracking", () => {
  it("shows a progress bar under the inputs and updates it when a topic or subtopic is ticked", async () => {
    localStorage.clear();
    prepPathAPI.getQuota.mockResolvedValue({
      data: { quota: { unlimited: true, used: 1 } },
    });
    prepPathAPI.listPlans.mockResolvedValue({ data: { plans: [] } });
    prepPathAPI.getPlan.mockResolvedValue({ data: { plan } });

    renderPage();

    const bar = await screen.findByRole("progressbar", { name: "PrepPath completion" });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("0 of 2 complete · 0%")).toBeInTheDocument();

    const company = screen.getByPlaceholderText("Search company");
    const flowchart = screen.getByRole("heading", { name: "Day-by-day flowchart" });
    expect(company.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bar.compareDocumentPosition(flowchart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const topic = screen.getByRole("checkbox", { name: "Mark Arrays complete" });
    const twoSum = screen.getByRole("checkbox", { name: "Mark Two sum complete" });
    const sliding = screen.getByRole("checkbox", { name: "Mark Sliding window complete" });
    expect(topic).toHaveAttribute("data-state", "unchecked");
    expect(topic).toHaveClass("prep-check");

    fireEvent.click(twoSum);
    expect(twoSum).toHaveAttribute("aria-checked", "true");
    expect(topic).toHaveAttribute("aria-checked", "mixed");
    expect(sliding).toHaveAttribute("aria-checked", "false");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("1 of 2 complete · 50%")).toBeInTheDocument();

    fireEvent.click(topic);
    expect(topic).toHaveAttribute("aria-checked", "true");
    expect(twoSum).toHaveAttribute("aria-checked", "true");
    expect(sliding).toHaveAttribute("aria-checked", "true");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("2 of 2 complete · 100%")).toBeInTheDocument();

    fireEvent.click(sliding);
    expect(topic).toHaveAttribute("aria-checked", "mixed");
    expect(bar).toHaveAttribute("aria-valuenow", "50");

    fireEvent.click(screen.getByRole("button", { name: "Sliding window" }));
    expect(sliding).toHaveAttribute("aria-checked", "true");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });
});
