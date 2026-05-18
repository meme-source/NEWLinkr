// 权重模板与分类映射（spec §4.2.1）。
//
// 4 套模板由种子达人的主分类自动选定，用户无感。映射来自 Creator 的
// `category` 字段（types/api.ts: CreatorCategory，14 项）；spec 里描述的
// TikTok 29 个三级类目在 Phase 0 还未落库，先按本仓库的 14 类做一一对应。
// 当未来接入更细的分类系统时，只改 CATEGORY_TO_TEMPLATE 即可。

import type { CreatorCategory } from "@/types/api";
import type { SimilarAxisKey, WeightTemplateId } from "@/types/api";

export type WeightTemplate = {
  id: WeightTemplateId;
  label: string;
  weights: Record<SimilarAxisKey, number>;
};

// v6 5 维权重表（spec §4.2.1）：topic / format / visual / data / activity = 100。
export const WEIGHT_TEMPLATES: Record<WeightTemplateId, WeightTemplate> = {
  A: {
    id: "A",
    label: "强视觉",
    weights: { topic: 27, format: 21, visual: 36, data: 11, activity: 5 },
  },
  B: {
    id: "B",
    label: "默认",
    weights: { topic: 32, format: 26, visual: 21, data: 16, activity: 5 },
  },
  C: {
    id: "C",
    label: "功能测试",
    weights: { topic: 37, format: 26, visual: 16, data: 16, activity: 5 },
  },
  D: {
    id: "D",
    label: "知识主题",
    weights: { topic: 47, format: 26, visual: 6, data: 16, activity: 5 },
  },
};

// 本仓库 14 个 category（types/api.ts）→ 模板的固定映射。
// 设计原则：画面本身就是产品 (穿戴/打扮) → A；功能/测评/对比 → C；
// 言论/讲解为主 → D；其余 → B。
const CATEGORY_TO_TEMPLATE: Record<CreatorCategory, WeightTemplateId> = {
  beauty: "A",
  skincare: "A",
  fashion: "A",
  food: "B",
  travel: "B",
  vlog: "B",
  fitness: "B",
  parenting: "B",
  tech: "C",
  home: "B",
  review: "C",
  education: "D",
  comedy: "B",
  other: "B",
};

export function pickWeightTemplate(category: CreatorCategory): WeightTemplate {
  const id = CATEGORY_TO_TEMPLATE[category] ?? "B";
  return WEIGHT_TEMPLATES[id];
}

// 5 维显示名（用于 radar + 详细抽屉标签）。
export const AXIS_LABEL: Record<SimilarAxisKey, string> = {
  topic: "主题",
  format: "形式",
  visual: "视觉",
  data: "数据",
  activity: "活跃",
};
