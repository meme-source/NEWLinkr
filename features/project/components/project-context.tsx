"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ProjectSheet } from "@/features/project/components/project-sheet";
import {
  createProject,
  withProjectDefaults,
  type Project,
  type ProjectCollaborationType,
  type ProjectCurrency,
  type ProjectProduct,
  type ProjectStatus,
} from "@/features/project/lib/project-model";

export type ProjectDrawerMode = "create" | "edit";

// 项目实体已收敛到统一模型 features/project/lib/project-model.ts。
// 这里只保留网页端历史沿用的别名，避免一次性改动所有 import 点。
export type { ProjectCollaborationType, ProjectCurrency, ProjectProduct };
export type WorkspaceProject = Project;
export type WorkspaceProjectStatus = ProjectStatus;

export interface WorkspaceProjectDraft {
  name: string;
  // 一个项目绑定一个产品（1:1）；productName / category / brand / productLink 不进
  // 草稿，由 normalizeDraft 在保存时从 product 镜像回 Project。
  product: ProjectProduct;
  startDate: string;
  endDate: string;
  budgetAmount: string;
  budgetCurrency: ProjectCurrency;
  status?: WorkspaceProjectStatus;
  cpmMultiplier?: number | null;
  // 目标建联人数由用户在「产品信息」里自填。
  outreachTarget?: number | null;
  // 目标市场 / 投放平台 / 目标受众 / 核心卖点由「博主发现」自动回填，只读展示。
  targetMarkets: string[];
  platforms: string[];
  sellingPoints: string;
  targetAudience: string;
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
  openCreateProject: () => void;
  openEditProject: (projectId?: string) => void;
  closeProjectDrawer: () => void;
  // Consumed by discovery's project-switcher (linkr-discovery-bundle): inline-rename
  // a project, and synchronously quick-create + select a fresh draft project.
  renameProject: (projectId: string, name: string) => void;
  quickCreateProject: () => WorkspaceProject;
  resolveProjectName: (projectId: string) => string;
  getProject: (projectId: string) => WorkspaceProject | undefined;
  // §2.3.x partial-update for the schedule calendar's project-node markers.
  // Only the fields that the calendar surface can change are accepted; full
  // edits still flow through the project drawer.
  updateProjectDates: (projectId: string, dates: { startDate?: string; endDate?: string }) => void;
  // 删除一个项目；如果是当前选中项目，自动切到剩下的第一个。
  // 不允许删除最后一个项目（必须至少留一个，否则 currentProject 拿不到值）。
  deleteProject: (projectId: string) => void;
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
    products: [
      {
        id: "q2-summer-p0",
        name: "防蓝光护眼面霜",
        category: "美妆护肤",
        brand: "MyBrand",
        link: "https://www.mybrand.com/product",
        imageUrl: "",
        briefName: "",
        briefUrl: "",
      },
    ],
    productName: "防蓝光护眼面霜",
    productDescription: "防蓝光护眼面霜新品夏季推广",
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
    targetMarkets: ["美国", "加拿大"],
    platforms: ["TikTok", "Instagram"],
    collaborationType: "mixed",
    contentFormats: ["短视频", "开箱测评"],
    sellingPoints: "防蓝光 + 持久保湿，主打通勤护肤场景。",
    targetAudience: "18-34 岁都市女性，关注护肤成分与性价比。",
    contentBrief: {
      deliverablesPerCreator: 1,
      publishWindow: { start: "2026-05-01", end: "2026-06-15" },
      requiredHashtags: ["#防蓝光护肤", "#通勤护肤"],
      mentionAccounts: ["@mybrand"],
      needsWhitelisting: true,
      bannedWords: [],
    },
    targetMetrics: {
      impressions: 800000,
      engagementRate: 0.04,
      conversions: 1200,
      gmv: 60000,
      roi: 12,
    },
    uploadedListNames: [],
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-16T08:00:00.000Z",
  },
  {
    id: "beauty-pool",
    name: "美妆博主池",
    products: [
      {
        id: "beauty-pool-p0",
        name: "持久遮瑕粉底液",
        category: "彩妆",
        brand: "GlowLab",
        link: "https://www.glowlab.com/product",
        imageUrl: "",
        briefName: "",
        briefUrl: "",
      },
    ],
    productName: "持久遮瑕粉底液",
    productDescription: "持久遮瑕粉底液达人种草",
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
    targetMarkets: ["美国"],
    platforms: ["TikTok"],
    collaborationType: "gifted",
    contentFormats: ["短视频", "图文帖"],
    sellingPoints: "持妆 12 小时不脱妆，遮瑕力强。",
    targetAudience: "20-30 岁彩妆爱好者。",
    contentBrief: {
      deliverablesPerCreator: 1,
      publishWindow: { start: "", end: "" },
      requiredHashtags: [],
      mentionAccounts: [],
      needsWhitelisting: false,
      bannedWords: [],
    },
    targetMetrics: {
      impressions: null,
      engagementRate: null,
      conversions: null,
      gmv: null,
      roi: null,
    },
    uploadedListNames: [],
    createdAt: "2026-04-08T08:00:00.000Z",
    updatedAt: "2026-04-15T08:00:00.000Z",
  },
];

const WorkspaceProjectContext = createContext<WorkspaceProjectContextValue | null>(null);

// 项目抽屉的挂载契约 —— ProjectSheet 不再由 Provider 内联渲染，而是抽成
// <ProjectSheetHost/>，由布局挂在更深的位置（CreatorProfileProvider 之内）。
// 这样项目抽屉里点达人，才能通过 useCreatorProfile 弹出博主信息卡。
interface ProjectSheetMountValue {
  sheetKey: string;
  open: boolean;
  mode: ProjectDrawerMode;
  project?: WorkspaceProject;
  existingProjects: WorkspaceProject[];
  canDelete: boolean;
  onClose: () => void;
  onSave: (draft: WorkspaceProjectDraft) => void;
  onDelete?: () => void;
}

const ProjectSheetMountContext = createContext<ProjectSheetMountValue | null>(null);

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

// 旧版 localStorage 数据可能缺字段；交给统一模型的 withProjectDefaults 补齐。
// 唯一与统一默认值的差异：历史数据缺 status 时回落到 "running"——统一模型新建
// 项目默认 "draft"，但已存档的旧项目大多已经在跑。
function withDefaults(project: WorkspaceProject): WorkspaceProject {
  const status: ProjectStatus = project.status ?? "running";
  return withProjectDefaults({ ...project, status });
}

function normalizeDraft(draft: WorkspaceProjectDraft): WorkspaceProjectDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    product: {
      ...draft.product,
      name: draft.product.name.trim(),
      category: draft.product.category.trim(),
      brand: draft.product.brand.trim(),
      link: draft.product.link.trim(),
    },
    budgetAmount: draft.budgetAmount.trim(),
    sellingPoints: draft.sellingPoints.trim(),
    targetAudience: draft.targetAudience.trim(),
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
// 四态都落在 Zapier 暖色温家族内：橄榄绿 / 暖琥珀 / 深棕 共享黄调，不会和奶油底打架。
//   draft     沙色      未启动 / 占位
//   running   橄榄绿    进行中 —— 偏暖中性绿，避开亮绿和森林绿
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
    dot: "bg-[#5a8f3d]",
    pillBg: "bg-[#f1f4e8]",
    pillText: "text-[#3f6b29]",
    pillBorder: "border-[#cfdcb6]",
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

  const openCreateProject = useCallback(() => {
    setDrawerState({
      open: true,
      mode: "create",
    });
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

  // Consumed by discovery's project-switcher.
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
    // 走统一创建核心 —— 与插件「新建项目」、抽屉「创建项目」同一条路径。
    const next = createProject({ name: "未命名项目" });
    setProjects((current) => [...current, next]);
    setSelectedProjectId(next.id);
    setIsAllProjects(false);
    return next;
  }, []);

  const handleSaveProject = useCallback(
    (draft: WorkspaceProjectDraft) => {
      const normalizedDraft = normalizeDraft(draft);
      const now = new Date().toISOString();
      // draft 持有单个 product；保存时回写 products 数组 + 旧的单产品字段，
      // 保持插件端 ProjectSummary / 概览卡兼容。
      const { product, ...rest } = normalizedDraft;
      const productMirror = {
        products: [product],
        productName: product.name,
        category: product.category,
        brand: product.brand,
        productLink: product.link,
      };

      if (drawerState.mode === "edit" && drawerState.projectId) {
        setProjects((current) =>
          current.map((project) =>
            project.id === drawerState.projectId
              ? {
                  ...project,
                  ...rest,
                  ...productMirror,
                  updatedAt: now,
                }
              : project,
          ),
        );
        closeProjectDrawer();
        return;
      }

      // 走统一创建核心 —— 默认值（status / cpmMultiplier / 数组字段等）由
      // createProject 统一补齐，不再在这里逐字段兜底。
      const nextProject = createProject({ ...rest, ...productMirror });

      setProjects((current) => [nextProject, ...current]);
      setSelectedProjectId(nextProject.id);
      closeProjectDrawer();
    },
    [drawerState.mode, drawerState.projectId, closeProjectDrawer],
  );

  const deleteProject = useCallback(
    (projectId: string) => {
      setProjects((current) => {
        // 至少保留一个项目，避免 currentProject 落到 undefined。
        if (current.length <= 1) return current;
        return current.filter((project) => project.id !== projectId);
      });
      setSelectedProjectId((current) => {
        if (current !== projectId) return current;
        const next = projects.find((project) => project.id !== projectId);
        return next ? next.id : current;
      });
    },
    [projects],
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
      deleteProject,
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
      deleteProject,
    ],
  );

  const editingProject = drawerState.projectId
    ? stableProjects.find((project) => project.id === drawerState.projectId)
    : undefined;

  // ProjectSheet 的挂载数据 —— 交给 <ProjectSheetHost/> 在更深的位置渲染。
  const sheetMount = useMemo<ProjectSheetMountValue>(
    () => ({
      // sheetKey 让 ProjectSheet 在「开关 / 切换编辑目标」时重新挂载，draft 干净重置。
      sheetKey: drawerState.open ? (drawerState.projectId ?? "new") : "_closed",
      open: drawerState.open,
      mode: drawerState.mode,
      project: editingProject,
      existingProjects: stableProjects,
      canDelete: stableProjects.length > 1,
      onClose: closeProjectDrawer,
      onSave: handleSaveProject,
      onDelete:
        drawerState.mode === "edit" && drawerState.projectId
          ? () => {
              deleteProject(drawerState.projectId!);
              closeProjectDrawer();
            }
          : undefined,
    }),
    [
      drawerState,
      editingProject,
      stableProjects,
      closeProjectDrawer,
      handleSaveProject,
      deleteProject,
    ],
  );

  return (
    <WorkspaceProjectContext.Provider value={value}>
      <ProjectSheetMountContext.Provider value={sheetMount}>
        {children}
      </ProjectSheetMountContext.Provider>
    </WorkspaceProjectContext.Provider>
  );
}

// 项目抽屉的挂载点 —— 布局把它放在 CreatorProfileProvider 之内，
// 让抽屉里点达人能弹出博主信息卡。drawer 状态仍由 WorkspaceProjectProvider 持有。
export function ProjectSheetHost() {
  const mount = useContext(ProjectSheetMountContext);
  if (!mount) return null;
  return (
    <ProjectSheet
      key={mount.sheetKey}
      open={mount.open}
      mode={mount.mode}
      project={mount.project}
      existingProjects={mount.existingProjects}
      canDelete={mount.canDelete}
      onClose={mount.onClose}
      onSave={mount.onSave}
      onDelete={mount.onDelete}
    />
  );
}

export function useWorkspaceProject() {
  const context = useContext(WorkspaceProjectContext);
  if (!context) {
    throw new Error("useWorkspaceProject must be used within WorkspaceProjectProvider.");
  }
  return context;
}
