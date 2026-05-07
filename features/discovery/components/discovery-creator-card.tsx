"use client";

import { Bookmark, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { InfluencerCard } from "@/features/plugin/components/influencer-card";
import type {
  CoverCount,
  InfluencerCardSampleConfig,
  ScrapeCount,
} from "@/features/plugin/components/influencer-card/types";

import type { CreatorCardData } from "../chat-types";
import { T } from "../data/tokens";
import { mapCreatorToInfluencerCard } from "./map-creator";

interface DiscoveryCreatorCardProps {
  creator: CreatorCardData;
  status: "pending" | "saved" | "skipped";
  onSave: (creator: CreatorCardData) => void;
  onSkip: (creator: CreatorCardData) => void;
}

const DEFAULT_SAMPLE: InfluencerCardSampleConfig = {
  scrapeCount: 10,
  coverCount: 5,
  perspective: false,
};

// Discovery-side wrapper around the shared InfluencerCard. It owns per-card
// tag and sample-config state (which the card needs to render its filter bar
// and tag chips), and renders the discovery-only save/skip strip BELOW the
// card so the card chrome stays byte-identical to the plugin demo.
//
// 不传 onOpenAnalysis：博主发现里的卡片是"未入库"的搜索结果，按"未入库 → 没
// 有信息卡"规则不应有"查看完整档案"入口。用户只能先收藏（onSave）后再去博
// 主库点开抽屉。
export function DiscoveryCreatorCard({
  creator,
  status,
  onSave,
  onSkip,
}: DiscoveryCreatorCardProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [sample, setSample] = useState<InfluencerCardSampleConfig>(DEFAULT_SAMPLE);

  const data = useMemo(
    () => mapCreatorToInfluencerCard(creator, { tags, sample }),
    [creator, tags, sample],
  );

  const handleAddTag = useCallback((label: string) => {
    setTags((prev) => (prev.includes(label) ? prev : [...prev, label]));
  }, []);
  const handleRemoveTag = useCallback((label: string) => {
    setTags((prev) => prev.filter((t) => t !== label));
  }, []);
  const handleEditTag = useCallback((oldLabel: string, newLabel: string) => {
    setTags((prev) => {
      const next = prev.filter((t) => t !== oldLabel);
      const trimmed = newLabel.trim();
      return trimmed ? [...next, trimmed] : next;
    });
  }, []);

  const handleScrapeCount = useCallback(
    (next: ScrapeCount) => setSample((s) => ({ ...s, scrapeCount: next })),
    [],
  );
  const handleCoverCount = useCallback(
    (next: CoverCount) => setSample((s) => ({ ...s, coverCount: next })),
    [],
  );
  const handleTogglePerspective = useCallback(
    () => setSample((s) => ({ ...s, perspective: !s.perspective })),
    [],
  );

  const isSaved = status === "saved";
  const isSkipped = status === "skipped";

  return (
    <div
      className="flex flex-col items-center gap-2 transition-opacity"
      style={{ opacity: isSkipped ? 0.5 : 1 }}
    >
      <InfluencerCard
        data={data}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onEditTag={handleEditTag}
        onChangeScrapeCount={handleScrapeCount}
        onChangeCoverCount={handleCoverCount}
        onTogglePerspective={handleTogglePerspective}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSave(creator)}
          aria-label={isSaved ? "取消收藏" : "收藏"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
          style={{
            backgroundColor: isSaved ? T.terracotta : "transparent",
            color: isSaved ? "white" : T.stone,
            borderColor: isSaved ? T.terracotta : T.border,
          }}
        >
          <Bookmark size={14} fill={isSaved ? "white" : "transparent"} />
        </button>
        <button
          type="button"
          onClick={() => onSkip(creator)}
          aria-label={isSkipped ? "取消跳过" : "跳过"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
          style={{
            backgroundColor: isSkipped ? T.parchment : "transparent",
            color: T.stone,
            borderColor: T.border,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
