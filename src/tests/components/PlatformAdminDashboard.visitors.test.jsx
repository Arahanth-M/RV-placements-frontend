import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PlatformAdminDashboard from "../../components/PlatformAdminDashboard.jsx";
import { platformAdminAPI } from "../../utils/api";

vi.mock("../../utils/api", () => ({
  platformAdminAPI: {
    getStats: vi.fn(),
    getVisitors: vi.fn(),
  },
}));

describe("PlatformAdminDashboard visitors", () => {
  beforeEach(() => {
    platformAdminAPI.getStats.mockResolvedValue({
      data: {
        totalUsers: 2,
        pendingSubmissions: 0,
        approvedSubmissions: 0,
        onboardingOpen: 0,
        paidOrders: 0,
        activeEntitlements: 0,
        platformMockSessions: 0,
        prepPathPlans: 0,
      },
    });
    platformAdminAPI.getVisitors.mockResolvedValue({
      data: {
        items: [
          {
            id: "1",
            username: "Late Visitor",
            email: "late@gmail.com",
            lastLoginAt: "2026-03-02T15:30:00.000Z",
            audience: "general",
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  });

  it("shows who logged in and when", async () => {
    render(
      <MemoryRouter initialEntries={["/general/admin/dashboard?tab=visitors"]}>
        <PlatformAdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText("Late Visitor")).toBeInTheDocument();
    expect(screen.getByText("late@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(
      screen.getByText(/1 person signed in on or after 1 October 2026, newest first/)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(platformAdminAPI.getVisitors).toHaveBeenCalledWith({
        params: { page: 1, limit: 50, q: undefined },
      });
    });
  });
});
