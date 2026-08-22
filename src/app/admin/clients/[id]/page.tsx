import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
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

  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      appointments: {
        orderBy: {
          preferredDate: "desc",
        },
      },
      intakeForms: {
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  });

  if (!client || client.role !== "CLIENT") {
    notFound();
  }

  return (
    <div className="py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/admin/clients"
          className="inline-block mb-6 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          {"\u2190"} Back to Clients
        </Link>

        <div className="card mb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-teal-900">
              {client.profile?.fullName || client.name}
            </h1>
            <p className="text-gray-500 mt-1">
              Client Record
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <Detail label="Email" value={client.email} />
            <Detail
              label="Phone"
              value={client.profile?.phone || "Not provided"}
            />
            <Detail
              label="Date of Birth"
              value={
                client.profile?.dateOfBirth
                  ? client.profile.dateOfBirth.toLocaleDateString()
                  : "Not provided"
              }
            />
            <Detail
              label="Emergency Contact"
              value={client.profile?.emergencyContact || "Not provided"}
            />
            <Detail
              label="Address"
              value={client.profile?.address || "Not provided"}
            />
            <Detail
              label="Preferred Contact"
              value={client.profile?.preferredContact || "Not provided"}
            />
            <Detail
              label="Returning Client"
              value={client.profile?.isReturningClient ? "Yes" : "No"}
            />
            <Detail
              label="Registered"
              value={client.createdAt.toLocaleDateString()}
            />

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Intake Status
              </p>
              <div className="mt-1 flex items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    client.intakeCompletedAt
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {client.intakeCompletedAt
                    ? "Intake Complete"
                    : "Intake Incomplete"}
                </span>
                {client.intakeCompletedAt && (
                  <span className="text-xs text-gray-500">
                    Completed{" "}
                    {new Date(client.intakeCompletedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="text-xl font-bold text-teal-900 mb-6">
            Appointment History
          </h2>

          {client.appointments.length === 0 ? (
            <p className="text-gray-500">
              No appointments found.
            </p>
          ) : (
            <div className="space-y-4">
              {client.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-teal-900">
                        {appointment.sessionType
                          .replaceAll("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>

                      <p className="text-sm text-gray-600 mt-1">
                        {appointment.preferredDate.toLocaleDateString()} at{" "}
                        {appointment.preferredTime}
                      </p>

                      <p className="text-sm text-gray-500">
                        {appointment.sessionMode === "IN_PERSON"
                          ? "In-Person"
                          : "Virtual"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
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

                      <Link
                        href={`/admin/appointments/${appointment.id}`}
                        className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-teal-900 mb-6">
            Intake Forms
          </h2>

          {client.intakeForms.length === 0 ? (
            <p className="text-gray-500">
              No intake forms submitted yet.
            </p>
          ) : (
            <div className="space-y-4">
              {client.intakeForms.map((form) => (
                <div
                  key={form.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <p className="font-semibold text-teal-900">
                    Submitted {form.submittedAt.toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {form.reasonForVisit}
                  </p>
                </div>
              ))}
            </div>
          )}
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