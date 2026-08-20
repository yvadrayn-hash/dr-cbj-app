"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNotesEditor({
  appointmentId,
  initialNotes,
}: {
  appointmentId: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveNotes() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/appointments/${appointmentId}/notes`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminNotes: notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save admin notes");
      }

      setMessage("Saved");
      router.refresh();
    } catch {
      setMessage("Could not save notes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        className="input-field w-full"
        placeholder="Add private admin notes..."
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={saveNotes}
          disabled={saving}
          className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Notes"}
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