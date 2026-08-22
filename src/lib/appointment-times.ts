// Shared appointment availability rules for Dr. CBJ Mental Wellness
// Used by BOTH the client booking form and the admin rescheduling editor so
// availability, working hours, and the one-hour-before-closing rule stay in sync.

/**
 * Working hours per weekday (0 = Sunday … 6 = Saturday).
 * Closing times are inclusive of the last SELECTABLE start time, so the
 * final appointment start is always 60 minutes before closing (1-hour sessions).
 */
export const DAY_HOURS: Record<number, { open: number; close: number } | null> = {
  0: null, // Sunday — closed
  1: { open: 9 * 60, close: 18 * 60 }, // Monday 9:00 AM – 6:00 PM
  2: { open: 9 * 60, close: 18 * 60 }, // Tuesday
  3: { open: 9 * 60, close: 18 * 60 }, // Wednesday
  4: { open: 9 * 60, close: 18 * 60 }, // Thursday
  5: { open: 9 * 60, close: 18 * 60 }, // Friday
  6: { open: 10 * 60, close: 15 * 60 }, // Saturday 10:00 AM – 3:00 PM
};

/** Minimum minutes between the last appointment start and closing (1-hour sessions). */
export const SESSION_LENGTH_MIN = 60;
/** Interval between appointment starts. */
export const SLOT_INTERVAL_MIN = 30;

/** Normalized storage format the DB/API expects (24-hour "HH:MM"). */
export function toStoredTime(label: string): string {
  const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return label;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** 12-hour display format e.g. "9:30 AM". */
export function formatTimeLabel(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** Times (labels) for a given date's working hours, stopping 1h before close. */
export function getAvailableTimeLabels(dayOfWeek: number): string[] {
  const schedule = DAY_HOURS[dayOfWeek];
  if (!schedule) return [];

  const { open, close } = schedule;
  const lastStart = close - SESSION_LENGTH_MIN;

  const labels: string[] = [];
  for (let t = open; t <= lastStart; t += SLOT_INTERVAL_MIN) {
    labels.push(formatTimeLabel(Math.floor(t / 60), t % 60));
  }
  return labels;
}

/**
 * Availability for a specific date string (YYYY-MM-DD), correctly
 * interpreting the date in LOCAL time (not UTC).
 */
export function getDayAvailability(dateString: string): string[] {
  // parse as local date, not UTC
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return getAvailableTimeLabels(date.getDay());
}

/** Whether a 12-hour label matches the stored normalized 24-hour value. */
export function labelMatchesStored(label: string, storedTime: string): boolean {
  // storedTime is "HH:MM" (24-hour). Convert to 12-hour minute-of-day and compare.
  const [h, min] = storedTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return false;
  return label === formatTimeLabel(h, min);
}

/** The complete ordered list of selectable labels (all working days). */
export const ALL_TIME_LABELS = Array.from(new Set([
  ...Object.values(DAY_HOURS)
    .filter((s): s is { open: number; close: number } => s !== null)
    .flatMap((s) => getAvailableTimeLabelsForSchedule(s)),
]));

function getAvailableTimeLabelsForSchedule(schedule: {
  open: number;
  close: number;
}): string[] {
  const { open, close } = schedule;
  const lastStart = close - SESSION_LENGTH_MIN;
  const labels: string[] = [];
  for (let t = open; t <= lastStart; t += SLOT_INTERVAL_MIN) {
    labels.push(formatTimeLabel(Math.floor(t / 60), t % 60));
  }
  return labels;
}