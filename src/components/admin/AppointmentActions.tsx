"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export default function AppointmentActions({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: AppointmentStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(status: AppointmentStatus) {
    setLoading(status);

    try {
      const response = await fetch(
        `/api/admin/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }

      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus !== "CONFIRMED" && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateStatus("CONFIRMED")}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {loading === "CONFIRMED" ? "Updating..." : "Confirm"}
        </button>
      )}

      {currentStatus !== "COMPLETED" && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateStatus("COMPLETED")}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading === "COMPLETED" ? "Updating..." : "Complete"}
        </button>
      )}

      {currentStatus !== "CANCELLED" && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateStatus("CANCELLED")}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading === "CANCELLED" ? "Updating..." : "Cancel"}
        </button>
      )}
    </div>
  );
}