import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OATab from "../../components/CompanyTabs/OATab.jsx";
import InterviewTab from "../../components/CompanyTabs/InterviewTab.jsx";

const prepRoles = [
  { key: "sde", label: "SDE" },
  { key: "analyst", label: "Analyst" },
];

describe("OA questions by role", () => {
  const company = {
    _id: "co-1",
    prepRoles,
    onlineQuestions: ["Two sum", "Untagged OA"],
    onlineQuestions_prepRoleKey: ["sde", ""],
    onlineQuestions_solution: ["", ""],
    mcqQuestions: [
      { question: "Analyst MCQ", prepRoleKey: "analyst", optionA: "A", answer: "A" },
      { question: "General MCQ", prepRoleKey: "", optionA: "B", answer: "B" },
    ],
  };

  it("puts untagged OA questions and MCQs under General and filters the rest by role", async () => {
    render(<OATab company={company} isGeneral />);

    expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("General MCQ")).toBeInTheDocument();
    expect(screen.queryByText("Analyst MCQ")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mcq-answer-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /View answer/i }));
    expect(screen.getByTestId("mcq-answer-1")).toHaveTextContent("Correct Answer: B");
    expect(screen.getByRole("button", { name: /Question 1/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Question 2/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "SDE" }));
    await waitFor(() => {
      expect(screen.queryByText("General MCQ")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Question 1/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Analyst" }));
    await waitFor(() => {
      expect(screen.getByText("Analyst MCQ")).toBeInTheDocument();
      expect(screen.getByText("No questions for this role. Choose another role tab above.")).toBeInTheDocument();
    });
  });

  it("shows every OA question together when the page is not the general platform", () => {
    render(<OATab company={company} />);
    expect(screen.queryByRole("tab", { name: "General" })).not.toBeInTheDocument();
    expect(screen.getByText("Analyst MCQ")).toBeInTheDocument();
    expect(screen.getByText("General MCQ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Question 2/ })).toBeInTheDocument();
  });
});

describe("interview content by role", () => {
  it("shows untagged interview questions under General", async () => {
    render(
      <InterviewTab
        isGeneral
        generalSection="questions"
        company={{
          prepRoles,
          interviewQuestions: ["SDE one", "SDE two", "No role"],
          interviewQuestions_prepRoleKey: ["sde", "sde", ""],
          interviewQuestions_solution: ["", "", ""],
        }}
      />
    );

    expect(screen.getByRole("tab", { name: "SDE" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /Question 2/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Question 3/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "General" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Question 1/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Question 2/ })).not.toBeInTheDocument();
    });
  });

  it("shows untagged interview experiences under General", async () => {
    render(
      <InterviewTab
        isGeneral
        generalSection="experience"
        company={{
          prepRoles,
          interviewProcess: [
            { content: "SDE onsite story", prepRoleKey: "sde" },
            { content: "Untagged experience story", prepRoleKey: "" },
          ],
        }}
      />
    );

    expect(screen.getByText("SDE onsite story")).toBeInTheDocument();
    expect(screen.queryByText("Untagged experience story")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "General" }));
    await waitFor(() => {
      expect(screen.getByText("Untagged experience story")).toBeInTheDocument();
      expect(screen.queryByText("SDE onsite story")).not.toBeInTheDocument();
    });
  });
});
