import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { interviewAPI } from "../utils/api";
import InterviewSlotBookModal from "./InterviewSlotBookModal";
import InterviewSlotsCalendar, {
  dayBookedCountsFromSlots,
  groupBookingsByIstDate,
  istDateKeyFromDate,
  parseDateKey,
} from "./InterviewSlotsCalendar";
import {
  PageBackButton,
  PageBackNavRow,
  PageHeroFontStyles,
  PageHeroHeader,
  pageShellInnerClass,
  pageShellOuterClassCompact,
} from "./PageBackNav.jsx";

function bookingStatusLabel(booking) {
  if (booking.isActiveNow) return "Active now — you can start your interview";
  const now = Date.now();
  const start = new Date(booking.slotStart).getTime();
  const end = new Date(booking.slotEnd).getTime();
  if (end <= now) return "Past (no-show)";
  if (start > now) return "Upcoming";
  return "Ended";
}

function formatSelectedDayLabel(dateKey) {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;
  const utcNoon = Date.UTC(parsed.year, parsed.month - 1, parsed.day, 6, 30, 0);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(utcNoon));
}

function InterviewSlotsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [dayCountsFromApi, setDayCountsFromApi] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const todayParts = useMemo(() => {
    const key = istDateKeyFromDate(new Date());
    const p = parseDateKey(key);
    return p || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  }, []);

  const [viewYear, setViewYear] = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.month);
  const [selectedDateKey, setSelectedDateKey] = useState(istDateKeyFromDate(new Date()));

  const bookingsByDate = useMemo(() => groupBookingsByIstDate(bookings), [bookings]);
  const dayBookedCounts = useMemo(() => {
    // Prefer server dayTotals when present; fall back to summing hourly slots.
    if (dayCountsFromApi && Object.keys(dayCountsFromApi).length > 0) {
      return new Map(
        Object.entries(dayCountsFromApi).filter(([, n]) => Number(n) > 0)
      );
    }
    return dayBookedCountsFromSlots(availabilitySlots);
  }, [dayCountsFromApi, availabilitySlots]);

  const selectedDayBookings = useMemo(
    () => (selectedDateKey ? bookingsByDate.get(selectedDateKey) || [] : []),
    [bookingsByDate, selectedDateKey]
  );

  const loadPageData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const [mineRes, availRes] = await Promise.all([
        interviewAPI.getMySlotBookings(),
        interviewAPI.getSlotAvailability(),
      ]);
      setBookings(Array.isArray(mineRes?.data?.bookings) ? mineRes.data.bookings : []);
      setAvailabilitySlots(Array.isArray(availRes?.data?.slots) ? availRes.data.slots : []);
      setDayCountsFromApi(
        availRes?.data?.dayCounts && typeof availRes.data.dayCounts === "object"
          ? availRes.data.dayCounts
          : {}
      );
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.error || "Failed to load interview slots.");
        setBookings([]);
        setAvailabilitySlots([]);
        setDayCountsFromApi({});
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleCancel = async (bookingId) => {
    if (!bookingId || cancellingId) return;
    setCancellingId(bookingId);
    setActionError("");
    try {
      await interviewAPI.cancelSlotBooking(bookingId);
      await loadPageData({ silent: true });
    } catch (err) {
      setActionError(err?.response?.data?.error || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const openReschedule = (bookingId) => {
    setRescheduleId(bookingId);
    setBookModalOpen(true);
  };

  const closeModal = () => {
    setBookModalOpen(false);
    setRescheduleId(null);
  };

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className={`min-h-screen ${pageShellOuterClassCompact}`}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate("/")} label="Back" />
        </PageBackNavRow>

        <div className="mx-auto max-w-5xl">
          <PageHeroHeader
            subtitle="See how many slots are booked each day, and manage your own DSA interview hours (IST)."
            subtitleClassName="text-theme-secondary"
            subtitleMaxWidth="600px"
          >
            Interview <em style={{ color: "#818CF8", fontStyle: "italic" }}>slots</em>
          </PageHeroHeader>

          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setRescheduleId(null);
                setBookModalOpen(true);
              }}
              className="rounded-lg bg-theme-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Book slot
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-theme bg-theme-card p-6">
              <p className="animate-pulse text-theme-secondary">Loading calendar…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/40 bg-theme-card p-6">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <InterviewSlotsCalendar
                dayBookedCounts={dayBookedCounts}
                selectedDateKey={selectedDateKey}
                onSelectDate={setSelectedDateKey}
                viewYear={viewYear}
                viewMonth={viewMonth}
                onPrevMonth={goPrevMonth}
                onNextMonth={goNextMonth}
              />

              {actionError ? (
                <p className="rounded-lg border border-red-500/40 bg-theme-card px-4 py-3 text-sm text-red-400">
                  {actionError}
                </p>
              ) : null}

              <div className="min-h-[10rem] rounded-xl border border-theme bg-theme-card p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-theme-primary sm:text-base">
                    {selectedDateKey
                      ? formatSelectedDayLabel(selectedDateKey)
                      : "Select a day"}
                  </h3>
                  {selectedDateKey && (dayBookedCounts.get(selectedDateKey) || 0) > 0 ? (
                    <p className="text-xs font-medium text-theme-accent sm:text-sm">
                      {dayBookedCounts.get(selectedDateKey)} slots booked that day
                    </p>
                  ) : null}
                </div>

                <p className="mt-2 text-xs text-theme-muted">Your bookings for this day</p>

                {selectedDayBookings.length === 0 ? (
                  <p className="mt-3 text-sm text-theme-secondary">
                    You have no booking on this day.{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleId(null);
                        setBookModalOpen(true);
                      }}
                      className="font-semibold text-theme-accent underline underline-offset-2"
                    >
                      Book a slot
                    </button>
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedDayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`rounded-lg border p-4 ${
                          booking.isActiveNow
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-theme bg-theme-input/50"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-theme-primary">{booking.label}</p>
                            <p className="mt-1 text-sm text-theme-secondary">
                              {bookingStatusLabel(booking)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {booking.canCancel ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openReschedule(booking.id)}
                                  className="rounded-lg border border-theme px-3 py-2 text-xs font-semibold text-theme-primary hover:bg-theme-nav"
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={cancellingId === booking.id}
                                  className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  {cancellingId === booking.id ? "Cancelling…" : "Cancel"}
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-theme-muted">
                                Cancel/reschedule locked within 2 hours of start
                              </span>
                            )}
                          </div>
               