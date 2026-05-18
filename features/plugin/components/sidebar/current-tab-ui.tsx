"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MetricAggregation } from "@/features/plugin/types";

// 「博主分析」页共享的视觉基元。配色严格走 docs/DESIGN.md 的 Linkr 暖色系：
// 橙主色 + 暖近黑 + 暖中灰 + 沙色，不引入冷蓝 / 草绿 / 玫红。

export const CURRENT_PALETTE = {
  primary: "#ff4f00",
  coral: "#ff8a5c",
  dark: "#3a3431",
  graphite: "#7a6e5c",
  sand: "#c5b89e",
} as const;

export type TileTone = "highlight" | "neutral";

// 所有数据框统一用悬浮卡片同款暖灰底色（#eceae3，无边框），保持设计调性一致；
// highlight 与 neutral 仅在数值文字颜色上区分（关键指标走品牌橙，其余走近黑）。
const TILE_CARD = "bg-[#eceae3]";

const TILE_TONE: Record<TileTone, { card: string; label: string; value: string; icon: string }> = {
  highlight: {
    card: TILE_CARD,
    label: "text-[#939084]",
    value: "text-[#ff4f00]",
    icon: "#ff4f00",
  },
  neutral: {
    card: TILE_CARD,
    label: "text-[#939084]",
    value: "text-[#201515]",
    icon: "#ff4f00",
  },
};

export function tileTone(tone: TileTone) {
  return TILE_TONE[tone];
}

// 关键指标（报价 / 互动率）走 highlight，其余走 neutral。
export const METRIC_TONE: Record<string, TileTone> = {
  rate: "highlight",
  engagementOrViews: "highlight",
  plays: "neutral",
  likes: "neutral",
  comments: "neutral",
};

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span aria-hidden className="h-2 w-2 rounded-full bg-[#ff4f00]" />
        <h3 className="text-[13px] font-semibold text-[#201515]">{title}</h3>
        {subtitle ? <span className="text-[11px] text-[#939084]">{subtitle}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function BasicStatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: TileTone;
}) {
  const t = TILE_TONE[tone];
  return (
    <div className={`rounded-[8px] px-2.5 py-1.5 ${t.card}`}>
      <p className={`text-[10.5px] ${t.label}`}>{label}</p>
      <p
        className={`mt-0 truncate text-[13.5px] font-semibold tabular-nums ${t.value}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export function KpiTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: TileTone;
}) {
  const t = TILE_TONE[tone];
  return (
    <div className={`rounded-[8px] px-3 py-1.5 ${t.card}`}>
      <div className={`flex items-center gap-1 text-[10.5px] font-medium ${t.label}`}>
        <span className="inline-flex items-center" style={{ color: t.icon }}>
          <Icon className="h-3 w-3" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-0 truncate text-[15px] font-semibold tabular-nums ${t.value}`}>
        {value}
      </div>
    </div>
  );
}

// 中位数 ↔ 平均数 切换胶囊。与 Web 端博主库信息卡的「中 / 均」开关同款交互，
// 让用户一眼看出：这个指标的口径是可切换的。
function AggregateToggle({
  value,
  onChange,
}: {
  value: MetricAggregation;
  onChange: (next: MetricAggregation) => void;
}) {
  const opts: { id: MetricAggregation; label: string; title: string }[] = [
    { id: "median", label: "中", title: "中位数" },
    { id: "average", label: "均", title: "平均数" },
  ];
  return (
    <div className="inline-flex shrink-0 rounded-full border border-[#c5c0b1] bg-[#fffefb] p-0.5 text-[10px]">
      {opts.map((opt) => {
        const active = opt.id === value;
        return (
          <Button
            unstyled
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            title={opt.title}
            aria-pressed={active}
            className={cn(
              "rounded-full px-1.5 py-0.5 transition-colors",
              active ? "bg-[#ff4f00] text-[#fffefb]" : "text-[#36342e] hover:text-[#201515]",
            )}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

// KpiTile 的「可切换口径」变体：标签行右侧带一个中 / 均开关。
// 用于核心指标里中位数 / 平均数可切换的指标（观看 / 点赞 / 评论 / 分享）。
export function AggregateKpiTile({
  icon: Icon,
  label,
  value,
  tone,
  aggregate,
  onAggregateChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: TileTone;
  aggregate: MetricAggregation;
  onAggregateChange: (next: MetricAggregation) => void;
}) {
  const t = TILE_TONE[tone];
  return (
    <div className={`rounded-[8px] px-3 py-1.5 ${t.card}`}>
      <div className="flex items-center justify-between gap-1">
        <div className={`flex min-w-0 items-center gap-1 text-[10.5px] font-medium ${t.label}`}>
          <span className="inline-flex items-center" style={{ color: t.icon }}>
            <Icon className="h-3 w-3" />
          </span>
          <span className="truncate">{label}</span>
        </div>
        <AggregateToggle value={aggregate} onChange={onAggregateChange} />
      </div>
      <div className={`mt-0 truncate text-[15px] font-semibold tabular-nums ${t.value}`}>
        {value}
      </div>
    </div>
  );
}
