import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OATab from "../../components/CompanyTabs/OATab.jsx";

const updateOAQuestion = vi.fn();

vi.mock("../../utils/api", async () => {
  const actual = await vi.importActual("../../utils/api");
  return {
    ...actual,
    adminCompanyVisitOpts: () => ({}),
    companyContentAdminAPI: () => ({ updateOAQuestion }),
  };
});

const company = {
  _id: "co-1",
  onlineQuestions: ["Two Sum"],
  onlineQuestions_solution: ["int twoSum() { return 1; }"],
  onlineQuestions_solutions: [
    { cpp: "int twoSum() { return 1; }", java: "class TwoSum {}", python: "def two_sum():\n    return 1" },
  ],
  onlineQuestions_intuition: ["Use a hash map."],
  onlineQuestions_explanation: ["One pass over the array."],
  onlineQuestions_kind: ["coding"],
};

function renderTab() {
  return render(
    <MemoryRouter initialEntries={["/general/companies/co-1"]}>
      <OATab company={company} isAdmin isGeneral onCompanyUpdate={vi.fn()} />
    </MemoryRouter>
  );
}

describe("OATab platform admin edit", () => {
  beforeEach(() => {
    updateOAQuestion.mockReset();
    updateOAQuestion.mockResolvedValue({});
  });

  it("opens intuition, explanation, and every language, then saves them", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByTitle("Edit question"));

    expect(screen.getByLabelText("Intuition")).toHaveValue("Use a hash map.");
    expect(screen.getByLabelText("Explanation")).toHaveValue("One pass over the array.");
    expect(screen.getByLabelText("C++ solution")).toHaveValue("int twoSum() { return 1; }");
    expect(screen.getByLabelText("Java solution")).toHaveValue("class TwoSum {}");
    expect(screen.getByLabelText("Python solution")).toHaveValue("def two_sum():\n    return 1");

    await user.clear(screen.getByLabelText("Java solution"));
    await user.type(screen.getByLabelText("Java solution"), "class Revised");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateOAQuestion).toHaveBeenCalledWith(
      "co-1",
      0,
      {
        question: "Two Sum",
        intuition: "Use a hash map.",
        explanation: "One pass over the array.",
        solutions: {
          cpp: "int twoSum() { return 1; }",
          java: "class Revised",
          python: "def two_sum():\n    return 1",
        },
      },
      {}
    );
  });
});
