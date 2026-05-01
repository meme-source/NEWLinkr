"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Chrome,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileImage,
  FileUp,
  Mail,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Radar,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  formatProjectBudget,
  formatProjectTimeline,
  useWorkspaceProject,
} from "@/features/project/components/project-context";
import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { cn } from "@/lib/utils";

type TabKey = "project" | "team" | "billing" | "integrations";

// ── Shared data ────────────────────────────────────────────────────────────────
const BILLING_HISTORY = [
  { date: "04-14", item: "Pro 月度续费", amount: "$99", status: "已支付" },
  { date: "03-14", item: "Pro 月度续费", amount: "$99", status: "已支付" },
  { date: "02-14", item: "首次订阅", amount: "$99", status: "已支付" },
];

type UsageIconKey = "search" | "mail" | "download" | "radar" | "users";

const USAGE_QUOTA: {
  label: string;
  used: number;
  quota: number;
  unit: string;
  icon: UsageIconKey;
}[] = [
  { label: "博主搜索", used: 45, quota: 100, unit: "次", icon: "search" },
  { label: "邮件发送", used: 128, quota: 1000, unit: "封", icon: "mail" },
  { label: "导出次数", used: 12, quota: 100, unit: "次", icon: "download" },
  { label: "投放追踪", used: 3, quota: 50, unit: "条", icon: "radar" },
  { label: "团队成员", used: 3, quota: 5, unit: "人", icon: "users" },
];

const USAGE_ICON_MAP: Record<UsageIconKey, React.ComponentType<{ className?: string }>> = {
  search: Search,
  mail: Mail,
  download: Download,
  radar: Radar,
  users: Users,
};

// ── Tracking data (merged from tracking page) ──────────────────────────────────
type TrackingStatus = "growing" | "stable" | "anomaly" | "stopped";

interface TrackingItem {
  id: number;
  creator: string;
  avatar: string;
  seed: string;
  platform: "TikTok" | "Instagram" | "YouTube";
  title: string;
  publishedAt: string;
  cost: string;
  views: string;
  viewsRaw: number;
  dailyDelta: string;
  likes: string;
  likesRaw: number;
  comments: string;
  commentsRaw: number;
  shares: string;
  sharesRaw: number;
  cpm: string;
  cpe: string;
  avgCPM: string;
  cpmDelta: "optimal" | "worse";
  trend: TrackingStatus;
  trendLabel: string;
  chartData: number[];
  stoppedAt: string | null;
}

const TRACKING_ITEMS: TrackingItem[] = [
  {
    id: 1,
    creator: "@skincare_sam",
    avatar: "S",
    seed: "skincare_sam",
    platform: "TikTok",
    title: "XX 品牌深度测评 · 晚间护肤 routine",
    publishedAt: "04-20",
    cost: "$2,800",
    views: "180K",
    viewsRaw: 180000,
    dailyDelta: "+8K/日",
    likes: "12K",
    likesRaw: 12000,
    comments: "890",
    commentsRaw: 890,
    shares: "2.3K",
    sharesRaw: 2300,
    cpm: "$15.6",
    cpe: "$0.13",
    avgCPM: "$19.6",
    cpmDelta: "optimal",
    trend: "growing",
    trendLabel: "增长中 · 日均 +8K 播放",
    chartData: [20, 45, 80, 120, 150, 165, 180],
    stoppedAt: null,
  },
  {
    id: 2,
    creator: "@fit_jenny",
    avatar: "F",
    seed: "fit_jenny",
    platform: "TikTok",
    title: "健身后必备好物分享",
    publishedAt: "04-18",
    cost: "$720",
    views: "95K",
    viewsRaw: 95000,
    dailyDelta: "+0.5K/日",
    likes: "7.8K",
    likesRaw: 7800,
    comments: "562",
    commentsRaw: 562,
    shares: "1.8K",
    sharesRaw: 1800,
    cpm: "$7.6",
    cpe: "$0.07",
    avgCPM: "$19.6",
    cpmDelta: "optimal",
    trend: "stable",
    trendLabel: "已稳定 · 播放量趋于平稳",
    chartData: [15, 30, 55, 70, 80, 88, 95],
    stoppedAt: null,
  },
  {
    id: 3,
    creator: "@glow_girl",
    avatar: "G",
    seed: "glow_girl",
    platform: "Instagram",
    title: "我的晚间护肤 routine",
    publishedAt: "04-22",
    cost: "$1,500",
    views: "42K",
    viewsRaw: 42000,
    dailyDelta: "增速骤停",
    likes: "2.1K",
    likesRaw: 2100,
    comments: "98",
    commentsRaw: 98,
    shares: "320",
    sharesRaw: 320,
    cpm: "$35.7",
    cpe: "$0.59",
    avgCPM: "$19.6",
    cpmDelta: "worse",
    trend: "anomaly",
    trendLabel: "异常 · 48 小时播放增速骤停",
    chartData: [10, 28, 38, 40, 41, 41, 42],
    stoppedAt: null,
  },
  {
    id: 4,
    creator: "@style_nina",
    avatar: "N",
    seed: "style_nina",
    platform: "Instagram",
    title: "春夏穿搭 · 通勤 lookbook",
    publishedAt: "04-14",
    cost: "$900",
    views: "31K",
    viewsRaw: 31000,
    dailyDelta: "—",
    likes: "1.5K",
    likesRaw: 1500,
    comments: "210",
    commentsRaw: 210,
    shares: "450",
    sharesRaw: 450,
    cpm: "$29.0",
    cpe: "$0.44",
    avgCPM: "$19.6",
    cpmDelta: "worse",
    trend: "stopped",
    trendLabel: "已停止 · 停止于 04-22",
    chartData: [8, 15, 22, 26, 28, 30, 31],
    stoppedAt: "04-22",
  },
];

// Claude design — warm-toned status palette
const STATUS_STYLES = {
  growing: {
    cardBg: "bg-[#faf9f5]",
    chartBg: "bg-gradient-to-br from-[#f0ebdc] to-[#faf9f5]",
    chartStop: "#8a9a7a",
    accent: "#7a8a6a",
    dot: "bg-[#7a8a6a]",
    label: "增长中",
    tagBg: "bg-[#e8ebd9] text-[#5a6a4a]",
  },
  stable: {
    cardBg: "bg-[#faf9f5]",
    chartBg: "bg-gradient-to-br from-[#efece2] to-[#faf9f5]",
    chartStop: "#8a8880",
    accent: "#5e5d59",
    dot: "bg-[#87867f]",
    label: "已稳定",
    tagBg: "bg-[#ebe9df] text-[#5e5d59]",
  },
  anomaly: {
    cardBg: "bg-[#fbf5ed]",
    chartBg: "bg-gradient-to-br from-[#f5e4d1] to-[#fbf5ed]",
    chartStop: "#c96442",
    accent: "#c96442",
    dot: "bg-[#c96442]",
    label: "异常",
    tagBg: "bg-[#f5e4d1] text-[#a14a2e]",
  },
  stopped: {
    cardBg: "bg-[#f5f4ed]",
    chartBg: "bg-gradient-to-br from-[#ebe9df] to-[#f5f4ed]",
    chartStop: "#a8a7a0",
    accent: "#87867f",
    dot: "bg-[#b0aea6]",
    label: "已停止",
    tagBg: "bg-[#ebe9df] text-[#87867f]",
  },
} as const;

function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&backgroundColor=f0ebdc,ebe9df,f5e4d1&radius=50`;
}

function trackingItemToProfile(item: TrackingItem) {
  return {
    name: item.creator,
    handle: item.creator,
    avatarUrl: avatarUrl(item.seed),
    region: "--",
    followers: item.views,
    er: "--",
    platform: item.platform.toLowerCase() as "tiktok" | "instagram" | "youtube",
  };
}

function thumbnailUrl(seed: string): string {
  return `https://picsum.photos/seed/${seed}/480/600`;
}

function TrendLineChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 100,
    w = 400;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 8) - 4}`);
  const polyPts = pts.join(" ");
  const areaPath =
    `M ${pts[0]} ` +
    pts
      .slice(1)
      .map((p) => `L ${p}`)
      .join(" ") +
    ` L ${(data.length - 1) * step},${h} L 0,${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <polyline
        points={polyPts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - ((v - min) / range) * (h - 8) - 4}
          r={3}
          fill="white"
          stroke={color}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

// Bento area chart — clean gradient fill, no axes
function BentoAreaChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 80,
    w = 320,
    pad = 4;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - pad * 2) - pad}`);
  const polyPts = pts.join(" ");
  const areaPath =
    `M ${pts[0]} ` +
    pts
      .slice(1)
      .map((p) => `L ${p}`)
      .join(" ") +
    ` L ${(data.length - 1) * step},${h} L 0,${h} Z`;
  const gid = `bento-grad-${color.replace("#", "")}`;
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <polyline
        points={polyPts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Small donut for interaction breakdown
function InteractionDonut({
  likes,
  comments,
  shares,
}: {
  likes: number;
  comments: number;
  shares: number;
}) {
  const total = likes + comments + shares;
  const r = 26,
    c = 2 * Math.PI * r;
  const seg = (v: number) => (v / total) * c;
  const likeLen = seg(likes);
  const commentLen = seg(comments);
  const shareLen = seg(shares);
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#f0ebdc" strokeWidth="8" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#c96442"
        strokeWidth="8"
        strokeDasharray={`${likeLen} ${c}`}
        strokeLinecap="butt"
        transform="rotate(-90 36 36)"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#8a9a7a"
        strokeWidth="8"
        strokeDasharray={`${commentLen} ${c}`}
        strokeDashoffset={-likeLen}
        strokeLinecap="butt"
        transform="rotate(-90 36 36)"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#b8a88a"
        strokeWidth="8"
        strokeDasharray={`${shareLen} ${c}`}
        strokeDashoffset={-(likeLen + commentLen)}
        strokeLinecap="butt"
        transform="rotate(-90 36 36)"
      />
    </svg>
  );
}

function TikTokGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z" />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21.3 7.2a2.8 2.8 0 0 0-2-2C17.6 4.7 12 4.7 12 4.7s-5.6 0-7.3.5a2.8 2.8 0 0 0-2 2A29.5 29.5 0 0 0 2.2 12c0 1.6.2 3.2.5 4.8a2.8 2.8 0 0 0 2 2c1.7.5 7.3.5 7.3.5s5.6 0 7.3-.5a2.8 2.8 0 0 0 2-2c.3-1.6.5-3.2.5-4.8s-.2-3.2-.5-4.8Z"
        fill="currentColor"
      />
      <path d="m10 15.5 5-3.5-5-3.5v7Z" fill="#fff" />
    </svg>
  );
}

// ── Project data ───────────────────────────────────────────────────────────────
interface SettingsProjectCard {
  name: string;
  creatorCount: number;
  dateRange: string;
  kpi: { label: string; value: string; sub: string }[];
  tracking: typeof TRACKING_ITEMS;
  product: { name: string; category: string; brand: string; link: string };
  platforms: string[];
}

const INIT_SETTINGS_PROJECT_CARDS: SettingsProjectCard[] = [
  {
    name: "Q2夏季 Campaign",
    creatorCount: 96,
    dateRange: "04-01/06-30",
    kpi: [
      { label: "总投放花费", value: "$5.0K", sub: "3 条合作" },
      { label: "总曝光量", value: "317K", sub: "累计播放" },
      { label: "平均 CPM", value: "$19.6", sub: "本月" },
      { label: "综合互动率", value: "5.2%", sub: "+0.8% vs 上月" },
    ],
    tracking: TRACKING_ITEMS,
    product: {
      name: "防蓝光护眼面霜",
      category: "美妆护肤",
      brand: "MyBrand",
      link: "https://www.mybrand.com/product",
    },
    platforms: ["TikTok", "Instagram"],
  },
  {
    name: "美妆博主池",
    creatorCount: 5,
    dateRange: "",
    kpi: [
      { label: "总投放花费", value: "$2.1K", sub: "1 条合作" },
      { label: "总曝光量", value: "95K", sub: "累计播放" },
      { label: "平均 CPM", value: "$22.1", sub: "本月" },
      { label: "综合互动率", value: "4.8%", sub: "持平 vs 上月" },
    ],
    tracking: [TRACKING_ITEMS[1]],
    product: {
      name: "持久遮瑕粉底液",
      category: "彩妆",
      brand: "GlowLab",
      link: "https://www.glowlab.com/product",
    },
    platforms: ["TikTok", "Instagram", "YouTube"],
  },
];

// ── Detail Drawer ──────────────────────────────────────────────────────────────
function DetailDrawer({
  item,
  onClose,
}: {
  item: (typeof TRACKING_ITEMS)[0];
  onClose: () => void;
}) {
  const { openCreatorProfile } = useCreatorProfile();
  const [range, setRange] = useState<"7天" | "30天">("7天");
  const trendColor =
    item.trend === "growing" ? "#10b981" : item.trend === "anomaly" ? "#f59e0b" : "#87867f";

  const data30 = [
    item.chartData[0],
    ...item.chartData,
    item.chartData[6] + 5,
    item.chartData[6] + 12,
    item.chartData[6] + 8,
    item.chartData[6] + 18,
    item.chartData[6] + 15,
    item.chartData[6] + 22,
    item.chartData[6] + 19,
    item.chartData[6] + 28,
    item.chartData[6] + 25,
    item.chartData[6] + 24,
    item.chartData[6] + 30,
    item.chartData[6] + 32,
    item.chartData[6] + 29,
    item.chartData[6] + 35,
    item.chartData[6] + 33,
    item.chartData[6] + 38,
    item.chartData[6] + 36,
    item.chartData[6] + 42,
    item.chartData[6] + 38,
    item.chartData[6] + 44,
    item.chartData[6] + 40,
  ];
  const chartData = range === "7天" ? item.chartData : data30;
  const mediaCPM = `$${(parseFloat(item.cpm.replace("$", "")) * 0.85).toFixed(1)}`;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e8e6dc] px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => openCreatorProfile(trackingItemToProfile(item))}
              className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-[#e8e6dc] transition-transform hover:scale-105 focus:ring-2 focus:ring-[#c96442] focus:ring-offset-2 focus:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl(item.seed)}
                alt={item.creator}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#141413]">{item.creator}</span>
                <span className="rounded-full bg-[#f5f4ed] px-2 py-0.5 text-[10px] text-[#87867f]">
                  {item.platform}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#87867f]">
                发布 {item.publishedAt} · 费用 {item.cost}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#87867f] hover:bg-[#f5f4ed]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* ① 内容信息 */}
          <div>
            <h3 className="mb-3 text-xs font-semibold text-[#141413]">内容信息</h3>
            <div className="overflow-hidden rounded-2xl border border-[#e8e6dc] bg-[#faf9f5]">
              {/* Real thumbnail via picsum seed */}
              <div className="relative h-48 w-full overflow-hidden bg-[#f5f4ed]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailUrl(item.seed)}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 ring-1 ring-white/40 backdrop-blur-sm">
                    <Play className="h-4 w-4 fill-[#141413] text-[#141413]" />
                  </div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <p className="text-sm text-[#141413]">{item.title}</p>
                <a
                  href="#"
                  className="flex shrink-0 items-center gap-1 text-xs text-[#c96442] hover:underline"
                >
                  查看原帖
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="px-4 pb-3 text-[10px] text-[#87867f]">
                发布时间：{item.publishedAt} · 发布平台：{item.platform}
              </p>
            </div>
          </div>

          {/* ② 数据趋势 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#141413]">播放趋势</h3>
              <div className="flex gap-1">
                {(["7天", "30天"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      range === r
                        ? "bg-[#c96442] text-white"
                        : "bg-[#f5f4ed] text-[#87867f] hover:bg-[#e8e6dc]",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#e8e6dc] bg-white px-4 pt-4 pb-4">
              <TrendLineChart data={chartData} color={trendColor} />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[
                { label: "总播放", value: item.views },
                { label: "评论", value: item.comments },
                { label: "分享", value: item.shares },
                { label: "CPM", value: item.cpm },
                { label: "CPE", value: item.cpe },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[#faf9f5] px-2.5 py-2.5 text-center">
                  <div className="text-sm font-semibold text-[#141413]">{s.value}</div>
                  <div className="mt-0.5 text-[10px] text-[#87867f]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ③ 费用对比 */}
          <div>
            <h3 className="mb-3 text-xs font-semibold text-[#141413]">费用对比</h3>
            <div className="rounded-2xl border border-[#e8e6dc] bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#87867f]">本次合作费用</p>
                  <p className="mt-0.5 text-xl font-semibold text-[#141413]">{item.cost}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#87867f]">同类博主中位数</p>
                  <p className="mt-0.5 text-xl font-semibold text-[#87867f]">{mediaCPM}</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0ece4]">
                <div className="h-full rounded-full bg-[#c96442]" style={{ width: "68%" }} />
              </div>
              <p className="mt-2 text-[10px] text-[#87867f]">
                {item.cost} vs 同类博主中位 {mediaCPM}（头部博主最高位）
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Config Drawer ──────────────────────────────────────────────────────────────
function ConfigDrawer({
  project,
  mode,
  onClose,
  onSave,
}: {
  project: SettingsProjectCard;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (nextProject: SettingsProjectCard) => boolean;
}) {
  const [projectName, setProjectName] = useState(project.name);
  const [name, setName] = useState(project.product.name);
  const [category, setCategory] = useState(project.product.category);
  const [brand, setBrand] = useState(project.product.brand);
  const [link, setLink] = useState(project.product.link);
  const [selPlats, setSelPlats] = useState<string[]>(project.platforms);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productImageName, setProductImageName] = useState<string | null>(null);
  const [productInfoName, setProductInfoName] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const infoInputRef = useRef<HTMLInputElement | null>(null);

  const togglePlat = (p: string) =>
    setSelPlats((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handleProductImagePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProductImageName(file.name);
  };

  const handleProductInfoPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProductInfoName(file.name);
  };

  const handleSave = () => {
    if (!projectName.trim()) {
      setError("请先填写项目名称");
      return;
    }

    setError(null);
    const ok = onSave({
      ...project,
      name: projectName.trim(),
      product: {
        name: name.trim(),
        category: category.trim(),
        brand: brand.trim(),
        link: link.trim(),
      },
      platforms: selPlats,
    });
    if (!ok) {
      setError("项目名称已存在，请更换后再保存");
      return;
    }
    setToast(true);
    setTimeout(() => {
      setToast(false);
      onClose();
    }, 1500);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 flex h-full w-[540px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e6dc] px-6 py-4">
          <div>
            <h2 className="font-semibold text-[#141413]">
              {mode === "create" ? "新建项目" : "编辑项目配置"}
            </h2>
            <p className="mt-0.5 text-xs text-[#87867f]">
              {mode === "create" ? "填写项目基础信息后创建项目" : project.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#87867f] hover:bg-[#f5f4ed]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* 项目信息 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#141413]">项目信息</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">项目名称</label>
              <input
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="例如：Q2 夏季 Campaign"
                className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none"
              />
              {error && <p className="mt-2 text-xs text-[#c96442]">{error}</p>}
            </div>
          </div>

          {/* 产品信息 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#141413]">产品信息</h3>
            <div className="space-y-3">
              {[
                { label: "产品名称", value: name, set: setName },
                { label: "品类", value: category, set: setCategory },
                { label: "品牌", value: brand, set: setBrand },
                { label: "产品链接", value: link, set: setLink },
              ].map((f) => (
                <div key={f.label}>
                  <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">
                    {f.label}
                  </label>
                  <input
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 产品图片 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#141413]">产品图片</h3>
            <div className="flex items-start gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[20px] border-2 border-dashed border-[#e8e6dc] bg-[#faf9f5] text-2xl">
                🧴
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#87867f]">
                  建议尺寸 400×400px，支持 PNG、JPG、WebP 等图片格式
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-[#e8e6dc] bg-white px-3 py-2 text-xs font-medium text-[#4d4c48] transition-colors hover:bg-[#f5f4ed] active:scale-[0.98]"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    上传图片
                  </button>
                  <button
                    type="button"
                    onClick={() => infoInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-[#e8e6dc] bg-white px-3 py-2 text-xs font-medium text-[#4d4c48] transition-colors hover:bg-[#f5f4ed] active:scale-[0.98]"
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    上传产品信息
                  </button>
                </div>
                <div className="mt-3 space-y-1.5 text-[11px] text-[#87867f]">
                  <p className="truncate">产品图片：{productImageName ?? "未上传"}</p>
                  <p className="truncate">
                    产品信息：{productInfoName ?? "支持 PDF、PNG、JPG、截图等资料"}
                  </p>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProductImagePick}
                />
                <input
                  ref={infoInputRef}
                  type="file"
                  accept="application/pdf,image/*,.png,.jpg,.jpeg,.webp,.heic"
                  className="hidden"
                  onChange={handleProductInfoPick}
                />
              </div>
            </div>
          </div>

          {/* 目标平台 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#141413]">目标平台</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { id: "TikTok", label: "TikTok", icon: <TikTokGlyph /> },
                { id: "Instagram", label: "Instagram", icon: <InstagramGlyph /> },
                { id: "YouTube", label: "YouTube", icon: <YouTubeGlyph /> },
              ].map((p) => {
                const active = selPlats.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlat(p.id)}
                    title={p.label}
                    aria-label={p.label}
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-[18px] border transition-all duration-150 active:scale-[0.97]",
                      active
                        ? "border-[#c96442]/35 bg-[#fdf5f0] text-[#c96442] shadow-[0_8px_24px_-18px_rgba(201,100,66,0.65)]"
                        : "border-[#e8e6dc] bg-white text-[#87867f] hover:border-[#d8d4c8] hover:bg-[#faf9f5] hover:text-[#4d4c48]",
                    )}
                  >
                    <span className="relative">
                      {p.icon}
                      {active && (
                        <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full border border-white bg-[#c96442]" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-[#87867f]">
              点击平台 Logo 可切换目标平台，当前支持 TikTok、Instagram、YouTube。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e8e6dc] px-6 py-4">
          {toast ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              已保存
            </div>
          ) : (
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
                onClick={handleSave}
                className="flex-1 rounded-xl bg-[#141413] py-2.5 text-sm font-medium text-white hover:bg-[#2a2a28]"
              >
                保存配置
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Project Management Tab ─────────────────────────────────────────────────────
// ── Bento tracking card (per creator) ─────────────────────────────────────────
function BentoTrackingCard({
  item,
  onDetail,
  onStopRequest,
  onRestore,
}: {
  item: TrackingItem;
  onDetail: () => void;
  onStopRequest: (item: TrackingItem) => void;
  onRestore: (item: TrackingItem) => void;
}) {
  const { openCreatorProfile } = useCreatorProfile();
  const style = STATUS_STYLES[item.trend];
  const [range, setRange] = useState<"7天" | "30天">("7天");
  const [menuOpen, setMenuOpen] = useState(false);

  const PlatformGlyph =
    item.platform === "TikTok"
      ? TikTokGlyph
      : item.platform === "Instagram"
        ? InstagramGlyph
        : YouTubeGlyph;

  const cpmBetter = item.cpmDelta === "optimal";
  const isStopped = item.trend === "stopped";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-[#e8e6dc] transition-all duration-200 hover:shadow-[0_12px_32px_-16px_rgba(20,20,19,0.18)]",
        !isStopped && "hover:-translate-y-0.5",
        isStopped && "opacity-60 grayscale",
        style.cardBg,
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar with real image fallback */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCreatorProfile(trackingItemToProfile(item));
            }}
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-[#e8e6dc] transition-transform hover:scale-105 focus:ring-2 focus:ring-[#c96442] focus:ring-offset-2 focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl(item.seed)}
              alt={item.creator}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-[#141413]">{item.creator}</span>
              <span className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-medium text-[#4d4c48] ring-1 ring-[#e8e6dc]">
                <span className="[&>svg]:h-3 [&>svg]:w-3">
                  <PlatformGlyph />
                </span>
                {item.platform}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  style.tagBg,
                )}
              >
                <span className={cn("inline-block h-1.5 w-1.5 rounded-full", style.dot)} />
                {isStopped && item.stoppedAt ? `已停止 · 停止于 ${item.stoppedAt}` : style.label}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#87867f]">
              发布 {item.publishedAt} · 费用{" "}
              <span className="font-medium text-[#4d4c48]">{item.cost}</span>
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#87867f] hover:bg-white/60 hover:text-[#4d4c48]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-9 right-0 z-20 w-36 overflow-hidden rounded-xl border border-[#e8e6dc] bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDetail();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#4d4c48] hover:bg-[#faf9f5]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  查看详情
                </button>
                {isStopped ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onRestore(item);
                    }}
                    className="flex w-full items-center gap-2 border-t border-[#e8e6dc] px-3 py-2 text-xs text-[#c96442] hover:bg-[#fbf5ed]"
                  >
                    <Play className="h-3.5 w-3.5" />
                    重新追踪
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#4d4c48] hover:bg-[#faf9f5]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      查看原帖
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onStopRequest(item);
                      }}
                      className="flex w-full items-center gap-2 border-t border-[#e8e6dc] px-3 py-2 text-xs text-[#c96442] hover:bg-[#fbf5ed]"
                    >
                      <X className="h-3.5 w-3.5" />
                      停止追踪
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Main Widget: 播放趋势 ───────────────────────────────────────── */}
      <div className={cn("mx-5 mt-4 overflow-hidden rounded-2xl px-5 py-4", style.chartBg)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[#141413]">{item.views}</span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  item.trend === "anomaly" ? "text-[#c96442]" : "text-[#5a6a4a]",
                )}
              >
                {item.trend === "growing" ? "↑ " : item.trend === "anomaly" ? "! " : "— "}
                {item.dailyDelta}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#87867f]">总播放</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/70 p-0.5 ring-1 ring-[#e8e6dc]">
            {(["7天", "30天"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                  range === r ? "bg-[#c96442] text-white" : "text-[#87867f] hover:text-[#4d4c48]",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 h-20">
          <BentoAreaChart data={item.chartData} color={style.chartStop} />
        </div>
      </div>

      {/* ── Bottom two-column: 互动 | 费用效率 ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 p-5 pt-3">
        {/* 互动 Widget */}
        <div className="rounded-2xl border border-[#e8e6dc] bg-white px-4 py-3.5">
          <p className="text-[10px] font-medium tracking-wide text-[#87867f] uppercase">互动</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative">
              <InteractionDonut
                likes={item.likesRaw}
                comments={item.commentsRaw}
                shares={item.sharesRaw}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] leading-none font-semibold text-[#141413]">
                  {((item.likesRaw + item.commentsRaw + item.sharesRaw) / 1000).toFixed(1)}K
                </span>
                <span className="mt-0.5 text-[8px] text-[#87867f]">总互动</span>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#87867f]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c96442]" />
                  点赞
                </span>
                <span className="font-medium text-[#4d4c48]">{item.likes}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#87867f]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#8a9a7a]" />
                  评论
                </span>
                <span className="font-medium text-[#4d4c48]">{item.comments}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[#87867f]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#b8a88a]" />
                  分享
                </span>
                <span className="font-medium text-[#4d4c48]">{item.shares}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 费用效率 Widget */}
        <div className="rounded-2xl border border-[#e8e6dc] bg-white px-4 py-3.5">
          <p className="text-[10px] font-medium tracking-wide text-[#87867f] uppercase">费用效率</p>
          <div className="mt-2 flex items-baseline gap-4">
            <div>
              <div className="text-lg font-semibold text-[#141413]">{item.cpm}</div>
              <div className="text-[9px] text-[#87867f]">CPM</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#141413]">{item.cpe}</div>
              <div className="text-[9px] text-[#87867f]">CPE</div>
            </div>
          </div>
          <div
            className={cn(
              "mt-2 flex items-center gap-1 text-[10px] font-medium",
              cpmBetter ? "text-[#5a6a4a]" : "text-[#c96442]",
            )}
          >
            <span>vs 项目均值 {item.avgCPM}</span>
            <span>{cpmBetter ? "↓ 优于均值" : "↑ 高于均值"}</span>
          </div>
        </div>
      </div>

      {/* ── Footer action ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onDetail}
        className="absolute right-5 bottom-5 rounded-xl border border-[#e8e6dc] bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[#4d4c48] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white hover:text-[#c96442]"
      >
        查看详情 →
      </button>
    </div>
  );
}

// "+ 添加追踪" placeholder card
function AddTrackingCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#e8e6dc] bg-[#faf9f5]/40 text-[#87867f] transition-colors hover:border-[#c96442]/40 hover:bg-[#fbf5ed]/40 hover:text-[#c96442]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-[#e8e6dc] group-hover:ring-[#c96442]/30">
        <Plus className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium">添加追踪</p>
      <p className="text-[11px] text-[#87867f]">粘贴链接追踪已发布内容</p>
    </button>
  );
}

// ── Stop-tracking confirmation modal ──────────────────────────────────────────
function StopTrackingModal({
  item,
  onCancel,
  onConfirm,
}: {
  item: TrackingItem;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { openCreatorProfile } = useCreatorProfile();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#e8e6dc] bg-[#faf9f5] shadow-2xl">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fbf5ed] ring-1 ring-[#f5e4d1]">
              <AlertTriangle className="h-5 w-5 text-[#c96442]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-[#141413]">停止追踪 {item.creator}？</h3>
              <p className="mt-1.5 text-xs leading-5 text-[#5e5d59]">
                停止后该博主将移至「已停止」Tab，历史数据完整保留，可随时恢复追踪。
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-[#e8e6dc] bg-white/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openCreatorProfile(trackingItemToProfile(item))}
                className="shrink-0 rounded-full transition-transform hover:scale-105 focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1 focus:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl(item.seed)}
                  alt={item.creator}
                  className="h-9 w-9 rounded-full ring-1 ring-[#e8e6dc]"
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#141413]">{item.creator}</p>
                <p className="truncate text-[11px] text-[#87867f]">{item.title}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#e8e6dc] bg-[#f5f4ed] px-6 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#faf9f5]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white hover:bg-[#b85a3b]"
          >
            确认停止
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add-tracking modal (paste link / pick from library) ───────────────────────
const MOCK_LIBRARY_CREATORS = [
  {
    handle: "@beauty_lily",
    seed: "beauty_lily",
    followers: "220K",
    status: "已合作",
    complete: true,
    category: "美妆护肤",
  },
  {
    handle: "@wellness_aria",
    seed: "wellness_aria",
    followers: "185K",
    status: "合作中",
    complete: true,
    category: "健康生活",
  },
  {
    handle: "@home_oliver",
    seed: "home_oliver",
    followers: "94K",
    status: "已归档",
    complete: false,
    category: "家居生活",
  },
  {
    handle: "@minimal_ruby",
    seed: "minimal_ruby",
    followers: "156K",
    status: "合作中",
    complete: true,
    category: "美妆护肤",
  },
  {
    handle: "@foodie_ken",
    seed: "foodie_ken",
    followers: "71K",
    status: "已归档",
    complete: false,
    category: "美食",
  },
] as const;

const MOCK_LINK_PREVIEW = {
  title: "晨间护肤 routine · 新品首发上身",
  handle: "@skincare_sam",
  seed: "skincare_sam_preview",
  platform: "TikTok" as const,
  cost: "$1,200",
  publishedAt: "04-26",
};

function AddTrackingModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (source: "link" | "library") => void;
}) {
  const { openCreatorProfile } = useCreatorProfile();
  const [tab, setTab] = useState<"link" | "library">("link");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<typeof MOCK_LINK_PREVIEW | null>(null);

  const handleLinkChange = (v: string) => {
    setLink(v);
    if (!v.trim()) {
      setPreview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setPreview(null);
    setTimeout(() => {
      setLoading(false);
      setPreview(MOCK_LINK_PREVIEW);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#e8e6dc] bg-[#faf9f5] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e6dc] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#141413]">添加追踪</h3>
            <p className="mt-0.5 text-xs text-[#87867f]">追踪已发布内容的播放与互动数据</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#87867f] hover:bg-[#f5f4ed] hover:text-[#4d4c48]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#e8e6dc] bg-white/60 px-6">
          {(["link", "library"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "relative -mb-px px-3 py-3 text-sm transition-colors",
                tab === t ? "font-medium text-[#c96442]" : "text-[#87867f] hover:text-[#4d4c48]",
              )}
            >
              {t === "link" ? "粘贴内容链接" : "从博主库选择"}
              {tab === t && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#c96442]" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="max-h-[520px] overflow-y-auto px-6 py-5">
          {tab === "link" ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#4d4c48]">内容链接</label>
                <input
                  value={link}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  placeholder="粘贴 TikTok / Instagram / YouTube 链接..."
                  className="mt-1.5 w-full rounded-xl border border-[#e8e6dc] bg-white px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#c8c7c3] focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/15 focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-[#87867f]">粘贴后自动识别内容信息</p>
              </div>

              {loading && (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#e8e6dc] bg-white/50 px-4 py-5 text-xs text-[#87867f]">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#c96442]/30 border-t-[#c96442]" />
                  识别内容信息中…
                </div>
              )}

              {preview && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#e8e6dc] bg-white px-4 py-3.5">
                    <div className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailUrl(preview.seed)}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openCreatorProfile({
                                name: preview.handle,
                                handle: preview.handle,
                                avatarUrl: avatarUrl(preview.handle.replace("@", "")),
                                region: "--",
                                followers: "--",
                                er: "--",
                                platform: preview.platform.toLowerCase() as
                                  | "tiktok"
                                  | "instagram"
                                  | "youtube",
                              })
                            }
                            className="shrink-0 rounded-full transition-transform hover:scale-110 focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1 focus:outline-none"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={avatarUrl(preview.handle.replace("@", ""))}
                              alt=""
                              className="h-5 w-5 rounded-full ring-1 ring-[#e8e6dc]"
                            />
                          </button>
                          <span className="text-xs font-medium text-[#4d4c48]">
                            {preview.handle}
                          </span>
                          <span className="rounded-full bg-[#faf9f5] px-2 py-0.5 text-[10px] text-[#87867f] ring-1 ring-[#e8e6dc]">
                            {preview.platform}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-medium text-[#141413]">
                          {preview.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[#87867f]">
                          发布 {preview.publishedAt}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#4d4c48]">合作费用</label>
                    <input
                      defaultValue={preview.cost}
                      className="mt-1.5 w-full rounded-xl border border-[#e8e6dc] bg-white px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/15 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="mb-2 text-[11px] text-[#87867f]">
                仅展示「已归档 / 合作中」的博主。信息不全的博主无法追踪。
              </p>
              {MOCK_LIBRARY_CREATORS.map((c) => (
                <div
                  key={c.handle}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                    c.complete
                      ? "cursor-pointer border-[#e8e6dc] bg-white hover:bg-[#faf9f5]"
                      : "border-dashed border-[#e8e6dc] bg-[#faf9f5]/50 opacity-60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openCreatorProfile({
                        name: c.handle,
                        handle: c.handle,
                        avatarUrl: avatarUrl(c.seed),
                        region: "--",
                        followers: c.followers,
                        er: "--",
                      })
                    }
                    className="shrink-0 rounded-full transition-transform hover:scale-105 focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1 focus:outline-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl(c.seed)}
                      alt={c.handle}
                      className="h-10 w-10 rounded-full ring-1 ring-[#e8e6dc]"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-[#141413]">
                        {c.handle}
                      </span>
                      <span className="rounded-full bg-[#faf9f5] px-2 py-0.5 text-[10px] text-[#87867f] ring-1 ring-[#e8e6dc]">
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#87867f]">
                      {c.followers} 粉丝 · {c.category}
                    </p>
                  </div>
                  {c.complete ? (
                    <button
                      type="button"
                      onClick={() => onAdd("library")}
                      className="rounded-xl border border-[#e8e6dc] bg-white px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed] hover:text-[#c96442]"
                    >
                      选择
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[11px] text-[#c96442] hover:underline"
                    >
                      前往博主库完善 →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e8e6dc] bg-[#f5f4ed] px-6 py-3.5">
          <p className="text-[11px] text-[#87867f]">追踪后数据将每日自动更新</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#faf9f5]"
            >
              取消
            </button>
            {tab === "link" && (
              <button
                type="button"
                disabled={!preview}
                onClick={() => preview && onAdd("link")}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  preview
                    ? "bg-[#c96442] text-white hover:bg-[#b85a3b]"
                    : "cursor-not-allowed bg-[#e8e6dc] text-[#87867f]",
                )}
              >
                确认添加
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type StatusFilter = "all" | TrackingStatus;

const DEFAULT_PROJECT_KPI_BY_ID: Record<string, { label: string; value: string; sub: string }[]> = {
  "q2-summer": [
    { label: "总投放花费", value: "$5.0K", sub: "3 条合作" },
    { label: "总曝光量", value: "317K", sub: "累计播放" },
    { label: "平均 CPM", value: "$19.6", sub: "本月" },
    { label: "综合互动率", value: "5.2%", sub: "+0.8% vs 上月" },
  ],
  "beauty-pool": [
    { label: "总投放花费", value: "$2.1K", sub: "1 条合作" },
    { label: "总曝光量", value: "95K", sub: "累计播放" },
    { label: "平均 CPM", value: "$22.1", sub: "本月" },
    { label: "综合互动率", value: "4.8%", sub: "持平 vs 上月" },
  ],
};

const DEFAULT_PROJECT_CREATOR_COUNT_BY_ID: Record<string, number> = {
  "q2-summer": 96,
  "beauty-pool": 5,
};

const DEFAULT_TRACKING_BY_PROJECT_ID: Record<string, TrackingItem[]> = {
  "q2-summer": TRACKING_ITEMS,
  "beauty-pool": [TRACKING_ITEMS[1]],
};

const EMPTY_PROJECT_KPI = [
  { label: "总投放花费", value: "$0", sub: "0 条合作" },
  { label: "总曝光量", value: "0", sub: "累计播放" },
  { label: "平均 CPM", value: "—", sub: "本月" },
  { label: "综合互动率", value: "—", sub: "—" },
];

function ProjectTab() {
  const {
    projects,
    currentProject,
    currentProjectId,
    selectProject,
    openCreateProject,
    openEditProject,
  } = useWorkspaceProject();
  const [detailItem, setDetailItem] = useState<(typeof TRACKING_ITEMS)[0] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stopTarget, setStopTarget] = useState<TrackingItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [trackingByProjectId, setTrackingByProjectId] = useState<Record<string, TrackingItem[]>>(
    DEFAULT_TRACKING_BY_PROJECT_ID,
  );

  const tracking = trackingByProjectId[currentProjectId] ?? [];
  const kpi = DEFAULT_PROJECT_KPI_BY_ID[currentProjectId] ?? EMPTY_PROJECT_KPI;
  const creatorCount = DEFAULT_PROJECT_CREATOR_COUNT_BY_ID[currentProjectId] ?? tracking.length;
  const timeline = formatProjectTimeline(currentProject);
  const budget = formatProjectBudget(currentProject);

  const counts = {
    all: tracking.length,
    growing: tracking.filter((t) => t.trend === "growing").length,
    stable: tracking.filter((t) => t.trend === "stable").length,
    anomaly: tracking.filter((t) => t.trend === "anomaly").length,
    stopped: tracking.filter((t) => t.trend === "stopped").length,
  };

  const filteredTracking =
    statusFilter === "all" ? tracking : tracking.filter((t) => t.trend === statusFilter);

  const updateTracking = (id: number, patch: Partial<TrackingItem>) => {
    setTrackingByProjectId((current) => ({
      ...current,
      [currentProjectId]: (current[currentProjectId] ?? []).map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const handleStopConfirm = () => {
    if (!stopTarget) return;
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    updateTracking(stopTarget.id, {
      trend: "stopped",
      trendLabel: `已停止 · 停止于 ${mm}-${dd}`,
      stoppedAt: `${mm}-${dd}`,
    });
    setStopTarget(null);
  };

  const handleRestore = (item: TrackingItem) => {
    updateTracking(item.id, {
      trend: "stable",
      trendLabel: "已稳定 · 已恢复追踪",
      stoppedAt: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* ── 项目选择器 ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => selectProject(project.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors",
              currentProjectId === project.id
                ? "border-[#c96442]/30 bg-[#fdf5f0] text-[#c96442]"
                : "border-[#e8e6dc] bg-white text-[#4d4c48] hover:bg-[#f5f4ed]",
            )}
          >
            <span className="font-medium">{project.name}</span>
            <span
              className={cn(
                "text-[11px]",
                currentProjectId === project.id ? "text-[#c96442]/70" : "text-[#87867f]",
              )}
            >
              {DEFAULT_PROJECT_CREATOR_COUNT_BY_ID[project.id] ?? 0}位博主
              {formatProjectTimeline(project) !== "未设置时间范围"
                ? ` · ${formatProjectTimeline(project)}`
                : ""}
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => openCreateProject("quick")}
          className="flex items-center gap-1 rounded-xl border border-[#e8e6dc] px-3.5 py-2.5 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
        >
          <Plus className="h-3.5 w-3.5" />
          快捷新建
        </button>
        <button
          type="button"
          onClick={() => openCreateProject("detailed")}
          className="flex items-center gap-1 rounded-xl border border-dashed border-[#e8e6dc] px-3.5 py-2.5 text-sm text-[#87867f] hover:border-[#c96442]/30 hover:text-[#c96442]"
        >
          <Plus className="h-3.5 w-3.5" />
          详细新建
        </button>

        {/* 编辑项目配置 — 右对齐 */}
        <button
          type="button"
          onClick={() => openEditProject(currentProject.id)}
          className="ml-auto flex items-center gap-1.5 text-sm text-[#87867f] hover:text-[#c96442]"
        >
          <Pencil className="h-3.5 w-3.5" />
          编辑项目配置
        </button>
      </div>

      <div className="rounded-3xl border border-[#e8e6dc] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#141413]">当前项目资料</h2>
            <p className="mt-1 text-xs leading-5 text-[#87867f]">
              这些信息会同步给博主发现、博主库和建联中心，帮助团队围绕同一个项目执行。
            </p>
          </div>
          <button
            type="button"
            onClick={() => openEditProject(currentProject.id)}
            className="rounded-xl border border-[#e8e6dc] px-3.5 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
          >
            编辑当前项目
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "项目名称", value: currentProject.name },
            { label: "产品名称", value: currentProject.productName },
            { label: "品类", value: currentProject.category },
            { label: "项目内博主", value: `${creatorCount} 位` },
            { label: "时间范围", value: timeline },
            { label: "预算", value: budget },
            { label: "品牌", value: currentProject.brand || "未填写" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-[#faf9f5] px-4 py-3">
              <div className="text-[11px] text-[#87867f]">{item.label}</div>
              <div className="mt-1 text-sm font-medium text-[#141413]">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-[#faf9f5] px-4 py-3">
          <div className="text-[11px] text-[#87867f]">产品链接</div>
          <div className="mt-1 text-sm text-[#141413]">
            {currentProject.productLink ? (
              <a
                href={currentProject.productLink}
                target="_blank"
                rel="noreferrer"
                className="text-[#c96442] hover:underline"
              >
                {currentProject.productLink}
              </a>
            ) : (
              "未填写"
            )}
          </div>
        </div>
      </div>

      {/* ── 投放概览 KPI ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {kpi.map((m) => (
          <div key={m.label} className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
            <div className="text-xs text-[#87867f]">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[#141413]">{m.value}</div>
            <div className="mt-1 text-xs text-[#87867f]">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 追踪博主列表（全宽） ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[#141413]">追踪博主</h2>
            {counts.anomaly > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("anomaly")}
                className="flex items-center gap-1 rounded-full bg-[#fbf5ed] px-2.5 py-1 text-xs font-medium text-[#c96442] ring-1 ring-[#f5e4d1] hover:bg-[#f5e4d1]"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {counts.anomaly} 条异常
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#141413] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#2a2a28]"
          >
            <Plus className="h-3.5 w-3.5" />
            添加追踪
          </button>
        </div>

        {/* Status filter tabs (below header) */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#e8e6dc] bg-white/60 p-1.5">
          {(
            [
              { key: "all", label: "全部", count: counts.all },
              { key: "growing", label: "增长中", count: counts.growing },
              { key: "stable", label: "已稳定", count: counts.stable },
              { key: "anomaly", label: "异常", count: counts.anomaly },
              { key: "stopped", label: "已停止", count: counts.stopped },
            ] as const
          ).map((f) => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-[#141413] font-medium text-white"
                    : "text-[#4d4c48] hover:bg-[#f5f4ed]",
                )}
              >
                <span>{f.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    active ? "bg-white/20 text-white" : "bg-[#f0ece4] text-[#87867f]",
                  )}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {tracking.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#e8e6dc] bg-[#faf9f5]/60 py-20 text-center">
            <p className="text-sm text-[#87867f]">暂无追踪博主</p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mx-auto mt-3 flex items-center gap-1.5 rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
            >
              <Plus className="h-3.5 w-3.5" />
              添加第一个
            </button>
          </div>
        ) : filteredTracking.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#e8e6dc] bg-[#faf9f5]/60 py-14 text-center">
            <p className="text-sm text-[#87867f]">当前分组下暂无博主</p>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="mx-auto mt-3 rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
            >
              查看全部
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredTracking.map((item) => (
              <BentoTrackingCard
                key={item.id}
                item={item}
                onDetail={() => setDetailItem(item)}
                onStopRequest={(it) => setStopTarget(it)}
                onRestore={handleRestore}
              />
            ))}
            {statusFilter === "all" && <AddTrackingCard onClick={() => setAddOpen(true)} />}
          </div>
        )}
      </div>

      {/* Drawers & Modals */}
      {detailItem && <DetailDrawer item={detailItem} onClose={() => setDetailItem(null)} />}
      {stopTarget && (
        <StopTrackingModal
          item={stopTarget}
          onCancel={() => setStopTarget(null)}
          onConfirm={handleStopConfirm}
        />
      )}
      {addOpen && (
        <AddTrackingModal onClose={() => setAddOpen(false)} onAdd={() => setAddOpen(false)} />
      )}
    </div>
  );
}

// ── Team Tab ───────────────────────────────────────────────────────────────────
function TeamTab() {
  const [sent, setSent] = useState(false);
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
      <p className="text-sm text-[#87867f]">本功能正在开发中</p>
      {sent ? (
        <p className="mt-5 text-sm text-[#4d4c48]">我们已收到你的建议，敬请期待。</p>
      ) : (
        <button
          type="button"
          onClick={() => setSent(true)}
          className="mt-5 rounded-xl border border-[#e8e6dc] bg-white px-5 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
        >
          求解锁
        </button>
      )}
    </div>
  );
}

// ── Billing Tab ────────────────────────────────────────────────────────────────
function BillingTab() {
  return (
    <div className="w-full space-y-4">
      {/* ── Pro 套餐卡片 · 轻奢玻璃风（Claude 暖米底 + 玻璃折射） ──────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 shadow-[0_8px_28px_-16px_rgba(20,20,19,0.12)] ring-1 ring-white/70 ring-inset"
        style={{
          backgroundImage: "linear-gradient(135deg, #fbfaf6 0%, #f5f0e6 55%, #f0e6d8 100%)",
        }}
      >
        {/* Soft terracotta glow — top-right */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-[#c96442]/12 blur-3xl" />
        {/* Soft cool highlight — bottom-left (glass refraction) */}
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#e8d8c5]/60 blur-3xl" />
        {/* Frosted highlight band */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0">
            {/* PRO badge + 生效中 */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#c96442] uppercase shadow-sm ring-1 ring-[#c96442]/25 backdrop-blur ring-inset">
                <Sparkles className="h-3 w-3" />
                PRO
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#5e5d59]">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40" />
                  <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
                </span>
                生效中
              </span>
            </div>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[40px] leading-none font-semibold tracking-tight text-[#141413] tabular-nums">
                $99
              </span>
              <span className="text-sm text-[#87867f]">/ 月</span>
            </div>
            <p className="mt-1.5 text-xs text-[#87867f]">到期日 · 2026-05-14</p>

            {/* Divider — warm frosted line */}
            <div className="mt-5 h-px w-full bg-gradient-to-r from-[#c9b8a0]/40 via-[#c9b8a0]/20 to-transparent" />

            {/* 核心权益 */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              {[
                { icon: Compass, label: "博主发现" },
                { icon: Mail, label: "邮件建联" },
                { icon: Radar, label: "投放追踪" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[12px] text-[#4d4c48]">
                  <Icon className="h-3.5 w-3.5 text-[#c96442]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              className="rounded-xl bg-[#141413] px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_12px_-6px_rgba(20,20,19,0.35)] transition-colors hover:bg-[#2a2a28]"
            >
              升级套餐
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#e8e6dc] bg-white/60 px-5 py-2.5 text-sm text-[#4d4c48] backdrop-blur transition-colors hover:bg-white hover:text-[#c96442]"
            >
              取消订阅
            </button>
          </div>
        </div>
      </div>

      {/* ── 本月用量（2 列网格，icon + 进度条 + 数值） ──────────────────────── */}
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#141413]">本月用量</h3>
            <p className="mt-1 text-xs text-[#87867f]">按当前计费周期展示功能使用情况</p>
          </div>
          <span className="rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-2.5 py-1 text-[10px] text-[#87867f]">
            周期截至 2026-05-14
          </span>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          {USAGE_QUOTA.map((u) => {
            const pct = Math.round((u.used / u.quota) * 100);
            const isWarn = pct >= 80;
            const Icon = USAGE_ICON_MAP[u.icon];
            return (
              <div key={u.label}>
                {/* Row 1: icon + label + value */}
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#87867f]" />
                  <span className="text-xs text-[#4d4c48]">{u.label}</span>
                  <span className="ml-auto text-xs text-[#141413] tabular-nums">
                    <span className="font-medium">{u.used}</span>
                    <span className="text-[#87867f]">
                      {" "}
                      / {u.quota} {u.unit}
                    </span>
                  </span>
                </div>
                {/* Row 2: progress bar */}
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#f0ece4]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isWarn ? "bg-[#d97706]" : "bg-[#c96442]",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-10 text-right text-[11px] font-medium tabular-nums",
                      isWarn ? "text-[#d97706]" : "text-[#87867f]",
                    )}
                  >
                    {pct}%
                  </span>
                </div>
                {isWarn && (
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#d97706]">
                    <AlertTriangle className="h-3 w-3" />
                    即将用尽
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 购买记录（无外边框，行间细线分隔） ──────────────────────────────── */}
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-[#141413]">购买记录</h3>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-[#e8e6dc] bg-white px-3 py-1.5 text-xs text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]"
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </button>
        </div>

        <div className="grid grid-cols-[100px_1fr_90px_108px_68px] gap-3 border-b border-[#e8e6dc] pb-2 text-[11px] font-medium tracking-wide text-[#87867f] uppercase">
          <span>日期</span>
          <span>项目</span>
          <span className="text-right">金额</span>
          <span>状态</span>
          <span className="text-right">发票</span>
        </div>
        {BILLING_HISTORY.map((b, i) => (
          <div
            key={b.date}
            className={cn(
              "grid grid-cols-[100px_1fr_90px_108px_68px] items-center gap-3 py-3 text-sm transition-colors hover:bg-[#faf9f5]",
              i < BILLING_HISTORY.length - 1 && "border-b border-[#f0ece4]",
            )}
          >
            <span className="text-[#87867f] tabular-nums">{b.date}</span>
            <span className="text-[#4d4c48]">{b.item}</span>
            <span className="text-right font-medium text-[#141413] tabular-nums">{b.amount}</span>
            <span className="flex items-center gap-1 text-xs font-medium text-[#5a6a4a]">
              <Check className="h-3 w-3" />
              {b.status}
            </span>
            <button
              type="button"
              className="flex items-center justify-end gap-1 text-xs text-[#87867f] transition-colors hover:text-[#c96442]"
            >
              <Download className="h-3 w-3" />
              下载
            </button>
          </div>
        ))}
      </div>

      {/* ── 底部操作栏（幽灵按钮，字号小一号） ──────────────────────────────── */}
      <div className="flex gap-2 pt-1">
        {["联系客服", "帮助文档", "功能建议"].map((action) => (
          <button
            key={action}
            type="button"
            className="rounded-xl border border-[#e8e6dc] bg-transparent px-3.5 py-1.5 text-xs text-[#87867f] transition-colors hover:border-[#c96442]/30 hover:bg-white hover:text-[#c96442]"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Integrations Tab ───────────────────────────────────────────────────────────
function IntegrationsTab() {
  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Chrome className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-[#141413]">Chrome 插件</div>
              <div className="mt-0.5 text-xs text-[#87867f]">KOL Hunter · 版本 2.1.4</div>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            已连接
          </span>
        </div>
        <p className="mt-3 text-xs text-[#87867f]">
          通过插件浏览 TikTok / Instagram 时自动同步博主数据到博主库，支持一键收藏、快速建联。
        </p>
      </div>
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5ede8]">
              <span className="text-xl">📧</span>
            </div>
            <div>
              <div className="font-semibold text-[#141413]">邮箱绑定</div>
              <div className="mt-0.5 text-xs text-[#87867f]">marketing@mybrand.com · Gmail</div>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            已连接
          </span>
        </div>
        <p className="mt-3 text-xs text-[#87867f]">
          管理邮箱发件和收件功能。在建联中心 → 邮件管理中配置详细选项。
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-[#e8e6dc] bg-[#faf9f5] p-5">
        <div className="text-center text-sm text-[#87867f]">
          更多集成即将推出
          <br />
          <span className="text-xs">Notion · Slack · HubSpot · Shopify</span>
        </div>
      </div>
    </div>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────
const TAB_COMPONENTS: Record<TabKey, React.ComponentType> = {
  project: ProjectTab,
  team: TeamTab,
  billing: BillingTab,
  integrations: IntegrationsTab,
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) ?? "project";
  const TabContent = TAB_COMPONENTS[tab] ?? ProjectTab;
  return (
    <div className="space-y-6">
      <TabContent />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-2xl bg-[#f0ece4]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
