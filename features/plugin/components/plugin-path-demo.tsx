"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  Eye,
  CircleHelp,
  Download,
  DollarSign,
  ExternalLink,
  FileText,
  FolderOpen,
  Hash,
  Heart,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Paperclip,
  Sparkles,
  Play,
  Pencil,
  Search,
  Plus,
  Send,
  CalendarClock,
  Clock3,
  ThumbsUp,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SimilarCardCarousel } from "@/features/plugin/components/similar-card-carousel";
import { SimilarSearchModule } from "@/features/plugin/components/similar-search-module";
import { SocialPlatformLogo } from "@/features/plugin/components/social-platform-logo";
import { SideNavItem } from "@/features/plugin/components/side-nav-item";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { SidebarAnalysisSparkleIcon } from "@/features/plugin/components/sparkle-icon";
import { AudienceBar } from "@/features/plugin/components/audience-bar";
import {
  MetricCard,
  SidebarMetric,
  SidebarMetricCenter,
  SidebarMetricInline,
} from "@/features/plugin/components/sidebar-metrics";
import { HighlightedEmailPreview } from "@/features/plugin/components/highlighted-email-preview";
import { SidebarContentTabButton } from "@/features/plugin/components/sidebar-content-tab-button";
import { AudienceHighlightBar } from "@/features/plugin/components/audience-highlight-bar";
import { SidebarAction } from "@/features/plugin/components/sidebar-action";
import { SidebarCollapsibleSection } from "@/features/plugin/components/sidebar-collapsible-section";
import { DeleteProjectConfirm } from "@/features/plugin/components/delete-project-confirm";
import { SearchResultPopup } from "@/features/plugin/components/search-result-popup";
import { SidebarProjectSelector } from "@/features/plugin/components/sidebar-project-selector";
import { SidebarCreatorProfileCard } from "@/features/plugin/components/sidebar-creator-profile-card";
import { TopicWordCloud } from "@/features/plugin/components/topic-word-cloud";
import { CreatorTopicSummaryRow } from "@/features/plugin/components/creator-topic-summary-row";
import { FakeTiktokProfile } from "@/features/plugin/components/fake-tiktok-profile";
import { EmailReviewModal } from "@/features/plugin/components/email-review-modal";
import { CreateProjectModal } from "@/features/plugin/components/create-project-modal";
import { QuickSettingsPanel } from "@/features/plugin/components/quick-settings-panel";
import { FloatingPluginGroup } from "@/features/plugin/components/floating-plugin-group";
import { SimilarSidebarNavRail } from "@/features/plugin/components/similar-sidebar-nav-rail";
import {
  formatComments,
  formatLikes,
  formatPlays,
  parseMetricToNumber,
} from "@/features/plugin/lib/synthetic";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_MIN_WIDTH,
  buildQuickProjectName,
  clampValue,
  createEmptyProjectScopedState,
  focusWithoutScroll,
  formatFileSize,
  formatScheduleLabel,
  getDefaultScheduleAt,
  getMedianNumber,
  getSidebarWidthBounds,
  mapFollowersLabelToDiscoveryPreset,
  sortProjectsNewestFirst,
} from "@/features/plugin/lib/format";
import {
  computeAudienceHighlights,
  getAudienceSummary,
  getCreatorAudienceBreakdown,
  getCreatorAveragePlays,
  getCreatorCpm,
  getCreatorDiagnostics,
  getCreatorEmail,
  getCreatorLocation,
  getCreatorMedianComments,
  getCreatorMedianPlays,
  getCreatorMetricSnapshot,
  getCreatorReview,
  getCreatorType,
} from "@/features/plugin/lib/creator-helpers";
import {
  buildQuickScreenDiscoveryUrl,
  buildSeedFinderDiscoveryUrl,
} from "@/features/plugin/lib/discovery-url";
import {
  getEmailTemplateDraft,
  getEmailTemplateSegments,
  getEmailTemplateSubject,
} from "@/features/plugin/lib/email";
import type {
  AudienceHighlight,
  AudienceRegion,
  AudienceSummary,
  CreatorProfile,
  CurrentDetailTab,
  DemoStage,
  EmailSendOptions,
  EmailTemplateKey,
  EmailTemplateMeta,
  EmailTemplateSegment,
  HoverMetricKey,
  InlineDataKey,
  MetricAggregation,
  ProjectScopedState,
  ProjectSummary,
  RegionTierKey,
  ReviewFlow,
  SearchModeKey,
  SidebarTab,
  SocialPlatformKey,
  TagTone,
} from "@/features/plugin/types";
import { searchModes } from "@/features/plugin/data/search-modes";
import { emailTemplates } from "@/features/plugin/data/email-templates";
import {
  COUNTRY_TO_FLAG,
  FLAG_TO_DISCOVERY_COUNTRY,
  LOCALE_REGION_TO_COUNTRY,
} from "@/features/plugin/data/countries";
import {
  PROJECTS_STORAGE_KEY,
  PROJECT_SCOPED_STATE_KEY,
  SELECTED_PROJECT_STORAGE_KEY,
  defaultProjectScopedState,
  defaultProjects,
  noteTagPresets,
  tagToneOrder,
} from "@/features/plugin/data/projects";
import { creatorProfiles } from "@/features/plugin/data/creator-profiles";
import { searchResults } from "@/features/plugin/data/search-results";
import {
  SIDEBAR_CARD_RADIUS,
  SIDEBAR_METRIC_RADIUS,
  SIDEBAR_PANEL_CARD_CLASSES,
  SIDEBAR_SECTION_CARD_CLASSES,
} from "@/features/plugin/lib/style-constants";
import {
  DEFAULT_HOVER_METRIC_MODES,
  DEFAULT_HOVER_METRICS,
  DEFAULT_INLINE_DATA_KEYS,
  SCRAPE_COUNT_OPTIONS,
  SOCIAL_PLATFORM_OPTIONS,
} from "@/features/plugin/data/sidebar-config";

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
  const [playMedianMultiple, setPlayMedianMultiple] = useState(1.5);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatformKey>("tiktok");
  const [selectedHoverMetricKeys, setSelectedHoverMetricKeys] = useState<HoverMetricKey[]>(DEFAULT_HOVER_METRICS);
  const [hoverMetricModes, setHoverMetricModes] = useState<Record<HoverMetricKey, MetricAggregation>>(
    DEFAULT_HOVER_METRIC_MODES
  );
  const [floatingTop, setFloatingTop] = useState(216);
  const [floatingOffsetX, setFloatingOffsetX] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_MIN_WIDTH);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectProductDescription, setNewProjectProductDescription] = useState("");
  const [newProjectFiles, setNewProjectFiles] = useState<File[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>(sortProjectsNewestFirst(defaultProjects));
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    sortProjectsNewestFirst(defaultProjects)[0]?.id ?? ""
  );
  const [projectScopedState, setProjectScopedState] = useState<Record<string, ProjectScopedState>>(
    defaultProjectScopedState
  );
  const [activeCreatorId, setActiveCreatorId] = useState("camping-aurora");
  const [sequentialCreatorIds, setSequentialCreatorIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [compactViewport, setCompactViewport] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("current");
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
    sidebarWidthBounds.max
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
        sidebarWidthBounds.max
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
        120
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
    [savedCreatorIds]
  );
  const dismissedCreatorIds = activeProjectState.dismissedCreatorIds;
  const creatorTags = activeProjectState.creatorTags;
  const activeResults = searchResults[selectedMode];
  const activeCreator = creatorProfiles[activeCreatorId];
  const visibleCards = activeResults.cards.filter(
    (card) => !dismissedCreatorIds.includes(card.id) && !savedCreatorIds.includes(card.id)
  );
  const sequentialPosition = sequentialCreatorIds.findIndex((id) => id === activeCreatorId);

  useEffect(() => {
    if (selectedEmailTemplate) {
      setEmailDraft(
        getEmailTemplateDraft(
          selectedEmailTemplate,
          creatorProfiles[activeCreatorId],
          selectedProject
        )
      );
    }
  }, [activeCreatorId, selectedEmailTemplate, selectedProject]);

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
              typeof value.createdLabel === "string"
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
    updater: (current: ProjectScopedState) => ProjectScopedState
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

    const now = new Date();
    const nextProject: ProjectSummary = {
      id: `project-${now.getTime()}`,
      name: projectName,
      productDescription,
      createdAt: now.toISOString(),
      createdLabel: "刚刚创建",
      uploadedListNames: newProjectFiles.map((file) => file.name),
    };

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
        : `已新建项目「${nextProject.name}」`
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
      const timer = window.setTimeout(() => {
        setSearchProgress(value);
      }, 220 + index * 260);
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
        : `已在项目「${selectedProject.name}」收藏 ${creatorHandle}`
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
        return activeResults.cards
          .map((card) => card.id)
          .filter((id) => restoredIds.has(id));
      });
      setFeedback(`已在项目「${selectedProject.name}」取消 No，恢复 ${creatorHandle}`);
      return;
    }

    const currentIndex = sequentialCreatorIds.findIndex((id) => id === creatorId);
    const nextCreatorId =
      currentIndex >= 0
        ? sequentialCreatorIds[currentIndex + 1] ?? sequentialCreatorIds[currentIndex - 1]
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
        : `已在项目「${selectedProject.name}」对 ${creatorHandle} 标记 No`
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
    setFeedback(`已在项目「${selectedProject.name}」里切换 ${creatorProfiles[creatorId]?.handle} 为种子博主`);
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
      `已切换到项目「${selectedProject.name}」的逐个筛选，当前查看 ${creatorProfiles[firstCreatorId]?.handle}`
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
      setFeedback(`已在项目「${selectedProject.name}」添加标签 ${normalizedLabel}`);
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

  const handleNextSequentialCreator = () => {
    if (sequentialPosition < 0 || sequentialPosition >= sequentialCreatorIds.length - 1) {
      setFeedback("当前已经是最后一位，可回到侧边栏重新搜索。");
      return;
    }

    const nextCreatorId = sequentialCreatorIds[sequentialPosition + 1];
    setActiveCreatorId(nextCreatorId);
    setFeedback(`继续查看 ${creatorProfiles[nextCreatorId]?.handle}`);
  };

  const handleSendCurrent = (templateLabel: string, draft: string, options: EmailSendOptions) => {
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

    const recipientLabel =
      recipientCreators.length === 1
        ? recipientCreators[0].handle
        : `${recipientCreators[0].handle} 等 ${recipientCreators.length} 位博主`;

    setFeedback(
      `${suffix}：项目「${selectedProject.name}」向 ${recipientLabel} 发送「${templateLabel}」邮件${attachmentText}（演示）`
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
  };

  return (
    <main className="min-h-screen bg-[#f5f4ed] text-[#141413]">
      <div className="absolute left-4 top-4 z-40 sm:left-6 sm:top-6">
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[#e8e6dc] bg-white text-[#4d4c48] hover:bg-[#f5f4ed]"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>

      {feedback ? (
        <div className="absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] shadow-[0_12px_32px_-18px_rgba(77,76,72,0.28)]">
          {feedback}
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <aside className="hidden w-[92px] shrink-0 border-r border-[#e8e6dc] bg-[#f5f4ed] xl:flex xl:flex-col xl:justify-between">
          <div className="px-4 pt-6">
            <div className="space-y-5 text-xs text-[#87867f]">
              <SideNavItem label="首页" active />
              <SideNavItem label="搜索" />
              <SideNavItem label="Following" />
              <SideNavItem label="LIVE" />
              <SideNavItem label="个人" />
            </div>
          </div>
          <div className="px-4 pb-6 text-xs text-[#87867f]">{selectedPlatformLabel}</div>
        </aside>

        <div className="relative flex-1">
          <div
            className={cn(
              "transition-[padding-right] duration-300",
              isSidebarResizing && "transition-none"
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
              onSeedCreator={() => handleSeedCreator(activeCreator.id)}
              isSaved={savedCreatorIds.includes(activeCreator.id)}
              onToggleSave={() => handleSaveCreator(activeCreator.id)}
              workMode={workMode}
              onToggleWorkMode={handleToggleWorkMode}
              onSetWorkMode={handleSetWorkMode}
              onOpenTaskList={openTaskList}
              floatingTop={floatingTop}
              dataCheckOn={dataCheckOn}
              onToggleDataCheck={() => setDataCheckOn((v) => !v)}
              scrapeCount={scrapeCount}
              onChangeScrapeCount={setScrapeCount}
              selectedHoverMetricKeys={selectedHoverMetricKeys}
              hoverMetricModes={hoverMetricModes}
            />
          </div>

          <div className="border-b border-[#e8e6dc] bg-[#faf9f5] px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-lg font-semibold">
                <SocialPlatformLogo platform={selectedPlatform} className="h-5 w-5" />
                {selectedPlatformLabel}
              </div>
              <div className="flex-1">
                <div className="mx-auto hidden h-9 max-w-[520px] rounded-full border border-[#e8e6dc] bg-white sm:block" />
              </div>
              <div className="rounded-full border border-[#e8e6dc] bg-white px-4 py-1.5 text-sm text-[#5e5d59]">
                登录
              </div>
            </div>
          </div>

          <FakeTiktokProfile
            creator={activeCreator}
            dataCheckOn={dataCheckOn}
            scrapeCount={scrapeCount}
            inlineDataKeys={inlineDataKeys}
            playMedianMultiple={playMedianMultiple}
          />
          </div>

          {sidebarOpen ? (
            <SimilarSidebar
              closeButtonRef={sidebarCloseRef}
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
              onOpenWeb={openTaskList}
              onAddCreatorTag={handleAddTag}
              onRemoveCreatorTag={handleRemoveTag}
              selectedEmailTemplate={selectedEmailTemplate}
              onSelectEmailTemplate={setSelectedEmailTemplate}
              emailDraft={emailDraft}
              onEmailDraftChange={setEmailDraft}
              onSendCurrent={handleSendCurrent}
              onClose={() => setSidebarOpen(false)}
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
              playMedianMultiple={playMedianMultiple}
              onChangePlayMedianMultiple={setPlayMedianMultiple}
              selectedPlatform={selectedPlatform}
              onChangePlatform={setSelectedPlatform}
              selectedHoverMetricKeys={selectedHoverMetricKeys}
              onChangeHoverMetricKeys={setSelectedHoverMetricKeys}
              hoverMetricModes={hoverMetricModes}
              onChangeHoverMetricModes={setHoverMetricModes}
              onRecordQuickSettingsChange={(message) => setFeedback(message)}
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
function SimilarSidebar({
  closeButtonRef,
  projects,
  selectedProject,
  onSelectProject,
  onQuickCreateProject,
  onDeleteProject,
  selectedMode,
  onSelectMode,
  onRunSearch,
  activeSidebarTab,
  onSelectSidebarTab,
  isSearching,
  hasSearched,
  activeModeEta,
  activeResults,
  searchProgress,
  creator,
  creatorTagsById,
  visibleCards,
  savedCreatorIds,
  savedProjectCreators,
  onOpenProfile,
  onSaveCreator,
  onDismissCreator,
  onSeedCreator,
  onQuickScreen,
  onOpenSeedFinder,
  onOpenWeb,
  onAddCreatorTag,
  onRemoveCreatorTag,
  selectedEmailTemplate,
  onSelectEmailTemplate,
  emailDraft,
  onEmailDraftChange,
  onSendCurrent,
  onClose,
  resultPopupOpen,
  onEndSearch,
  onCardChange,
  collapsed,
  onToggleCollapse,
  expandedWidth,
  isResizing,
  onResizeStart,
  dataCheckOn,
  onToggleDataCheck,
  scrapeCount,
  onChangeScrapeCount,
  inlineDataKeys,
  onChangeInlineDataKeys,
  playMedianMultiple,
  onChangePlayMedianMultiple,
  selectedPlatform,
  onChangePlatform,
  selectedHoverMetricKeys,
  onChangeHoverMetricKeys,
  hoverMetricModes,
  onChangeHoverMetricModes,
  onRecordQuickSettingsChange,
}: {
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  projects: ProjectSummary[];
  selectedProject: ProjectSummary;
  onSelectProject: (projectId: string) => void;
  onQuickCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  selectedMode: SearchModeKey;
  onSelectMode: (value: SearchModeKey) => void;
  onRunSearch: () => void;
  activeSidebarTab: SidebarTab;
  onSelectSidebarTab: (tab: SidebarTab) => void;
  isSearching: boolean;
  hasSearched: boolean;
  activeModeEta: string;
  activeResults: (typeof searchResults)[SearchModeKey];
  searchProgress: number;
  creator: CreatorProfile;
  creatorTagsById: Record<string, string[]>;
  visibleCards: (typeof searchResults)[SearchModeKey]["cards"];
  savedCreatorIds: string[];
  savedProjectCreators: CreatorProfile[];
  onOpenProfile: (creatorId: string, flow?: ReviewFlow) => void;
  onSaveCreator: (creatorId: string) => void;
  onDismissCreator: (creatorId: string) => void;
  onSeedCreator: (creatorId: string) => void;
  onQuickScreen: () => void;
  onOpenSeedFinder: () => void;
  onOpenWeb: () => void;
  onAddCreatorTag: (creatorId: string, label: string) => void;
  onRemoveCreatorTag: (creatorId: string, label: string) => void;
  selectedEmailTemplate: EmailTemplateKey;
  onSelectEmailTemplate: (value: EmailTemplateKey) => void;
  emailDraft: string;
  onEmailDraftChange: (value: string) => void;
  onSendCurrent: (templateLabel: string, draft: string, options: EmailSendOptions) => void;
  onClose: () => void;
  resultPopupOpen: boolean;
  onEndSearch: () => void;
  onCardChange?: (creatorId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  expandedWidth: number;
  isResizing: boolean;
  onResizeStart: (clientX: number) => void;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  inlineDataKeys: InlineDataKey[];
  onChangeInlineDataKeys: (keys: InlineDataKey[]) => void;
  playMedianMultiple: number;
  onChangePlayMedianMultiple: (value: number) => void;
  selectedPlatform: SocialPlatformKey;
  onChangePlatform: (platform: SocialPlatformKey) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  onChangeHoverMetricKeys: (keys: HoverMetricKey[]) => void;
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
  onChangeHoverMetricModes: (modes: Record<HoverMetricKey, MetricAggregation>) => void;
  onRecordQuickSettingsChange: (message: string) => void;
}) {
  const email = getCreatorEmail(creator);
  const location = getCreatorLocation(creator);
  const currentCreatorTags = creatorTagsById[creator.id] ?? [];
  const creatorMetrics = getCreatorMetricSnapshot(creator, scrapeCount);
  const creatorCpm = creatorMetrics.cpm;
  const audienceHighlights = computeAudienceHighlights(getAudienceSummary(creator));
  const configuredMetricKeys = selectedHoverMetricKeys.length ? selectedHoverMetricKeys : DEFAULT_HOVER_METRICS;
  const sidebarMetricItems = configuredMetricKeys.map((key) => {
    if (key === "rate") {
      return { key, icon: DollarSign, label: "预估报价", value: creatorMetrics.rate };
    }
    if (key === "likes") {
      return {
        key,
        icon: ThumbsUp,
        label: hoverMetricModes.likes === "median" ? "中位点赞" : "平均点赞",
        value: hoverMetricModes.likes === "median" ? creatorMetrics.medianLikes : formatLikes(parseMetricToNumber(creator.likes) * 1.08),
      };
    }
    if (key === "plays") {
      return {
        key,
        icon: Play,
        label: (hoverMetricModes.plays ?? "median") === "median" ? "中位观看量" : "平均观看量",
        value: (hoverMetricModes.plays ?? "median") === "median" ? creatorMetrics.medianPlays : creatorMetrics.averagePlays,
      };
    }
    if (key === "comments") {
      return {
        key,
        icon: MessageCircle,
        label: hoverMetricModes.comments === "median" ? "中位评论" : "平均评论",
        value:
          hoverMetricModes.comments === "median"
            ? creatorMetrics.medianComments
            : formatComments(parseMetricToNumber(creatorMetrics.medianComments) * 1.16),
      };
    }
    return { key, icon: Activity, label: "互动率", value: creatorMetrics.engagementRate };
  });

  // Sender email accounts — empty = no account bound yet
  const [senderEmails] = useState<Array<{ id: string; label: string; address: string }>>([
    // Populated when user connects an account. Start with one demo account.
    { id: "demo", label: "工作邮箱", address: "team@2linkr.io" },
  ]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>(
    senderEmails.length > 0 ? senderEmails[0].id : ""
  );
  const selectedSender = senderEmails.find((acct) => acct.id === selectedSenderId) ?? null;
  const [emailSubject, setEmailSubject] = useState("");
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([creator.id]);
  const [previewRecipientId, setPreviewRecipientId] = useState(creator.id);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [sendMode, setSendMode] = useState<EmailSendOptions["mode"]>("now");
  const [scheduledAt, setScheduledAt] = useState(getDefaultScheduleAt);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const emailCompactControlClasses =
    "h-10 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pr-9 text-sm text-[#141413] outline-none transition-colors focus:border-[#c96442]/35";
  const emailCompactButtonClasses =
    "inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-all active:scale-[0.99]";

  const [pluginStatus, setPluginStatus] = useState<"working" | "idle">("working");
  const activeEmailTemplate =
    emailTemplates.find((template) => template.key === selectedEmailTemplate) ?? null;
  const emailCandidateCreators = useMemo(() => {
    const map = new Map<string, CreatorProfile>();
    map.set(creator.id, creator);
    savedProjectCreators.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [creator, savedProjectCreators]);
  const selectedRecipientSet = new Set(selectedRecipientIds);
  const selectedRecipientCreators = emailCandidateCreators.filter((item) =>
    selectedRecipientSet.has(item.id)
  );
  const emailRecipientCreators = selectedRecipientCreators;
  const emailRecipientIds = emailRecipientCreators.map((item) => item.id);
  const emailRecipientCount = emailRecipientCreators.length;
  const filteredRecipientCreators = emailCandidateCreators;
  const orderedRecipientCreators = useMemo(() => {
    const currentCreator = filteredRecipientCreators.find((item) => item.id === creator.id);
    const restCreators = filteredRecipientCreators.filter((item) => item.id !== creator.id);
    const selectedCreators = restCreators.filter((item) => selectedRecipientIds.includes(item.id));
    const unselectedCreators = restCreators.filter((item) => !selectedRecipientIds.includes(item.id));
    return currentCreator
      ? [currentCreator, ...selectedCreators, ...unselectedCreators]
      : [...selectedCreators, ...unselectedCreators];
  }, [creator.id, filteredRecipientCreators, selectedRecipientIds]);
  const allFilteredRecipientsSelected =
    filteredRecipientCreators.length > 0 &&
    filteredRecipientCreators.every((item) => selectedRecipientSet.has(item.id));
  const previewCreator =
    emailCandidateCreators.find((item) => item.id === previewRecipientId) ??
    emailRecipientCreators[0] ??
    creator;
  const emailTemplateSegments = selectedEmailTemplate
    ? getEmailTemplateSegments(selectedEmailTemplate, previewCreator, selectedProject)
    : [];
  const personalizedSegmentCount = emailTemplateSegments.filter((segment) =>
    segment.personalized
  ).length;
  const canOpenEmailReview =
    Boolean(selectedEmailTemplate) &&
    emailSubject.trim().length > 0 &&
    emailDraft.trim().length > 0 &&
    emailRecipientCount > 0;
  const toggleRecipient = (creatorId: string) => {
    setPreviewRecipientId(creatorId);
    setSelectedRecipientIds((current) => {
      if (current.includes(creatorId)) {
        return current.filter((item) => item !== creatorId);
      }
      return [...current, creatorId];
    });
  };
  const toggleAllFilteredRecipients = () => {
    if (filteredRecipientCreators.length === 0) {
      return;
    }

    const filteredIds = filteredRecipientCreators.map((item) => item.id);
    if (allFilteredRecipientsSelected) {
      setSelectedRecipientIds((current) => current.filter((item) => !filteredIds.includes(item)));
      return;
    }

    setSelectedRecipientIds((current) => Array.from(new Set([...current, ...filteredIds])));
  };
  const selectedTemplateLabel = activeEmailTemplate?.label ?? "自定义邮件";
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(true);
  const [aiReviewOpen, setAiReviewOpen] = useState(true);
  const [topicsOpen, setTopicsOpen] = useState(true);
  const [coreMetricsOpen, setCoreMetricsOpen] = useState(true);
  const [metricsRangeMenuOpen, setMetricsRangeMenuOpen] = useState(false);
  const [similarMetricsRangeMenuOpen, setSimilarMetricsRangeMenuOpen] = useState(false);
  const [currentDetailTab, setCurrentDetailTab] = useState<CurrentDetailTab>("pricing");
  const [unlockedAudienceIds, setUnlockedAudienceIds] = useState<Set<string>>(new Set());
  const diagnostics = getCreatorDiagnostics(creator);
  const isAudienceUnlocked = unlockedAudienceIds.has(creator.id);
  const AUDIENCE_UNLOCK_COST = 2;
  const creatorType = getCreatorType(creator);
  const handleUnlockAudience = () => {
    setUnlockedAudienceIds((current) => {
      if (current.has(creator.id)) return current;
      const next = new Set(current);
      next.add(creator.id);
      return next;
    });
  };

  useEffect(() => {
    setPreviewRecipientId(creator.id);
  }, [creator.id]);

  useEffect(() => {
    if (!selectedEmailTemplate) {
      onSelectEmailTemplate("intro");
      return;
    }

    setEmailSubject(getEmailTemplateSubject(selectedEmailTemplate, previewCreator, selectedProject));
    onEmailDraftChange(getEmailTemplateDraft(selectedEmailTemplate, previewCreator, selectedProject));
  }, [onEmailDraftChange, onSelectEmailTemplate, previewCreator, selectedEmailTemplate, selectedProject]);

  useEffect(() => {
    const availableIds = new Set(emailCandidateCreators.map((item) => item.id));
    setSelectedRecipientIds((current) => {
      const next = current.filter((creatorId) => availableIds.has(creatorId));
      const stable =
        next.length === current.length &&
        next.every((creatorId, index) => creatorId === current[index]);
      if (stable && next.length > 0) {
        return current;
      }

      return next.length > 0 ? next : [creator.id];
    });
    setPreviewRecipientId((current) => (availableIds.has(current) ? current : creator.id));
  }, [creator.id, emailCandidateCreators, selectedProject.id]);

  const handleAttachmentFiles = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setEmailAttachments((current) => {
      const existingKeys = new Set(
        current.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );
      const next = [...current];

      Array.from(files).forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existingKeys.has(key)) {
          next.push(file);
          existingKeys.add(key);
        }
      });

      return next;
    });

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  const handleSendAction = () => {
    if (!selectedEmailTemplate) {
      onRecordQuickSettingsChange("请先选择邮件模板。");
      return;
    }

    if (!emailSubject.trim()) {
      onRecordQuickSettingsChange("邮件标题为空，请先补充后再发送。");
      return;
    }

    if (!emailDraft.trim()) {
      onRecordQuickSettingsChange("邮件内容为空，请先生成或补充后再发送。");
      return;
    }

    if (sendMode === "scheduled" && !scheduledAt) {
      onRecordQuickSettingsChange("请先选择定时发送时间。");
      return;
    }

    setSendMenuOpen(false);
    setReviewModalOpen(true);
  };

  const confirmEmailSend = () => {
    onSendCurrent(selectedTemplateLabel, emailDraft, {
      subject: emailSubject,
      attachmentCount: emailAttachments.length,
      mode: sendMode,
      scheduledAt: sendMode === "scheduled" ? scheduledAt : undefined,
      senderAddress: selectedSender?.address,
      recipientCreatorIds: emailRecipientIds,
    });
    setReviewModalOpen(false);
  };

  const handleSidebarWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey) {
      return;
    }

    if (event.deltaX === 0 && event.deltaY === 0) {
      return;
    }

    event.preventDefault();
    window.scrollBy({
      top: event.deltaY,
      left: event.deltaX,
      behavior: "auto",
    });
  };

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="插件侧边栏"
      className={cn(
        "absolute inset-y-0 right-0 z-20 flex flex-row border-l border-[#e8e6dc] bg-[#faf9f5]/96 shadow-[-20px_0_60px_-30px_rgba(77,76,72,0.18)] backdrop-blur transition-[width] duration-300",
        collapsed && "w-11",
        isResizing && "select-none transition-none"
      )}
      style={collapsed ? undefined : { width: expandedWidth }}
    >
      {!collapsed ? (
        <div
          role="presentation"
          onPointerDown={(event) => {
            event.preventDefault();
            onResizeStart(event.clientX);
          }}
          className="group absolute inset-y-0 left-0 z-30 w-3 -translate-x-1/2 cursor-col-resize touch-none"
        >
          <div
            className={cn(
              "absolute inset-y-6 left-1/2 -translate-x-1/2 rounded-full bg-[#ddd8ce] transition-all duration-150",
              isResizing
                ? "w-1.5 bg-[#c96442] shadow-[0_0_0_3px_rgba(201,100,66,0.15)]"
                : "w-px group-hover:w-1 group-hover:bg-[#c96442]/70"
            )}
          />
        </div>
      ) : null}

      {/* ── Main content column ── */}
      <div className={cn("flex min-w-0 flex-1 flex-col", collapsed && "hidden")}>
        <div
          onWheelCapture={handleSidebarWheel}
          className="hide-scrollbar flex-1 overflow-y-auto px-4 pt-3 pb-5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <SidebarProjectSelector
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={onSelectProject}
            onQuickCreateProject={onQuickCreateProject}
            onDeleteProject={onDeleteProject}
          />

          {activeSidebarTab === "quick" ? (
            <QuickSettingsPanel
              creator={creator}
              location={location}
              creatorMetrics={creatorMetrics}
              dataCheckOn={dataCheckOn}
              onToggleDataCheck={onToggleDataCheck}
              scrapeCount={scrapeCount}
              onChangeScrapeCount={onChangeScrapeCount}
              inlineDataKeys={inlineDataKeys}
              onChangeInlineDataKeys={onChangeInlineDataKeys}
              playMedianMultiple={playMedianMultiple}
              onChangePlayMedianMultiple={onChangePlayMedianMultiple}
              selectedPlatform={selectedPlatform}
              onChangePlatform={onChangePlatform}
              selectedHoverMetricKeys={selectedHoverMetricKeys}
              onChangeHoverMetricKeys={onChangeHoverMetricKeys}
              hoverMetricModes={hoverMetricModes}
              onChangeHoverMetricModes={onChangeHoverMetricModes}
              onRecordQuickSettingsChange={onRecordQuickSettingsChange}
              pluginStatus={pluginStatus}
              onTogglePluginStatus={() => setPluginStatus((s) => (s === "working" ? "idle" : "working"))}
              onOpenWeb={onOpenWeb}
            />
          ) : null}

          {activeSidebarTab === "current" ? (
            <div className="space-y-4">
              <SidebarCreatorProfileCard
                creator={creator}
                email={email}
                location={location}
                creatorType={creatorType}
                isSaved={savedCreatorIds.includes(creator.id)}
                onToggleSave={() => onSaveCreator(creator.id)}
                onOpenEmailSidebar={() => onSelectSidebarTab("email")}
                tags={currentCreatorTags}
                onAddTag={(label) => onAddCreatorTag(creator.id, label)}
                onRemoveTag={(label) => onRemoveCreatorTag(creator.id, label)}
              />

              <div className="border-b border-[#e8e6dc] px-1">
                <div className="flex items-end gap-6">
                  <SidebarContentTabButton
                    icon={DollarSign}
                    label="基础信息"
                    active={currentDetailTab === "pricing"}
                    onClick={() => setCurrentDetailTab("pricing")}
                  />
                  <SidebarContentTabButton
                    icon={Users}
                    label="受众分析"
                    active={currentDetailTab === "audience"}
                    onClick={() => setCurrentDetailTab("audience")}
                  />
                </div>
              </div>

              {currentDetailTab === "pricing" ? (
                <div className="space-y-3">
                  {/* 核心数据：三层结构
                        第一层 · 大标题（可点击折叠）
                        第二层 · 元信息（最近N条 + 数据透视）
                        第三层 · 指标数据 */}
                  <div className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#e8e6dc] bg-white`}>
                    <button
                      type="button"
                      onClick={() => setCoreMetricsOpen((v) => !v)}
                      aria-expanded={coreMetricsOpen}
                      className="flex w-full items-center justify-between px-3 pt-3 pb-2 text-left"
                    >
                      <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#141413]">
                        <BarChart3 className="h-4 w-4 text-[#c96442]" />
                        核心数据
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-[#87867f] transition-transform duration-200",
                          coreMetricsOpen && "rotate-180"
                        )}
                      />
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2.5">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setMetricsRangeMenuOpen((v) => !v)}
                          aria-haspopup="listbox"
                          aria-expanded={metricsRangeMenuOpen}
                          className="inline-flex items-center gap-0.5 rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-2 py-1 text-[11px] font-semibold text-[#4d4c48] transition-all hover:border-[#d1cfc5] hover:bg-[#f0ece4]"
                        >
                          <span>最近 {scrapeCount} 条</span>
                          <ChevronDown className={cn("h-3 w-3 text-[#87867f] transition-transform", metricsRangeMenuOpen && "rotate-180")} />
                        </button>
                        {metricsRangeMenuOpen ? (
                          <div
                            role="listbox"
                            className="absolute left-0 top-full z-30 mt-1 w-[108px] overflow-hidden rounded-[14px] border border-[#e8e6dc] bg-white shadow-[0_16px_40px_-20px_rgba(77,76,72,0.25)]"
                          >
                            {SCRAPE_COUNT_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                role="option"
                                aria-selected={opt === scrapeCount}
                                onClick={() => {
                                  onChangeScrapeCount(opt);
                                  setMetricsRangeMenuOpen(false);
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[#f5f4ed]",
                                  opt === scrapeCount ? "font-semibold text-[#c96442]" : "text-[#4d4c48]"
                                )}
                              >
                                <span>最近 {opt} 条</span>
                                {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <span className="inline-flex shrink-0 items-center rounded-full border border-[#e8e6dc] bg-[#f5f4ed] px-2 py-1 text-[11px] font-semibold text-[#c96442]">
                        CPM {creatorCpm}
                      </span>

                      <div className="ml-auto flex items-center gap-1 text-[11px] font-medium text-[#87867f]">
                        <span>数据透视</span>
                        <span className="group/tip relative inline-flex">
                          <CircleHelp className="h-3.5 w-3.5 cursor-help text-[#b8b6ad] transition-colors hover:text-[#87867f]" />
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute right-0 top-full z-40 mt-1.5 w-56 rounded-[10px] border border-[#e8e6dc] bg-white px-2.5 py-2 text-[11px] leading-[1.55] text-[#4d4c48] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/tip:opacity-100"
                          >
                            在当前页面开启数据透视后，会叠加播放量、平均播放与互动率数据，并按平均播放量排序前 N 条视频。若取数异常，刷新网页即可。
                          </span>
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={dataCheckOn}
                          aria-label="数据透视开关"
                          onClick={onToggleDataCheck}
                          className={cn(
                            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                            dataCheckOn ? "bg-[#c96442]" : "bg-[#d8d4c8]"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                              dataCheckOn && "translate-x-4"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    {coreMetricsOpen ? (
                      <div className="border-t border-[#ececec]">
                        <div className="grid grid-cols-2 divide-x divide-y divide-[#ececec]">
                          {sidebarMetricItems.map((item) => (
                            <SidebarMetricInline key={item.key} icon={item.icon} label={item.label} value={item.value} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* 可收缩的详情信息 */}
                  <SidebarCollapsibleSection
                    icon={Sparkles}
                    title="AI 评价"
                    open={aiReviewOpen}
                    onToggle={() => setAiReviewOpen((v) => !v)}
                  >
                    <p className="text-[13px] leading-[1.6] text-[#4d4c48]">
                      {getCreatorReview(creator)}
                    </p>
                  </SidebarCollapsibleSection>

                  <SidebarCollapsibleSection
                    icon={Activity}
                    title="流量诊断"
                    open={diagnosticsOpen}
                    onToggle={() => setDiagnosticsOpen((v) => !v)}
                  >
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded-[12px] bg-[#faf9f5] px-2 py-2">
                        <div className="text-[10.5px] text-[#87867f]">扑街率</div>
                        <div className="mt-0.5 text-sm font-semibold text-[#141413]">{diagnostics.flopRate}%</div>
                      </div>
                      <div className="rounded-[12px] bg-[#faf9f5] px-2 py-2">
                        <div className="text-[10.5px] text-[#87867f]">常态区间</div>
                        <div className="mt-0.5 text-sm font-semibold text-emerald-600">{diagnostics.normalRange}</div>
                      </div>
                      <div className="rounded-[12px] bg-[#faf9f5] px-2 py-2">
                        <div className="text-[10.5px] text-[#87867f]">爆款率</div>
                        <div className="mt-0.5 text-sm font-semibold text-[#141413]">{diagnostics.hitRate}%</div>
                      </div>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-[3px] text-[11px] text-emerald-700">
                      <Check className="h-3 w-3" />
                      {diagnostics.stabilityText}
                    </div>
                  </SidebarCollapsibleSection>

                  {creator.topics && creator.topics.length > 0 && (
                    <SidebarCollapsibleSection
                      icon={Hash}
                      title="话题提及"
                      open={topicsOpen}
                      onToggle={() => setTopicsOpen((v) => !v)}
                    >
                      <TopicWordCloud topics={creator.topics} />
                    </SidebarCollapsibleSection>
                  )}
                </div>
              ) : isAudienceUnlocked ? (
                <div className={`${SIDEBAR_CARD_RADIUS} border border-[#e8e6dc] bg-white p-3`}>
                  <div className="rounded-[16px] border border-[#e8e6dc] bg-[#f5f4ed] p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#141413]">深度受众分析</div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Check className="h-3 w-3" />
                        已解锁
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-2">
                      {audienceHighlights.map((item) => (
                        <AudienceHighlightBar
                          key={item.label}
                          label={item.label}
                          pct={item.pct}
                          flag={item.flag}
                          flags={item.flags}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(`/workspace?creator=${encodeURIComponent(creator.id)}&tab=audience`, "_blank");
                      }}
                      className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-[12px] border border-[#e8e6dc] bg-white py-2 text-xs text-[#87867f] transition-all hover:border-[#d1cfc5] hover:bg-[#faf9f5] hover:text-[#5e5d59]"
                    >
                      <ExternalLink className="h-3 w-3" />
                      更多受众信息
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`${SIDEBAR_CARD_RADIUS} border border-[#e8e6dc] bg-white p-3`}>
                  <div className="relative overflow-hidden rounded-[16px] border border-[#e8e6dc] bg-gradient-to-b from-[#f7f4eb] to-[#f0ece4] px-3 py-4">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(201,100,66,0.10),transparent_70%)]" />
                    <div className="relative flex flex-col items-center text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8e6dc] bg-white text-[#c96442] shadow-sm">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="mt-2.5 text-sm font-semibold text-[#141413]">解锁深度受众分析</div>
                      <p className="mt-1 max-w-[240px] text-[11.5px] leading-[1.55] text-[#5e5d59]">
                        系统将深扫互动粉丝、剔除水军与低净值流量，输出更精准的受众画像与谈判依据。
                      </p>
                      <button
                        type="button"
                        onClick={handleUnlockAudience}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#141413] px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-[#2a2926] active:scale-[0.98]"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        继续深度分析
                        <span className="rounded-full bg-white/15 px-1.5 py-[1px] text-[10px] font-medium text-white/85">
                          消耗 {AUDIENCE_UNLOCK_COST} 积分
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : null}

          {activeSidebarTab === "email" ? (
            <div className="space-y-3">
              <div className={`${SIDEBAR_CARD_RADIUS} border border-[#e8e6dc] bg-white p-3`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 shrink-0 text-[#c96442]" />
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-[#141413]">建联对象</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full bg-[#f5f4ed] px-2 py-0.5 text-[10.5px] font-semibold text-[#4d4c48]">
                      已选 {emailRecipientCount}/{filteredRecipientCreators.length}
                    </span>
                    <button
                      type="button"
                      disabled={filteredRecipientCreators.length === 0}
                      onClick={toggleAllFilteredRecipients}
                      aria-pressed={allFilteredRecipientsSelected}
                      aria-label={allFilteredRecipientsSelected ? "取消全选" : "全选"}
                      className={cn(
                        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-white transition-all disabled:cursor-not-allowed",
                        allFilteredRecipientsSelected
                          ? "border-[#c96442] bg-[#fff7f1] text-[#c96442]"
                          : "border-[#e8e6dc] text-[#b8b3a8] hover:border-[#c96442]/35 hover:bg-[#fff7f1] hover:text-[#c96442]",
                        filteredRecipientCreators.length === 0 &&
                          "text-[#c8c5bc] hover:border-[#e8e6dc] hover:bg-white"
                      )}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>

                {orderedRecipientCreators.length > 0 ? (
                  <div className="mt-2 max-h-[224px] space-y-1.5 overflow-y-auto pr-0.5">
                    {orderedRecipientCreators.map((targetCreator) => {
                      const isSelected = selectedRecipientSet.has(targetCreator.id);
                      const isPreviewing = previewCreator.id === targetCreator.id;
                      const isCurrentCreator = targetCreator.id === creator.id;
                      const targetLocation = getCreatorLocation(targetCreator);
                      return (
                        <div
                          key={targetCreator.id}
                          className={cn(
                            "group flex h-10 items-center gap-1.5 rounded-[14px] border bg-white px-2 py-1 transition-all",
                            isSelected ? "border-[#c96442]/40 bg-[#fff7f1]" : "border-[#ece9df]",
                            isPreviewing && "ring-1 ring-inset ring-[#f4cf6a]/75"
                          )}
                        >
                          <button
                            type="button"
                            title={`选择 ${targetCreator.handle}`}
                            aria-pressed={isSelected}
                            onClick={() => toggleRecipient(targetCreator.id)}
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all",
                              isSelected
                                ? "border-[#c96442] bg-[#c96442] text-white"
                                : "border-[#d8d4c8] bg-[#faf9f5] text-transparent hover:border-[#c96442]/45"
                            )}
                          >
                            <Check className="h-2 w-2" />
                          </button>
                          <CreatorAvatar
                            creator={targetCreator}
                            className="h-7 w-7 shrink-0 border border-white"
                            labelClassName="text-[10px]"
                          />
                          <button
                            type="button"
                            title={`预览 ${targetCreator.handle} 的个性化邮件`}
                            onClick={() => setPreviewRecipientId(targetCreator.id)}
                            className="flex min-w-0 flex-1 flex-col justify-center text-left"
                          >
                            <span className="flex min-w-0 items-center gap-1">
                              <span className="min-w-0 truncate text-[12px] font-semibold text-[#141413]">
                                {targetCreator.handle}
                              </span>
                              {isCurrentCreator ? (
                                <span className="shrink-0 rounded-full bg-[#f5f4ed] px-1.5 py-0.5 text-[9px] font-semibold text-[#87867f]">
                                  当前
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-[#87867f]">
                              <span className="shrink-0">{targetLocation.flag}</span>
                              <span className="min-w-0 truncate">{targetLocation.country}</span>
                              <span className="shrink-0">· {targetCreator.followers}</span>
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label={`查看 ${targetCreator.name}`}
                            title="查看账号主页"
                            onClick={() => onOpenProfile(targetCreator.id)}
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[#87867f] shadow-sm transition-all hover:bg-[#f0ece4] hover:text-[#4d4c48]"
                          >
                            <Eye className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-2 rounded-[16px] border border-dashed border-[#ddd9ce] bg-white px-3 py-5 text-center text-xs text-[#87867f]">
                    当前筛选下暂无对象
                  </div>
                )}
              </div>

              <div className={`${SIDEBAR_CARD_RADIUS} border border-[#e8e6dc] bg-white p-3`}>
                <div className="relative mb-3 border-b border-[#efede6] pb-2">
                  <div className="inline-flex items-center gap-1.5 text-base font-semibold text-[#141413]">
                    <Mail className="h-4 w-4 shrink-0 text-[#c96442]" />
                    <span>邮件建联</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-zinc-500">发送账号</div>
                    {senderEmails.length === 0 ? (
                      <button
                        type="button"
                        className={`${emailCompactButtonClasses} w-full border border-dashed border-[#d1cfc5] bg-[#faf9f5] text-left text-[#b0aea6] hover:border-[#c96442]/40 hover:text-[#87867f]`}
                      >
                        添加邮件
                      </button>
                    ) : (
                      <div className="relative">
                        <select
                          value={selectedSenderId}
                          onChange={(e) => setSelectedSenderId(e.target.value)}
                          className={emailCompactControlClasses}
                        >
                          {senderEmails.map((acct) => (
                            <option key={acct.id} value={acct.id} className="bg-white text-[#141413]">
                              {acct.address}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4d4c48]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-1.5 text-xs font-medium text-zinc-500">邮件模板</div>
                    <div className="space-y-1">
                      <div className="relative">
                        <select
                          value={selectedEmailTemplate}
                          onChange={(e) => onSelectEmailTemplate(e.target.value as EmailTemplateKey)}
                          className={emailCompactControlClasses}
                        >
                          <option value="" className="bg-white text-[#87867f]">
                            请选择模板
                          </option>
                          {emailTemplates.map((template) => (
                            <option key={template.key} value={template.key} className="bg-white text-[#141413]">
                              {template.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4d4c48]" />
                      </div>
                      {activeEmailTemplate ? (
                        <div className="px-1 text-[11px] leading-[1.45] text-[#87867f]">
                          {activeEmailTemplate.summary}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-xs font-medium text-zinc-500">邮件内容</div>
                    <div className="overflow-hidden rounded-[22px] border border-[#e8e6dc] bg-[#faf9f5] transition-colors focus-within:border-[#c96442]/35">
                      {selectedEmailTemplate ? (
                        <div className="flex items-center gap-2 border-b border-[#e8e6dc] bg-white px-3 py-2">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[#c96442]" />
                          <input
                            value={emailSubject}
                            onChange={(event) => setEmailSubject(event.target.value)}
                            className="h-7 min-w-0 flex-1 bg-transparent text-sm font-medium text-[#141413] outline-none placeholder:text-[#b0aea6]"
                            placeholder="输入邮件标题"
                          />
                        </div>
                      ) : null}

                      {selectedEmailTemplate ? (
                        <div className="border-b border-[#e8e6dc] bg-white px-3 py-1.5">
                          <input
                            ref={attachmentInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(event) => handleAttachmentFiles(event.currentTarget.files)}
                          />
                          <div className="flex min-w-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => attachmentInputRef.current?.click()}
                              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-2.5 text-xs font-semibold text-[#5e5d59] transition-all hover:border-[#c96442]/45 hover:bg-[#fff7f1] hover:text-[#c96442] active:scale-[0.99]"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              附件
                            </button>
                            {emailAttachments.length > 0 ? (
                              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                                {emailAttachments.map((file) => (
                                  <span
                                    key={`${file.name}-${file.size}-${file.lastModified}`}
                                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#efede6] bg-[#faf9f5] px-2 py-1 text-[10.5px] text-[#5e5d59]"
                                  >
                                    <span className="max-w-[128px] truncate">{file.name}</span>
                                    <span className="shrink-0 text-[#b0aea6]">
                                      {formatFileSize(file.size)}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label={`移除附件 ${file.name}`}
                                      onClick={() =>
                                        setEmailAttachments((current) =>
                                          current.filter((item) => item !== file)
                                        )
                                      }
                                      className="ml-0.5 text-[#b0aea6] transition-colors hover:text-[#4d4c48]"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="min-w-0 flex-1 truncate text-xs text-[#b0aea6]">
                                可添加 brief 或报价单
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null}

                      <div className="bg-[#fffdf8] px-3 py-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-[#4d4c48]">
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#c96442]" />
                            <span className="min-w-0 truncate">{previewCreator.handle}</span>
                          </div>
                          <span className="group/highlight relative shrink-0">
                            <span
                              aria-label={`${personalizedSegmentCount} 处高亮。高亮内容仅用于标识 AI 为该博主生成的个性化替换内容，不会显示在最终邮件正文中。`}
                              className="cursor-default rounded-full bg-[#fff2b8] px-2 py-0.5 text-[10px] font-semibold text-[#765d14] ring-1 ring-[#f1d86f]"
                            >
                              {personalizedSegmentCount} 处高亮
                            </span>
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute right-0 top-full z-40 mt-1.5 w-56 rounded-[10px] border border-[#e8e6dc] bg-white px-2.5 py-2 text-[11px] leading-[1.55] text-[#4d4c48] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/highlight:opacity-100"
                            >
                              高亮内容仅用于标识 AI 为该博主生成的个性化替换内容，不会显示在最终邮件正文中。
                            </span>
                          </span>
                        </div>
                        <HighlightedEmailPreview
                          segments={emailTemplateSegments}
                          emptyLabel="选择模板后生成邮件内容"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative mt-3">
                  <div
                    className="flex overflow-hidden rounded-full bg-[#c96442] text-[#faf9f5] shadow-[0_16px_30px_-24px_rgba(201,100,66,0.65)]"
                  >
                    <button
                      type="button"
                      disabled={!canOpenEmailReview}
                      onClick={handleSendAction}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors hover:bg-[#d97757] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#d7a28f] disabled:text-white/70"
                    >
                      {sendMode === "scheduled" ? (
                        <CalendarClock className="h-4 w-4" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {sendMode === "scheduled"
                        ? emailRecipientCount > 1 ? `定时 ${emailRecipientCount} 人` : "确认定时"
                        : emailRecipientCount > 1 ? `一键建联 ${emailRecipientCount} 人` : "一键建联"}
                    </button>
                    <button
                      type="button"
                      aria-label="选择发送方式"
                      aria-haspopup="menu"
                      aria-expanded={sendMenuOpen}
                      onClick={() => setSendMenuOpen((value) => !value)}
                      className="inline-flex h-10 w-10 items-center justify-center border-l border-white/18 transition-colors hover:bg-[#b95638] active:scale-[0.99]"
                    >
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", sendMenuOpen && "rotate-180")}
                      />
                    </button>
                  </div>

                  {sendMenuOpen ? (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[18px] border border-[#e8e6dc] bg-white shadow-[0_20px_42px_-24px_rgba(77,76,72,0.35)]">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSendMode("now");
                          setSendMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#faf9f5]",
                          sendMode === "now" ? "font-semibold text-[#c96442]" : "text-[#4d4c48]"
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          立即发送
                        </span>
                        {sendMode === "now" ? <Check className="h-4 w-4" /> : null}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSendMode("scheduled");
                          setSendMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#faf9f5]",
                          sendMode === "scheduled" ? "font-semibold text-[#c96442]" : "text-[#4d4c48]"
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          定时发送
                        </span>
                        {sendMode === "scheduled" ? <Check className="h-4 w-4" /> : null}
                      </button>
                    </div>
                  ) : null}
                </div>

                {sendMode === "scheduled" ? (
                  <div className="mt-2.5 rounded-[18px] border border-[#e8e6dc] bg-[#faf9f5] p-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                      <CalendarClock className="h-3.5 w-3.5 text-[#c96442]" />
                      定时发送
                    </div>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(event) => setScheduledAt(event.target.value)}
                      className="h-9 w-full rounded-full border border-[#e8e6dc] bg-white px-3 text-sm text-[#141413] outline-none transition-colors focus:border-[#c96442]/35"
                    />
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#87867f]">
                      <Clock3 className="h-3 w-3" />
                      {scheduledAt
                        ? `将在 ${formatScheduleLabel(scheduledAt)} 发送`
                        : "选择一个发送时间"}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {reviewModalOpen ? (
            <EmailReviewModal
              templateKey={selectedEmailTemplate}
              templateLabel={selectedTemplateLabel}
              project={selectedProject}
              recipients={emailRecipientCreators}
              senderAddress={selectedSender?.address ?? "未选择发件账号"}
              subject={emailSubject}
              attachmentCount={emailAttachments.length}
              sendMode={sendMode}
              scheduledAt={sendMode === "scheduled" ? scheduledAt : undefined}
              onClose={() => setReviewModalOpen(false)}
              onConfirm={confirmEmailSend}
            />
          ) : null}

          {activeSidebarTab === "similar" ? (
            <div className="space-y-3">
              {/* Unified stacked card: blogger info (top) + mode selector (below).
                  Switching mode does not affect the blogger header above. */}
              {!hasSearched ? (
                <SimilarSearchModule
                  selectedMode={
                    selectedMode === "budget"
                      ? "budget"
                      : selectedMode === "seed"
                        ? "seed"
                        : "comprehensive"
                  }
                  onSelectMode={(mode) => {
                    if (mode === "seed") onSelectMode("seed");
                    else onSelectMode(mode);
                  }}
                  onRunSearch={onRunSearch}
                  isSearching={isSearching}
                  onOpenSeedFinder={onOpenSeedFinder}
                  actionSubjectLabel={creator.handle}
                  actionSubject={
                    <CreatorAvatar
                      creator={creator}
                      className="h-5 w-5 border border-white/80 shadow-[0_2px_7px_rgba(20,20,19,0.2)]"
                      labelClassName="text-[9px] leading-none"
                    />
                  }
                  header={
                    <div className="min-h-[288px] px-3.5 pt-3.5 pb-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <CreatorAvatar
                            creator={creator}
                            className="h-12 w-12 shrink-0 border-2 border-white"
                            labelClassName="text-base leading-none"
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div
                              className="truncate text-[15px] font-semibold leading-tight text-[#141413]"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {creator.handle}
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#ece9dd] bg-[#faf9f5] px-1.5 py-0.5 text-[10px] text-[#4d4c48]">
                                <span>{location.flag}</span>
                                <span>{location.country}</span>
                              </span>
                              <span className="rounded-full border border-[#ece9dd] bg-[#faf9f5] px-1.5 py-0.5 text-[10px] text-[#4d4c48]">
                                {creatorType}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="group relative shrink-0">
                          <button
                            type="button"
                            aria-label="打开博主分析"
                            onClick={() => onSelectSidebarTab("current")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[12px] border border-[#edd9ce] bg-[linear-gradient(180deg,#fffdfa_0%,#f8efe8_100%)] text-[#c96442] shadow-[0_10px_24px_-20px_rgba(201,100,66,0.55)] transition-all duration-150 hover:-translate-y-[1px] hover:border-[#d9b6a6] hover:bg-[#fff7f1] hover:text-[#b85a39] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#c96442]/20"
                          >
                            <SidebarAnalysisSparkleIcon className="h-4 w-4" />
                          </button>
                          <span className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[10px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                            博主分析
                          </span>
                        </div>
                      </div>

                      {/* 同一博主的数据卡统一读取 creatorMetrics，和悬浮卡保持一套指标。 */}
                      <div className="mt-2.5 overflow-hidden rounded-[16px] border border-[#ece4d8] bg-[#fdfaf4]">
                        <div className="flex min-h-[45px] flex-wrap items-center justify-between gap-2 border-b border-[#efe8dd] bg-[#fcf8f0] px-2.5 py-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setSimilarMetricsRangeMenuOpen((v) => !v)}
                              aria-haspopup="listbox"
                              aria-expanded={similarMetricsRangeMenuOpen}
                              className="inline-flex h-7 items-center gap-1 rounded-full border border-[#e6ddcf] bg-[#fbf7ef] px-2.5 text-[10.5px] font-semibold text-[#5e5d59] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition-all hover:border-[#dccfbe] hover:bg-[#f8f3ea]"
                            >
                              <span>最近 {scrapeCount} 条</span>
                              <ChevronDown
                                className={cn(
                                  "h-2.5 w-2.5 text-[#918a7b] transition-transform",
                                  similarMetricsRangeMenuOpen && "rotate-180"
                                )}
                              />
                            </button>
                            {similarMetricsRangeMenuOpen ? (
                              <div
                                role="listbox"
                                className="absolute left-0 top-full z-30 mt-1 w-[104px] overflow-hidden rounded-[12px] border border-[#ece4d8] bg-[#fffffd] shadow-[0_14px_32px_-18px_rgba(77,76,72,0.24)]"
                              >
                                {SCRAPE_COUNT_OPTIONS.map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    role="option"
                                    aria-selected={opt === scrapeCount}
                                    onClick={() => {
                                      onChangeScrapeCount(opt);
                                      setSimilarMetricsRangeMenuOpen(false);
                                    }}
                                    className={cn(
                                      "flex w-full items-center justify-between px-2.5 py-1.5 text-[10.5px] transition-colors hover:bg-[#faf5ee]",
                                      opt === scrapeCount ? "font-semibold text-[#c96442]" : "text-[#4d4c48]"
                                    )}
                                  >
                                    <span>{opt}条</span>
                                    {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ddcf] bg-[#fbf7ef] px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                            <span className="text-[10px] font-semibold text-[#5e5d59]">
                              数据透视
                            </span>
                            <span className="group/tip relative inline-flex">
                              <CircleHelp className="h-3 w-3 cursor-help text-[#aaa395] transition-colors hover:text-[#87867f]" />
                              <span
                                role="tooltip"
                                className="pointer-events-none absolute right-0 top-full z-40 mt-1.5 w-56 rounded-[10px] border border-[#e8e6dc] bg-white px-2.5 py-2 text-[11px] leading-[1.55] text-[#4d4c48] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/tip:opacity-100"
                              >
                                在当前页面开启数据透视后，会叠加播放量、平均播放与互动率数据，并按平均播放量排序前 N 条视频。若取数异常，刷新网页即可。
                              </span>
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={dataCheckOn}
                              aria-label="数据透视开关"
                              onClick={onToggleDataCheck}
                              className={cn(
                                "relative h-[18px] w-[30px] shrink-0 rounded-full border transition-colors",
                                dataCheckOn
                                  ? "border-[#d26b49] bg-[#d26b49]"
                                  : "border-[#d6ccb7] bg-[#d8cfbe]"
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute left-[1px] top-[1px] h-[14px] w-[14px] rounded-full bg-[#fffaf1] shadow-[0_1px_2px_rgba(77,76,72,0.18)] transition-transform",
                                  dataCheckOn && "translate-x-3"
                                )}
                              />
                            </button>
                          </div>
                        </div>

                        {creator.topics && creator.topics.length > 0 ? (
                          <CreatorTopicSummaryRow
                            topics={creator.topics}
                            scrapeCount={scrapeCount}
                          />
                        ) : null}

                        <div className="grid grid-cols-2 divide-x divide-y divide-[#efe8dd]">
                          {sidebarMetricItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <div key={item.key} className="flex min-h-[56px] flex-col items-center justify-center px-2.5 py-1.5 text-center">
                                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8b897f]">
                                  <Icon className="h-3.5 w-3.5" />
                                  <span>{item.label}</span>
                                </div>
                                <div className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-[#141413]">
                                  {item.value}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  }
                />
              ) : null}

              {/* Toolbar — only after search completes */}
              {hasSearched && !resultPopupOpen && (
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[#87867f]">
                    <span>为</span>
                    <CreatorAvatar
                      creator={creator}
                      className="h-5 w-5 shrink-0 border border-white/80 shadow-[0_2px_8px_-4px_rgba(20,20,19,0.35)]"
                      labelClassName="text-[9px]"
                    />
                    <span className="truncate font-semibold text-[#141413]" style={{ fontFamily: "Georgia, serif" }}>
                      {creator.handle}
                    </span>
                    <span>· {activeResults.total} 位匹配</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob(
                        [activeResults.cards.map((c) => c.name).join("\n")],
                        { type: "text/plain" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${selectedProject.name}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-[#e8e6dc] bg-white px-2.5 py-1 text-[10.5px] font-medium text-[#4d4c48] transition-all hover:border-[#c96442]/40 hover:text-[#c96442] active:scale-[0.97]"
                  >
                    <Download className="h-3 w-3" />
                    <span>导出</span>
                  </button>
                </div>
              )}

              {isSearching ? (
                <div className={SIDEBAR_PANEL_CARD_CLASSES}>
                  <div className="text-sm font-medium text-[#4d4c48]">正在匹配相似博主...</div>
                  <div className="mt-4">
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#ede7dc]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#c96442] to-[#d97757] transition-all duration-300"
                        style={{ width: `${searchProgress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#87867f]">
                      <span>正在分析内容、主题、视觉调性与受众信号</span>
                      <span>{searchProgress}%</span>
                    </div>
                    <div className="mt-2 text-xs text-[#87867f]">
                      {activeModeEta}，请稍候，结果将按当前模式自动整理。
                    </div>
                  </div>
                </div>
              ) : null}

              {hasSearched && !resultPopupOpen ? (
                <SimilarCardCarousel
                  cards={visibleCards}
                  projectScopeId={selectedProject.id}
                  anchor={creator}
                  savedCreatorIds={savedCreatorIds}
                  creatorTagsById={creatorTagsById}
                  onSave={onSaveCreator}
                  onDismiss={onDismissCreator}
                  onSeedCreator={onSeedCreator}
                  onAddTag={onAddCreatorTag}
                  onRemoveTag={onRemoveCreatorTag}
                  onQuickScreen={onQuickScreen}
                  onEndSearch={onEndSearch}
                  onCardChange={onCardChange}
                  dataCheckOn={dataCheckOn}
                  onToggleDataCheck={onToggleDataCheck}
                  scrapeCount={scrapeCount}
                  onChangeScrapeCount={onChangeScrapeCount}
                  onSendEmail={(creatorId) => {
                    onSaveCreator(creatorId);
                    setSelectedRecipientIds((prev) =>
                      Array.from(new Set([...prev, creatorId]))
                    );
                    onSelectSidebarTab("email");
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <SimilarSidebarNavRail
        activeSidebarTab={activeSidebarTab}
        collapsed={collapsed}
        onSelectSidebarTab={onSelectSidebarTab}
        onToggleCollapse={onToggleCollapse}
      />
    </aside>
  );
}
