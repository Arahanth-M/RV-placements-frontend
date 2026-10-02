import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PlatformGeneratedSolutionView from "../../components/platform/PlatformGeneratedSolutionView.jsx";

describe("PlatformGeneratedSolutionView", () => {
  it("renders answer card and stacked language solutions like admin review", () => {
    render(
      <PlatformGeneratedSolutionView
        answer="Use a **hash map** and doubly linked list."
        solutions={{
          cpp: "class LRU { };",
          python: "class LRU:\n    pass",
        }}
      />
    );
    expect(screen.getByText("Answer")).toBeInTheDocument();
    expect(screen.getByText("Solutions")).toBeInTheDocument();
    expect(screen.getByText("C++")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });
});
