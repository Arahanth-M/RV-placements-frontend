import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthCallback from "../../components/AuthCallback.jsx";

vi.mock("../../utils/AuthContext", () => ({
  useAuth: () => ({
    refreshUser: vi.fn(),
    setStudentData: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("AuthCallback production login lock", () => {
  it("shows the official-email message for a rejected login", async () => {
    window.location.search = "?login=failed&reason=closed";
    window.location.pathname = "/auth/callback";

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", {
        name: "Login through ur official college emailId",
      })
    ).toBeInTheDocument();
  });
});
