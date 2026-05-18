import type { ChatIntent } from "../chat-types";

export interface IntentHeroSpec {
  id: ChatIntent;
  tabLabel: string;
  question: string;
  /** Single conversational sentence shown under the question. */
  oneLiner: string;
}

// v3 §4.2：三入口卡片以"操作短语 + 一句话承诺"呈现，统一收束到"输出可建联
// 达人池"的最终交付物。问句形式（v2）在 v3 已下线 —— 用户不再看到"系统找
// 种子"这一层，所以标题不再问"谁"，而是直接陈述这条入口产出什么。
export const INTENT_HERO: Record<ChatIntent, IntentHeroSpec> = {
  competitor: {
    id: "competitor",
    tabLabel: "复刻竞品同款达人",
    question: "复刻竞品同款达人",
    oneLiner: "锁定竞品最近的高效达人，找出能复刻同款打法的可建联达人。",
  },
  scenario: {
    id: "scenario",
    tabLabel: "按场景找达人类型",
    question: "按场景找达人类型",
    oneLiner: "从产品反推内容场景，直接给出能拍这些场景的达人。",
  },
  trending: {
    id: "trending",
    tabLabel: "对标品类爆款达人",
    question: "对标品类爆款达人",
    oneLiner: "以品类近期爆款为参照，找出拍法相似、可立刻触达的达人。",
  },
  lowFollower: {
    id: "lowFollower",
    tabLabel: "找低粉爆款达人",
    question: "找低粉爆款达人",
    oneLiner: "锁定近期爆了的低粉达人，性价比更高、更可建联。",
  },
};

export const INTENT_ORDER: ChatIntent[] = ["competitor", "scenario", "trending", "lowFollower"];

/** Visual placeholder marker inside the auto-filled template. */
export const TEMPLATE_PLACEHOLDER = "[粘贴产品链接，或写一句话描述]";

/**
 * Each intent provides a starter template that pre-fills the input box.
 * `productHint` replaces the placeholder when the user already shared a product
 * earlier in the session (cross-tab product memory).
 *
 * v3 §4.3：模板尾句统一收束到"可直接建联"的输出层语义。竞品 / 爆款 入口
 * 在产品行下另起一行写"找下方…"，明示输出形态；场景入口因为不需要锚定
 * 历史合作集，只保留产品行。
 */
const TEMPLATE_LINES: Record<ChatIntent, (hint: string) => string> = {
  competitor: (hint) =>
    `我的产品：${hint || TEMPLATE_PLACEHOLDER}\n找下方与已被竞品验证过的达人合作款组合、可直接建联的达人`,
  scenario: (hint) => `我的产品：${hint || TEMPLATE_PLACEHOLDER}`,
  trending: (hint) =>
    `我的产品：${hint || TEMPLATE_PLACEHOLDER}\n找下方与近期品类爆款达人组合相似、可立刻触达的达人`,
  // lowFollower 当前沿用 trending 的模板（下游 agent 流程也复用 trending 分支）。
  lowFollower: (hint) =>
    `我的产品：${hint || TEMPLATE_PLACEHOLDER}\n找下方与近期品类爆款达人组合相似、可立刻触达的达人`,
};

export function buildTemplate(intent: ChatIntent, productHint: string): string {
  return TEMPLATE_LINES[intent](productHint);
}

/** Returns true if the text looks like an unmodified template (any intent). */
export function isUnmodifiedTemplate(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  // If the slot pill is still present anywhere, treat as unmodified.
  if (trimmed.includes(TEMPLATE_PLACEHOLDER)) return true;
  return INTENT_ORDER.some((id) => trimmed === TEMPLATE_LINES[id]("").trim());
}

/**
 * Strips the `我的产品：` prefix and any known template suffix to recover
 * just the product slot the user typed. Returns `""` if only the placeholder
 * is present.
 */
// v3 模板的尾句集合 —— 用于反向从用户输入里抠出"产品槽位"。每条都对应
// TEMPLATE_LINES 中 productHint 之后的固定后缀（含换行 + 一句话承诺）。
// extractProductSlot 会在首行剥前缀后再从尾部 trim 这些后缀；如果用户改
// 写了模板（例如换行删掉），整段会被当作产品描述返回。
const TEMPLATE_SUFFIXES = [
  "\n找下方与已被竞品验证过的达人合作款组合、可直接建联的达人",
  "\n找下方与近期品类爆款达人组合相似、可立刻触达的达人",
];

export function extractProductSlot(text: string): string {
  let body = text.trim().replace(/^我的产品[:：]\s*/, "");
  for (const suffix of TEMPLATE_SUFFIXES) {
    if (body.endsWith(suffix)) {
      body = body.slice(0, -suffix.length);
      break;
    }
  }
  return body.trim();
}
