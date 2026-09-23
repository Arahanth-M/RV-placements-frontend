export const MIN_STUDY_SLOT_MINUTES = 30;
export const MAX_STUDY_SLOTS_PER_DAY = 6;

export function dayMinutesFromHours(hoursPerDay) {
  const hours = Number(hoursPerDay);
  if (!Number.isFinite(hours) || hours < 0.5) return MIN_STUDY_SLOT_MINUTES;
  return Math.max(MIN_STUDY_SLOT_MINUTES, Math.round(hours * 60));
}

export function formatStudyDuration(minutes) {
  const mins = Math.max(1, Math.round(Number(minutes) || 0));
  if (mins % 60 === 0) {
    const hours = mins / 60;
    return hours === 1 ? "1h" : `${hours}h`;
  }
  if (mins > 60) {
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  }
  return `${mins} min`;
}

export function studyScheduleLabel({ style, slotsPerDay, slotMinutes }) {
  if (style === "stretch" || Number(slotsPerDay) === 1) {
    return `One stretch · ${formatStudyDuration(slotMinutes)}`;
  }
  return `${slotsPerDay} slots · ${formatStudyDuration(slotMinutes)} each`;
}

/** Even splits of the day's hours. Stretch is always first. */
export function listStudyScheduleOptions(hoursPerDay) {
  const dayMinutes = dayMinutesFromHours(hoursPerDay);
  const options = [
    {
      id: `stretch-${dayMinutes}`,
      style: "stretch",
      slotsPerDay: 1,
      slotMinutes: dayMinutes,
      label: studyScheduleLabel({
        style: "stretch",
        slotsPerDay: 1,
        slotMinutes: dayMinutes,
      }),
      detail: "Study the day's hours in a single sitting.",
    },
  ];
  for (let slots = 2; slots <= MAX_STUDY_SLOTS_PER_DAY; slots += 1) {
    if (dayMinutes % slots !== 0) continue;
    const slotMinutes = dayMinutes / slots;
    if (slotMinutes < MIN_STUDY_SLOT_MINUTES) break;
    options.push({
      id: `batches-${slots}x${slotMinutes}`,
      style: "batches",
      slotsPerDay: slots,
      slotMinutes,
      label: studyScheduleLabel({
        style: "batches",
        slotsPerDay: slots,
        slotMinutes,
      }),
      detail: `Split each day into ${slots} focused blocks.`,
    });
  }
  return options;
}
