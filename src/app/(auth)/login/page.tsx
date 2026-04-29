"use client";

// Login page. Uses NextAuth's client-side `signIn('credentials', ...)` with
// `redirect: false` so we can show inline errors instead of bouncing to
// Auth.js's default error URL. After a successful sign-in we route to the
// landing page (`/`) — proxy.ts then redirects to /admin or /agent based on
// the role embedded in the JWT.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    setSubmitting(true);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setSubmitting(false);

    if (!res || res.error) {
      setServerError("Invalid email or password");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back to Property Dealer CRM.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              className="input"
              {...register("email")}
            />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input
              type="password"
              autoComplete="current-password"
              className="input"
              {...register("password")}
            />
          </Field>

          {serverError && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          New to the CRM?{" "}
          <Link href="/signup" className="font-medium text-emerald-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}
