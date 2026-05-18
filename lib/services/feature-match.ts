// 特征匹配服务 — v3 博主发现"输出层"
//
// 文档：博主发现页实现逻辑.md §5.1 Step 6 / §5.2 Step 5 / §5.3 Step 4。
// 接收一个 FeatureGroup，去本地达人库找可建联的匹配达人，按 feature_match_score
// 排序后返回 OutputCreator[]。
//
// 关键约束（§B.3）：
//   - 可建联性硬过滤必须在 SQL WHERE 里完成（contact_email IS NOT NULL,
//     recent_active_at >= now() - 30d, NOT EXISTS project_creator_actions.no）
//   - 不在 SQL 里 ad-hoc 拼特征条件 —— 全部从入参的 FeatureGroup 派生
//   - reasons[] 由 LLM 批量生成（§11），本服务只填 matched_features 与
//     feature_match_score，reasons/risks 先返回空数组让上层补
//   - 推荐理由生成不许提及具体种子 handle —— 本服务也不应回填种子信息

import type { DiscoveryChips, FeatureGroup, OutputCreator } from "@/types/api";

export type MatchByFeatureGroupInput = {
  project_id: string;
  group: FeatureGroup;
  category: string;
  chips: DiscoveryChips;
  // 软限制：单组最多返回多少。默认 50（§5.1 Step 6 LIMIT 50）。
  limit?: number;
};

const DEFAULT_LIMIT = 50;

export async function matchByFeatureGroup(
  input: MatchByFeatureGroupInput,
): Promise<OutputCreator[]> {
  // MVP stub：等本地达人库（§3.4）建好之后再实现。
  //
  // 真实实现 SQL 形态（§5.1 Step 6）：
  //   SELECT c.creator_id, c.handle, c.avatar_url, c.followers,
  //          cm.median_views_30, cm.engagement_rate_30,
  //          cl.content_themes,
  //          ad.audience_age_skew, ad.audience_gender_skew,
  //          (cl.content_themes && $group.content_themes)::int AS theme_hit,
  //          (ad.audience_age_skew = $group.audience_age)::int AS audience_hit,
  //          (cm.median_views_30 BETWEEN $views_low AND $views_high)::int AS metrics_hit,
  //          (cl.format_tags && $group.style_tags)::int AS format_hit
  //   FROM creators c
  //   JOIN creator_metrics cm USING (creator_id)
  //   JOIN content_labels cl USING (creator_id)
  //   LEFT JOIN audience_demographics ad USING (creator_id)
  //   WHERE c.country = $country
  //     AND c.platform = $platform
  //     AND cl.primary_category = $category
  //     -- 可建联性硬过滤（仅当 chips.contactable_only = true 时）
  //     AND c.contact_email IS NOT NULL
  //     AND c.recent_active_at >= now() - INTERVAL '30 days'
  //     AND c.risk_level != 'high'
  //     AND NOT EXISTS (
  //       SELECT 1 FROM project_creator_actions pca
  //       WHERE pca.project_id = $project_id
  //         AND pca.creator_id = c.creator_id
  //         AND pca.status = 'no'
  //     )
  //     -- 至少命中一个特征
  //     AND (theme_hit OR audience_hit OR metrics_hit OR format_hit)
  //   ORDER BY (theme_hit * 0.4 + audience_hit * 0.3 + metrics_hit * 0.2 + format_hit * 0.1) DESC
  //   LIMIT $limit
  const _limit = input.limit ?? DEFAULT_LIMIT;
  void _limit;
  return [];
}

// 权重常量。从单元测试与 SQL 都引用同一份来源，避免分数对不上的"两个真相"问题。
export const FEATURE_MATCH_WEIGHTS = {
  theme: 0.4,
  audience: 0.3,
  metrics: 0.2,
  format: 0.1,
} as const;

export function computeFeatureMatchScore(matched: {
  theme: boolean;
  audience: boolean;
  metrics: boolean;
  format: boolean;
}): number {
  // 0-100 整数。便于前端"特征匹配度 91"展示。
  const raw =
    (matched.theme ? FEATURE_MATCH_WEIGHTS.theme : 0) +
    (matched.audience ? FEATURE_MATCH_WEIGHTS.audience : 0) +
    (matched.metrics ? FEATURE_MATCH_WEIGHTS.metrics : 0) +
    (matched.format ? FEATURE_MATCH_WEIGHTS.format : 0);
  return Math.round(raw * 100);
}
