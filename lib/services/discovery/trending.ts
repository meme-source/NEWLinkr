// 博主发现 · 维度三 — 对标分类爆款博主
//
// 文档：博主发现页实现逻辑.md §5.3。从近 14 天本品类的爆款帖反推"爆款特征"，
// 再去匹配近期也跑出过类似形态的可建联达人。
//
// v3 链路（§5.3 Step 1-4）：
//   Step 1  解析产品 → category（与维度二共享缓存）
//   Step 2  扫近 14 天该品类爆款帖（views >= viral_threshold 或 ER >= viral_er，
//           阈值来自 baseline_views 表）
//   Step 3  从爆款帖里提取爆款特征 → FeatureGroup[]（hashtag 共现聚类 + caption
//           关键词 + 时长 + 增长曲线分类）
//   Step 4  按 FeatureGroup 匹配可建联达人，按"近 14 天峰值 / 90 天中位数"降序

import type {
  DiscoveryServiceResult,
  FeatureGroup,
  OutputCreator,
  SearchBasis,
  SeedCreator,
  TrendingCreatorResult,
  TrendingDiscoveryRequest,
  TrendingSeedInput,
} from "@/types/api";
import { matchByFeatureGroup } from "@/lib/services/feature-match";
import { buildBuildingResult, newSearchId } from "./_shared";

// ===== v3：对标分类爆款博主 =====

// 选种子：§5.3 Step 2-3。
// 维度三的种子比较特殊 —— 是"近 14 天本品类的爆款帖（去重到 creator）"，
// 而不是事先存在的强证据合作达人。
export async function selectTrendingSeeds(
  _input: TrendingSeedInput,
): Promise<{ seeds: SeedCreator[]; featureGroups: FeatureGroup[] }> {
  // MVP stub：等 §3.4 本地达人库 + baseline_views 表建好之后落地。
  // 维度三的特征聚合直接发生在选种子时（爆款帖本身就是聚类原材料），
  // 所以这一步同时产出 seeds 与 featureGroups。
  return { seeds: [], featureGroups: [] };
}

export async function discoverTrendingCreators(
  input: TrendingSeedInput,
): Promise<DiscoveryServiceResult> {
  const { seeds, featureGroups } = await selectTrendingSeeds(input);

  if (featureGroups.length === 0) {
    return buildBuildingResult("trending_creators", input.category, input.chips);
  }

  const creatorsByGroup: Record<string, OutputCreator[]> = {};
  let total = 0;
  for (const group of featureGroups) {
    const matched = await matchByFeatureGroup({
      project_id: input.project_id,
      group,
      category: input.category,
      chips: input.chips,
    });
    creatorsByGroup[group.group_id] = matched;
    total += matched.length;
  }

  return {
    search_id: newSearchId("trending_creators"),
    dataset_status: "ready",
    basis: {
      intent: "trending_creators",
      platform: input.chips.platform,
      country: input.chips.country,
      product_url: null,
      seed_count: seeds.length,
      seed_basis_description: `依据近 ${input.time_range_days} 天 ${seeds.length} 条爆款帖`,
      total_output: total,
    },
    seeds: {
      creator_ids: seeds.map((s) => s.creator_id),
      selection_reason: "viral within last 14 days vs category baseline",
    },
    feature_groups: featureGroups,
    creators_by_group: creatorsByGroup,
    output: { total },
    message: null,
  };
}

// ===== v2 兼容层 =====

export type TrendingDiscoveryResult = {
  basis: SearchBasis;
  results: TrendingCreatorResult[];
};

export async function discoverByTrending(
  input: TrendingDiscoveryRequest,
): Promise<TrendingDiscoveryResult> {
  return {
    basis: {
      platform: input.platform,
      category: input.category,
      timeRangeDays: input.timeRangeDays,
      postsAnalyzed: 0,
      candidatesFound: 0,
    },
    results: [],
  };
}
