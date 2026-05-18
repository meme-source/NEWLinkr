// 博主发现 —— 四维度配置注册表。
//
// 四个维度(competitor / scenario / trending / lowFollower)过去靠散落在
// agent-steps、intent-hero、structured-editor 里的 `if (intent === ...)`
// 分支驱动。这里把「每个维度的差异」收敛成一张配置表 —— intake 必填什么、
// 提交后要不要中间确认层、结果按什么轴分组、卡片主指标叫什么,全部一处声明。
//
// 产品决策来源(2026-05 发现页重构讨论):
//   - 每个维度有不同的「锚点」:竞品绕竞品转、场景绕产品转、爆款/低粉绕品类转。
//     现在的产品把「我的产品」当成万能第一字段是错的。
//   - 提交后不是统一直接出结果:场景必须先让用户确认 AI 反推的场景组合,
//     竞品在竞品名有歧义时要消歧,爆款/低粉后果低、直接出结果。
//   - 结果分组轴随维度变,不再统一按「证据强度」——「证据强度」只是竞品维度
//     的语言。
//   - 卡片主指标随维度变(复刻置信度 / 场景适配度 / 爆款表现 / 爆发倍数)。

import type { ChatIntent } from "../chat-types";
import type { StructuredEditorState } from "../components/structured-editor/types";

/** 这个维度「绕着什么转」—— 决定 intake 必填的第一个字段。 */
export type AnchorKind = "competitor" | "product" | "category";

/** 提交后是否插入一层用户确认 / 校准。 */
export type ConfirmStepKind =
  | "scenario-pick" // 场景:AI 反推场景 → 用户勾选要哪几个 → 再找达人
  | "competitor-disambig" // 竞品:竞品名有歧义时先消歧
  | "none"; // 直接出结果,调整放到结果之后(追问 + 筛选)

/** 结果按什么轴分组。 */
export type GroupingAxis =
  | "verified-combo" // 竞品:按竞品验证过的合作款组合
  | "scenario" // 场景:按内容场景(一个达人可落入多组)
  | "viral-format" // 爆款:按近期爆款拍法 / 趋势
  | "burst-tier"; // 低粉:按爆发量级 / 性价比档位

export interface DimensionConfig {
  id: ChatIntent;
  /** intake 必填的锚点。 */
  anchor: AnchorKind;
  /** 「我的产品」在这个维度的角色:场景里它是锚点,其余维度只做相关性精修。 */
  productRole: "anchor" | "refinement";
  /** 是否需要时间窗口字段(竞品 / 爆款 / 低粉需要,场景不需要)。 */
  needsTimeWindow: boolean;
  /** 是否需要「粉丝量上限」字段 —— 低粉维度专属,是「低粉」的定义性输入。 */
  needsFollowerCap: boolean;
  /** 提交后的中间交互层。 */
  confirmStep: ConfirmStepKind;
  /** 结果分组轴。 */
  grouping: GroupingAxis;
  /** 卡片主指标的中文名 —— 卡上最显眼的那个数。 */
  metricLabel: string;
  /** 锚点缺失时的对话式追问文案(不是表单报错)。 */
  anchorMissingPrompt: string;
}

export const DIMENSIONS: Record<ChatIntent, DimensionConfig> = {
  competitor: {
    id: "competitor",
    anchor: "competitor",
    productRole: "refinement",
    needsTimeWindow: true,
    needsFollowerCap: false,
    confirmStep: "competitor-disambig",
    grouping: "verified-combo",
    metricLabel: "复刻置信度",
    anchorMissingPrompt:
      "你想对标哪个竞品?给我竞品的品牌名、账号或产品链接 —— 也可以给我你的产品,让我按品类自动锚定竞品。",
  },
  scenario: {
    id: "scenario",
    anchor: "product",
    productRole: "anchor",
    needsTimeWindow: false,
    needsFollowerCap: false,
    confirmStep: "scenario-pick",
    grouping: "scenario",
    metricLabel: "场景适配度",
    anchorMissingPrompt:
      "先给我你的产品 —— 链接或一句话描述都行。我要从产品反推内容场景,没有产品就没有场景可推。",
  },
  trending: {
    id: "trending",
    anchor: "category",
    productRole: "refinement",
    needsTimeWindow: true,
    needsFollowerCap: false,
    confirmStep: "none",
    grouping: "viral-format",
    metricLabel: "近期爆款表现",
    anchorMissingPrompt: "你想对标哪个品类的爆款?直接说品类,或给我产品链接让我自动判断品类。",
  },
  lowFollower: {
    id: "lowFollower",
    anchor: "category",
    productRole: "refinement",
    needsTimeWindow: true,
    needsFollowerCap: true,
    confirmStep: "none",
    grouping: "burst-tier",
    metricLabel: "爆发倍数",
    anchorMissingPrompt: "你想对标哪个品类的低粉爆款?直接说品类,或给我产品链接让我自动判断品类。",
  },
};

export function getDimension(intent: ChatIntent): DimensionConfig {
  return DIMENSIONS[intent];
}

/**
 * intake 提交前 —— 这个维度的锚点字段是否已填。
 * 锚点缺失 = 硬阻断:不允许提交,由调用方用 `anchorMissingPrompt` 对话式追问。
 */
export function isAnchorSatisfied(intent: ChatIntent, state: StructuredEditorState): boolean {
  const hasProduct = state.productChip !== null || state.productNote.trim().length > 0;

  switch (DIMENSIONS[intent].anchor) {
    case "competitor":
      // 手动模式要求至少 1 个竞品;自动锚定模式需要产品来反推品类。
      return state.brandMode === "manual" ? state.brands.length > 0 : hasProduct;
    case "product":
      return hasProduct;
    case "category":
      // 品类可由产品自动推断,所以填了品类或填了产品都算满足。
      return state.category.trim().length > 0 || hasProduct;
  }
}
