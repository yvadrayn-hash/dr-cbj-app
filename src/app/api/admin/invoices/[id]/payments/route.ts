import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { updateInvoicePaymentStatus, getAmountPaid } from "@/lib/invoice-helpers";
import { sendPaymentRecordedEmail } from "@/lib/email";
import { formatMoney, generateTransactionReference } from "@/lib/invoices";

const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  paymentMethod: z
    .enum(["MANUAL", "CARD", "BANK_TRANSFER", "CASH"])
    .default("MANUAL"),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).default("COMPLETED"),
  transactionReference: z.string().optional(),
  paidAt: z.string().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const payments = await prisma.payment.findMany({
    where: { invoiceId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    payments,
    amountPaid: await getAmountPaid(id),
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "CANCELLED" || invoice.status === "DRAFT") {
    return NextResponse.json(
      { error: "Payments can only be recorded on SENT, PARTIALLY_PAID, PAID or OVERDUE invoices" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;

    // Prevent overpayment beyond remaining balance (for completed payments)
    if (data.status === "COMPLETED") {
      const amountPaid = await getAmountPaid(id);
      const total = Number(invoice.total);
      const remaining = total - amountPaid;

      if (data.amount > remaining + 0.001) {
        return NextResponse.json(
          {
            error: `Amount exceeds remaining balance of ${formatMoney(remaining)}`,
          },
          { status: 400 }
        );
      }
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        userId: invoice.userId,
        amount: data.amount,
        currency: invoice.currency,
        paymentMethod: data.paymentMethod,
        status: data.status,
        transactionReference:
          data.transactionReference || generateTransactionReference(),
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      },
    });

    // Recompute amount paid + invoice status
    const result = await updateInvoicePaymentStatus(id);

    // Notify client when a completed payment is recorded
    if (
      data.status === "COMPLETED" &&
      invoice.user?.email &&
      invoice.userId &&
      result
    ) {
      const remainingBalance = Math.max(result.total - result.amountPaid, 0);
      const paidInFull = remainingBalance <= 0.001;

      await prisma.notification.create({
        data: {
          userId: invoice.userId,
          title: "Payment Received",
          message: paidInFull
            ? `Your payment of ${formatMoney(data.amount)} for invoice ${invoice.invoiceNumber} has been received. This invoice is now paid in full — thank you!`
            : `Your payment of ${formatMoney(data.amount)} for invoice ${invoice.invoiceNumber} has been received. Remaining balance: ${formatMoney(remainingBalance)}.`,
          type: "PAYMENT_RECEIVED",
        },
      });

      try {
        await sendPaymentRecordedEmail({
          to: invoice.user.email,
          subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
          title: "Payment Received",
          message: paidInFull
            ? `Thank you for your payment of ${formatMoney(data.amount)} for invoice ${invoice.invoiceNumber}. Your balance is now settled — this invoice is <strong>paid in full</strong>.`
            : `Thank you for your payment of ${formatMoney(data.amount)} for invoice ${invoice.invoiceNumber}.`,
          invoiceNumber: invoice.invoiceNumber,
          amount: formatMoney(data.amount),
          method: data.paymentMethod.replaceAll("_", " ").toLowerCase(),
          transactionReference: payment.transactionReference ?? undefined,
          remainingBalance: formatMoney(remainingBalance),
        });
      } catch (error) {
        console.error("Payment email failed:", error);
      }
    }

    return NextResponse.json({ payment, ...result }, { status: 201 });
  } catch (error) {
    console.error("Payment recording error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}