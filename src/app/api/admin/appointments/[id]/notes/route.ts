import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  const adminNotes =
    typeof body.adminNotes === "string"
      ? body.adminNotes.trim().slice(0, 5000)
      : "";

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      adminNotes: adminNotes || null,
    },
  });

  return NextResponse.json({ appointment });
}