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

  // Capture the previous schedule so we can report what changed
  const previous = await prisma.appointment.findUnique({
    where: { id },
    select: { preferredDate: true, preferredTime: true },
  });

  if (!previous) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 }
    );
  }

  const newDate = new Date(`${preferredDate}T00:00:00`);
  const scheduleChanged =
    previous.preferredDate.getTime() !== newDate.getTime() ||
    previous.preferredTime !== preferredTime;

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      preferredDate: newDate,
      preferredTime,
    },
  });

  const previousDate = previous.preferredDate.toLocaleDateString();
  const newDateFormatted = appointment.preferredDate.toLocaleDateString();

  const message = `Your appointment has been rescheduled.<br /><br />
    <strong>Previous:</strong> ${previousDate} at ${previous.preferredTime}<br />
    <strong>New:</strong> ${newDateFormatted} at ${appointment.preferredTime}`;

  const plainMessage = `Your appointment has been rescheduled. Previous: ${previousDate} at ${previous.preferredTime}. New: ${newDateFormatted} at ${appointment.preferredTime}.`;

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
        message: plainMessage,
        type: "APPOINTMENT_RESCHEDULED",
      },
    });
  }

  // Email only when the schedule actually changed, and only after the
  // database update succeeded. Failures are logged, never rolled back.
  if (scheduleChanged) {
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
  }

  return NextResponse.json({ appointment });
}