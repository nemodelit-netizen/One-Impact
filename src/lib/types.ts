// One Impact — shared domain types

export const PROJECT_STAGES = [
  "identified",
  "proposed",
  "under_review",
  "community_vote",
  "funded",
  "in_progress",
  "completed",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const STAGE_LABELS: Record<ProjectStage, string> = {
  identified: "Identified",
  proposed: "Proposed",
  under_review: "Professional Review",
  community_vote: "Community Vote",
  funded: "Funded",
  in_progress: "In Progress",
  completed: "Completed",
};

export type Project = {
  id: string;
  title: string;
  region: string;
  category: string;
  summary: string;
  description: string;
  stage: ProjectStage;
  fundingGoal: number;
  fundingRaised: number;
  votesFor: number;
  votesAgainst: number;
  createdAt: string;
};

export type Member = {
  id: string;
  email: string;
  name: string;
  monthlyAmount: number;
  joinedAt: string;
};

export type Pledge = {
  id: string;
  memberId: string;
  projectId: string;
  amount: number;
  createdAt: string;
};

export type Store = {
  projects: Project[];
  members: Member[];
  pledges: Pledge[];
};
