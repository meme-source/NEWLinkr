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

/** 深度分析的内容维度。维度名本身不在 UI 上显示 —— 维度只决定胶囊的浅底
 *  色(见 tokens.ts 的 analysisTintFor)。
 *
 *  这里是【开放集合】:维度由后台配置,一次任务分析出多少个维度,就摆多少
 *  个 —— 前端不写死维度清单,也不封顶。常见维度有内容主题 / 内容形式 / 视
 *  觉调性 / 账号数据 / 受众人群,但不限于此;未知维度由 analysisTintFor 自
 *  动取一档底色。 */
export type AnalysisDimension = string;

/** 深度分析的一个特征 tag:一段客观特征 + 它所属的内容维度。所有 tag 连成
 *  一片排列,维度名不写出来 —— 靠胶囊的浅底色把同维度的 tag 聚成一族。
 *
 *  定位 —— 这是【辅助信息】,不是判断工具。每个 tag 是博主在该维度上可观察
 *  的客观特征(如「沉浸式 Vlog」「重合 82%」),帮用户自己判断,不出现
 *  「推荐」「值得」「适合」这类带倾向的结论词。 */
export interface InfluencerCardAnalysisTag {
  /** 所属内容维度 —— 只用来挑底色,维度名不在卡片上显示。 */
  dimension: AnalysisDimension;
  /** 客观特征,精简成一个可一眼扫读的 tag。 */
  tag: string;
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
  /** Used as the avatar's first-letter fallback (mirrors CreatorAvatar). */
  name: string;
  countryCode?: string;
  countryLabel?: string;
  /** Flag emoji derived from countryCode/country at map time. */
  flag?: string;
  /** Per the floating-creator-card reference image: a category pill rendered
   *  next to the country pill on the header's second line (e.g. "科技类博主"). */
  creatorType?: string;
  email: EmailStatus;
  /** Plain-text email address used by the unified CreatorProfileHeader's pill. */
  emailAddress: string;
  /** Whether {@link emailAddress} represents a real known address. */
  hasEmail: boolean;
  /** Whether the current creator is in the user's saved list. Drives the
   *  heart-toggle state in the unified header. */
  isSaved: boolean;
  tags: string[];
  metrics: InfluencerCardMetric[];
  analysis: InfluencerCardAnalysisTag[];
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
  /** 「建联」按钮 click — opens the email composer / outreach sidebar. */
  onOpenEmailSidebar?: () => void;
  /** Toggle the saved/favorite state. The heart icon in the unified header is
   *  hidden when this callback is not provided. */
  onToggleSave?: () => void;
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
