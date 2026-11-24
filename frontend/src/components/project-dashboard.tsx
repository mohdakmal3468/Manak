"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { apiRequest, getAccessToken, getStoredUserId } from "@/lib/api";
import type { Project, ProjectVersionAnalytics } from "@/lib/types";

const CRITERIA = [
  { key: "innovation_average", changeKey: "innovation", label: "Innovation" },
  { key: "functionality_average", changeKey: "functionality", label: "Functionality" },
  { key: "ui_ux_average", changeKey: "ui_ux", label: "UI / UX" },
  {
    key: "technical_quality_average",
    changeKey: "technical_quality",
    label: "Technical quality",
  },
  {
    key: "documentation_average",
    changeKey: "documentation",
    label: "Documentation",
  },
] as const;

function formatChange(value: number | null): {
  label: string;
  className: string;
} {
  if (value === null) {
    return { label: "No comparison", className: "text-slate-500" };
  }
  if (value > 0) {
    return { label: `Up ${value.toFixed(2)}`, className: "text-emerald-700" };
  }
  if (value < 0) {
    return { label: `Down ${Math.abs(value).toFixed(2)}`, className: "text-rose-700" };
  }
  return { label: "No change", className: "text-slate-500" };
}

export default function ProjectDashboard({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<ProjectVersionAnalytics[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError(null);
    if (!getAccessToken()) {
      setError("Log in to view your project dashboard.");
      setIsLoading(false);
      return;
    }
    try {
      const [loadedProject, loadedVersions] = await Promise.all([
        apiRequest<Project>(`/projects/${projectId}`),
        apiRequest<ProjectVersionAnalytics[]>(
          `/projects/${projectId}/analytics`,
        ),
      ]);
      if (loadedProject.owner_id !== getStoredUserId()) {
        setError("Only the project owner can view this dashboard.");
        setProject(null);
        setVersions([]);
        return;
      }
      setProject(loadedProject);
      setVersions(loadedVersions);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load project analytics.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleNewVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!getAccessToken()) {
      setError("Log in before uploading a new version.");
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);
    try {
      const version = await apiRequest<{ version_number: number }>(
        `/projects/${projectId}/versions`,
        {
          method: "POST",
          body: JSON.stringify({ change_note: formData.get("change_note") }),
        },
      );
      setSuccess(`Version ${version.version_number} uploaded.`);
      form.reset();
      await loadDashboard();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload the new version.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentVersion = versions.at(-1) ?? null;
  const previousVersion = versions.at(-2) ?? null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-medium text-brand-700 hover:text-brand-600"
        href="/dashboard"
      >
        Back to your projects
      </Link>
      {isLoading ? (
        <p className="mt-8 text-sm text-slate-500">Loading dashboard...</p>
      ) : error && !project ? (
        <p aria-live="polite" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{" "}
          {!getAccessToken() && (
            <Link className="font-semibold underline" href="/login">
              Log in
            </Link>
          )}
        </p>
      ) : project ? (
        <>
          <div className="mt-5">
            <p className="text-sm font-semibold text-brand-700">Owner view</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
              {project.title} performance
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Follow rating changes across project versions.
            </p>
          </div>

          {error && (
            <p aria-live="polite" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p aria-live="polite" className="mt-5 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
              {success}
            </p>
          )}

          <Card className="mt-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">Overall score by version</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Average project score, on a 1–5 scale.
                </p>
              </div>
              {currentVersion?.overall_score !== null &&
                currentVersion?.overall_score !== undefined && (
                  <p className="text-sm font-semibold text-brand-700">
                    Current: {currentVersion.overall_score.toFixed(2)} / 5
                  </p>
                )}
            </div>
            {versions.length > 0 ? (
              <div className="mt-6 h-64 w-full sm:h-80">
                <ResponsiveContainer height="100%" width="100%">
                  <LineChart data={versions} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                    <XAxis
                      axisLine={false}
                      dataKey="version_number"
                      tickFormatter={(value: number) => `v${value}`}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      domain={[1, 5]}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip />
                    <Line
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                      dataKey="overall_score"
                      dot={{ fill: "#4f46e5", r: 4 }}
                      name="Overall score"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-7 text-sm text-slate-500">No version history yet.</p>
            )}
          </Card>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink">
              Current vs previous version
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CRITERIA.map((criterion) => {
                const currentValue = currentVersion?.[criterion.key] ?? null;
                const previousValue = previousVersion?.[criterion.key] ?? null;
                const delta = currentVersion?.score_changes[criterion.changeKey] ?? null;
                const change = formatChange(delta);
                return (
                  <Card className="p-5" key={criterion.key}>
                    <h3 className="text-sm font-medium text-slate-600">
                      {criterion.label}
                    </h3>
                    <p className="mt-3 text-2xl font-semibold tabular-nums text-ink">
                      {currentValue === null ? "—" : currentValue.toFixed(2)}
                      <span className="ml-1 text-sm font-normal text-slate-400">/ 5</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Previous:{" "}
                      {previousValue === null ? "—" : previousValue.toFixed(2)}
                    </p>
                    <p className={`mt-3 text-sm font-semibold ${change.className}`}>
                      {change.label}
                    </p>
                  </Card>
                );
              })}
            </div>
          </section>

          <Card className="mt-8">
            <h2 className="text-lg font-semibold text-ink">Upload new version</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a brief note describing what changed.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleNewVersion}>
              <label className="block text-sm font-medium text-slate-700">
                Change note
                <textarea
                  className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                  name="change_note"
                  required
                  rows={3}
                />
              </label>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Uploading..." : "Upload new version"}
              </Button>
            </form>
          </Card>
        </>
      ) : null}
    </main>
  );
}
