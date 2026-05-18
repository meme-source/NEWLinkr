"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  FileText,
  Heart,
  MessageCircle,
  Moon,
  Play,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { CreatorAvatarWithHover } from "@/features/plugin/components/creator-avatar";
import { CreatorProfileHeader } from "@/features/plugin/components/creator-profile-header";
import { TiktokVideoTile } from "@/features/plugin/components/tiktok-video-tile";
import type { TiktokVideoCategory } from "@/features/plugin/components/tiktok-video-tile/types";
import { SinglePostPage } from "@/features/plugin/components/video-analysis-mock/SinglePostPage";
import {
  CreateProjectModal,
  DEFAULT_ENABLED_BADGE_CATEGORIES,
  DEFAULT_FLOP_RATIO_THRESHOLD,
  DEFAULT_HOVER_METRIC_MODES,
  DEFAULT_HOVER_METRICS,
  DEFAULT_INLINE_DATA_KEYS,
  DEFAULT_VIRAL_RATIO_THRESHOLD,
  DeleteProjectConfirm,
  SCRAPE_COUNT_OPTIONS,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SOCIAL_PLATFORM_OPTIONS,
  SearchResultPopup,
  SimilarSidebar,
  SocialPlatformLogo,
  formatComments,
  formatLikes,
  formatPlays,
  formatScheduleLabel,
  getAudienceSummary,
  getCreatorContactEmail,
  getCreatorLocation,
  getCreatorMetricSnapshot,
  getCreatorType,
  getEmailTemplateDraft,
  parseMetricToNumber,
} from "@/features/plugin/components/sidebar";
import type {
  CreatorProfile,
  DemoStage,
  EmailSendOptions,
  EmailTemplateKey,
  HoverMetricKey,
  InlineDataKey,
  MetricAggregation,
  ProjectScopedState,
  ProjectSummary,
  ReviewFlow,
  SearchModeKey,
  SidebarTab,
  SocialPlatformKey,
} from "@/features/plugin/types";
import { toProjectSummary } from "@/features/plugin/lib/project-mapper";
import { createProject } from "@/features/project/lib/project-model";
import { searchModes } from "@/features/plugin/data/search-modes";
import { FLAG_TO_DISCOVERY_COUNTRY } from "@/features/plugin/data/countries";
import { buildSimilarDiscoveryUrl, type SimilarEntry } from "@/lib/discovery/similar-url";
import {
  PROJECTS_STORAGE_KEY,
  PROJECT_SCOPED_STATE_KEY,
  SELECTED_PROJECT_STORAGE_KEY,
  defaultProjectScopedState,
  defaultProjects,
} from "@/features/plugin/data/projects";
import { creatorProfiles } from "@/features/plugin/data/creator-profiles";
import { searchResults } from "@/features/plugin/data/search-results";

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function focusWithoutScroll(element: { focus: (options?: FocusOptions) => void } | null) {
  if (!element) return;
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

function getSidebarWidthBounds(viewportWidth: number, compactViewport: boolean) {
  const maxWidth = Math.max(
    280,
    Math.min(SIDEBAR_MAX_WIDTH, viewportWidth - (compactViewport ? 24 : 180)),
  );
  const minWidth = Math.min(SIDEBAR_MIN_WIDTH, maxWidth);
  return { min: minWidth, max: maxWidth };
}

function sortProjectsNewestFirst(projects: ProjectSummary[]) {
  return [...projects].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function buildQuickProjectName(projects: ProjectSummary[]) {
  const existingNames = new Set(projects.map((project) => project.name));
  let index = projects.length + 1;
  let name = `新项目 ${index}`;

  while (existingNames.has(name)) {
    index += 1;
    name = `新项目 ${index}`;
  }

  return name;
}

function createEmptyProjectScopedState(): ProjectScopedState {
  return {
    savedCreatorIds: [],
    dismissedCreatorIds: [],
    creatorTags: {},
  };
}

type SearchResultCard = (typeof searchResults)[SearchModeKey]["cards"][number];

function buildFallbackCreatorProfile(
  creatorId: string,
  cards: ReadonlyArray<SearchResultCard>,
): CreatorProfile | null {
  const card = cards.find((c) => c.id === creatorId);
  if (!card) {
    return null;
  }
  return {
    id: card.id,
    handle: card.name.startsWith("@") ? card.name : `@${card.name}`,
    name: card.name.replace(/^@/, ""),
    country: card.country,
    followers: card.fans,
    likes: card.views,
    videos: "—",
    er: card.er,
    rate: card.price,
    email: card.email,
    bio: card.reason,
    statBadges: card.tags?.slice(0, 3) ?? [],
  };
}

function getMedianNumber(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mapFollowersLabelToDiscoveryPreset(followersLabel: string): string | null {
  const m = followersLabel.match(/([\d.]+)\s*K/i);
  if (!m) return null;
  const k = parseFloat(m[1]);
  if (k < 50) return "10K-50K";
  if (k < 100) return "50K-100K";
  if (k < 200) return "100K-200K";
  if (k < 500) return "200K-500K";
  if (k < 1000) return "500K-1M";
  return "1M+";
}

// URL schema 已迁移到 lib/discovery/similar-url.ts —— 网页端抽屉的「找相似」
// 通过同一 builder 跳转，确保两端契约一致。这里负责把插件的 CreatorProfile
// 适配到通用 input。
function buildDiscoveryResultsUrl({
  creatorId,
  creator,
  project,
  entry,
  mode,
}: {
  creatorId: string;
  creator: CreatorProfile;
  project?: ProjectSummary;
  entry: SimilarEntry;
  mode?: "viral";
}) {
  const summary = getAudienceSummary(creator);
  const countrySet = new Set<string>();
  for (const flag of [...(summary.regionT1?.flags ?? []), ...(summary.regionT2?.flags ?? [])]) {
    const name = FLAG_TO_DISCOVERY_COUNTRY[flag];
    if (name) countrySet.add(name);
  }

  return buildSimilarDiscoveryUrl({
    creatorId,
    seedHandle: creator.handle,
    seedName: creator.name,
    platform: "tiktok",
    entry,
    mode,
    projectId: project?.id,
    projectName: project?.name,
    countries: Array.from(countrySet),
    followersPreset: mapFollowersLabelToDiscoveryPreset(creator.followers),
  });
}

/** 插件「找种子达人」→ 后台博主发现结果页深链（含筛选与直接进入结果） */
function buildSeedFinderDiscoveryUrl(
  creatorId: string,
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  return buildDiscoveryResultsUrl({
    creatorId,
    creator,
    project,
    entry: "seed-finder",
    mode: "viral",
  });
}

function buildQuickScreenDiscoveryUrl(
  creatorId: string,
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  return buildDiscoveryResultsUrl({
    creatorId,
    creator,
    project,
    entry: "quick-screen",
  });
}

export default function PluginPathDemo() {
  const router = useRouter();
  const [demoStage, setDemoStage] = useState<DemoStage>("floating");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reviewFlow, setReviewFlow] = useState<ReviewFlow>("idle");
  const [selectedMode, setSelectedMode] = useState<SearchModeKey>("comprehensive");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [resultPopupOpen, setResultPopupOpen] = useState(false);
  const [workMode, setWorkMode] = useState<"on" | "off">("on");
  const [dataCheckOn, setDataCheckOn] = useState(false);
  const [scrapeCount, setScrapeCount] = useState<number>(10);
  const [inlineDataKeys, setInlineDataKeys] = useState<InlineDataKey[]>(DEFAULT_INLINE_DATA_KEYS);
  const [enabledBadgeCategories, setEnabledBadgeCategories] = useState<Set<TiktokVideoCategory>>(
    () => new Set<TiktokVideoCategory>(DEFAULT_ENABLED_BADGE_CATEGORIES),
  );
  const toggleBadgeCategory = useCallback((category: TiktokVideoCategory) => {
    setEnabledBadgeCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatformKey>("tiktok");
  const [selectedHoverMetricKeys, setSelectedHoverMetricKeys] =
    useState<HoverMetricKey[]>(DEFAULT_HOVER_METRICS);
  const [hoverMetricModes, setHoverMetricModes] = useState<
    Record<HoverMetricKey, MetricAggregation>
  >(DEFAULT_HOVER_METRIC_MODES);
  const [floatingTop, setFloatingTop] = useState(216);
  const [floatingOffsetX, setFloatingOffsetX] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_MIN_WIDTH);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectProductDescription, setNewProjectProductDescription] = useState("");
  const [newProjectFiles, setNewProjectFiles] = useState<File[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>(
    sortProjectsNewestFirst(defaultProjects),
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    sortProjectsNewestFirst(defaultProjects)[0]?.id ?? "",
  );
  const [projectScopedState, setProjectScopedState] =
    useState<Record<string, ProjectScopedState>>(defaultProjectScopedState);
  const [activeCreatorId, setActiveCreatorId] = useState("camping-aurora");
  const [sequentialCreatorIds, setSequentialCreatorIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [compactViewport, setCompactViewport] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("current");
  // 浏览器里当前打开的帖子 id（synthetic video id）；null = 还停在博主个人主页，
  // 此时「单帖 AI 分析」入口锁住。
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<EmailTemplateKey>("");
  const [emailDraft, setEmailDraft] = useState("");
  const cardCloseRef = useRef<HTMLButtonElement>(null);
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const searchTimerRefs = useRef<number[]>([]);
  const resultPopupCloseRef = useRef<HTMLButtonElement>(null);
  const createProjectCloseRef = useRef<HTMLButtonElement>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startTop: number;
    startOffsetX: number;
  } | null>(null);
  const sidebarResizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);
  const selectedPlatformLabel =
    SOCIAL_PLATFORM_OPTIONS.find((item) => item.key === selectedPlatform)?.label ?? "TikTok";
  const sidebarWidthBounds = getSidebarWidthBounds(viewportWidth, compactViewport);
  const expandedSidebarWidth = clampValue(
    sidebarWidth,
    sidebarWidthBounds.min,
    sidebarWidthBounds.max,
  );

  const handleSetWorkMode = (next: "on" | "off") => {
    setWorkMode((current) => {
      if (current === next) {
        return current;
      }

      if (next === "off") {
        setDemoStage("floating");
        setSidebarOpen(false);
      }

      return next;
    });
  };

  const handleToggleWorkMode = () => {
    setWorkMode((m) => {
      const next = m === "on" ? "off" : "on";
      if (next === "off") {
        setDemoStage("floating");
        setSidebarOpen(false);
      }
      return next;
    });
  };

  const openTaskList = () => {
    window.open("/workspace/outreach?tab=tasks", "_blank", "noopener,noreferrer");
    setFeedback(`已打开项目「${selectedProject.name}」的 web 任务页`);
  };

  useEffect(() => {
    if (demoStage === "card") {
      focusWithoutScroll(cardCloseRef.current);
    }

    if (sidebarOpen) {
      focusWithoutScroll(sidebarCloseRef.current);
    }
  }, [demoStage, sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) {
      searchTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
      searchTimerRefs.current = [];
      setHasSearched(false);
      setIsSearching(false);
      setSearchProgress(0);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    searchTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    searchTimerRefs.current = [];
    setHasSearched(false);
    setIsSearching(false);
    setSearchProgress(0);
    setResultPopupOpen(false);
  }, [selectedMode]);

  useEffect(() => {
    if (resultPopupOpen) {
      focusWithoutScroll(resultPopupCloseRef.current);
    }
  }, [resultPopupOpen]);

  useEffect(() => {
    if (createProjectModalOpen) {
      focusWithoutScroll(createProjectCloseRef.current);
    }
  }, [createProjectModalOpen]);

  useEffect(() => {
    if (!resultPopupOpen && !createProjectModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [createProjectModalOpen, resultPopupOpen]);

  useEffect(() => {
    return () => {
      searchTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const syncViewport = () => {
      setViewportWidth(window.innerWidth);
      setCompactViewport(window.innerWidth < 1100);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    const { min, max } = getSidebarWidthBounds(viewportWidth, compactViewport);
    setSidebarWidth((current) => clampValue(current, min, max));
  }, [viewportWidth, compactViewport]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFeedback("");
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!isSidebarResizing) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const handlePointerMove = (event: PointerEvent) => {
      if (!sidebarResizeStateRef.current) {
        return;
      }

      const deltaX = sidebarResizeStateRef.current.startX - event.clientX;
      const nextWidth = clampValue(
        sidebarResizeStateRef.current.startWidth + deltaX,
        sidebarWidthBounds.min,
        sidebarWidthBounds.max,
      );
      setSidebarWidth(nextWidth);
    };

    const stopResizing = () => {
      sidebarResizeStateRef.current = null;
      setIsSidebarResizing(false);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isSidebarResizing, sidebarWidthBounds.max, sidebarWidthBounds.min]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current) {
        return;
      }

      const deltaX = event.clientX - dragStateRef.current.startX;
      const deltaY = event.clientY - dragStateRef.current.startY;
      const maxTop = Math.max(120, window.innerHeight - (sidebarOpen ? 320 : 240));
      const nextTop = Math.min(Math.max(96, dragStateRef.current.startTop + deltaY), maxTop);
      const nextOffsetX = clampValue(
        dragStateRef.current.startOffsetX + deltaX,
        -window.innerWidth + 120,
        120,
      );
      setFloatingTop(nextTop);
      setFloatingOffsetX(nextOffsetX);
    };

    const stopDragging = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [sidebarOpen]);

  const activeMode = searchModes.find((mode) => mode.key === selectedMode) ?? searchModes[0];
  const latestProject = projects[0] ?? defaultProjects[0];
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? latestProject;
  const activeProjectState =
    projectScopedState[selectedProject.id] ?? createEmptyProjectScopedState();
  const savedCreatorIds = activeProjectState.savedCreatorIds;
  const savedProjectCreators = useMemo(
    () =>
      savedCreatorIds
        .map((creatorId) => creatorProfiles[creatorId])
        .filter((creator): creator is CreatorProfile => Boolean(creator)),
    [savedCreatorIds],
  );
  const dismissedCreatorIds = activeProjectState.dismissedCreatorIds;
  const creatorTags = activeProjectState.creatorTags;
  const activeResults = searchResults[selectedMode];
  const activeCreator: CreatorProfile =
    creatorProfiles[activeCreatorId] ??
    buildFallbackCreatorProfile(activeCreatorId, activeResults.cards) ??
    creatorProfiles["camping-aurora"];
  const visibleCards = activeResults.cards.filter(
    (card) => !dismissedCreatorIds.includes(card.id) && !savedCreatorIds.includes(card.id),
  );
  const sequentialPosition = sequentialCreatorIds.findIndex((id) => id === activeCreatorId);

  useEffect(() => {
    if (selectedEmailTemplate) {
      setEmailDraft(getEmailTemplateDraft(selectedEmailTemplate, activeCreator, selectedProject));
    }
  }, [activeCreator, selectedEmailTemplate, selectedProject]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
          const normalizedProjects = parsedProjects.filter(
            (value): value is ProjectSummary =>
              !!value &&
              typeof value.id === "string" &&
              typeof value.name === "string" &&
              typeof value.productDescription === "string" &&
              typeof value.createdAt === "string" &&
              typeof value.createdLabel === "string",
          );

          if (normalizedProjects.length > 0) {
            setProjects(sortProjectsNewestFirst(normalizedProjects));
          }
        }
      }

      const storedProjectState = window.localStorage.getItem(PROJECT_SCOPED_STATE_KEY);
      if (storedProjectState) {
        const parsedProjectState = JSON.parse(storedProjectState);
        if (parsedProjectState && typeof parsedProjectState === "object") {
          setProjectScopedState(parsedProjectState as Record<string, ProjectScopedState>);
        }
      }

      const storedSelectedProjectId = window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
      if (storedSelectedProjectId) {
        setSelectedProjectId(storedSelectedProjectId);
      }
    } catch {
      window.localStorage.removeItem(PROJECTS_STORAGE_KEY);
      window.localStorage.removeItem(PROJECT_SCOPED_STATE_KEY);
      window.localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    window.localStorage.setItem(PROJECT_SCOPED_STATE_KEY, JSON.stringify(projectScopedState));
    window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, selectedProject.id);
  }, [projectScopedState, projects, selectedProject.id]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    setSelectedProjectId((current) => {
      if (projects.some((project) => project.id === current)) {
        return current;
      }

      return selectedProject.id;
    });
  }, [projects, selectedProject]);

  const updateSelectedProjectState = (
    updater: (current: ProjectScopedState) => ProjectScopedState,
  ) => {
    setProjectScopedState((current) => ({
      ...current,
      [selectedProject.id]: updater(current[selectedProject.id] ?? createEmptyProjectScopedState()),
    }));
  };

  const handleSelectProject = (projectId: string) => {
    const nextProject = projects.find((project) => project.id === projectId);
    if (!nextProject || nextProject.id === selectedProject.id) {
      return;
    }

    searchTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    searchTimerRefs.current = [];
    setSelectedProjectId(nextProject.id);
    setReviewFlow("idle");
    setSequentialCreatorIds([]);
    setHasSearched(false);
    setIsSearching(false);
    setSearchProgress(0);
    setResultPopupOpen(false);
    setFeedback(`已切换到项目「${nextProject.name}」`);
  };

  const handleQuickCreateProject = () => {
    setNewProjectName(buildQuickProjectName(projects));
    setNewProjectProductDescription("");
    setNewProjectFiles([]);
    setCreateProjectModalOpen(true);
  };

  const handleRequestDeleteProject = (projectId: string) => {
    setDeleteProjectId(projectId);
  };

  const handleCancelDeleteProject = () => {
    setDeleteProjectId(null);
  };

  const handleConfirmDeleteProject = () => {
    if (!deleteProjectId) return;
    if (projects.length <= 1) {
      setFeedback("至少保留一个项目，无法删除最后一个项目。");
      setDeleteProjectId(null);
      return;
    }
    const removed = projects.find((p) => p.id === deleteProjectId);
    setProjects((current) => current.filter((p) => p.id !== deleteProjectId));
    setProjectScopedState((current) => {
      const { [deleteProjectId]: _omit, ...rest } = current;
      return rest;
    });
    if (selectedProjectId === deleteProjectId) {
      const next = projects.find((p) => p.id !== deleteProjectId);
      if (next) setSelectedProjectId(next.id);
    }
    setDeleteProjectId(null);
    setFeedback(removed ? `已删除项目「${removed.name}」` : "已删除项目");
  };

  const closeCreateProjectModal = () => {
    setCreateProjectModalOpen(false);
  };

  const handleSubmitCreateProject = () => {
    const projectName = newProjectName.trim();
    const productDescription = newProjectProductDescription.trim();

    if (!projectName || !productDescription) {
      setFeedback("请先填写项目名和产品信息。");
      return;
    }

    // 走统一创建核心 —— 与网页端、discovery 同一条 createProject() 路径，
    // 再投影成插件端的 ProjectSummary 视图。
    const nextProject = toProjectSummary(
      createProject({
        name: projectName,
        productDescription,
        uploadedListNames: newProjectFiles.map((file) => file.name),
      }),
      "刚刚创建",
    );

    searchTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    searchTimerRefs.current = [];
    setProjects((current) => sortProjectsNewestFirst([nextProject, ...current]));
    setProjectScopedState((current) => ({
      ...current,
      [nextProject.id]: createEmptyProjectScopedState(),
    }));
    setSelectedProjectId(nextProject.id);
    setReviewFlow("idle");
    setSequentialCreatorIds([]);
    setHasSearched(false);
    setIsSearching(false);
    setSearchProgress(0);
    setResultPopupOpen(false);
    setCreateProjectModalOpen(false);
    setFeedback(
      newProjectFiles.length > 0
        ? `已新建项目「${nextProject.name}」，并附带 ${newProjectFiles.length} 份达人名单`
        : `已新建项目「${nextProject.name}」`,
    );
  };

  const runSearch = () => {
    searchTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    searchTimerRefs.current = [];
    setIsSearching(true);
    setHasSearched(false);
    setSearchProgress(8);
    setResultPopupOpen(false);
    setReviewFlow("idle");

    [26, 48, 73, 91].forEach((value, index) => {
      const timer = window.setTimeout(
        () => {
          setSearchProgress(value);
        },
        220 + index * 260,
      );
      searchTimerRefs.current.push(timer);
    });

    const doneTimer = window.setTimeout(() => {
      setSearchProgress(100);
      setIsSearching(false);
      setHasSearched(true);
      setResultPopupOpen(true);
      setSequentialCreatorIds(visibleCards.map((creator) => creator.id));
    }, 1450);
    searchTimerRefs.current.push(doneTimer);
  };

  const floatingRight = sidebarOpen
    ? sidebarCollapsed
      ? `calc(${SIDEBAR_COLLAPSED_WIDTH}px + 12px)`
      : compactViewport
        ? "12px"
        : `calc(${expandedSidebarWidth}px + 16px)`
    : compactViewport
      ? "16px"
      : "24px";

  const startFloatingDrag = (clientX: number, clientY: number) => {
    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      startTop: floatingTop,
      startOffsetX: floatingOffsetX,
    };
  };

  const startSidebarResize = (clientX: number) => {
    sidebarResizeStateRef.current = {
      startX: clientX,
      startWidth: expandedSidebarWidth,
    };
    setIsSidebarResizing(true);
  };

  const handleOpenProfile = (creatorId: string, flow: ReviewFlow = "idle") => {
    setActiveCreatorId(creatorId);
    setDemoStage(flow === "sequential" ? "card" : "floating");
    setReviewFlow(flow);
    setFeedback(`已跳转到 ${creatorProfiles[creatorId]?.handle} 的主页`);
  };

  const handleSaveCreator = (creatorId: string) => {
    const creatorHandle = creatorProfiles[creatorId]?.handle;
    const wasSaved = savedCreatorIds.includes(creatorId);
    const wasDismissed = dismissedCreatorIds.includes(creatorId);

    if (wasSaved) {
      updateSelectedProjectState((current) => ({
        ...current,
        savedCreatorIds: current.savedCreatorIds.filter((id) => id !== creatorId),
      }));
      setFeedback(`已从项目「${selectedProject.name}」取消收藏 ${creatorHandle}`);
      return;
    }

    updateSelectedProjectState((current) => ({
      ...current,
      savedCreatorIds: [...current.savedCreatorIds.filter((id) => id !== creatorId), creatorId],
      dismissedCreatorIds: current.dismissedCreatorIds.filter((id) => id !== creatorId),
    }));
    setFeedback(
      wasDismissed
        ? `已在项目「${selectedProject.name}」取消 No，并收藏 ${creatorHandle}`
        : `已在项目「${selectedProject.name}」收藏 ${creatorHandle}`,
    );
  };

  const handleDismissCreator = (creatorId: string) => {
    const creatorHandle = creatorProfiles[creatorId]?.handle;
    const wasDismissed = dismissedCreatorIds.includes(creatorId);
    const wasSaved = savedCreatorIds.includes(creatorId);

    if (wasDismissed) {
      updateSelectedProjectState((current) => ({
        ...current,
        dismissedCreatorIds: current.dismissedCreatorIds.filter((id) => id !== creatorId),
      }));
      setSequentialCreatorIds((current) => {
        if (current.includes(creatorId)) {
          return current;
        }

        const restoredIds = new Set([...current, creatorId]);
        return activeResults.cards.map((card) => card.id).filter((id) => restoredIds.has(id));
      });
      setFeedback(`已在项目「${selectedProject.name}」取消 No，恢复 ${creatorHandle}`);
      return;
    }

    const currentIndex = sequentialCreatorIds.findIndex((id) => id === creatorId);
    const nextCreatorId =
      currentIndex >= 0
        ? (sequentialCreatorIds[currentIndex + 1] ?? sequentialCreatorIds[currentIndex - 1])
        : undefined;

    updateSelectedProjectState((current) => ({
      ...current,
      savedCreatorIds: current.savedCreatorIds.filter((id) => id !== creatorId),
      dismissedCreatorIds: current.dismissedCreatorIds.includes(creatorId)
        ? current.dismissedCreatorIds
        : [...current.dismissedCreatorIds, creatorId],
    }));
    setSequentialCreatorIds((current) => current.filter((id) => id !== creatorId));
    if (reviewFlow === "sequential" && activeCreatorId === creatorId) {
      if (nextCreatorId) {
        setActiveCreatorId(nextCreatorId);
      } else {
        setSidebarOpen(true);
        setDemoStage("floating");
        setReviewFlow("idle");
      }
    }
    setFeedback(
      wasSaved
        ? `已在项目「${selectedProject.name}」对 ${creatorHandle} 标记 No，并取消收藏`
        : `已在项目「${selectedProject.name}」对 ${creatorHandle} 标记 No`,
    );
  };

  const handleSeedCreator = (creatorId: string) => {
    setActiveCreatorId(creatorId);
    setHasSearched(false);
    setIsSearching(false);
    setSearchProgress(0);
    setResultPopupOpen(false);
    setReviewFlow("idle");
    setSelectedMode("comprehensive");
    setActiveSidebarTab("similar");
    setSidebarCollapsed(false);
    setSidebarOpen(true);
    setFeedback(
      `已在项目「${selectedProject.name}」里切换 ${creatorProfiles[creatorId]?.handle} 为种子博主`,
    );
  };

  const handleQuickScreen = () => {
    router.push(buildQuickScreenDiscoveryUrl(activeCreatorId, activeCreator, selectedProject));
  };

  const handleOpenSeedFinder = () => {
    router.push(buildSeedFinderDiscoveryUrl(activeCreatorId, activeCreator, selectedProject));
  };

  const handleSequentialScreen = () => {
    const firstCreatorId = visibleCards[0]?.id;
    if (!firstCreatorId) {
      setResultPopupOpen(false);
      setFeedback("当前演示卡片已处理完，可重新搜索或更换模式。");
      return;
    }

    setResultPopupOpen(false);
    setReviewFlow("sequential");
    setSequentialCreatorIds(visibleCards.map((creator) => creator.id));
    setActiveCreatorId(firstCreatorId);
    setActiveSidebarTab("similar");
    setSidebarCollapsed(false);
    setSidebarOpen(true);
    setDemoStage("floating");
    setFeedback(
      `已切换到项目「${selectedProject.name}」的逐个筛选，当前查看 ${creatorProfiles[firstCreatorId]?.handle}`,
    );
  };

  const handleAddTag = (creatorId: string, label: string) => {
    const normalizedLabel = label.trim();
    if (!normalizedLabel) {
      return;
    }

    let added = false;
    updateSelectedProjectState((current) => {
      const existing = current.creatorTags[creatorId] ?? [];
      if (existing.some((item) => item.toLowerCase() === normalizedLabel.toLowerCase())) {
        return current;
      }

      added = true;
      return {
        ...current,
        creatorTags: {
          ...current.creatorTags,
          [creatorId]: [...existing, normalizedLabel],
        },
      };
    });

    if (added) {
      setFeedback(`已在项目「${selectedProject.name}」打标签 ${normalizedLabel}`);
    }
  };

  const handleRemoveTag = (creatorId: string, label: string) => {
    updateSelectedProjectState((current) => ({
      ...current,
      creatorTags: {
        ...current.creatorTags,
        [creatorId]: (current.creatorTags[creatorId] ?? []).filter((item) => item !== label),
      },
    }));
    setFeedback(`已从项目「${selectedProject.name}」移除标签 ${label}`);
  };

  const handleSendCurrent = async (
    templateLabel: string,
    draft: string,
    options: EmailSendOptions,
  ) => {
    if (!options.subject.trim()) {
      setFeedback("邮件标题为空，请先补充后再发送。");
      return;
    }

    if (!draft.trim()) {
      setFeedback("邮件内容为空，请先补充后再发送。");
      return;
    }

    if (options.mode === "scheduled" && !options.scheduledAt) {
      setFeedback("请先选择定时发送时间。");
      return;
    }

    const suffix =
      options.mode === "scheduled"
        ? `已定时 ${formatScheduleLabel(options.scheduledAt ?? "")} 发送`
        : "已一键发送";
    const attachmentText =
      options.attachmentCount > 0 ? `，含 ${options.attachmentCount} 个附件` : "";
    const recipientIds =
      options.recipientCreatorIds && options.recipientCreatorIds.length > 0
        ? options.recipientCreatorIds
        : [activeCreator.id];
    const recipientCreators = recipientIds
      .map((creatorId) => creatorProfiles[creatorId])
      .filter((item): item is CreatorProfile => Boolean(item));

    if (recipientCreators.length === 0) {
      setFeedback("请先选择建联对象。");
      return;
    }

    const messages =
      options.recipientMessages && options.recipientMessages.length > 0
        ? options.recipientMessages
        : recipientCreators.map((recipient) => ({
            creatorId: recipient.id,
            subject: options.subject,
            content: draft,
            personalizedSegmentCount: 0,
          }));

    try {
      const response = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          templateKey: options.templateKey ?? "custom",
          senderAddress: options.senderAddress,
          mode: options.mode,
          scheduledAt: options.scheduledAt,
          attachmentCount: options.attachmentCount,
          messages,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setFeedback(payload?.error ?? "建联发送失败，请稍后重试。");
        return;
      }
    } catch {
      setFeedback("建联发送失败，请检查网络后重试。");
      return;
    }

    const recipientLabel =
      recipientCreators.length === 1
        ? recipientCreators[0].handle
        : `${recipientCreators[0].handle} 等 ${recipientCreators.length} 位博主`;

    setFeedback(
      `${suffix}：项目「${selectedProject.name}」向 ${recipientLabel} 发送「${templateLabel}」邮件${attachmentText}`,
    );
  };

  const openCurrentSidebar = () => {
    setActiveSidebarTab("current");
    setSidebarCollapsed(false);
    setSidebarOpen(true);
    setDemoStage("floating");
  };

  const openEmailSidebar = () => {
    setActiveSidebarTab("email");
    setSidebarCollapsed(false);
    setSidebarOpen(true);
    setDemoStage("floating");
  };

  const openSimilarSidebar = () => {
    setActiveSidebarTab("similar");
    setSidebarCollapsed(false);
    setSidebarOpen(true);
    setDemoStage("floating");
  };

  // 用户在博主主页点某条帖子 —— 主内容区切到抖音单帖详情页，侧边栏自动弹出
  // 并定位到「单帖 AI 分析」。
  const handleSelectPost = (postId: string) => {
    setOpenPostId(postId);
    setActiveSidebarTab("single-post");
    setSidebarCollapsed(false);
    setSidebarOpen(true);
    setDemoStage("floating");
  };

  // 从单帖详情页「返回主页」—— 回到博主九宫格，单帖入口重新锁住。
  const closePost = () => {
    setOpenPostId(null);
    setActiveSidebarTab((tab) => (tab === "single-post" ? "current" : tab));
  };

  const handleDeleteResultPopup = () => {
    setResultPopupOpen(false);
    setHasSearched(false);
    setIsSearching(false);
    setSearchProgress(0);
    setFeedback("已关闭这张结果提示卡片，返回当前找相似插件页。");
  };

  const handleEndSearch = () => {
    setHasSearched(false);
    setIsSearching(false);
    setSearchProgress(0);
    setResultPopupOpen(false);
    // 结束找相似进程时,把逐个筛选 / 悬浮卡片状态一起清掉 —— 否则悬浮球上的
    // 信息卡会继续显示「逐个筛选中」横幅,与已经结束的搜索不同步。
    setReviewFlow("idle");
    setSequentialCreatorIds([]);
    setDemoStage("floating");
  };

  return (
    <main className="min-h-screen bg-[#eceae3] text-[#201515]">
      <div className="absolute top-4 left-4 z-40 sm:top-6 sm:left-6">
        <Button
          asChild
          variant="outline"
          className="rounded-[8px] border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:bg-[#eceae3]"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>

      {feedback ? (
        <div className="absolute top-20 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-4 py-2 text-sm text-[#36342e]">
          {feedback}
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <aside className="hidden w-[92px] shrink-0 border-r border-[#c5c0b1] bg-[#eceae3] xl:flex xl:flex-col xl:justify-between">
          <div className="px-4 pt-6">
            <div className="space-y-5 text-xs text-[#939084]">
              <SideNavItem label="首页" active />
              <SideNavItem label="搜索" />
              <SideNavItem label="Following" />
              <SideNavItem label="LIVE" />
              <SideNavItem label="个人" />
            </div>
          </div>
          <div className="px-4 pb-6 text-xs text-[#939084]">{selectedPlatformLabel}</div>
        </aside>

        <div className="relative flex-1">
          <div
            className={cn(
              "transition-[padding-right] duration-300",
              isSidebarResizing && "transition-none",
            )}
            style={{
              paddingRight: sidebarOpen
                ? sidebarCollapsed
                  ? `${SIDEBAR_COLLAPSED_WIDTH}px`
                  : `${expandedSidebarWidth}px`
                : "0px",
            }}
          >
            <div
              className="absolute z-30"
              style={{
                top: `${floatingTop}px`,
                right: floatingRight,
                transform: `translateX(${floatingOffsetX}px)`,
              }}
            >
              <FloatingPluginGroup
                demoStage={demoStage}
                cardCloseRef={cardCloseRef}
                onOpenCard={() => setDemoStage("card")}
                onOpenCurrentSidebar={openCurrentSidebar}
                onOpenEmailSidebar={openEmailSidebar}
                onOpenSimilarSidebar={openSimilarSidebar}
                onClose={() => setDemoStage("floating")}
                onDragStart={startFloatingDrag}
                compactViewport={compactViewport}
                creator={activeCreator}
                reviewFlow={reviewFlow}
                sequentialIndex={sequentialPosition}
                sequentialTotal={sequentialCreatorIds.length}
                isSaved={savedCreatorIds.includes(activeCreator.id)}
                onToggleSave={() => handleSaveCreator(activeCreator.id)}
                tags={creatorTags[activeCreator.id] ?? []}
                onAddTag={(label) => handleAddTag(activeCreator.id, label)}
                onRemoveTag={(label) => handleRemoveTag(activeCreator.id, label)}
                workMode={workMode}
                onToggleWorkMode={handleToggleWorkMode}
                onSetWorkMode={handleSetWorkMode}
                onOpenTaskList={openTaskList}
                dataCheckOn={dataCheckOn}
                onToggleDataCheck={() => setDataCheckOn((v) => !v)}
                scrapeCount={scrapeCount}
                onChangeScrapeCount={setScrapeCount}
                selectedHoverMetricKeys={selectedHoverMetricKeys}
                hoverMetricModes={hoverMetricModes}
              />
            </div>

            <div className="border-b border-[#c5c0b1] bg-[#fffdf9] px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 text-lg font-semibold">
                  <SocialPlatformLogo platform={selectedPlatform} className="h-5 w-5" />
                  {selectedPlatformLabel}
                </div>
                <div className="flex-1">
                  <div className="mx-auto hidden h-9 max-w-[520px] rounded-full border border-[#c5c0b1] bg-[#fffefb] sm:block" />
                </div>
                <div className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-4 py-1.5 text-sm text-[#36342e]">
                  登录
                </div>
              </div>
            </div>

            {openPostId !== null ? (
              // 点开帖子后，主内容区从博主九宫格切到抖音单帖详情页。
              <SinglePostPage onBack={closePost} />
            ) : (
              <FakeTiktokProfile
                creator={activeCreator}
                dataCheckOn={dataCheckOn}
                scrapeCount={scrapeCount}
                inlineDataKeys={inlineDataKeys}
                enabledBadgeCategories={enabledBadgeCategories}
                onOpenPost={handleSelectPost}
              />
            )}
          </div>

          {sidebarOpen ? (
            <SimilarSidebar
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={handleSelectProject}
              onQuickCreateProject={handleQuickCreateProject}
              onDeleteProject={handleRequestDeleteProject}
              selectedMode={selectedMode}
              onSelectMode={setSelectedMode}
              onRunSearch={runSearch}
              activeSidebarTab={activeSidebarTab}
              onSelectSidebarTab={setActiveSidebarTab}
              isSearching={isSearching}
              hasSearched={hasSearched}
              activeModeEta={activeMode.eta}
              activeResults={activeResults}
              searchProgress={searchProgress}
              creator={activeCreator}
              creatorTagsById={creatorTags}
              visibleCards={visibleCards}
              savedCreatorIds={savedCreatorIds}
              savedProjectCreators={savedProjectCreators}
              onOpenProfile={handleOpenProfile}
              onSaveCreator={handleSaveCreator}
              onDismissCreator={handleDismissCreator}
              onSeedCreator={handleSeedCreator}
              onQuickScreen={handleQuickScreen}
              onOpenSeedFinder={handleOpenSeedFinder}
              onAddCreatorTag={handleAddTag}
              onRemoveCreatorTag={handleRemoveTag}
              selectedEmailTemplate={selectedEmailTemplate}
              onSelectEmailTemplate={setSelectedEmailTemplate}
              emailDraft={emailDraft}
              onEmailDraftChange={setEmailDraft}
              onSendCurrent={handleSendCurrent}
              resultPopupOpen={resultPopupOpen}
              onEndSearch={handleEndSearch}
              onCardChange={(id) => setActiveCreatorId(id)}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
              expandedWidth={expandedSidebarWidth}
              isResizing={isSidebarResizing}
              onResizeStart={startSidebarResize}
              dataCheckOn={dataCheckOn}
              onToggleDataCheck={() => setDataCheckOn((v) => !v)}
              scrapeCount={scrapeCount}
              onChangeScrapeCount={setScrapeCount}
              inlineDataKeys={inlineDataKeys}
              onChangeInlineDataKeys={setInlineDataKeys}
              selectedPlatform={selectedPlatform}
              onChangePlatform={setSelectedPlatform}
              selectedHoverMetricKeys={selectedHoverMetricKeys}
              onChangeHoverMetricKeys={setSelectedHoverMetricKeys}
              hoverMetricModes={hoverMetricModes}
              onChangeHoverMetricModes={setHoverMetricModes}
              onRecordQuickSettingsChange={(message) => setFeedback(message)}
              enabledBadgeCategories={enabledBadgeCategories}
              onToggleBadgeCategory={toggleBadgeCategory}
              isSinglePostUnlocked={openPostId !== null}
              onLockedSinglePostClick={() =>
                setFeedback("先在浏览器里打开任意一个帖子，再使用「单帖 AI 分析」")
              }
            />
          ) : null}

          {resultPopupOpen ? (
            <SearchResultPopup
              total={activeResults.total}
              modeLabel={activeMode.label}
              onQuickScreen={handleQuickScreen}
              onSequentialScreen={handleSequentialScreen}
              onDelete={handleDeleteResultPopup}
              onClose={handleDeleteResultPopup}
              closeButtonRef={resultPopupCloseRef}
            />
          ) : null}

          {createProjectModalOpen ? (
            <CreateProjectModal
              closeButtonRef={createProjectCloseRef}
              projectName={newProjectName}
              onProjectNameChange={setNewProjectName}
              productDescription={newProjectProductDescription}
              onProductDescriptionChange={setNewProjectProductDescription}
              files={newProjectFiles}
              onFilesChange={setNewProjectFiles}
              onClose={closeCreateProjectModal}
              onSubmit={handleSubmitCreateProject}
            />
          ) : null}

          {deleteProjectId ? (
            <DeleteProjectConfirm
              projectName={projects.find((p) => p.id === deleteProjectId)?.name ?? ""}
              onCancel={handleCancelDeleteProject}
              onConfirm={handleConfirmDeleteProject}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function SideNavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", active ? "text-[#201515]" : "text-[#939084]")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{label}</span>
    </div>
  );
}

function HoverStat({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-[#36342e] transition-all duration-150 hover:border-[#c5c0b1] hover:bg-[#eceae3] hover:text-[#201515]">
      {children}
    </span>
  );
}

type VideoCategory = "viral" | "flop" | "paid" | "shop" | "normal";

type SyntheticVideo = {
  id: string;
  plays: number;
  likes: number;
  comments: number;
  erPct: number;
  days: number;
  hoursAgo: number;
  durationSec: number;
  speed: string;
  category: VideoCategory;
};

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SHOWCASE_CATEGORIES: VideoCategory[] = ["viral", "flop", "paid", "shop"];

function generateSyntheticVideos(creator: CreatorProfile, count: number): SyntheticVideo[] {
  const rand = mulberry32(hashString(creator.id));
  const speeds = ["0.8X", "1.2X", "1.4X", "1.6X", "1.8X", "1.9X", "2.2X", "2.3X"];
  const videos: SyntheticVideo[] = [];
  for (let i = 0; i < count; i += 1) {
    const showcase = SHOWCASE_CATEGORIES[i];
    let plays = Math.round((0.8 + rand() * 5.5) * 1_000_000);
    if (showcase === "viral") {
      plays = Math.round(12 * 1_000_000);
    } else if (showcase === "flop") {
      plays = Math.round(0.25 * 1_000_000);
    }
    const erPct = Math.round((3 + rand() * 7) * 10) / 10;
    const likes = Math.round(plays * (erPct / 100) * (0.55 + rand() * 0.35));
    const comments = Math.round(likes * (0.01 + rand() * 0.06));
    const days = 3 + Math.floor(rand() * 7);
    const hoursAgo = 1 + Math.floor(rand() * 72);
    const durationSec = 8 + Math.floor(rand() * 85);
    const speed = speeds[Math.floor(rand() * speeds.length)];
    const catRoll = rand();
    const rolledCategory: VideoCategory =
      catRoll < 0.16
        ? "viral"
        : catRoll < 0.32
          ? "flop"
          : catRoll < 0.44
            ? "paid"
            : catRoll < 0.56
              ? "shop"
              : "normal";
    const category: VideoCategory = showcase ?? rolledCategory;
    videos.push({
      id: `${creator.id}-v${i}`,
      plays,
      likes,
      comments,
      erPct,
      days,
      hoursAgo,
      durationSec,
      speed,
      category,
    });
  }
  return videos;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function FakeTiktokProfile({
  creator,
  dataCheckOn,
  scrapeCount,
  inlineDataKeys,
  enabledBadgeCategories,
  onOpenPost,
}: {
  creator: CreatorProfile;
  dataCheckOn: boolean;
  scrapeCount: number;
  inlineDataKeys: InlineDataKey[];
  enabledBadgeCategories: ReadonlySet<TiktokVideoCategory>;
  // 点击任意一条帖子的回调 —— 主内容区切到抖音单帖详情页，侧边栏弹到「单帖 AI 分析」。
  onOpenPost: (videoId: string) => void;
}) {
  const viralThreshold = DEFAULT_VIRAL_RATIO_THRESHOLD;
  const flopThreshold = DEFAULT_FLOP_RATIO_THRESHOLD;
  const allVideos = generateSyntheticVideos(creator, Math.max(18, scrapeCount));
  const averagePlays =
    allVideos.reduce((sum, video) => sum + video.plays, 0) / Math.max(allVideos.length, 1);
  const medianPlays = getMedianNumber(allVideos.map((video) => video.plays));
  const hasInlineData = (key: InlineDataKey) => inlineDataKeys.includes(key);
  const getPlayMedianRatio = (video: SyntheticVideo) =>
    medianPlays > 0 ? video.plays / medianPlays : 1;
  // Rank by plays descending while using the creator's average plays as the comparison baseline.
  const rankedByPlays = [...allVideos].sort((a, b) => b.plays - a.plays);
  const rankMap = new Map<string, number>(rankedByPlays.map((v, i) => [v.id, i + 1]));
  // Display in rank order (top N by play count vs. average)
  const displayVideos = rankedByPlays.slice(0, scrapeCount);
  const totalPlaysNumber = parseMetricToNumber(creator.totalPlays ?? creator.followers ?? "0");
  const creatorErNumber = parseFloat(creator.er.replace("%", "")) || 0;

  return (
    <section className="mx-auto max-w-[980px] px-4 pt-6 pb-10 sm:px-8">
      <div className="flex items-start gap-8">
        <CreatorAvatarWithHover
          creator={creator}
          className="h-18 w-18 border border-[#c5c0b1]"
          labelClassName="text-3xl"
        />
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-semibold break-words">{creator.handle}</div>
          <div className="mt-1 text-sm break-words text-[#36342e]">{creator.name}</div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#36342e]">
            <HoverStat>{creator.followers} 粉丝</HoverStat>
            <HoverStat>{creator.likes} 获赞</HoverStat>
            <HoverStat>{creator.videos} 视频</HoverStat>
            <HoverStat>ER {creator.er}</HoverStat>
          </div>
          <div className="mt-3 max-w-2xl text-sm leading-6 break-words text-[#36342e]">
            {creator.bio}
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              unstyled
              className="rounded-[8px] bg-[#ff4f00] px-6 py-2 text-sm font-medium text-[#fffdf9] transition-colors hover:bg-[#ff4f00]"
            >
              关注
            </Button>
            <Button
              unstyled
              className="rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-6 py-2 text-sm font-medium text-[#36342e] transition-colors hover:bg-[#eceae3]"
            >
              发消息
            </Button>
          </div>
        </div>
      </div>

      {dataCheckOn ? (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#c5c0b1] bg-[#fff7f4] px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#ff4f00]" />
              <span className="font-semibold text-[#201515]">数据透视模式已开启</span>
              <span className="text-[#36342e]">· 按平均播放量排序前 {scrapeCount} 条</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#201515]">
              {hasInlineData("plays") ? (
                <>
                  <span className="rounded-full bg-[#fffefb]/70 px-2.5 py-1">
                    总播放 <span className="font-semibold">{formatPlays(totalPlaysNumber)}</span>
                  </span>
                  <span className="rounded-full bg-[#fffefb]/70 px-2.5 py-1">
                    平均播放 <span className="font-semibold">{formatPlays(averagePlays)}</span>
                  </span>
                </>
              ) : null}
              {hasInlineData("engagement") ? (
                <span className="rounded-full bg-[#fffefb]/70 px-2.5 py-1">
                  互动率 <span className="font-semibold">{creatorErNumber.toFixed(1)}%</span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayVideos.map((video) => {
              const rank = rankMap.get(video.id) ?? 0;
              const playMedianRatio = getPlayMedianRatio(video);
              return (
                <Button
                  unstyled
                  type="button"
                  key={video.id}
                  onClick={() => onOpenPost(video.id)}
                  title="点击打开单帖 AI 分析"
                  className="relative block aspect-[3/4] w-full overflow-hidden rounded-[8px] bg-[linear-gradient(180deg,#939084_0%,#36342e_55%,#36342e_100%)] text-left text-[#fffefb] transition-transform duration-150 hover:-translate-y-0.5"
                >
                  {/* top row: speed + duration */}
                  <div className="absolute top-0 right-0 left-0 flex items-start justify-between px-3 pt-2.5 text-[11px] font-semibold opacity-95">
                    <span>{playMedianRatio.toFixed(1)}X</span>
                    <span>{formatDuration(video.durationSec)}</span>
                  </div>
                  {/* days */}
                  {hasInlineData("publishedAt") ? (
                    <div className="absolute top-7 right-0 left-0 text-center text-[11px] opacity-85">
                      {video.days} days
                    </div>
                  ) : null}
                  {/* center: rank + plays */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[20px] font-semibold tracking-tight text-[#fffefb]/80">
                      #{rank}
                    </div>
                    {hasInlineData("plays") ? (
                      <div className="mt-1 text-[30px] leading-none font-bold tracking-tight">
                        {formatPlays(video.plays)}
                      </div>
                    ) : null}
                  </div>
                  {/* bottom: ER + stats */}
                  <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                    {hasInlineData("engagement") ? (
                      <div className="text-[11px] font-semibold opacity-95">
                        ER <span className="text-[#fffefb]">{video.erPct.toFixed(1)}%</span>
                      </div>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2 text-[10.5px] opacity-95">
                      {hasInlineData("plays") ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Play className="h-2.5 w-2.5" fill="currentColor" />
                          {formatPlays(video.plays)}
                        </span>
                      ) : null}
                      {hasInlineData("likes") ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Heart className="h-2.5 w-2.5" />
                          {formatLikes(video.likes)}
                        </span>
                      ) : null}
                      {hasInlineData("comments") ? (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageCircle className="h-2.5 w-2.5" />
                          {formatComments(video.comments)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {allVideos.slice(0, 9).map((video) => {
            const ratio = getPlayMedianRatio(video);
            const autoCategory: VideoCategory =
              video.category === "paid"
                ? "paid"
                : video.category === "shop"
                  ? "shop"
                  : ratio >= viralThreshold
                    ? "viral"
                    : ratio <= flopThreshold
                      ? "flop"
                      : "normal";
            return (
              <Button
                unstyled
                type="button"
                key={video.id}
                onClick={() => onOpenPost(video.id)}
                title="点击打开单帖 AI 分析"
                className="relative block w-full rounded-[8px] text-left transition-transform"
              >
                <TiktokVideoTile
                  videoId={video.id}
                  category={autoCategory}
                  ratio={ratio}
                  durationSec={video.durationSec}
                  ageLabel={`${video.hoursAgo} hours`}
                  erPct={video.erPct}
                  plays={video.plays}
                  likes={video.likes}
                  comments={video.comments}
                  viralThreshold={viralThreshold}
                  flopThreshold={flopThreshold}
                  enabledCategories={enabledBadgeCategories}
                />
              </Button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FloatingPluginGroup({
  demoStage,
  cardCloseRef,
  onOpenCard,
  onOpenCurrentSidebar,
  onOpenEmailSidebar,
  onOpenSimilarSidebar,
  onClose,
  onDragStart,
  compactViewport,
  creator,
  reviewFlow,
  sequentialIndex,
  sequentialTotal,
  isSaved,
  onToggleSave,
  tags,
  onAddTag,
  onRemoveTag,
  workMode,
  onToggleWorkMode,
  onSetWorkMode,
  onOpenTaskList,
  dataCheckOn,
  onToggleDataCheck,
  scrapeCount,
  onChangeScrapeCount,
  selectedHoverMetricKeys,
  hoverMetricModes,
}: {
  demoStage: DemoStage;
  cardCloseRef: React.RefObject<HTMLButtonElement | null>;
  onOpenCard: () => void;
  onOpenCurrentSidebar: () => void;
  onOpenEmailSidebar: () => void;
  onOpenSimilarSidebar: () => void;
  onClose: () => void;
  onDragStart: (clientX: number, clientY: number) => void;
  compactViewport: boolean;
  creator: CreatorProfile;
  reviewFlow: ReviewFlow;
  sequentialIndex: number;
  sequentialTotal: number;
  isSaved: boolean;
  onToggleSave: () => void;
  tags: string[];
  onAddTag: (label: string) => void;
  onRemoveTag: (label: string) => void;
  workMode: "on" | "off";
  onToggleWorkMode: () => void;
  onSetWorkMode: (mode: "on" | "off") => void;
  onOpenTaskList: () => void;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
}) {
  const [hoverCardOpen, setHoverCardOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragIntentRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const isOff = workMode === "off";

  const closeFloatingUi = () => {
    setHoverCardOpen(false);
  };

  const openHoverCard = () => {
    if (isOff || demoStage === "card") {
      return;
    }
    setHoverCardOpen(true);
  };

  useEffect(() => {
    if (isOff || demoStage === "card") {
      setHoverCardOpen(false);
    }
  }, [demoStage, isOff]);

  return (
    <div className="relative" onMouseEnter={openHoverCard}>
      {(demoStage === "card" || hoverCardOpen) && !isOff ? (
        <FloatingCard
          closeButtonRef={cardCloseRef}
          onOpenCurrentSidebar={() => {
            setHoverCardOpen(false);
            onOpenCurrentSidebar();
          }}
          onOpenEmailSidebar={() => {
            setHoverCardOpen(false);
            onOpenEmailSidebar();
          }}
          onOpenSimilarSidebar={() => {
            setHoverCardOpen(false);
            onOpenSimilarSidebar();
          }}
          onClose={() => {
            setHoverCardOpen(false);
            onClose();
          }}
          onDragStart={onDragStart}
          compactViewport={compactViewport}
          creator={creator}
          reviewFlow={reviewFlow}
          sequentialIndex={sequentialIndex}
          sequentialTotal={sequentialTotal}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          tags={tags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onSetWorkMode={onSetWorkMode}
          onOpenTaskList={onOpenTaskList}
          dataCheckOn={dataCheckOn}
          onToggleDataCheck={onToggleDataCheck}
          scrapeCount={scrapeCount}
          onChangeScrapeCount={onChangeScrapeCount}
          selectedHoverMetricKeys={selectedHoverMetricKeys}
          hoverMetricModes={hoverMetricModes}
        />
      ) : null}

      <div className="absolute top-1/2 right-0 z-30 flex -translate-y-1/2 items-center">
        <div className="relative">
          <Button
            unstyled
            ref={buttonRef}
            type="button"
            aria-label={isOff ? "Linkr 下班模式，点击恢复上班模式" : "打开信息卡片"}
            onFocus={() => {
              if (isOff || demoStage === "card") return;
              setHoverCardOpen(true);
            }}
            onClick={() => {
              if (isOff) {
                onToggleWorkMode();
                return;
              }
              if (demoStage === "card") return;
              onOpenCard();
            }}
            onPointerDown={(event) => {
              // Release implicit pointer capture so window-level pointermove fires during drag.
              if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              suppressClickRef.current = false;
              dragIntentRef.current = {
                startX: event.clientX,
                startY: event.clientY,
                moved: false,
              };
              onDragStart(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              const intent = dragIntentRef.current;
              if (
                intent &&
                !intent.moved &&
                Math.hypot(event.clientX - intent.startX, event.clientY - intent.startY) > 4
              ) {
                intent.moved = true;
                suppressClickRef.current = true;
                closeFloatingUi();
              }
            }}
            onPointerUp={() => {
              dragIntentRef.current = null;
            }}
            onPointerCancel={() => {
              dragIntentRef.current = null;
            }}
            onClickCapture={(event) => {
              // Suppress click that immediately follows a drag.
              if (suppressClickRef.current) {
                event.preventDefault();
                event.stopPropagation();
              }
              suppressClickRef.current = false;
            }}
            className={cn(
              "relative flex h-10 w-10 cursor-grab touch-none items-center justify-center transition-all duration-150 hover:scale-[1.04] active:cursor-grabbing",
              isOff && "opacity-55 grayscale",
            )}
          >
            <Image
              src="/linkr-logo.png"
              alt="Linkr 插件入口"
              fill
              sizes="40px"
              className="object-contain"
            />
            {isOff ? (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -bottom-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#fffefb] bg-slate-700 text-[#fffefb]"
              >
                <Moon className="h-2.5 w-2.5" />
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FloatingCard({
  closeButtonRef,
  onOpenCurrentSidebar,
  onOpenEmailSidebar,
  onOpenSimilarSidebar,
  onClose,
  onDragStart,
  compactViewport,
  creator,
  reviewFlow,
  sequentialIndex,
  sequentialTotal,
  isSaved,
  onToggleSave,
  tags,
  onAddTag,
  onRemoveTag,
  onSetWorkMode,
  onOpenTaskList,
  dataCheckOn,
  onToggleDataCheck,
  scrapeCount,
  onChangeScrapeCount,
  selectedHoverMetricKeys,
  hoverMetricModes,
}: {
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onOpenCurrentSidebar: () => void;
  onOpenEmailSidebar: () => void;
  onOpenSimilarSidebar: () => void;
  onClose: () => void;
  onDragStart: (clientX: number, clientY: number) => void;
  compactViewport: boolean;
  creator: CreatorProfile;
  reviewFlow: ReviewFlow;
  sequentialIndex: number;
  sequentialTotal: number;
  isSaved: boolean;
  onToggleSave: () => void;
  tags: string[];
  onAddTag: (label: string) => void;
  onRemoveTag: (label: string) => void;
  onSetWorkMode: (mode: "on" | "off") => void;
  onOpenTaskList: () => void;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
}) {
  const [scrapeMenuOpen, setScrapeMenuOpen] = useState(false);
  const contactEmail = getCreatorContactEmail(creator);
  const creatorLocation = getCreatorLocation(creator);
  const creatorMetrics = getCreatorMetricSnapshot(creator, scrapeCount);
  const creatorCpm = creatorMetrics.cpm;
  const displayEmail = contactEmail ?? "";
  const hasEmail = Boolean(displayEmail);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="当前博主速览小窗"
      // Outer shell — 14px Social radius (DESIGN.md §5 scale), sand border,
      // paper-lift shadow.
      // The shadow is the deliberate exception to §6 "borders, not shadows"
      // recorded for the floating-creator-card surface.
      className={cn(
        "absolute top-1/2 z-20 -translate-y-1/2 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb]/98 text-[#201515] shadow-[0_28px_80px_-34px_rgba(77,76,72,0.22)] backdrop-blur",
        compactViewport
          ? "right-[42px] w-[min(258px,calc(100vw-164px))] max-w-[258px]"
          : "right-[52px] w-[min(314px,calc(100vw-120px))] max-w-[314px]",
      )}
    >
      <div
        className="flex cursor-grab touch-none justify-center pt-1 pb-0.5 select-none active:cursor-grabbing"
        onPointerDown={(event) => {
          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          onDragStart(event.clientX, event.clientY);
        }}
      >
        <span aria-hidden="true" className="block h-1.5 w-11 rounded-full bg-[#ddd8ce]" />
      </div>

      <div className="px-2.5 pt-0.5 pb-2">
        {reviewFlow === "sequential" && sequentialTotal > 0 ? (
          <div className="mb-2 rounded-[8px] bg-[#eceae3] px-3 py-1.5 text-center text-[11px] text-[#939084]">
            逐个筛选中：第 {Math.max(sequentialIndex + 1, 1)} / {sequentialTotal} 位
          </div>
        ) : null}

        <div className="space-y-2">
          {/* Window chrome row — ExternalLink + Moon LEFT, X RIGHT. All three
              are Ghost—Window-level (§6.5.3): 30×30, no border, no bg, so
              chrome recedes behind content actions. */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <div className="group relative">
                <Button
                  unstyled
                  type="button"
                  aria-label="跳转到 web 页面"
                  onClick={onOpenTaskList}
                  className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md text-[#5f5e5a] transition-colors hover:bg-[#eceae3] hover:text-[#36342e]"
                >
                  <ExternalLink className="h-4 w-4" strokeWidth={2} />
                </Button>
                <span className="pointer-events-none absolute top-full left-0 z-30 mt-1.5 rounded-[8px] bg-[#201515] px-2.5 py-1 text-[10px] whitespace-nowrap text-[#fffefb] opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  跳转到 web 端任务页
                </span>
              </div>

              <div className="group relative">
                <Button
                  unstyled
                  type="button"
                  aria-label="打开下班模式"
                  onClick={() => onSetWorkMode("off")}
                  className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-md text-[#5f5e5a] transition-colors hover:bg-[#eceae3] hover:text-[#36342e]"
                >
                  <Moon className="h-4 w-4" strokeWidth={2} />
                </Button>
                <span className="pointer-events-none absolute top-full left-0 z-30 mt-1.5 w-44 rounded-[8px] bg-[#201515] px-2.5 py-2 text-[10px] leading-4 text-[#fffefb] opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  打开下班模式后，插件将关闭。点击悬浮球可恢复上班模式。
                </span>
              </div>
            </div>

            <Button
              unstyled
              type="button"
              ref={closeButtonRef}
              aria-label="关闭小窗"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md text-[#5f5e5a] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>

          {/* Unified creator identity strip — shared across all four plugin
              surfaces (analysis page / similar search / per-candidate review /
              floating card). See CreatorProfileHeader for the spec. */}
          <CreatorProfileHeader
            name={creator.name}
            handle={creator.handle}
            flag={creatorLocation.flag}
            country={creatorLocation.country}
            creatorType={getCreatorType(creator)}
            email={displayEmail}
            hasEmail={hasEmail}
            onOpenEmailSidebar={onOpenEmailSidebar}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
            tags={tags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />

          {/* Settings strip — Light Sand standalone pill (no outer border).
              Sample-count dropdown · CPM (inline help) · 数据透视 toggle.
              Detached from the metrics grid below per the floating
              creator-card reference (cleaner row hierarchy). */}
          <div className="flex items-center justify-between gap-2 rounded-lg bg-[#eceae3] px-3 py-1.5">
            <div className={cn("flex items-center", compactViewport ? "gap-1" : "gap-1.5")}>
              <div className="relative">
                <Button
                  unstyled
                  type="button"
                  onClick={() => setScrapeMenuOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={scrapeMenuOpen}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md font-semibold text-[#36342e] transition-colors hover:bg-[#dfdcd1]",
                    compactViewport ? "px-1.5 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[12px]",
                  )}
                >
                  <span>近 {scrapeCount} 条</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-[#939084] transition-transform",
                      scrapeMenuOpen && "rotate-180",
                    )}
                  />
                </Button>
                {scrapeMenuOpen ? (
                  <div
                    role="listbox"
                    className="absolute top-full left-0 z-30 mt-1 w-[108px] overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] shadow-[0_16px_40px_-20px_rgba(77,76,72,0.25)]"
                  >
                    {SCRAPE_COUNT_OPTIONS.map((opt) => (
                      <Button
                        unstyled
                        key={opt}
                        type="button"
                        role="option"
                        aria-selected={opt === scrapeCount}
                        onClick={() => {
                          onChangeScrapeCount(opt);
                          setScrapeMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[#eceae3]",
                          opt === scrapeCount ? "font-semibold text-[#ff4f00]" : "text-[#36342e]",
                        )}
                      >
                        <span>近 {opt} 条</span>
                        {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>

              <span className="group/cpm relative inline-flex shrink-0 items-center gap-1 text-[#939084]">
                <span aria-hidden="true">·</span>
                <span
                  aria-label={`CPM ${creatorCpm}，悬浮查看说明`}
                  className={cn(
                    "cursor-help font-medium",
                    compactViewport ? "text-[10px]" : "text-[11px]",
                  )}
                >
                  CPM {creatorCpm}
                </span>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute top-full left-1/2 z-40 mt-1.5 w-60 -translate-x-1/2 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-2 text-[11px] leading-[1.55] text-[#36342e] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/cpm:opacity-100"
                >
                  系统检测该博主位于{creatorLocation.country}，当前该地区默认 CPM 为 {creatorCpm}
                  。如需修改，请前往设置页面自行调整。
                </span>
              </span>
            </div>

            <div
              className={cn("flex shrink-0 items-center", compactViewport ? "gap-0.5" : "gap-1")}
            >
              <div
                className={cn(
                  "flex items-center font-medium text-[#939084]",
                  compactViewport ? "gap-0.5 text-[10px]" : "gap-1 text-[11px]",
                )}
              >
                <span>数据透视</span>
                <span className="group/tip relative inline-flex">
                  <CircleHelp className="h-3 w-3 cursor-help text-[#b8b6ad] transition-colors hover:text-[#939084]" />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute top-full right-0 z-40 mt-1.5 w-56 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-2 text-[11px] leading-[1.55] text-[#36342e] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/tip:opacity-100"
                  >
                    在当前页面开启数据透视后，会叠加播放量、平均播放与互动率数据，并按平均播放量排序前
                    N 条视频。若取数异常，刷新网页即可。
                  </span>
                </span>
              </div>
              <Toggle
                checked={dataCheckOn}
                onCheckedChange={onToggleDataCheck}
                size="sm"
                aria-label="数据透视开关"
              />
            </div>
          </div>

          {/* Metrics grid — 2×2 Solid Tile (§6.5.2 Variant 2). Independent
              cells, no border, gap-2. Which 4 keys are shown is still driven
              by `selectedHoverMetricKeys` (parent-controlled customisation),
              icons removed per reference. */}
          <div className="grid grid-cols-2 gap-2">
            {(selectedHoverMetricKeys.length ? selectedHoverMetricKeys : DEFAULT_HOVER_METRICS).map(
              (key) => {
                if (key === "rate") {
                  return (
                    <FloatingStatCell key={key} label="预估报价" value={creatorMetrics.rate} />
                  );
                }
                if (key === "likes") {
                  return (
                    <FloatingStatCell
                      key={key}
                      label={hoverMetricModes.likes === "median" ? "中位点赞" : "平均点赞"}
                      value={
                        hoverMetricModes.likes === "median"
                          ? creatorMetrics.medianLikes
                          : formatLikes(parseMetricToNumber(creator.likes) * 1.08)
                      }
                    />
                  );
                }
                if (key === "plays") {
                  return (
                    <FloatingStatCell
                      key={key}
                      label={
                        (hoverMetricModes.plays ?? "median") === "median"
                          ? "中位观看量"
                          : "平均观看量"
                      }
                      value={
                        (hoverMetricModes.plays ?? "median") === "median"
                          ? creatorMetrics.medianPlays
                          : creatorMetrics.averagePlays
                      }
                    />
                  );
                }
                if (key === "comments") {
                  return (
                    <FloatingStatCell
                      key={key}
                      label={hoverMetricModes.comments === "median" ? "中位评论" : "平均评论"}
                      value={
                        hoverMetricModes.comments === "median"
                          ? creatorMetrics.medianComments
                          : formatComments(
                              parseMetricToNumber(creatorMetrics.medianComments) * 1.16,
                            )
                      }
                    />
                  );
                }
                return (
                  <FloatingStatCell
                    key={key}
                    label="互动率"
                    value={creatorMetrics.engagementRate}
                  />
                );
              },
            )}
          </div>

          {/* Bottom CTA row — 博主分析 (secondary outlined) + 找相似 (primary
              orange flat fill, the one CTA where Linkr Orange is appropriate
              per §7 Do/Don't). */}
          <div className="flex items-stretch gap-2">
            <Button
              unstyled
              type="button"
              onClick={onOpenCurrentSidebar}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-2 text-[13px] font-semibold text-[#201515] transition-colors hover:bg-[#eceae3] active:scale-[0.98]"
            >
              <FileText className="h-4 w-4 shrink-0 text-[#939084]" />
              博主分析
            </Button>
            <Button
              unstyled
              type="button"
              aria-label="找相似"
              onClick={onOpenSimilarSidebar}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#ff4f00] bg-[#ff4f00] px-3 py-2 text-[13px] font-semibold text-[#fffefb] transition-colors hover:bg-[#e54600] active:scale-[0.98]"
            >
              <Search className="h-4 w-4 shrink-0" />
              找相似
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// §6.5.2 Variant 2 Solid Tile — independent metric cells inside the floating
// card. No border, no shadow; visual separation comes from the bg color delta
// between the cream card and the Light Sand tile, plus an 8px gap between
// tiles. Icons intentionally absent per the floating-creator-card reference.
function FloatingStatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-[#eceae3] px-2 py-2 text-center">
      <div className="text-[11px] leading-[1.3] font-medium text-[#939084]">{label}</div>
      <div className="mt-1 text-[16px] leading-[1.2] font-semibold tracking-tight text-[#201515]">
        {value}
      </div>
    </div>
  );
}
