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
    question: "哪些达人真的给同类品牌做过内容？",
    oneLiner: "把同品类品牌最近合作过的达人，按合作证据的强弱整理给你。",
  },
  scenario: {
    id: "scenario",
    tabLabel: "按营销场景找",
    question: "这个产品该被拍成什么内容？",
    oneLiner: "先帮你拆出几个最适合的内容场景，再给每个场景配会拍的达人。",
  },
  trending: {
    id: "trending",
    tabLabel: "找爆款达人",
    question: "你的分类里近期谁在起量？",
    oneLiner: "找近 14 天里发过爆款、增长稳定，且还没被同类品牌投空的达人。",
  },
};

export const INTENT_ORDER: ChatIntent[] = ["competitor", "scenario", "trending"];

/** Visual placeholder marker inside the auto-filled template. */
export const TEMPLATE_PLACEHOLDER = "[粘贴产品链接，或写一句话描述]";

/**
 * Each intent provides a starter template that pre-fills the input box.
 * `productHint` replaces the placeholder when the user already shared a product
 * earlier in the session (cross-tab product memory).
 */
const TEMPLATE_LINES: Record<ChatIntent, (hint: string) => string> = {
  competitor: (hint) =>
    `我的产品：${hint || TEMPLATE_PLACEHOLDER}，找最近合作过同品类品牌的达人，近 90 天。`,
  scenario: (hint) => `我的产品：${hint || TEMPLATE_PLACEHOLDER}。`,
  trending: (hint) => `我的产品：${hint || TEMPLATE_PLACEHOLDER}，找近 14 天起量的同类达人。`,
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
const TEMPLATE_SUFFIXES = [
  "，找最近合作过同品类品牌的达人，近 90 天。",
  "，找近 14 天起量的同类达人。",
  "。",
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
