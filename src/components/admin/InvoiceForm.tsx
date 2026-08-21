"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ClientOption = { id: string; name: string; email: string };

type CompanyOption = {
  id: string;
  companyName: string;
  employees: { id: string; name: string; email: string }[];
};

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: string;
  employeeId: string;
  sessionDate: string;
  serviceType: string;
  note: string;
};

const emptyItem = (): LineItem => ({
  description: "",
  quantity: 1,
  unitPrice: "",
  employeeId: "",
  sessionDate: "",
  serviceType: "Therapy Session",
  note: "",
});

export default function InvoiceForm({
  clients,
  companies,
  preselectCompanyId,
}: {
  clients: ClientOption[];
  companies: CompanyOption[];
  preselectCompanyId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "individual" bills one client; "corporate" bills a company
  const [mode, setMode] = useState<"individual" | "corporate">(
    preselectCompanyId ? "corporate" : "individual"
  );
  const [userId, setUserId] = useState("");
  const [companyId, setCompanyId] = useState(preselectCompanyId ?? "");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  // Explicit admin choice: false = Save as Draft (no email, admin-only);
  // true = Send Invoice (status SENT + email to recipient)
  const [send, setSend] = useState(false);

  const selectedCompany = companies.find((c) => c.id === companyId);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (Number(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
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
    setMode(preselectCompanyId ? "corporate" : "individual");
    setUserId("");
    setCompanyId(preselectCompanyId ?? "");
    setDueDate("");
    setDiscount("0");
    setItems([emptyItem()]);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent, sendNow: boolean) {
    e.preventDefault();
    setError(null);
    setSend(sendNow);

    if (!dueDate) {
      setError("Please choose a due date.");
      return;
    }

    if (mode === "corporate" && !companyId) {
      setError("Please select a company for a corporate invoice.");
      return;
    }

    const payloadItems = items
      .filter(
        (item) =>
          item.description.trim() && parseFloat(item.unitPrice) >= 0
      )
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        employeeId:
          mode === "corporate" && item.employeeId ? item.employeeId : undefined,
        sessionDate: mode === "corporate" && item.sessionDate ? item.sessionDate : undefined,
        serviceType:
          mode === "corporate" && item.serviceType.trim()
            ? item.serviceType.trim()
            : undefined,
        note: mode === "corporate" && item.note.trim() ? item.note.trim() : undefined,
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
          userId: mode === "individual" && userId ? userId : undefined,
          companyId: mode === "corporate" ? companyId : undefined,
          discount: parseFloat(discount) || 0,
          currency: "USD",
          dueDate,
          items: payloadItems,
          send: sendNow,
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
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className="card w-full"
    >
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

      {/* Recipient type */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode("individual")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold border transition-colors ${
            mode === "individual"
              ? "bg-teal-600 text-white border-teal-600"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Individual Client
        </button>
        <button
          type="button"
          onClick={() => setMode("corporate")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold border transition-colors ${
            mode === "corporate"
              ? "bg-teal-600 text-white border-teal-600"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Company (Corporate)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {mode === "individual" ? (
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
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company *
            </label>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                // Reset employee selections that belong to another company
                const nextCompany = companies.find((c) => c.id === e.target.value);
                setItems((prev) =>
                  prev.map((item) =>
                    nextCompany &&
                    nextCompany.employees.some((emp) => emp.id === item.employeeId)
                      ? item
                      : { ...item, employeeId: "" }
                  )
                );
              }}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName} ({company.employees.length} employees)
                </option>
              ))}
            </select>
          </div>
        )}

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
        <p className="text-sm font-medium text-gray-700 mb-2">
          {mode === "corporate"
            ? "Sessions by Employee *"
            : "Line Items *"}
        </p>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 p-3 space-y-2"
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                {mode === "corporate" && (
                  <select
                    value={item.employeeId}
                    onChange={(e) => updateItem(index, { employeeId: e.target.value })}
                    className="col-span-12 sm:col-span-4 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">Employee (optional)</option>
                    {(selectedCompany?.employees ?? []).map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder={
                    mode === "corporate"
                      ? "Service (e.g. Therapy Session)"
                      : "Description (e.g. Therapy session)"
                  }
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  className={`${mode === "corporate" ? "col-span-8 sm:col-span-5" : "col-span-6"} rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none`}
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
                  placeholder="Rate"
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

              {mode === "corporate" && (
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6 sm:col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">
                      Session Date
                    </label>
                    <input
                      type="date"
                      value={item.sessionDate}
                      onChange={(e) =>
                        updateItem(index, { sessionDate: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">
                      Service Type
                    </label>
                    <input
                      type="text"
                      value={item.serviceType}
                      onChange={(e) =>
                        updateItem(index, { serviceType: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">
                      Billing Note (no clinical details)
                    </label>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateItem(index, { note: e.target.value })}
                      maxLength={120}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
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
            Total: <span className="font-bold">${total.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          onClick={(e) => handleSubmit(e, false)}
          disabled={saving}
          className="min-h-[44px] rounded-lg border border-teal-600 px-5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
        >
          {saving && !send ? "Saving..." : "Save as Draft"}
        </button>

        <button
          type="submit"
          onClick={(e) => handleSubmit(e, true)}
          disabled={saving}
          className="btn-primary !px-5 !py-2 text-sm min-h-[44px] disabled:opacity-50"
        >
          {saving && send ? "Sending..." : "Send Invoice"}
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Save as Draft keeps the invoice admin-only and sends no email. Send
        Invoice marks it SENT and emails the recipient immediately.
      </p>
    </form>
  );
}