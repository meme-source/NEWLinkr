import type {
  HoverMetricKey,
  InlineDataKey,
  MetricAggregation,
  SocialPlatformKey,
} from "@/features/plugin/types";

export const SCRAPE_COUNT_OPTIONS = [5, 10, 15];

export const HOVER_CARD_MAX_METRICS = 4;

export const DEFAULT_HOVER_METRICS: HoverMetricKey[] = [
  "rate",
  "likes",
  "comments",
  "engagementOrViews",
];

export const DEFAULT_HOVER_METRIC_MODES: Record<HoverMetricKey, MetricAggregation> = {
  rate: "average",
  plays: "median",
  likes: "median",
  comments: "median",
  engagementOrViews: "median",
};

export const SOCIAL_PLATFORM_OPTIONS: Array<{
  key: SocialPlatformKey;
  label: string;
}> = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X" },
];

export const DEFAULT_INLINE_DATA_KEYS: InlineDataKey[] = [
  "plays",
  "likes",
  "comments",
  "engagement",
  "publishedAt",
];
