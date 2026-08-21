// Server-side invoice helper functions
// Only imported by API routes and server components — not client components
import { prisma } from "@/lib/prisma";
import {
  toNumber,
  computeInvoiceStatus,
  formatMoney,
  InvoiceStatus,
} from "@/lib/invoices";
import { sendInvoiceEmail, getAppUrl } from "@/lib/email";

/**
 * Recalculate the invoice subtotal (from line items) and total (subtotal − discount).
 * Returns the updated values or null if the invoice wasn't found.
 */
export async function recalculateInvoiceTotals(invoiceId: string) {
  const items = await prisma.invoiceItem.findMany({
    where: { invoiceId },
  });

  const subtotal = items.reduce(
    (sum, item) => sum + toNumber(item.amount),
    0
  );

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { discount: true, status: true, dueDate: true },
  });

  if (!invoice) return null;

  const discount = toNumber(invoice.discount);
  const total = subtotal - discount;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotal,
      total,
    },
  });

  return { subtotal, discount, total };
}

/**
 * Recalculate the paid amount for an invoice (sum of COMPLETED payments)
 * and update the invoice status accordingly.
 */
export async function updateInvoicePaymentStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: {
        where: { status: "COMPLETED" },
      },
    },
  });

  if (!invoice) return null;

  const amountPaid = invoice.payments.reduce(
    (sum, payment) => sum + toNumber(payment.amount),
    0
  );

  const total = toNumber(invoice.total);
  const currentStatus = invoice.status as InvoiceStatus;
  const newStatus = computeInvoiceStatus(
    total,
    amountPaid,
    currentStatus,
    invoice.dueDate
  );

  if (newStatus !== currentStatus) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus as string as any },
    });
  }

  return { amountPaid, status: newStatus, total };
}

/**
 * Returns the total amount paid (sum of COMPLETED payments) for an invoice.
 */
export async function getAmountPaid(invoiceId: string): Promise<number> {
  const result = await prisma.payment.aggregate({
    where: {
      invoiceId,
      status: "COMPLETED",
    },
    _sum: {
      amount: true,
    },
  });

  return toNumber(result._sum.amount);
}

type RecipientInvoice = {
  invoiceNumber: string;
  total: number;
  amountDue: number;
  dueDate: Date;
  description?: string | null;
  user?: { id: string; email: string | null; name: string | null } | null;
  company?: {
    companyName: string;
    contactName?: string | null;
    contactEmail?: string | null;
  } | null;
};

/**
 * Email an invoice to its recipient:
 * - corporate invoices go to the company's billing contact only
 *   (individual employees are never emailed)
 * - individual invoices go to the client, plus an in-app notification
 *
 * Called ONLY by explicit admin send/resend actions — never automatically.
 */
export async function notifyInvoiceRecipient(
  invoice: RecipientInvoice,
  options: { inAppNotification?: boolean } = {}
): Promise<void> {
  const { inAppNotification = true } = options;

  // Corporate invoices go to the company's billing contact
  if (invoice.company) {
    if (!invoice.company.contactEmail) return;

    try {
      await sendInvoiceEmail({
        to: invoice.company.contactEmail,
        subject: `New Invoice ${invoice.invoiceNumber} — ${invoice.company.companyName}`,
        title: "New Invoice Created",
        message: `Dear ${invoice.company.contactName || invoice.company.companyName}, a new invoice (${invoice.invoiceNumber}) has been issued to ${invoice.company.companyName} with a total of ${formatMoney(invoice.total)}.`,
        invoiceNumber: invoice.invoiceNumber,
        description: invoice.description || undefined,
        total: formatMoney(invoice.total),
        amountDue: formatMoney(invoice.amountDue),
        dueDate: invoice.dueDate.toLocaleDateString(),
        dashboardUrl: `${getAppUrl()}/dashboard/billing`,
      });
    } catch (error) {
      console.error("Corporate invoice email failed:", error);
    }

    return;
  }

  if (!invoice.user?.id || !invoice.user?.email) return;

  if (inAppNotification) {
    await prisma.notification.create({
      data: {
        userId: invoice.user.id,
        title: "Invoice Sent",
        message: `Invoice ${invoice.invoiceNumber} for ${formatMoney(invoice.total)} is now due on ${invoice.dueDate.toLocaleDateString()}.`,
        type: "INVOICE_SENT",
      },
    });
  }

  try {
    await sendInvoiceEmail({
      to: invoice.user.email,
      subject: `New Invoice ${invoice.invoiceNumber}`,
      title: "New Invoice Created",
      message: `A new invoice (${invoice.invoiceNumber}) has been issued to you with a total of ${formatMoney(invoice.total)}.`,
      invoiceNumber: invoice.invoiceNumber,
      description: invoice.description || undefined,
      total: formatMoney(invoice.total),
      amountDue: formatMoney(invoice.amountDue),
      dueDate: invoice.dueDate.toLocaleDateString(),
      dashboardUrl: `${getAppUrl()}/dashboard/billing`,
    });
  } catch (error) {
    console.error("Invoice email failed:", error);
  }
}
