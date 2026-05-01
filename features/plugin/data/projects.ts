import type { ProjectScopedState, ProjectSummary, TagTone } from "../types";

export const PROJECTS_STORAGE_KEY = "2linkr:sidebar-projects";
export const PROJECT_SCOPED_STATE_KEY = "2linkr:sidebar-project-state";
export const SELECTED_PROJECT_STORAGE_KEY = "2linkr:sidebar-selected-project";

export const defaultProjects: ProjectSummary[] = [
  {
    id: "spring-camping-launch",
    name: "春季露营新品投放",
    productDescription: "便携露营灯与折叠桌新品组合推广",
    createdAt: "2026-04-20T11:40:00+08:00",
    createdLabel: "最新创建",
  },
  {
    id: "evergreen-camping-seeding",
    name: "Evergreen 露营达人种草",
    productDescription: "Evergreen 系列露营装备达人种草合作",
    createdAt: "2026-04-15T18:20:00+08:00",
    createdLabel: "4 月 15 日创建",
  },
  {
    id: "summer-gear-budget",
    name: "夏季装备平替补量",
    productDescription: "夏季露营装备平替款达人扩量计划",
    createdAt: "2026-04-09T14:10:00+08:00",
    createdLabel: "4 月 9 日创建",
  },
];

export const defaultProjectScopedState: Record<string, ProjectScopedState> = {
  "spring-camping-launch": {
    savedCreatorIds: [],
    dismissedCreatorIds: [],
    creatorTags: {
      "camping-aurora": ["Project 1", "Warm Lead"],
    },
  },
};

export const noteTagPresets: Array<{ label: string; tone: TagTone }> = [
  { label: "Project 1", tone: "amber" },
  { label: "Project 2", tone: "blue" },
  { label: "Campaign", tone: "violet" },
];

export const tagToneOrder: TagTone[] = ["amber", "blue", "emerald", "violet", "rose"];
