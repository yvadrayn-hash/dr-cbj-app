"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [preferredDate, setPreferredDate] = useState(initialDate);
  const [preferredTime, setPreferredTime] = useState(initialTime);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveSchedule() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/appointments/${appointmentId}/schedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferredDate,
            preferredTime,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      setMessage("Saved");
      router.refresh();
    } catch {
      setMessage("Could not update appointment");
    } finally {
      setSaving(false);
    }
  }

  return (
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

      <div>
        <label className="label-field">Appointment Time</label>
        <input
          type="time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="button"
          onClick={saveSchedule}
          disabled={saving}
          className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Date and Time"}
        </button>

        {message && (
          <span className="text-sm text-gray-500">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}