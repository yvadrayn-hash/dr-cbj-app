import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { toNumber, formatMoney, invoiceStatusColor, invoiceStatusLabels } from "@/lib/invoices";
import PayInvoiceForm from "@/components/billing/PayInvoiceForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invoice Details — Dr. CBJ Mental Wellness",
  description: "View invoice details and make a payment.",
};

export default async function ClientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/admin");
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      user: true,
      company: {
        include: {
          employees: true,
        },
      },
      appointment: true,
      items: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!invoice) {
    redirect("/dashboard/billing");
  }

  // Ownership check: User must be the direct recipient OR an employee of the billed company
  const isOwner =
    invoice.userId === session.user.id ||
    (invoice.company?.employees.some((emp) => emp.id === session.user.id));

  if (!isOwner) {
    redirect("/dashboard/billing");
  }

  // Clients must never see DRAFT (admin-only) or CANCELLED invoices —
  // direct URL access returns not-found
  if (invoice.status === "DRAFT" || invoice.status === "CANCELLED") {
    notFound();
  }

  const amountPaid = invoice.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + toNumber(p.amount), 0);

  const balanceDue = Math.max(0, toNumber(invoice.total) - amountPaid);

  const canPay =
    invoice.status === "SENT" ||
    invoice.status === "PARTIALLY_PAID" ||
    invoice.status === "OVERDUE";

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/dashboard/billing"
            className="text-sm text-gray-500 hover:text-teal-700"
          >
            ← Back to Billing
          </Link>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="section-title mb-1">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-500 text-sm">
              Created {invoice.createdAt.toLocaleDateString()}
            </p>
          </div>

          <span
            className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${invoiceStatusColor(
              invoice.status as any
            )}`}
          >
            {invoiceStatusLabels[invoice.status as keyof typeof invoiceStatusLabels]}
          </span>
        </div>

        {/* —— Invoice Summary —— */}
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-teal-900 mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 uppercase">Due Date</span>
                <p className="font-medium">
                  {invoice.dueDate.toLocaleDateString()}
                </p>
              </div>

              <div>
                <span className="text-xs text-gray-500 uppercase">
                  Description
                </span>
                <p className="text-sm text-gray-700">
                  {invoice.description || "—"}
                </p>
              </div>

              {invoice.appointment && (
                <div>
                  <span className="text-xs text-gray-500 uppercase">
                    Appointment
                  </span>
                  <p className="font-medium">
                    {invoice.appointment.fullName} —{" "}
                    {invoice.appointment.preferredDate.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {formatMoney(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium">
                  -{formatMoney(invoice.discount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg text-teal-900">
                  {formatMoney(invoice.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-green-600">
                  {formatMoney(amountPaid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance Due:</span>
                <span
                  className={`font-bold ${
                    balanceDue > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatMoney(balanceDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* —— Pay Now —— */}
        {canPay && balanceDue > 0 && (
          <div className="card mb-8" id="pay">
            <h2 className="text-lg font-bold text-teal-900 mb-4">
              Pay This Invoice
            </h2>
            <PayInvoiceForm
              invoice={{
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                total: toNumber(invoice.total),
                dueDate: invoice.dueDate.toISOString(),
                status: invoice.status,
                description: invoice.description,
              }}
              amountPaid={amountPaid}
              balanceDue={balanceDue}
            />
          </div>
        )}

        {/* —— Line Items —— */}
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-teal-900 mb-4">
            Line Items ({invoice.items.length})
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-3 pr-4">Description</th>
                <th className="py-3 pr-4 w-16">Qty</th>
                <th className="py-3 pr-4 w-32">Unit Price</th>
                <th className="py-3 pr-4 w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100"
                >
                  <td className="py-3 pr-4">{item.description}</td>
                  <td className="py-3 pr-4">{item.quantity}</td>
                  <td className="py-3 pr-4">
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    {formatMoney(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Print Action */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-teal-900">Actions</h2>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print Invoice
            </button>
          </div>
        </div>

        {/* —— Payment History —— */}
        <div className="card">
          <h2 className="text-lg font-bold text-teal-900 mb-4">
            Payment History ({invoice.payments.length})
          </h2>

          {invoice.payments.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">
              No payments recorded for this invoice.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Method</th>
                  <th className="py-3 pr-4">Reference</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-gray-100"
                  >
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {(payment.paidAt ?? payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {formatMoney(payment.amount)}
                    </td>
                    <td className="py-3 pr-4 capitalize">
                      {payment.paymentMethod.replaceAll("_", " ").toLowerCase()}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {payment.transactionReference || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {payment.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}