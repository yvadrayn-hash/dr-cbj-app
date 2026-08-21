import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  recalculateInvoiceTotals,
  updateInvoicePaymentStatus,
} from "@/lib/invoice-helpers";

const itemExtras = {
  employeeId: z.string().nullable().optional(),
  appointmentId: z.string().nullable().optional(),
  sessionDate: z.string().nullable().optional(),
  serviceType: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
};

const createItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  unitPrice: z.number().min(0, "Unit price is required"),
  ...itemExtras,
});

const updateItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  description: z.string().min(1, "Item description is required").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
  unitPrice: z.number().min(0, "Unit price is required").optional(),
  ...itemExtras,
});

const deleteItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

function buildExtras(data: {
  employeeId?: string | null;
  appointmentId?: string | null;
  sessionDate?: string | null;
  serviceType?: string | null;
  note?: string | null;
}): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  if (data.employeeId !== undefined) extras.employeeId = data.employeeId || null;
  if (data.appointmentId !== undefined) extras.appointmentId = data.appointmentId || null;
  if (data.sessionDate !== undefined) {
    extras.sessionDate = data.sessionDate ? new Date(data.sessionDate) : null;
  }
  if (data.serviceType !== undefined) extras.serviceType = data.serviceType || null;
  if (data.note !== undefined) extras.note = data.note || null;
  return extras;
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
    select: { id: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const item = await prisma.invoiceItem.create({
    data: {
      invoiceId: id,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      amount: data.quantity * data.unitPrice,
      ...buildExtras(data),
    },
  });

  await recalculateInvoiceTotals(id);
  await updateInvoicePaymentStatus(id);

  return NextResponse.json({ item }, { status: 201 });
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

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateItemSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { itemId, description, quantity, unitPrice, ...extrasInput } =
    parsed.data;

  const existingItem = await prisma.invoiceItem.findUnique({
    where: { id: itemId },
    select: { invoiceId: true, quantity: true, unitPrice: true },
  });

  if (!existingItem || existingItem.invoiceId !== id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const newQuantity = quantity ?? existingItem.quantity;
  const newUnitPrice = unitPrice ?? Number(existingItem.unitPrice);

  await prisma.invoiceItem.update({
    where: { id: itemId },
    data: {
      ...(description !== undefined ? { description } : {}),
      quantity: newQuantity,
      unitPrice: newUnitPrice,
      amount: newQuantity * newUnitPrice,
      ...buildExtras(extrasInput),
    },
  });

  await recalculateInvoiceTotals(id);
  await updateInvoicePaymentStatus(id);

  const updatedItem = await prisma.invoiceItem.findUnique({
    where: { id: itemId },
  });

  return NextResponse.json({ item: updatedItem });
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

  const body = await request.json();
  const parsed = deleteItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Item ID is required" },
      { status: 400 }
    );
  }

  const item = await prisma.invoiceItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { invoiceId: true },
  });

  if (!item || item.invoiceId !== id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const itemCount = await prisma.invoiceItem.count({
    where: { invoiceId: id },
  });

  if (itemCount <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last line item. Delete the invoice instead." },
      { status: 400 }
    );
  }

  await prisma.invoiceItem.delete({
    where: { id: parsed.data.itemId },
  });

  await recalculateInvoiceTotals(id);
  await updateInvoicePaymentStatus(id);

  return NextResponse.json({ success: true });
}
