import React, { useMemo } from "react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** `YYYY-MM-DD` in Asia/Kolkata for a Date. */
export function istDateKeyFromDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseDateKey(dateKey) {
  const m = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function groupBookingsByIstDate(bookings) {
  const map = new Map();
  for (const booking of bookings || []) {
    const day =
      String(booking?.slotKey || "").slice(0, 10) ||
      istDateKeyFromDate(new Date(booking.slotStart));
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(booking);
  }
  for (const [, list] of map) {
    list.sort((a, b) => String(a.slotKey).localeCompare(String(b.slotKey)));
  }
  return map;
}

/** Sum hourly `bookedCount` into per-day totals. Returns `Map<"YYYY-MM-DD", number>`. */
export function dayBookedCountsFromSlots(slots) {
  const map = new Map();
  for (const slot of slots || []) {
    const day = String(slot?.slotKey || "").slice(0, 10);
    const n = Number(slot?.bookedCount) || 0;
    if (!day || n <= 0) continue;
    map.set(day, (map.get(day) || 0) + n);
  }
  return map;
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ inMonth: false, dateKey: null, day: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ inMonth: true, dateKey, day });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ inMonth: false, dateKey: null, day: null });
  }
  return cells;
}

/**
 * Month calendar: day-of-month + total slots booked that day (anonymous). No hours.
 */
function InterviewSlotsCalendar({
  dayBookedCounts = null,
  selectedDateKey,
  onSelectDate,
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
}) {
  const todayKey = useMemo(() => istDateKeyFromDate(new Date()), []);
  const counts =
    dayBookedCounts instanceof Map ? dayBookedCounts : new Map(Object.entries(dayBookedCounts || {}));
  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  return (
    <div className="rounded-xl border border-theme bg-theme-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-theme-primary sm:text-lg">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            className="rounded-lg border border-theme px-2.5 py-1.5 text-sm text-theme-secondary hover:bg-theme-nav"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="rounded-lg border border-theme px-2.5 py-1.5 text-sm text-theme-secondary hover:bg-theme-nav"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-theme-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell, idx) => {
          if (!cell.inMonth) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[3.75rem] rounded-lg bg-theme-input/20 sm:min-h-[4.25rem]"
                aria-hidden
              />
            );
          }

          const booked = Number(counts.get(cell.dateKey)) || 0;
          const isToday = cell.dateKey === todayKey;
          const isSelected = cell.dateKey === selectedDateKey;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate?.(cell.dateKey)}
              className={`flex min-h-[3.75rem] flex-col items-start rounded-lg border p-1.5 text-left transition-colors sm:min-h-[4.25rem] sm:p-2 ${
                isSelected
                  ? "border-theme-accent bg-theme-hero ring-2 ring-theme-accent/35"
                  : "border-theme bg-theme-input/40 hover:border-theme-accent/40 hover:bg-theme-nav/50"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:text-sm ${
                  isToday ? "bg-theme-accent text-white" : "text-theme-primary"
                }`}
              >
                {cell.day}
              </span>
              {booked > 0 ? (
                <span className="mt-auto rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-theme-accent sm:text-[11px]">
                  {booked} booked
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-theme-muted">
        Numbers are total slots booked that day (IST). Tap a day to manage your bookings.
      </p>
    </div>
  );
}

export default InterviewSlotsCalendar;
