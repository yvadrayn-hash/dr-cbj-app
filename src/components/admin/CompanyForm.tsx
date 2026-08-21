"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClientOption = { id: string; name: string; email: string };

export type CompanyDraft = {
  id?: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: string;
  billingFrequency: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "MANUAL";
  notes: string;
  employeeIds: string[];
};

const emptyCompany: CompanyDraft = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  billingAddress: "",
  billingFrequency: "MANUAL",
  notes: "",
  employeeIds: [],
};

export default function CompanyForm({
  clients,
  initial,
  onDone,
}: {
  clients: ClientOption[];
  initial?: CompanyDraft;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<CompanyDraft>(initial ?? emptyCompany);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CompanyDraft>(key: K, value: CompanyDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleEmployee(id: string) {
    setDraft((d) => ({
      ...d,
      employeeIds: d.employeeIds.includes(id)
        ? d.employeeIds.filter((e) => e !== id)
        : [...d.employeeIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        companyName: draft.companyName.trim(),
        contactName: draft.contactName.trim() || null,
        contactEmail: draft.contactEmail.trim() || null,
        contactPhone: draft.contactPhone.trim() || null,
        billingAddress: draft.billingAddress.trim() || null,
        billingFrequency: draft.billingFrequency,
        notes: draft.notes.trim() || null,
        employeeIds: draft.employeeIds,
      };

      const response = await fetch(
        draft.id ? `/api/admin/companies/${draft.id}` : "/api/admin/companies",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to save company");
      }

      if (!initial) setDraft(emptyCompany);
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            value={draft.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Billing Frequency
          </label>
          <select
            value={draft.billingFrequency}
            onChange={(e) =>
              update("billingFrequency", e.target.value as CompanyDraft["billingFrequency"])
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="MANUAL">Manual (bill whenever needed)</option>
            <option value="WEEKLY">Weekly</option>
            <option value="FORTNIGHTLY">Fortnightly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name
          </label>
          <input
            type="text"
            value={draft.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email (billing recipient)
          </label>
          <input
            type="email"
            value={draft.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Phone
          </label>
          <input
            type="tel"
            value={draft.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Billing Address
          </label>
          <input
            type="text"
            value={draft.billingAddress}
            onChange={(e) => update("billingAddress", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          rows={2}
          value={draft.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Sponsored Clients / Employees ({draft.employeeIds.length} selected)
        </p>

        {clients.length === 0 ? (
          <p className="text-sm text-gray-500">
            No registered clients yet. Create client accounts first, then
            assign them here.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
            {clients.map((client) => (
              <label
                key={client.id}
                className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={draft.employeeIds.includes(client.id)}
                  onChange={() => toggleEmployee(client.id)}
                  className="h-4 w-4 accent-teal-600"
                />
                <span className="font-medium text-gray-800">{client.name}</span>
                <span className="text-gray-500">{client.email}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary !px-5 !py-2 text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : draft.id ? "Save Changes" : "Create Company"}
      </button>
    </form>
  );
}