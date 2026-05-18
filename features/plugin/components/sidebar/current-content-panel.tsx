"use client";

import {
  Activity,
  Check,
  ChevronDown,
  CircleHelp,
  MessageCircle,
  Play,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import type { CreatorProfile, MetricAggregation } from "@/features/plugin/types";
import { Button } from "@/components/ui/button";

import {
  getCreatorBrandMentions,
  getCreatorCollaborationCount,
  getCreatorCoreMetricValue,
  SCRAPE_COUNT_OPTIONS,
} from "./shared";
import { TopicWordCloud } from "./TopicWordCloud";
import { SampleTrafficChart } from "./sample-traffic-chart";
import { AggregateKpiTile, BasicStatTile, KpiTile, Section } from "./current-tab-ui";

interface DiagnosticsValues {
  flopRate: number;
  hitRate: number;
  normalRange: string;
  stabilityText: string;
}

interface ContentDataPanelProps {
  creator: CreatorProfile;
  creatorType: string;
  diagnostics: DiagnosticsValues;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  metricsRangeMenuOpen: boolean;
  onToggleMetricsRangeMenu: () => void;
  creatorCpm: string;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
}

// 中位数 / 平均数 可切换的核心指标。互动率不在此列 —— 它是比率，没有「中位 / 平均」之分。
type AggregableMetric = "plays" | "likes" | "comments" | "shares";

const AGGREGABLE_METRICS: Array<{
  key: AggregableMetric;
  icon: React.ComponentType<{ className?: string }>;
  noun: string;
}> = [
  { key: "plays", icon: Play, noun: "观看" },
  { key: "likes", icon: ThumbsUp, noun: "点赞" },
  { key: "comments", icon: MessageCircle, noun: "评论" },
  { key: "shares", icon: Share2, noun: "分享" },
];

// 「内容数据」面板：核心控制条（样本 / CPM / 数据透视）作为首行，
// 之后依次是博主基础数据、核心指标、流量表现、话题提及、品牌提及。
// 核心指标与受众口径对齐 Web 端「博主库」博主信息卡片 —— 同一套指标，
// 只是呈现在不同端口。
export function ContentDataPanel({
  creator,
  creatorType,
  diagnostics,
  scrapeCount,
  onChangeScrapeCount,
  metricsRangeMenuOpen,
  onToggleMetricsRangeMenu,
  creatorCpm,
  dataCheckOn,
  onToggleDataCheck,
}: ContentDataPanelProps) {
  // 每个可切换指标各自记住「中位数 / 平均数」选择，默认中位数。
  const [aggregates, setAggregates] = useState<Record<AggregableMetric, MetricAggregation>>({
    plays: "median",
    likes: "median",
    comments: "median",
    shares: "median",
  });
  const setAggregate = (metric: AggregableMetric) => (next: MetricAggregation) =>
    setAggregates((prev) => ({ ...prev, [metric]: next }));

  const collaborationCount = getCreatorCollaborationCount(creator);
  const brandMentions = getCreatorBrandMentions(creator);

  return (
    <div className="space-y-4">
      <ScopeControlsRow
        scrapeCount={scrapeCount}
        onChangeScrapeCount={onChangeScrapeCount}
        metricsRangeMenuOpen={metricsRangeMenuOpen}
        onToggleMetricsRangeMenu={onToggleMetricsRangeMenu}
        creatorCpm={creatorCpm}
        dataCheckOn={dataCheckOn}
        onToggleDataCheck={onToggleDataCheck}
      />

      <Section title="博主基础数据">
        <div className="grid grid-cols-3 gap-1.5">
          <BasicStatTile label="类目" value={creatorType || "—"} />
          <BasicStatTile label="粉丝" value={creator.followers || "—"} />
          <BasicStatTile label="合作次数" value={`${collaborationCount} 次`} />
        </div>
      </Section>

      <Section title="核心指标">
        <div className="grid grid-cols-2 gap-1.5">
          {AGGREGABLE_METRICS.slice(0, 1).map((metric) => (
            <CoreMetricTile
              key={metric.key}
              creator={creator}
              metric={metric}
              aggregate={aggregates[metric.key]}
              onAggregateChange={setAggregate(metric.key)}
              scrapeCount={scrapeCount}
            />
          ))}
          {/* 互动率是比率，没有中位 / 平均之分 —— 不带切换开关。 */}
          <KpiTile icon={Activity} label="互动率" value={creator.er || "—"} tone="highlight" />
          {AGGREGABLE_METRICS.slice(1).map((metric) => (
            <CoreMetricTile
              key={metric.key}
              creator={creator}
              metric={metric}
              aggregate={aggregates[metric.key]}
              onAggregateChange={setAggregate(metric.key)}
              scrapeCount={scrapeCount}
            />
          ))}
        </div>
      </Section>

      <Section title="近期流量表现">
        <SampleTrafficChart creator={creator} scrapeCount={scrapeCount} diagnostics={diagnostics} />
      </Section>

      {creator.topics && creator.topics.length > 0 ? (
        <Section title="话题提及">
          <div className="rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-3">
            <TopicWordCloud topics={creator.topics} />
          </div>
        </Section>
      ) : null}

      {brandMentions.length > 0 ? (
        <Section title="品牌提及">
          <div className="flex flex-wrap gap-1.5">
            {brandMentions.map((item) => (
              <span
                key={item.brand}
                className="inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2 py-0.5 text-[11px] text-[#36342e]"
              >
                {item.brand}
                <span className="text-[10px] text-[#939084]">×{item.count}</span>
              </span>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

// 单个可切换核心指标格：标签随口径在「中位数 / 平均数」间切换。
function CoreMetricTile({
  creator,
  metric,
  aggregate,
  onAggregateChange,
  scrapeCount,
}: {
  creator: CreatorProfile;
  metric: {
    key: AggregableMetric;
    icon: React.ComponentType<{ className?: string }>;
    noun: string;
  };
  aggregate: MetricAggregation;
  onAggregateChange: (next: MetricAggregation) => void;
  scrapeCount: number;
}) {
  const prefix = aggregate === "median" ? "中位数" : "平均数";
  return (
    <AggregateKpiTile
      icon={metric.icon}
      label={`${prefix}${metric.noun}`}
      value={getCreatorCoreMetricValue(creator, metric.key, aggregate, scrapeCount)}
      tone="neutral"
      aggregate={aggregate}
      onAggregateChange={onAggregateChange}
    />
  );
}

// 核心控制条：样本取样 + CPM + 数据透视，无卡片边框，作为内容数据首行。
function ScopeControlsRow({
  scrapeCount,
  onChangeScrapeCount,
  metricsRangeMenuOpen,
  onToggleMetricsRangeMenu,
  creatorCpm,
  dataCheckOn,
  onToggleDataCheck,
}: {
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  metricsRangeMenuOpen: boolean;
  onToggleMetricsRangeMenu: () => void;
  creatorCpm: string;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="relative">
        <Button
          unstyled
          type="button"
          onClick={onToggleMetricsRangeMenu}
          aria-haspopup="listbox"
          aria-expanded={metricsRangeMenuOpen}
          className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[#201515] transition-colors hover:text-[#ff4f00]"
        >
          <span>近 {scrapeCount} 条</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-[#939084] transition-transform",
              metricsRangeMenuOpen && "rotate-180",
            )}
          />
        </Button>
        {metricsRangeMenuOpen ? (
          <div
            role="listbox"
            className="absolute top-full left-0 z-30 mt-1 w-[108px] overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] shadow-[0_8px_20px_-12px_rgba(20,20,19,0.32)]"
          >
            {SCRAPE_COUNT_OPTIONS.map((opt) => (
              <Button
                unstyled
                key={opt}
                type="button"
                role="option"
                aria-selected={opt === scrapeCount}
                onClick={() => {
                  onChangeScrapeCount(opt);
                  onToggleMetricsRangeMenu();
                }}
                className={cn(
                  "flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[#eceae3]",
                  opt === scrapeCount ? "font-semibold text-[#ff4f00]" : "text-[#36342e]",
                )}
              >
                <span>近 {opt} 条</span>
                {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <span aria-hidden className="text-[#b5b2aa]">
        ·
      </span>
      <span className="text-[12px] font-medium text-[#36342e]">CPM {creatorCpm}</span>

      <div className="ml-auto flex items-center gap-1 text-[12px] font-medium text-[#36342e]">
        <span>数据透视</span>
        <span className="group/tip relative inline-flex">
          <CircleHelp className="h-3.5 w-3.5 cursor-help text-[#b5b2aa] transition-colors hover:text-[#939084]" />
          <span
            role="tooltip"
            className="pointer-events-none absolute top-full right-0 z-40 mt-1.5 w-56 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-2 text-[11px] leading-[1.55] text-[#36342e] opacity-0 transition-opacity group-hover/tip:opacity-100"
          >
            开启数据透视后，会在当前页面叠加播放量、平均播放与互动率数据，并按平均播放量排序前 N
            条视频。若取数异常，刷新网页即可。
          </span>
        </span>
        <Toggle
          checked={dataCheckOn}
          onCheckedChange={onToggleDataCheck}
          size="sm"
          aria-label="数据透视开关"
        />
      </div>
    </div>
  );
}
