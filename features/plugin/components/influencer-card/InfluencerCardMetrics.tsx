"use client";

import { Activity, DollarSign, MessageCircle, ThumbsUp } from "lucide-react";
import type { ComponentType } from "react";

import { TEXT, TYPE } from "./tokens";
import type { InfluencerCardMetric } from "./types";

interface InfluencerCardMetricsProps {
  metrics: InfluencerCardMetric[];
}

// Per the floating-creator-card reference image: a 2×2 grid of Solid-Tile
// metrics (§6.5.2 Variant 2). Each tile renders an icon + label on the top
// row, value below. Icons are mapped by label keyword so the strip stays
// useful no matter which order the caller passes the metrics in. Light Sand
// background, no border — visual separation comes from the bg-color delta
// against the cream card.
const ICON_BY_LABEL: Array<{ match: RegExp; icon: ComponentType<{ className?: string }> }> = [
  { match: /(报价|价格|price|cpm|rate)/i, icon: DollarSign },
  { match: /(点赞|like)/i, icon: ThumbsUp },
  { match: /(评论|comment)/i, icon: MessageCircle },
  { match: /(互动|engagement|er\b)/i, icon: Activity },
];

function pickIcon(label: string): ComponentType<{ className?: string }> {
  for (const rule of ICON_BY_LABEL) {
    if (rule.match.test(label)) return rule.icon;
  }
  return Activity;
}

const SLOT_COUNT = 4;

export function InfluencerCardMetrics({ metrics }: InfluencerCardMetricsProps) {
  // Always render 4 slots, padding with em-dash placeholders so the grid
  // keeps its 2×2 shape regardless of how many metrics the caller passes.
  const slots: (InfluencerCardMetric | null)[] = [];
  for (let i = 0; i < SLOT_COUNT; i += 1) {
    slots.push(metrics[i] ?? null);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((metric, idx) => {
        const Icon = metric ? pickIcon(metric.label) : Activity;
        return (
          <div
            key={idx}
            className="flex flex-col gap-1 rounded-lg bg-[#eceae3] px-3 py-2.5"
            title={metric?.hint}
          >
            <div
              className="flex items-center gap-1"
              style={{
                color: TEXT.muted,
                fontSize: TYPE.metricLabel.size,
                lineHeight: `${TYPE.metricLabel.lineHeight}px`,
                letterSpacing: TYPE.metricLabel.tracking,
              }}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{metric?.label ?? "—"}</span>
            </div>
            <span
              className="truncate"
              style={{
                color: metric?.highlight ? TEXT.highlight : TEXT.primary,
                fontSize: 16,
                lineHeight: "20px",
                fontWeight: TYPE.metricValue.weight,
                letterSpacing: TYPE.metricValue.tracking,
              }}
            >
              {metric?.value ?? "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
