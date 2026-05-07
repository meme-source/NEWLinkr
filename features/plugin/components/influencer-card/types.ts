import type { ReactNode } from "react";

export type FilterMode = "找相似" | "找平替" | "找种子达人";

export type EmailStatus =
  | { kind: "found"; address: string }
  | { kind: "verified"; label?: string; address?: string }
  | { kind: "missing"; label?: string };

export interface InfluencerCardMetric {
  label: string;
  value: string;
  hint?: string;
  estimated?: boolean;
  highlight?: boolean;
}

export interface InfluencerCardRadarAxis {
  subject: string;
  /** 0-100 raw score */
  value: number;
  color?: string;
}

// Mirrored from the legacy floating panel's options so backend consumers
// (rerank query, scoring weights) stay aligned across both UI surfaces.
export const SCRAPE_COUNT_OPTIONS = [5, 10, 15] as const;
export type ScrapeCount = (typeof SCRAPE_COUNT_OPTIONS)[number];

export const COVER_COUNT_OPTIONS = [3, 5, 9] as const;
export type CoverCount = (typeof COVER_COUNT_OPTIONS)[number];

export interface InfluencerCardSampleConfig {
  scrapeCount: ScrapeCount;
  coverCount: CoverCount;
  /** Mirrors legacy `dataCheckOn`. */
  perspective: boolean;
}

export interface InfluencerCardData {
  id: string;
  handle: string;
  countryCode?: string;
  countryLabel?: string;
  /** Per the floating-creator-card reference image: a category pill rendered
   *  next to the country pill on the header's second line (e.g. "科技类博主"). */
  creatorType?: string;
  email: EmailStatus;
  tags: string[];
  features: string[];
  metrics: InfluencerCardMetric[];
  radar: InfluencerCardRadarAxis[];
  sample: InfluencerCardSampleConfig;
  initials?: string;
}

export interface InfluencerCardCallbacks {
  onAddTag: (label: string) => void;
  onRemoveTag: (label: string) => void;
  onEditTag: (oldLabel: string, newLabel: string) => void;
  // 不传 → 卡片不渲染"查看完整档案"页脚。规则：未入库的博主不应有完整档案入口
  // （典型：博主发现里 AI 推送的搜索结果，用户尚未点收藏入库）。
  onOpenAnalysis?: () => void;
  onSendEmail?: () => void;
  onChangeScrapeCount?: (next: ScrapeCount) => void;
  onChangeCoverCount?: (next: CoverCount) => void;
  onTogglePerspective?: () => void;
}

export interface InfluencerCardProps extends InfluencerCardCallbacks {
  data: InfluencerCardData;
  /** Reserved for per-mode tweaks (color accents, banner overrides).
   *  Currently unused — the card visual is mode-agnostic. */
  filterMode?: FilterMode;
  /** Slot above the metrics row, used for the "省 X%" banner in 找平替 mode. */
  bannerSlot?: ReactNode;
}
