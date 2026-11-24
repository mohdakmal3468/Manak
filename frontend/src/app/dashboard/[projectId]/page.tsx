"use client";

import { useParams } from "next/navigation";
import ProjectDashboard from "@/components/project-dashboard";

export default function ProjectDashboardPage() {
  const params = useParams<{ projectId: string }>();
  return <ProjectDashboard projectId={params.projectId} />;
}
