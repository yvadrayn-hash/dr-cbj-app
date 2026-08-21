import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recalculateInvoiceTotals } from "@/lib/invoice-helpers";

const createItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  unitPrice: z.number().min(0, "Unit price is required"),
});

const updateItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  description: z.string().min(1, "Item description is required").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
  unitPrice: z.number().min(0, "Unit price is required").optional(),
});

const deleteItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

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
    },
  });

  await recalculateInvoiceTotals(id);

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

  const { itemId, description, quantity, unitPrice } = parsed.data;

  const existingItem = await prisma.invoiceItem.findUnique({
    where: { id: itemId },
    select: { invoiceId: true, quantity: true, unitPrice: true },
  });

  if (!existingItem || existingItem.invoiceId !== id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (description) updateData.description = description;

  const newQuantity = quantity ?? existingItem.quantity;
  const newUnitPrice = unitPrice ?? Number(existingItem.unitPrice);

  updateData.quantity = newQuantity;
  updateData.unitPrice = newUnitPrice;
  updateData.amount = newQuantity * newUnitPrice;

  await prisma.invoiceItem.update({
    where: { id: itemId },
    data: updateData,
  });

  await recalculateInvoiceTotals(id);

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

  return NextResponse.json({ success: true });
}
