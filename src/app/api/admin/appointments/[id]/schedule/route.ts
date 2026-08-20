import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendAppointmentEmail } from "@/lib/email";
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

  const preferredDate = String(body.preferredDate || "");
  const preferredTime = String(body.preferredTime || "");

  if (!preferredDate || !preferredTime) {
    return NextResponse.json(
      { error: "Date and time are required" },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      preferredDate: new Date(`${preferredDate}T00:00:00`),
      preferredTime,
    },
  });

  const message = `Your appointment has been rescheduled to ${appointment.preferredDate.toLocaleDateString()} at ${appointment.preferredTime}.`;

  const client =
    appointment.userId
      ? await prisma.user.findUnique({
          where: { id: appointment.userId },
        })
      : await prisma.user.findUnique({
          where: { email: appointment.email },
        });

  if (client) {
    await prisma.notification.create({
      data: {
        userId: client.id,
        title: "Appointment Rescheduled",
        message,
        type: "APPOINTMENT_RESCHEDULED",
      },
    });
  }

  try {
    await sendAppointmentEmail({
      to: appointment.email,
      subject: "Appointment Rescheduled",
      title: "Appointment Rescheduled",
      message,
    });
  } catch (error) {
    console.error("Appointment email failed:", error);
  }

  return NextResponse.json({ appointment });
}