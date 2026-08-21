import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  recalculateInvoiceTotals,
  updateInvoicePaymentStatus,
} from "@/lib/invoice-helpers";
import { sendInvoiceEmail, sendPaymentRecordedEmail, getAppUrl } from "@/lib/email";
import { formatMoney, toNumber } from "@/lib/invoices";

const editableItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price is required"),
  employeeId: z.string().nullable().optional(),
  appointmentId: z.string().nullable().optional(),
  sessionDate: z.string().nullable().optional(),
  serviceType: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

const updateInvoiceSchema = z.object({
  status: z
    .enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"])
    .optional(),
  dueDate: z.string().min(1, "Due date is required").optional(),
  description: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  appointmentId: z.string().nullable().optional(),
  discount: z.number().min(0).optional(),
  currency: z.string().min(1).optional(),
  items: z.array(editableItemSchema).optional(),
});

async function notifyRecipient(invoice: {
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
}) {
  // Corporate invoices go to the company's billing contact
  if (invoice.company) {
    if (!invoice.company.contactEmail) return;

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
    }).catch((error) => {
      console.error("Corporate invoice email failed:", error);
    });

    return;
  }

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
      company: true,
      appointment: true,
      items: {
        include: {
          employee: { select: { id: true, name: true, email: true } },
          appointment: { select: { id: true, preferredDate: true, preferredTime: true } },
        },
      },
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
        company: true,
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

    const amountPaid = currentInvoice.payments.reduce(
      (sum, payment) => sum + toNumber(payment.amount),
      0
    );

    // —— Safeguard: validate the prospective total before applying edits ——
    // Completed payment records are always preserved; the total can never
    // be edited below what has already been paid.
    let prospectiveSubtotal = toNumber(currentInvoice.subtotal);
    if (data.items) {
      prospectiveSubtotal = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
    }
    const prospectiveDiscount = data.discount ?? toNumber(currentInvoice.discount);
    const prospectiveTotal = prospectiveSubtotal - prospectiveDiscount;

    if (prospectiveTotal < amountPaid - 0.001) {
      return NextResponse.json(
        {
          error: `This edit would reduce the total to ${formatMoney(prospectiveTotal)}, which is below the ${formatMoney(amountPaid)} already paid. Completed payment records are preserved, so the total cannot go below the amount paid.`,
        },
        { status: 400 }
      );
    }

    // —— Apply the update ——
    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.currency) updateData.currency = data.currency;

    // Recipient: corporate (company) or individual (client) — mutually exclusive
    if (data.companyId !== undefined) {
      if (data.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: data.companyId },
          select: { id: true },
        });
        if (!company) {
          return NextResponse.json(
            { error: "Company not found" },
            { status: 400 }
          );
        }
        updateData.companyId = data.companyId;
        updateData.userId = null;
      } else {
        updateData.companyId = null;
      }
    }

    if (data.userId !== undefined) {
      if (data.userId) {
        updateData.userId = data.userId;
        if (data.companyId === undefined) updateData.companyId = null;
      } else if (data.companyId === undefined) {
        updateData.userId = null;
      }
    }

    if (data.appointmentId !== undefined) {
      updateData.appointmentId = data.appointmentId || null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id },
        data: updateData,
      });

      // Full line-item replacement (editable invoices)
      if (data.items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

        await tx.invoiceItem.createMany({
          data: data.items.map((item) => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            employeeId: item.employeeId || null,
            appointmentId: item.appointmentId || null,
            sessionDate: item.sessionDate ? new Date(item.sessionDate) : null,
            serviceType: item.serviceType || null,
            note: item.note || null,
          })),
        });
      }
    });

    // Recalculate totals from line items
    await recalculateInvoiceTotals(id);

    // Recompute payment-derived status (PAID / PARTIALLY_PAID / OVERDUE).
    // Preserves DRAFT and CANCELLED; moves PAID → PARTIALLY_PAID when an
    // edit creates a new balance, and keeps/returns PAID when fully settled.
    await updateInvoicePaymentStatus(id);

    // If status changed to SENT, notify the recipient (client or company)
    if (willBeSent) {
      const updated = await prisma.invoice.findUnique({
        where: { id },
        include: {
          user: true,
          company: true,
          payments: { where: { status: "COMPLETED" } },
        },
      });
      if (updated) {
        const paid = updated.payments.reduce(
          (sum, payment) => sum + toNumber(payment.amount),
          0
        );

        await notifyRecipient({
          invoiceNumber: updated.invoiceNumber,
          total: Number(updated.total),
          amountDue: Math.max(Number(updated.total) - paid, 0),
          dueDate: updated.dueDate,
          description: updated.description,
          user: updated.user,
          company: updated.company
            ? {
                companyName: updated.company.companyName,
                contactName: updated.company.contactName,
                contactEmail: updated.company.contactEmail,
              }
            : null,
        });
      }
    }

    // If status changed to PAID from a non-paid state, notify the client
    if (
      data.status === "PAID" &&
      currentInvoice.status !== "PAID" &&
      currentInvoice.status !== "PARTIALLY_PAID" &&
      currentInvoice.status !== "CANCELLED" &&
      currentInvoice.user?.email
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
        company: true,
        appointment: true,
        items: {
          include: {
            employee: { select: { id: true, name: true, email: true } },
            appointment: { select: { id: true, preferredDate: true, preferredTime: true } },
          },
        },
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