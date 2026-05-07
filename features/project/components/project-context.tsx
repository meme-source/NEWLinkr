"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ProjectSheet } from "@/features/project/components/project-sheet";

export type ProjectDrawerMode = "create" | "edit";
// Bundle-introduced (linkr-discovery-bundle 2026-05-07): variant toggle for project sheet.
export type ProjectDrawerVariant = "quick" | "detailed";
export type ProjectCurrency = "USD" | "EUR" | "GBP" | "CNY";

export type WorkspaceProjectStatus = "draft" | "running" | "paused" | "completed";

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
  // §3.1.1 project status (auto-computed, user can override)
  status: WorkspaceProjectStatus;
  // §3.6.3 CPM project-level coefficient. null === 1.0 (no adjustment).
  cpmMultiplier: number | null;
  // §3.1 目标建联人数 — 选填的"想联系到多少位博主"目标。
  // 设了之后概览卡片用 `已建联 / 目标` 替代默认的 `已建联 / 总名单`。
  outreachTarget: number | null;
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
  status?: WorkspaceProjectStatus;
  cpmMultiplier?: number | null;
  outreachTarget?: number | null;
}

interface WorkspaceProjectContextValue {
  projects: WorkspaceProject[];
  currentProject: WorkspaceProject;
  currentProjectId: string;
  // §2.3.x "全部项目" toggle owned by the ProjectBar dropdown. Other surfaces
  // can react if needed; currentProject still falls back to a real project so
  // existing consumers don't have to special-case this.
  isAllProjects: boolean;
  selectProject: (projectId: string) => void;
  selectAllProjects: () => void;
  openCreateProject: (variant?: ProjectDrawerVariant) => void;
  openEditProject: (projectId?: string) => void;
  closeProjectDrawer: () => void;
  // Bundle-introduced (linkr-discovery-bundle 2026-05-07): consumed by
  // discovery's project switcher. Inline-rename a project; quick-create a new
  // project synchronously and return it so callers can immediately select it.
  renameProject: (projectId: string, name: string) => void;
  quickCreateProject: () => WorkspaceProject;
  resolveProjectName: (projectId: string) => string;
  getProject: (projectId: string) => WorkspaceProject | undefined;
  // §2.3.x partial-update for the schedule calendar's project-node markers.
  // Only the fields that the calendar surface can change are accepted; full
  // edits still flow through the project drawer.
  updateProjectDates: (projectId: string, dates: { startDate?: string; endDate?: string }) => void;
}

interface DrawerState {
  open: boolean;
  mode: ProjectDrawerMode;
  projectId?: string;
}

const PROJECTS_STORAGE_KEY = "2linkr:workspace-projects:v2";
const SELECTED_PROJECT_STORAGE_KEY = "2linkr:workspace-selected-project:v2";
const ALL_PROJECTS_MODE_STORAGE_KEY = "2linkr:workspace-all-projects-mode:v1";

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
    status: "running",
    cpmMultiplier: null,
    outreachTarget: 30,
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
    status: "running",
    cpmMultiplier: null,
    outreachTarget: null,
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
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.productName === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

// Hydrated localStorage entries from previous app versions may be missing
// optional fields like `status` / `cpmMultiplier` / `outreachTarget`. Backfill
// defaults so the rest of the surface can trust the type.
function withDefaults(project: WorkspaceProject): WorkspaceProject {
  return {
    ...project,
    status: (project.status ?? "running") as WorkspaceProjectStatus,
    cpmMultiplier: project.cpmMultiplier ?? null,
    outreachTarget: project.outreachTarget ?? null,
  };
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

// §2.3.2: ProjectBar shows end-date + days-remaining instead of start-end range.
export function formatProjectDeadline(project: WorkspaceProject) {
  if (!project.endDate) {
    return "未设置截止日期";
  }
  const end = new Date(project.endDate);
  if (Number.isNaN(end.getTime())) {
    return `截止 ${project.endDate}`;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  const days = Math.ceil(diffMs / 86_400_000);
  if (days > 0) {
    return `截止 ${project.endDate} · 剩 ${days} 天`;
  }
  if (days === 0) {
    return `截止 ${project.endDate} · 今日到期`;
  }
  return `截止 ${project.endDate} · 已逾期 ${Math.abs(days)} 天`;
}

// §3.1.1 项目状态 — 全局唯一调色板，ProjectBar / 下拉 / 抽屉头部 / 概览卡片都从这里取。
// 在四态语义里用 Linkr Orange 标记"进行中"，让品牌主色直接服务于 portfolio 焦点；
// 暖琥珀给"暂停中"做一个 caution 信号，仍在暖色温内。
//   draft     沙色      未启动 / 占位
//   running   品牌橙    进行中 —— 主焦点
//   paused    暖琥珀    暂停 / 提醒
//   completed 深棕      已完结 / 沉淀
// 用 border 而不是 ring，保持和 DESIGN.md 的"边线优先"基调一致。
interface ProjectStatusStyle {
  dot: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
}

const STATUS_STYLE: Record<WorkspaceProjectStatus, ProjectStatusStyle> = {
  draft: {
    dot: "bg-[#c5c0b1]",
    pillBg: "bg-[#eceae3]",
    pillText: "text-[#36342e]",
    pillBorder: "border-[#c5c0b1]",
  },
  running: {
    dot: "bg-[#ff4f00]",
    pillBg: "bg-[#fff7f4]",
    pillText: "text-[#ff4f00]",
    pillBorder: "border-[#ffd9c8]",
  },
  paused: {
    dot: "bg-[#c89e4f]",
    pillBg: "bg-[#fbf3df]",
    pillText: "text-[#8a6f1f]",
    pillBorder: "border-[#ecd4ac]",
  },
  completed: {
    dot: "bg-[#36342e]",
    pillBg: "bg-[#eceae3]",
    pillText: "text-[#201515]",
    pillBorder: "border-[#c5c0b1]",
  },
};

const STATUS_LABEL: Record<WorkspaceProjectStatus, string> = {
  draft: "草稿",
  running: "进行中",
  paused: "暂停中",
  completed: "已结束",
};

// Bundle-introduced (linkr-discovery-bundle 2026-05-07): badge tuple shape +
// status badge resolver used by bundle's project-bar pill UI. Maps to existing
// status tokens declared in app/globals.css (status-running/draft/paused/completed).
export type ProjectStatusBadge = {
  dot: string;
  background: string;
  label: string;
};

const STATUS_BADGE: Record<WorkspaceProjectStatus, ProjectStatusBadge> = {
  draft: { dot: "bg-status-draft", background: "bg-status-draft-soft", label: "草稿" },
  running: { dot: "bg-status-running", background: "bg-status-running-soft", label: "进行中" },
  paused: { dot: "bg-status-paused", background: "bg-status-paused-soft", label: "暂停中" },
  completed: {
    dot: "bg-status-completed",
    background: "bg-status-completed-soft",
    label: "已结束",
  },
};

export function getProjectStatusBadge(status: WorkspaceProjectStatus): ProjectStatusBadge {
  return STATUS_BADGE[status];
}

// Returns days remaining + raw endDate for callers that want to format
// the meta row themselves with emphasis on the numbers.
export function getProjectDeadlineParts(project: WorkspaceProject): {
  endDate: string | null;
  daysRemaining: number | null;
} {
  if (!project.endDate) {
    return { endDate: null, daysRemaining: null };
  }
  const end = new Date(project.endDate);
  if (Number.isNaN(end.getTime())) {
    return { endDate: project.endDate, daysRemaining: null };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  return { endDate: project.endDate, daysRemaining: Math.ceil(diffMs / 86_400_000) };
}

export function getProjectStatusDotClass(status: WorkspaceProjectStatus) {
  return STATUS_STYLE[status].dot;
}

// 返回完整 pill 类（bg + text + border）。size / padding 由调用方按场景加，
// 因为头部、下拉触发器、卡片小标签三处尺寸不同。调用方需自己写 `border` 关键字
// 以触发边线渲染（这里只给颜色 token，避免重复 specificity）。
export function getProjectStatusPillClass(status: WorkspaceProjectStatus): string {
  const s = STATUS_STYLE[status];
  return `${s.pillBg} ${s.pillText} ${s.pillBorder}`;
}

export function getProjectStatusLabel(status: WorkspaceProjectStatus) {
  return STATUS_LABEL[status];
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    DEFAULT_WORKSPACE_PROJECTS[0].id,
  );
  const [isAllProjects, setIsAllProjects] = useState(false);
  const [drawerState, setDrawerState] = useState<DrawerState>({
    open: false,
    mode: "create",
  });
  // Bundle-introduced (linkr-discovery-bundle 2026-05-07): variant lives outside
  // DrawerState so the drawer's Quick / Detailed toggle can change without
  // forcing a full open/close cycle.
  const [drawerVariant, setDrawerVariant] = useState<ProjectDrawerVariant>("quick");

  // SSR-safe hydration from localStorage. This is one of the few legitimate
  // places to call setState in an effect: localStorage is only available after
  // mount, and reading it inside a useState initializer would cause a Next.js
  // hydration mismatch (server has DEFAULT, client would have stored value).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const storedProjectsRaw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
      const storedSelectedProjectId = window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);

      if (storedProjectsRaw) {
        const parsed = JSON.parse(storedProjectsRaw) as unknown;
        if (Array.isArray(parsed)) {
          const nextProjects = parsed.filter(isWorkspaceProject).map(withDefaults);
          if (nextProjects.length > 0) {
            setProjects(nextProjects);
          }
        }
      }

      if (storedSelectedProjectId) {
        setSelectedProjectId(storedSelectedProjectId);
      }

      const storedAllProjects = window.localStorage.getItem(ALL_PROJECTS_MODE_STORAGE_KEY);
      if (storedAllProjects === "true") {
        setIsAllProjects(true);
      }
    } catch (error) {
      console.warn("Failed to hydrate workspace projects from localStorage.", error);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const stableProjects = projects.length > 0 ? projects : DEFAULT_WORKSPACE_PROJECTS;
  // currentProject derivation already falls back to stableProjects[0] when the
  // selected id is missing, so we don't need a separate "correct stale state"
  // effect — the localStorage-write effect below persists currentProject.id,
  // which keeps storage consistent on the next hydrate.
  const currentProject =
    stableProjects.find((project) => project.id === selectedProjectId) ?? stableProjects[0];

  useEffect(() => {
    try {
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      if (currentProject) {
        window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, currentProject.id);
      }
      window.localStorage.setItem(ALL_PROJECTS_MODE_STORAGE_KEY, String(isAllProjects));
    } catch (error) {
      console.warn("Failed to persist workspace projects to localStorage.", error);
    }
  }, [currentProject, projects, isAllProjects]);

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setIsAllProjects(false);
  }, []);

  const selectAllProjects = useCallback(() => {
    setIsAllProjects(true);
  }, []);

  const closeProjectDrawer = useCallback(() => {
    setDrawerState((current) => ({
      ...current,
      open: false,
      projectId: undefined,
    }));
  }, []);

  const openCreateProject = useCallback((variant: ProjectDrawerVariant = "quick") => {
    setDrawerVariant(variant);
    setDrawerState({
      open: true,
      mode: "create",
    });
  }, []);

  const renameProject = useCallback((projectId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, name: trimmed, updatedAt: new Date().toISOString() }
          : project,
      ),
    );
  }, []);

  const quickCreateProject = useCallback((): WorkspaceProject => {
    const now = new Date().toISOString();
    const next: WorkspaceProject = {
      id: `project-${Date.now()}`,
      name: "未命名项目",
      productName: "",
      category: "",
      brand: "",
      productLink: "",
      startDate: "",
      endDate: "",
      budgetAmount: "",
      budgetCurrency: "USD",
      status: "draft",
      cpmMultiplier: null,
      outreachTarget: null,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((current) => [...current, next]);
    setSelectedProjectId(next.id);
    setIsAllProjects(false);
    return next;
  }, []);

  const openEditProject = useCallback(
    (projectId?: string) => {
      setDrawerState({
        open: true,
        mode: "edit",
        projectId: projectId ?? currentProject.id,
      });
    },
    [currentProject.id],
  );

  const handleSaveProject = useCallback(
    (draft: WorkspaceProjectDraft) => {
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
              : project,
          ),
        );
        closeProjectDrawer();
        return;
      }

      const nextProject: WorkspaceProject = {
        id: `project-${Date.now()}`,
        ...normalizedDraft,
        status: normalizedDraft.status ?? "draft",
        cpmMultiplier: normalizedDraft.cpmMultiplier ?? null,
        outreachTarget: normalizedDraft.outreachTarget ?? null,
        createdAt: now,
        updatedAt: now,
      };

      setProjects((current) => [nextProject, ...current]);
      setSelectedProjectId(nextProject.id);
      closeProjectDrawer();
    },
    [drawerState.mode, drawerState.projectId, closeProjectDrawer],
  );

  const updateProjectDates = useCallback(
    (projectId: string, dates: { startDate?: string; endDate?: string }) => {
      if (dates.startDate === undefined && dates.endDate === undefined) return;
      const now = new Date().toISOString();
      setProjects((current) =>
        current.map((project) =>
          project.id === projectId
            ? {
                ...project,
                ...(dates.startDate !== undefined ? { startDate: dates.startDate } : {}),
                ...(dates.endDate !== undefined ? { endDate: dates.endDate } : {}),
                updatedAt: now,
              }
            : project,
        ),
      );
    },
    [],
  );

  const resolveProjectName = useCallback(
    (projectId: string) =>
      stableProjects.find((project) => project.id === projectId)?.name ?? "未分配",
    [stableProjects],
  );

  const getProject = useCallback(
    (projectId: string) => stableProjects.find((project) => project.id === projectId),
    [stableProjects],
  );

  const value = useMemo<WorkspaceProjectContextValue>(
    () => ({
      projects: stableProjects,
      currentProject,
      currentProjectId: currentProject.id,
      isAllProjects,
      selectProject,
      selectAllProjects,
      openCreateProject,
      openEditProject,
      closeProjectDrawer,
      renameProject,
      quickCreateProject,
      resolveProjectName,
      getProject,
      updateProjectDates,
    }),
    [
      currentProject,
      stableProjects,
      isAllProjects,
      selectProject,
      selectAllProjects,
      openCreateProject,
      openEditProject,
      closeProjectDrawer,
      renameProject,
      quickCreateProject,
      resolveProjectName,
      getProject,
      updateProjectDates,
    ],
  );

  const editingProject = drawerState.projectId
    ? stableProjects.find((project) => project.id === drawerState.projectId)
    : undefined;

  return (
    <WorkspaceProjectContext.Provider value={value}>
      {children}
      {/* The `key` here intentionally re-mounts ProjectSheet each time the
          drawer transitions from closed→open or the editing target changes,
          so its internal draft state resets cleanly without a useEffect. */}
      <ProjectSheet
        key={drawerState.open ? (drawerState.projectId ?? "new") : "_closed"}
        open={drawerState.open}
        mode={drawerState.mode}
        variant={drawerVariant}
        onVariantChange={setDrawerVariant}
        project={editingProject}
        existingProjects={stableProjects}
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
