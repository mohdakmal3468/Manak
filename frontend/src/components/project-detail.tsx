"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import ScoreBadge from "@/components/ui/score-badge";
import {
  apiRequest,
  getAccessToken,
  getStoredUserId,
} from "@/lib/api";
import type { Project, ProjectReview, VersionScore } from "@/lib/types";

const CRITERIA = [
  { key: "innovation_average", label: "Innovation" },
  { key: "functionality_average", label: "Functionality" },
  { key: "ui_ux_average", label: "UI / UX" },
  { key: "technical_quality_average", label: "Technical quality" },
  { key: "documentation_average", label: "Documentation" },
] as const;

const REVIEW_CRITERIA = [
  { name: "innovation", label: "Innovation" },
  { name: "functionality", label: "Functionality" },
  { name: "ui_ux", label: "UI / UX" },
  { name: "technical_quality", label: "Technical quality" },
  { name: "documentation", label: "Documentation" },
] as const;

function LinkStatus({ verified }: { verified: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        verified ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {verified ? "Verified" : "Not verified"}
    </span>
  );
}

export default function ProjectDetail() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const [scores, setScores] = useState<VersionScore[]>([]);
  const [reviews, setReviews] = useState<ProjectReview[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProject = useCallback(async () => {
    setError(null);
    setCurrentUserId(getStoredUserId());
    try {
      const [loadedProject, loadedScores, loadedReviews] = await Promise.all([
        apiRequest<Project>(`/projects/${projectId}`),
        apiRequest<VersionScore[]>(`/projects/${projectId}/scores`),
        apiRequest<ProjectReview[]>(`/projects/${projectId}/reviews`),
      ]);
      setProject(loadedProject);
      setScores(loadedScores);
      setReviews(loadedReviews);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load this project.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!getAccessToken()) {
      setError("Log in before submitting a review.");
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentScore = scores.find(
      (score) => score.version_number === project?.current_version,
    );
    if (!currentScore) {
      setError("There is no reviewable version for this project yet.");
      return;
    }

    const rating = {
      innovation: Number(formData.get("innovation")),
      functionality: Number(formData.get("functionality")),
      ui_ux: Number(formData.get("ui_ux")),
      technical_quality: Number(formData.get("technical_quality")),
      documentation: Number(formData.get("documentation")),
    };
    setIsSubmitting(true);
    try {
      await apiRequest<ProjectReview>(
        `/projects/${projectId}/versions/${currentScore.version_id}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            ...rating,
            comment: formData.get("comment"),
          }),
        },
      );
      setSuccess("Your review has been submitted.");
      form.reset();
      await loadProject();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit your review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentScore =
    scores.find((score) => score.version_number === project?.current_version) ??
    scores.at(-1) ??
    null;
  const isOwner = project !== null && currentUserId === project.owner_id;
  const versionNumbers = new Map(
    scores.map((score) => [score.version_id, score.version_number]),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading project...</p>
      ) : error && !project ? (
        <p aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : project ? (
        <>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-brand-700">
                {project.category}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {project.title}
              </h1>
              <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-600">
                {project.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tech_tags.map((tag) => (
                  <span
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <ScoreBadge score={currentScore?.overall_score ?? null} />
              {isOwner && (
                <Link
                  className="text-sm font-semibold text-brand-700 hover:text-brand-600"
                  href={`/dashboard/${project.id}`}
                >
                  Open performance dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-200 hover:text-brand-700"
              href={project.github_url}
              rel="noreferrer"
              target="_blank"
            >
              GitHub repository
              <LinkStatus verified={project.github_verified} />
            </a>
            {project.live_url && (
              <a
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-200 hover:text-brand-700"
                href={project.live_url}
                rel="noreferrer"
                target="_blank"
              >
                Live demo
                <LinkStatus verified={project.live_verified} />
              </a>
            )}
          </div>

          <section className="mt-9">
            <h2 className="text-xl font-semibold text-ink">
              Current version scores
            </h2>
            {currentScore ? (
              <Card className="mt-4">
                <p className="mb-6 text-sm text-slate-500">
                  Version {currentScore.version_number} · {currentScore.review_count}{" "}
                  {currentScore.review_count === 1 ? "review" : "reviews"}
                </p>
                <div className="space-y-5">
                  {CRITERIA.map((criterion) => {
                    const score = currentScore[criterion.key];
                    return (
                      <div key={criterion.key}>
                        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                          <span className="font-medium text-slate-700">
                            {criterion.label}
                          </span>
                          <span className="font-semibold tabular-nums text-ink">
                            {score === null ? "—" : `${score.toFixed(2)} / 5`}
                          </span>
                        </div>
                        <div
                          aria-label={`${criterion.label} score`}
                          className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                          role="img"
                        >
                          <div
                            className="h-full rounded-full bg-brand-600 transition-all"
                            style={{
                              width: score === null ? "0%" : `${(score / 5) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <Card className="mt-4 text-sm text-slate-500">
                No version score is available yet.
              </Card>
            )}
          </section>

          <section className="mt-9">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-ink">Peer reviews</h2>
              <span className="text-sm text-slate-500">{reviews.length} total</span>
            </div>
            {reviews.length ? (
              <div className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <Card className="p-5" key={review.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-700">
                        Reviewer #{review.reviewer_id}
                      </p>
                      <p className="text-xs text-slate-500">
                        Version {versionNumbers.get(review.version_id) ?? "—"} ·{" "}
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {review.comment}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="mt-4 text-sm text-slate-500">
                No reviews yet. Be the first to share constructive feedback.
              </Card>
            )}
          </section>

          {!isOwner && (
            <section className="mt-9">
              <Card>
                <h2 className="text-xl font-semibold text-ink">
                  Rate this project
                </h2>
                {currentUserId === null && (
                  <p className="mt-2 text-sm text-slate-600">
                    <Link
                      className="font-semibold text-brand-700 hover:text-brand-600"
                      href="/login"
                    >
                      Log in
                    </Link>{" "}
                    to submit a review.
                  </p>
                )}
                {error && (
                  <p aria-live="polite" className="mt-4 text-sm text-red-600">
                    {error}
                  </p>
                )}
                {success && (
                  <p aria-live="polite" className="mt-4 text-sm text-brand-700">
                    {success}
                  </p>
                )}
                {currentUserId !== null && (
                  <form className="mt-5 space-y-5" onSubmit={handleReview}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {REVIEW_CRITERIA.map((criterion) => (
                        <label
                          className="block text-sm font-medium text-slate-700"
                          key={criterion.name}
                        >
                          {criterion.label}
                          <select
                            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                            defaultValue=""
                            name={criterion.name}
                            required
                          >
                            <option disabled value="">
                              Choose a score
                            </option>
                            {[1, 2, 3, 4, 5].map((score) => (
                              <option key={score} value={score}>
                                {score}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <label className="block text-sm font-medium text-slate-700">
                      Comment
                      <textarea
                        className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                        name="comment"
                        required
                        rows={4}
                      />
                    </label>
                    <Button disabled={isSubmitting || !currentScore} type="submit">
                      {isSubmitting ? "Submitting review..." : "Submit review"}
                    </Button>
                  </form>
                )}
              </Card>
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}
