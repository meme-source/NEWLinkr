"use client";

import { CreatorProfileHeader } from "@/features/plugin/components/creator-profile-header";

import { InfluencerCardAnalysis } from "./InfluencerCardAnalysis";
import { InfluencerCardFilterBar } from "./InfluencerCardFilterBar";
import { InfluencerCardFooter } from "./InfluencerCardFooter";
import { InfluencerCardMetrics } from "./InfluencerCardMetrics";
import { BORDER, CARD } from "./tokens";
import type { InfluencerCardProps } from "./types";

// Layout (per the handoff spec — "古典优雅" 5.0 replica):
//   1. Header    — unified CreatorProfileHeader (avatar + handle + country/type
//                  pills + email pill + heart + tag row). Shared with the
//                  sidebar / similar-tab / floating-card surfaces so the
//                  "creator identity strip" stays consistent across the plugin.
//   2. Filter    — 样本设置 [最近 N 条] [封面 N] + 数据透视 toggle
//   3. Metrics   — 核心数据:2×2 Solid-Tile grid with icons
//   4. Analysis  — 深度分析:一片客观特征 tag,底色标维度(取代旧雷达图)
//   5. Footer    — "查看完整档案 →" link
export function InfluencerCard({
  data,
  bannerSlot,
  onOpenAnalysis,
  onOpenEmailSidebar,
  onToggleSave,
  onChangeScrapeCount,
  onChangeCoverCount,
  onTogglePerspective,
  onAddTag,
  onRemoveTag,
  onEditTag,
}: InfluencerCardProps) {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        width: CARD.width,
        background: CARD.background,
        borderRadius: CARD.radius,
        border: `1px solid ${BORDER.hairline}`,
      }}
    >
      <div className="px-4 pt-3 pb-2">
        <CreatorProfileHeader
          name={data.name}
          handle={data.handle}
          flag={data.flag}
          country={data.countryLabel}
          creatorType={data.creatorType}
          email={data.emailAddress}
          hasEmail={data.hasEmail}
          onOpenEmailSidebar={onOpenEmailSidebar ?? (() => undefined)}
          isSaved={data.isSaved}
          onToggleSave={onToggleSave ?? (() => undefined)}
          // 逐个筛选卡片底部已有独立的「收藏」按钮,标题行不再重复 ♥ 入口。
          showSaveToggle={false}
          tags={data.tags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onEditTag={onEditTag}
        />
      </div>

      <div className="flex flex-col gap-0.5 px-2 pb-2" style={{ background: CARD.bodyBackground }}>
        <InfluencerCardFilterBar
          sample={data.sample}
          onChangeScrapeCount={onChangeScrapeCount}
          onChangeCoverCount={onChangeCoverCount}
          onTogglePerspective={onTogglePerspective}
        />

        <div className="flex flex-col gap-2 px-2">
          {bannerSlot ?? null}
          <InfluencerCardMetrics metrics={data.metrics} />
          <InfluencerCardAnalysis tags={data.analysis} />
          {onOpenAnalysis ? <InfluencerCardFooter onOpenAnalysis={onOpenAnalysis} /> : null}
        </div>
      </div>
    </div>
  );
}
