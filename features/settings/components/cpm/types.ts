import type { CpmTier } from "@/features/settings/data/cpm-countries";

export type Platform = "tiktok" | "youtube" | "instagram";

export interface PlatformCfg {
  key: Platform;
  label: string;
  enabled: boolean;
  ribbon: string;
  blurb: string;
}

export interface RegionRow {
  tier: CpmTier;
  label: string;
  dot: string;
  hint: string;
}

export type TierCountries = Record<CpmTier, string[]>;

export const PLATFORMS: PlatformCfg[] = [
  {
    key: "tiktok",
    label: "TikTok",
    enabled: true,
    ribbon: "bg-[#201515]",
    blurb: "全球短视频投放主战场",
  },
  {
    key: "youtube",
    label: "YouTube",
    enabled: false,
    ribbon: "bg-[#b00020]",
    blurb: "深度视频与长尾流量",
  },
  {
    key: "instagram",
    label: "Instagram",
    enabled: false,
    ribbon: "bg-gradient-to-r from-[#ff4f00] via-[#ff7a3a] to-[#cc3e00]",
    blurb: "图文与 Reels 短视频",
  },
];

export const REGION_ROWS: RegionRow[] = [
  { tier: "developed", label: "发达地区", dot: "bg-emerald-500", hint: "高消费力受众，CPM 最高" },
  { tier: "developing", label: "发展中地区", dot: "bg-amber-500", hint: "中等消费力，性价比区间" },
  { tier: "underdeveloped", label: "欠发达地区", dot: "bg-rose-500", hint: "新兴市场，CPM 偏低" },
];

export const DEFAULT_PRICES: Record<Platform, Record<CpmTier, number>> = {
  tiktok: { developed: 10, developing: 5, underdeveloped: 2 },
  youtube: { developed: 30, developing: 10, underdeveloped: 5 },
  instagram: { developed: 10, developing: 5, underdeveloped: 2 },
};

export function tierLabel(tier: CpmTier): string {
  return REGION_ROWS.find((r) => r.tier === tier)?.label ?? tier;
}
