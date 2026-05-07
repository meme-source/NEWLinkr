import type { AnalysisStep, ChatIntent } from "../chat-types";

interface StepBlueprint {
  key: string;
  label: string;
  detail?: string;
  durationMs: number;
}

const COMPETITOR_STEPS: StepBlueprint[] = [
  { key: "parse", label: "解析产品页面", detail: "提取标题 / 价格 / 卖点", durationMs: 1100 },
  {
    key: "category",
    label: "提取卖点与分类",
    detail: "识别为「美妆个护 · 敏感肌修复」",
    durationMs: 1500,
  },
  {
    key: "brands",
    label: "反推同品类品牌",
    detail: "CeraVe · La Roche-Posay · Cetaphil · Vichy",
    durationMs: 600,
  },
  {
    key: "scan",
    label: "扫描帖子库",
    detail: "近 90 天 12,430 条帖子",
    durationMs: 1800,
  },
];

const SCENARIO_STEPS: StepBlueprint[] = [
  { key: "parse", label: "解析产品页面", detail: "拿到品类 · 卖点 · 客单价", durationMs: 1100 },
  {
    key: "category",
    label: "类目与受众匹配",
    detail: "美妆个护 · 敏感肌 / 屏障修护",
    durationMs: 1300,
  },
  {
    key: "scenes",
    label: "推荐内容场景",
    detail: "匹配博主类型 × 合作方式 · 取 top 5",
    durationMs: 1100,
  },
  {
    key: "creators",
    label: "对应达人池筛选",
    detail: "按场景内容样本 + 分类基线交叉",
    durationMs: 1500,
  },
];

const TRENDING_STEPS: StepBlueprint[] = [
  { key: "parse", label: "解析产品页面", detail: "提取分类与目标人群", durationMs: 1100 },
  {
    key: "baseline",
    label: "拉取分级基线",
    detail: "TikTok · 美妆护肤 · Micro 中位 20K",
    durationMs: 800,
  },
  {
    key: "scan",
    label: "近 14 天爆款扫描",
    detail: "8,230 条帖子 · 取超基线 5x",
    durationMs: 2000,
  },
  {
    key: "label",
    label: "起量类型标签",
    detail: "持续增长 / 单条爆款 / 新晋潜力 / 高于圈层",
    durationMs: 900,
  },
];

const STEP_BLUEPRINT: Record<ChatIntent, StepBlueprint[]> = {
  competitor: COMPETITOR_STEPS,
  scenario: SCENARIO_STEPS,
  trending: TRENDING_STEPS,
};

export function getStepsForIntent(intent: ChatIntent): AnalysisStep[] {
  return STEP_BLUEPRINT[intent].map((step) => ({
    key: step.key,
    label: step.label,
    detail: step.detail,
    status: "pending",
    durationMs: step.durationMs,
  }));
}

export function getStepBlueprint(intent: ChatIntent) {
  return STEP_BLUEPRINT[intent];
}
