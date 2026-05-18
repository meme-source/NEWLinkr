// v3 博主发现 — 三维 service 共用的小工具。下划线前缀表示"内部模块"，
// 不应通过 index.ts 对外暴露。
//
// 文档：博主发现页实现逻辑.md §B.3。`buildBuildingResult` 是 MVP 阶段
// 数据未建成时的兜底返回；§B.3 #8 明确要求"返回 { total: 0, message:
// '该分类数据建设中' } 给前端"，前端据此把结果区切到"建设中"占位态。

import type {
  DiscoveryBasis,
  DiscoveryChips,
  DiscoveryIntent,
  DiscoveryServiceResult,
} from "@/types/api";

const BUILDING_MESSAGE = "该分类数据建设中，先在「我的博主库」手动添加几位试用，或切换其它分类。";

export function newSearchId(intent: DiscoveryIntent): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `dsc_${intent}_${time}_${rand}`;
}

// 数据建设中兜底。返回的 search_id 仍合法，前端可以稳定地引用。
export function buildBuildingResult(
  intent: DiscoveryIntent,
  category: string,
  chips: DiscoveryChips,
  productUrl: string | null = null,
): DiscoveryServiceResult {
  const basis: DiscoveryBasis = {
    intent,
    platform: chips.platform,
    country: chips.country,
    product_url: productUrl,
    seed_count: 0,
    seed_basis_description: `「${category}」分类种子库建设中`,
    total_output: 0,
  };
  return {
    search_id: newSearchId(intent),
    dataset_status: "building",
    basis,
    seeds: { creator_ids: [], selection_reason: "" },
    feature_groups: [],
    creators_by_group: {},
    output: { total: 0 },
    message: BUILDING_MESSAGE,
  };
}
