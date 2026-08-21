import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  toNumber,
  formatMoney,
  invoiceStatusColor,
  paymentStatusColor,
  isOutstandingInvoice,
  invoiceEffectiveStatus,
} from "@/lib/invoices";
import type { InvoiceStatus, PaymentStatus } from "@/lib/invoices";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Billing | Client Dashboard",
  description: "View your invoices and payment history.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  if (session?.user?.role === "ADMIN") {
    redirect("/admin/invoices");
  }

  const { filter } = await searchParams;

  // Clients only ever see SENT / PARTIALLY_PAID / PAID / OVERDUE invoices.
  // DRAFT (admin-only) and CANCELLED are filtered out server-side.
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: { in: ["SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
    },
    include: {
      items: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const filteredInvoices =
    filter === "unpaid"
      ? invoices.filter((invoice) =>
          isOutstandingInvoice(invoice.status, invoice.dueDate)
        )
      : filter === "paid"
      ? invoices.filter((invoice) => invoice.status === "PAID")
      : invoices;

  const outstanding = invoices
    .filter((invoice) =>
      isOutstandingInvoice(invoice.status, invoice.dueDate)
    )
    .reduce((sum, invoice) => {
      const paid = invoice.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((s, p) => s + toNumber(p.amount), 0);
      return sum + Math.max(toNumber(invoice.total) - paid, 0);
    }, 0);

  return (
    <div className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-teal-700 hover:text-teal-900 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="section-title">Billing and Payments</h1>
          <p className="text-gray-600">
            View your invoices and payment history. Payments are recorded by our
            office — contact us if you have any billing questions.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <Link
            href="/dashboard/billing?filter=unpaid"
            aria-label="Show unpaid, overdue, and partially paid invoices"
            className={`card text-center transition duration-150 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
              filter === "unpaid" ? "ring-2 ring-teal-500" : ""
            }`}
          >
            <p className="text-sm text-gray-500 mb-1">Outstanding Balance</p>
            <p className="text-3xl font-bold text-amber-500">
              {formatMoney(outstanding)}
            </p>
          </Link>

          <Link
            href="/dashboard/billing"
            aria-label="Show all invoices"
            className={`card text-center transition duration-150 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
              !filter ? "ring-2 ring-teal-500" : ""
            }`}
          >
            <p className="text-sm text-gray-500 mb-1">Invoices</p>
            <p className="text-3xl font-bold text-teal-600">{invoices.length}</p>
          </Link>

          <Link
            href="/dashboard/billing?filter=paid"
            aria-label="Show invoices paid in full"
            className={`card text-center transition duration-150 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
              filter === "paid" ? "ring-2 ring-teal-500" : ""
            }`}
          >
            <p className="text-sm text-gray-500 mb-1">Paid In Full</p>
            <p className="text-3xl font-bold text-green-600">
              {invoices.filter((invoice) => invoice.status === "PAID").length}
            </p>
          </Link>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              You have no invoices yet. Invoices issued by Dr. CBJ Mental
              Wellness will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInvoices.map((invoice) => {
              const paid = invoice.payments
                .filter((payment) => payment.status === "COMPLETED")
                .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

              return (
                <div key={invoice.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <Link
                        href={`/dashboard/billing/invoices/${invoice.id}`}
                        className="text-lg font-bold text-teal-900 hover:text-teal-700"
                      >
                        Invoice {invoice.invoiceNumber}
                      </Link>
                      <p className="text-sm text-gray-500">
                        Issued {invoice.createdAt.toLocaleDateString()} · Due{" "}
                        {invoice.dueDate.toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${
                        invoiceStatusColor(
                          invoiceEffectiveStatus(
                            invoice.status as InvoiceStatus,
                            invoice.dueDate
                          )
                        )
                      }`}
                    >
                      {invoiceEffectiveStatus(
                        invoice.status as InvoiceStatus,
                        invoice.dueDate
                      ).replaceAll("_", " ")}
                    </span>
                  </div>

                  {/* Line items */}
                  <table className="w-full text-sm mb-4">
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4">{item.description}</td>
                          <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                            ×{item.quantity}
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="py-2 pr-4 font-semibold text-teal-900 whitespace-nowrap text-right">
                            {formatMoney(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr>
                        <td colSpan={3} className="pt-2 text-right text-gray-500">
                          Subtotal
                        </td>
                        <td className="pt-2 text-right whitespace-nowrap">
                          {formatMoney(invoice.subtotal)}
                        </td>
                      </tr>
                      {toNumber(invoice.discount) > 0 && (
                        <tr>
                          <td colSpan={3} className="text-right text-gray-500">
                            Discount
                          </td>
                          <td className="text-right whitespace-nowrap text-green-700">
                            −{formatMoney(invoice.discount)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} className="pt-1 text-right font-semibold text-teal-900">
                          Total
                        </td>
                        <td className="pt-1 text-right font-bold text-teal-900 whitespace-nowrap">
                          {formatMoney(invoice.total)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="text-right text-gray-500">
                          Paid
                        </td>
                        <td className="text-right whitespace-nowrap text-green-700">
                          {formatMoney(paid)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="text-right font-semibold text-teal-900">
                          Balance Due
                        </td>
                        <td className="text-right font-bold text-amber-600 whitespace-nowrap">
                          {formatMoney(Math.max(toNumber(invoice.total) - paid, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="mt-2">
                    <Link
                      href={`/dashboard/billing/invoices/${invoice.id}`}
                      className="inline-flex rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                    >
                      View Details and Pay →
                    </Link>
                  </div>

                  {/* Payment history */}
                  {invoice.payments.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-semibold text-teal-700 hover:text-teal-900">
                        Payment history ({invoice.payments.length})
                      </summary>

                      <ul className="mt-3 space-y-2">
                        {invoice.payments.map((payment) => (
                          <li
                            key={payment.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                          >
                            <span>
                              {(payment.paidAt ?? payment.createdAt).toLocaleDateString()}{" "}
                              · {payment.paymentMethod
                                .replaceAll("_", " ")
                                .toLowerCase()}
                            </span>

                            <span className="flex items-center gap-3">
                              <span className="font-semibold text-teal-900">
                                {formatMoney(payment.amount)}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  paymentStatusColor(payment.status as PaymentStatus)
                                }`}
                              >
                                {payment.status}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}