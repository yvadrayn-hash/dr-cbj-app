import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Log In",
  description: "Log in to your Dr. CBJ Mental Wellness account.",
};

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="section-title">Welcome Back</h1>
          <p className="text-gray-600">
            Log in to access your dashboard, appointments, and wellness tools.
          </p>
        </div>

        <div className="card">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-teal-600 hover:text-teal-700 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}