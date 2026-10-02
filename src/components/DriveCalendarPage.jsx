import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaPlus, FaTrash, FaBell } from "react-icons/fa";
import { useAuth } from "../utils/AuthContext";
import { driveCalendarAPI } from "../utils/api";
import { useTenantShell } from "../context/TenantShellContext.jsx";
import InterviewSlotsCalendar, {
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

const TYPE_OPTIONS = [
  { id: "visit", label: "Visit / drive" },
  { id: "deadline", label: "Deadline" },
  { id: "note", label: "Note" },
];

const REMINDER_KIND_OPTIONS = [
  { id: "none", label: "No reminder" },
  { id: "day_of", label: "On the day" },
  { id: "day_before", label: "Day before" },
  { id: "week_before", label: "A week before" },
  { id: "custom", label: "Custom (tell us what you need)" },
];

const REMINDER_CHANNEL_OPTIONS = [
  { id: "in_app", label: "In-app notification" },
  { id: "email", label: "Email" },
  { id: "both", label: "In-app and email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "sms", label: "SMS / message" },
];

function pad2(n) {
  return String(n).padStart(2, "0");
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

function reminderKindLabel(kind) {
  return REMINDER_KIND_OPTIONS.find((o) => o.id === kind)?.label || kind || "No reminder";
}

function reminderChannelLabel(channel) {
  return (
    REMINDER_CHANNEL_OPTIONS.find((o) => o.id === channel)?.label || channel || "In-app notification"
  );
}

function needsPhone(channel) {
  return channel === "whatsapp" || channel === "sms";
}

function typeBadgeClass(type) {
  if (type === "deadline") return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (type === "note") return "border-theme bg-theme-hero text-theme-secondary";
  return "border-theme-accent/30 bg-theme-accent/10 text-theme-accent";
}

function monthRangeKeys(year, month) {
  const from = `${year}-${pad2(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${pad2(month)}-${pad2(lastDay)}`;
  return { from, to };
}

function emptyForm(dateKey) {
  return {
    type: "visit",
    title: "",
    companyName: "",
    notes: "",
    dateKey: dateKey || istDateKeyFromDate(),
    timeLabel: "",
    checklistText: "",
    reminderKind: "none",
    reminderChannel: "in_app",
    reminderPhone: "",
    reminderNote: "",
  };
}

export default function DriveCalendarPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { appPath } = useTenantShell();

  const todayParts = useMemo(() => {
    const key = istDateKeyFromDate(new Date());
    const p = parseDateKey(key);
    return p || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  }, []);

  const [viewYear, setViewYear] = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.month);
  const [selectedDateKey, setSelectedDateKey] = useState(istDateKeyFromDate(new Date()));
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => emptyForm(istDateKeyFromDate()));
  const [highlightId, setHighlightId] = useState("");

  const loadEntries = useCallback(async () => {
    if (!user?.userId && !user?._id) return;
    setLoading(true);
    setError("");
    try {
      const { from, to } = monthRangeKeys(viewYear, viewMonth);
      const { data } = await driveCalendarAPI.list({ from, to });
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || d?.message || err?.message || "Could not load calendar.");
    } finally {
      setLoading(false);
    }
  }, [user?.userId, user?._id, viewYear, viewMonth]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    const entryId = searchParams.get("entryId");
    const dateKey = searchParams.get("date");
    if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      setSelectedDateKey(dateKey);
      const p = parseDateKey(dateKey);
      if (p) {
        setViewYear(p.year);
        setViewMonth(p.month);
      }
    }
    if (entryId) setHighlightId(entryId);
  }, [searchParams]);

  const dayCounts = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      const k = e.dateKey;
      if (!k) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [entries]);

  const dayEntries = useMemo(
    () => entries.filter((e) => e.dateKey === selectedDateKey),
    [entries, selectedDateKey]
  );

  const onPrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else setViewMonth((m) => m - 1);
  };

  const onNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else setViewMonth((m) => m + 1);
  };

  const openAddForm = () => {
    setForm(emptyForm(selectedDateKey));
    setShowForm(true);
  };

  const submitEntry = async (e) => {
    e.preventDefault();
    setBusyId("create");
    setError("");
    try {
      const checklist = String(form.checklistText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((text) => ({ text, done: false }));

      if (form.reminderKind === "custom" && String(form.reminderNote || "").trim().length < 3) {
        setError("Add a short note describing the custom reminder you need.");
        return;
      }
      if (
        form.reminderKind !== "none" &&
        needsPhone(form.reminderChannel) &&
        String(form.reminderPhone || "").replace(/\D/g, "").length < 10
      ) {
        setError("Enter a valid phone number (at least 10 digits) for WhatsApp / SMS.");
        return;
      }

      const { data } = await driveCalendarAPI.create({
        type: form.type,
        title: form.title,
        companyName: form.companyName,
        notes: form.notes,
        dateKey: form.dateKey || selectedDateKey,
        timeLabel: form.timeLabel,
        checklist,
        reminder: {
          kind: form.reminderKind || "none",
          channel: form.reminderKind === "none" ? "in_app" : form.reminderChannel || "in_app",
          phone:
            form.reminderKind === "none" || !needsPhone(form.reminderChannel)
              ? ""
              : String(form.reminderPhone || "").trim(),
          note: form.reminderKind === "none" ? "" : String(form.reminderNote || "").trim(),
        },
      });
      setShowForm(false);
      setForm(emptyForm(selectedDateKey));
      if (data?.entry?.dateKey) setSelectedDateKey(data.entry.dateKey);
      await loadEntries();
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || d?.errors?.[0] || d?.message || err?.message || "Could not save.");
    } finally {
      setBusyId("");
    }
  };

  const removeEntry = async (entryId) => {
    if (!window.confirm("Delete this calendar entry?")) return;
    setBusyId(entryId);
    setError("");
    try {
      await driveCalendarAPI.remove(entryId);
      await loadEntries();
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || err?.message || "Could not delete.");
    } finally {
      setBusyId("");
    }
  };

  const toggleItem = async (entryId, itemId, done) => {
    setBusyId(`${entryId}:${itemId}`);
    try {
      const { data } = await driveCalendarAPI.toggleChecklist(entryId, { itemId, done: !done });
      if (data?.entry) {
        setEntries((prev) => prev.map((e) => (e.id === entryId ? data.entry : e)));
      }
    } catch (err) {
      const d = err?.response?.data;
      setError(d?.error || err?.message || "Could not update checklist.");
    } finally {
      setBusyId("");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-theme-secondary">
        Loading…
      </div>
    );
  }

  return (
    <div className={pageShellOuterClassCompact}>
      <PageHeroFontStyles />
      <div className={pageShellInnerClass}>
        <PageBackNavRow>
          <PageBackButton onClick={() => navigate(appPath("/"))} label="Back" />
        </PageBackNavRow>

        <PageHeroHeader subtitle="Log campus visits, deadlines, and eligibility checklists yourself. Choose reminder timing and channel — we’ll save it and send notifications manually for now.">
          Drive{" "}
          <span className="italic text-theme-accent">calendar</span>
        </PageHeroHeader>

        <div className="mx-auto max-w-5xl space-y-5">
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <InterviewSlotsCalendar
              dayBookedCounts={dayCounts}
              selectedDateKey={selectedDateKey}
              onSelectDate={(key) => {
                setSelectedDateKey(key);
                setShowForm(false);
              }}
              viewYear={viewYear}
              viewMonth={viewMonth}
              onPrevMonth={onPrevMonth}
              onNextMonth={onNextMonth}
              countSuffix="items"
              footerHint="Counts are your entries that day (IST). Tap a day to add visits, deadlines, or checklists."
            />

            <section className="rounded-xl border border-theme bg-theme-card p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-theme-primary">
                    {formatSelectedDayLabel(selectedDateKey)}
                  </h2>
                  <p className="text-xs text-theme-secondary">
                    {dayEntries.length} entr{dayEntries.length === 1 ? "y" : "ies"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddForm}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-theme-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <FaPlus className="h-3 w-3" />
                  Add entry
                </button>
              </div>

              {showForm ? (
                <form
                  onSubmit={submitEntry}
                  className="rounded-xl border border-theme bg-theme-hero/60 p-3 space-y-3"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-theme-primary">
                      Type
                      <select
                        value={form.type}
                        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal"
                      >
                        {TYPE_OPTIONS.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-theme-primary">
                      Date (IST)
                      <input
                        type="date"
                        value={form.dateKey}
                        onChange={(e) => setForm((f) => ({ ...f, dateKey: e.target.value }))}
                        required
                        className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-theme-primary">
                    Title
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      required
                      maxLength={160}
                      placeholder="e.g. Amazon OA deadline / Infosys visit"
                      className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-theme-primary">
                    Company (optional)
                    <input
                      value={form.companyName}
                      onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                      maxLength={160}
                      className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-theme-primary">
                    Time label (optional)
                    <input
                      value={form.timeLabel}
                      onChange={(e) => setForm((f) => ({ ...f, timeLabel: e.target.value }))}
                      placeholder="e.g. 10:00 AM"
                      maxLength={64}
                      className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-theme-primary">
                    Eligibility checklist (one item per line)
                    <textarea
                      value={form.checklistText}
                      onChange={(e) => setForm((f) => ({ ...f, checklistText: e.target.value }))}
                      rows={3}
                      placeholder={"CGPA ≥ 7.5\nNo active backlogs\nResume uploaded"}
                      className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal resize-y"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-theme-primary">
                    What kind of reminder do you need?
                    <select
                      value={form.reminderKind}
                      onChange={(e) => setForm((f) => ({ ...f, reminderKind: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal"
                    >
                      {REMINDER_KIND_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {form.reminderKind !== "none" ? (
                    <>
                      <label className="block text-xs font-semibold text-theme-primary">
                        Reminder channel
                        <select
                          value={form.reminderChannel}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, reminderChannel: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal"
                        >
                          {REMINDER_CHANNEL_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {needsPhone(form.reminderChannel) ? (
                        <label className="block text-xs font-semibold text-theme-primary">
                          Phone number
                          <input
                            type="tel"
                            value={form.reminderPhone}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, reminderPhone: e.target.value }))
                            }
                            required
                            inputMode="tel"
                            placeholder="e.g. +91 98XXXXXXXX"
                            maxLength={20}
                            className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal"
                          />
                          <span className="mt-1 block text-[11px] font-normal text-theme-secondary">
                            Used for WhatsApp / SMS reminders (saved only; sent manually for now).
                          </span>
                        </label>
                      ) : null}
                      <label className="block text-xs font-semibold text-theme-primary">
                        Reminder note{form.reminderKind === "custom" ? " (required)" : " (optional)"}
                        <textarea
                          value={form.reminderNote}
                          onChange={(e) => setForm((f) => ({ ...f, reminderNote: e.target.value }))}
                          rows={2}
                          maxLength={400}
                          required={form.reminderKind === "custom"}
                          placeholder={
                            form.reminderKind === "custom"
                              ? "e.g. Remind me the morning of OA with portal link"
                              : "Anything else we should know when reminding you…"
                          }
                          className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal resize-y"
                        />
                        <span className="mt-1 block text-[11px] font-normal text-theme-secondary">
                          Kind + channel are saved for now — notifications will be sent manually.
                        </span>
                      </label>
                    </>
                  ) : null}
                  <label className="block text-xs font-semibold text-theme-primary">
                    Notes
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-theme bg-theme-card px-2 py-2 text-sm font-normal resize-y"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={busyId === "create" || form.title.trim().length < 2}
                      className="rounded-xl bg-theme-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {busyId === "create" ? "Saving…" : "Save entry"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {loading ? (
                <p className="text-sm text-theme-secondary">Loading…</p>
              ) : dayEntries.length === 0 && !showForm ? (
                <div className="rounded-xl border border-dashed border-theme px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-theme-primary">Nothing on this day</p>
                  <p className="mt-1 text-sm text-theme-secondary">
                    Add a visit, deadline, or checklist yourself.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {dayEntries.map((entry) => (
                    <li
                      key={entry.id}
                      id={`drive-entry-${entry.id}`}
                      className={`rounded-xl border p-3 space-y-2 ${
                        highlightId === entry.id
                          ? "border-theme-accent ring-2 ring-theme-accent/30"
                          : "border-theme"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeBadgeClass(
                              entry.type
                            )}`}
                          >
                            {entry.type}
                          </span>
                          <h3 className="mt-1 text-sm font-semibold text-theme-primary break-words">
                            {entry.title}
                          </h3>
                          {entry.companyName ? (
                            <p className="text-xs text-theme-secondary">{entry.companyName}</p>
                          ) : null}
                          {entry.timeLabel ? (
                            <p className="text-xs text-theme-secondary">{entry.timeLabel}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={busyId === entry.id}
                          onClick={() => removeEntry(entry.id)}
                          className="rounded-lg border border-theme p-2 text-theme-secondary hover:text-red-500 disabled:opacity-50"
                          aria-label="Delete"
                        >
                          <FaTrash className="h-3 w-3" />
                        </button>
                      </div>

                      {entry.notes ? (
                        <p className="text-xs text-theme-secondary whitespace-pre-wrap">{entry.notes}</p>
                      ) : null}

                      {entry.checklist?.length > 0 ? (
                        <ul className="space-y-1">
                          {entry.checklist.map((item) => (
                            <li key={item.id}>
                              <label className="flex items-start gap-2 text-xs text-theme-primary cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.done)}
                                  disabled={busyId === `${entry.id}:${item.id}`}
                                  onChange={() => toggleItem(entry.id, item.id, item.done)}
                                  className="mt-0.5"
                                />
                                <span className={item.done ? "line-through text-theme-secondary" : ""}>
                                  {item.text}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {entry.reminder?.kind && entry.reminder.kind !== "none" ? (
                        <p className="flex items-start gap-1.5 text-[11px] text-theme-secondary">
                          <FaBell className="mt-0.5 h-2.5 w-2.5 shrink-0 text-theme-accent" />
                          <span>
                            Reminder: {reminderKindLabel(entry.reminder.kind)}
                            {" · "}
                            {reminderChannelLabel(entry.reminder.channel)}
                            {entry.reminder.phone ? ` · ${entry.reminder.phone}` : ""}
                            {entry.reminder.note ? ` — ${entry.reminder.note}` : ""}
                            <span className="capitalize"> · {entry.reminder.status || "requested"}</span>
                          </span>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
