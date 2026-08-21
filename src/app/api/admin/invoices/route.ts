import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInvoiceNumber } from "@/lib/invoices";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price is required"),
  employeeId: z.string().optional(),
  appointmentId: z.string().optional(),
  sessionDate: z.string().optional(),
  serviceType: z.string().optional(),
  note: z.string().optional(),
});

const createInvoiceSchema = z.object({
  userId: z.string().optional(),
  companyId: z.string().optional(),
  appointmentId: z.string().optional(),
  description: z.string().optional(),
  discount: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one line item is required"),
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
