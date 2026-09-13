import { describe, expect, it } from "vitest";
import {
  bookingsFromSlotStatus,
  canStartDsaWithoutPrebook,
  findActiveBookingClient,
  isBookingActiveNow,
  msUntilNextSlotBoundary,
  shouldShowDsaHourFullBanner,
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

  it("msUntilNextSlotBoundary wakes at current hour end without a booking", () => {
    const status = {
      currentHour: {
        slotStart: "2026-08-02T09:30:00.000Z",
        slotEnd: "2026-08-02T10:30:00.000Z",
      },
    };
    const inside = Date.parse("2026-08-02T10:00:00.000Z");
    expect(msUntilNextSlotBoundary(status, inside)).toBe(30 * 60 * 1000);
  });

  it("canStartDsaWithoutPrebook allows start when the hour is not full", () => {
    expect(
      canStartDsaWithoutPrebook({
        requiresSlot: true,
        hasActiveBookingNow: false,
        currentHourIsFull: false,
      })
    ).toBe(true);
    expect(
      shouldShowDsaHourFullBanner({
        requiresSlot: true,
        hasActiveBookingNow: false,
        currentHourIsFull: false,
      })
    ).toBe(false);
  });

  it("shouldShowDsaHourFullBanner only when 5/5 and user has no active hour", () => {
    expect(
      shouldShowDsaHourFullBanner({
        requiresSlot: true,
        hasActiveBookingNow: false,
        currentHourIsFull: true,
      })
    ).toBe(true);
    expect(
      canStartDsaWithoutPrebook({
        requiresSlot: true,
        hasActiveBookingNow: false,
        currentHourIsFull: true,
      })
    ).toBe(false);
    expect(
      canStartDsaWithoutPrebook({
        requiresSlot: true,
        hasActiveBookingNow: true,
        currentHourIsFull: true,
      })
    ).toBe(true);
  });
});
