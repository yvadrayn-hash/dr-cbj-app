import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendIntakeReminderEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/email";

/**
 * Daily intake reminder cron endpoint.
 *
 * Protected via the CRON_SECRET bearer token (set in Vercel env / vercel.json).
 * Never public — unauthorized requests are rejected with 401.
 *
 * For each CLIENT user whose intake is still incomplete:
 *  - skip users with no usable email
 *  - skip users already reminded today (one reminder per calendar day)
 *  - send the intake reminder email + in-app notification
 *  - update intakeReminderLastSentAt only after a SUCCESSFUL send
 *
 * Intake content is never included in reminder emails.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // JST/CAM "today" boundary in UTC (Jamaica = UTC-5)
  const todayStart = new Date(now);
  todayStart.setUTCHours(now.getUTCHours() + 5, 0, 0, 0); // 5am UTC == midnight Jamaica
  todayStart.setUTCMinutes(0, 0, 0);

  // Users with incomplete intake: no intakeCompletedAt OR null, plus any
  // existing IntakeForm with status SUBMITTED but user not marked complete.
  const candidates = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      OR: [
        { intakeCompletedAt: null },
        // Back-compat safety: any client without an intake form record
        { intakeForms: { none: {} } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      intakeReminderLastSentAt: true,
    },
  });

  const intakeUrl = `${getAppUrl()}/dashboard/intake`;

  let scanned = candidates.length;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of candidates) {
    if (!user.email) {
      skipped++;
      continue;
    }

    // Idempotency: at most one reminder per client per calendar day.
    const lastSent = user.intakeReminderLastSentAt;
    if (lastSent) {
      const lastDay = new Date(lastSent);
      lastDay.setUTCHours(lastDay.getUTCHours() + 5, 0, 0);
      lastDay.setUTCMinutes(0, 0, 0);
      if (lastDay >= todayStart) {
        skipped++;
        continue;
      }
    }

    try {
      await sendIntakeReminderEmail({
        to: user.email,
        fullName: user.name || "Client",
        intakeUrl,
      });

      // In-app notification (not duplicated on every refresh — keyed by day
      // because lastSent only updates on a successful send)
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Intake Form Reminder",
          message:
            "Please complete your intake form before your first appointment. It only takes a few minutes.",
          type: "INTAKE_REMINDER",
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { intakeReminderLastSentAt: now },
      });

      sent++;
    } catch (error) {
      console.error(
        `Intake reminder failed for user ${user.id}:`,
        error
      );
      failed++;
    }
  }

  return NextResponse.json({ scanned, sent, skipped, failed });
}

// Reject state-changing verbs — GET only, no side effects exposed to
// crawlers/caches via POST etc.
export async function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}