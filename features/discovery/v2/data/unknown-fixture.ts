import type { ParsedBrief, ParsedProduct } from "../lib/parsed-brief-types";

// "Unknown product" fallback — produced when neither the Tabbit nor the demo
// fixture matches the user's input. Honest about what we don't yet know:
// product / selling points / audience all read as 「未识别」 and the per-tab
// step content fields are intentionally absent so the agent flow skips its
// brand-routing / scenario / trending mid-stage steps. After S4 is wired,
// the parser hits Anthropic instead and this fallback should rarely trigger.

export const UNKNOWN_PRODUCT: ParsedProduct = {
  name: "未识别产品",
  category: "未识别品类",
  market: "未指定市场",
  url: "",
  sellingPoints: [],
  audience: "待 AI 解析",
};

export const UNKNOWN_BRIEF: ParsedBrief = {
  product: UNKNOWN_PRODUCT,

  platformsPrimary: ["tiktok"],
  platformsSecondary: [],
  countries: [],
  language: "en",

  creatorCount: 30,
  followerMix: { head: 30, mid: 50, tail: 20 },
  followerTiers: {
    head: { min: 100_000, max: Number.POSITIVE_INFINITY },
    mid: { min: 10_000, max: 100_000 },
    tail: { min: 1_000, max: 10_000 },
  },
  medianViewTiers: {
    head: { min: 15_000, max: 80_000 },
    mid: { min: 1_500, max: 15_000 },
    tail: { min: 200, max: 1_500 },
  },

  audienceProfilesMust: [],
  audienceProfilesMustNot: [],

  deliverables: {},
  budgetSummary: "",
  contentRetention: "",
  mustVoiceover: false,

  // No tab-specific step content — agent flow shows only Step A/B for unknown.

  rawBriefText: "",
  source: "fixture",
  sourceVariant: "unknown",
};
