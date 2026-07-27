import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

function lockBodyScroll() {
  const scrollBarGap = window.innerWidth - document.documentElement.clientWidth;
  const prevOverflow = document.body.style.overflow;
  const prevPaddingRight = document.body.style.paddingRight;
  document.body.style.overflow = "hidden";
  if (scrollBarGap > 0) {
    document.body.style.paddingRight = `${scrollBarGap}px`;
  }
  return () => {
    document.body.style.overflow = prevOverflow;
    document.body.style.paddingRight = prevPaddingRight;
  };
}

/**
 * Modal to book or reschedule a DSA interview slot (IST hourly, max 5 per slot).
 */
function InterviewSlotBookModal({
  open,
  onClose,
  rescheduleBookingId = null,
  onBooked,
  /** Optional prefetched availability slots from the parent page — avoids a loading flash. */
  initialSlots = null,
}) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlotKey, setSelectedSlotKey] = useState("");

  const loadSlots = useCallback(async ({ soft = false } = {}) => {
    if (!soft) setLoading(true);
    setError("");
    try {
      const { data } = await interviewAPI.getSlotAvailability();
      setSlots(Array.isArray(data?.slots) ? data.slots : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load available slots.");
      if (!soft) setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setSelectedSlotKey("");
    setError("");
    const seeded = Array.isArray(initialSlots) && initialSlots.length > 0;
    if (seeded) {
      setSlots(initialSlots);
      setLoading(false);
      loadSlots({ soft: true });
    } else {
      loadSlots({ soft: false });
    }
    const unlock = lockBodyScroll();
    return unlock;
    // Only re-run when the modal opens/closes — not when parent slot data updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: seed once on open
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

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-book-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose?.();
      }}
    >
      <div
        className="flex h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-theme bg-theme-card shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-theme px-5 py-4 sm:px-6">
          <h2 id="slot-book-modal-title" className="text-lg font-semibold text-theme-primary">
            {rescheduleBookingId ? "Reschedule interview slot" : "Book interview slot"}
          </h2>
          <p className="mt-1 text-sm text-theme-secondary">
            DSA mock interviews need a 1-hour IST slot (max 5 students per hour). You can start
            anytime during your booked hour.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {loading && slots.length === 0 ? (
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
                            {slot.isFull ? " �