"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const registered = searchParams.get("registered");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {registered && (
        <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm">
          Account created successfully! Please log in.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="label-field">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="input-field"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="label-field">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="input-field"
          placeholder="Your password"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}