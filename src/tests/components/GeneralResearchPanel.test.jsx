import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import GeneralResearchPanel, {
  RESEARCH_POLL_MS,
  RESEARCH_POLL_MAX_MS,
} from "../../components/GeneralResearchPanel.jsx";
import { companyAPI, platformAdminAPI } from "../../utils/api";

vi.mock("../../utils/api", () => ({
  platformAdminAPI: {
    getRuntimeSecrets: vi.fn(),
    updateRuntimeSecret: vi.fn(),
    updateRuntimeBudget: vi.fn(),
  },
  companyAPI: {
    getCompanyNames: vi.fn(),
    getPlatformContent: vi.fn(),
    savePlatformContent: vi.fn(),
    startCompanyResearch: vi.fn(),
    listCompanyResearchJobs: vi.fn(),
    listCompanyFresherRoles: vi.fn(),
    getCompanyResearchStatus: vi.fn(),
    publishCompanyResearch: vi.fn(),
    publishCompanyResearchSources: vi.fn(),
    generateCompanyResearchAnswers: vi.fn(),
    updateCompanyResearchItem: vi.fn(),
    enhanceCompanyResearchQuestions: vi.fn(),
  },
}));

const reviewResult = {
  outcome: "ok",
  stats: {
    searchQueries: 4,
    searchedResults: 12,
    selectedSources: 3,
    extractedSources: 2,
    failedSources: 1,
    extractedCandidates: 7,
    duplicateCandidates: 2,
    finalCandidates: 5,
  },
  sources: [
    {
      title: "GeeksforGeeks — Interview Experience",
      url: "https://www.geeksforgeeks.org/acme-interview",
      tavilyScore: 0.91,
      extractionStatus: "extracted",
      structureStatus: "structured",
    },
  ],
  items: [
    {
      question: "Implement an LRU Cache",
      kind: "coding",
      evidence: "I was asked to implement an LRU cache.",
      sourceUrl: "https://www.geeksforgeeks.org/acme-interview",
      sourceTitle: "GeeksforGeeks — Interview Experience",
      supportingSources: [
        {
          sourceUrl: "https://example.com/a",
          sourceTitle: "Source A",
          evidence: "LRU cache",
        },
      ],
    },
  ],
};

function renderPanel() {
  return render(<GeneralResearchPanel companyId="company-1" companyName="Acme" />);
}

function addRole(name) {
  fireEvent.change(screen.getByLabelText("Add a role"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Add role" }));
}

describe("GeneralResearchPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    companyAPI.startCompanyResearch.mockReset();
    companyAPI.listCompanyResearchJobs.mockReset();
    companyAPI.listCompanyResearchJobs.mockResolvedValue({ data: { jobs: [] } });
    companyAPI.listCompanyFresherRoles.mockReset();
    companyAPI.listCompanyFresherRoles.mockResolvedValue({ data: { roles: [] } });
    companyAPI.getCompanyResearchStatus.mockReset();
    companyAPI.publishCompanyResearch.mockReset();
    companyAPI.publishCompanyResearchSources.mockReset();
    companyAPI.generateCompanyResearchAnswers.mockReset();
    companyAPI.updateCompanyResearchItem.mockReset();
    companyAPI.enhanceCompanyResearchQuestions.mockReset();
    companyAPI.savePlatformContent.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("renders the research inputs and company name", () => {
    renderPanel();
    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
    expect(screen.getByLabelText("Add a role")).toHaveValue("");
    expect(screen.getByLabelText("Country")).toHaveValue("India");
    expect(screen.getByLabelText("Maximum sources")).toHaveValue(3);
    expect(screen.getByLabelText("Search depth")).toHaveTextContent("Basic");
    expect(screen.getByRole("button", { name: "Research all roles" })).toBeEnabled();
    expect(screen.getByRole("tab", { name: "Interview questions" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "OA questions" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Interview experiences" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve|publish|reject/i })).not.toBeInTheDocument();
  });

  it("fills the role from public fresher-role suggestions", async () => {
    companyAPI.listCompanyFresherRoles.mockResolvedValue({
      data: { roles: ["Software Engineer", "Data Analyst"] },
    });

    renderPanel();
    await act(async () => {
      await Promise.resolve();
    });

    expect(companyAPI.listCompanyFresherRoles).toHaveBeenCalledWith("company-1", "Acme");
    expect(screen.getByText("Usually recruits freshers for")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Software Engineer" }));
    expect(screen.getByRole("button", { name: "Software Engineer" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Remove Software Engineer" })).toBeInTheDocument();
  });

  it("starts research with the interview-question payload and does not save company content", async () => {
    companyAPI.startCompanyResearch.mockResolvedValue({
      data: { jobId: "job-1", status: "queued" },
    });
    companyAPI.getCompanyResearchStatus.mockResolvedValue({
      data: { jobId: "job-1", status: "queued", result: null },
    });

    renderPanel();
    addRole("SDE");
    addRole("Software Engineer");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Research all roles" }));
    });

    const payload = {
      companyId: "company-1",
      companyName: "Acme",
      country: "India",
      maxSources: 3,
      searchDepth: "basic",
    };
    expect(companyAPI.startCompanyResearch).toHaveBeenCalledWith({
      ...payload,
      field: "interviewQuestions",
      role: "SDE",
    });
    expect(companyAPI.startCompanyResearch).toHaveBeenCalledWith({
      ...payload,
      field: "interviewExperiences",
      role: "SDE",
    });
    expect(companyAPI.startCompanyResearch).toHaveBeenCalledWith({
      ...payload,
      field: "onlineQuestions",
      role: "SDE",
    });
    expect(companyAPI.startCompanyResearch).toHaveBeenCalledWith({
      ...payload,
      field: "interviewQuestions",
      role: "Software Engineer",
    });
    expect(companyAPI.startCompanyResearch).toHaveBeenCalledWith({
      ...payload,
      field: "interviewExperiences",
      role: "Software Engineer",
    });
    expect(companyAPI.startCompanyResearch).not.toHaveBeenCalledWith(
      expect.objectContaining({ field: "onlineQuestions", role: "Software Engineer" })
    );
    expect(companyAPI.savePlatformContent).not.toHaveBeenCalled();
    expect(screen.getByText("Research queued...")).toBeInTheDocument();
  });

  it("restores saved research results when the company page opens again", async () => {
    companyAPI.listCompanyResearchJobs.mockResolvedValue({
      data: {
        jobs: [
          {
            jobId: "job-saved",
            status: "review",
            field: "interviewQuestions",
            companyId: "company-1",
            companyName: "Acme",
            role: "SDE",
            result: reviewResult,
          },
        ],
      },
    });

    const view = renderPanel();
    await act(async () => {
      await Promise.resolve();
    });

    expect(companyAPI.listCompanyResearchJobs).toHaveBeenCalledWith("company-1");
    expect(screen.getByText("Research completed — review the results below.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Interview questions \(/ }));
    expect(screen.getByText("Implement an LRU Cache")).toBeInTheDocument();
    expect(companyAPI.startCompanyResearch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Implement an LRU Cache" }));
    expect(screen.getByRole("checkbox", { name: "Select Implement an LRU Cache" })).toBeChecked();

    view.unmount();
    renderPanel();
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("tab", { name: /Interview questions \(/ }));
    expect(screen.getByRole("checkbox", { name: "Select Implement an LRU Cache" })).toBeChecked();
    expect(screen.getByText("Implement an LRU Cache")).toBeInTheDocument();
  });

  it("enhances a heading into a full question statement", async () => {
    vi.useRealTimers();
    companyAPI.listCompanyResearchJobs.mockResolvedValue({
      data: {
        jobs: [
          {
            jobId: "job-saved",
            status: "review",
            field: "interviewQuestions",
            companyId: "company-1",
            result: {
              ...reviewResult,
              items: [{ ...reviewResult.items[0], question: "LRU Cache" }],
            },
          },
        ],
      },
    });
    companyAPI.enhanceCompanyResearchQuestions.mockResolvedValue({
      data: {
        jobId: "job-saved",
        updatedIndexes: [0],
        items: [
          {
            index: 0,
            question: "Design an LRU cache that supports get and put in O(1) time.",
            sourceQuestion: "LRU Cache",
          },
        ],
      },
    });

    renderPanel();
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("tab", { name: /Interview questions \(/ }));
    fireEvent.click(screen.getByRole("button", { name: "Enhance questions" }));

    await waitFor(() => {
      expect(companyAPI.enhanceCompanyResearchQuestions).toHaveBeenCalledWith("job-saved", [0]);
    });
    expect(
      screen.getByText("Design an LRU cache that supports get and put in O(1) time.")
    ).toBeInTheDocument();
    expect(screen.getByText("Original: LRU Cache")).toBeInTheDocument();
  });

  it("lets the admin edit a generated question and its answer", async () => {
    vi.useRealTimers();
    const answered = {
      ...reviewResult,
      items: [
        {
          ...reviewResult.items[0],
          answer: "Use a hash map and a doubly linked list.",
          intuition: "O(1) get and put.",
        },
      ],
    };
    companyAPI.listCompanyResearchJobs.mockResolvedValue({
      data: {
        jobs: [
          {
            jobId: "job-saved",
            status: "review",
            field: "interviewQuestions",
            companyId: "company-1",
            result: answered,
          },
        ],
      },
    });
    companyAPI.updateCompanyResearchItem.mockResolvedValue({
      data: {
        jobId: "job-saved",
        index: 0,
        item: {
          ...answered.items[0],
          question: "Design an LRU cache",
          answer: "Hash map plus linked list.",
        },
      },
    });

    renderPanel();
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("tab", { name: /Interview questions \(/ }));
    fireEvent.click(screen.getByRole("button", { name: "Edit question" }));
    fireEvent.change(screen.getByLabelText("Question text"), {
      target: { value: "Design an LRU cache" },
    });
    fireEvent.change(screen.getByLabelText("Answer"), {
      target: { value: "Hash map plus linked list." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save question" }));

    await waitFor(() => {
      expect(companyAPI.updateCompanyResearchItem).toHaveBeenCalledWith(
        "job-saved",
        0,
        expect.objectContaining({
          question: "Design an LRU cache",
          answer: "Hash map plus linked list.",
        })
      );
    });
    expect(screen.getByText("Design an LRU cache")).toBeInTheDocument();
    expect(screen.getByText("Hash map plus linked list.")).toBeInTheDocument();
  });

  it("polls after a job is created and stops on review", async () => {
    companyAPI.startCompanyResearch.mockResolvedValue({
      data: { jobId: "job-review", status: "queued" },
    });
    companyAPI.getCompanyResearchStatus
      .mockResolvedValueOnce({
        data: { jobId: "job-review", status: "running", result: null },
      })
      .mockResolvedValue({
        data: { jobId: "job-review", status: "review", result: reviewResult },
      });

    renderPanel();
    addRole("SDE");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Research all roles" }));
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(companyAPI.getCompanyResearchStatus).toHaveBeenCalledWith("job-review");
    expect(screen.getByText("Researching web sources...")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(RESEARCH_POLL_MS);
    });

    expect(screen.getByText("Research completed — review the results below.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Interview questions \(/ }));
    expect(screen.getByText("Implement an LRU Cache")).toBeInTheDocument();
    expect(screen.getByText("I was asked to implement an LRU cache.")).toBeInTheDocument();
    expect(screen.getAllByText("GeeksforGeeks — Interview Experience").length).toBeGreaterThan(0);
    expect(screen.getByText("Search queries")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Interview questions \(/ }));
    expect(screen.getByText("Supported by 1 source")).toBeInTheDocument();
    expect(screen.getByText("Source A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Research links/ }));
    expect(screen.getByRole("link", { name: "https://www.geeksforgeeks.org/acme-interview" })).toHaveAttribute(
      "target",
      "_blank"
    );

    const callsAfterReview = companyAPI.getCompanyResearchStatus.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RESEARCH_POLL_MS * 3);
    });
    expect(companyAPI.getCompanyResearchStatus).toHaveBeenCalledTimes(callsAfterReview);
    expect(companyAPI.savePlatformContent).not.toHaveBeenCalled();
  });

  it("stops polling when the job fails", async () => {
    companyAPI.startCompanyResearch.mockResolvedValue({
      data: { jobId: "job-fail", status: "queued" },
    });
    companyAPI.getCompanyResearchStatus.mockResolvedValue({
      data: {
        jobId: "job-fail",
        status: "failed",
        result: null,
        error: { code: "search_failed", message: "Research could not be completed." },
      },
    });

    renderPanel();
    addRole("SDE");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Research all roles" }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("Research failed.")).toBeInTheDocument();
    expect(screen.getByText("Research could not be completed.")).toBeInTheDocument();
    const calls = companyAPI.getCompanyResearchStatus.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RESEARCH_POLL_MS * 3);
    });
    expect(companyAPI.getCompanyResearchStatus).toHaveBeenCalledTimes(calls);
  });

  it("shows the provider error and lets an admin replace the key when the token limit is hit", async () => {
    platformAdminAPI.getRuntimeSecrets.mockResolvedValue({
      data: {
        keys: [
          {
            id: "groq-web-search",
            label: "Research questions and experiences",
            hint: "••••abcd",
            source: "env",
          },
        ],
        budgets: [
          {
            id: "research",
            secretId: "groq-web-search",
            label: "Question and experience research",
            value: 8192,
            min: 256,
            max: 16384,
            defaultValue: 8192,
          },
        ],
      },
    });
    companyAPI.startCompanyResearch.mockResolvedValue({
      data: { jobId: "job-limit", status: "queued" },
    });
    companyAPI.getCompanyResearchStatus.mockResolvedValue({
      data: {
        jobId: "job-limit",
        status: "failed",
        result: null,
        error: {
          code: "research_failed",
          message: "Groq LLM request failed: Rate limit reached. tokens per minute exceeded.",
          tokenLimit: true,
          secretId: "groq-web-search",
        },
      },
    });

    renderPanel();
    addRole("SDE");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Research all roles" }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText("Groq LLM request failed: Rate limit reached. tokens per minute exceeded.")
    ).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByLabelText("Replacement for Research questions and experiences")).toBeInTheDocument();
    expect(screen.getByLabelText("Question and experience research token budget")).toHaveValue(8192);
  });

  it("stops polling when the panel unmounts", async () => {
    companyAPI.startCompanyResearch.mockResolvedValue({
      data: { jobId: "job-live", status: "queued" },
    });
    companyAPI.getCompanyResearchStatus.mockResolvedValue({
      data: { jobId: "job-live", status: "queued", result: null },
    });

    const view = renderPanel();
    addRole("SDE");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Research all roles" }));
    });
    await act(async () => {
      await Promise.resolve();
    });
    const calls = companyAPI.getCompanyResearchStatus.mock.calls.length;
    expect(calls).toBeGreaterThan(0);

    view.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RESEARCH_POLL_MS * 3);
    });
    expect(companyAPI.getCompanyResearchStatus).toHaveBeenCalledTimes(calls);
  });

  it("stops polling at the maximum wait", async () => {
    companyAPI.startCompanyResearch.mockResolvedValue({
      data: { jobId: "job-slow", status: "queued" },
    });
    companyAPI.getCompanyResearchStatus.mockResolvedValue({
      data: { jobId: "job-slow", status: "running", result: null },
    });

    let now = 5_000_000;
    const nowSpy = vi.spyOn(Date, "now").mockImplementation(() => now);

    renderPanel();
    addRole("SDE");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Research all roles" }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    now = 5_000_000 + RESEARCH_POLL_MAX_MS + 1;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RESEARCH_POLL_MS);
    });

    expect(screen.getByText(/Research timed out/)).toBeInTheDocument();
    const calls = companyAPI.getCompanyResearchStatus.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RESEARCH_POLL_MS * 2);
    });
    expect(companyAPI.getCompanyResearchStatus).toHaveBeenCalledTimes(calls);
    nowSpy.mockRestore();
  });

  async function renderReviewedJob(result = reviewResult) {
    companyAPI.startCompanyResearch.mockResolvedValue({
      data: { jobId: "job-review", status: "queued" },
    });
    companyAPI.getCompanyResearchStatus.mockResolvedValue({
      data: { jobId: "job-review", status: "review", result },
    });
    renderPanel();
    addRole("SDE");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Research all roles" }));
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  it("approves links on the sources tab and finalizes question publish flow", async () => {
    vi.useRealTimers();
    const twoQuestions = {
      ...reviewResult,
      items: [
        reviewResult.items[0],
        {
          ...reviewResult.items[0],
          question: "Explain CAP theorem",
          evidence: "They asked about CAP.",
        },
      ],
    };
    await renderReviewedJob(twoQuestions);

    companyAPI.publishCompanyResearchSources.mockResolvedValue({
      data: { jobId: "job-review", status: "review", insertedSourceCount: 1, duplicateSourceCount: 0 },
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve all links" }));
    await waitFor(() => {
      expect(companyAPI.publishCompanyResearchSources).toHaveBeenCalledWith("job-review");
    });
    expect(screen.getByText(/Inserted 1 link/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Interview questions \(/ }));
    expect(screen.getByRole("checkbox", { name: "Select Implement an LRU Cache" })).not.toBeChecked();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Implement an LRU Cache" }));
    expect(screen.getByRole("checkbox", { name: "Select Implement an LRU Cache" })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByRole("checkbox", { name: "Select Explain CAP theorem" })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.getByRole("checkbox", { name: "Select Implement an LRU Cache" })).not.toBeChecked();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Explain CAP theorem" }));
    fireEvent.click(screen.getByRole("button", { name: "Finalize questions" }));
    expect(screen.queryByRole("checkbox", { name: "Select Explain CAP theorem" })).not.toBeInTheDocument();
    expect(screen.getByText(/Finalized 1 question/)).toBeInTheDocument();

    companyAPI.generateCompanyResearchAnswers.mockResolvedValue({
      data: {
        jobId: "job-review",
        updatedIndexes: [1],
        items: [{ index: 1, answer: "CAP explains consistency trade-offs.", kind: "coding" }],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add answers" }));
    await waitFor(() => {
      expect(companyAPI.generateCompanyResearchAnswers).toHaveBeenCalledWith("job-review", [1]);
    });
    expect(screen.getByText("CAP explains consistency trade-offs.")).toBeInTheDocument();
    const publishButton = screen.getByRole("button", { name: "Publish finalized questions" });
    expect(publishButton).toBeEnabled();

    fireEvent.click(publishButton);
    expect(companyAPI.publishCompanyResearch).not.toHaveBeenCalled();
    expect(screen.getByText(/Publish 1 finalized interview question/)).toBeInTheDocument();

    companyAPI.publishCompanyResearch.mockResolvedValue({
      data: {
        jobId: "job-review",
        status: "published",
        insertedCount: 1,
        duplicateCount: 2,
        duplicateSourceCount: 0,
      },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm publish" }));
    });

    expect(companyAPI.publishCompanyResearch).toHaveBeenCalledTimes(1);
    expect(companyAPI.publishCompanyResearch).toHaveBeenCalledWith("job-review", [1]);
    expect(JSON.stringify(companyAPI.publishCompanyResearch.mock.calls[0])).not.toMatch(/LRU|evidence|geeksforgeeks/i);
    expect(screen.getByText(/Inserted 1 question/)).toBeInTheDocument();
    expect(screen.getByText("Explain CAP theorem")).toBeInTheDocument();
    expect(screen.getByText("Published.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish finalized questions" })).toBeDisabled();
    expect(companyAPI.savePlatformContent).not.toHaveBeenCalled();
  });
});

