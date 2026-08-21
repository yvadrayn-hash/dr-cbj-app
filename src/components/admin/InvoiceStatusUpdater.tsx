"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

const statusOptions: { value: InvoiceStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function InvoiceStatusUpdater({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string;
  currentStatus: InvoiceStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<InvoiceStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update status");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || status === currentStatus}
          className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Updating..." : "Update Status"}
        </button>
      </div>

      {status === "SENT" && currentStatus !== "SENT" && (
        <p className="mt-2 text-xs text-gray-500">
          Marking as Sent will notify the client by email and in-app
          notification.
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}