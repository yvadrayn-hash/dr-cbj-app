"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  total: number;
  dueDate: string;
  status: string;
  description?: string | null;
};

export default function PayInvoiceForm({
  invoice,
  amountPaid,
  balanceDue,
}: {
  invoice: InvoiceSummary;
  amountPaid: number;
  balanceDue: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(balanceDue.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a payment amount greater than 0.");
      return;
    }

    if (parsedAmount > balanceDue + 0.001) {
      setError(`Amount cannot exceed the balance due of $${balanceDue.toFixed(2)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          paymentMethod,
          reference: reference.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit payment");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
        Thank you! Your payment of{" "}
        <span className="font-semibold">${parseFloat(amount).toFixed(2)}</span>{" "}
        for invoice {invoice.invoiceNumber} has been submitted and is pending
        confirmation by our office. You can track its status in the payment
        history below.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm text-gray-600 mb-4">
        Online card processing is coming soon. Submit your payment details below
        (e.g. after a bank transfer) and our office will verify and confirm it.
        Amount paid so far:{" "}
        <span className="font-semibold text-green-700">
          ${amountPaid.toFixed(2)}
        </span>
        .
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($) *
          </label>
          <input
            type="number"
            min="0.01"
            max={balanceDue}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
            <option value="CASH">Cash</option>
            <option value="MANUAL">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference / Note (optional)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. transfer confirmation #"
            maxLength={120}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary !px-5 !py-2 text-sm disabled:opacity-50"
      >
        {submitting ? "Submitting..." : `Submit Payment ($${parseFloat(amount || "0").toFixed(2)})`}
      </button>
    </form>
  );
}