// 把 5 个子分数 + 权重模板拼成一个 internal_score（0-100），并产出 radar /
// subscoresDetail / tradeoffs / narrative 所需的中间结构。
//
// 这一层不知道 mode 是 comprehensive 还是 budget——budget 的"价格相似度"
// 在 service 上层叠加。把"通用 5 维 → internal_score"独立出来，是为了让
// budget mode 复用同一份评分输出。

import type { Creator, SimilarAxisKey, SimilarRadar, SimilarSubscoreDetail } from "@/types/api";
import { AXIS_LABEL, type WeightTemplate } from "./weights";
import { toDisplayScore, weightedAggregate } from "./normalize";
import { scoreActivity } from "./activity";
import { scoreData } from "./data-match";
import { scoreFormat, type FormatSubscoreResult } from "./format";
import { scoreTopic, type TopicSubscoreResult } from "./topic";
import { scoreVisual, type VisualSubscoreResult } from "./visual";

export type AggregateResult = {
  internalScore: number;
  displayScore: number;
  radar: SimilarRadar;
  subscoresDetail: Record<SimilarAxisKey, SimilarSubscoreDetail>;
  topic: TopicSubscoreResult;
  format: FormatSubscoreResult;
  visual: VisualSubscoreResult;
  // 详情抽屉用：把所有数字组件原样保留。
  components: {
    topic: number;
    format: number;
    visual: number;
    data: number;
    activity: number;
  };
};

export type AggregateInput = {
  seed: Creator;
  candidate: Creator;
  template: WeightTemplate;
  now?: Date;
};

export function aggregateSimilarity(input: AggregateInput): AggregateResult {
  const { seed, candidate, template, now } = input;

  const topic = scoreTopic({ seed, candidate });
  const format = scoreFormat({ seed, candidate });
  const visual = scoreVisual({ seed, candidate });
  const data = scoreData({ seed, candidate });
  const activity = scoreActivity(candidate, now);

  const internalScore = weightedAggregate(
    {
      topic: topic.score,
      format: format.score,
      visual: visual.score,
      data: data.score,
      activity: activity.score,
    },
    template.weights,
  );

  const subscoresDetail: Record<SimilarAxisKey, SimilarSubscoreDetail> = {
    topic: {
      score: topic.score,
      components: topic.components,
      evidence: topic.evidence,
    },
    format: {
      score: format.score,
      components: format.components,
      evidence: format.evidence,
    },
    visual: {
      score: visual.score,
      components: visual.components,
      evidence: visual.evidence,
    },
    data: {
      score: data.score,
      components: data.components,
      evidence: data.evidence,
    },
    activity: {
      score: activity.score,
      components: activity.components,
      evidence: activity.evidence,
    },
  };

  const axes: SimilarRadar["axes"] = (
    ["topic", "format", "visual", "data", "activity"] as SimilarAxisKey[]
  ).map((key) => ({
    key,
    label: AXIS_LABEL[key],
    internal: subscoresDetail[key].score,
    display: toDisplayScore(subscoresDetail[key].score),
  }));

  return {
    internalScore,
    displayScore: toDisplayScore(internalScore),
    radar: { axes, baseline: 5.0 },
    subscoresDetail,
    topic,
    format,
    visual,
    components: {
      topic: topic.score,
      format: format.score,
      visual: visual.score,
      data: data.score,
      activity: activity.score,
    },
  };
}

// 给 service 层用的"主要分歧"抽取器。比较两个 Creator 的关键数据差异，
// 选出 1-3 条描述给 tradeoffs。
export function deriveTradeoffs(seed: Creator, candidate: Creator): string[] {
  const tradeoffs: string[] = [];

  if (seed.followers > 0 && candidate.followers > 0) {
    const ratio = candidate.followers / seed.followers;
    if (ratio < 0.5 || ratio > 2) {
      tradeoffs.push(
        `粉丝量级差异较大（${formatCompact(candidate.followers)} vs ${formatCompact(seed.followers)}）`,
      );
    }
  }

  const erGap = candidate.engagementRate - seed.engagementRate;
  if (Math.abs(erGap) >= 1.5) {
    tradeoffs.push(
      erGap > 0
        ? `互动率更高（${candidate.engagementRate.toFixed(1)}% vs ${seed.engagementRate.toFixed(1)}%）`
        : `互动率偏低（${candidate.engagementRate.toFixed(1)}% vs ${seed.engagementRate.toFixed(1)}%）`,
    );
  }

  if (candidate.collaborations.length === 0) {
    tradeoffs.push("尚无品牌合作记录");
  }

  return tradeoffs.slice(0, 3);
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}
