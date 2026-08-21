import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendAppointmentEmail, getAppUrl } from "@/lib/email";
import { siteConfig } from "@/lib/site";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const appointmentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name is required")
    .max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(254),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .max(20, "Phone number is too long"),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  preferredTime: z.string().min(1).max(20),
  sessionType: z.enum([
    "INITIAL_CONSULTATION",
    "FOLLOW_UP",
    "ASSESSMENT",
    "FAMILY_SESSION",
    "TRAINING",
  ]),
  sessionMode: z.enum(["IN_PERSON", "VIRTUAL"]),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    // Abuse protection for public booking
    const limit = rateLimit(`booking:${getClientIp(request)}`, 10, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many booking attempts. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone,
      preferredDate,
      preferredTime,
      sessionType,
      sessionMode,
      notes,
    } = parsed.data;

    const requestedDate = new Date(`${preferredDate}T00:00:00`);

    if (Number.isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date" },
        { status: 400 }
      );
    }

    // Reject dates more than 2 years in the future or in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const twoYearsOut = new Date(now);
    twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2);

    if (requestedDate < now || requestedDate > twoYearsOut) {
      return NextResponse.json(
        { error: "Please choose a valid upcoming date." },
        { status: 400 }
      );
    }

    // —— Double-booking protection (server-side) ——
    // A serializable transaction re-checks availability at write time so two
    // simultaneous requests for the same slot cannot both succeed. Cancelled
    // appointments do not block a slot.
    let appointment;
    try {
      appointment = await prisma.$transaction(
        async (tx) => {
          const existing = await tx.appointment.findFirst({
            where: {
              preferredDate: requestedDate,
              preferredTime,
              status: { not: "CANCELLED" },
            },
            select: { id: true },
          });

          if (existing) {
            throw new Error("SLOT_TAKEN");
          }

          return tx.appointment.create({
            data: {
              fullName,
              email: email.toLowerCase(),
              phone,
              preferredDate: requestedDate,
              preferredTime,
              sessionType,
              sessionMode,
              notes,
              status: "PENDING",
            },
          });
        },
        { isolationLevel: "Serializable" }
      );
    } catch (txError) {
      if (
        txError instanceof Error &&
        txError.message === "SLOT_TAKEN"
      ) {
        return NextResponse.json(
          {
            error:
              "That time was just booked. Please choose another available time.",
          },
          { status: 409 }
        );
      }
      throw txError;
    }

    // —— Emails (sent only after the DB write succeeds; failures are logged,
    //    never rolled back) ——
    const formattedType = sessionType
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const formattedMode =
      sessionMode === "IN_PERSON"
        ? "In-Person at Manor Group Health+"
        : "Virtual session";
    const formattedDate = appointment.preferredDate.toLocaleDateString();

    // 1. Client confirmation
    try {
      await sendAppointmentEmail({
        to: appointment.email,
        subject: "Appointment Request Received",
        title: "Appointment Request Received",
        message: `Dear ${fullName}, thank you for booking with Dr. CBJ Mental Wellness. We have received your appointment request and our office will confirm your session shortly.`,
      });
    } catch (error) {
      console.error("Booking confirmation email failed:", error);
    }

    // 2. Admin notification
    try {
      await sendAppointmentEmail({
        to: siteConfig.email,
        subject: `New Appointment Request — ${fullName}`,
        title: "New Appointment Request",
        message: `A new appointment request has been submitted.<br /><br />
          <strong>Client:</strong> ${fullName}<br />
          <strong>Email:</strong> ${appointment.email}<br />
          <strong>Phone:</strong> ${phone}<br />
          <strong>Date:</strong> ${formattedDate}<br />
          <strong>Time:</strong> ${preferredTime}<br />
          <strong>Type:</strong> ${formattedType}<br />
          <strong>Mode:</strong> ${formattedMode}${notes ? `<br /><strong>Notes:</strong> ${notes}` : ""}<br /><br />
          Manage it in the <a href="${getAppUrl()}/admin">Admin Dashboard</a>.`,
      });
    } catch (error) {
      console.error("Admin booking notification email failed:", error);
    }

    return NextResponse.json(
      {
        message: "Appointment request submitted successfully",
        appointmentId: appointment.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Appointment booking error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Appointment data (incl. reason-for-visit notes) is sensitive —
    // only admins may list it
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status: status as any } : {};

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching appointments." },
      { status: 500 }
    );
  }
}
