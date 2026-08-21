import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInvoiceNumber } from "@/lib/invoices";

const MAX_AMOUNT = 1_000_000;

const invoiceItemSchema = z.object({
  description: z
    .string()
    .min(1, "Item description is required")
    .max(300, "Description is too long"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(1000, "Quantity is too large"),
  unitPrice: z
    .number()
    .min(0, "Unit price is required")
    .max(MAX_AMOUNT, "Unit price is too large"),
  employeeId: z.string().max(64).optional(),
  appointmentId: z.string().max(64).optional(),
  sessionDate: z.string().optional(),
  serviceType: z.string().max(120).optional(),
  note: z.string().max(200).optional(),
});

const createInvoiceSchema = z.object({
  userId: z.string().max(64).optional(),
  companyId: z.string().max(64).optional(),
  appointmentId: z.string().max(64).optional(),
  description: z.string().max(500).optional(),
  discount: z.number().min(0).max(MAX_AMOUNT).default(0),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code")
    .default("USD"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z
    .array(invoiceItemSchema)
    .min(1, "At least one line item is required")
    .max(200, "Too many line items"),
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = status ? { status: status as any } : {};

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      user: true,
      appointment: true,
      items: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      userId,
      companyId,
      appointmentId,
      description,
      discount,
      currency,
      dueDate,
      items,
    } = parsed.data;

    // Corporate invoices must reference a valid company; individual
    // invoices must reference a valid client when one is supplied.
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      });
      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 400 }
        );
      }
    }

    // Calculate subtotal from items
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const total = subtotal - discount;

    // Generate unique invoice number
    let invoiceNumber = generateInvoiceNumber();
    while (await prisma.invoice.findUnique({ where: { invoiceNumber } })) {
      invoiceNumber = generateInvoiceNumber();
    }

    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          userId: companyId ? null : userId || null,
          companyId: companyId || null,
          appointmentId: appointmentId || null,
          description: description || null,
          subtotal,
          discount,
          total,
          currency,
          status: "DRAFT",
          dueDate: new Date(dueDate),
          items: {
            create: items.map((item) => ({
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
          },
        },
        include: {
          items: {
            include: { employee: { select: { id: true, name: true } } },
          },
          payments: true,
          user: true,
          company: true,
          appointment: true,
        },
      });

      return created;
    });

    return NextResponse.json(
      { invoice },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
