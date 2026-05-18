// 特征聚合服务 — v3 博主发现"中间层"
//
// 文档：博主发现页实现逻辑.md §7。把"种子达人列表"压缩为 2-5 组"特征组合"，
// 每组带 group_name + 内容/受众/数据/形式 4 个特征轴 + seed_coverage + rationale。
// 下游 matchByFeatureGroup() 再按每组去本地达人库找匹配。
//
// 三种实现路径（§7.4）：
//   A. 规则聚类（MVP）：预定义特征轴 → 多维计数 → 取众数 + 分位带 → 命名（本文件）
//   B. 向量聚类（Phase 2）：embedding + K-means/DBSCAN → LLM 命名
//   C. 监督学习（Phase 3+）：历史 ROI 数据训练特征重要性权重
//
// MVP 阶段：seeds 为空（数据建设中）时直接返回空数组，让上游 service 转 "building"
// 状态走友好兜底。**不抛错**——Phase 0 数据库未接入时是预期行为。

import type { FeatureAxis, FeatureGroup, SeedCreator } from "@/types/api";

export type AggregateFeaturesInput = {
  seeds: SeedCreator[];
  feature_axes: FeatureAxis[];
  // 最多产出几个组。默认 5。
  max_groups?: number;
  // 一个组至少要覆盖多少种子才保留。默认 3。
  min_seed_coverage?: number;
};

const DEFAULT_MAX_GROUPS = 5;
const DEFAULT_MIN_SEED_COVERAGE = 3;

// 聚合入口。Phase 1 暂时只走规则聚类 A 方案。
export async function aggregateFeatures(input: AggregateFeaturesInput): Promise<FeatureGroup[]> {
  if (input.seeds.length === 0) return [];
  return aggregateFeaturesRuleBased(input);
}

// ===== A 方案：规则聚类 =====
//
// 思路（§7.2）：不上机器学习，按预定义的特征轴做多维计数 + 众数 + 分位带分桶，
// 给每组生成命名。本文件目前只搭骨架；真实实现需要等 §3.3 的 ETL 把 creators /
// content_labels / creator_metrics / audience_demographics 表灌好数据后才能跑。
//
// 真实实现待办：
//   1. loadSeedProfiles(seed_ids) → 从 creator_metrics + content_labels +
//      audience_demographics 拉每个种子的完整画像
//   2. bucketByDominantTheme(profiles) → 按主题词共现做粗聚类（hashtag 重叠 +
//      caption 关键词 + LLM 长尾归类）
//   3. 每个 bucket 内取众数 audience_age_skew、percentile_band(views/ER)、众数
//      duration_band，组装 FeatureGroup
//   4. 用 §7.3 的 feature_axes.yaml 配置生成 group_name（如"夜间敏感肌教程组合"）

async function aggregateFeaturesRuleBased(input: AggregateFeaturesInput): Promise<FeatureGroup[]> {
  // MVP stub：等本地达人库（§3.4）建好之后再实现。
  // 不抛错，不写假数据 —— 上游 service 通过 dataset_status="building" 回应前端。
  const _maxGroups = input.max_groups ?? DEFAULT_MAX_GROUPS;
  const _minCoverage = input.min_seed_coverage ?? DEFAULT_MIN_SEED_COVERAGE;
  void _maxGroups;
  void _minCoverage;
  return [];
}

// ===== 工具函数占位 =====
// 真实实现时这些工具会从 seed profiles 算特征轴。当前暴露签名，让上游可以提前
// 写测试 / 类型对齐。

export function groupHash(parts: ReadonlyArray<string>): string {
  // 稳定哈希：把 (theme + audience + view_band) 压成 group_id。
  // Phase 1 走简单字符串拼接 + base36；真实实现可以换 crypto.subtle digest。
  return parts
    .map((p) => p.toLowerCase().replace(/\s+/g, "_"))
    .join("_")
    .slice(0, 64);
}
