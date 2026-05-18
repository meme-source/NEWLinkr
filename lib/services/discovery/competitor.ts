// 博主发现 · 维度一 — 复刻竞品合作博主
//
// 文档：博主发现页实现逻辑.md §5.1。以"竞品最近的高表现达人"为隐性锚点，
// 输出下方可直接建联的同款组合 / 同类型达人。
//
// v3 链路（§3.1 Layer 1 → 4）：
//   Step 1  推断同类型品牌           ← brand_library + Exa 兜底
//   Step 2  扫帖子库找含品牌的证据贴 ← posts + GIN/trigram 索引
//   Step 3  查预算的合作证据强度      ← brand_mentions（离线 ETL 已打分）
//   Step 4  聚合到达人 → 种子集       ← 应用层：max(coop_views) >= baseline * 1.5
//   Step 5  特征聚合                  ← lib/services/feature-aggregation
//   Step 6  按特征组匹配可建联达人    ← lib/services/feature-match
//   Step 7  LLM 批量生成理由          ← 由上游 SSE handler 调度
//
// 当前文件提供 v3 service 骨架；同时保留 v2 `discoverByCompetitor` 让旧路由
// /api/discovery/competitor 不破。Phase 1 完成后，v2 函数可以下线。

import type {
  CompetitorDiscoveryRequest,
  CompetitorCreatorResult,
  CompetitorSeedInput,
  DiscoveryServiceResult,
  OutputCreator,
  SearchBasis,
  SeedCreator,
} from "@/types/api";
import { aggregateFeatures } from "@/lib/services/feature-aggregation";
import { matchByFeatureGroup } from "@/lib/services/feature-match";
import { buildBuildingResult, newSearchId } from "./_shared";

// ===== v3：复刻竞品合作博主 =====

// 选种子：§5.1 Step 1-4。
//   1. 推断 category + country 下的同类型品牌池（brand_library，Exa 兜底）
//   2. 在 posts 表里扫含品牌 mention/hashtag/handle 的帖子（GIN 索引）
//   3. 在 brand_mentions 表里取 evidence_strength = 'high' 的合作证据
//      （强度判定见 §9，离线 ETL 已打好分，不在此 LLM 化判别）
//   4. 聚合到 creator_id；保留 max(coop_views) >= 本人 90 天中位数 × 1.5 的达人，
//      按 performance_ratio 降序截前 30
export async function selectCompetitorSeeds(_input: CompetitorSeedInput): Promise<SeedCreator[]> {
  // MVP stub：等 §3.4 本地达人库 + brand_mentions 离线 ETL 建好之后落地。
  // 不抛错；上层会把空种子 → "building" 兜底。
  return [];
}

// v3 service 主入口。route 层负责剥掉 seeds.creator_ids 后再 SSE 输出。
export async function discoverCompetitorCreators(
  input: CompetitorSeedInput,
): Promise<DiscoveryServiceResult> {
  const seeds = await selectCompetitorSeeds(input);

  if (seeds.length === 0) {
    return buildBuildingResult("competitor_creators", input.category, input.chips);
  }

  const featureGroups = await aggregateFeatures({
    seeds,
    feature_axes: ["content_themes", "audience", "metrics_band", "content_format"],
  });

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
    search_id: newSearchId("competitor_creators"),
    dataset_status: "ready",
    basis: {
      intent: "competitor_creators",
      platform: input.chips.platform,
      country: input.chips.country,
      product_url: null,
      seed_count: seeds.length,
      seed_basis_description: `依据 ${seeds.length} 位经过验证的达人画像`,
      total_output: total,
    },
    seeds: {
      creator_ids: seeds.map((s) => s.creator_id),
      selection_reason: "max(coop_views) >= baseline_90d * 1.5",
    },
    feature_groups: featureGroups,
    creators_by_group: creatorsByGroup,
    output: { total },
    message: null,
  };
}

// ===== v2 兼容层：保留旧 route 调用 =====

export type CompetitorDiscoveryResult = {
  basis: SearchBasis;
  results: CompetitorCreatorResult[];
};

export async function discoverByCompetitor(
  input: CompetitorDiscoveryRequest,
): Promise<CompetitorDiscoveryResult> {
  // 旧 stub：Phase 3 之后由 v3 接口取代。当前保持空结果以让 /api/discovery/competitor
  // 路由继续返回 200。
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
