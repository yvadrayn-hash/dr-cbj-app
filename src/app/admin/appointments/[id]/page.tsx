import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import AppointmentActions from "@/components/admin/AppointmentActions";
import AdminNotesEditor from "@/components/admin/AdminNotesEditor";
import AppointmentScheduleEditor from "@/components/admin/AppointmentScheduleEditor";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
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

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    notFound();
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="inline-block mb-6 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          {"\u2190"} Back to Admin Dashboard
        </Link>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-teal-900">
                Appointment Details
              </h1>
              <p className="text-gray-500 mt-1">
                Booking ID: {appointment.id}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <Detail label="Full Name" value={appointment.fullName} />
            <Detail label="Email" value={appointment.email} />
            <Detail label="Phone" value={appointment.phone} />

            <Detail
              label="Date of Birth"
              value={
                appointment.dateOfBirth
                  ? appointment.dateOfBirth.toLocaleDateString()
                  : "Not provided"
              }
            />

            <Detail
              label="Emergency Contact"
              value={appointment.emergencyContact || "Not provided"}
            />

            <Detail
              label="Returning Client"
              value={appointment.isReturningClient ? "Yes" : "No"}
            />

            <Detail
              label="Preferred Date"
              value={appointment.preferredDate.toLocaleDateString()}
            />

            <Detail
              label="Preferred Time"
              value={appointment.preferredTime}
            />

            <Detail
              label="Session Type"
              value={appointment.sessionType
                .replaceAll("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            />

            <Detail
              label="Session Mode"
              value={
                appointment.sessionMode === "IN_PERSON"
                  ? "In-Person"
                  : "Virtual"
              }
            />

            <Detail
              label="Submitted"
              value={appointment.createdAt.toLocaleString()}
            />

            <Detail
              label="Last Updated"
              value={appointment.updatedAt.toLocaleString()}
            />
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="font-semibold text-teal-900 mb-2">
              Client Notes / Reason for Visit
            </h2>
            <div className="rounded-xl bg-gray-50 p-4 text-gray-700 whitespace-pre-wrap">
              {appointment.notes || "No notes provided."}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold text-teal-900 mb-2">
              Admin Notes
            </h2>

            <AdminNotesEditor
              appointmentId={appointment.id}
              initialNotes={appointment.adminNotes || ""}
            />
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="font-semibold text-teal-900 mb-4">
              Reschedule Appointment
            </h2>

            <AppointmentScheduleEditor
              appointmentId={appointment.id}
              initialDate={appointment.preferredDate.toISOString().slice(0, 10)}
              initialTime={appointment.preferredTime}
            />
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="font-semibold text-teal-900 mb-4">
              Appointment Actions
            </h2>

            <AppointmentActions
              appointmentId={appointment.id}
              currentStatus={appointment.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-gray-800">{value}</p>
    </div>
  );
}