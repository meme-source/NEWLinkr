"use client";

import { InfluencerCardChips } from "./InfluencerCardChips";
import { InfluencerCardFilterBar } from "./InfluencerCardFilterBar";
import { InfluencerCardFooter } from "./InfluencerCardFooter";
import { InfluencerCardHeader } from "./InfluencerCardHeader";
import { InfluencerCardMetrics } from "./InfluencerCardMetrics";
import { BORDER, CARD } from "./tokens";
import type { InfluencerCardProps } from "./types";

// Layout (per the floating-creator-card reference image):
//   1. Header  — avatar + handle, then two info pills (country + creator type)
//   2. Filter  — sample-count pill ("最近 N 条") + 数据透视 toggle
//   3. Chips   — feature pills row
//   4. Metrics — 2×2 Solid-Tile grid with icons
//   5. Footer  — single "查看完整档案 →" link
//
// `InfluencerCardTagInput` and `InfluencerCardRadar` were retired from the
// default render per the reference image. The components are still exported
// from this directory and can be reintroduced by callers that need them.
export function InfluencerCard({
  data,
  bannerSlot,
  onOpenAnalysis,
  onSendEmail,
  onChangeScrapeCount,
  onChangeCoverCount,
  onTogglePerspective,
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
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
        <InfluencerCardHeader
          handle={data.handle}
          countryCode={data.countryCode}
          countryLabel={data.countryLabel}
          creatorType={data.creatorType}
          email={data.email}
          initials={data.initials}
          onSendEmail={onSendEmail}
        />
      </div>

      <div className="flex flex-col gap-3 px-2 pb-3" style={{ background: CARD.bodyBackground }}>
        <InfluencerCardFilterBar
          sample={data.sample}
          onChangeScrapeCount={onChangeScrapeCount}
          onChangeCoverCount={onChangeCoverCount}
          onTogglePerspective={onTogglePerspective}
        />

        <div className="flex flex-col gap-3 px-2">
          {bannerSlot ?? null}
          <InfluencerCardChips features={data.features} />
          <InfluencerCardMetrics metrics={data.metrics} />
          {onOpenAnalysis ? <InfluencerCardFooter onOpenAnalysis={onOpenAnalysis} /> : null}
        </div>
      </div>
    </div>
  );
}
