import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateCompanySchema = z.object({
  companyName: z.string().min(1, "Company name is required").optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z
    .string()
    .email("Invalid contact email")
    .nullable()
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().nullable().optional(),
  billingAddress: z.string().nullable().optional(),
  billingFrequency: z
    .enum(["WEEKLY", "FORTNIGHTLY", "MONTHLY", "MANUAL"])
    .optional(),
  notes: z.string().nullable().optional(),
  // Replace the full set of sponsored employees
  employeeIds: z.array(z.string()).optional(),
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

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      employees: {
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      },
      invoices: {
        include: {
          items: true,
          payments: { where: { status: "COMPLETED" } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({ company });
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

  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateCompanySchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.contactName !== undefined) updateData.contactName = data.contactName || null;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail || null;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone || null;
    if (data.billingAddress !== undefined) updateData.billingAddress = data.billingAddress || null;
    if (data.billingFrequency !== undefined) updateData.billingFrequency = data.billingFrequency;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    // Employee assignment: replace the full set atomically
    if (data.employeeIds) {
      const validEmployees = await prisma.user.findMany({
        where: { id: { in: data.employeeIds }, role: "CLIENT" },
        select: { id: true },
      });

      await prisma.company.update({
        where: { id },
        data: {
          ...updateData,
          employees: {
            set: validEmployees.map((employee) => ({ id: employee.id })),
          },
        },
      });
    } else {
      await prisma.company.update({
        where: { id },
        data: updateData,
      });
    }

    const updated = await prisma.company.findUnique({
      where: { id },
      include: {
        employees: {
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        },
      },
    });

    return NextResponse.json({ company: updated });
  } catch (error) {
    console.error("Company update error:", error);
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

  const company = await prisma.company.findUnique({
    where: { id },
    include: { _count: { select: { invoices: true } } },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (company._count.invoices > 0) {
    return NextResponse.json(
      {
        error:
          "This company has invoices on record and cannot be deleted. Remove or reassign its invoices first.",
      },
      { status: 400 }
    );
  }

  await prisma.company.delete({ where: { id } });

  return NextResponse.json({ success: true });
}