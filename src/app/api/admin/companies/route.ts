import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createCompanySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Invalid contact email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  billingAddress: z.string().optional(),
  billingFrequency: z
    .enum(["WEEKLY", "FORTNIGHTLY", "MONTHLY", "MANUAL"])
    .default("MANUAL"),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const companies = await prisma.company.findMany({
    include: {
      employees: {
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { companyName: "asc" },
  });

  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createCompanySchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;

    const company = await prisma.company.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        billingAddress: data.billingAddress || null,
        billingFrequency: data.billingFrequency,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error("Company creation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}