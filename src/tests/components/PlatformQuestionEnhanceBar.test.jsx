import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlatformQuestionEnhanceBar from "../../components/platform/PlatformQuestionEnhanceBar.jsx";

describe("PlatformQuestionEnhanceBar", () => {
  it("hides intuition and language actions for non-coding questions", () => {
    render(
      <PlatformQuestionEnhanceBar isCoding={false} onEnhance={vi.fn()} />
    );

    expect(screen.getByTitle("Enhance question")).toBeInTheDocument();
    expect(screen.getByTitle("Enhance explanation")).toBeInTheDocument();
    expect(screen.queryByTitle("Enhance intuition")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Refill C++")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Refill Java")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Refill Python")).not.toBeInTheDocument();
  });

  it("shows coding actions for coding questions", () => {
    render(<PlatformQuestionEnhanceBar isCoding onEnhance={vi.fn()} />);

    expect(screen.getByTitle("Enhance intuition")).toBeInTheDocument();
    expect(screen.getByTitle("Refill C++")).toBeInTheDocument();
    expect(screen.getByTitle("Refill Java")).toBeInTheDocument();
    expect(screen.getByTitle("Refill Python")).toBeInTheDocument();
  });
});
