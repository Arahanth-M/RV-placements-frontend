import React, { useCallback, useEffect, useMemo, useState } from "react";
import { interviewAPI } from "../utils/api";

function groupSlotsByDay(slots) {
  const map = new Map();
  for (const slot of slots || []) {
    const dayKey = String(slot.slotKey || "").slice(0, 10);
    if (!dayKey) continue;
    if (!map.has(dayKey)) map.set(dayKey, []);
    map.get(dayKey).push(slot);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Modal to book or reschedule a DSA interview slot (IST hourly, max 5 per slot).
 */
function InterviewSlotBookModal({
  open,
  onClose,
  customRounds,
  rescheduleBookingId = null,
  onBooked,
}) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlotKey, setSelectedSlotKey] = useState("");

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await interviewAPI.getSlotAvailability();
      setSlots(Array.isArray(data?.slots) ? data.slots : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load available slots.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedSlotKey("");
    loadSlots();
  }, [open, loadSlots]);

  const grouped = useMemo(() => groupSlotsByDay(slots), [slots]);

  const handleConfirm = async () => {
    if (!selectedSlotKey || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      if (rescheduleBookingId) {
        await interviewAPI.rescheduleSlotBooking({
          bookingId: rescheduleBookingId,
          newSlotKey: selectedSlotKey,
        });
      } else {
        await interviewAPI.bookSlot({ slotKey: selectedSlotKey });
      }
      onBooked?.();
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          (rescheduleBookingId ? "Failed to reschedule." : "Failed to book slot.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-book-modal-title"
    >
      <div className="flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-theme bg-theme-card shadow-2xl">
        <div className="border-b border-theme px-5 py-4 sm:px-6">
          <h2 id="slot-book-modal-title" className="text-lg font-semibold text-theme-primary">
            {rescheduleBookingId ? "Reschedule interview slot" : "Book interview slot"}
          </h2>
          <p className="mt-1 text-sm text-theme-secondary">
            DSA mock interviews need a 1-hour IST slot (max 5 students per hour). You can start
            anytime during your booked hour.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {loading ? (
            <p className="animate-pulse text-sm text-theme-secondary">Loading slots…</p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-theme-secondary">No bookable slots in the next 7 days.</p>
          ) : (
            <div className="space-y-5">
              {grouped.map(([dayKey, daySlots]) => (
                <div key={dayKey}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-theme-muted">
                    {dayKey}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {daySlots.map((slot) => {
                      const selected = selectedSlotKey === slot.slotKey;
                      const disabled = slot.isFull;
                      return (
                        <button
                          key={slot.slotKey}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedSlotKey(slot.slotKey)}
                          className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                            disabled
                              ? "cursor-not-allowed border-theme bg-theme-input/40 opacity-50"
                              : selected
                                ? "border-theme-accent bg-theme-hero ring-2 ring-theme-accent/40"
                                : "border-theme bg-theme-input hover:border-theme-accent/50"
                          }`}
                        >
                          <span className="block font-medium text-theme-primary">
                            {String(slot.slotKey || "").slice(11)}:00–
                            {String(Number(String(slot.slotKey || "").slice(11)) + 1).padStart(2, "0")}
                            :00 IST
                          </span>
                          <span className="mt-1 block text-xs text-theme-muted">
                            {slot.bookedCount}/{slot.capacity} booked
                            {slot.isFull ? " · Full" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <p className="border-t border-theme px-5 py-2 text-sm text-red-400 sm:px-6">{error}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-theme px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-theme px-4 py-2.5 text-sm font-semibold text-theme-primary hover:bg-theme-nav disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedSlotKey || submitting}
            className="rounded-lg bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Saving…"
              : rescheduleBookingId
                ? "Confirm reschedule"
                : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewSlotBookModal;
