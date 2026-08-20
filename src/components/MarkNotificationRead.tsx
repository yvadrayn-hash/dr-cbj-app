"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkNotificationRead({
  notificationId,
}: {
  notificationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAsRead() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markAsRead}
      disabled={loading}
      className="shrink-0 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
    >
      {loading ? "..." : "Mark as Read"}
    </button>
  );
}