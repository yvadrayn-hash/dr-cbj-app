"use client";

import { useEffect, useState } from "react";
import {
  getDayAvailability,
  labelMatchesStored,
} from "@/lib/appointment-times";

export default function TimeSlotPicker({
  date,
  value,
  onChange,
  excludeTime,
}: {
  date: string;
  value: string;
  onChange: (label: string) => void;
  /** Optional booked times (24-hour "HH:MM") already taken for this date */
  excludeTime?: string[];
}) {
  const [booked, setBooked] = useState<string[]>(excludeTime ?? []);
  const [prevDate, setPrevDate] = useState<string>(date);

  const baseSlots = date ? getDayAvailability(date) : [];
  const slots = baseSlots.filter(
    (label) =>
      !booked.some(
        (stored) => labelMatchesStored(label, stored)
      )
  );

  // Refresh booked times whenever the date or exclude list changes.
  // Only clear the selection when the date actually changes (not on mount,
  // so an initial value like the admin's current slot is preserved).
  useEffect(() => {
    setBooked(excludeTime ?? []);
    if (date !== prevDate) {
      onChange("");
      setPrevDate(date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, excludeTime]);

  if (!date) {
    return (
      <p className="text-sm text-gray-500 py-2">
        Select a date to see available times.
      </p>
    );
  }

  if (slots.length === 0) {
    // No working hours (e.g. Sunday) vs all booked
    const isClosed = baseSlots.length === 0;
    return (
      <p className="text-sm text-amber-700 py-2">
        {isClosed
          ? "Dr. CBJ's office is closed on this day."
          : "No appointment times are available on this date. Please choose another date."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {slots.map((label) => {
        const selected = value === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            aria-pressed={selected}
            className={`rounded-lg border-2 px-3 py-2.5 text-sm font-semibold text-center transition-colors min-h-[44px] ${
              selected
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-gray-200 text-teal-900 hover:border-teal-400 hover:bg-teal-50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}