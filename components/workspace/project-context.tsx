"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ProjectSheet } from "@/components/workspace/project-sheet";

export type ProjectDrawerMode = "create" | "edit";
export type ProjectDrawerVariant = "quick" | "detailed";
export type ProjectCurrency = "USD" | "EUR" | "GBP" | "CNY";

export interface WorkspaceProject {
  id: string;
  name: string;
  productName: string;
  category: string;
  brand: string;
  productLink: string;
  startDate: string;
  endDate: string;
  budgetAmount: string;
  budgetCurrency: ProjectCurrency;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceProjectDraft {
  name: string;
  productName: string;
  category: string;
  brand: string;
  productLink: string;
  startDate: string;
  endDate: string;
  budgetAmount: string;
  budgetCurrency: ProjectCurrency;
}

interface WorkspaceProjectContextValue {
  projects: WorkspaceProject[];
  currentProject: WorkspaceProject;
  currentProjectId: string;
  selectProject: (projectId: string) => void;
  openCreateProject: (variant?: ProjectDrawerVariant) => void;
  openEditProject: (projectId?: string) => void;
  closeProjectDrawer: () => void;
  resolveProjectName: (projectId: string) => string;
  getProject: (projectId: string) => WorkspaceProject | undefined;
}

interface DrawerState {
  open: boolean;
  mode: ProjectDrawerMode;
  variant: ProjectDrawerVariant;
  projectId?: string;
}

const PROJECTS_STORAGE_KEY = "2linkr:workspace-projects:v2";
const SELECTED_PROJECT_STORAGE_KEY = "2linkr:workspace-selected-project:v2";

export const WORKSPACE_UNASSIGNED_PROJECT_ID = "unassigned";

export const DEFAULT_WORKSPACE_PROJECTS: WorkspaceProject[] = [
  {
    id: "q2-summer",
    name: "Q2夏季 Campaign",
    productName: "防蓝光护眼面霜",
    category: "美妆护肤",
    brand: "MyBrand",
    productLink: "https://www.mybrand.com/product",
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    budgetAmount: "5000",
    budgetCurrency: "USD",
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-16T08:00:00.000Z",
  },
  {
    id: "beauty-pool",
    name: "美妆博主池",
    productName: "持久遮瑕粉底液",
    category: "彩妆",
    brand: "GlowLab",
    productLink: "https://www.glowlab.com/product",
    startDate: "2026-04-08",
    endDate: "2026-05-31",
    budgetAmount: "2100",
    budgetCurrency: "USD",
    createdAt: "2026-04-08T08:00:00.000Z",
    updatedAt: "2026-04-15T08:00:00.000Z",
  },
];

const WorkspaceProjectContext = createContext<WorkspaceProjectContextValue | null>(null);

function isWorkspaceProject(value: unknown): value is WorkspaceProject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorkspaceProject>;
  return typeof candidate.id === "string"
    && typeof candidate.name === "string"
    && typeof candidate.productName === "string"
    && typeof candidate.category === "string"
    && typeof candidate.createdAt === "string"
    && typeof candidate.updatedAt === "string";
}

function normalizeDraft(draft: WorkspaceProjectDraft): WorkspaceProjectDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    productName: draft.productName.trim(),
    category: draft.category.trim(),
    brand: draft.brand.trim(),
    productLink: draft.productLink.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    budgetAmount: draft.budgetAmount.trim(),
  };
}

export function formatProjectTimeline(project: WorkspaceProject) {
  if (project.startDate && project.endDate) {
    return `${project.startDate} 至 ${project.endDate}`;
  }
  if (project.startDate) {
    return `${project.startDate} 开始`;
  }
  if (project.endDate) {
    return `截止 ${project.endDate}`;
  }
  return "未设置时间范围";
}

export function formatProjectBudget(project: WorkspaceProject) {
  if (!project.budgetAmount.trim()) {
    return "未设置预算";
  }
  const currencyMap: Record<ProjectCurrency, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CNY: "¥",
  };
  return `${currencyMap[project.budgetCurrency]}${project.budgetAmount}`;
}

export function WorkspaceProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<WorkspaceProject[]>(DEFAULT_WORKSPACE_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(DEFAULT_WORKSPACE_PROJECTS[0].id);
  const [drawerState, setDrawerState] = useState<DrawerState>({
    open: false,
    mode: "create",
    variant: "quick",
  });

  useEffect(() => {
    try {
      const storedProjectsRaw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
      const storedSelectedProjectId = window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);

      if (storedProjectsRaw) {
        const parsed = JSON.parse(storedProjectsRaw) as unknown;
        if (Array.isArray(parsed)) {
          const nextProjects = parsed.filter(isWorkspaceProject);
          if (nextProjects.length > 0) {
            setProjects(nextProjects);
          }
        }
      }

      if (storedSelectedProjectId) {
        setSelectedProjectId(storedSelectedProjectId);
      }
    } catch (error) {
      console.warn("Failed to hydrate workspace projects from localStorage.", error);
    }
  }, []);

  const stableProjects = projects.length > 0 ? projects : DEFAULT_WORKSPACE_PROJECTS;
  const currentProject = stableProjects.find((project) => project.id === selectedProjectId) ?? stableProjects[0];

  useEffect(() => {
    if (!projects.some((project) => project.id === selectedProjectId) && projects[0]) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      if (currentProject) {
        window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, currentProject.id);
      }
    } catch (error) {
      console.warn("Failed to persist workspace projects to localStorage.", error);
    }
  }, [currentProject, projects]);

  const closeProjectDrawer = () => {
    setDrawerState((current) => ({
      ...current,
      open: false,
      projectId: undefined,
    }));
  };

  const openCreateProject = (variant: ProjectDrawerVariant = "quick") => {
    setDrawerState({
      open: true,
      mode: "create",
      variant,
    });
  };

  const openEditProject = (projectId = currentProject.id) => {
    setDrawerState({
      open: true,
      mode: "edit",
      variant: "detailed",
      projectId,
    });
  };

  const handleSaveProject = (draft: WorkspaceProjectDraft) => {
    const normalizedDraft = normalizeDraft(draft);
    const now = new Date().toISOString();

    if (drawerState.mode === "edit" && drawerState.projectId) {
      setProjects((current) =>
        current.map((project) =>
          project.id === drawerState.projectId
            ? {
                ...project,
                ...normalizedDraft,
                updatedAt: now,
              }
            : project
        )
      );
      closeProjectDrawer();
      return;
    }

    const nextProject: WorkspaceProject = {
      id: `project-${Date.now()}`,
      ...normalizedDraft,
      createdAt: now,
      updatedAt: now,
    };

    setProjects((current) => [nextProject, ...current]);
    setSelectedProjectId(nextProject.id);
    closeProjectDrawer();
  };

  const resolveProjectName = (projectId: string) =>
    stableProjects.find((project) => project.id === projectId)?.name ?? "未分配";

  const getProject = (projectId: string) =>
    stableProjects.find((project) => project.id === projectId);

  const value = useMemo<WorkspaceProjectContextValue>(
    () => ({
      projects: stableProjects,
      currentProject,
      currentProjectId: currentProject.id,
      selectProject: setSelectedProjectId,
      openCreateProject,
      openEditProject,
      closeProjectDrawer,
      resolveProjectName,
      getProject,
    }),
    [currentProject, stableProjects]
  );

  const editingProject = drawerState.projectId
    ? stableProjects.find((project) => project.id === drawerState.projectId)
    : undefined;

  return (
    <WorkspaceProjectContext.Provider value={value}>
      {children}
      <ProjectSheet
        open={drawerState.open}
        mode={drawerState.mode}
        variant={drawerState.variant}
        project={editingProject}
        existingProjects={stableProjects}
        onVariantChange={(variant) => setDrawerState((current) => ({ ...current, variant }))}
        onClose={closeProjectDrawer}
        onSave={handleSaveProject}
      />
    </WorkspaceProjectContext.Provider>
  );
}

export function useWorkspaceProject() {
  const context = useContext(WorkspaceProjectContext);
  if (!context) {
    throw new Error("useWorkspaceProject must be used within WorkspaceProjectProvider.");
  }
  return context;
}
