"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  Eye,
  CircleHelp,
  Copy,
  Download,
  DollarSign,
  ExternalLink,
  FileText,
  FolderOpen,
  Hash,
  Heart,
  Info,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Paperclip,
  Sparkles,
  Moon,
  Play,
  Pencil,
  Sun,
  Search,
  PanelRight,
  Plus,
  Send,
  Settings,
  CalendarClock,
  Clock3,
  ThumbsUp,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SimilarCardCarousel } from "@/features/plugin/components/similar-card-carousel";
import { SimilarSearchModule } from "@/features/plugin/components/similar-search-module";
import { SocialPlatformLogo } from "@/features/plugin/components/social-platform-logo";
import { SideNavItem } from "@/features/plugin/components/side-nav-item";
import { HoverStat } from "@/features/plugin/components/hover-stat";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { SidebarAnalysisSparkleIcon } from "@/features/plugin/components/sparkle-icon";
import { AudienceBar } from "@/features/plugin/components/audience-bar";
import {
  MetricCard,
  SidebarMetric,
  SidebarMetricCenter,
  SidebarMetricInline,
} from "@/features/plugin/components/sidebar-metrics";
import { SidebarCreatorTypeTag } from "@/features/plugin/components/sidebar-creator-type-tag";
import { FloatingStatCell } from "@/features/plugin/components/floating-stat-cell";
import { HighlightedEmailPreview } from "@/features/plugin/components/highlighted-email-preview";
import { SidebarLocationInline } from "@/features/plugin/components/sidebar-location-inline";
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
import {
  formatComments,
  formatDuration,
  formatLikes,
  formatPlays,
  generateSyntheticVideos,
  parseMetricToNumber,
  type SyntheticVideo,
  type VideoCategory,
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
  getSuggestedCpmUsd,
  mapFollowersLabelToDiscoveryPreset,
  parseCpmAmount,
  sortProjectsNewestFirst,
} from "@/features/plugin/lib/format";
import {
  computeAudienceHighlights,
  getAudienceSummary,
  getCountryFlag,
  getCreatorAudienceBreakdown,
  getCreatorAveragePlays,
  getCreatorContactEmail,
  getCreatorCpm,
  getCreatorDiagnostics,
  getCreatorEmail,
  getCreatorLocation,
  getCreatorMedianComments,
  getCreatorMedianPlays,
  getCreatorMetricSnapshot,
  getCreatorReview,
  getCreatorType,
  getRegionTierForCountry,
  getRegionTierLabel,
  inferCountryFromLocale,
} from "@/features/plugin/lib/creator-helpers";
import {
  buildQuickScreenDiscoveryUrl,
  buildSeedFinderDiscoveryUrl,
} from "@/features/plugin/lib/discovery-url";
import {
  getEmailSubjectSegments,
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
  COUNTRY_OPTIONS,
  COUNTRY_TO_FLAG,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  FLAG_TO_DISCOVERY_COUNTRY,
  LOCALE_REGION_TO_COUNTRY,
  REGION_TIER_OPTIONS,
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
  SIDEBAR_CONTROL_CLASSES,
  SIDEBAR_FILLED_BUTTON_CLASSES,
  SIDEBAR_METRIC_RADIUS,
  SIDEBAR_PANEL_CARD_CLASSES,
  SIDEBAR_SECONDARY_BUTTON_CLASSES,
  SIDEBAR_SECTION_CARD_CLASSES,
} from "@/features/plugin/lib/style-constants";
import {
  DEFAULT_HOVER_METRIC_MODES,
  DEFAULT_HOVER_METRICS,
  DEFAULT_INLINE_DATA_KEYS,
  HOVER_CARD_MAX_METRICS,
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
function FakeTiktokProfile({
  creator,
  dataCheckOn,
  scrapeCount,
  inlineDataKeys,
  playMedianMultiple,
}: {
  creator: CreatorProfile;
  dataCheckOn: boolean;
  scrapeCount: number;
  inlineDataKeys: InlineDataKey[];
  playMedianMultiple: number;
}) {
  const allVideos = generateSyntheticVideos(creator, Math.max(18, scrapeCount));
  const averagePlays =
    allVideos.reduce((sum, video) => sum + video.plays, 0) / Math.max(allVideos.length, 1);
  const medianPlays = getMedianNumber(allVideos.map((video) => video.plays));
  const flopThreshold = Math.max(0.35, 1 / Math.max(playMedianMultiple, 1));
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
    <section className="mx-auto max-w-[980px] px-4 pb-10 pt-6 sm:px-8">
      <div className="flex items-start gap-4">
        <CreatorAvatar creator={creator} className="h-18 w-18 border border-[#e8e6dc]" labelClassName="text-3xl" />
        <div className="min-w-0 flex-1">
          <div className="break-words text-2xl font-semibold">{creator.handle}</div>
          <div className="mt-1 break-words text-sm text-[#5e5d59]">{creator.name}</div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#5e5d59]">
            <HoverStat>{creator.followers} 粉丝</HoverStat>
            <HoverStat>{creator.likes} 获赞</HoverStat>
            <HoverStat>{creator.videos} 视频</HoverStat>
            <HoverStat>ER {creator.er}</HoverStat>
          </div>
          <div className="mt-3 max-w-2xl break-words text-sm leading-6 text-[#5e5d59]">
            {creator.bio}
          </div>
          <div className="mt-4 flex gap-3">
            <button className="rounded-xl bg-[#c96442] px-6 py-2 text-sm font-medium text-[#faf9f5] transition-colors hover:bg-[#d97757]">
              关注
            </button>
            <button className="rounded-xl border border-[#e8e6dc] bg-white px-6 py-2 text-sm font-medium text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]">
              发消息
            </button>
          </div>
        </div>
      </div>

      {dataCheckOn ? (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#bfd0ff] bg-[#eef2ff] px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#4f6bff]" />
              <span className="font-semibold text-[#2d3d99]">数据透视模式已开启</span>
              <span className="text-[#5e6fb0]">· 按平均播放量排序前 {scrapeCount} 条</span>
              <span className="text-[#5e6fb0]">· 爆量阈值 {playMedianMultiple.toFixed(1)}X</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#2d3d99]">
              {hasInlineData("plays") ? (
                <>
                  <span className="rounded-full bg-white/70 px-2.5 py-1">
                    总播放 <span className="font-semibold">{formatPlays(totalPlaysNumber)}</span>
                  </span>
                  <span className="rounded-full bg-white/70 px-2.5 py-1">
                    平均播放 <span className="font-semibold">{formatPlays(averagePlays)}</span>
                  </span>
                </>
              ) : null}
              {hasInlineData("engagement") ? (
                <span className="rounded-full bg-white/70 px-2.5 py-1">
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
                <div
                  key={video.id}
                  className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,#7f9bff_0%,#6680f5_55%,#5269e0_100%)] text-white shadow-[0_12px_28px_-18px_rgba(60,82,196,0.55)] transition-transform duration-150 hover:-translate-y-0.5"
                >
                  {/* top row: speed + duration */}
                  <div className="absolute left-0 right-0 top-0 flex items-start justify-between px-3 pt-2.5 text-[11px] font-semibold opacity-95">
                    <span>{playMedianRatio.toFixed(1)}X</span>
                    <span>{formatDuration(video.durationSec)}</span>
                  </div>
                  {/* days */}
                  {hasInlineData("publishedAt") ? (
                    <div className="absolute left-0 right-0 top-7 text-center text-[11px] opacity-85">
                      {video.days} days
                    </div>
                  ) : null}
                  {/* center: rank + plays */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[20px] font-semibold tracking-tight text-white/80">
                      #{rank}
                    </div>
                    {hasInlineData("plays") ? (
                      <div className="mt-1 text-[30px] font-bold leading-none tracking-tight">
                        {formatPlays(video.plays)}
                      </div>
                    ) : null}
                  </div>
                  {/* bottom: ER + stats */}
                  <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                    {hasInlineData("engagement") ? (
                      <div className="text-[11px] font-semibold opacity-95">
                        ER <span className="text-white">{video.erPct.toFixed(1)}%</span>
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
                </div>
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
              : ratio >= playMedianMultiple
                ? "viral"
                : ratio <= flopThreshold
                  ? "flop"
                  : "normal";
          const cardGradient =
            autoCategory === "viral"
              ? "bg-[linear-gradient(180deg,#ff8a8a_0%,#ef4444_55%,#c92c2c_100%)]"
              : autoCategory === "flop"
                ? "bg-[linear-gradient(180deg,#7f9bff_0%,#4f6bff_55%,#2d4dd1_100%)]"
                : autoCategory === "paid"
                  ? "bg-[linear-gradient(180deg,#6dd58c_0%,#22c55e_55%,#148a3f_100%)]"
                  : "bg-[linear-gradient(180deg,#a1a6b5_0%,#7a8194_55%,#5b6275_100%)]";
          return (
            <div
              key={video.id}
              className={cn(
                "group relative aspect-[3/4] overflow-hidden rounded-[14px] text-white shadow-[0_12px_28px_-18px_rgba(60,82,196,0.45)] transition-transform duration-150 hover:-translate-y-0.5",
                cardGradient
              )}
            >
              {/* top row: speed + duration */}
              <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between px-3 pt-2.5 text-[11px] font-semibold opacity-95">
                {/* speed with hover tooltip legend */}
                <span className="group/speed relative cursor-help">
                  <span className="underline decoration-dotted underline-offset-2">
                    {ratio.toFixed(1)}X
                  </span>
                  <span className="pointer-events-none invisible absolute left-0 top-full z-20 mt-1.5 w-[180px] rounded-lg bg-black/85 px-2.5 py-2 text-left text-[10.5px] font-normal leading-[1.45] text-white opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-hover/speed:visible group-hover/speed:opacity-100">
                    <span className="block font-semibold">
                      This post views ÷ Average views
                    </span>
                    <span className="mt-1 block">
                      <span className="text-[#ff8a8a]">Red:</span> viral
                    </span>
                    <span className="block">
                      <span className="text-[#9fb5ff]">Blue:</span> flop
                    </span>
                    <span className="block">
                      <span className="text-[#8ae3a2]">Green:</span> paid partnership
                    </span>
                  </span>
                </span>
                <span>{formatDuration(video.durationSec)}</span>
              </div>
              {/* hours ago */}
              <div className="absolute left-0 right-0 top-7 text-center text-[11px] opacity-85">
                {video.hoursAgo} hours
              </div>
              {/* bottom: ER + stats */}
              <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                <div className="text-[11px] font-semibold opacity-95">
                  ER <span className="text-white">{video.erPct.toFixed(1)}%</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10.5px] opacity-95">
                  <span className="inline-flex items-center gap-0.5">
                    <Play className="h-2.5 w-2.5" fill="currentColor" />
                    {formatPlays(video.plays)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Heart className="h-2.5 w-2.5" />
                    {formatLikes(video.likes)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <MessageCircle className="h-2.5 w-2.5" />
                    {formatComments(video.comments)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}

type FloatingMenuAction = {
  id: "info" | "similar" | "tasks" | "mode";
  label: string;
  hint: string;
  icon: typeof Info;
  iconClass?: string;
  disabled?: boolean;
  onClick: () => void;
};

type FloatingMenuItem = FloatingMenuAction | { kind: "divider"; id: string };

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
  onSeedCreator,
  isSaved,
  onToggleSave,
  workMode,
  onToggleWorkMode,
  onSetWorkMode,
  onOpenTaskList,
  floatingTop,
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
  onSeedCreator: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  workMode: "on" | "off";
  onToggleWorkMode: () => void;
  onSetWorkMode: (mode: "on" | "off") => void;
  onOpenTaskList: () => void;
  floatingTop: number;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDirection, setMenuDirection] = useState<"down" | "up">("down");
  const [hoveredId, setHoveredId] = useState<FloatingMenuAction["id"] | null>(null);
  const [hoverCardOpen, setHoverCardOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragIntentRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  // Estimated menu footprint (4 icons stacked + gap + padding + safety).
  const MENU_ESTIMATED_HEIGHT = 220;
  const EDGE_BUFFER = 12;
  const isOff = workMode === "off";

  const closeFloatingUi = () => {
    setMenuOpen(false);
    setHoveredId(null);
    setHoverCardOpen(false);
  };

  const computeDirection = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom - EDGE_BUFFER;
    const spaceAbove = rect.top - EDGE_BUFFER;
    const fitsDown = spaceBelow >= MENU_ESTIMATED_HEIGHT;
    const fitsUp = spaceAbove >= MENU_ESTIMATED_HEIGHT;
    if (fitsDown) {
      setMenuDirection("down");
    } else if (fitsUp) {
      setMenuDirection("up");
    } else {
      // Neither side has full room — pick the larger one.
      setMenuDirection(spaceAbove > spaceBelow ? "up" : "down");
    }
  };

  const openMenu = () => {
    computeDirection();
    setMenuOpen(true);
  };

  const openHoverCard = () => {
    if (isOff || demoStage === "card") {
      return;
    }
    setHoveredId(null);
    setMenuOpen(false);
    setHoverCardOpen(true);
  };

  useEffect(() => {
    if (isOff || demoStage === "card") {
      setHoverCardOpen(false);
    }
  }, [demoStage, isOff]);

  // Recompute when floating ball moves vertically.
  useEffect(() => {
    if (menuOpen) computeDirection();

  }, [floatingTop, menuOpen]);

  const items: FloatingMenuItem[] = [
    {
      id: "info",
      label: "信息卡片",
      hint: "展开博主的报价、播放、点赞等关键数据速览。",
      icon: Info,
      iconClass: "text-emerald-600",
      disabled: isOff,
      onClick: () => {
        if (isOff) return;
        setMenuOpen(false);
        if (demoStage === "card") {
          onClose();
        } else {
          onOpenCard();
        }
      },
    },
    {
      id: "similar",
      label: "找相似",
      hint: "以当前博主为种子，在侧边栏拉出同类型达人名单。",
      icon: Users,
      iconClass: "text-[#3b82f6]",
      disabled: isOff,
      onClick: () => {
        if (isOff) return;
        setMenuOpen(false);
        onOpenSimilarSidebar();
      },
    },
    { kind: "divider", id: "divider-1" },
    {
      id: "tasks",
      label: "任务列表",
      hint: "打开网页端任务列表，继续查看当前项目的发送与跟进任务。",
      icon: FolderOpen,
      iconClass: "text-[#6b7280]",
      disabled: isOff,
      onClick: () => {
        if (isOff) return;
        setMenuOpen(false);
        onOpenTaskList();
      },
    },
    {
      id: "mode",
      label: isOff ? "切到上班模式" : "切到下班模式",
      hint: isOff
        ? "恢复常亮状态，Linkr 会继续在页面上陪你干活。"
        : "让 Linkr 安静下班，浏览社交媒体时不再弹出干扰。",
      icon: isOff ? Sun : Moon,
      iconClass: isOff ? "text-amber-500" : "text-slate-500",
      onClick: () => {
        setMenuOpen(false);
        onToggleWorkMode();
      },
    },
  ];

  const actions = items.filter(
    (item): item is FloatingMenuAction => !("kind" in item)
  );
  const hovered = actions.find((a) => a.id === hoveredId) ?? null;

  return (
    <div
      className="relative"
      onMouseEnter={openHoverCard}
    >
      {((demoStage === "card") || hoverCardOpen) && !isOff ? (
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
          onSeedCreator={onSeedCreator}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          workMode={workMode}
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

      <div className="absolute right-0 top-1/2 z-30 flex -translate-y-1/2 items-center">
        <div className="relative">
          <button
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
              isOff && "opacity-55 grayscale"
            )}
          >
            <Image
              src="/2linkr-logo.png"
              alt="2Linkr 插件入口"
              fill
              sizes="40px"
              className="object-contain"
            />
            {isOff ? (
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-slate-700 text-white"
              >
                <Moon className="h-2.5 w-2.5" />
              </span>
            ) : null}
          </button>
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
  onSeedCreator,
  isSaved,
  onToggleSave,
  workMode,
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
  onSeedCreator: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  workMode: "on" | "off";
  onSetWorkMode: (mode: "on" | "off") => void;
  onOpenTaskList: () => void;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editableEmail, setEditableEmail] = useState("");
  const [scrapeMenuOpen, setScrapeMenuOpen] = useState(false);
  const contactEmail = getCreatorContactEmail(creator);
  const creatorLocation = getCreatorLocation(creator);
  const creatorMetrics = getCreatorMetricSnapshot(creator, scrapeCount);
  const creatorCpm = creatorMetrics.cpm;
  const displayEmail = editableEmail.trim();
  const hasEmail = Boolean(displayEmail);

  useEffect(() => {
    setEditableEmail(contactEmail ?? "");
    setIsEditingEmail(false);
    setCopied(false);
  }, [contactEmail, creator.id]);

  const copyEmail = () => {
    if (!displayEmail || isEditingEmail) return;
    navigator.clipboard.writeText(displayEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleFinishEmailEdit = () => {
    setEditableEmail((current) => current.trim());
    setIsEditingEmail(false);
    setCopied(false);
  };

  const handleCancelEmailEdit = () => {
    setEditableEmail(contactEmail ?? "");
    setIsEditingEmail(false);
  };

  const handleStartEmailEdit = () => {
    setEditableEmail(displayEmail);
    setIsEditingEmail(true);
    setCopied(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="当前博主速览小窗"
      className={cn(
        "absolute top-1/2 z-20 -translate-y-1/2 rounded-[28px] border border-[#e8e6dc] bg-[#faf9f5]/98 text-[#141413] shadow-[0_28px_80px_-34px_rgba(77,76,72,0.22)] backdrop-blur",
        compactViewport
          ? "right-[42px] w-[min(286px,calc(100vw-164px))] max-w-[286px]"
          : "right-[52px] w-[min(352px,calc(100vw-120px))] max-w-[352px]"
      )}
    >
      <div
        className="flex cursor-grab touch-none justify-center pb-1 pt-1.5 active:cursor-grabbing select-none"
        onPointerDown={(event) => {
          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          onDragStart(event.clientX, event.clientY);
        }}
      >
        <span
          aria-hidden="true"
          className="block h-1.5 w-11 rounded-full bg-[#ddd8ce]"
        />
      </div>

      <div className="px-3 pb-3 pt-1">
        {reviewFlow === "sequential" && sequentialTotal > 0 ? (
          <div className="mb-2 rounded-full bg-[#f5f4ed] px-3 py-1.5 text-center text-[11px] text-[#87867f]">
            逐个筛选中：第 {Math.max(sequentialIndex + 1, 1)} / {sequentialTotal} 位
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="group relative">
              <button
                type="button"
                aria-label="跳转到 web 页面"
                onClick={onOpenTaskList}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e6dc] bg-white text-[#87867f] transition-all hover:border-[#d1cfc5] hover:bg-[#f5f4ed] hover:text-[#4d4c48]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <span className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[10px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                跳转到 web 端任务页
              </span>
            </div>

            <div className="flex items-center gap-1">
              <div className="group relative">
                <button
                  type="button"
                  aria-label="打开下班模式"
                  onClick={() => onSetWorkMode("off")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#87867f] transition-all hover:bg-white hover:text-[#4d4c48]"
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
                <span className="pointer-events-none absolute right-0 top-full z-30 mt-1.5 w-44 rounded-[10px] bg-[#141413] px-2.5 py-2 text-[10px] leading-4 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  打开下班模式后，插件将关闭。点击悬浮球可恢复上班模式。
                </span>
              </div>

              <button
                type="button"
                ref={closeButtonRef}
                aria-label="关闭小窗"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#9ca3af] transition-colors hover:bg-white hover:text-[#141413]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className={cn("flex items-center", compactViewport ? "gap-2" : "gap-3")}>
            <div className="shrink-0">
              <CreatorAvatar creator={creator} className="h-12 w-12" labelClassName="text-base" />
            </div>
            <div className="min-w-0 flex min-h-[48px] flex-1 flex-col justify-center gap-0.5">
              <div className={cn("flex min-w-0 items-center", compactViewport ? "gap-1" : "gap-1.5")}>
                <SidebarLocationInline
                  flag={creatorLocation.flag}
                  country={creatorLocation.country}
                  compact={compactViewport}
                />

                <SidebarCreatorTypeTag type={getCreatorType(creator)} compact={compactViewport} />

                <button
                  type="button"
                  aria-label={isSaved ? `取消收藏 ${creator.name}` : `收藏 ${creator.name}`}
                  aria-pressed={isSaved}
                  onClick={onToggleSave}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent transition-all duration-150 active:scale-[0.88]",
                    compactViewport ? "h-[22px] w-[22px]" : "h-6 w-6",
                    isSaved
                      ? "border-[#f0d7cd] bg-[#fff7f4] text-[#c96442] shadow-[0_4px_10px_rgba(201,100,66,0.16)]"
                      : "text-[#b0aea6] hover:border-[#ece7dc] hover:bg-white hover:text-[#c96442]"
                  )}
                >
                  <Heart className={cn(compactViewport ? "h-3.5 w-3.5" : "h-4 w-4", isSaved && "fill-current")} />
                </button>
              </div>

              <div className={cn("flex min-w-0 items-center", compactViewport ? "gap-1" : "gap-1.5")}>
                <div className="min-w-0 flex flex-1 items-center">
                  {isEditingEmail ? (
                    <input
                      autoFocus
                      value={editableEmail}
                      onChange={(event) => setEditableEmail(event.target.value)}
                      onBlur={handleFinishEmailEdit}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleFinishEmailEdit();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          handleCancelEmailEdit();
                        }
                      }}
                      placeholder="输入邮箱地址"
                      className="h-[26px] min-w-0 flex-1 rounded-[13px] border border-[#e8e6dc] bg-white px-[9px] text-[11px] font-medium text-[#141413] outline-none transition-colors focus:border-[#c96442]/35"
                    />
                  ) : (
                    <button
                      type="button"
                      aria-label={hasEmail ? "复制邮箱" : "暂无邮箱，双击添加邮箱"}
                      title={hasEmail ? "点击复制邮箱" : "双击添加邮箱"}
                      onClick={() => {
                        if (hasEmail) {
                          copyEmail();
                        }
                      }}
                      onDoubleClick={() => {
                        if (!hasEmail) {
                          handleStartEmailEdit();
                        }
                      }}
                      onKeyDown={(event) => {
                        if (!hasEmail && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          handleStartEmailEdit();
                        }
                      }}
                      className={cn(
                        "flex h-[26px] min-w-0 flex-1 items-center gap-1.5 rounded-[13px] px-[9px] text-[11px] transition-all select-none",
                        copied
                          ? "bg-emerald-50"
                          : hasEmail
                            ? "bg-[#f0ece4]"
                            : "bg-[#f5f4ed]",
                        hasEmail ? "cursor-pointer hover:bg-[#e8e3d8]" : "cursor-text"
                      )}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                      ) : (
                        <Copy className={cn("h-3.5 w-3.5 shrink-0", hasEmail ? "text-[#87867f]" : "text-[#bcb7ad]")} />
                      )}
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate font-medium",
                          copied
                            ? "text-emerald-700"
                            : hasEmail
                              ? "text-[#4d4c48]"
                              : "text-[#a39f95]"
                        )}
                      >
                        {copied ? "已复制" : hasEmail ? displayEmail : "双击添加邮箱"}
                      </span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  aria-label="建联"
                  onClick={onOpenEmailSidebar}
                  className="inline-flex h-[26px] shrink-0 items-center justify-center rounded-[13px] border border-[#e8e6dc] bg-white px-[9px] text-[11px] font-semibold text-[#4d4c48] transition-all hover:border-[#d1cfc5] hover:bg-[#f5f4ed] active:scale-[0.97] active:bg-[#ede9e0]"
                >
                  <Mail className="mr-1 h-4 w-4 text-[#87867f]" />
                  建联
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[#e8e6dc] bg-white">
            <div
              className={cn(
                "flex flex-wrap items-center justify-between",
                compactViewport ? "gap-2 px-2.5 py-2" : "gap-2.5 px-3 py-2.5"
              )}
            >
              <div className={cn("flex items-center", compactViewport ? "gap-1" : "gap-1.5")}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setScrapeMenuOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={scrapeMenuOpen}
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full border border-[#e8e6dc] bg-[#faf9f5] font-semibold text-[#4d4c48] transition-all hover:border-[#d1cfc5] hover:bg-[#f0ece4]",
                      compactViewport ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
                    )}
                  >
                    <span>最近 {scrapeCount} 条</span>
                    <ChevronDown className={cn("h-3 w-3 text-[#87867f] transition-transform", scrapeMenuOpen && "rotate-180")} />
                  </button>
                  {scrapeMenuOpen ? (
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
                            setScrapeMenuOpen(false);
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

                <span className="group/cpm relative inline-flex shrink-0">
                  <span
                    aria-label={`CPM ${creatorCpm}，悬浮查看说明`}
                    className={cn(
                      "inline-flex items-center rounded-full border border-[#e8e6dc] bg-[#f5f4ed] font-semibold text-[#c96442]",
                      compactViewport ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
                    )}
                  >
                    CPM {creatorCpm}
                  </span>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 top-full z-40 mt-1.5 w-60 -translate-x-1/2 rounded-[10px] border border-[#e8e6dc] bg-white px-2.5 py-2 text-[11px] leading-[1.55] text-[#4d4c48] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/cpm:opacity-100"
                  >
                    系统检测该博主位于{creatorLocation.country}，当前该地区默认 CPM 为 {creatorCpm}。如需修改，请前往设置页面自行调整。
                  </span>
                </span>
              </div>

              <div className={cn("flex shrink-0 items-center", compactViewport ? "gap-0.5" : "gap-1")}>
                <div
                  className={cn(
                    "flex items-center font-medium text-[#87867f]",
                    compactViewport ? "gap-0.5 text-[10px]" : "gap-1 text-[11px]"
                  )}
                >
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
                </div>
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

            <div className="border-t border-[#e8e6dc]" />

            <div className="grid grid-cols-2">
              {(selectedHoverMetricKeys.length ? selectedHoverMetricKeys : DEFAULT_HOVER_METRICS).map((key, index) => {
                const showBorderRight = index % 2 === 0;
                const showBorderTop = index >= 2;
                if (key === "rate") {
                  return (
                    <FloatingStatCell
                      key={key}
                      icon={DollarSign}
                      iconClassName="text-emerald-500"
                      label="预估报价"
                      value={creatorMetrics.rate}
                      borderRight={showBorderRight}
                      borderTop={showBorderTop}
                    />
                  );
                }
                if (key === "likes") {
                  return (
                    <FloatingStatCell
                      key={key}
                      icon={ThumbsUp}
                      iconClassName="text-rose-500"
                      label={hoverMetricModes.likes === "median" ? "中位点赞" : "平均点赞"}
                      value={hoverMetricModes.likes === "median" ? creatorMetrics.medianLikes : formatLikes(parseMetricToNumber(creator.likes) * 1.08)}
                      borderRight={showBorderRight}
                      borderTop={showBorderTop}
                    />
                  );
                }
                if (key === "plays") {
                  return (
                    <FloatingStatCell
                      key={key}
                      icon={Play}
                      iconClassName="text-[#3b82f6]"
                      label={(hoverMetricModes.plays ?? "median") === "median" ? "中位观看量" : "平均观看量"}
                      value={(hoverMetricModes.plays ?? "median") === "median" ? creatorMetrics.medianPlays : creatorMetrics.averagePlays}
                      borderRight={showBorderRight}
                      borderTop={showBorderTop}
                    />
                  );
                }
                if (key === "comments") {
                  return (
                    <FloatingStatCell
                      key={key}
                      icon={MessageCircle}
                      iconClassName="text-[#f59e0b]"
                      label={hoverMetricModes.comments === "median" ? "中位评论" : "平均评论"}
                      value={hoverMetricModes.comments === "median" ? creatorMetrics.medianComments : formatComments(parseMetricToNumber(creatorMetrics.medianComments) * 1.16)}
                      borderRight={showBorderRight}
                      borderTop={showBorderTop}
                    />
                  );
                }
                return (
                  <FloatingStatCell
                    key={key}
                    icon={Activity}
                    iconClassName="text-violet-500"
                    label="互动率"
                    value={creatorMetrics.engagementRate}
                    borderRight={showBorderRight}
                    borderTop={showBorderTop}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCurrentSidebar}
              className="inline-flex flex-1 items-center justify-center rounded-[18px] border border-[#e8e6dc] bg-white px-2.5 py-2 text-[11px] font-semibold text-[#4d4c48] transition-all hover:border-[#d1cfc5] hover:bg-[#f5f4ed] active:scale-[0.97] active:bg-[#ede9e0]"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5 text-[#87867f]" />
              博主分析
            </button>
            <button
              type="button"
              aria-label="找相似"
              onClick={onOpenSimilarSidebar}
              className="inline-flex flex-1 items-center justify-center rounded-[18px] border border-[#c96442]/35 bg-[#c96442] px-2.5 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_-14px_rgba(201,100,66,0.55)] transition-all hover:bg-[#b8573a] active:scale-[0.97]"
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              找相似
            </button>
          </div>
        </div>
      </div>
    </div>
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

      {/* ── Narrow vertical nav rail (right edge) ── */}
      <div className="flex w-11 flex-shrink-0 flex-col items-center border-l border-[#e8e6dc] bg-[#f0ece4]">
        {/* Icons start at same top offset as the scroll content (py-5 = 20px) */}
        <div className="flex flex-col items-center gap-2 pt-5">
          {/* Collapse / expand toggle */}
          <div className="group relative">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "打开侧边栏" : "收起侧边栏"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
                "text-[#87867f] hover:bg-white hover:text-[#4d4c48]"
              )}
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
            <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              {collapsed ? "打开侧边栏" : "收起侧边栏"}
            </span>
          </div>

          {/* 找相似 — search icon */}
          <div className="group relative">
            <button
              type="button"
              onClick={() => { onSelectSidebarTab("similar"); if (collapsed) onToggleCollapse(); }}
              aria-label="找相似"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
                !collapsed && activeSidebarTab === "similar"
                  ? "bg-[#c96442]/10 text-[#c96442]"
                  : "text-[#87867f] hover:bg-white hover:text-[#4d4c48]"
              )}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              找相似
            </span>
          </div>

          {/* 博主分析 — person icon */}
          <div className="group relative">
            <button
              type="button"
              onClick={() => { onSelectSidebarTab("current"); if (collapsed) onToggleCollapse(); }}
              aria-label="博主分析"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
                !collapsed && activeSidebarTab === "current"
                  ? "bg-[#c96442]/10 text-[#c96442]"
                  : "text-[#87867f] hover:bg-white hover:text-[#4d4c48]"
              )}
            >
              <User className="h-3.5 w-3.5" />
            </button>
            {/* Tooltip — points LEFT into content */}
            <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              博主分析
            </span>
          </div>

          {/* 邮件建联 — mail icon */}
          <div className="group relative">
            <button
              type="button"
              onClick={() => { onSelectSidebarTab("email"); if (collapsed) onToggleCollapse(); }}
              aria-label="邮件建联"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
                !collapsed && activeSidebarTab === "email"
                  ? "bg-[#c96442]/10 text-[#c96442]"
                  : "text-[#87867f] hover:bg-white hover:text-[#4d4c48]"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
            </button>
            <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              邮件建联
            </span>
          </div>

          {/* 速设看板 — quick settings */}
          <div className="group relative">
            <button
              type="button"
              onClick={() => { onSelectSidebarTab("quick"); if (collapsed) onToggleCollapse(); }}
              aria-label="预览设置"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
                !collapsed && activeSidebarTab === "quick"
                  ? "bg-[#c96442]/10 text-[#c96442]"
                  : "text-[#87867f] hover:bg-white hover:text-[#4d4c48]"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              预览设置
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

      </div>
    </aside>
  );
}

function QuickSettingsPanel({
  creator,
  location,
  creatorMetrics,
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
  pluginStatus,
  onTogglePluginStatus,
  onOpenWeb,
}: {
  creator: CreatorProfile;
  location: { country: string; flag: string };
  creatorMetrics: ReturnType<typeof getCreatorMetricSnapshot>;
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
  pluginStatus: "working" | "idle";
  onTogglePluginStatus: () => void;
  onOpenWeb: () => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState(location.country);
  const [regionTier, setRegionTier] = useState<RegionTierKey>(getRegionTierForCountry(location.country));
  const [cpmAmount, setCpmAmount] = useState(parseCpmAmount(creatorMetrics.cpm));
  const [currencyUnit, setCurrencyUnit] = useState<(typeof CURRENCY_OPTIONS)[number]>("USD");
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [draftPlatform, setDraftPlatform] = useState<SocialPlatformKey>(selectedPlatform);
  const [draftCountry, setDraftCountry] = useState(location.country);
  const [draftRegionTier, setDraftRegionTier] = useState<RegionTierKey>(getRegionTierForCountry(location.country));
  const [draftCpmAmount, setDraftCpmAmount] = useState(parseCpmAmount(creatorMetrics.cpm));
  const [draftCurrencyUnit, setDraftCurrencyUnit] = useState<(typeof CURRENCY_OPTIONS)[number]>("USD");

  useEffect(() => {
    const browserCountry =
      typeof window !== "undefined"
        ? inferCountryFromLocale(window.navigator.languages?.[0] ?? window.navigator.language)
        : null;
    const nextCountry = browserCountry ?? location.country;
    const nextTier = getRegionTierForCountry(nextCountry);
    setSelectedCountry(nextCountry);
    setRegionTier(nextTier);
    setCurrencyUnit("USD");
    setCpmAmount(getSuggestedCpmUsd(nextCountry, nextTier));
  }, [creator.id, location.country]);

  const currencySymbol = CURRENCY_SYMBOLS[currencyUnit];
  const draftCurrencySymbol = CURRENCY_SYMBOLS[draftCurrencyUnit];
  const selectedCountryFlag = getCountryFlag(selectedCountry);
  const draftCountryFlag = getCountryFlag(draftCountry);
  const quotaTotal = 1200;
  const quotaUsed = 376;
  const quotaRemaining = quotaTotal - quotaUsed;
  const quotaRemainingPct = Math.round((quotaRemaining / quotaTotal) * 100);

  const setDraftCountryWithTier = (value: string) => {
    const nextTier = getRegionTierForCountry(value);
    setDraftCountry(value);
    setDraftRegionTier(nextTier);
    setDraftCurrencyUnit("USD");
    setDraftCpmAmount(getSuggestedCpmUsd(value, nextTier));
  };

  const hasSettingsChanged =
    draftPlatform !== selectedPlatform ||
    draftCountry !== selectedCountry ||
    draftRegionTier !== regionTier ||
    draftCpmAmount !== cpmAmount ||
    draftCurrencyUnit !== currencyUnit;

  const beginEditSettings = () => {
    setDraftPlatform(selectedPlatform);
    setDraftCountry(selectedCountry);
    setDraftRegionTier(regionTier);
    setDraftCpmAmount(cpmAmount);
    setDraftCurrencyUnit(currencyUnit);
    setIsEditingSettings(true);
  };

  const saveSettingsEdit = () => {
    if (hasSettingsChanged) {
      const confirmed = window.confirm("已修改设置，点击确定后保存本次修改。");
      if (!confirmed) {
        return;
      }
    }
    setSelectedCountry(draftCountry);
    setRegionTier(draftRegionTier);
    setCpmAmount(draftCpmAmount);
    setCurrencyUnit(draftCurrencyUnit);
    onChangePlatform(draftPlatform);
    setIsEditingSettings(false);
    if (hasSettingsChanged) {
      const summary = `已记录预览设置修改：${SOCIAL_PLATFORM_OPTIONS.find((item) => item.key === draftPlatform)?.label ?? "TikTok"} · ${draftCountry} · ${getRegionTierLabel(draftRegionTier)} · CPM ${CURRENCY_SYMBOLS[draftCurrencyUnit]}${draftCpmAmount || "0"}`;
      onRecordQuickSettingsChange(summary);
    }
  };

  const [hoverLimitToast, setHoverLimitToast] = useState(false);
  const hoverLimitToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHoverLimitToast = () => {
    if (hoverLimitToastTimerRef.current) {
      clearTimeout(hoverLimitToastTimerRef.current);
    }
    setHoverLimitToast(true);
    hoverLimitToastTimerRef.current = setTimeout(() => {
      setHoverLimitToast(false);
    }, 2200);
  };

  const toggleHoverMetric = (key: HoverMetricKey) => {
    onChangeHoverMetricKeys((() => {
      const current = selectedHoverMetricKeys;
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }
      if (current.length >= HOVER_CARD_MAX_METRICS) {
        showHoverLimitToast();
        return current;
      }
      return [...current, key];
    })());
  };

  const toggleInlineDataKey = (key: InlineDataKey) => {
    onChangeInlineDataKeys(
      inlineDataKeys.includes(key)
        ? inlineDataKeys.filter((item) => item !== key)
        : [...inlineDataKeys, key]
    );
  };

  const setMetricMode = (key: HoverMetricKey, mode: MetricAggregation) => {
    onChangeHoverMetricModes({ ...hoverMetricModes, [key]: mode });
  };

  const resolvedHoverMetricModes: Record<HoverMetricKey, MetricAggregation> = {
    ...DEFAULT_HOVER_METRIC_MODES,
    ...hoverMetricModes,
  };

  const averageLikes = formatLikes(parseMetricToNumber(creator.likes) * 1.08);
  const averageComments = formatComments(parseMetricToNumber(creatorMetrics.medianComments) * 1.16);
  const hoverMetricOptions: Array<{
    key: HoverMetricKey;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    modeLabels?: [string, string];
  }> = [
    {
      key: "rate",
      icon: DollarSign,
      label: "预估价格",
      value: `${currencySymbol}${cpmAmount || "0"} CPM`,
    },
    {
      key: "plays",
      icon: Play,
      label: `${resolvedHoverMetricModes.plays === "median" ? "中位" : "平均"}观看量`,
      value: resolvedHoverMetricModes.plays === "median" ? creatorMetrics.medianPlays : creatorMetrics.averagePlays,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "likes",
      icon: ThumbsUp,
      label: `${resolvedHoverMetricModes.likes === "median" ? "中位" : "平均"}点赞量`,
      value: resolvedHoverMetricModes.likes === "median" ? creatorMetrics.medianLikes : averageLikes,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "comments",
      icon: MessageCircle,
      label: `${resolvedHoverMetricModes.comments === "median" ? "中位" : "平均"}评论量`,
      value: resolvedHoverMetricModes.comments === "median" ? creatorMetrics.medianComments : averageComments,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "engagementOrViews",
      icon: Activity,
      label: "互动率",
      value: creatorMetrics.engagementRate,
    },
  ];

  const inlineDataOptions: Array<{ key: InlineDataKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: "plays", label: "播放", icon: Play },
    { key: "likes", label: "点赞", icon: ThumbsUp },
    { key: "comments", label: "评论", icon: MessageCircle },
    { key: "engagement", label: "互动率", icon: Activity },
    { key: "publishedAt", label: "发布时间", icon: Clock3 },
  ];

  return (
    <div className="space-y-3">
      <div className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#e8e6dc] bg-white`}>
        <div className="flex items-center justify-between border-b border-[#efede6] px-3 py-2.5">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#141413]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#141413] text-[13px] font-semibold text-white">♪</span>
            社媒与 CPM
          </div>
          <button
            type="button"
            onClick={isEditingSettings ? saveSettingsEdit : beginEditSettings}
            aria-label={isEditingSettings ? "确认保存设置" : "编辑设置"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e6dc] bg-white text-[#6b6a64] transition-colors hover:border-[#d1cfc5] hover:text-[#141413]"
          >
            {isEditingSettings ? <Check className="h-3.5 w-3.5 text-[#c96442]" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="space-y-3 px-3 py-3">
          <div>
            <div className="mb-1.5 text-xs font-medium text-zinc-500">社媒识别</div>
            <div className="relative">
              <select
                value={draftPlatform}
                onChange={(event) => setDraftPlatform(event.target.value as SocialPlatformKey)}
                disabled={!isEditingSettings}
                className={cn(
                  "h-9 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pl-9 pr-8 text-sm font-semibold text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                  !isEditingSettings && "cursor-not-allowed opacity-60"
                )}
              >
                {SOCIAL_PLATFORM_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key} className="bg-white text-[#141413]">
                    {item.label}
                  </option>
                ))}
              </select>
              <SocialPlatformLogo platform={draftPlatform} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
            </div>
          </div>

          <div className="grid grid-cols-[1.05fr_0.95fr] gap-2">
            <div>
              <div className="mb-1.5 text-xs font-medium text-zinc-500">国家与地区</div>
              <div className="relative">
                <select
                  value={draftCountry}
                  onChange={(event) => setDraftCountryWithTier(event.target.value)}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-9 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pl-9 pr-8 text-sm text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60"
                  )}
                >
                  {COUNTRY_OPTIONS.map((item) => (
                    <option key={item.name} value={item.name} className="bg-white text-[#141413]">
                      {item.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                  {draftCountryFlag}
                </span>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-medium text-zinc-500">地区</div>
              <div className="relative">
                <select
                  value={draftRegionTier}
                  onChange={(event) => {
                    const nextTier = event.target.value as RegionTierKey;
                    setDraftRegionTier(nextTier);
                    setDraftCurrencyUnit("USD");
                    setDraftCpmAmount(getSuggestedCpmUsd(draftCountry, nextTier));
                  }}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-9 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pr-8 text-sm text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60"
                  )}
                >
                  {REGION_TIER_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key} className="bg-white text-[#141413]">
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium text-zinc-500">CPM 设定</div>
            <div className="grid grid-cols-[1fr_92px] gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#87867f]">
                  {draftCurrencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={draftCpmAmount}
                  onChange={(event) => setDraftCpmAmount(event.target.value)}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-9 w-full rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pl-7 text-sm font-semibold text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60"
                  )}
                />
              </div>
              <div className="relative">
                <select
                  value={draftCurrencyUnit}
                  onChange={(event) => setDraftCurrencyUnit(event.target.value as (typeof CURRENCY_OPTIONS)[number])}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-9 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pr-7 text-sm font-semibold text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60"
                  )}
                >
                  {CURRENCY_OPTIONS.map((item) => (
                    <option key={item} value={item} className="bg-white text-[#141413]">
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
              </div>
            </div>
            <div className="mt-1.5 inline-flex rounded-full bg-[#f5f4ed] px-2 py-1 text-[11px] font-medium text-[#87867f]">
              {draftCountryFlag} {draftCountry || "未指定"} · {getRegionTierLabel(draftRegionTier)} · CPM {CURRENCY_SYMBOLS[draftCurrencyUnit]}{draftCpmAmount || "0"}
            </div>
          </div>
        </div>
      </div>

      <div className={`${SIDEBAR_CARD_RADIUS} relative overflow-hidden border border-[#e8e6dc] bg-white`}>
        {/* 超限 toast */}
        <div
          aria-live="polite"
          className={cn(
            "pointer-events-none absolute inset-x-3 top-[42px] z-30 flex justify-center transition-all duration-200",
            hoverLimitToast ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          )}
        >
          <span className="rounded-[14px] bg-[#141413] px-3.5 py-2 text-[12px] font-medium leading-[1.45] text-white shadow-[0_8px_24px_-8px_rgba(20,20,19,0.45)]">
            请关闭一个选项
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[#efede6] px-3 py-2.5">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#141413]">
            <BarChart3 className="h-4 w-4 text-[#c96442]" />
            数据显示
          </div>
          <span className="rounded-full bg-[#f5f4ed] px-2 py-1 text-[11px] font-semibold text-[#87867f]">
            悬浮卡 {selectedHoverMetricKeys.length}/{hoverMetricOptions.length}
          </span>
        </div>

        <div className="space-y-3 px-3 py-3">
          <div>
            <div className="mb-2 text-xs font-medium text-zinc-500">悬浮卡片显示</div>
            <div className="space-y-2">
              {hoverMetricOptions.map((item) => {
                const Icon = item.icon;
                const active = selectedHoverMetricKeys.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "rounded-[16px] border px-2.5 py-2 transition-colors",
                      active ? "border-[#ead8cf] bg-[#fffaf7]" : "border-[#e8e6dc] bg-[#faf9f5]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={() => toggleHoverMetric(item.key)}
                        className={cn(
                          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                          active ? "bg-[#c96442]" : "bg-[#d8d4c8]"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                            active && "translate-x-4"
                          )}
                        />
                      </button>
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-[#c96442]" : "text-[#9b9a93]")} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-[#141413]">{item.label}</div>
                        <div className="mt-0.5 text-[11px] text-[#87867f]">{item.value}</div>
                      </div>
                      {item.modeLabels ? (
                        <div className="inline-flex rounded-full border border-[#e8e6dc] bg-white p-0.5">
                          {(["median", "average"] as MetricAggregation[]).map((mode, index) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setMetricMode(item.key, mode)}
                              className={cn(
                                "h-6 rounded-full px-2 text-[10.5px] font-semibold transition-colors",
                                resolvedHoverMetricModes[item.key] === mode
                                  ? "bg-[#141413] text-white"
                                  : "text-[#87867f] hover:text-[#4d4c48]"
                              )}
                            >
                              {item.modeLabels?.[index]}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#e8e6dc] bg-[#faf9f5] p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-zinc-500">社媒内嵌数据</div>
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#87867f]">
                <span>数据透视</span>
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
                      "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      dataCheckOn && "translate-x-4"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {inlineDataOptions.map((item) => {
                const Icon = item.icon;
                const active = inlineDataKeys.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleInlineDataKey(item.key)}
                    className={cn(
                      "flex h-9 items-center justify-between rounded-[14px] border px-2.5 text-xs font-semibold transition-all active:scale-[0.98]",
                      active
                        ? "border-[#ead8cf] bg-white text-[#141413]"
                        : "border-[#e4e1d7] bg-[#f0ece4] text-[#87867f]"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className={cn("h-3.5 w-3.5", active ? "text-[#c96442]" : "text-[#9b9a93]")} />
                      {item.label}
                    </span>
                    {active ? <Check className="h-3.5 w-3.5 text-[#c96442]" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 rounded-[14px] border border-[#e8e6dc] bg-white px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-500">播放中位数倍数</span>
                <span className="rounded-full bg-[#141413] px-2 py-0.5 text-[11px] font-semibold text-white">
                  {playMedianMultiple.toFixed(1)}X
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={playMedianMultiple}
                onChange={(event) => onChangePlayMedianMultiple(Number(event.target.value))}
                className="mt-2 w-full accent-[#c96442]"
              />
              <div className="mt-1 flex justify-between text-[10.5px] text-[#b0aea6]">
                <span>保守</span>
                <span>激进</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {SCRAPE_COUNT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChangeScrapeCount(option)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-[0.98]",
                    scrapeCount === option
                      ? "border-[#c96442]/35 bg-[#fff7f1] text-[#c96442]"
                      : "border-[#e8e6dc] bg-white text-[#87867f] hover:text-[#4d4c48]"
                  )}
                >
                  最近 {option} 条
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#e8e6dc] bg-white`}>
        <div className="flex items-center justify-between border-b border-[#efede6] px-3 py-2.5">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#141413]">
            <Activity className="h-4 w-4 text-[#c96442]" />
            额度与状态
          </div>
          <button
            type="button"
            onClick={onTogglePluginStatus}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors",
              pluginStatus === "working"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#f0ece4] text-[#87867f]"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                pluginStatus === "working" ? "bg-emerald-500" : "bg-[#b0aea6]"
              )}
            />
            {pluginStatus === "working" ? "工作中" : "闲置"}
          </button>
        </div>

        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div
              className="relative h-[86px] w-[86px] shrink-0 rounded-full p-2"
              style={{
                background: `conic-gradient(#2f9e7e 0 ${quotaRemainingPct}%, #e8e6dc ${quotaRemainingPct}% 100%)`,
              }}
              aria-label={`剩余额度 ${quotaRemainingPct}%`}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                <div className="text-lg font-semibold leading-none text-[#141413]">{quotaRemainingPct}%</div>
                <div className="mt-1 text-[10px] text-[#87867f]">剩余</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-[#87867f]">剩余额度</span>
                <span className="font-semibold text-[#141413]">{quotaRemaining}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e8e6dc]">
                <div
                  className="h-full rounded-full bg-[#2f9e7e]"
                  style={{ width: `${quotaRemainingPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-[#87867f]">已使用</span>
                <span className="font-semibold text-[#4d4c48]">{quotaUsed}</span>
              </div>
              <div className="mt-2 text-[11px] leading-5 text-[#87867f]">
                总额度 {quotaTotal}，有颜色部分代表剩余，无颜色部分代表已使用。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function EmailReviewModal({
  templateKey,
  templateLabel,
  project,
  recipients,
  senderAddress,
  subject,
  attachmentCount,
  sendMode,
  scheduledAt,
  onClose,
  onConfirm,
}: {
  templateKey: EmailTemplateKey;
  templateLabel: string;
  project: ProjectSummary;
  recipients: CreatorProfile[];
  senderAddress: string;
  subject: string;
  attachmentCount: number;
  sendMode: EmailSendOptions["mode"];
  scheduledAt?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [activeRecipientId, setActiveRecipientId] = useState(recipients[0]?.id ?? "");
  const activeRecipient =
    recipients.find((item) => item.id === activeRecipientId) ?? recipients[0];
  const subjectSegments = activeRecipient
    ? getEmailSubjectSegments(templateKey, activeRecipient, project)
    : [{ text: subject }];
  const generatedSubject = subjectSegments.map((segment) => segment.text).join("");
  const displaySubjectSegments =
    subject.trim() && subject.trim() !== generatedSubject.trim()
      ? [{ text: subject }]
      : subjectSegments;
  const contentSegments = activeRecipient
    ? getEmailTemplateSegments(templateKey, activeRecipient, project)
    : [];
  const highlightCount = contentSegments.filter((segment) => segment.personalized).length;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#141413]/26 px-4 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] border border-[#e8e6dc] bg-[#faf9f5] shadow-[0_28px_80px_-42px_rgba(20,20,19,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e8e6dc] bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff2b8] px-2.5 py-1 text-[11px] font-semibold text-[#765d14] ring-1 ring-[#f1d86f]">
              <Sparkles className="h-3.5 w-3.5" />
              黄色高亮为 AI 个性化内容
            </div>
            <h3 className="mt-2 text-lg font-semibold text-[#141413]">审核邮件建联</h3>
            <p className="mt-1 text-xs leading-5 text-[#87867f]">
              标准模板会保持一致，姓名、内容亮点、合作理由等黄色区域会按每位博主自动替换。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭审核窗口"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#87867f] transition-colors hover:bg-[#f5f4ed] hover:text-[#4d4c48]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-2.5 sm:grid-cols-4">
            <div className="rounded-[18px] border border-[#e8e6dc] bg-white px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#87867f]">模板</div>
              <div className="mt-1 truncate text-sm font-semibold text-[#141413]">{templateLabel}</div>
            </div>
            <div className="rounded-[18px] border border-[#e8e6dc] bg-white px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#87867f]">收件人</div>
              <div className="mt-1 text-sm font-semibold text-[#141413]">{recipients.length} 位</div>
            </div>
            <div className="rounded-[18px] border border-[#e8e6dc] bg-white px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#87867f]">发送方式</div>
              <div className="mt-1 truncate text-sm font-semibold text-[#141413]">
                {sendMode === "scheduled" && scheduledAt
                  ? formatScheduleLabel(scheduledAt)
                  : "立即发送"}
              </div>
            </div>
            <div className="rounded-[18px] border border-[#e8e6dc] bg-white px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#87867f]">附件</div>
              <div className="mt-1 text-sm font-semibold text-[#141413]">{attachmentCount} 个</div>
            </div>
          </div>

          <div className="mt-3 rounded-[22px] border border-[#e8e6dc] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#141413]">按博主预览个性化版本</div>
              <div className="text-[11px] text-[#87867f]">发件：{senderAddress}</div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {recipients.map((recipient) => {
                const active = recipient.id === activeRecipient?.id;
                return (
                  <button
                    key={recipient.id}
                    type="button"
                    onClick={() => setActiveRecipientId(recipient.id)}
                    className={cn(
                      "flex min-w-[122px] items-center gap-2 rounded-[16px] border px-2 py-2 text-left transition-all",
                      active
                        ? "border-[#c96442]/40 bg-[#fff7f1]"
                        : "border-[#e8e6dc] bg-[#faf9f5] hover:bg-white"
                    )}
                  >
                    <CreatorAvatar creator={recipient} className="h-8 w-8 shrink-0 border border-white" labelClassName="text-[11px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#141413]">
                        {recipient.handle}
                      </span>
                      <span className="block truncate text-[10px] text-[#87867f]">
                        {getCreatorLocation(recipient).flag} {recipient.followers}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 rounded-[22px] border border-[#e8e6dc] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#141413]">邮件标题</div>
              <span className="rounded-full bg-[#fff2b8] px-2 py-0.5 text-[10px] font-semibold text-[#765d14] ring-1 ring-[#f1d86f]">
                标题也会替换姓名
              </span>
            </div>
            <HighlightedEmailPreview
              segments={displaySubjectSegments.length > 0 ? displaySubjectSegments : [{ text: subject }]}
              emptyLabel="暂无标题"
              compact
            />
          </div>

          <div className="mt-3 rounded-[22px] border border-[#e8e6dc] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#141413]">邮件正文</div>
              <span className="rounded-full bg-[#fff2b8] px-2 py-0.5 text-[10px] font-semibold text-[#765d14] ring-1 ring-[#f1d86f]">
                {highlightCount} 处个性化
              </span>
            </div>
            <HighlightedEmailPreview segments={contentSegments} emptyLabel="暂无正文" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#e8e6dc] bg-white px-5 py-4">
          <div className="min-w-0 text-[11px] leading-5 text-[#87867f]">
            确认后将按当前高亮规则为每位博主生成独立邮件。
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-full border border-[#e8e6dc] bg-white px-4 text-sm font-semibold text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]"
            >
              返回修改
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#c96442] px-4 text-sm font-semibold text-white transition-all hover:bg-[#b85a3b] active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              确认发送
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CreateProjectModal({
  closeButtonRef,
  projectName,
  onProjectNameChange,
  productDescription,
  onProductDescriptionChange,
  files,
  onFilesChange,
  onClose,
  onSubmit,
}: {
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  productDescription: string;
  onProductDescriptionChange: (value: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = projectName.trim().length > 0 && productDescription.trim().length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#141413]/18 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="快速新建项目"
        tabIndex={-1}
        className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-[#e8e6dc] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_55%,#f5f4ed_100%)] p-6 text-[#141413] shadow-[0_30px_120px_-40px_rgba(77,76,72,0.22)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,#c9644233,transparent_70%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e6dc] bg-white px-3 py-1 text-xs text-[#c96442]">
              <FileText className="h-3.5 w-3.5" />
              快速新建项目
            </div>
            <div className="mt-3 text-2xl font-semibold">填写项目基本信息</div>
            <p className="mt-2 text-sm leading-6 text-[#5e5d59]">
              项目名和产品信息为必填项。已有达人名单可以选填上传，方便后续继续处理。
            </p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="关闭新建项目弹窗"
            className="relative z-10 rounded-full border border-[#e8e6dc] bg-white p-2 text-[#87867f] hover:bg-[#f5f4ed]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#141413]">
              项目名 / 推广项目名
              <span className="ml-1 text-[#c96442]">*</span>
            </label>
            <input
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              placeholder="例如：春季露营灯新品推广"
              className={SIDEBAR_CONTROL_CLASSES}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#141413]">
              具体是什么产品
              <span className="ml-1 text-[#c96442]">*</span>
            </label>
            <textarea
              value={productDescription}
              onChange={(event) => onProductDescriptionChange(event.target.value)}
              placeholder="例如：主推便携露营灯、折叠桌和配套收纳包，本轮想找户外露营场景达人做新品曝光。"
              className="min-h-[108px] w-full rounded-[20px] border border-[#e8e6dc] bg-[#faf9f5] px-3 py-3 text-sm leading-6 text-[#141413] outline-none transition-colors focus:border-[#c96442]/35"
            />
          </div>

          <div className="rounded-[24px] border border-dashed border-[#d1cfc5] bg-white/80 p-4">
            <div className="text-sm font-semibold text-[#141413]">上传已有达人名单</div>
            <p className="mt-1 text-xs leading-5 text-[#87867f]">
              如果你已经整理过一版达人名单，可在这上传，方便在插件页快速进行筛选和分析。
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-4 py-2 text-sm font-medium text-[#4d4c48] transition-colors hover:border-[#d1cfc5] hover:bg-white">
              <FileText className="h-4 w-4 text-[#87867f]" />
              选择文件
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) =>
                  onFilesChange(Array.from(event.target.files ?? []))
                }
              />
            </label>
            {files.length > 0 ? (
              <div className="mt-3 rounded-[18px] border border-[#e8e6dc] bg-[#faf9f5] px-3 py-2">
                <div className="text-xs font-medium text-[#5e5d59]">
                  已选择 {files.length} 个文件
                </div>
                <div className="mt-1 space-y-1">
                  {files.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="truncate text-xs text-[#87867f]">
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={SIDEBAR_SECONDARY_BUTTON_CLASSES}
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`${SIDEBAR_FILLED_BUTTON_CLASSES} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            创建项目
          </button>
        </div>
      </div>
    </div>
  );
}
