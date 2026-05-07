import { Activity, DollarSign, MessageCircle, Play, ThumbsUp } from "lucide-react";
import type { CreatorProfile, HoverMetricKey, MetricAggregation } from "@/features/plugin/types";
import {
  formatComments,
  formatLikes,
  getCreatorMetricSnapshot,
  parseMetricToNumber,
} from "./shared";

export type SidebarMetricItem = {
  key: HoverMetricKey;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

export function buildSidebarMetricItems(
  configuredMetricKeys: HoverMetricKey[],
  creator: CreatorProfile,
  creatorMetrics: ReturnType<typeof getCreatorMetricSnapshot>,
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>,
): SidebarMetricItem[] {
  return configuredMetricKeys.map((key): SidebarMetricItem => {
    if (key === "rate") {
      return { key, icon: DollarSign, label: "预估报价", value: creatorMetrics.rate };
    }
    if (key === "likes") {
      return {
        key,
        icon: ThumbsUp,
        label: hoverMetricModes.likes === "median" ? "中位点赞" : "平均点赞",
        value:
          hoverMetricModes.likes === "median"
            ? creatorMetrics.medianLikes
            : formatLikes(parseMetricToNumber(creator.likes) * 1.08),
      };
    }
    if (key === "plays") {
      return {
        key,
        icon: Play,
        label: (hoverMetricModes.plays ?? "median") === "median" ? "中位观看量" : "平均观看量",
        value:
          (hoverMetricModes.plays ?? "median") === "median"
            ? creatorMetrics.medianPlays
            : creatorMetrics.averagePlays,
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
}
