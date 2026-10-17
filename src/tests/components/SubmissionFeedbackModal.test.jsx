import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SubmissionFeedbackModal from "../../components/SubmissionFeedbackModal.jsx";

function renderModal(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SubmissionFeedbackModal
        open
        onClose={vi.fn()}
        variant="success"
        statusMessage="Submission received and pending placement."
      />
    </MemoryRouter>
  );
}

describe("SubmissionFeedbackModal contribution note", () => {
  it("refers to students on /general", () => {
    renderModal("/general/companies/abc");
    expect(
      screen.getByText(/Thousands of students will benefit from your response/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/RVian/)).not.toBeInTheDocument();
  });

  it("keeps RVians on the campus shell", () => {
    renderModal("/rvce/companies/abc");
    expect(
      screen.getByText(/Thousands of RVians will benefit from your response/)
    ).toBeInTheDocument();
  });
});
