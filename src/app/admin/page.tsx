import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppointmentActions from "@/components/admin/AppointmentActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
  description: "Manage Dr. CBJ Mental Wellness appointments.",
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const appointments = await prisma.appointment.findMany({
    orderBy: [
      { preferredDate: "asc" },
      { preferredTime: "asc" },
    ],
  });

  const pending = appointments.filter((a: { status: AppointmentStatus }) => a.status === "PENDING").length;
  const confirmed = appointments.filter((a: { status: AppointmentStatus }) => a.status === "CONFIRMED").length;
  const completed = appointments.filter((a: { status: AppointmentStatus }) => a.status === "COMPLETED").length;
  const cancelled = appointments.filter((a: { status: AppointmentStatus }) => a.status === "CANCELLED").length;

  const invoices = await prisma.invoice.findMany({
    include: { payments: { where: { status: "COMPLETED" } } },
  });

  const outstandingInvoices = invoices.filter(
    (invoice) =>
      invoice.status === "SENT" ||
      invoice.status === "PARTIALLY_PAID" ||
      invoice.status === "OVERDUE"
  ).length;

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="section-title">Admin Dashboard</h1>
            <p className="text-gray-600">
              Manage appointments and client booking requests.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/invoices"
              className="btn-primary !px-4 !py-2 text-sm"
            >
              Invoices and Payments
            </Link>

            <Link
              href="/admin/companies"
              className="btn-primary !px-4 !py-2 text-sm"
            >
              Companies
            </Link>

            <Link
              href="/admin/clients"
              className="btn-primary !px-4 !py-2 text-sm"
            >
              Clients
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-3xl font-bold text-amber-500">{pending}</p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-teal-600">{confirmed}</p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Outstanding Invoices</p>
            <p className="text-3xl font-bold text-amber-500">
              {outstandingInvoices}
            </p>
          </div>

          <div className="card text-center">
            <p className="text-sm text-gray-500 mb-1">Total Invoices</p>
            <p className="text-3xl font-bold text-teal-600">{invoices.length}</p>
          </div>
        </div>

        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-teal-900">
              Appointments
            </h2>
            <p className="text-sm text-gray-500">
              {appointments.length} total booking request
              {appointments.length === 1 ? "" : "s"}
            </p>
          </div>

          {appointments.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">
              No appointments yet.
            </p>
          ) : (
            <>
            {/* Mobile: responsive appointment cards */}
            <div className="md:hidden space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-teal-900 break-words">
                        {appointment.fullName}
                      </p>
                      <p className="text-sm text-gray-600 break-words">
                        {appointment.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        {appointment.phone}
                      </p>
                    </div>

                    <span
                      className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${
                        appointment.status === "CONFIRMED"
                          ? "bg-teal-100 text-teal-800"
                          : appointment.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Date
                      </dt>
                      <dd className="mt-0.5">
                        {appointment.preferredDate.toLocaleDateString()}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Time
                      </dt>
                      <dd className="mt-0.5">{appointment.preferredTime}</dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Session
                      </dt>
                      <dd className="mt-0.5">
                        {appointment.sessionType
                          .replaceAll("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Mode
                      </dt>
                      <dd className="mt-0.5">
                        {appointment.sessionMode === "IN_PERSON"
                          ? "In-Person"
                          : "Virtual"}
                      </dd>
                    </div>
                  </dl>

                  {appointment.notes && (
                    <p className="text-xs text-gray-500 mb-4 break-words">
                      {appointment.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <AppointmentActions
                      appointmentId={appointment.id}
                      currentStatus={appointment.status}
                    />

                    <Link
                      href={`/admin/appointments/${appointment.id}`}
                      className="inline-flex min-h-[40px] items-center whitespace-nowrap rounded-lg border border-teal-600 px-4 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Contact</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Time</th>
                  <th className="py-3 pr-4">Session</th>
                  <th className="py-3 pr-4">Mode</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-b border-gray-100 align-top"
                  >
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-teal-900">
                        {appointment.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.notes}
                      </p>
                    </td>

                    <td className="py-4 pr-4">
                      <p>{appointment.email}</p>
                      <p className="text-gray-500">{appointment.phone}</p>
                    </td>

                    <td className="py-4 pr-4 whitespace-nowrap">
                      {appointment.preferredDate.toLocaleDateString()}
                    </td>

                    <td className="py-4 pr-4 whitespace-nowrap">
                      {appointment.preferredTime}
                    </td>

                    <td className="py-4 pr-4">
                      {appointment.sessionType
                        .replaceAll("_", " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>

                    <td className="py-4 pr-4">
                      {appointment.sessionMode === "IN_PERSON"
                        ? "In-Person"
                        : "Virtual"}
                    </td>

                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          appointment.status === "CONFIRMED"
                            ? "bg-teal-100 text-teal-800"
                            : appointment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>

                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <AppointmentActions
                          appointmentId={appointment.id}
                          currentStatus={appointment.status}
                        />

                        <Link
                          href={`/admin/appointments/${appointment.id}`}
                          className="inline-flex min-h-[40px] items-center whitespace-nowrap rounded-lg border border-teal-600 px-4 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                        >
                          View Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
