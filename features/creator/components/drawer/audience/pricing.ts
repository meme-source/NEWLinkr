import type { AudienceRegion, Creator, RegionTier } from "@/types/api";

// 受众分布预估报价的纯函数：
// 总报价 = Σ (中位数播放 / 1000) × 该 tier 受众占比 × 该 tier CPM
//
// CPM 表按"博主所在国家档位"切换；Web Settings 配好后由后端下发，
// 这里给一组合理默认值，方便 mock 展示。

export const TIER_LABEL: Record<RegionTier, string> = {
  T1: "发达",
  T2: "发展中",
  T3: "欠发达",
};

// 与 chart-palette.ts 对齐：T1 走 Linkr Orange（最具价值的发达受众，配品牌色），
// T2 走 warm graphite，T3 走 sand，整体只在暖色系内做明度梯度。
export const TIER_STYLE: Record<
  RegionTier,
  { pill: string; pillText: string; chipBg: string; chipText: string }
> = {
  T1: {
    pill: "bg-[#ff4f00]",
    pillText: "text-white",
    chipBg: "bg-[#fff1ea]",
    chipText: "text-[#ff4f00]",
  },
  T2: {
    pill: "bg-[#7a6e5c]",
    pillText: "text-white",
    chipBg: "bg-[#ece6db]",
    chipText: "text-[#7a6e5c]",
  },
  T3: {
    pill: "bg-[#3a3431]",
    pillText: "text-white",
    chipBg: "bg-[#e8e4df]",
    chipText: "text-[#3a3431]",
  },
};

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

export type PriceLine = {
  tier: RegionTier;
  share: number;
  cpm: number;
  value: number;
};

export type PriceEstimate = {
  bloggerTier: RegionTier;
  medianViews: number;
  lines: PriceLine[];
  total: number;
};

export function computeAudiencePrice(creator: Creator, regions: AudienceRegion[]): PriceEstimate {
  const bloggerTier = FLAG_TO_TIER[creator.region] ?? "T2";
  const cpmRow = CPM_BY_BLOGGER_TIER[bloggerTier];
  const medianViews = Math.max(0, creator.medianViews ?? 0);

  const tierShare: Record<RegionTier, number> = { T1: 0, T2: 0, T3: 0 };
  for (const r of regions) tierShare[r.tier] += r.share;

  const tiers: RegionTier[] = ["T1", "T2", "T3"];
  const lines: PriceLine[] = tiers.map((tier) => {
    const share = tierShare[tier];
    const cpm = cpmRow[tier];
    return {
      tier,
      share,
      cpm,
      value: (medianViews / 1000) * share * cpm,
    };
  });

  const total = lines.reduce((acc, l) => acc + l.value, 0);
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

// ISO alpha-2 → flag emoji。仅用于 UI 展示。
export function flagOf(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return "🏳️";
  const codePoints = [...upper].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}
