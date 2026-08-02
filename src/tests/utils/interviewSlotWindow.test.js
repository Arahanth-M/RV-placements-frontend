import { describe, expect, it } from "vitest";
import {
  bookingsFromSlotStatus,
  findActiveBookingClient,
  isBookingActiveNow,
  msUntilNextSlotBoundary,
} from "../interviewSlotWindow.js";

describe("interviewSlotWindow", () => {
  const booking = {
    label: "3–4 PM",
    slotStart: "2026-08-02T09:30:00.000Z", // 3:00 PM IST
    slotEnd: "2026-08-02T10:30:00.000Z", // 4:00 PM IST
  };

  it("isBookingActiveNow inside window", () => {
    const inside = Date.parse("2026-08-02T10:00:00.000Z"); // 3:30 IST
    expect(isBookingActiveNow(booking, inside)).toBe(true);
    expect(isBookingActiveNow(booking, Date.parse("2026-08-02T09:00:00.000Z"))).toBe(false);
    expect(isBookingActiveNow(booking, Date.parse("2026-08-02T10:30:00.000Z"))).toBe(false);
  });

  it("findActiveBookingClient uses upcoming when server flag is stale", () => {
    const status = {
      hasActiveBookingNow: false,
      activeBooking: null,
      upcomingBookings: [booking],
    };
    const found = findActiveBookingClient(status, Date.parse("2026-08-02T10:00:00.000Z"));
    expect(found?.label).toBe("3–4 PM");
  });

  it("msUntilNextSlotBoundary wakes at slot start", () => {
    const status = { upcomingBookings: [booking] };
    const before = Date.parse("2026-08-02T09:00:00.000Z");
    expect(msUntilNextSlotBoundary(status, before)).toBe(30 * 60 * 1000);
  });

  it("bookingsFromSlotStatus merges active + upcoming", () => {
    expect(
      bookingsFromSlotStatus({
        activeBooking: booking,
        upcomingBookings: [{ ...booking, label: "other" }],
      })
    ).toHaveLength(2);
  });
});
