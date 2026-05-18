import type { AudienceProfile, RegionTier } from "@/types/api";
import type { CreatorProfile } from "@/features/plugin/types";

import { getCreatorAveragePlays, getCreatorLocation, parseMetricToNumber } from "./shared";

// 与 Web 端受众数据 tab 同口径的暖色档位（T1 主橙 / T2 暖中灰 / T3 暖近黑）。
export const TIER_LABEL: Record<RegionTier, string> = {
  T1: "发达地区",
  T2: "新兴地区",
  T3: "欠发达地区",
};

export const TIER_ACCENT: Record<RegionTier, string> = {
  T1: "#ff4f00",
  T2: "#7a6e5c",
  T3: "#3a3431",
};

// ISO 3166-1 alpha-2 → 国旗 emoji（区域指示符换算）。
export function regionFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const AGE_RANGES: AudienceProfile["ageBuckets"][number]["range"][] = [
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
];

// 与 Web 端 tab-audience 的 buildFallbackProfile 完全同构：按 creator.id 做轻量
// 伪随机扰动，让不同博主画像有差异，且每次渲染稳定。插件端不下发评论级总结，
// credibility.summaries 留空。
export function buildPluginAudienceProfile(creator: CreatorProfile): AudienceProfile {
  const seed = stringToSeed(creator.id);
  const rand = (offset: number) => pseudoRandom(seed + offset);

  const female = clamp(0.55 + rand(1) * 0.25, 0.4, 0.85);
  const male = 1 - female;

  const rawShares = [0.155, 0.45, 0.21, 0.1, 0.055, 0.025, 0.005].map(
    (base, index) => base * (0.85 + rand(10 + index) * 0.3),
  );
  const total = rawShares.reduce((acc, value) => acc + value, 0);
  const ageBuckets = rawShares.map((value, index) => {
    const share = value / total;
    return { range: AGE_RANGES[index], female: share * female, male: share * male };
  });
  const age17PlusShare = ageBuckets.slice(1).reduce((acc, b) => acc + b.female + b.male, 0);

  return {
    sample: {
      videosAnalyzed: 10,
      commentersCollected: 1200 + Math.round(rand(2) * 600),
      followersCollected: 5000,
      totalUsers: 6200 + Math.round(rand(3) * 900),
    },
    gender: { female, male },
    ageBuckets,
    age17PlusShare,
    regions: [
      { code: "US", name: "美国", tier: "T1", share: 0.32 + rand(20) * 0.08 },
      { code: "GB", name: "英国", tier: "T1", share: 0.08 + rand(21) * 0.04 },
      { code: "CA", name: "加拿大", tier: "T1", share: 0.06 + rand(22) * 0.03 },
      { code: "AU", name: "澳大利亚", tier: "T1", share: 0.05 + rand(23) * 0.03 },
      { code: "PH", name: "菲律宾", tier: "T2", share: 0.05 + rand(24) * 0.04 },
      { code: "BR", name: "巴西", tier: "T2", share: 0.04 + rand(25) * 0.03 },
      { code: "MX", name: "墨西哥", tier: "T2", share: 0.03 + rand(26) * 0.02 },
    ],
    interests: [
      { name: "时尚", description: "穿搭、品牌合作", share: 0.28 },
      { name: "美妆", description: "化妆、护肤教程", share: 0.22 },
      { name: "生活方式", description: "Vlog、日常分享", share: 0.18 },
      { name: "美食", description: "餐厅打卡、家常菜", share: 0.16 },
      { name: "旅行", description: "目的地、酒店", share: 0.16 },
    ],
    credibility: {
      authenticFans: 0.78 + rand(30) * 0.15,
      productInterest: 0.62 + rand(31) * 0.2,
      positiveSentiment: 0.74 + rand(32) * 0.18,
      trustScore: 3.5 + rand(33) * 1.4,
      professionalismScore: 3.6 + rand(34) * 1.3,
      affinityScore: 3.8 + rand(35) * 1.2,
    },
  };
}

function stringToSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// 简单 LCG，仅用于 mock 数据扰动，不需要密码学强度。
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ── 受众分布预估报价 ──────────────────────────────────────────────
// 与 Web 端 pricing.ts 的 computeAudiencePrice 同口径：
// 总报价 = Σ (中位数播放 / 1000) × 该 tier 受众占比 × 该 tier CPM。

export type PriceLine = {
  tier: RegionTier;
  share: number;
  cpm: number;
  value: number;
};

export type AudiencePrice = {
  bloggerTier: RegionTier;
  medianViews: number;
  lines: PriceLine[];
  total: number;
};

// CPM 表按「博主所在地档位 × 受众地区档位」切换；Web Settings 配好后由后端下发。
const CPM_BY_BLOGGER_TIER: Record<RegionTier, Record<RegionTier, number>> = {
  T1: { T1: 10, T2: 5, T3: 2 },
  T2: { T1: 6, T2: 3, T3: 1 },
  T3: { T1: 3, T2: 1.5, T3: 0.5 },
};

const FLAG_TO_TIER: Record<string, RegionTier> = {
  "🇺🇸": "T1",
  "🇬🇧": "T1",
  "🇨🇦": "T1",
  "🇦🇺": "T1",
  "🇩🇪": "T1",
  "🇫🇷": "T1",
  "🇯🇵": "T1",
  "🇰🇷": "T1",
  "🇸🇬": "T1",
  "🇳🇱": "T1",
  "🇸🇪": "T1",
  "🇪🇸": "T2",
  "🇮🇹": "T2",
  "🇧🇷": "T2",
  "🇲🇽": "T2",
  "🇨🇳": "T2",
  "🇹🇭": "T2",
  "🇲🇾": "T2",
  "🇵🇭": "T3",
  "🇮🇩": "T3",
  "🇻🇳": "T3",
  "🇮🇳": "T3",
};

export function computePluginAudiencePrice(
  creator: CreatorProfile,
  regions: AudienceProfile["regions"],
): AudiencePrice {
  const bloggerTier = FLAG_TO_TIER[getCreatorLocation(creator).flag] ?? "T2";
  const cpmRow = CPM_BY_BLOGGER_TIER[bloggerTier];
  // 插件端无独立 medianViews 字段，由平均播放量折算（与 getCreatorMedianPlays 同系数）。
  const medianViews = Math.max(
    0,
    Math.round(parseMetricToNumber(getCreatorAveragePlays(creator)) * 0.82),
  );

  const tierShare: Record<RegionTier, number> = { T1: 0, T2: 0, T3: 0 };
  for (const region of regions) tierShare[region.tier] += region.share;

  const lines: PriceLine[] = (["T1", "T2", "T3"] as RegionTier[]).map((tier) => ({
    tier,
    share: tierShare[tier],
    cpm: cpmRow[tier],
    value: (medianViews / 1000) * tierShare[tier] * cpmRow[tier],
  }));
  const total = lines.reduce((acc, line) => acc + line.value, 0);

  return { bloggerTier, medianViews, lines, total };
}

export function formatUsd(value: number): string {
  if (value > 0 && value < 1) return `$${value.toFixed(2)}`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}
