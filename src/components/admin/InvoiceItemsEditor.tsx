"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export default function InvoiceItemsEditor({
  invoiceId,
  items,
}: {
  invoiceId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ description: "", quantity: 1, unitPrice: "" });
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, unitPrice: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Request failed");
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditDraft({
      description: item.description,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    const ok = await request(`/api/admin/invoices/${invoiceId}/items`, "PATCH", {
      itemId: editingId,
      description: editDraft.description.trim(),
      quantity: Number(editDraft.quantity) || 1,
      unitPrice: parseFloat(editDraft.unitPrice) || 0,
    });
    if (ok) setEditingId(null);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const ok = await request(`/api/admin/invoices/${invoiceId}/items`, "POST", {
      description: newItem.description.trim(),
      quantity: Number(newItem.quantity) || 1,
      unitPrice: parseFloat(newItem.unitPrice) || 0,
    });
    if (ok) setNewItem({ description: "", quantity: 1, unitPrice: "" });
  }

  async function deleteItem(itemId: string) {
    await request(`/api/admin/invoices/${invoiceId}/items`, "DELETE", { itemId });
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Qty</th>
              <th className="py-2 pr-4">Unit Price</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                {editingId === item.id ? (
                  <>
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        value={editDraft.description}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, description: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        min="1"
                        value={editDraft.quantity}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            quantity: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editDraft.unitPrice}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, unitPrice: e.target.value }))
                        }
                        className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 pr-4 text-gray-400">—</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={busy}
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={busy}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 pr-4">{item.description}</td>
                    <td className="py-3 pr-4">{item.quantity}</td>
                    <td className="py-3 pr-4">${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="py-3 pr-4 font-semibold text-teal-900">
                      ${Number(item.amount).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          disabled={busy}
                          className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          disabled={busy || items.length <= 1}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addItem} className="mt-4 grid grid-cols-12 gap-2 items-center">
        <input
          type="text"
          placeholder="New item description"
          value={newItem.description}
          onChange={(e) => setNewItem((n) => ({ ...n, description: e.target.value }))}
          required
          className="col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
        <input
          type="number"
          min="1"
          value={newItem.quantity}
          onChange={(e) =>
            setNewItem((n) => ({ ...n, quantity: parseInt(e.target.value) || 1 }))
          }
          className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Unit price"
          value={newItem.unitPrice}
          onChange={(e) => setNewItem((n) => ({ ...n, unitPrice: e.target.value }))}
          required
          className="col-span-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="col-span-1 rounded-lg bg-teal-600 px-2 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}