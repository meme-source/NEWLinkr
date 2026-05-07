// §3.3 Shared style tokens + derived metric helpers for the 投放表现 view.
// Kept here (not in data/board-placements.ts) so the data file stays free of
// UI/Tailwind concerns.

import type { Placement, PlacementStatus } from "@/features/outreach/data/board-placements";
import type { CreatorCategory } from "@/types/api";

// 量级三分桶（用于"量级统计"卡片与散点图配色）：
//   头部 ≥ 200K
//   腰部 50K – 200K
//   尾部 < 50K
export type CreatorTier = "head" | "mid" | "tail";

export const TIER_THRESHOLDS = {
  head: 200_000,
  mid: 50_000,
} as const;

export function tierOf(followers: number): CreatorTier {
  if (followers >= TIER_THRESHOLDS.head) return "head";
  if (followers >= TIER_THRESHOLDS.mid) return "mid";
  return "tail";
}

export const TIER_ORDER: readonly CreatorTier[] = ["head", "mid", "tail"];

export const TIER_META: Record<CreatorTier, { label: string; range: string; color: string }> = {
  head: { label: "头部", range: "≥ 200K", color: "#36342e" },
  mid: { label: "腰部", range: "50K – 200K", color: "#ff4f00" },
  tail: { label: "尾部 / KOC", range: "< 50K", color: "#c5c0b1" },
};

// 类别中文显示（与 types/api.ts 中的 CreatorCategory 对齐）。
export const CATEGORY_LABEL: Record<CreatorCategory, string> = {
  beauty: "美妆",
  skincare: "护肤",
  fashion: "时尚",
  food: "美食",
  travel: "旅行",
  vlog: "Vlog",
  fitness: "健身",
  parenting: "亲子",
  tech: "科技",
  home: "家居",
  review: "测评",
  education: "教育",
  comedy: "喜剧",
  other: "其他",
};

// 投放状态徽章配色 —— 跟随 docs/DESIGN.md 暖色系：
//   增长中 = 主色（橙）
//   稳定中 = 中性
//   下降中 = 警示橙
export const STATUS_BADGE: Record<PlacementStatus, string> = {
  增长中: "bg-[#fff7f4] text-[#ff4f00] border-[#ffd9c8]",
  稳定中: "bg-[#eceae3] text-[#36342e] border-[#c5c0b1]",
  下降中: "bg-[#fff7f4] text-[#ff4f00] border-[#fff7f4]",
};

// 徽章左侧的"色点"。
export const STATUS_DOT: Record<PlacementStatus, string> = {
  增长中: "#3a8c5b",
  稳定中: "#939084",
  下降中: "#ff4f00",
};

// 文字颜色 —— 在抽屉等没有徽章背景的位置，单独给状态文字上色，
// 与卡片头部的 STATUS_BADGE 视觉协议保持一致：
//   增长中 = 橙（强调"在长"，配绿色圆点）
//   稳定中 = 灰（不抢视线）
//   下降中 = 橙（提醒）
export const STATUS_TEXT_TONE: Record<PlacementStatus, string> = {
  增长中: "text-[#ff4f00]",
  稳定中: "text-[#939084]",
  下降中: "text-[#ff4f00]",
};

// 用户主动暂停时的徽章样式（独立于自动识别状态）。
export const PAUSED_BADGE = "bg-[#eceae3] text-[#939084] border-[#c5c0b1]";
export const PAUSED_DOT = "#c5c0b1";
export const PAUSED_TEXT_TONE = "text-[#939084]";

// 用于格式化"上次刷新"时间戳：YYYY-MM-DD HH:mm。
// 没用 toLocaleString 是为了避免 SSR/CSR 在不同 locale / timezone 下产出不一致字符串。
export function fmtRefreshedAt(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function engOf(p: Placement): number {
  return p.likes + p.comments + p.shares;
}

export function cpeOf(p: Placement): number {
  const e = engOf(p);
  return e > 0 ? p.spendUsd / e : 0;
}

export function cpmOf(p: Placement): number {
  return p.views > 0 ? (p.spendUsd / p.views) * 1000 : 0;
}

export function fmtCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n / 1e6 >= 10 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n / 1e3 >= 10 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

export function fmtMoney(n: number, digits = 2): string {
  return `$${n.toFixed(digits)}`;
}

// 把 trend 数组规约成"日均增量"。用于卡片头部的 "+8K/日 / —0.5K/日" 标签。
// trend 至少 2 个点；不足 2 个时返回 0。
export function dailyDelta(trend: number[]): number {
  if (trend.length < 2) return 0;
  const span = trend.length - 1;
  return (trend[trend.length - 1]! - trend[0]!) / span;
}
