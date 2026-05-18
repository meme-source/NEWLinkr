// 数据量级匹配度（spec §4.3 维度 4）。
//
//   ratio = min(seed, cand) / max(seed, cand)
//   data_score = ratio × 100
//
// 表达"投放成本可比性"：不要求粉丝/中位播放完全一样，而是不能差太远。
// 0 或缺失数据时退化为中性 50，避免把"还没建库存的新号"砸到 0。

import type { Creator } from "@/types/api";
import { toInternalScore } from "./normalize";

export type DataSubscoreInput = {
  seed: Creator;
  candidate: Creator;
};

export type DataSubscoreResult = {
  score: number;
  components: {
    medianViewsRatio: number;
    engagementGap: number;
  };
  evidence: string[];
};

function ratio(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return 0.5;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo / hi;
}

export function scoreData(input: DataSubscoreInput): DataSubscoreResult {
  const { seed, candidate } = input;
  const viewsRatio = ratio(seed.medianViews, candidate.medianViews);
  const medianViewsScore = toInternalScore(viewsRatio * 100);

  // ER tiebreak（spec §4.3 注：不进核心公式，只在并列时帮忙）。用差值距离
  // 表达：完全一样得 100，差 5 个百分点得 50。这里只是一个 component 给抽屉看。
  const erGap = Math.abs(seed.engagementRate - candidate.engagementRate);
  const erComponent = toInternalScore(100 - Math.min(100, erGap * 10));

  // 总分：以中位播放比为主（90%），ER 微调 10%。
  const score = toInternalScore(medianViewsScore * 0.9 + erComponent * 0.1);

  const evidence: string[] = [
    `中位播放：${formatCount(seed.medianViews)} vs ${formatCount(candidate.medianViews)}`,
    `ER：${seed.engagementRate.toFixed(1)}% vs ${candidate.engagementRate.toFixed(1)}%`,
  ];

  return {
    score,
    components: { medianViewsRatio: medianViewsScore, engagementGap: erComponent },
    evidence,
  };
}

function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}
