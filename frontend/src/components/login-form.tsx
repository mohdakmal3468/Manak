"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import {
  apiRequest,
  storeAccessToken,
  storeUserId,
  type LoginResponse,
} from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      storeAccessToken(result.access_token);
      storeUserId(result.user.id);
      router.push("/");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to log in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-7 sm:p-8">
      <p className="text-sm font-semibold text-brand-700">Welcome back</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        Log in to MANAK
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Sign in to share projects and give peer feedback.
      </p>
      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            autoComplete="email"
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            autoComplete="current-password"
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            name="password"
            required
            type="password"
          />
        </label>
        {error && (
          <p aria-live="polite" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to MANAK?{" "}
        <Link className="font-semibold text-brand-700 hover:text-brand-600" href="/signup">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
