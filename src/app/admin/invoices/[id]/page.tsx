import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  toNumber,
  formatMoney,
  invoiceStatusColor,
  paymentStatusColor,
} from "@/lib/invoices";
import type { InvoiceStatus, PaymentStatus } from "@/lib/invoices";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import InvoiceItemsEditor from "@/components/admin/InvoiceItemsEditor";
import InvoiceStatusUpdater from "@/components/admin/InvoiceStatusUpdater";
import InvoiceDetailsEditor from "@/components/admin/InvoiceDetailsEditor";
import PaymentForm from "@/components/admin/PaymentForm";
import SendInvoiceButton from "@/components/admin/SendInvoiceButton";

export const dynamic = "force-dynamic";

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const [invoice, clients, companies] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        user: true,
        company: true,
        appointment: true,
        items: {
          include: {
            employee: { select: { id: true, name: true } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      select: { id: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);

  if (!invoice) {
    notFound();
  }

  const isCorporate = Boolean(invoice.company);

  const companyEmployees = invoice.company
    ? await prisma.user.findMany({
        where: { companyId: invoice.company.id, role: "CLIENT" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const amountPaid = invoice.payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  const total = toNumber(invoice.total);
  const remaining = Math.max(total - amountPaid, 0);

  return (
    <div className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/invoices"
              className="text-sm text-teal-700 hover:text-teal-900 mb-2 inline-block"
            >
              ← Back to Invoices
            </Link>
            <h1 className="section-title">{invoice.invoiceNumber}</h1>
            <p className="text-gray-600">
              {isCorporate ? "Corporate invoice" : "Individual invoice"} · manage
              details, line items, status, and payments.
            </p>
          </div>

          <span
            className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${
              invoiceStatusColor(invoice.status as InvoiceStatus)
            }`}
          >
            {invoice.status.replaceAll("_", " ")}
          </span>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-teal-900">{formatMoney(total)}</p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {formatMoney(amountPaid)}
            </p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Remaining</p>
            <p className="text-2xl font-bold text-amber-500">
              {formatMoney(remaining)}
            </p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Due Date</p>
            <p className="text-2xl font-bold text-teal-900">
              {invoice.dueDate.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Bill To / Details */}
        <div className="card mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-teal-900">Invoice Details</h2>
            <InvoiceDetailsEditor
              invoiceId={invoice.id}
              initial={{
                userId: invoice.userId ?? "",
                companyId: invoice.companyId ?? "",
                description: invoice.description ?? "",
                dueDate: invoice.dueDate.toISOString().slice(0, 10),
                discount: String(toNumber(invoice.discount)),
                currency: invoice.currency,
              }}
              clients={clients}
              companies={companies}
            />
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {isCorporate && invoice.company ? (
              <>
                <div>
                  <dt className="text-gray-500">Bill To (Company)</dt>
                  <dd className="font-semibold text-gray-800 break-words">
                    {invoice.company.companyName}
                  </dd>
                </div>

                <div>
                  <dt className="text-gray-500">Billing Contact</dt>
                  <dd className="font-semibold text-gray-800 break-words">
                    {invoice.company.contactName || "—"}
                    {invoice.company.contactEmail && (
                      <span className="block text-xs font-normal text-gray-500 break-words">
                        {invoice.company.contactEmail}
                      </span>
                    )}
                  </dd>
                </div>

                {invoice.company.billingAddress && (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">Billing Address</dt>
                    <dd className="text-gray-800 break-words">
                      {invoice.company.billingAddress}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-gray-500">Billing Frequency</dt>
                  <dd className="font-semibold text-gray-800">
                    {invoice.company.billingFrequency.charAt(0) +
                      invoice.company.billingFrequency.slice(1).toLowerCase()}
                  </dd>
                </div>
              </>
            ) : (
              <div>
                <dt className="text-gray-500">Client</dt>
                <dd className="font-semibold text-gray-800">
                  {invoice.user ? (
                    <>
                      {invoice.user.name}
                      <span className="block text-xs font-normal text-gray-500 break-words">
                        {invoice.user.email}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-gray-500">Subtotal / Discount</dt>
              <dd className="font-semibold text-gray-800">
                {formatMoney(invoice.subtotal)}{" "}
                <span className="font-normal text-gray-500">
                  − {formatMoney(invoice.discount)} {invoice.currency}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">Linked Appointment</dt>
              <dd className="font-semibold text-gray-800">
                {invoice.appointment ? (
                  <Link
                    href={`/admin/appointments/${invoice.appointment.id}`}
                    className="text-teal-700 hover:text-teal-900"
                  >
                    {invoice.appointment.fullName} —{" "}
                    {invoice.appointment.preferredDate.toLocaleDateString()}
                  </Link>
                ) : (
                  <span className="text-gray-400">None</span>
                )}
              </dd>
            </div>

            {invoice.description && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Description</dt>
                <dd className="text-gray-800">{invoice.description}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Status */}
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-teal-900 mb-4">Invoice Status</h2>
          <InvoiceStatusUpdater
            invoiceId={invoice.id}
            currentStatus={invoice.status as InvoiceStatus}
          />

          {/* Manual send — invoices are NEVER emailed automatically. This
              button is the only way an invoice email goes out, and it fires
              only when Dr. CBJ explicitly confirms the send action. */}
          {invoice.status === "DRAFT" && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                This invoice is a draft. Sending is always manual — use the
                button below to email it to{" "}
                {isCorporate && invoice.company
                  ? `${invoice.company.companyName} (${invoice.company.contactEmail || "no billing email set"})`
                  : invoice.user?.email || "the client"}{" "}
                now.
              </p>
              <SendInvoiceButton
                invoiceId={invoice.id}
                recipientLabel={
                  isCorporate && invoice.company
                    ? `${invoice.company.companyName}${invoice.company.contactEmail ? ` (${invoice.company.contactEmail})` : ""}`
                    : invoice.user?.email || "the client"
                }
              />
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-teal-900 mb-4">
            Line Items ({invoice.items.length})
          </h2>
          <InvoiceItemsEditor
            invoiceId={invoice.id}
            employees={companyEmployees.map((e) => ({ id: e.id, name: e.name }))}
            items={invoice.items.map((item) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: toNumber(item.unitPrice),
              amount: toNumber(item.amount),
              employeeId: item.employeeId,
              sessionDate: item.sessionDate
                ? item.sessionDate.toISOString()
                : null,
              serviceType: item.serviceType,
              note: item.note,
            }))}
          />
        </div>

        {/* Payments */}
        <div className="card mb-8">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h2 className="text-lg font-bold text-teal-900">Payments</h2>
            {invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && (
              <PaymentForm invoiceId={invoice.id} remaining={remaining} />
            )}
          </div>

          {invoice.payments.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">
              No payments recorded yet.
            </p>
          ) : (
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Reference</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {(payment.paidAt ?? payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-teal-900 whitespace-nowrap">
                      {formatMoney(payment.amount)}
                    </td>
                    <td className="py-3 pr-4 capitalize">
                      {payment.paymentMethod.replaceAll("_", " ").toLowerCase()}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {payment.transactionReference || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          paymentStatusColor(payment.status as PaymentStatus)
                        }`}
                      >
                        {payment.status}
                      </span>
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
