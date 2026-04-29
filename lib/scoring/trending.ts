// 找爆款达人 —— 推荐分公式
// 来源：博主发现页实现逻辑.md §5.5
//
// 爆款达人推荐分 =
//   近期爆发倍数 35%
// + 品类相关性   25%
// + 增长速度     20%
// + 稳定性       10%
// + 商业可用性   10%

export type TrendingScoreInput = {
  burstMultiplier: number;       // 0-100
  categoryRelevance: number;     // 0-100
  growthSpeed: number;           // 0-100
  stability: number;             // 0-100
  commercialAvailability: number;// 0-100
};

export function trendingScore(input: TrendingScoreInput): number {
  return Math.round(
    input.burstMultiplier * 0.35 +
      input.categoryRelevance * 0.25 +
      input.growthSpeed * 0.2 +
      input.stability * 0.1 +
      input.commercialAvailability * 0.1,
  );
}

// 达人类型标签判断
export function classifyTrendType(args: {
  highPerfPostCount: number;     // 近期高于本人基线 2x 的帖子数
  followers: number;
  engagementRate: number;
  growth30d: number;             // 近 30 天涨幅
}): "持续增长" | "单条爆款" | "高互动小号" | "新晋潜力" | "稳定高表现" {
  if (args.highPerfPostCount >= 3) return "持续增长";
  if (args.followers < 50_000 && args.engagementRate > 0.06) return "高互动小号";
  if (args.growth30d > 0.5) return "新晋潜力";
  if (args.highPerfPostCount === 1) return "单条爆款";
  return "稳定高表现";
}
