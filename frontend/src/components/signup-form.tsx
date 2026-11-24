"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { apiRequest, type SignupResponse } from "@/lib/api";

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      await apiRequest<SignupResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      setIsCreated(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-7 sm:p-8">
      <p className="text-sm font-semibold text-brand-700">Join the community</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        Create your account
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Start sharing projects and learning from peer reviews.
      </p>
      {isCreated ? (
        <div aria-live="polite" className="mt-7 rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
          Account created.{" "}
          <Link className="font-semibold underline underline-offset-2" href="/login">
            Log in to continue
          </Link>
          .
        </div>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input
              autoComplete="name"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              maxLength={100}
              name="name"
              required
              type="text"
            />
          </label>
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
              autoComplete="new-password"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              minLength={8}
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      )}
      {!isCreated && (
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-brand-700 hover:text-brand-600" href="/login">
            Log in
          </Link>
        </p>
      )}
    </Card>
  );
}
