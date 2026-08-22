// Invoice & Payment utility helpers for Dr. CBJ Mental Wellness
// Handles Decimal formatting, status badges, and computed totals

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "PAYPAL" | "PAYONEER" | "OTHER";

/**
 * Coerce a Decimal / number / string to a JS number.
 * Handles Prisma Decimal objects (with or without .toNumber), numeric
 * strings (incl. currency-formatted), and plain numbers. Returns 0 for
 * anything unparseable rather than NaN so balances always compute.
 */
export function toNumber(
  value: unknown
): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return parseMoneyString(value);
  if (typeof (value as { toNumber?: unknown }).toNumber === "function") {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  // Decimal-like objects (e.g. decimal.js instances without toNumber bound)
  if (typeof (value as { valueOf?: unknown }).valueOf === "function") {
    const n = Number((value as { valueOf: () => unknown }).valueOf());
    if (Number.isFinite(n)) return n;
  }
  return parseMoneyString(String(value));
}

function parseMoneyString(raw: string): number {
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Effective display status: an invoice that is still SENT but past its due
 * date is treated as OVERDUE at read time (no background job exists).
 */
export function invoiceEffectiveStatus(
  status: InvoiceStatus,
  dueDate: Date | string
): InvoiceStatus {
  if (status !== "SENT") return status;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const endOfDay = new Date(due);
  endOfDay.setHours(23, 59, 59, 999);
  return new Date() > endOfDay ? "OVERDUE" : "SENT";
}

/**
 * Whether an invoice currently has money owed:
 * SENT / PARTIALLY_PAID / OVERDUE (including dynamically-overdue SENT).
 */
export function isOutstandingInvoice(
  status: InvoiceStatus,
  dueDate: Date | string
): boolean {
  const effective = invoiceEffectiveStatus(status, dueDate);
  return (
    effective === "SENT" ||
    effective === "PARTIALLY_PAID" ||
    effective === "OVERDUE"
  );
}

/**
 * Format a monetary value as a USD-style currency string.
 * e.g. 1299.99 → "$1,299.99"
 */
export function formatMoney(
  amount: unknown,
  currency = "USD"
): string {
  const num = toNumber(amount);

  if (currency === "USD") {
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Compact money formatting for tables — always 2 decimals.
 */
export function formatMoneyCompact(amount: unknown): string {
  return formatMoney(amount);
}

/** Human-readable invoice status labels */
export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

/** Human-readable payment status labels */
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

/** Payment method labels */
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  PAYPAL: "PayPal",
  PAYONEER: "Payoneer",
  OTHER: "Other",
};

/** Tailwind badge classes for invoice statuses */
export function invoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "SENT":
      return "bg-amber-100 text-amber-800";
    case "PARTIALLY_PAID":
      return "bg-blue-100 text-blue-800";
    case "PAID":
      return "bg-green-100 text-green-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    case "CANCELLED":
      return "bg-gray-200 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/** Tailwind badge classes for payment statuses */
export function paymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "REFUNDED":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/** Generate a unique invoice number */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `INV-${year}-${random}`;
}

/** Generate a unique payment transaction reference */
export function generateTransactionReference(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${ts}-${random}`;
}

/**
 * Determine the invoice status based on payments vs total.
 * - If all completed payments >= total → PAID
 * - If some payments > 0 → PARTIALLY_PAID
 * - Otherwise preserve the existing status
 */
export function computeInvoiceStatus(
  total: number,
  amountPaid: number,
  currentStatus: InvoiceStatus,
  dueDate: Date
): InvoiceStatus {
  if (currentStatus === "CANCELLED" || currentStatus === "DRAFT") {
    return currentStatus;
  }

  if (amountPaid >= total && amountPaid > 0) {
    return "PAID";
  }

  if (amountPaid > 0) {
    return "PARTIALLY_PAID";
  }

  if (new Date() > dueDate && total > 0) {
    return "OVERDUE";
  }

  return currentStatus;
}
