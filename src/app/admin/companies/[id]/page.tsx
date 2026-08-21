import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  toNumber,
  formatMoney,
  invoiceStatusColor,
  isOutstandingInvoice,
} from "@/lib/invoices";
import type { InvoiceStatus } from "@/lib/invoices";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CompanyForm from "@/components/admin/CompanyForm";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const [company, clients] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        employees: {
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        },
        invoices: {
          include: {
            items: true,
            payments: { where: { status: "COMPLETED" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!company) {
    notFound();
  }

  // Session history per sponsored employee (billing info only — no
  // clinical notes are shown here)
  const employeeSessions = await prisma.appointment.findMany({
    where: { userId: { in: company.employees.map((e) => e.id) } },
    select: {
      id: true,
      userId: true,
      fullName: true,
      preferredDate: true,
      preferredTime: true,
      sessionType: true,
      sessionMode: true,
      status: true,
    },
    orderBy: { preferredDate: "desc" },
  });

  const sessionsByEmployee = new Map<string, typeof employeeSessions>();
  for (const appt of employeeSessions) {
    const key = appt.userId ?? "";
    if (!sessionsByEmployee.has(key)) sessionsByEmployee.set(key, []);
    sessionsByEmployee.get(key)!.push(appt);
  }

  const outstanding = company.invoices
    .filter((invoice) =>
      isOutstandingInvoice(invoice.status, invoice.dueDate)
    )
    .reduce((sum, invoice) => {
      const paid = invoice.payments.reduce((s, p) => s + toNumber(p.amount), 0);
      return sum + Math.max(toNumber(invoice.total) - paid, 0);
    }, 0);

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/companies"
              className="text-sm text-teal-700 hover:text-teal-900 mb-2 inline-block"
            >
              ← Back to Companies
            </Link>
            <h1 className="section-title">{company.companyName}</h1>
            <p className="text-gray-600">
              Corporate billing account ·{" "}
              {company.billingFrequency.charAt(0) +
                company.billingFrequency.slice(1).toLowerCase()}{" "}
              billing preference
            </p>
          </div>

          <Link
            href={`/admin/invoices?company=${company.id}`}
            className="btn-primary !px-4 !py-2 text-sm"
          >
            + New Corporate Invoice
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Employees</p>
            <p className="text-3xl font-bold text-teal-600">
              {company.employees.length}
            </p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Invoices</p>
            <p className="text-3xl font-bold text-teal-600">
              {company.invoices.length}
            </p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Outstanding</p>
            <p className="text-3xl font-bold text-amber-500">
              {formatMoney(outstanding)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-10">
          {/* Edit company + employees */}
          <div className="card">
            <h2 className="text-lg font-bold text-teal-900 mb-4">
              Company Details and Employees
            </h2>
            <CompanyForm
              clients={clients}
              initial={{
                id: company.id,
                companyName: company.companyName,
                contactName: company.contactName ?? "",
                contactEmail: company.contactEmail ?? "",
                contactPhone: company.contactPhone ?? "",
                billingAddress: company.billingAddress ?? "",
                billingFrequency: company.billingFrequency,
                notes: company.notes ?? "",
                employeeIds: company.employees.map((e) => e.id),
              }}
            />
          </div>

          {/* Employees + session history */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold text-teal-900 mb-4">
                Sponsored Employees ({company.employees.length})
              </h2>

              {company.employees.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No employees assigned yet. Use the form to assign existing
                  clients to this company.
                </p>
              ) : (
                <div className="space-y-4">
                  {company.employees.map((employee) => {
                    const appts = sessionsByEmployee.get(employee.id) ?? [];

                    return (
                      <div
                        key={employee.id}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-teal-900 break-words">
                              {employee.name}
                            </p>
                            <p className="text-sm text-gray-500 break-words">
                              {employee.email}
                            </p>
                          </div>

                          <Link
                            href={`/admin/clients/${employee.id}`}
                            className="text-sm font-semibold text-teal-700 hover:text-teal-900 whitespace-nowrap"
                          >
                            Client Record →
                          </Link>
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                          Session History ({appts.length})
                        </p>

                        {appts.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No sessions recorded.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {appts.slice(0, 6).map((appt) => (
                              <li
                                key={appt.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm"
                              >
                                <span className="text-gray-700">
                                  {appt.preferredDate.toLocaleDateString()} at{" "}
                                  {appt.preferredTime} ·{" "}
                                  {appt.sessionType
                                    .replaceAll("_", " ")
                                    .toLowerCase()
                                    .replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
                                  ({appt.sessionMode === "IN_PERSON" ? "In-Person" : "Virtual"})
                                </span>
                                <span className="text-xs text-gray-500">
                                  {appt.status}
                                </span>
                              </li>
                            ))}
                            {appts.length > 6 && (
                              <li className="text-xs text-gray-400">
                                + {appts.length - 6} more sessions
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Company invoices */}
            <div className="card">
              <h2 className="text-lg font-bold text-teal-900 mb-4">
                Invoices Sent to This Company ({company.invoices.length})
              </h2>

              {company.invoices.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No invoices yet. Create one from the button above.
                </p>
              ) : (
                <div className="space-y-3">
                  {company.invoices.map((invoice) => {
                    const paid = invoice.payments.reduce(
                      (s, p) => s + toNumber(p.amount),
                      0
                    );

                    return (
                      <Link
                        key={invoice.id}
                        href={`/admin/invoices/${invoice.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <span className="font-semibold text-teal-900">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="text-gray-600">
                          {formatMoney(invoice.total)} · Paid{" "}
                          {formatMoney(paid)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            invoiceStatusColor(invoice.status as InvoiceStatus)
                          }`}
                        >
                          {invoice.status.replaceAll("_", " ")}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}