"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentForm({
  invoiceId,
  remaining,
}: {
  invoiceId: string;
  remaining: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(remaining > 0 ? remaining.toFixed(2) : "");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CARD" | "PAYPAL" | "PAYONEER" | "OTHER">("CASH");
  const [status, setStatus] = useState("COMPLETED");
  const [transactionReference, setTransactionReference] = useState("");
  const [methodNote, setMethodNote] = useState("");

  const paymentMethodOptions = [
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CARD", label: "Card" },
    { value: "PAYPAL", label: "PayPal" },
    { value: "PAYONEER", label: "Payoneer" },
    { value: "OTHER", label: "Other" },
  ];

  const otherPaymentMethods = ["PAYPAL", "PAYONEER", "OTHER"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a payment amount greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          paymentMethod,
          status,
          transactionReference: transactionReference.trim() || undefined,
          methodNote: methodNote.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to record payment");
      }

      setOpen(false);
      setTransactionReference("");
      setMethodNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary !px-4 !py-2 text-sm"
      >
        + Record Payment
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-teal-900">Record Payment</h3>
        <p className="text-sm text-gray-500">
          Remaining balance:{" "}
          <span className="font-semibold text-teal-900">
            ${remaining.toFixed(2)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($) *
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method *
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            {paymentMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {otherPaymentMethods.includes(paymentMethod) && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method Note (optional)
            </label>
            <input
              type="text"
              value={methodNote}
              onChange={(e) => setMethodNote(e.target.value)}
              placeholder={`e.g. ${paymentMethod === "PAYPAL" ? "PayPal invoice #12345" : paymentMethod === "PAYONEER" ? "Payoneer reference" : "Additional details"}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Reference (optional)
          </label>
          <input
            type="text"
            value={transactionReference}
            onChange={(e) => setTransactionReference(e.target.value)}
            placeholder="Auto-generated if left blank"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary !px-5 !py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Recording..." : "Record Payment"}
        </button>
      </div>
    </form>
  );
}