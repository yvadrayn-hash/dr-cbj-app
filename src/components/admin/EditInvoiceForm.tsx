"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ClientOption = { id: string; name: string; email: string };
type CompanyOption = { id: string; companyName: string };
type EmployeeOption = { id: string; name: string };
type AppointmentOption = { id: string; ownerId: string | null; label: string };

type ItemDraft = {
  description: string;
  quantity: number;
  unitPrice: string;
  employeeId: string;
  sessionDate: string;
  serviceType: string;
  note: string;
  appointmentId: string;
};

const emptyItem = (): ItemDraft => ({
  description: "",
  quantity: 1,
  unitPrice: "",
  employeeId: "",
  sessionDate: "",
  serviceType: "Therapy Session",
  note: "",
  appointmentId: "",
});

// NOTE: "SENT" is intentionally NOT editable here. Sending an invoice is a
// separate, explicit "Send Invoice" action — editing must never send.
const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function EditInvoiceForm({
  invoiceId,
  initial,
  clients,
  companies,
  employees,
  appointmentOptions,
}: {
  invoiceId: string;
  initial: {
    userId: string;
    companyId: string;
    status: string;
    description: string;
    dueDate: string;
    discount: string;
    currency: string;
    items: ItemDraft[];
  };
  clients: ClientOption[];
  companies: CompanyOption[];
  /** Employees of the invoiced company (corporate invoices) */
  employees: EmployeeOption[];
  /** Sessions available to link to line items, tagged by owner */
  appointmentOptions: AppointmentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"client" | "company">(
    initial.companyId ? "company" : "client"
  );
  const [userId, setUserId] = useState(initial.userId);
  const [companyId, setCompanyId] = useState(initial.companyId);
  const [status, setStatus] = useState(initial.status);
  const [description, setDescription] = useState(initial.description);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [discount, setDiscount] = useState(initial.discount);
  const [currency, setCurrency] = useState(initial.currency);
  const [items, setItems] = useState<ItemDraft[]>(initial.items);

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

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  // Appointments linkable to a line item depend on the current recipient
  const relevantOwnerIds = useMemo(() => {
    if (mode === "company") {
      return employees.map((e) => e.id);
    }
    return userId ? [userId] : [];
  }, [mode, userId, employees]);

  const linkableAppointments = appointmentOptions.filter((appt) =>
    appt.ownerId ? relevantOwnerIds.includes(appt.ownerId) : false
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dueDate) {
      setError("Please choose a due date.");
      return;
    }

    if (mode === "company" && !companyId) {
      setError("Please select a company.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: mode === "client" ? userId || null : null,
          companyId: mode === "company" ? companyId || null : null,
          status,
          description: description.trim() || null,
          dueDate,
          discount: parseFloat(discount) || 0,
          currency: currency.trim() || "USD",
          items: items.map((item) => ({
            description: item.description.trim(),
            quantity: Number(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            employeeId: mode === "company" && item.employeeId ? item.employeeId : null,
            sessionDate: item.sessionDate || null,
            serviceType: item.serviceType.trim() || null,
            note: item.note.trim() || null,
            appointmentId: item.appointmentId || null,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to save invoice");
      }

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
        className="btn-primary !px-5 !py-2.5 text-sm min-h-[44px]"
      >
        ✏️ Edit Invoice
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="w-full space-y-6">
      {/* Recipient */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
          Recipient
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("client")}
            className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold border transition-colors ${
              mode === "client"
                ? "bg-teal-600 text-white border-teal-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Individual Client
          </button>
          <button
            type="button"
            onClick={() => setMode("company")}
            className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold border transition-colors ${
              mode === "company"
                ? "bg-teal-600 text-white border-teal-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Company (Corporate)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === "client" ? (
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
                Company
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
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
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Use the separate “Send Invoice” action to email this invoice —
              editing never sends anything.
            </p>
          </div>
        </div>
      </section>

      {/* Details */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
          Invoice Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Line items */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
          Line Items ({items.length})
        </h3>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-gray-200 p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2 items-center">
                {mode === "company" && (
                  <select
                    value={item.employeeId}
                    onChange={(e) => updateItem(index, { employeeId: e.target.value })}
                    className="col-span-12 sm:col-span-3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">Employee (optional)</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Description / Service"
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  required
                  className={`${mode === "company" ? "col-span-8 sm:col-span-4" : "col-span-7"} rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none`}
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
                  required
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
                  className="col-span-1 min-h-[40px] text-red-500 hover:text-red-700 disabled:opacity-30"
                  aria-label="Remove line item"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Session Date
                  </label>
                  <input
                    type="date"
                    value={item.sessionDate}
                    onChange={(e) => updateItem(index, { sessionDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={item.serviceType}
                    onChange={(e) => updateItem(index, { serviceType: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Linked Session
                  </label>
                  <select
                    value={item.appointmentId}
                    onChange={(e) =>
                      updateItem(index, { appointmentId: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">None</option>
                    {linkableAppointments.map((appt) => (
                      <option key={appt.id} value={appt.id}>
                        {appt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Billing Note
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
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
          className="mt-3 min-h-[40px] text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          + Add line item
        </button>
      </section>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-4 flex justify-end">
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
            New Total: <span className="font-bold">${total.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary !px-6 !py-2.5 text-sm min-h-[44px] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={saving}
          className="min-h-[44px] rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}