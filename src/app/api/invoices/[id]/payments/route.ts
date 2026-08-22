import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { toNumber, formatMoney, generateTransactionReference } from "@/lib/invoices";
import { sendPaymentSubmittedAdminEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site";
import { rateLimit } from "@/lib/rate-limit";

const MAX_PAYMENT_AMOUNT = 1_000_000;

const submitPaymentSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(MAX_PAYMENT_AMOUNT, "Amount is too large"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "PAYPAL", "PAYONEER", "OTHER"]),
  reference: z.string().max(120).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Abuse protection for payment declarations
  const limit = rateLimit(`pay:${session.user.id}`, 10, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const { id } = await context.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      payments: {
        where: {
          status: {
            in: ["PENDING", "COMPLETED"],
          },
        },
      },
    },
  });

  // Ownership check — clients can only pay their own invoices
  if (!invoice || invoice.userId !== session.user.id) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const payable =
    invoice.status === "SENT" ||
    invoice.status === "PARTIALLY_PAID" ||
    invoice.status === "OVERDUE";

  if (!payable) {
    return NextResponse.json(
      { error: "This invoice is not open for payment" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = submitPaymentSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Prevent submissions that exceed the remaining balance
  // (PENDING submissions hold funds until confirmed or rejected by admin)
  const committed = invoice.payments.reduce(
    (sum, payment) => sum + toNumber(payment.amount),
    0
  );
  const remaining = toNumber(invoice.total) - committed;

  if (data.amount > remaining + 0.001) {
    return NextResponse.json(
      { error: `Amount exceeds the remaining balance of ${formatMoney(remaining)}` },
      { status: 400 }
    );
  }

  try {
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        userId: session.user.id,
        amount: data.amount,
        currency: invoice.currency,
        paymentMethod: data.paymentMethod,
        status: "PENDING",
        transactionReference:
          data.reference || generateTransactionReference(),
      },
    });

    // Notify all admins so they can verify and confirm the payment
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Payment Submitted",
          message: `${session.user.name ?? "A client"} submitted a payment of ${formatMoney(data.amount)} for invoice ${invoice.invoiceNumber}. Review and confirm it in Invoices and Payments.`,
          type: "PAYMENT_SUBMITTED",
        })),
      });
    }

    // Email the office so the submission is not missed (after the DB write
    // succeeds; failures are logged, never rolled back)
    try {
      await sendPaymentSubmittedAdminEmail({
        to: siteConfig.email,
        subject: `Payment Submitted — Invoice ${invoice.invoiceNumber}`,
        title: "Payment Submitted by Client",
        message: `A client has submitted a payment declaration. Please verify it and record the confirmed payment in Invoices and Payments.`,
        invoiceNumber: invoice.invoiceNumber,
        clientName: session.user.name ?? "Unknown client",
        amount: formatMoney(data.amount),
        method: data.paymentMethod.replaceAll("_", " ").toLowerCase(),
        reference: payment.transactionReference ?? undefined,
      });
    } catch (error) {
      console.error("Payment submitted admin email failed:", error);
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Payment submission error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}