import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client Dashboard",
  description: "Your personal wellness dashboard.",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const [appointments, profile, notifications, user] = await Promise.all([
    prisma.appointment.findMany({
      where: { email: session?.user?.email || "" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.profile.findUnique({
      where: { userId },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { intakeCompletedAt: true },
    }),
  ]);

  // Intake is required before the first appointment. New clients (or anyone
  // whose intakeCompletedAt is null) see a daily reminder notice at the top of
  // their dashboard. Existing completed intake remains intact.
  const intakeComplete = Boolean(user?.intakeCompletedAt);

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="section-title">
              Welcome, {profile?.fullName || session?.user?.name || "Friend"}
            </h1>
          <p className="text-gray-600">
            Your personal wellness dashboard. Track your appointments, explore
            resources, and continue your healing journey.
          </p>
        </div>

        {!intakeComplete && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4">
            <p className="text-sm text-amber-900">
              Please complete your intake form before your first appointment.
            </p>
            <Link
              href="/dashboard/intake"
              className="mt-2 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              Complete Intake Form
            </Link>
          </div>
        )}

          <NotificationBell
            notifications={notifications.map((notification) => ({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              isRead: notification.isRead,
              createdAt: notification.createdAt.toISOString(),
            }))}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold text-teal-900 mb-1">Appointments</h3>
            <p className="text-2xl font-bold text-teal-600">
              {appointments.length}
            </p>
            <p className="text-sm text-gray-500">Total bookings</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-semibold text-teal-900 mb-1">Wellness Resources</h3>
            <p className="text-2xl font-bold text-teal-600">10+</p>
            <p className="text-sm text-gray-500">Articles and exercises</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-semibold text-teal-900 mb-1">AI Assistant</h3>
            <p className="text-sm text-gray-500">Always available for support</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-teal-900 mb-4">
              Upcoming Appointments
            </h2>
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="card border-l-4 border-l-teal-500">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-teal-900">
                          {appt.sessionType.replace(/_/g, " ")}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(appt.preferredDate).toLocaleDateString()}
                          {" at "}
                          {appt.preferredTime}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appt.sessionMode === "IN_PERSON"
                            ? "In-Person"
                            : "Virtual"}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          appt.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : appt.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-700"
                            : appt.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl">
                <p className="text-gray-500 mb-4">No appointments yet.</p>
                <Link href="/book" className="btn-primary">
                  Book Your First Appointment
                </Link>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-teal-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link href="/book" className="card group block">
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-2xl shadow-sm">
        {"\u{1F4C5}"}
      </div>

      <div>
        <p className="font-semibold text-teal-900">
          Book Appointment
        </p>
        <p className="text-sm text-gray-500">
          Schedule a new session
        </p>
      </div>
    </div>

    <span className="text-xl text-teal-500 transition-transform group-hover:translate-x-1">
      {"\u2192"}
    </span>
  </div>
</Link>

<Link href="/chat" className="card group block">
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender-100 text-2xl shadow-sm">
        {"\u{1F4AC}"}
      </div>

      <div>
        <p className="font-semibold text-teal-900">
          AI Wellness Assistant
        </p>
        <p className="text-sm text-gray-500">
          Chat for general wellness support
        </p>
      </div>
    </div>

    <span className="text-xl text-teal-500 transition-transform group-hover:translate-x-1">
      {"\u2192"}
    </span>
  </div>
</Link>

<Link href="/wellness-library" className="card block hover:bg-teal-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="font-semibold text-teal-900">
                      Wellness Library
                    </p>
                    <p className="text-sm text-gray-500">
                      Articles and exercises
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/billing" className="card block hover:bg-teal-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="font-semibold text-teal-900">
                      Billing and Payments
                    </p>
                    <p className="text-sm text-gray-500">
                      View your invoices and payment history
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/intake" className="card block hover:bg-teal-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{"\u{1F4CB}"}</span>
                  <div>
                    <p className="font-semibold text-teal-900">
                      Complete Intake Form
                    </p>
                    <p className="text-sm text-gray-500">
                      Submit your client intake information
                    </p>
                  </div>
                </div>
              </Link>

              <Link href="/daily-wellness" className="card block hover:bg-teal-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <p className="font-semibold text-teal-900">
                      Daily Wellness
                    </p>
                    <p className="text-sm text-gray-500">
                      Mood tracking and reflections
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
