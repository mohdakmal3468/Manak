"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function DashboardProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      setProjects(await apiRequest<Project[]>("/projects/mine"));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <div>
        <p className="text-sm font-semibold text-brand-700">Owner view</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Performance dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose a project to see its score history and version-by-version
          feedback.
        </p>
      </div>
      {error && (
        <div
          aria-live="polite"
          className="mt-7 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}{" "}
          <Link className="font-semibold underline" href="/login">
            Log in
          </Link>{" "}
          if your session has expired.
        </div>
      )}
      {isLoading ? (
        <p className="mt-8 text-sm text-slate-500">Loading your projects...</p>
      ) : error ? null : projects.length > 0 ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card className="flex flex-col" key={project.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {project.category}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-ink">
                {project.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Current version: {project.current_version}
              </p>
              <Link
                className="mt-6 text-sm font-semibold text-brand-700 hover:text-brand-600"
                href={`/dashboard/${project.id}`}
              >
                View performance
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-7 text-center">
          <p className="font-medium text-slate-700">No projects yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload a project to start tracking its reviews.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            href="/submit"
          >
            Upload a project
          </Link>
        </Card>
      )}
    </main>
  );
}
