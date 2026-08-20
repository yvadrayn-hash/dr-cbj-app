import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail =
  process.env.RESEND_FROM_EMAIL || "Dr. CBJ Mental Wellness <onboarding@resend.dev>";

export async function sendAppointmentEmail({
  to,
  subject,
  title,
  message,
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#163c3c;">
        <h2 style="margin-bottom:16px;">${title}</h2>
        <p style="font-size:16px;line-height:1.6;">${message}</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />
        <p style="font-size:14px;color:#666;">
          Dr. CBJ Mental Wellness<br />
          Manor Group Health+
        </p>
      </div>
    `,
  });
}