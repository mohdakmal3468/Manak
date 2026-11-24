"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProjectCard from "@/components/project-card";
import { apiRequest } from "@/lib/api";
import type { Project, VersionScore } from "@/lib/types";

interface ProjectWithScore {
  project: Project;
  score: VersionScore | null;
}

export default function ExploreProjects() {
  const [projects, setProjects] = useState<ProjectWithScore[]>([]);
  const [category, setCategory] = useState("");
  const [techTag, setTechTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const listedProjects = await apiRequest<Project[]>("/projects");
      const withScores = await Promise.all(
        listedProjects.map(async (project) => {
          const scores = await apiRequest<VersionScore[]>(
            `/projects/${project.id}/scores`,
          );
          const currentScore =
            scores.find(
              (score) => score.version_number === project.current_version,
            ) ??
            scores.at(-1) ??
            null;
          return { project, score: currentScore };
        }),
      );
      setProjects(withScores);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const categories = useMemo(
    () => [...new Set(projects.map(({ project }) => project.category))].sort(),
    [projects],
  );
  const techTags = useMemo(
    () =>
      [
        ...new Set(
          projects.flatMap(({ project }) => project.tech_tags),
        ),
      ].sort(),
    [projects],
  );
  const filteredProjects = projects.filter(({ project }) => {
    return (
      (!category || project.category === category) &&
      (!techTag || project.tech_tags.includes(techTag))
    );
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">Community projects</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            Explore projects
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Browse work shared by developers and see how the community has
            evaluated each latest version.
          </p>
        </div>
        <button
          className="self-start rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50 sm:self-auto"
          disabled={isLoading}
          onClick={() => void loadProjects()}
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
        <label className="text-sm font-medium text-slate-700">
          Category
          <select
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Technology
          <select
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            onChange={(event) => setTechTag(event.target.value)}
            value={techTag}
          >
            <option value="">All technologies</option>
            {techTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p
          aria-live="polite"
          className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {isLoading ? (
        <p className="mt-10 text-sm text-slate-500">Loading projects...</p>
      ) : error ? null : filteredProjects.length > 0 ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map(({ project, score }) => (
            <ProjectCard key={project.id} project={project} score={score} />
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-700">No projects found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try changing the selected filters.
          </p>
        </div>
      )}
    </main>
  );
}
