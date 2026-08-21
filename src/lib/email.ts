import { Resend } from "resend";
import { siteConfig } from "@/lib/site";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail =
  process.env.RESEND_FROM_EMAIL || "Dr. CBJ Mental Wellness <onboarding@resend.dev>";

/**
 * Base URL used for links inside emails.
 * Defaults to the production domain; override with NEXT_PUBLIC_APP_URL.
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://www.drcbjwellness.com";
}

/** Shared branded footer for all Dr. CBJ emails */
function brandFooter(): string {
  return `
    <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />
    <p style="font-size:14px;color:#666;margin:0 0 4px;">
      <strong>Dr. CBJ Mental Wellness</strong><br />
      Manor Group Health<span style="color:#f59e0b;font-weight:bold;">+</span><br />
      Dr. Coretta Brown-Johnson, JP
    </p>
    <p style="font-size:13px;color:#888;margin:8px 0 0;">
      ${siteConfig.phone} · ${siteConfig.email}<br />
      ${siteConfig.address}
    </p>
  `;
}

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
        ${brandFooter()}
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
  description,
  total,
  amountDue,
  dueDate,
  dashboardUrl,
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  invoiceNumber?: string;
  description?: string;
  total?: string;
  amountDue?: string;
  dueDate?: string;
  dashboardUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const summaryHtml =
    invoiceNumber || description || total || amountDue || dueDate
      ? `<table style="margin:20px 0;border-collapse:collapse;font-size:14px;">
         ${invoiceNumber ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Invoice #:</td><td>${invoiceNumber}</td></tr>` : ""}
         ${description ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;vertical-align:top;">Description:</td><td>${description}</td></tr>` : ""}
         ${total ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Total:</td><td>${total}</td></tr>` : ""}
         ${amountDue ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Amount Due:</td><td>${amountDue}</td></tr>` : ""}
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
        ${brandFooter()}
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
  transactionReference,
  remainingBalance,
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  invoiceNumber?: string;
  amount?: string;
  method?: string;
  transactionReference?: string;
  remainingBalance?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const summaryHtml =
    invoiceNumber || amount || method || transactionReference || remainingBalance
      ? `<table style="margin:20px 0;border-collapse:collapse;font-size:14px;">
         ${invoiceNumber ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Invoice #:</td><td>${invoiceNumber}</td></tr>` : ""}
         ${amount ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Amount Received:</td><td>${amount}</td></tr>` : ""}
         ${method ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Method:</td><td>${method}</td></tr>` : ""}
         ${transactionReference ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Reference:</td><td>${transactionReference}</td></tr>` : ""}
         ${remainingBalance ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Remaining Balance:</td><td>${remainingBalance}</td></tr>` : ""}
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
        ${brandFooter()}
      </div>
    `,
  });
}

/**
 * Admin notification: a client submitted a payment declaration.
 */
export async function sendPaymentSubmittedAdminEmail({
  to,
  subject,
  title,
  message,
  invoiceNumber,
  clientName,
  amount,
  method,
  reference,
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  invoiceNumber?: string;
  clientName?: string;
  amount?: string;
  method?: string;
  reference?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const summaryHtml =
    invoiceNumber || clientName || amount || method || reference
      ? `<table style="margin:20px 0;border-collapse:collapse;font-size:14px;">
         ${invoiceNumber ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Invoice #:</td><td>${invoiceNumber}</td></tr>` : ""}
         ${clientName ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Client:</td><td>${clientName}</td></tr>` : ""}
         ${amount ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Amount:</td><td>${amount}</td></tr>` : ""}
         ${method ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Method:</td><td>${method}</td></tr>` : ""}
         ${reference ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Reference:</td><td>${reference}</td></tr>` : ""}
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
        ${brandFooter()}
      </div>
    `,
  });
}