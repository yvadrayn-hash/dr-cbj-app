import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateInvoiceTotals } from "@/lib/invoice-helpers";
import { sendInvoiceEmail, sendPaymentRecordedEmail } from "@/lib/email";
import { formatMoney, generateTransactionReference } from "@/lib/invoices";

const updateInvoiceSchema = z.object({
  status: z
    .enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"])
    .optional(),
  dueDate: z.string().min(1, "Due date is required").optional(),
  description: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  appointmentId: z.string().nullable().optional(),
  discount: z.number().min(0).optional(),
});

async function notifyClient(invoice: {
  invoiceNumber: string;
  total: number;
  dueDate: Date;
  description?: string | null;
  user?: { id: string; email: string | null; name: string | null } | null;
}) {
  if (!invoice.user?.id || !invoice.user?.email) return;

  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId: invoice.user.id,
      title: "Invoice Sent",
      message: `Invoice ${invoice.invoiceNumber} for ${formatMoney(invoice.total)} is now due on ${invoice.dueDate.toLocaleDateString()}.`,
      type: "INVOICE_SENT",
    },
  });

  try {
    await sendInvoiceEmail({
      to: invoice.user.email,
      subject: `New Invoice ${invoice.invoiceNumber}`,
      title: "New Invoice Created",
      message: `A new invoice (${invoice.invoiceNumber}) has been issued to you with a total of ${formatMoney(invoice.total)}.`,
      invoiceNumber: invoice.invoiceNumber,
      total: formatMoney(invoice.total),
      dueDate: invoice.dueDate.toLocaleDateString(),
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });
  } catch (error) {
    console.error("Invoice email failed:", error);
  }
}

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
    include: {
      user: true,
      appointment: true,
      items: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: true,
        items: true,
        payments: { where: { status: "COMPLETED" } },
      },
    });

    if (!currentInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const data = parsed.data;
    const wasSent = currentInvoice.status === "SENT";
    const willBeSent = data.status === "SENT" && !wasSent;
    const discountChanged = data.discount !== undefined;

    // Build update payload
    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.appointmentId !== undefined) updateData.appointmentId = data.appointmentId;
    if (data.discount !== undefined) updateData.discount = data.discount;

    await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    // Recalculate totals if discount changed or items changed
    if (discountChanged) {
      await recalculateInvoiceTotals(id);
    }

    // If status changed to SENT, notify client
    if (willBeSent) {
      const updated = await prisma.invoice.findUnique({
        where: { id },
        include: { user: true },
      });
      if (updated) {
        await notifyClient({
          invoiceNumber: updated.invoiceNumber,
          total: Number(updated.total),
          dueDate: updated.dueDate,
          description: updated.description,
          user: updated.user,
        });
      }
    }

    // If status changed to PAID or PARTIALLY_PAID from a non-paid state,
    // notify the client (payment recorded)
    if (
      data.status === "PAID" &&
      currentInvoice.status !== "PAID" &&
      currentInvoice.status !== "PARTIALLY_PAID" &&
      currentInvoice.status !== "CANCELLED"
    ) {
      const updated = await prisma.invoice.findUnique({
        where: { id },
        include: { user: true },
      });
      if (updated?.user?.email) {
        await prisma.notification.create({
          data: {
            userId: updated.user.id,
            title: "Payment Received",
            message: `Your payment of ${formatMoney(updated.total)} for invoice ${updated.invoiceNumber} has been recorded.`,
            type: "PAYMENT_RECEIVED",
          },
        });

        try {
          await sendPaymentRecordedEmail({
            to: updated.user.email,
            subject: `Payment Received - Invoice ${updated.invoiceNumber}`,
            title: "Payment Received",
            message: `Thank you for your payment of ${formatMoney(updated.total)} for invoice ${updated.invoiceNumber}.`,
            invoiceNumber: updated.invoiceNumber,
            amount: formatMoney(updated.total),
            method: "Manual",
          });
        } catch (error) {
          console.error("Payment email failed:", error);
        }
      }
    }

    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: true,
        appointment: true,
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error("Invoice update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    select: { status: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Only allow deletion of DRAFT or CANCELLED invoices
  if (invoice.status !== "DRAFT" && invoice.status !== "CANCELLED") {
    return NextResponse.json(
      { error: "Only DRAFT or CANCELLED invoices can be deleted" },
      { status: 400 }
    );
  }

  await prisma.invoice.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
