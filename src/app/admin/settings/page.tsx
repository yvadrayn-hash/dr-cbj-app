import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

export const metadata = {
  title: "Admin Settings",
};

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="section-title mb-2">Admin Settings</h1>
        <p className="text-gray-600 mb-8">
          Update the administrator login email and password.
        </p>

        <AdminSettingsForm
          currentEmail={session.user.email || ""}
        />
      </div>
    </div>
  );
}