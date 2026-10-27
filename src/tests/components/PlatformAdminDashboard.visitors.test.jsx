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

  it("shows who logged in and when for the general tab", async () => {
    render(
      <MemoryRouter initialEntries={["/general/admin/dashboard?tab=visitors"]}>
        <PlatformAdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText("Late Visitor")).toBeInTheDocument();
    expect(screen.getByText("late@gmail.com")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "General dashboard" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(
      screen.getByText(/1 person on the general dashboard signed in on or after 1 October 2026/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(platformAdminAPI.getVisitors).toHaveBeenCalledWith({
        params: { page: 1, limit: 50, q: undefined, audience: "general" },
      });
    });
  });

  it("loads campus visitors when the campus tab is selected", async () => {
    platformAdminAPI.getVisitors
      .mockResolvedValueOnce({
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
          audience: "general",
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: "2",
              username: "Campus Student",
              email: "student@rvce.edu.in",
              lastLoginAt: "2026-10-01T04:30:00.000Z",
              audience: "campus",
            },
          ],
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
          audience: "campus",
        },
      });

    render(
      <MemoryRouter initialEntries={["/general/admin/dashboard?tab=visitors"]}>
        <PlatformAdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText("Late Visitor")).toBeInTheDocument();
    screen.getByRole("tab", { name: "Campus dashboard" }).click();

    expect(await screen.findByText("Campus Student")).toBeInTheDocument();
    expect(screen.getByText("student@rvce.edu.in")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Campus dashboard" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await waitFor(() => {
      expect(platformAdminAPI.getVisitors).toHaveBeenLastCalledWith({
        params: { page: 1, limit: 50, q: undefined, audience: "campus" },
      });
    });
  });
});
