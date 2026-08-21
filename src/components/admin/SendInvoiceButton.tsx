"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SendInvoiceButton({
  invoiceId,
  recipientLabel,
  currentStatus = "DRAFT",
}: {
  invoiceId: string;
  /** Human-readable recipient shown in the confirmation hint */
  recipientLabel: string;
  currentStatus?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isResend = currentStatus === "SENT";

  async function handleSend() {
    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SENT", send: true }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to send invoice");
      }

      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`btn-primary !px-4 !py-2 text-sm ${isResend ? "!bg-teal-700" : ""}`}
      >
        {isResend ? "Resend Invoice" : "Send Invoice"}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="text-sm text-amber-900 mb-3">
        {isResend ? "Resend" : "Send"} this invoice to{" "}
        <strong>{recipientLabel}</strong> by email? This marks the invoice as
        Sent and emails the billing contact. Nothing is ever sent
        automatically.
      </p>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50"
        >
          {sending ? "Sending..." : isResend ? "Yes, Resend" : "Yes, Send Invoice"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={sending}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}