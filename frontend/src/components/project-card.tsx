import Link from "next/link";
import Card from "@/components/ui/card";
import ScoreBadge from "@/components/ui/score-badge";
import type { Project, VersionScore } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  score: VersionScore | null;
}

export default function ProjectCard({ project, score }: ProjectCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {project.category}
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-6 text-ink">
            {project.title}
          </h2>
        </div>
        <ScoreBadge score={score?.overall_score ?? null} />
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
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
      <div className="mt-auto flex items-center justify-between gap-4 pt-6">
        <p className="text-sm text-slate-500">
          {score?.review_count ?? 0} reviews
        </p>
        <Link
          className="text-sm font-semibold text-brand-700 hover:text-brand-600"
          href={`/projects/${project.id}`}
        >
          View project
        </Link>
      </div>
    </Card>
  );
}
