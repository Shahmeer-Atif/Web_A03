"use client";

// Signup page. POSTs the form to /api/auth/signup, then auto-signs the
// user in via NextAuth so they don't have to type the password again.
// Server-side errors come back in our standard envelope and are surfaced
// either against the offending field or as a top-level message.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validators/auth";

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupInput) => {
    setServerError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!json.ok) {
      const fields = json.error?.fields as
        | Record<string, string[]>
        | undefined;
      if (fields) {
        for (const [k, msgs] of Object.entries(fields)) {
          setError(k as keyof SignupInput, { message: msgs[0] });
        }
      }
      setServerError(json.error?.message ?? "Sign-up failed");
      return;
    }

    // Auto sign-in so the user lands directly on the dashboard.
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          New accounts join as agents. Admins are minted via the seed script.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Field label="Full name" error={errors.name?.message}>
            <input className="input" autoComplete="name" {...register("name")} />
          </Field>
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
              autoComplete="new-password"
              className="input"
              {...register("password")}
            />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <input
              type="password"
              autoComplete="new-password"
              className="input"
              {...register("confirmPassword")}
            />
          </Field>

          {serverError && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:underline">
            Sign in
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
