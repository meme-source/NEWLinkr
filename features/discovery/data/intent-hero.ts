import type { ChatIntent } from "../chat-types";

export interface IntentHeroSpec {
  id: ChatIntent;
  tabLabel: string;
  question: string;
  /** Single conversational sentence shown under the question. */
  oneLiner: string;
}

export const INTENT_HERO: Record<ChatIntent, IntentHeroSpec> = {
  competitor: {
    id: "competitor",
    tabLabel: "找同行投过的",
    question: "哪些达人正在被同类品牌投放？",
    oneLiner: "按合作证据强弱（#ad、折扣码、@品牌）分三组排序，强证据默认展开。",
  },
  scenario: {
    id: "scenario",
    tabLabel: "按营销场景找",
    question: "这个产品该被拍成什么内容？",
    oneLiner:
      "自动匹配博主类型（护肤 / 美妆 / 医生）× 合作方式（空瓶记 / 成分对比），再为每个组合配会拍的达人。",
  },
  trending: {
    id: "trending",
    tabLabel: "找爆款达人",
    question: "你的分类里近期谁在起量？",
    oneLiner: "找近 14 天里发过爆款、且增长仍在持续的同类达人。",
  },
};

export const INTENT_ORDER: ChatIntent[] = ["competitor", "scenario", "trending"];
