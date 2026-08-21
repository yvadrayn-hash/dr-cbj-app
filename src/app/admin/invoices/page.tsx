import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toNumber, formatMoney, invoiceStatusColor } from "@/lib/invoices";
import type { InvoiceStatus } from "@/lib/invoices";
import { redirect } from "next/navigation";
import Link from "next/link";
import InvoiceForm from "@/components/admin/InvoiceForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invoices | Admin",
  description: "Create and manage client invoices.",
};

export default async function AdminInvoicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        user: true,
        items: true,
        payments: { where: { status: "COMPLETED" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const outstanding = invoices
    .filter(
      (invoice) =>
        invoice.status === "SENT" ||
        invoice.status === "PARTIALLY_PAID" ||
        invoice.status === "OVERDUE"
    )
    .reduce((sum, invoice) => {
      const paid = invoice.payments.reduce((s, p) => s + toNumber(p.amount), 0);
      return sum + Math.max(toNumber(invoice.total) - paid, 0);
    }, 0);

  const collected = invoices.reduce(
    (sum, invoice) =>
      sum +
      invoice.payments.reduce((s, p) => s + toNumber(p.amount), 0),
    0
  );

  const drafts = invoices.filter((invoice) => invoice.status === "DRAFT").length;

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="section-title">Invoices & Payments</h1>
            <p className="text-gray-600">
              Create invoices, record payments, and track client billing.
            </p>
          </div>

          <Link href="/admin" className="btn-primary !px-4 !py-2 text-sm">
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Outstanding</p>
            <p className="text-3xl font-bold text-amber-500">
              {formatMoney(outstanding)}
            </p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Collected</p>
            <p className="text-3xl font-bold text-green-600">
              {formatMoney(collected)}
            </p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Drafts</p>
            <p className="text-3xl font-bold text-gray-600">{drafts}</p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Total Invoices</p>
            <p className="text-3xl font-bold text-teal-600">{invoices.length}</p>
          </div>
        </div>

        <div className="mb-8 flex justify-end">
          <InvoiceForm clients={clients} />
        </div>

        <div className="card overflow-x-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-teal-900">All Invoices</h2>
            <p className="text-sm text-gray-500">
              {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
            </p>
          </div>

          {invoices.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">
              No invoices yet. Create your first invoice above.
            </p>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4">Invoice #</th>
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Paid</th>
                  <th className="py-3 pr-4">Due Date</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => {
                  const paid = invoice.payments.reduce(
                    (s, p) => s + toNumber(p.amount),
                    0
                  );

                  return (
                    <tr key={invoice.id} className="border-b border-gray-100">
                      <td className="py-4 pr-4 font-semibold text-teal-900 whitespace-nowrap">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="py-4 pr-4">
                        {invoice.user ? (
                          <>
                            <p>{invoice.user.name}</p>
                            <p className="text-xs text-gray-500">
                              {invoice.user.email}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 pr-4 whitespace-nowrap">
                        {formatMoney(invoice.total)}
                      </td>

                      <td className="py-4 pr-4 whitespace-nowrap">
                        {formatMoney(paid)}
                      </td>

                      <td className="py-4 pr-4 whitespace-nowrap">
                        {invoice.dueDate.toLocaleDateString()}
                      </td>

                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            invoiceStatusColor(invoice.status as InvoiceStatus)
                          }`}
                        >
                          {invoice.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 pr-4">
                        <Link
                          href={`/admin/invoices/${invoice.id}`}
                          className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}