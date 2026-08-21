import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendAppointmentEmail, getAppUrl } from "@/lib/email";
import { NextResponse } from "next/server";

const allowedStatuses = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

function formatSessionType(sessionType: string): string {
  return sessionType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMode(sessionMode: string): string {
  return sessionMode === "IN_PERSON"
    ? "In-Person at Manor Group Health+"
    : "Virtual session";
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
  const body = await request.json();
  const status = body.status as (typeof allowedStatuses)[number];

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid appointment status" },
      { status: 400 }
    );
  }

  // Fetch the current appointment so emails fire only on real transitions
  const current = await prisma.appointment.findUnique({ where: { id } });

  if (!current) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 }
    );
  }

  const statusChanged = current.status !== status;

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

  const formattedDate = appointment.preferredDate.toLocaleDateString();
  const formattedType = formatSessionType(appointment.sessionType);
  const formattedMode = formatMode(appointment.sessionMode);

  let notification:
    | { title: string; message: string; type: string }
    | null = null;

  if (status === "CONFIRMED") {
    notification = {
      title: "Appointment Confirmed",
      message: `Your appointment for ${formattedDate} at ${appointment.preferredTime} has been confirmed.<br /><br />
        <strong>Type:</strong> ${formattedType}<br />
        <strong>Mode:</strong> ${formattedMode}`,
      type: "APPOINTMENT_CONFIRMED",
    };
  } else if (status === "CANCELLED") {
    notification = {
      title: "Appointment Cancelled",
      message: `Your appointment for ${formattedDate} at ${appointment.preferredTime} has been cancelled. If this was a mistake or you would like to rebook, please contact our office or book again online.`,
      type: "APPOINTMENT_CANCELLED",
    };
  } else if (status === "COMPLETED") {
    notification = {
      title: "Appointment Completed",
      message: `Your ${formattedType.toLowerCase()} session on ${formattedDate} at ${appointment.preferredTime} has been marked as completed. Thank you for attending — we look forward to supporting you again.`,
      type: "APPOINTMENT_COMPLETED",
    };
  }

  if (client && notification) {
    await prisma.notification.create({
      data: {
        userId: client.id,
        title: notification.title,
        message: notification.message.replaceAll(/<br\s*\/?>/g, " ").replaceAll(/<[^>]+>/g, ""),
        type: notification.type,
      },
    });
  }

  // Emails are sent only when the status actually changed, and only after
  // the database update succeeded. Failures are logged, never rolled back.
  if (notification && statusChanged) {
    try {
      let extraHtml = "";

      // If the completed appointment has an invoice, link to billing
      if (status === "COMPLETED") {
        const invoice = await prisma.invoice.findFirst({
          where: { appointmentId: appointment.id },
          select: { id: true, invoiceNumber: true },
        });

        if (invoice) {
          extraHtml = `<br /><br />An invoice (${invoice.invoiceNumber}) is available for this session. You can view and pay it any time from your <a href="${getAppUrl()}/dashboard/billing">Billing and Payments</a> page.`;
        }
      }

      await sendAppointmentEmail({
        to: appointment.email,
        subject: notification.title,
        title: notification.title,
        message: notification.message + extraHtml,
      });
    } catch (error) {
      console.error("Appointment email failed:", error);
    }
  }

  return NextResponse.json({ appointment });
}