export interface Project {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  github_url: string;
  live_url: string | null;
  category: string;
  tech_tags: string[];
  current_version: number;
  created_at: string;
  github_verified: boolean;
  live_verified: boolean;
}

export interface VersionScore {
  version_id: number;
  version_number: number;
  innovation_average: number | null;
  functionality_average: number | null;
  ui_ux_average: number | null;
  technical_quality_average: number | null;
  documentation_average: number | null;
  overall_score: number | null;
  review_count: number;
}

export interface ProjectReview {
  id: number;
  project_id: number;
  version_id: number;
  reviewer_id: number;
  innovation: number;
  functionality: number;
  ui_ux: number;
  technical_quality: number;
  documentation: number;
  comment: string;
  created_at: string;
}

export interface CriterionScoreChanges {
  innovation: number | null;
  functionality: number | null;
  ui_ux: number | null;
  technical_quality: number | null;
  documentation: number | null;
}

export interface ProjectVersionAnalytics {
  version_number: number;
  date: string;
  change_note: string;
  overall_score: number | null;
  innovation_average: number | null;
  functionality_average: number | null;
  ui_ux_average: number | null;
  technical_quality_average: number | null;
  documentation_average: number | null;
  score_changes: CriterionScoreChanges;
}
