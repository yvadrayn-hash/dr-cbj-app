"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ClientOption = {
  id: string;
  name: string;
  email: string;
};

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: string;
};

const emptyItem: LineItem = { description: "", quantity: 1, unitPrice: "" };

export default function InvoiceForm({
  clients,
}: {
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (Number(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
        0
      ),
    [items]
  );
  const total = Math.max(subtotal - (parseFloat(discount) || 0), 0);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function reset() {
    setUserId("");
    setDueDate("");
    setDiscount("0");
    setItems([{ ...emptyItem }]);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dueDate) {
      setError("Please choose a due date.");
      return;
    }

    const payloadItems = items
      .filter((item) => item.description.trim() && parseFloat(item.unitPrice) >= 0)
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
      }));

    if (payloadItems.length === 0) {
      setError("Add at least one line item with a description and price.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || undefined,
          discount: parseFloat(discount) || 0,
          currency: "USD",
          dueDate,
          items: payloadItems,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to create invoice");
      }

      reset();
      setOpen(false);
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
        + New Invoice
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-teal-900">Create New Invoice</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">No linked account</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Line Items *</p>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                placeholder="Description (e.g. Therapy session)"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                className="col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              />
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, { quantity: parseInt(e.target.value) || 1 })
                }
                className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit price"
                value={item.unitPrice}
                onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                className="col-span-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setItems((prev) =>
                    prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
                  )
                }
                disabled={items.length <= 1}
                className="col-span-1 text-red-500 hover:text-red-700 disabled:opacity-30"
                aria-label="Remove line item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
          className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          + Add line item
        </button>
      </div>

      <div className="border-t border-gray-200 pt-4 mb-4 flex justify-end">
        <div className="text-right space-y-1 text-sm">
          <p className="text-gray-600">
            Subtotal:{" "}
            <span className="font-semibold text-gray-800">
              ${subtotal.toFixed(2)}
            </span>
          </p>
          <p className="text-gray-600">
            Discount:{" "}
            <span className="font-semibold text-gray-800">
              -${(parseFloat(discount) || 0).toFixed(2)}
            </span>
          </p>
          <p className="text-base text-teal-900">
            Total:{" "}
            <span className="font-bold">${total.toFixed(2)}</span>
          </p>
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
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary !px-5 !py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Invoice"}
        </button>
      </div>
    </form>
  );
}