import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const intakeSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name is required")
    .max(100, "Name is too long"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .max(20, "Phone number is too long"),
  emergencyContact: z.string().max(100).optional(),
  reasonForVisit: z
    .string()
    .min(5, "Reason for visit is required")
    .max(2000, "Reason is too long"),
  currentSymptoms: z.string().max(2000).optional(),
  medications: z.string().max(1000).optional(),
  previousTreatment: z.string().max(1000).optional(),
  goals: z.string().max(2000).optional(),
  consentGiven: z.literal(true, {
    error: "Consent is required",
  }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = intakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Please check the form and try again.",
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const intakeForm = await prisma.intakeForm.create({
      data: {
        userId: session.user.id,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth
          ? new Date(`${data.dateOfBirth}T00:00:00`)
          : null,
        phone: data.phone,
        email: session.user.email || "",
        emergencyContact: data.emergencyContact || null,
        reasonForVisit: data.reasonForVisit,
        currentSymptoms: data.currentSymptoms || null,
        medications: data.medications || null,
        previousTreatment: data.previousTreatment || null,
        goals: data.goals || null,
        consentGiven: data.consentGiven,
        status: "SUBMITTED",
      },
    });

    // Mark intake as completed and stop all reminders.
    // Existing completed intake remains untouched; this only sets/updates
    // the completion timestamp for a client who just submitted.
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        intakeCompletedAt: new Date(),
        intakeReminderLastSentAt: null,
      },
    });

    await prisma.profile.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth
          ? new Date(`${data.dateOfBirth}T00:00:00`)
          : null,
        emergencyContact: data.emergencyContact || null,
      },
      create: {
        userId: session.user.id,
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth
          ? new Date(`${data.dateOfBirth}T00:00:00`)
          : null,
        emergencyContact: data.emergencyContact || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        intakeFormId: intakeForm.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Intake submission error:", error);

    return NextResponse.json(
      { error: "Could not submit the intake form." },
      { status: 500 }
    );
  }
}