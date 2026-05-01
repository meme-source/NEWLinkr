"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import {
  useWorkspaceProject,
  WORKSPACE_UNASSIGNED_PROJECT_ID,
} from "@/features/project/components/project-context";
import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type StatusKey = "待评估" | "待建联" | "已建联" | "合作中" | "已完成" | "已排除";
type SourceKey = "插件收藏" | "搜索收藏" | "手动导入";
type PriorityTab = "pending" | "active" | "archived";
type SortKey = "followers" | "avgViews" | "avgLikes";

interface Creator {
  id: string;
  handle: string;
  name: string;
  platform: string;
  region: string;
  followers: number;
  avgViews: number;
  avgLikes: number;
  tags: string[];
  status: StatusKey;
  source: SourceKey;
  project: string;
  projectId?: string;
  addedAt: string;
}

const PROJECT_NAME_TO_ID: Record<string, string> = {
  "Q2夏季 Campaign": "q2-summer",
  美妆博主池: "beauty-pool",
  未分配: WORKSPACE_UNASSIGNED_PROJECT_ID,
};

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<StatusKey, { badge: string; dot: string }> = {
  待评估: { badge: "bg-blue-50   text-blue-700   border-blue-200", dot: "bg-blue-400" },
  待建联: { badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-400" },
  已建联: { badge: "bg-sky-50    text-sky-700    border-sky-200", dot: "bg-sky-400" },
  合作中: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  已完成: { badge: "bg-[#f5f4ed] text-[#87867f]  border-[#e8e6dc]", dot: "bg-[#c8c7c3]" },
  已排除: { badge: "bg-red-50    text-red-400    border-red-100", dot: "bg-red-300" },
};

const PRIORITY: Record<PriorityTab, StatusKey[]> = {
  pending: ["待评估", "待建联"],
  active: ["已建联", "合作中"],
  archived: ["已完成", "已排除"],
};

const ALL_STATUSES: StatusKey[] = ["待评估", "待建联", "已建联", "合作中", "已完成", "已排除"];
const PLATFORMS: string[] = ["TikTok", "Instagram", "YouTube", "Twitter"];
const SOURCES: SourceKey[] = ["插件收藏", "搜索收藏", "手动导入"];

// ── Helpers ────────────────────────────────────────────────────────────────────
const avatarSrc = (id: string) =>
  `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(id)}&backgroundColor=fdf0e8`;

// Thumbnail: real photos from picsum with stable seed → portrait aspect ratio
const thumbSrc = (id: string, i: number) =>
  `https://picsum.photos/seed/${id.replace(/_/g, "")}${i + 1}/48/64`;

// Fallback gradient colours when picsum is unavailable
const THUMB_FALLBACKS: Record<string, string[]> = {
  Q2夏季: ["#fce4ec", "#e8f5e9", "#e3f2fd"],
  美妆: ["#f3e5f5", "#fff3e0", "#fce4ec"],
  未分配: ["#e0f7fa", "#fffde7", "#f1f8e9"],
};
const fallback = (project: string, i: number) => {
  const key = Object.keys(THUMB_FALLBACKS).find((k) => project.includes(k)) ?? "未分配";
  return THUMB_FALLBACKS[key][i % 3];
};

function fmtFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function creatorToProfile(c: Creator) {
  return {
    name: c.name,
    handle: c.handle,
    avatarUrl: avatarSrc(c.id),
    region: c.region,
    followers: fmtFollowers(c.followers),
    er: c.avgViews ? `${((c.avgLikes / Math.max(c.avgViews, 1)) * 100).toFixed(1)}%` : "--",
    tags: c.tags,
    platform: (["tiktok", "instagram", "youtube"].includes(c.platform.toLowerCase())
      ? c.platform.toLowerCase()
      : "youtube") as "tiktok" | "instagram" | "youtube",
  };
}

function fmtN(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const GRID = "auto minmax(0,2fr) 64px 108px 72px 72px 72px 92px 68px 108px 40px";

// ── Mock data — expanded to better fill the library table for scroll testing ──
const INIT_CREATORS: Creator[] = [
  // ===== Q2夏季 Campaign =====
  // pending
  {
    id: "skincare_sam",
    handle: "@skincare_sam",
    name: "Skincare Sam",
    platform: "TikTok",
    region: "🇺🇸",
    followers: 320000,
    avgViews: 45000,
    avgLikes: 3200,
    tags: ["测评", "护肤教程"],
    status: "待建联",
    source: "插件收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-10",
  },
  {
    id: "fit_jenny",
    handle: "@fit_jenny",
    name: "Fit Jenny",
    platform: "TikTok",
    region: "🇺🇸",
    followers: 89000,
    avgViews: 52000,
    avgLikes: 4100,
    tags: ["健身", "恢复拉伸"],
    status: "待评估",
    source: "搜索收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-12",
  },
  {
    id: "beauty_karen",
    handle: "@beautytipskaren",
    name: "Beauty Tips Karen",
    platform: "Instagram",
    region: "🇺🇸",
    followers: 64000,
    avgViews: 18000,
    avgLikes: 2900,
    tags: ["彩妆", "护肤"],
    status: "待评估",
    source: "手动导入",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-15",
  },
  {
    id: "summer_look",
    handle: "@summerlook_daily",
    name: "Summer Look Daily",
    platform: "TikTok",
    region: "🇨🇦",
    followers: 47000,
    avgViews: 22000,
    avgLikes: 1800,
    tags: ["夏日穿搭", "OOTD"],
    status: "待建联",
    source: "搜索收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-14",
  },
  {
    id: "coastline_clara",
    handle: "@coastline_clara",
    name: "Coastline Clara",
    platform: "Instagram",
    region: "🇦🇺",
    followers: 126000,
    avgViews: 36000,
    avgLikes: 3400,
    tags: ["海边穿搭", "生活方式"],
    status: "待评估",
    source: "插件收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-16",
  },
  {
    id: "denim_mika",
    handle: "@denim_mika",
    name: "Denim Mika",
    platform: "TikTok",
    region: "🇯🇵",
    followers: 158000,
    avgViews: 47000,
    avgLikes: 4300,
    tags: ["夏日穿搭", "街头"],
    status: "待建联",
    source: "搜索收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-16",
  },
  {
    id: "freshface_jiwon",
    handle: "@freshface_jiwon",
    name: "Freshface Jiwon",
    platform: "Instagram",
    region: "🇰🇷",
    followers: 204000,
    avgViews: 55000,
    avgLikes: 6200,
    tags: ["韩妆", "护肤"],
    status: "待评估",
    source: "插件收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-17",
  },
  {
    id: "pilates_may",
    handle: "@pilateswithmay",
    name: "Pilates With May",
    platform: "TikTok",
    region: "🇸🇬",
    followers: 97000,
    avgViews: 33000,
    avgLikes: 2800,
    tags: ["普拉提", "健康生活"],
    status: "待评估",
    source: "手动导入",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-16",
  },
  {
    id: "minimal_elsa",
    handle: "@minimal_elsa",
    name: "Minimal Elsa",
    platform: "Instagram",
    region: "🇩🇪",
    followers: 72000,
    avgViews: 21000,
    avgLikes: 1900,
    tags: ["极简", "OOTD"],
    status: "待建联",
    source: "搜索收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-15",
  },
  {
    id: "yoga_nami",
    handle: "@yoga_nami_daily",
    name: "Yoga Nami Daily",
    platform: "YouTube",
    region: "🇯🇵",
    followers: 183000,
    avgViews: 49000,
    avgLikes: 5100,
    tags: ["瑜伽", "晨间 routine"],
    status: "待评估",
    source: "插件收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-13",
  },
  {
    id: "trail_kate",
    handle: "@trail_kate",
    name: "Trail Kate",
    platform: "TikTok",
    region: "🇨🇦",
    followers: 54000,
    avgViews: 24000,
    avgLikes: 2100,
    tags: ["户外", "露营"],
    status: "待评估",
    source: "手动导入",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-12",
  },
  {
    id: "beauty_sora",
    handle: "@beauty_sora_lab",
    name: "Beauty Sora Lab",
    platform: "Instagram",
    region: "🇰🇷",
    followers: 268000,
    avgViews: 69000,
    avgLikes: 7400,
    tags: ["彩妆教程", "测评"],
    status: "待建联",
    source: "插件收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-17",
  },
  {
    id: "fit_amelia",
    handle: "@fit_amelia_home",
    name: "Fit Amelia Home",
    platform: "TikTok",
    region: "🇬🇧",
    followers: 112000,
    avgViews: 38000,
    avgLikes: 3300,
    tags: ["居家健身", "塑形"],
    status: "待评估",
    source: "搜索收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-14",
  },
  {
    id: "sunset_noa",
    handle: "@sunset_noa",
    name: "Sunset Noa",
    platform: "Instagram",
    region: "🇵🇭",
    followers: 88000,
    avgViews: 27000,
    avgLikes: 2500,
    tags: ["海岛风", "生活方式"],
    status: "待评估",
    source: "手动导入",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-11",
  },
  {
    id: "tech_lena",
    handle: "@techlena_daily",
    name: "Tech Lena Daily",
    platform: "YouTube",
    region: "🇺🇸",
    followers: 410000,
    avgViews: 118000,
    avgLikes: 9300,
    tags: ["数码", "桌搭"],
    status: "待建联",
    source: "插件收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-16",
  },
  {
    id: "cafe_hana",
    handle: "@cafehana_weekend",
    name: "Cafe Hana Weekend",
    platform: "TikTok",
    region: "🇹🇭",
    followers: 66000,
    avgViews: 26000,
    avgLikes: 2200,
    tags: ["探店", "生活方式"],
    status: "待评估",
    source: "搜索收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-13",
  },
  // active
  {
    id: "glow_girl",
    handle: "@glow_girl",
    name: "Glow Girl",
    platform: "TikTok",
    region: "🇺🇸",
    followers: 180000,
    avgViews: 28000,
    avgLikes: 2100,
    tags: ["GRWM", "平价好物"],
    status: "已建联",
    source: "插件收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-08",
  },
  {
    id: "style_nina",
    handle: "@style_nina_official",
    name: "Style Nina",
    platform: "Instagram",
    region: "🇬🇧",
    followers: 230000,
    avgViews: 41000,
    avgLikes: 6200,
    tags: ["时尚", "穿搭"],
    status: "合作中",
    source: "搜索收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-03",
  },
  {
    id: "daily_delight",
    handle: "@dailydelight_amy",
    name: "Daily Delight Amy",
    platform: "TikTok",
    region: "🇨🇦",
    followers: 115000,
    avgViews: 33000,
    avgLikes: 3800,
    tags: ["日常", "美食"],
    status: "已建联",
    source: "插件收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-04-06",
  },
  // archived
  {
    id: "office_hacks",
    handle: "@office_life_hacks",
    name: "Office Life Hacks",
    platform: "TikTok",
    region: "🇺🇸",
    followers: 156000,
    avgViews: 29000,
    avgLikes: 2200,
    tags: ["办公", "效率工具"],
    status: "已完成",
    source: "搜索收藏",
    project: "Q2夏季 Campaign",
    addedAt: "2026-03-28",
  },
  {
    id: "run_rachel",
    handle: "@run_with_rachel",
    name: "Run With Rachel",
    platform: "YouTube",
    region: "🇺🇸",
    followers: 78000,
    avgViews: 22000,
    avgLikes: 1900,
    tags: ["跑步", "运动"],
    status: "已排除",
    source: "手动导入",
    project: "Q2夏季 Campaign",
    addedAt: "2026-03-20",
  },

  // ===== 美妆博主池 =====
  // pending
  {
    id: "viral_beauty",
    handle: "@viral_beauty",
    name: "Viral Beauty",
    platform: "Instagram",
    region: "🇬🇧",
    followers: 45000,
    avgViews: 38000,
    avgLikes: 1800,
    tags: ["成分分析", "平价好物"],
    status: "待评估",
    source: "手动导入",
    project: "美妆博主池",
    addedAt: "2026-04-14",
  },
  {
    id: "skinlab_uk",
    handle: "@skinlab_uk",
    name: "SkinLab UK",
    platform: "TikTok",
    region: "🇬🇧",
    followers: 92000,
    avgViews: 31000,
    avgLikes: 4600,
    tags: ["成分党", "测评"],
    status: "待评估",
    source: "搜索收藏",
    project: "美妆博主池",
    addedAt: "2026-04-13",
  },
  {
    id: "rosy_glow",
    handle: "@rosyglow_official",
    name: "Rosy Glow",
    platform: "Instagram",
    region: "🇺🇸",
    followers: 128000,
    avgViews: 24000,
    avgLikes: 5300,
    tags: ["护肤", "天然成分"],
    status: "待建联",
    source: "插件收藏",
    project: "美妆博主池",
    addedAt: "2026-04-11",
  },
  {
    id: "velvet_look",
    handle: "@velvetlook_paris",
    name: "Velvet Look Paris",
    platform: "TikTok",
    region: "🇫🇷",
    followers: 71000,
    avgViews: 19500,
    avgLikes: 3100,
    tags: ["法式美妆", "底妆"],
    status: "待评估",
    source: "插件收藏",
    project: "美妆博主池",
    addedAt: "2026-04-10",
  },
  // active
  {
    id: "glam_studio",
    handle: "@glamstudio_hk",
    name: "Glam Studio HK",
    platform: "TikTok",
    region: "🇭🇰",
    followers: 310000,
    avgViews: 67000,
    avgLikes: 9100,
    tags: ["彩妆教程", "仿妆"],
    status: "已建联",
    source: "插件收藏",
    project: "美妆博主池",
    addedAt: "2026-04-02",
  },
  {
    id: "beauty_de",
    handle: "@beautylife_de",
    name: "Beauty Life DE",
    platform: "Instagram",
    region: "🇩🇪",
    followers: 87000,
    avgViews: 19000,
    avgLikes: 3200,
    tags: ["德系护肤", "成分"],
    status: "合作中",
    source: "搜索收藏",
    project: "美妆博主池",
    addedAt: "2026-04-01",
  },
  // archived
  {
    id: "beauty_uk",
    handle: "@beautyinsider_uk",
    name: "Beauty Insider UK",
    platform: "Instagram",
    region: "🇬🇧",
    followers: 98000,
    avgViews: 15000,
    avgLikes: 3400,
    tags: ["护肤", "彩妆"],
    status: "已排除",
    source: "插件收藏",
    project: "美妆博主池",
    addedAt: "2026-04-01",
  },
  {
    id: "glow_matcha",
    handle: "@glowmatcha",
    name: "Glow Matcha",
    platform: "YouTube",
    region: "🇦🇺",
    followers: 53000,
    avgViews: 12000,
    avgLikes: 980,
    tags: ["天然护肤", "纯素"],
    status: "已完成",
    source: "手动导入",
    project: "美妆博主池",
    addedAt: "2026-03-25",
  },
  {
    id: "luxe_skin",
    handle: "@luxeskin_paris",
    name: "Luxe Skin Paris",
    platform: "TikTok",
    region: "🇫🇷",
    followers: 195000,
    avgViews: 48000,
    avgLikes: 7200,
    tags: ["法式护肤", "高端"],
    status: "已完成",
    source: "搜索收藏",
    project: "美妆博主池",
    addedAt: "2026-03-18",
  },

  // ===== 未分配 (末位) =====
  // pending
  {
    id: "tech_review_yt",
    handle: "@techreviewer_pro",
    name: "Tech Reviewer Pro",
    platform: "YouTube",
    region: "🇺🇸",
    followers: 520000,
    avgViews: 120000,
    avgLikes: 8500,
    tags: ["科技测评", "开箱"],
    status: "待评估",
    source: "手动导入",
    project: "未分配",
    addedAt: "2026-04-15",
  },
  {
    id: "food_diary_sg",
    handle: "@fooddiary_sg",
    name: "Food Diary SG",
    platform: "TikTok",
    region: "🇸🇬",
    followers: 71000,
    avgViews: 28000,
    avgLikes: 3100,
    tags: ["美食", "探店"],
    status: "待评估",
    source: "插件收藏",
    project: "未分配",
    addedAt: "2026-04-16",
  },
  {
    id: "yoga_sara",
    handle: "@yogawithsara",
    name: "Yoga With Sara",
    platform: "Instagram",
    region: "🇺🇸",
    followers: 144000,
    avgViews: 35000,
    avgLikes: 5600,
    tags: ["瑜伽", "健康生活"],
    status: "待建联",
    source: "搜索收藏",
    project: "未分配",
    addedAt: "2026-04-14",
  },
  // active
  {
    id: "camp_mike",
    handle: "@camp_mike",
    name: "Camp Mike",
    platform: "TikTok",
    region: "🇺🇸",
    followers: 210000,
    avgViews: 38000,
    avgLikes: 5100,
    tags: ["户外", "露营"],
    status: "合作中",
    source: "搜索收藏",
    project: "未分配",
    addedAt: "2026-04-05",
  },
  {
    id: "home_jasmine",
    handle: "@homedeco_jasmine",
    name: "HomeDeco Jasmine",
    platform: "Instagram",
    region: "🇦🇺",
    followers: 163000,
    avgViews: 27000,
    avgLikes: 4400,
    tags: ["家居", "室内设计"],
    status: "已建联",
    source: "手动导入",
    project: "未分配",
    addedAt: "2026-04-09",
  },
  // archived
  {
    id: "vintage_viv",
    handle: "@vintagevivian",
    name: "Vintage Vivian",
    platform: "TikTok",
    region: "🇬🇧",
    followers: 88000,
    avgViews: 19000,
    avgLikes: 2800,
    tags: ["古着", "二手时尚"],
    status: "已完成",
    source: "插件收藏",
    project: "未分配",
    addedAt: "2026-03-30",
  },
  {
    id: "quickcook_tom",
    handle: "@quickcook_tom",
    name: "QuickCook Tom",
    platform: "YouTube",
    region: "🇨🇦",
    followers: 267000,
    avgViews: 58000,
    avgLikes: 7300,
    tags: ["快手菜", "家常"],
    status: "已排除",
    source: "搜索收藏",
    project: "未分配",
    addedAt: "2026-03-22",
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const {
    projects,
    currentProject,
    currentProjectId,
    selectProject,
    openCreateProject,
    resolveProjectName,
  } = useWorkspaceProject();
  const { openCreatorProfile } = useCreatorProfile();
  const [creators, setCreators] = useState<Creator[]>(() =>
    INIT_CREATORS.map((creator) => ({
      ...creator,
      projectId: PROJECT_NAME_TO_ID[creator.project] ?? WORKSPACE_UNASSIGNED_PROJECT_ID,
    })),
  );
  const [priorityTab, setPriorityTab] = useState<PriorityTab>("pending");
  const [search, setSearch] = useState("");
  const [fPlatform, setFPlatform] = useState<string | null>(null);
  const [fStatus, setFStatus] = useState<StatusKey | null>(null);
  const [fSource, setFSource] = useState<SourceKey | null>(null);
  const [fTag, setFTag] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusPopId, setStatusPopId] = useState<string | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [batchOutreachOpen, setBatchOutreachOpen] = useState(false);
  const [batchBarDismissed, setBatchBarDismissed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  const tabStatuses = PRIORITY[priorityTab];

  // ── Actions ───────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const confirmDelete = (id: string) => {
    setCreators((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
    showToast("删除成功");
  };

  const handleBatchDelete = () => {
    const count = selectedIds.length;
    setCreators((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    setBatchBarDismissed(false);
    showToast(`已删除 ${count} 位博主`);
  };

  const changeStatus = (id: string, s: StatusKey) => {
    setCreators((prev) => prev.map((c) => (c.id === id ? { ...c, status: s } : c)));
    setStatusPopId(null);
    showToast("状态已更新");
  };

  const handleMoveTo = (targetProjectId: string) => {
    const count = selectedIds.length;
    const targetProjectName = resolveProjectName(targetProjectId);
    setCreators((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.id)
          ? { ...c, projectId: targetProjectId, project: targetProjectName }
          : c,
      ),
    );
    setSelectedIds([]);
    setMoveModalOpen(false);
    selectProject(targetProjectId);
    showToast(`已将 ${count} 位博主移入「${targetProjectName}」`);
  };

  const closePopovers = () => {
    setOpenFilter(null);
    setDeletingId(null);
    setStatusPopId(null);
  };

  const handleImportComplete = (imported: Creator[], targetProjectId: string) => {
    setCreators((prev) => [...imported, ...prev]);
    selectProject(targetProjectId);
    const ids = imported.map((c) => c.id);
    setHighlightedIds(ids);
    setTimeout(() => setHighlightedIds([]), 3000);
    showToast(`成功导入 ${imported.length} 位博主至「${resolveProjectName(targetProjectId)}」`);
  };

  const toggleCreatorSelection = (id: string) => {
    setBatchBarDismissed(false);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setBatchBarDismissed(false);
    setSelectedIds(checked ? displayed.map((c) => c.id) : []);
  };

  useEffect(() => {
    setSelectedIds([]);
    setBatchBarDismissed(false);
  }, [currentProjectId]);

  // ── Filtering & sorting ───────────────────────────────────────────────────
  let displayed = creators.filter((c) => {
    if ((c.projectId ?? WORKSPACE_UNASSIGNED_PROJECT_ID) !== currentProjectId) return false;
    if (!tabStatuses.includes(c.status)) return false;
    if (fPlatform && c.platform !== fPlatform) return false;
    if (fStatus && c.status !== fStatus) return false;
    if (fSource && c.source !== fSource) return false;
    if (fTag && !c.tags.some((t) => t.includes(fTag))) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.handle.toLowerCase().includes(q) &&
        !c.name.toLowerCase().includes(q) &&
        !c.tags.some((t) => t.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  if (sortKey) {
    displayed = [...displayed].sort((a, b) => {
      const av = a[sortKey],
        bv = b[sortKey];
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }

  const tabCount = (t: PriorityTab) =>
    creators.filter(
      (c) =>
        (c.projectId ?? WORKSPACE_UNASSIGNED_PROJECT_ID) === currentProjectId &&
        PRIORITY[t].includes(c.status),
    ).length;
  const projCount = (projectId: string) =>
    creators.filter((c) => (c.projectId ?? WORKSPACE_UNASSIGNED_PROJECT_ID) === projectId).length;
  const allTags = Array.from(new Set(creators.flatMap((c) => c.tags)));
  const hasFilters = !!(fPlatform || fStatus || fSource || fTag);
  const allSelected = displayed.length > 0 && displayed.every((c) => selectedIds.includes(c.id));
  const showBatchBar = selectedIds.length > 0 && !batchBarDismissed;
  const currentProjectCreatorCount = creators.filter(
    (creator) => (creator.projectId ?? WORKSPACE_UNASSIGNED_PROJECT_ID) === currentProjectId,
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* ── Layer 1: Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#141413]">博主库</h1>
          <p className="mt-0.5 text-sm text-[#87867f]">
            当前项目：{currentProject.name} · {currentProjectCreatorCount} 位博主
          </p>
        </div>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#141413] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#2a2a28]"
        >
          <Upload className="h-3.5 w-3.5" />
          导入名单
        </button>
      </div>

      {/* ── Layer 2: Project tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-2xl border border-[#e8e6dc] bg-white p-1.5">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => {
              selectProject(project.id);
              setSelectedIds([]);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
              currentProjectId === project.id
                ? "bg-[#141413] text-white shadow-sm"
                : "text-[#4d4c48] hover:bg-[#f5f4ed]",
            )}
          >
            {project.name}
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[10px]",
                currentProjectId === project.id
                  ? "bg-white/20 text-white"
                  : "bg-[#f0ece4] text-[#87867f]",
              )}
            >
              {projCount(project.id)}
            </span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateProject("quick")}
            className="flex items-center gap-1 rounded-xl border border-[#e8e6dc] px-3 py-2 text-sm text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]"
          >
            <Plus className="h-3.5 w-3.5" />
            快捷新建
          </button>
          <button
            type="button"
            onClick={() => openCreateProject("detailed")}
            className="flex items-center gap-1 rounded-xl border border-dashed border-[#e8e6dc] px-3 py-2 text-sm text-[#87867f] transition-colors hover:border-[#c96442]/40 hover:text-[#c96442]"
          >
            <Plus className="h-3.5 w-3.5" />
            详细新建
          </button>
        </div>
      </div>

      {/* ── Layer 3: Sticky priority tabs + centered batch actions ─────────── */}
      <div className="sticky top-0 z-30 -mx-1 bg-[#f7f4ea]/95 px-1 pt-1 backdrop-blur supports-[backdrop-filter]:bg-[#f7f4ea]/88">
        <div className="relative flex min-h-[52px] items-end border-b border-[#e8e6dc] bg-[#f7f4ea]">
          <div className="flex items-center">
            {[
              { key: "pending" as PriorityTab, label: "待处理", hint: "待评估 · 待建联" },
              { key: "active" as PriorityTab, label: "建联中", hint: "已建联 · 合作中" },
              { key: "archived" as PriorityTab, label: "已归档", hint: "已完成 · 已排除" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                title={t.hint}
                onClick={() => {
                  setPriorityTab(t.key);
                  setSelectedIds([]);
                  setBatchBarDismissed(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  priorityTab === t.key
                    ? "border-[#c96442] text-[#c96442]"
                    : "border-transparent text-[#87867f] hover:text-[#4d4c48]",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px]",
                    priorityTab === t.key
                      ? "bg-[#fdf5f0] text-[#c96442]"
                      : "bg-[#f5f4ed] text-[#87867f]",
                  )}
                >
                  {tabCount(t.key)}
                </span>
              </button>
            ))}
          </div>

          {showBatchBar && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#e8e6dc] bg-white px-5 py-3 shadow-[0_20px_60px_-20px_rgba(77,76,72,0.22)]">
                <span className="text-sm text-[#141413]">
                  已选 <span className="font-semibold">{selectedIds.length}</span> 人
                </span>
                <div className="h-4 w-px bg-[#e8e6dc]" />
                <button
                  type="button"
                  onClick={() => setMoveModalOpen(true)}
                  className="rounded-lg bg-[#f5f4ed] px-3 py-1.5 text-xs font-medium text-[#4d4c48] hover:bg-[#e8e6dc]"
                >
                  移入项目
                </button>
                <button
                  type="button"
                  onClick={() => setBatchOutreachOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#c96442] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b85a3b]"
                >
                  <Mail className="h-3.5 w-3.5" />
                  批量建联
                </button>
                <button
                  type="button"
                  onClick={handleBatchDelete}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100"
                >
                  批量删除
                </button>
                <button
                  type="button"
                  onClick={() => setBatchBarDismissed(true)}
                  className="rounded-lg p-1.5 text-[#87867f] hover:bg-[#f5f4ed]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Layer 4: Filter bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索博主名 / 标签..."
            className="w-full rounded-xl border border-[#e8e6dc] bg-white py-2 pr-3 pl-8 text-sm text-[#141413] placeholder:text-[#87867f] focus:border-[#c96442]/40 focus:outline-none"
          />
        </div>

        <FilterChip
          label={fPlatform ?? "平台"}
          active={!!fPlatform}
          open={openFilter === "platform"}
          onToggle={() => setOpenFilter(openFilter === "platform" ? null : "platform")}
        >
          <ChipItem
            label="全部平台"
            onClick={() => {
              setFPlatform(null);
              setOpenFilter(null);
            }}
          />
          {PLATFORMS.map((p) => (
            <ChipItem
              key={p}
              label={p}
              active={fPlatform === p}
              onClick={() => {
                setFPlatform(p);
                setOpenFilter(null);
              }}
            />
          ))}
        </FilterChip>

        <FilterChip
          label={fStatus ?? "状态"}
          active={!!fStatus}
          open={openFilter === "status"}
          onToggle={() => setOpenFilter(openFilter === "status" ? null : "status")}
        >
          <ChipItem
            label="全部状态"
            onClick={() => {
              setFStatus(null);
              setOpenFilter(null);
            }}
          />
          {ALL_STATUSES.map((s) => (
            <ChipItem
              key={s}
              label={s}
              active={fStatus === s}
              onClick={() => {
                setFStatus(s);
                setOpenFilter(null);
              }}
              prefix={
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_CFG[s].dot)} />
              }
            />
          ))}
        </FilterChip>

        <FilterChip
          label={fSource ?? "来源"}
          active={!!fSource}
          open={openFilter === "source"}
          onToggle={() => setOpenFilter(openFilter === "source" ? null : "source")}
        >
          <ChipItem
            label="全部来源"
            onClick={() => {
              setFSource(null);
              setOpenFilter(null);
            }}
          />
          {SOURCES.map((s) => (
            <ChipItem
              key={s}
              label={s}
              active={fSource === s}
              onClick={() => {
                setFSource(s);
                setOpenFilter(null);
              }}
            />
          ))}
        </FilterChip>

        <FilterChip
          label={fTag || "标签"}
          active={!!fTag}
          open={openFilter === "tag"}
          onToggle={() => setOpenFilter(openFilter === "tag" ? null : "tag")}
          extraPadding
        >
          <input
            placeholder="搜索标签..."
            value={fTag}
            onChange={(e) => setFTag(e.target.value)}
            className="mb-1.5 w-full rounded-lg border border-[#e8e6dc] px-2.5 py-1.5 text-xs focus:outline-none"
          />
          {allTags.filter((t) => !fTag || t.includes(fTag)).length === 0 ? (
            <div className="py-2 text-center text-xs text-[#87867f]">暂无可搜标签</div>
          ) : (
            allTags
              .filter((t) => !fTag || t.includes(fTag))
              .map((t) => (
                <ChipItem
                  key={t}
                  label={t}
                  active={fTag === t}
                  onClick={() => {
                    setFTag(t);
                    setOpenFilter(null);
                  }}
                />
              ))
          )}
          {fTag && (
            <button
              type="button"
              onClick={() => setFTag("")}
              className="mt-1 flex w-full items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[#87867f] hover:text-red-500"
            >
              <X className="h-3 w-3" />
              清除
            </button>
          )}
        </FilterChip>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFPlatform(null);
              setFStatus(null);
              setFSource(null);
              setFTag("");
            }}
            className="flex items-center gap-1 rounded-xl border border-[#e8e6dc] px-3 py-2 text-sm text-[#87867f] hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
            清除筛选
          </button>
        )}
      </div>

      {/* ── Layer 5: Table ───────────────────────────────────────────────────── */}
      {/* Note: no overflow-hidden — lets status dropdown escape the container */}
      <div className="rounded-2xl border border-[#e8e6dc] bg-white">
        {/* Header */}
        <div
          className="grid items-center gap-2 rounded-t-2xl border-b border-[#e8e6dc] bg-[#faf9f5] px-4 py-2.5 text-xs font-medium text-[#87867f]"
          style={{ gridTemplateColumns: GRID }}
        >
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-[#c96442]"
            checked={allSelected}
            onChange={(e) => toggleSelectAll(e.target.checked)}
          />
          <span>博主</span>
          <span>平台</span>
          <span>近期内容</span>
          {(
            [
              ["followers", "粉丝"],
              ["avgViews", "均播放"],
              ["avgLikes", "均点赞"],
            ] as [SortKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => handleSort(k)}
              className="flex items-center gap-1 text-left transition-colors hover:text-[#141413]"
            >
              {label}
              {sortKey === k ? (
                sortDir === "desc" ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40" />
              )}
            </button>
          ))}
          <span>项目</span>
          <span>来源</span>
          <span>状态</span>
          <span />
        </div>

        {/* Empty state */}
        {displayed.length === 0 && (
          <div className="rounded-b-2xl py-14 text-center text-sm text-[#87867f]">
            暂无符合条件的博主
          </div>
        )}

        {/* Rows */}
        {displayed.map((c, rowIdx) => {
          const isArchived = c.status === "已完成" || c.status === "已排除";
          const isSelected = selectedIds.includes(c.id);
          const isLast = rowIdx === displayed.length - 1;
          // Status popup: open upward for last 3 rows, downward otherwise
          const statusUp = rowIdx >= displayed.length - 3;

          const isHighlighted = highlightedIds.includes(c.id);
          const projectLabel = resolveProjectName(c.projectId ?? WORKSPACE_UNASSIGNED_PROJECT_ID);

          return (
            <div
              key={c.id}
              className={cn(
                "relative grid items-center gap-2 border-b border-[#f0ece4] px-4 py-3 transition-colors",
                isLast && "rounded-b-2xl border-b-0",
                isArchived && "opacity-50",
                isSelected ? "bg-[#fdf9f5]" : isHighlighted ? "bg-[#fbf5ed]" : "hover:bg-[#faf9f5]",
              )}
              style={{ gridTemplateColumns: GRID }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                className="h-3.5 w-3.5 accent-[#c96442]"
                onChange={() => toggleCreatorSelection(c.id)}
              />

              {/* Creator */}
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => openCreatorProfile(creatorToProfile(c))}
                  className="shrink-0 rounded-full transition-transform hover:scale-105 focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1 focus:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarSrc(c.id)}
                    alt={c.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full border border-[#e8e6dc] bg-[#fdf0e8] object-cover"
                  />
                </button>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[#141413]">{c.handle}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {c.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#f5f4ed] px-1.5 py-px text-[10px] text-[#87867f]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platform */}
              <div className="text-xs leading-snug text-[#87867f]">
                <div>{c.region}</div>
                <div className="mt-0.5">{c.platform}</div>
              </div>

              {/* Thumbnails — real photos from picsum, fallback gradient */}
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <a
                    key={i}
                    href="https://www.tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="点击查看视频"
                    className="group relative h-10 w-[30px] shrink-0 cursor-pointer overflow-hidden rounded-md"
                    style={{ backgroundColor: fallback(projectLabel, i) }}
                  >
                    <img
                      src={thumbSrc(c.id, i)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/90">
                        <div className="ml-px h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-[#141413]" />
                      </div>
                    </div>
                    <ExternalLink className="absolute right-0.5 bottom-0.5 h-2 w-2 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
                  </a>
                ))}
              </div>

              {/* Metrics */}
              <span className="text-sm text-[#4d4c48]">{fmtN(c.followers)}</span>
              <span className="text-sm text-[#4d4c48]">{fmtN(c.avgViews)}</span>
              <span className="text-sm text-[#4d4c48]">{fmtN(c.avgLikes)}</span>

              {/* Project */}
              <span className="truncate text-xs text-[#87867f]" title={projectLabel}>
                {projectLabel}
              </span>

              {/* Source */}
              <span className="text-xs text-[#87867f]">{c.source}</span>

              {/* Status — click to change, opens up or down depending on row position */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusPopId(statusPopId === c.id ? null : c.id)}
                  className={cn(
                    "flex w-fit cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium hover:opacity-80",
                    STATUS_CFG[c.status].badge,
                  )}
                >
                  {c.status}
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {statusPopId === c.id && (
                  <div
                    className={cn(
                      "absolute left-0 z-30 w-32 rounded-xl border border-[#e8e6dc] bg-white py-1 shadow-xl",
                      statusUp ? "bottom-8" : "top-8",
                    )}
                  >
                    {ALL_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => changeStatus(c.id, s)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-[#f5f4ed]",
                          c.status === s ? "font-semibold text-[#141413]" : "text-[#4d4c48]",
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_CFG[s].dot)}
                        />
                        {s}
                        {c.status === s && <Check className="ml-auto h-3 w-3 text-[#c96442]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDeletingId(deletingId === c.id ? null : c.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#87867f] hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {deletingId === c.id && (
                  <div className="absolute top-8 right-0 z-30 w-40 rounded-2xl border border-[#e8e6dc] bg-white p-3.5 shadow-xl">
                    <p className="text-xs text-[#4d4c48]">确认删除此博主？</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmDelete(c.id)}
                        className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                      >
                        确认
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="flex-1 rounded-lg border border-[#e8e6dc] py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#87867f]">
        显示 {displayed.length} 条 · 共{" "}
        {
          creators.filter(
            (c) =>
              (c.projectId ?? WORKSPACE_UNASSIGNED_PROJECT_ID) === currentProjectId &&
              tabStatuses.includes(c.status),
          ).length
        }{" "}
        条
      </p>
      {/* ── 移入项目 modal ───────────────────────────────────────────────────── */}
      {moveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-80 rounded-2xl border border-[#e8e6dc] bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-semibold text-[#141413]">移入项目</h3>
              <button
                type="button"
                onClick={() => {
                  setMoveModalOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#87867f] hover:bg-[#f5f4ed]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-xs text-[#87867f]">
              为已选 <span className="font-medium text-[#141413]">{selectedIds.length}</span>{" "}
              位博主选择目标项目
            </p>

            <div className="mb-4 space-y-2">
              {projects
                .filter((project) => project.id !== currentProjectId)
                .map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleMoveTo(project.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#e8e6dc] px-4 py-3 text-sm text-[#141413] hover:border-[#c96442]/30 hover:bg-[#fdf5f0]"
                  >
                    <span>{project.name}</span>
                    <span className="text-xs text-[#87867f]">{projCount(project.id)} 位博主</span>
                  </button>
                ))}
            </div>

            <div className="border-t border-[#e8e6dc] pt-4">
              <p className="mb-3 text-xs leading-5 text-[#87867f]">
                需要新项目时，直接打开统一侧边栏创建即可。创建完成后会自动出现在上面的项目列表里。
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openCreateProject("quick")}
                  className="flex-1 rounded-xl border border-[#e8e6dc] px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
                >
                  快捷新建
                </button>
                <button
                  type="button"
                  onClick={() => openCreateProject("detailed")}
                  className="flex-1 rounded-xl bg-[#141413] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a28]"
                >
                  详细新建
                </button>
              </div>
            </div>
          </div>
          <div
            className="fixed inset-0 z-[-1] bg-black/10"
            onClick={() => {
              setMoveModalOpen(false);
            }}
          />
        </div>
      )}

      {/* Batch outreach drawer */}
      {batchOutreachOpen && (
        <BatchOutreachDrawer
          creators={creators.filter((c) => selectedIds.includes(c.id))}
          onClose={() => setBatchOutreachOpen(false)}
          onComplete={(ids) => {
            setCreators((prev) =>
              prev.map((c) => (ids.includes(c.id) ? { ...c, status: "已建联" } : c)),
            );
            setSelectedIds([]);
            setBatchOutreachOpen(false);
            showToast(`已向 ${ids.length} 位博主发起建联`);
          }}
        />
      )}

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onComplete={(imported, target) => {
            setImportOpen(false);
            handleImportComplete(imported, target);
          }}
        />
      )}

      {/* Global overlay — closes filter dropdowns & status/delete popovers */}
      {(openFilter || deletingId || statusPopId) && (
        <div className="fixed inset-0 z-20" onClick={closePopovers} />
      )}
    </div>
  );
}

// ── BatchOutreachDrawer ────────────────────────────────────────────────────────
const BATCH_TEMPLATES = [
  { id: 1, name: "首次建联", replyRate: 15, subject: "I'd love to work with you, {creator_name}" },
  { id: 2, name: "快速破冰", replyRate: 12, subject: "Quick initial idea for {platform}" },
  {
    id: 3,
    name: "独家合作",
    replyRate: 18,
    subject: "Exclusive partnership opportunity from {brand_name}",
  },
  {
    id: 4,
    name: "二次催促",
    replyRate: 9,
    subject: "Following up — {brand_name} × {creator_name}",
  },
];

function BatchOutreachDrawer({
  creators,
  onClose,
  onComplete,
}: {
  creators: Creator[];
  onClose: () => void;
  onComplete: (ids: string[]) => void;
}) {
  const { openCreatorProfile } = useCreatorProfile();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [list, setList] = useState<Creator[]>(creators);
  const [selTemplate, setSelTemplate] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const removeCreator = (id: string) => setList((prev) => prev.filter((c) => c.id !== id));
  const selectedTpl = BATCH_TEMPLATES.find((t) => t.id === selTemplate);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e6dc] px-6 py-4">
          <div>
            <h2 className="font-semibold text-[#141413]">批量建联</h2>
            <p className="mt-0.5 text-xs text-[#87867f]">
              {step === 1
                ? "Step 1 · 确认建联博主"
                : step === 2
                  ? "Step 2 · 选择邮件模板"
                  : "Step 3 · 确认发送"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {([1, 2, 3] as const).map((s) => (
                <span
                  key={s}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    step === s ? "bg-[#c96442]" : step > s ? "bg-[#c96442]/40" : "bg-[#e8e6dc]",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[#87867f] hover:bg-[#f5f4ed]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Step 1: Confirm creators ── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-[#87867f]">
                确认以下 <span className="font-medium text-[#141413]">{list.length}</span>{" "}
                位博主参与建联，可点击 × 移除
              </p>
              {list.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#e8e6dc] py-8 text-center text-sm text-[#87867f]">
                  已移除全部博主
                </div>
              )}
              {list.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => openCreatorProfile(creatorToProfile(c))}
                    className="shrink-0 rounded-full transition-transform hover:scale-105 focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1 focus:outline-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarSrc(c.id)}
                      alt={c.name}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full border border-[#e8e6dc] bg-[#fdf0e8]"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[#141413]">{c.handle}</div>
                    <div className="mt-0.5 text-[10px] text-[#87867f]">
                      {c.platform} · {c.region}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCreator(c.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#c8c7c3] hover:bg-[#f0ece4] hover:text-[#87867f]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Select template ── */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-[#87867f]">为本次建联选择邮件模板</p>
              {BATCH_TEMPLATES.map((t) => (
                <div key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelTemplate(t.id);
                      setExpandedId(expandedId === t.id ? null : t.id);
                    }}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3.5 text-left transition-colors",
                      selTemplate === t.id
                        ? "border-[#c96442]/40 bg-[#fdf5f0]"
                        : "border-[#e8e6dc] bg-white hover:border-[#c96442]/20 hover:bg-[#faf9f5]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            selTemplate === t.id
                              ? "border-[#c96442] bg-[#c96442]"
                              : "border-[#d4d2cc]",
                          )}
                        >
                          {selTemplate === t.id && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-[#141413]">{t.name}</span>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        回复率 {t.replyRate}%
                      </span>
                    </div>
                    <p className="mt-1.5 pl-7 text-xs text-[#87867f]">{t.subject}</p>
                  </button>

                  {/* Expanded preview */}
                  {expandedId === t.id && (
                    <div className="mt-1.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] p-4">
                      {/* Creator preview switcher */}
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-[10px] text-[#87867f]">预览对象：</span>
                        <div className="flex gap-1.5">
                          {list.slice(0, 4).map((c, i) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setPreviewIdx(i)}
                              className={cn(
                                "h-6 w-6 overflow-hidden rounded-full border-2 transition-colors",
                                previewIdx === i ? "border-[#c96442]" : "border-transparent",
                              )}
                            >
                              <img
                                src={avatarSrc(c.id)}
                                alt={c.name}
                                width={24}
                                height={24}
                                className="h-full w-full"
                              />
                            </button>
                          ))}
                        </div>
                        {list[previewIdx] && (
                          <span className="text-[10px] text-[#4d4c48]">
                            {list[previewIdx].handle}
                          </span>
                        )}
                      </div>
                      <div className="rounded-lg bg-white p-3 text-xs leading-relaxed text-[#4d4c48]">
                        <div className="mb-2 font-medium text-[#141413]">
                          {t.subject
                            .replace("{creator_name}", list[previewIdx]?.name ?? "Creator")
                            .replace("{platform}", list[previewIdx]?.platform ?? "TikTok")
                            .replace("{brand_name}", "MyBrand")}
                        </div>
                        <div className="text-[#87867f]">
                          Hi {list[previewIdx]?.name ?? "Creator"},<br />
                          <br />
                          我是 MyBrand 的 Sarah，非常欣赏您在{" "}
                          {list[previewIdx]?.platform ?? "TikTok"} 上的内容创作。希望邀请您参与我们
                          Q2 夏季新品的合作推广...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Step 3: Summary ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#e8e6dc] bg-[#faf9f5] p-5">
                <h3 className="mb-4 font-medium text-[#141413]">发送摘要</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#87867f]">建联博主</span>
                    <span className="font-medium text-[#141413]">{list.length} 位</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#87867f]">使用模板</span>
                    <span className="font-medium text-[#141413]">{selectedTpl?.name ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#87867f]">发件账号</span>
                    <span className="font-medium text-[#141413]">marketing@mybrand.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#87867f]">计划发送</span>
                    <span className="font-medium text-[#141413]">立即发送</span>
                  </div>
                </div>
              </div>

              {/* Creator list preview */}
              <div>
                <p className="mb-2 text-xs text-[#87867f]">将建联以下博主</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 rounded-full border border-[#e8e6dc] bg-white px-2.5 py-1"
                    >
                      <img
                        src={avatarSrc(c.id)}
                        alt={c.name}
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-full bg-[#fdf0e8]"
                      />
                      <span className="text-[11px] text-[#4d4c48]">{c.handle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e8e6dc] px-6 py-4">
          {step === 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#e8e6dc] py-2.5 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
              >
                取消
              </button>
              <button
                type="button"
                disabled={list.length === 0}
                onClick={() => setStep(2)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#141413] py-2.5 text-sm font-medium text-white hover:bg-[#2a2a28] disabled:opacity-40"
              >
                下一步：选择模板
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-[#e8e6dc] py-2.5 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
              >
                返回
              </button>
              <button
                type="button"
                disabled={selTemplate === null}
                onClick={() => setStep(3)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#141413] py-2.5 text-sm font-medium text-white hover:bg-[#2a2a28] disabled:opacity-40"
              >
                下一步：确认发送
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-[#e8e6dc] py-2.5 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
              >
                返回
              </button>
              <button
                type="button"
                onClick={() => onComplete(list.map((c) => c.id))}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#c96442] py-2.5 text-sm font-medium text-white hover:bg-[#b85a3b]"
              >
                <Send className="h-3.5 w-3.5" />
                启动发送
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function FilterChip({
  label,
  active,
  open,
  onToggle,
  extraPadding = false,
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  extraPadding?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors",
          active
            ? "border-[#c96442]/30 bg-[#fdf5f0] text-[#c96442]"
            : "border-[#e8e6dc] bg-white text-[#4d4c48] hover:bg-[#f5f4ed]",
        )}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          className={cn(
            "absolute top-full left-0 z-30 mt-1 min-w-[140px] rounded-xl border border-[#e8e6dc] bg-white shadow-lg",
            extraPadding ? "p-2" : "py-1",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ChipItem({
  label,
  active = false,
  onClick,
  prefix,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  prefix?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-[#f5f4ed]",
        active ? "font-medium text-[#c96442]" : "text-[#4d4c48]",
      )}
    >
      {prefix}
      {label}
    </button>
  );
}

// ── ImportModal: 3-step creator import flow ───────────────────────────────────
type ImportMethod = "profile" | "post" | "csv";
type ImportStep = "method" | "preview" | "assign";
type ImportRowStatus = "ok" | "warn" | "error";

interface ImportRow {
  key: string;
  handle: string;
  platform: "TikTok" | "Instagram" | "YouTube" | "";
  followers: number | null;
  avgViews: number | null;
  avgLikes: number | null;
  tags: string[];
  status: ImportRowStatus;
  statusNote: string;
}

const MOCK_PREVIEW_ROWS: ImportRow[] = [
  {
    key: "imp_skincare_sam",
    handle: "@skincare_sam",
    platform: "TikTok",
    followers: 320000,
    avgViews: 45000,
    avgLikes: 3200,
    tags: ["测评", "护肤"],
    status: "ok",
    statusNote: "信息完整，可直接导入",
  },
  {
    key: "imp_fit_jenny",
    handle: "@fit_jenny",
    platform: "TikTok",
    followers: 89000,
    avgViews: 52000,
    avgLikes: 4100,
    tags: ["健身"],
    status: "ok",
    statusNote: "信息完整，可直接导入",
  },
  {
    key: "imp_glow_girl",
    handle: "@glow_girl",
    platform: "Instagram",
    followers: 156000,
    avgViews: null,
    avgLikes: null,
    tags: ["护肤"],
    status: "warn",
    statusNote: "部分字段缺失，可手动填写",
  },
  {
    key: "imp_unknown_user",
    handle: "@unknown_user",
    platform: "",
    followers: null,
    avgViews: null,
    avgLikes: null,
    tags: [],
    status: "error",
    statusNote: "链接无效，该行置灰，无法导入",
  },
];

function fmtCount(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function ImportModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (imported: Creator[], targetProjectId: string) => void;
}) {
  const { projects, currentProjectId, openCreateProject, resolveProjectName } =
    useWorkspaceProject();
  const { openCreatorProfile } = useCreatorProfile();
  const [step, setStep] = useState<ImportStep>("method");
  const [method, setMethod] = useState<ImportMethod>("profile");
  const [profileText, setProfileText] = useState("");
  const [postText, setPostText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Step 2 — preview
  const [fetching, setFetching] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  // Step 3 — assign
  const importableProjects = projects;
  const [targetProject, setTargetProject] = useState<string>(currentProjectId);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [initStatus, setInitStatus] = useState<"待评估">("待评估");

  const validRows = rows.filter((r) => r.status !== "error");
  const okCount = rows.filter((r) => r.status === "ok").length;
  const warnCount = rows.filter((r) => r.status === "warn").length;
  const errCount = rows.filter((r) => r.status === "error").length;

  const handleFetch = () => {
    setFetching(true);
    setRows([]);
    // Simulated row-by-row fetch (800ms total, rows appear progressively)
    MOCK_PREVIEW_ROWS.forEach((r, i) => {
      setTimeout(
        () => {
          setRows((prev) => [...prev, r]);
          if (i === MOCK_PREVIEW_ROWS.length - 1) setFetching(false);
        },
        200 * (i + 1),
      );
    });
  };

  const handleNextFromMethod = () => {
    setStep("preview");
    handleFetch();
  };

  const handleRowEdit = (key: string, field: keyof ImportRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const patch: Partial<ImportRow> = {};
        if (field === "followers" || field === "avgViews" || field === "avgLikes") {
          const n = Number(value.replace(/[^\d]/g, ""));
          patch[field] = Number.isFinite(n) && n > 0 ? n : null;
        } else if (field === "platform") {
          patch.platform = value as ImportRow["platform"];
        } else if (field === "handle") {
          patch.handle = value;
        }
        // Re-check status (warn → ok when all fields filled)
        const updated = { ...r, ...patch } as ImportRow;
        if (
          updated.status === "warn" &&
          updated.followers &&
          updated.avgViews &&
          updated.avgLikes
        ) {
          updated.status = "ok";
          updated.statusNote = "信息完整，可直接导入";
        }
        return updated;
      }),
    );
    setEditingCell(null);
  };

  const handleSkipErrors = () => {
    setRows((prev) => prev.filter((r) => r.status !== "error"));
  };

  useEffect(() => {
    if (!importableProjects.some((project) => project.id === targetProject)) {
      setTargetProject(currentProjectId);
    }
  }, [currentProjectId, importableProjects, targetProject]);

  const handleConfirmImport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const targetProjectName = resolveProjectName(targetProject);
    const imported: Creator[] = validRows.map((r) => {
      const idRaw = r.handle.replace(/^@/, "");
      return {
        id: idRaw,
        handle: r.handle,
        name: idRaw.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
        platform: r.platform || "TikTok",
        region: "🇺🇸",
        followers: r.followers ?? 0,
        avgViews: r.avgViews ?? 0,
        avgLikes: r.avgLikes ?? 0,
        tags: customTags.length ? customTags : r.tags,
        status: initStatus,
        source: "手动导入",
        project: targetProjectName,
        projectId: targetProject,
        addedAt: today,
      };
    });
    onComplete(imported, targetProject);
  };

  const STEP_META: Record<ImportStep, { index: number; title: string; subtitle: string }> = {
    method: { index: 1, title: "选择导入方式", subtitle: "选择导入方式，系统将自动抓取博主数据" },
    preview: { index: 2, title: "抓取预览", subtitle: "检查数据完整性，编辑缺失字段" },
    assign: { index: 3, title: "分配到项目", subtitle: "确认项目归属与初始状态" },
  };
  const meta = STEP_META[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-[600px] flex-col overflow-hidden rounded-3xl border border-[#e8e6dc] bg-[#faf9f5] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e6dc] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#fbf5ed] ring-1 ring-[#f5e4d1]">
              <Upload className="h-4 w-4 text-[#c96442]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#141413]">导入博主名单</h3>
                <span className="rounded-full bg-[#fbf5ed] px-2 py-0.5 text-[10px] font-medium text-[#c96442] ring-1 ring-[#f5e4d1]">
                  Step {meta.index} / 3
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#87867f]">{meta.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#87867f] hover:bg-[#f5f4ed] hover:text-[#4d4c48]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 border-b border-[#e8e6dc] bg-white/60 px-6 py-2.5">
          {(["method", "preview", "assign"] as ImportStep[]).map((s, i) => {
            const m = STEP_META[s];
            const isActive = step === s;
            const isPast = STEP_META[step].index > m.index;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                    isActive
                      ? "bg-[#c96442] text-white"
                      : isPast
                        ? "bg-[#c96442]/20 text-[#c96442]"
                        : "bg-[#f0ece4] text-[#87867f]",
                  )}
                >
                  {isPast ? <Check className="h-3 w-3" /> : m.index}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    isActive ? "font-medium text-[#141413]" : "text-[#87867f]",
                  )}
                >
                  {m.title}
                </span>
                {i < 2 && <div className="mx-1 h-px w-6 bg-[#e8e6dc]" />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "method" && (
            <div className="space-y-3">
              {/* Option 1 — Profile links */}
              <MethodOption
                active={method === "profile"}
                onClick={() => setMethod("profile")}
                icon={<Link2 className="h-4 w-4" />}
                title="粘贴主页链接"
                badge="推荐"
                desc="支持 TikTok / Instagram / YouTube 个人主页链接"
              >
                {method === "profile" && (
                  <div className="mt-3 space-y-1.5">
                    <textarea
                      value={profileText}
                      onChange={(e) => setProfileText(e.target.value)}
                      rows={4}
                      placeholder={
                        "每行粘贴一个链接，支持批量输入\nhttps://www.tiktok.com/@skincare_sam\nhttps://www.instagram.com/fit_jenny\n..."
                      }
                      className="w-full rounded-xl border border-[#e8e6dc] bg-white px-3.5 py-2.5 font-mono text-xs text-[#141413] placeholder:text-[#c8c7c3] focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/15 focus:outline-none"
                    />
                    <p className="text-[10px] text-[#87867f]">提示：最多一次导入 50 位博主</p>
                  </div>
                )}
              </MethodOption>

              {/* Option 2 — Post links */}
              <MethodOption
                active={method === "post"}
                onClick={() => setMethod("post")}
                icon={<FileText className="h-4 w-4" />}
                title="粘贴作品链接"
                desc="粘贴某条内容链接，系统自动反查博主信息"
              >
                {method === "post" && (
                  <div className="mt-3">
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={4}
                      placeholder={
                        "https://www.tiktok.com/@user/video/123...\nhttps://www.instagram.com/p/ABC...\n..."
                      }
                      className="w-full rounded-xl border border-[#e8e6dc] bg-white px-3.5 py-2.5 font-mono text-xs text-[#141413] placeholder:text-[#c8c7c3] focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/15 focus:outline-none"
                    />
                  </div>
                )}
              </MethodOption>

              {/* Option 3 — CSV upload */}
              <MethodOption
                active={method === "csv"}
                onClick={() => setMethod("csv")}
                icon={<UploadCloud className="h-4 w-4" />}
                title="上传 CSV"
                desc="下载模板后填写，支持批量导入"
              >
                {method === "csv" && (
                  <div className="mt-3 space-y-2.5">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-xl border border-[#e8e6dc] bg-white px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      下载 CSV 模板
                    </button>
                    <label
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
                        fileName
                          ? "border-[#c96442]/40 bg-[#fbf5ed]/60"
                          : "border-[#e8e6dc] bg-white/50 hover:border-[#c96442]/30 hover:bg-[#faf9f5]",
                      )}
                    >
                      <UploadCloud
                        className={cn("h-5 w-5", fileName ? "text-[#c96442]" : "text-[#87867f]")}
                      />
                      {fileName ? (
                        <>
                          <span className="text-xs font-medium text-[#141413]">{fileName}</span>
                          <span className="text-[10px] text-[#87867f]">点击替换文件</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-[#4d4c48]">拖拽或点击上传 CSV</span>
                          <span className="text-[10px] text-[#87867f]">
                            模板必填列：@ID · 平台 · 可选列：粉丝数 / 均播放 / 均点赞 / 标签
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                      />
                    </label>
                  </div>
                )}
              </MethodOption>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {/* Fetch progress */}
              <div className="rounded-2xl border border-[#e8e6dc] bg-white p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#141413]">正在抓取博主数据…</span>
                  <span className="text-[#87867f]">
                    {rows.length} / {MOCK_PREVIEW_ROWS.length}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {(fetching ? MOCK_PREVIEW_ROWS : rows).map((r) => {
                    const loaded = rows.find((x) => x.key === r.key);
                    return (
                      <div key={r.key} className="flex items-center gap-2 text-[11px]">
                        {!loaded ? (
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#c96442]/30 border-t-[#c96442]" />
                        ) : loaded.status === "ok" ? (
                          <Check className="h-3 w-3 text-[#5a6a4a]" />
                        ) : loaded.status === "warn" ? (
                          <AlertTriangle className="h-3 w-3 text-[#c96442]" />
                        ) : (
                          <X className="h-3 w-3 text-[#c96442]" />
                        )}
                        <span className="font-mono text-[#4d4c48]">{r.handle}</span>
                        {loaded && (
                          <span className="text-[#87867f]">
                            {loaded.status === "ok"
                              ? "完成"
                              : loaded.status === "warn"
                                ? "部分信息缺失"
                                : "链接无效"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!fetching && (
                  <div className="mt-3 flex items-center gap-3 border-t border-[#f0ece4] pt-2.5 text-[11px]">
                    <span className="flex items-center gap-1 text-[#5a6a4a]">
                      <Check className="h-3 w-3" />
                      {okCount} 成功
                    </span>
                    <span className="flex items-center gap-1 text-[#c96442]">
                      <AlertTriangle className="h-3 w-3" />
                      {warnCount} 警告
                    </span>
                    <span className="flex items-center gap-1 text-[#87867f]">
                      <X className="h-3 w-3" />
                      {errCount} 失败
                    </span>
                  </div>
                )}
              </div>

              {/* Preview table */}
              {!fetching && rows.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-[#e8e6dc] bg-white">
                  <div className="grid grid-cols-[24px_minmax(0,1.6fr)_88px_72px_72px_72px] gap-2 border-b border-[#e8e6dc] bg-[#faf9f5] px-3 py-2 text-[10px] font-medium tracking-wide text-[#87867f] uppercase">
                    <span></span>
                    <span>博主</span>
                    <span>平台</span>
                    <span className="text-right">粉丝</span>
                    <span className="text-right">均播放</span>
                    <span className="text-right">均点赞</span>
                  </div>
                  {rows.map((r) => {
                    const isErr = r.status === "error";
                    const isWarn = r.status === "warn";
                    return (
                      <div
                        key={r.key}
                        className={cn(
                          "grid grid-cols-[24px_minmax(0,1.6fr)_88px_72px_72px_72px] items-center gap-2 border-b border-[#f0ece4] px-3 py-2 text-xs last:border-0",
                          isErr && "bg-[#f5f4ed]/60 opacity-50",
                          isWarn && "bg-[#fbf5ed]/40",
                        )}
                      >
                        <span>
                          {r.status === "ok" && <Check className="h-3 w-3 text-[#5a6a4a]" />}
                          {r.status === "warn" && (
                            <AlertTriangle className="h-3 w-3 text-[#c96442]" />
                          )}
                          {r.status === "error" && <X className="h-3 w-3 text-[#87867f]" />}
                        </span>
                        <div className="flex min-w-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openCreatorProfile({
                                name: r.handle,
                                handle: r.handle,
                                avatarUrl: avatarSrc(r.handle.replace("@", "")),
                                region: "--",
                                followers: r.followers != null ? fmtFollowers(r.followers) : "--",
                                er: "--",
                              })
                            }
                            className="shrink-0 rounded-full transition-transform hover:scale-110 focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1 focus:outline-none"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={avatarSrc(r.handle.replace("@", ""))}
                              alt=""
                              className="h-6 w-6 rounded-full ring-1 ring-[#e8e6dc]"
                            />
                          </button>
                          <span
                            className={cn(
                              "truncate font-mono",
                              isErr ? "text-[#87867f]" : "text-[#141413]",
                            )}
                          >
                            {r.handle}
                          </span>
                        </div>
                        <span className={cn(r.platform ? "text-[#4d4c48]" : "text-[#c96442]")}>
                          {r.platform || "未知"}
                        </span>
                        {(["followers", "avgViews", "avgLikes"] as const).map((f) => {
                          const cellKey = `${r.key}-${f}`;
                          const isEditing = editingCell === cellKey;
                          const value = r[f];
                          const missing = value === null;
                          if (isEditing) {
                            return (
                              <input
                                key={f}
                                autoFocus
                                type="text"
                                defaultValue={value === null ? "" : String(value)}
                                onBlur={(e) => handleRowEdit(r.key, f, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleRowEdit(r.key, f, (e.target as HTMLInputElement).value);
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                className="w-full rounded-md border border-[#c96442]/40 bg-white px-1.5 py-0.5 text-right text-xs focus:outline-none"
                              />
                            );
                          }
                          return (
                            <button
                              key={f}
                              type="button"
                              disabled={isErr}
                              onClick={() => isWarn && missing && setEditingCell(cellKey)}
                              className={cn(
                                "rounded-md text-right font-medium transition-colors",
                                missing &&
                                  isWarn &&
                                  "bg-[#fbf5ed] px-1.5 py-0.5 text-[#c96442] ring-1 ring-[#f5e4d1] hover:bg-[#f5e4d1]",
                                !missing && "text-[#141413]",
                                isErr && "text-[#87867f]",
                              )}
                            >
                              {fmtCount(value)}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {errCount > 0 && !fetching && (
                <p className="text-[11px] text-[#87867f]">
                  <AlertTriangle className="mr-1 inline-block h-3 w-3 text-[#c96442]" />
                  黄色警告行可在表格内直接点击编辑缺失字段。灰色失败行将被跳过。
                </p>
              )}
            </div>
          )}

          {step === "assign" && (
            <div className="space-y-4">
              {/* Target project */}
              <div>
                <label className="text-xs font-medium text-[#4d4c48]">
                  归属项目 <span className="text-[#c96442]">*</span>
                </label>
                <select
                  value={targetProject}
                  onChange={(e) => setTargetProject(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e8e6dc] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/15 focus:outline-none"
                >
                  {importableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openCreateProject("quick")}
                    className="rounded-xl border border-[#e8e6dc] px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]"
                  >
                    快捷新建项目
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateProject("detailed")}
                    className="rounded-xl border border-dashed border-[#e8e6dc] px-3 py-1.5 text-xs text-[#87867f] hover:border-[#c96442]/35 hover:text-[#c96442]"
                  >
                    详细新建
                  </button>
                </div>
              </div>

              {/* Custom tags */}
              <div>
                <label className="text-xs font-medium text-[#4d4c48]">自定义标签（可选）</label>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#e8e6dc] bg-white px-2.5 py-2">
                  {customTags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 rounded-full bg-[#fbf5ed] px-2 py-0.5 text-[11px] text-[#c96442] ring-1 ring-[#f5e4d1]"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => setCustomTags((prev) => prev.filter((x) => x !== t))}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTag.trim()) {
                        setCustomTags((prev) => [...prev, newTag.trim()]);
                        setNewTag("");
                      }
                    }}
                    placeholder={
                      customTags.length ? "" : "+ 添加标签，回车确认（已选：护肤 / 美妆）"
                    }
                    className="min-w-[140px] flex-1 bg-transparent text-xs text-[#141413] placeholder:text-[#87867f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial status */}
              <div>
                <label className="text-xs font-medium text-[#4d4c48]">导入后状态</label>
                <div className="mt-1.5 space-y-1.5">
                  {(["待评估"] as const).map((s) => (
                    <label
                      key={s}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors",
                        initStatus === s
                          ? "border-[#c96442]/40 bg-[#fbf5ed]/60"
                          : "border-[#e8e6dc] bg-white hover:bg-[#faf9f5]",
                      )}
                    >
                      <input
                        type="radio"
                        checked={initStatus === s}
                        onChange={() => setInitStatus(s)}
                        className="h-3.5 w-3.5 accent-[#c96442]"
                      />
                      <span
                        className={cn(
                          "font-medium",
                          initStatus === s ? "text-[#c96442]" : "text-[#141413]",
                        )}
                      >
                        设为待评估
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-[#e8e6dc] bg-white p-4">
                <p className="mb-2 text-xs font-medium text-[#141413]">导入预览摘要</p>
                <ul className="space-y-1 text-[11px] text-[#5e5d59]">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-[#5a6a4a]" />
                    将导入 <span className="font-semibold text-[#141413]">
                      {validRows.length}
                    </span>{" "}
                    位博主至「
                    <span className="font-medium text-[#c96442]">
                      {resolveProjectName(targetProject)}
                    </span>
                    」
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-[#5a6a4a]" />
                    来源标注为：手动导入
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-[#5a6a4a]" />
                    默认状态：<span className="text-[#141413]">{initStatus}</span>
                  </li>
                  {customTags.length > 0 && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#5a6a4a]" />
                      <span>
                        附加标签：<span className="text-[#141413]">{customTags.join(" · ")}</span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e8e6dc] bg-[#f5f4ed] px-6 py-3.5">
          {step === "method" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#faf9f5]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleNextFromMethod}
                className="flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white hover:bg-[#b85a3b]"
              >
                下一步：抓取数据 <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : step === "preview" ? (
            <>
              <button
                type="button"
                onClick={() => setStep("method")}
                className="flex items-center gap-1 rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#faf9f5]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> 返回
              </button>
              <div className="flex gap-2">
                {errCount > 0 && (
                  <button
                    type="button"
                    onClick={handleSkipErrors}
                    className="rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#faf9f5]"
                  >
                    跳过无效项，继续
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep("assign")}
                  disabled={fetching || validRows.length === 0}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    fetching || validRows.length === 0
                      ? "cursor-not-allowed bg-[#e8e6dc] text-[#87867f]"
                      : "bg-[#c96442] text-white hover:bg-[#b85a3b]",
                  )}
                >
                  下一步 <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="flex items-center gap-1 rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#faf9f5]"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> 返回
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white hover:bg-[#b85a3b]"
              >
                <Check className="h-3.5 w-3.5" /> 确认导入 {validRows.length} 位博主
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MethodOption({
  active,
  onClick,
  icon,
  title,
  badge,
  desc,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all",
        active
          ? "border-[#c96442]/40 bg-white shadow-[0_4px_16px_-8px_rgba(201,100,66,0.25)]"
          : "border-[#e8e6dc] bg-white/60 hover:border-[#c96442]/20 hover:bg-white",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
            active
              ? "bg-[#fbf5ed] text-[#c96442] ring-1 ring-[#f5e4d1]"
              : "bg-[#faf9f5] text-[#87867f] ring-1 ring-[#e8e6dc]",
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn("text-sm font-medium", active ? "text-[#141413]" : "text-[#4d4c48]")}
            >
              {title}
            </span>
            {badge && (
              <span className="rounded-full bg-[#fbf5ed] px-2 py-0.5 text-[10px] font-medium text-[#c96442] ring-1 ring-[#f5e4d1]">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-[#87867f]">{desc}</p>
        </div>
        <div
          className={cn(
            "mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
            active ? "border-[#c96442] bg-[#c96442]" : "border-[#e8e6dc]",
          )}
        >
          {active && <div className="m-0.5 h-2 w-2 rounded-full bg-white" />}
        </div>
      </button>
      {children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
