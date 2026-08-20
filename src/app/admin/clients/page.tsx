import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clients",
  description: "Manage registered Dr. CBJ Mental Wellness clients.",
};

export default async function ClientsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
    },
    include: {
      profile: true,
      appointments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Clients</h1>
            <p className="text-gray-600">
              View registered clients and their appointment history.
            </p>
          </div>

          <Link
            href="/admin"
            className="text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            {"\u2190"} Admin Dashboard
          </Link>
        </div>

        <div className="card overflow-x-auto">
          {clients.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              No registered clients yet.
            </p>
          ) : (
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Appointments</th>
                  <th className="py-3 pr-4">Last Appointment</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {clients.map((client) => {
                  const latestAppointment = client.appointments[0];

                  return (
                    <tr
                      key={client.id}
                      className="border-b border-gray-100"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-teal-900">
                          {client.profile?.fullName || client.name}
                        </p>
                      </td>

                      <td className="py-4 pr-4">
                        {client.email}
                      </td>

                      <td className="py-4 pr-4">
                        {client.profile?.phone || "Not provided"}
                      </td>

                      <td className="py-4 pr-4">
                        {client.appointments.length}
                      </td>

                      <td className="py-4 pr-4">
                        {latestAppointment
                          ? latestAppointment.preferredDate.toLocaleDateString()
                          : "None"}
                      </td>

                      <td className="py-4 pr-4">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="inline-flex rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          View Client
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}