/**
 * Client-side helpers so DSA Start unlocks when the booked IST hour begins
 * without polling the server every few seconds.
 */

/**
 * @param {{ slotStart?: unknown, slotEnd?: unknown }|null|undefined} booking
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function isBookingActiveNow(booking, nowMs = Date.now()) {
  if (!booking) return false;
  const start = new Date(booking.slotStart).getTime();
  const end = new Date(booking.slotEnd).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return nowMs >= start && nowMs < end;
}

/**
 * Collect bookings from a `/slot-bookings/status` payload.
 * @param {Record<string, unknown>|null|undefined} status
 * @returns {Array<{ slotStart?: unknown, slotEnd?: unknown, label?: unknown }>}
 */
export function bookingsFromSlotStatus(status) {
  if (!status || typeof status !== "object") return [];
  /** @type {Array<{ slotStart?: unknown, slotEnd?: unknown, label?: unknown }>} */
  const out = [];
  if (status.activeBooking && typeof status.activeBooking === "object") {
    out.push(/** @type {{ slotStart?: unknown, slotEnd?: unknown, label?: unknown }} */ (status.activeBooking));
  }
  const upcoming = status.upcomingBookings;
  if (Array.isArray(upcoming)) {
    for (const b of upcoming) {
      if (b && typeof b === "object") out.push(b);
    }
  }
  return out;
}

/**
 * @param {Record<string, unknown>|null|undefined} status
 * @param {number} [nowMs]
 * @returns {{ slotStart?: unknown, slotEnd?: unknown, label?: unknown }|null}
 */
export function findActiveBookingClient(status, nowMs = Date.now()) {
  for (const b of bookingsFromSlotStatus(status)) {
    if (isBookingActiveNow(b, nowMs)) return b;
  }
  return null;
}

/**
 * Ms until the next slot start/end boundary we care about (capped).
 * Used to schedule a single wake-up instead of fixed polling.
 * @param {Record<string, unknown>|null|undefined} status
 * @param {number} [nowMs]
 * @param {number} [maxMs]
 * @returns {number|null} null when nothing to wait for
 */
export function msUntilNextSlotBoundary(status, nowMs = Date.now(), maxMs = 60 * 60 * 1000) {
  let soonest = null;
  for (const b of bookingsFromSlotStatus(status)) {
    const start = new Date(b.slotStart).getTime();
    const end = new Date(b.slotEnd).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (start > nowMs) {
      soonest = soonest == null ? start : Math.min(soonest, start);
    } else if (end > nowMs) {
      // Currently inside a slot — wake at end (or sooner for UI refresh).
      soonest = soonest == null ? end : Math.min(soonest, end);
    }
  }
  const hour = status && typeof status === "object" ? status.currentHour : null;
  if (hour && typeof hour === "object") {
    const end = new Date(hour.slotEnd).getTime();
    if (Number.isFinite(end) && end > nowMs) {
      soonest = soonest == null ? end : Math.min(soonest, end);
    }
  }

  if (soonest == null) return null;
  const delta = soonest - nowMs;
  if (delta <= 0) return 0;
  return Math.min(delta, maxMs);
}

/**
 * DSA Start is allowed without a pre-booked slot when the current IST hour still has capacity.
 * Auto-booking happens on the server at start time.
 */
export function canStartDsaWithoutPrebook({
  requiresSlot,
  hasActiveBookingNow,
  currentHourIsFull,
} = {}) {
  if (!requiresSlot) return true;
  if (hasActiveBookingNow) return true;
  return !currentHourIsFull;
}

/** Show "this hour is 5/5 — book another slot" only when the current hour is full. */
export function shouldShowDsaHourFullBanner({
  requiresSlot,
  hasActiveBookingNow,
  currentHourIsFull,
} = {}) {
  return Boolean(requiresSlot && currentHourIsFull && !hasActiveBookingNow);
}
