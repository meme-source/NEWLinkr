// 博主发现 · 维度二 — 场景化博主推荐
//
// 文档：博主发现页实现逻辑.md §5.2。从产品卖点反推适合的内容场景（创作者类型 ×
// 合作方式），再为每个场景拼装一个 FeatureGroup（场景本身就是预定义的特征组合，
// 无需聚类）。
//
// v3 链路（§5.2 Step 1-5）：
//   Step 1  解析产品 → category + selling_points（LLM Sonnet，URL 缓存 7 天）
//   Step 2  查 creator_type_mapping + cooperation_method_mapping（本地常驻表）
//   Step 3  组合并打分，挑 top 5 场景
//   Step 4  把场景直接作为 FeatureGroup（seed_coverage 用历史样本数填）
//   Step 5  按特征组匹配可建联达人

import type {
  DiscoveryServiceResult,
  FeatureGroup,
  OutputCreator,
  ScenarioCreatorResult,
  ScenarioMatchRequest,
  ScenarioParseRequest,
  ScenarioParseResponse,
  ScenarioSeedInput,
} from "@/types/api";
import { matchByFeatureGroup } from "@/lib/services/feature-match";
import { buildBuildingResult, newSearchId } from "./_shared";

// ===== v3：场景化博主推荐 =====

// 维度二没有种子（场景是预定义的），直接产出 FeatureGroup[]。
export async function pickScenarioFeatureGroups(
  _input: ScenarioSeedInput,
): Promise<FeatureGroup[]> {
  // MVP stub：等 Excel 知识表（creator_type_mapping / cooperation_method_mapping）
  // 导入到 PostgreSQL（§10.1）之后落地。
  return [];
}

export async function discoverScenarioCreators(
  input: ScenarioSeedInput,
): Promise<DiscoveryServiceResult> {
  const featureGroups = await pickScenarioFeatureGroups(input);

  if (featureGroups.length === 0) {
    return buildBuildingResult("scenario_creators", input.category, input.chips);
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
    search_id: newSearchId("scenario_creators"),
    dataset_status: "ready",
    basis: {
      intent: "scenario_creators",
      platform: input.chips.platform,
      country: input.chips.country,
      product_url: null,
      // 维度二没有"种子达人"。用场景组数 + 总样本数代替。
      seed_count: 0,
      seed_basis_description: `依据 ${featureGroups.length} 个匹配的内容场景`,
      total_output: total,
    },
    seeds: { creator_ids: [], selection_reason: "scenario-driven (no seeds)" },
    feature_groups: featureGroups,
    creators_by_group: creatorsByGroup,
    output: { total },
    message: null,
  };
}

// ===== v2 兼容层 =====

export async function parseProductForScenarios(
  _input: ScenarioParseRequest,
): Promise<ScenarioParseResponse> {
  // 旧 stub。真实实现由 v3 链路 + lib/ai/claude.ts 接管。
  return {
    productSummary: { category: "", sellingPoints: [] },
    recommendedScenes: [],
  };
}

export async function matchCreatorsByScenarios(
  _input: ScenarioMatchRequest,
): Promise<{ results: ScenarioCreatorResult[] }> {
  return { results: [] };
}
