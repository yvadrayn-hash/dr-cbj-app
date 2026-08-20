import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RegisterForm from "@/components/RegisterForm";

export const metadata = {
  title: "Register",
  description: "Create an account to access your client dashboard.",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="section-title">Create Your Account</h1>
          <p className="text-gray-600">
            Join Dr. CBJ Mental Wellness to access your personal dashboard,
            book appointments, and track your wellness journey.
          </p>
        </div>

        <div className="card">
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}