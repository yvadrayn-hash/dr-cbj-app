import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const intakeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  dateOfBirth: z.string().optional(),
  phone: z.string().min(7, "Phone number is required"),
  emergencyContact: z.string().optional(),
  reasonForVisit: z.string().min(5, "Reason for visit is required"),
  currentSymptoms: z.string().optional(),
  medications: z.string().optional(),
  previousTreatment: z.string().optional(),
  goals: z.string().optional(),
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