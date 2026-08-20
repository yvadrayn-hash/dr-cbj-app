import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const appointmentSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  sessionType: z.enum([
    "INITIAL_CONSULTATION",
    "FOLLOW_UP",
    "ASSESSMENT",
    "FAMILY_SESSION",
    "TRAINING",
  ]),
  sessionMode: z.enum(["IN_PERSON", "VIRTUAL"]),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
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

    const appointment = await prisma.appointment.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        phone,
        preferredDate: new Date(preferredDate),
        preferredTime,
        sessionType,
        sessionMode,
        notes,
        status: "PENDING",
      },
    });

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
