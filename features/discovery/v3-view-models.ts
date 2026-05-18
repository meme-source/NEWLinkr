// 博主发现 v3 — 前端视图模型 + snake_case → camelCase 适配层
//
// 后端契约（types/api.ts §博主发现 v3）用 snake_case，对齐 SSE 事件、内部
// service 之间传递的 JSON shape。前端组件按 React/TS 习惯吃 camelCase。
// 这一层做的事就两件：
//   1. 给前端定义 `*View` 视图模型类型，组件 props 全部用这套
//   2. 提供 `fromOutputCreator` / `fromFeatureGroup` 等转换函数，从 API 响应
//      映射进视图模型。route 层 / SSE handler 拿到原始 payload 后调一次转换，
//      其余组件就完全脱离 snake_case。
//
// 不在这里：
//   - 任何业务逻辑（评分、过滤、排序）—— 那些是 service / hooks 的职责
//   - 字段重命名以外的 transformations（不要在转换函数里偷偷格式化数字）
//   - mock 数据 —— mock 走 features/discovery/v2/mock-data.ts，是另一套老的
//     视图模型；v3 mock 会在切换到分组渲染时另起 v3 mock 文件
//
// 命名约定：所有视图模型以 `*View` 结尾，避免和后端契约同名混淆。

import type {
  AudienceAgeSkew,
  AudienceGenderSkew,
  DiscoveryBasis,
  DiscoveryIntent,
  DurationBand,
  FeatureGroup,
  MatchedFeatures,
  OutputCreator,
  Platform,
} from "@/types/api";

// ── Matched features ────────────────────────────────────────────────────────
// v3 §4.7：卡片首屏 4 个特征轴是否命中。Service 层直接产生这个对象。前端
// 渲染时按 ✓ / × 出徽章，没有"未命中"和"无数据"的区分 —— 缺数据按 false 处理。
export interface MatchedFeaturesView {
  theme: boolean;
  audience: boolean;
  metrics: boolean;
  format: boolean;
}

// ── Output creator ──────────────────────────────────────────────────────────
// v3 卡片渲染所需的最小字段集合。详情页需要的更深字段（rate_card / audience
// profile / 历史样本）走单独接口拉，不在这里堆。
//
// `emailStatus`:
//   - "verified" → 有邮箱 + 已校验
//   - "found"    → 有邮箱但未校验（用户可以发，但提示风险）
//   - "missing"  → 没邮箱，前端按需展示"未找到联系方式"
export interface OutputCreatorView {
  creatorId: string;
  handle: string;
  avatarUrl: string | null;
  followers: number;
  medianViews: number;
  engagementRate: number;
  emailStatus: "found" | "verified" | "missing";
  featureMatchScore: number;
  matchedFeatures: MatchedFeaturesView;
  reasons: string[];
  risks: string[];
}

// ── Feature group ───────────────────────────────────────────────────────────
// v3 §4.6 / §13：一组"特征组"画像。组标题 `groupName` 是给用户看的（"夜间敏感
// 肌教程组合"），下面四组特征是系统聚合出来的画像数据，前端按需展示成"组头
// 特征清单"。`seedCoverage` 在维度一/三是种子数，在维度二（场景）是历史样本数。
export interface FeatureGroupView {
  groupId: string;
  groupName: string;
  contentFeatures: { themes: string[]; keywords: string[] } | null;
  audienceFeatures: {
    ageSkew: AudienceAgeSkew;
    genderSkew: AudienceGenderSkew;
    countryTop: string[];
  } | null;
  metricsFeatures: {
    viewsBand: [number, number];
    erBand: [number, number];
  } | null;
  formatFeatures: {
    durationBand: DurationBand;
    styleTags: string[];
  } | null;
  seedCoverage: number;
  rationale: string;
  // 该组下命中的达人 —— 由 service 层 matchByFeatureGroup() 产出，按
  // featureMatchScore 降序。组件直接 .map 渲染，无需再排序。
  creators: OutputCreatorView[];
}

// ── Search basis ────────────────────────────────────────────────────────────
// v3 §4.5：搜索依据卡 "依据 12 位达人组合 → 匹配出 286 位可建联同款达人"。
// 后端的 `seed_creator_ids` 不进 API 响应；前端只拿 `seedCount` 和脱敏描述。
export interface SearchBasisView {
  intent: DiscoveryIntent;
  platform: Platform;
  country: string;
  productUrl: string | null;
  seedCount: number;
  seedBasisDescription: string;
  totalOutput: number;
}

// ── Adapters ────────────────────────────────────────────────────────────────
// 这一组函数是 snake_case → camelCase 的纯映射，**不要**在里面做格式化、
// 兜底、计算。如果想加这些逻辑，应该在 selectors / hooks 里完成。

export function fromMatchedFeatures(api: MatchedFeatures): MatchedFeaturesView {
  return {
    theme: api.theme,
    audience: api.audience,
    metrics: api.metrics,
    format: api.format,
  };
}

export function fromOutputCreator(api: OutputCreator): OutputCreatorView {
  return {
    creatorId: api.creator_id,
    handle: api.handle,
    avatarUrl: api.avatar_url,
    followers: api.followers,
    medianViews: api.median_views,
    engagementRate: api.engagement_rate,
    emailStatus: api.email_status,
    featureMatchScore: api.feature_match_score,
    matchedFeatures: fromMatchedFeatures(api.matched_features),
    reasons: api.reasons,
    risks: api.risks,
  };
}

export function fromFeatureGroup(api: FeatureGroup, creators: OutputCreator[]): FeatureGroupView {
  return {
    groupId: api.group_id,
    groupName: api.group_name,
    contentFeatures: api.content_features
      ? {
          themes: api.content_features.themes,
          keywords: api.content_features.keywords,
        }
      : null,
    audienceFeatures: api.audience_features
      ? {
          ageSkew: api.audience_features.age_skew,
          genderSkew: api.audience_features.gender_skew,
          countryTop: api.audience_features.country_top,
        }
      : null,
    metricsFeatures: api.metrics_features
      ? {
          viewsBand: api.metrics_features.views_band,
          erBand: api.metrics_features.er_band,
        }
      : null,
    formatFeatures: api.format_features
      ? {
          durationBand: api.format_features.duration_band,
          styleTags: api.format_features.style_tags,
        }
      : null,
    seedCoverage: api.seed_coverage,
    rationale: api.rationale,
    creators: creators.map(fromOutputCreator),
  };
}

export function fromDiscoveryBasis(api: DiscoveryBasis): SearchBasisView {
  return {
    intent: api.intent,
    platform: api.platform,
    country: api.country,
    productUrl: api.product_url,
    seedCount: api.seed_count,
    seedBasisDescription: api.seed_basis_description,
    totalOutput: api.total_output,
  };
}

// ── Convenience: matched feature axis labels ────────────────────────────────
// §4.6 卡片首屏需要把命中的特征轴渲染成中文徽章 ("内容主题"、"受众组合"…)。
// 集中在这里，避免每个组件各写一份字面量。
export const MATCHED_FEATURE_LABELS: Record<keyof MatchedFeaturesView, string> = {
  theme: "内容主题",
  audience: "受众组合",
  metrics: "数据曲线",
  format: "内容形式",
};

export function listHitFeatures(matched: MatchedFeaturesView): string[] {
  return (Object.keys(MATCHED_FEATURE_LABELS) as Array<keyof MatchedFeaturesView>)
    .filter((key) => matched[key])
    .map((key) => MATCHED_FEATURE_LABELS[key]);
}
