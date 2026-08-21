// Server-side invoice helper functions
// Only imported by API routes and server components — not client components
import { prisma } from "@/lib/prisma";
import { toNumber, computeInvoiceStatus, InvoiceStatus } from "@/lib/invoices";

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
