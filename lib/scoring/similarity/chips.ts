// 核心特征 chip 派生（spec §4.6.3）。
//
// 4 类信号 → 4-8 个 chip。每类有数量上限，避免某一类把面板挤满。
// chip 文案必须从预设词库选择，禁止 LLM 自由编写（保持视觉一致 + 多语言可控）。

import type { Creator, SimilarChipCategory, SimilarCoreChip, SimilarSearchMode } from "@/types/api";
import type { FormatSubscoreResult } from "./format";
import type { TopicSubscoreResult } from "./topic";
import type { VisualSubscoreResult } from "./visual";

export type ChipDeriveInput = {
  seed: Creator;
  candidate: Creator;
  mode: SimilarSearchMode;
  topic: TopicSubscoreResult;
  format: FormatSubscoreResult;
  visual: VisualSubscoreResult;
  // budget mode 用到的成本指标。Phase 0 启发式由 service 上层算好后传入。
  altSignals?: {
    savingPct: number | null;
    cpmDeltaPct: number | null;
  };
};

const CATEGORY_CAPS: Record<SimilarChipCategory, number> = {
  alt: 2,
  topic: 2,
  format: 3,
  visual: 3,
};

const FORMAT_TAG_TO_CHIP: Record<string, string> = {
  vlog: "沉浸式 Vlog",
  tutorial: "教程向",
  unboxing: "开箱向",
  review: "产品测试",
  lifestyle: "生活方式",
  promo: "促销驱动",
  comedy: "段子向",
  shopping: "购物分享",
};

export function deriveCoreChips(input: ChipDeriveInput): SimilarCoreChip[] {
  const chips: SimilarCoreChip[] = [];

  if (input.mode === "budget" && input.altSignals) {
    const { savingPct, cpmDeltaPct } = input.altSignals;
    if (savingPct !== null && savingPct >= 30) {
      chips.push({ label: "报价更低", category: "alt" });
    }
    if (cpmDeltaPct !== null && cpmDeltaPct <= -30) {
      chips.push({ label: "CPM 更优", category: "alt" });
    }
  }

  if (input.topic.score >= 80) {
    chips.push({ label: "受众重合", category: "topic" });
  } else if (input.topic.score >= 55) {
    chips.push({ label: "话题接近", category: "topic" });
  }
  if (input.topic.components.topicRecent >= 60) {
    chips.push({ label: "话题叠加多", category: "topic" });
  }

  for (const tag of input.format.candidateFormatTags.keys()) {
    const label = FORMAT_TAG_TO_CHIP[tag];
    if (!label) continue;
    chips.push({ label, category: "format" });
  }

  for (const tag of input.visual.candidateAestheticTags) {
    chips.push({ label: tag, category: "visual" });
  }
  if (input.seed.category === input.candidate.category) {
    chips.push({ label: "同分类调性", category: "visual" });
  }

  return capByCategory(chips, CATEGORY_CAPS, 8);
}

function capByCategory(
  chips: SimilarCoreChip[],
  caps: Record<SimilarChipCategory, number>,
  totalCap: number,
): SimilarCoreChip[] {
  const seen = new Set<string>();
  const buckets: Record<SimilarChipCategory, SimilarCoreChip[]> = {
    alt: [],
    topic: [],
    format: [],
    visual: [],
  };

  for (const chip of chips) {
    const key = `${chip.category}::${chip.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const bucket = buckets[chip.category];
    if (bucket.length >= caps[chip.category]) continue;
    bucket.push(chip);
  }

  const ordered: SimilarCoreChip[] = [
    ...buckets.alt,
    ...buckets.topic,
    ...buckets.format,
    ...buckets.visual,
  ];
  return ordered.slice(0, totalCap);
}
