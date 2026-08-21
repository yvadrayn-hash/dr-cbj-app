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
          className="min-h-[40px] whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {loading === "CONFIRMED" ? "Updating..." : "Confirm"}
        </button>
      )}

      {currentStatus !== "COMPLETED" && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateStatus("COMPLETED")}
          className="min-h-[40px] whitespace-nowrap rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {loading === "COMPLETED" ? "Updating..." : "Complete"}
        </button>
      )}

      {currentStatus !== "CANCELLED" && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => updateStatus("CANCELLED")}
          className="min-h-[40px] whitespace-nowrap rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {loading === "CANCELLED" ? "Updating..." : "Cancel"}
        </button>
      )}
    </div>
  );
}