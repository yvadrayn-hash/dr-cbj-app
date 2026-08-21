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

export async function sendInvoiceEmail({
  to,
  subject,
  title,
  message,
  invoiceNumber,
  total,
  dueDate,
  dashboardUrl,
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  invoiceNumber?: string;
  total?: string;
  dueDate?: string;
  dashboardUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const summaryHtml =
    invoiceNumber || total || dueDate
      ? `<table style="margin:20px 0;border-collapse:collapse;font-size:14px;">
         ${invoiceNumber ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Invoice #:</td><td>${invoiceNumber}</td></tr>` : ""}
         ${total ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Total:</td><td>${total}</td></tr>` : ""}
         ${dueDate ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Due Date:</td><td>${dueDate}</td></tr>` : ""}
       </table>`
      : "";

  const ctaHtml = dashboardUrl
    ? `<div style="margin:24px 0;text-align:center;">
         <a href="${dashboardUrl}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:bold;">
           View Invoice
         </a>
       </div>`
    : "";

  return resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#163c3c;">
        <h2 style="margin-bottom:16px;">${title}</h2>
        <p style="font-size:16px;line-height:1.6;">${message}</p>
        ${summaryHtml}
        ${ctaHtml}
        <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />
        <p style="font-size:14px;color:#666;">
          Dr. CBJ Mental Wellness<br />
          Manor Group Health+
        </p>
      </div>
    `,
  });
}

export async function sendPaymentRecordedEmail({
  to,
  subject,
  title,
  message,
  invoiceNumber,
  amount,
  method,
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  invoiceNumber?: string;
  amount?: string;
  method?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const summaryHtml =
    invoiceNumber || amount || method
      ? `<table style="margin:20px 0;border-collapse:collapse;font-size:14px;">
         ${invoiceNumber ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Invoice #:</td><td>${invoiceNumber}</td></tr>` : ""}
         ${amount ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Amount:</td><td>${amount}</td></tr>` : ""}
         ${method ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Method:</td><td>${method}</td></tr>` : ""}
       </table>`
      : "";

  return resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#163c3c;">
        <h2 style="margin-bottom:16px;">${title}</h2>
        <p style="font-size:16px;line-height:1.6;">${message}</p>
        ${summaryHtml}
        <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />
        <p style="font-size:14px;color:#666;">
          Dr. CBJ Mental Wellness<br />
          Manor Group Health+
        </p>
      </div>
    `,
  });
}
