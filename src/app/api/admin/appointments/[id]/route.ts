import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendAppointmentEmail } from "@/lib/email";
import { NextResponse } from "next/server";

const allowedStatuses = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

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
  const status = body.status as (typeof allowedStatuses)[number];

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid appointment status" },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  const client =
    appointment.userId
      ? await prisma.user.findUnique({
          where: { id: appointment.userId },
        })
      : await prisma.user.findUnique({
          where: { email: appointment.email },
        });

  let notification:
    | { title: string; message: string; type: string }
    | null = null;

  if (status === "CONFIRMED") {
    notification = {
      title: "Appointment Confirmed",
      message: `Your appointment for ${appointment.preferredDate.toLocaleDateString()} at ${appointment.preferredTime} has been confirmed.`,
      type: "APPOINTMENT_CONFIRMED",
    };
  } else if (status === "CANCELLED") {
    notification = {
      title: "Appointment Cancelled",
      message: `Your appointment for ${appointment.preferredDate.toLocaleDateString()} at ${appointment.preferredTime} has been cancelled.`,
      type: "APPOINTMENT_CANCELLED",
    };
  } else if (status === "COMPLETED") {
    notification = {
      title: "Appointment Completed",
      message: "Your appointment has been marked as completed.",
      type: "APPOINTMENT_COMPLETED",
    };
  }

  if (client && notification) {
    await prisma.notification.create({
      data: {
        userId: client.id,
        ...notification,
      },
    });
  }

  if (notification) {
    try {
      await sendAppointmentEmail({
        to: appointment.email,
        subject: notification.title,
        title: notification.title,
        message: notification.message,
      });
    } catch (error) {
      console.error("Appointment email failed:", error);
    }
  }

  return NextResponse.json({ appointment });
}