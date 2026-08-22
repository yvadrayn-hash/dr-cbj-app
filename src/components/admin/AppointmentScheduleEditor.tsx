"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import { toStoredTime } from "@/lib/appointment-times";

export default function AppointmentScheduleEditor({
  appointmentId,
  initialDate,
  initialTime,
}: {
  appointmentId: string;
  initialDate: string;
  initialTime: string;
}) {
  const router = useRouter();
  // Label or empty; "" means "use current slot unchanged"
  const [preferredDate, setPreferredDate] = useState(initialDate);
  const [preferredTimeLabel, setPreferredTimeLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  // Load booked times for the selected date. The appointment's OWN current
  // slot is excluded from the booked list so it remains selectable.
  const loadBooked = useCallback(async () => {
    if (!preferredDate) return;
    try {
      const res = await fetch(
        `/api/appointments?date=${encodeURIComponent(preferredDate)}`
      );
      if (res.ok) {
        const data: string[] = await res.json();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (t) => toStoredTime(t) !== toStoredTime(initialTime)
        );
        // Stored times are already normalized HH:MM
        setBookedTimes(
          filtered.map((t) => (t.includes(" ") ? toStoredTime(t) : t))
        );
      } else {
        setBookedTimes([]);
      }
      setMessage("");
    } catch {
      setBookedTimes([]);
    }
  }, [preferredDate, initialTime]);

  useEffect(() => {
    void loadBooked();
  }, [loadBooked]);

  async function saveSchedule() {
    setSaving(true);
    setMessage("");

    const finalTime = preferredTimeLabel
      ? toStoredTime(preferredTimeLabel)
      : initialTime;

    try {
      const response = await fetch(
        `/api/admin/appointments/${appointmentId}/schedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredDate, preferredTime: finalTime }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update schedule");
      }

      setMessage("Saved");
      setPreferredTimeLabel("");
      router.refresh();
      void loadBooked();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not update appointment"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label-field">Appointment Date</label>
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="label-field">
          {preferredTimeLabel ? "New Time" : "Current Time"}
        </label>
        <p className="text-sm text-gray-600 mb-2">
          Current slot:{" "}
          <span className="font-semibold">{initialTime}</span>
          {preferredTimeLabel && (
            <>
              {" "}
              → <span className="font-semibold">{preferredTimeLabel}</span>
            </>
          )}
        </p>

        <TimeSlotPicker
          date={preferredDate}
          value={preferredTimeLabel}
          onChange={setPreferredTimeLabel}
          excludeTime={bookedTimes}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={saveSchedule}
          disabled={saving}
          className="btn-primary !px-4 !py-2 text-sm min-h-[44px] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Date & Time"}
        </button>

        {message && <span className="text-sm text-gray-500">{message}</span>}
      </div>
    </div>
  );
}