import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import CompanyForm from "@/components/admin/CompanyForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Companies | Admin",
  description: "Manage corporate billing accounts.",
};

export default async function CompaniesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [companies, clients] = await Promise.all([
    prisma.company.findMany({
      include: {
        employees: { select: { id: true }, orderBy: { name: "asc" } },
        invoices: {
          select: { id: true, invoiceNumber: true, total: true, status: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { companyName: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-sm text-teal-700 hover:text-teal-900 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="section-title">Companies / Corporate Billing</h1>
            <p className="text-gray-600">
              Manage company accounts that sponsor therapy for their employees.
              Billing frequency is a preference — you can always generate an
              invoice manually at any time.
            </p>
          </div>

          <Link href="/admin/invoices" className="btn-primary !px-4 !py-2 text-sm">
            Invoices and Payments
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Create form */}
          <div className="card">
            <h2 className="text-lg font-bold text-teal-900 mb-4">
              Add a Company
            </h2>
            <CompanyForm clients={clients} />
          </div>

          {/* Company list */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-teal-900">
              All Companies ({companies.length})
            </h2>

            {companies.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-gray-500">
                  No companies yet. Create your first corporate account using
                  the form.
                </p>
              </div>
            ) : (
              companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/admin/companies/${company.id}`}
                  className="card block hover:bg-teal-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-teal-900 break-words">
                        {company.companyName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {company.contactName || "No contact name"}
                        {company.contactEmail ? ` · ${company.contactEmail}` : ""}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Billing:{" "}
                        {company.billingFrequency.charAt(0) +
                          company.billingFrequency.slice(1).toLowerCase()}
                        {" · "}
                        {company.employees.length} employee
                        {company.employees.length === 1 ? "" : "s"}
                        {" · "}
                        {company.invoices.length} invoice
                        {company.invoices.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <span className="inline-flex self-start rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                      View Details →
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}