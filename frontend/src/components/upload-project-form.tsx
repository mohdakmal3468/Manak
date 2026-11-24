"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { apiRequest, getAccessToken } from "@/lib/api";
import type { Project } from "@/lib/types";

function LinkStatus({
  label,
  url,
  verified,
}: {
  label: string;
  url: string | null;
  verified: boolean;
}) {
  const message = !url ? "Not provided" : verified ? "Verified" : "Not verified";

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`text-sm font-semibold ${
          !url || verified ? "text-brand-700" : "text-amber-700"
        }`}
      >
        {message}
      </span>
    </div>
  );
}

export default function UploadProjectForm() {
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!getAccessToken()) {
      setError("Log in before submitting a project.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const techTags = String(formData.get("tech_tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const project = await apiRequest<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          github_url: formData.get("github_url"),
          live_url: formData.get("live_url") || null,
          category: formData.get("category"),
          tech_tags: techTags,
        }),
      });
      setCreatedProject(project);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit the project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdProject) {
    return (
      <Card className="w-full max-w-2xl">
        <p className="text-sm font-semibold text-brand-700">Project submitted</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          {createdProject.title}
        </h1>
        <div className="mt-5">
          <LinkStatus
            label="GitHub repository"
            url={createdProject.github_url}
            verified={createdProject.github_verified}
          />
          <LinkStatus
            label="Live demo"
            url={createdProject.live_url}
            verified={createdProject.live_verified}
          />
        </div>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          href={`/projects/${createdProject.id}`}
        >
          View project
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <p className="text-sm font-semibold text-brand-700">Share your work</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        Upload a project
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Add the essentials so the community can explore and review your project.
      </p>
      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Project title
          <input
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            maxLength={200}
            name="title"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            name="description"
            required
            rows={4}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          GitHub repository
          <input
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            name="github_url"
            placeholder="https://github.com/you/project"
            required
            type="url"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Live demo link <span className="font-normal text-slate-400">(optional)</span>
          <input
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            name="live_url"
            placeholder="https://your-project.vercel.app"
            type="url"
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Category
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              maxLength={100}
              name="category"
              placeholder="Web application"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Tech tags
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3.5 text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              name="tech_tags"
              placeholder="Next.js, Python, PostgreSQL"
            />
          </label>
        </div>
        {error && (
          <p aria-live="polite" className="text-sm text-red-600">
            {error}{" "}
            {!getAccessToken() && (
              <Link className="font-semibold underline" href="/login">
                Log in
              </Link>
            )}
          </p>
        )}
        <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Submitting and checking links..." : "Submit project"}
        </Button>
      </form>
    </Card>
  );
}
