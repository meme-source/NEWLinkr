import type { ParsedBrief, ParsedProduct } from "../lib/parsed-brief-types";

// The hardcoded "敏感肌修复面霜 / CeraVe" demo that used to live inline across
// agent-steps.ts, url-extract.ts (mockProductTitle), and the AgentConsole
// fallbacks. Extracted here so the fixture is the single source of truth and
// new fixtures slot in next to it.

export const DEMO_PRODUCT: ParsedProduct = {
  name: "敏感肌修复面霜",
  brand: "CeraVe",
  category: "美妆个护 · 护肤",
  market: "美国市场",
  url: "https://www.cerave.com/",
  sellingPoints: ["敏感肌", "神经酰胺", "夜间用"],
  audience: "18-35 岁女性 · $20-30 价位",
};

export const DEMO_BRIEF: ParsedBrief = {
  product: DEMO_PRODUCT,

  platformsPrimary: ["tiktok"],
  platformsSecondary: ["instagram"],
  countries: ["us"],
  language: "en",

  creatorCount: 30,
  followerMix: { head: 30, mid: 50, tail: 20 },
  followerTiers: {
    head: { min: 500_000, max: Number.POSITIVE_INFINITY },
    mid: { min: 100_000, max: 500_000 },
    tail: { min: 10_000, max: 100_000 },
  },
  medianViewTiers: {
    head: { min: 100_000, max: 500_000 },
    mid: { min: 20_000, max: 100_000 },
    tail: { min: 5_000, max: 20_000 },
  },

  audienceProfilesMust: ["护肤博主", "美妆博主", "皮肤科医生", "美妆 KOC"],
  audienceProfilesMustNot: [],

  deliverables: {
    tiktok: "1 条短视频（30-60s）",
  },
  budgetSummary: "CPM 为准",
  contentRetention: "",
  mustVoiceover: false,

  // Tab 1 「找同行投过的」
  competitorBrands: ["CeraVe", "La Roche-Posay", "Cetaphil", "Aveeno", "Vanicream"],
  scanSummary: {
    scanned: { count: 12_430, label: "条相关帖子已扫描" },
    matched: { count: 286, label: "条命中同类品牌合作" },
    duration: "6.5s",
  },
  // Tab 2 「按营销场景找」
  cooperationMethods: [
    { type: "护肤博主", methods: ["空瓶记", "前后对比", "成分讲解"] },
    { type: "美妆博主", methods: ["GRWM", "测评", "化妆教程"] },
    { type: "皮肤科医生", methods: ["门诊讲解", "成分科普"] },
  ],
  sceneCombos: [
    { type: "护肤博主", method: "空瓶记", rationale: "真实使用感最贴合敏感肌产品" },
    { type: "护肤博主", method: "前后对比", rationale: "视觉冲击强 · 转化路径直观" },
    { type: "美妆博主", method: "GRWM", rationale: "适合扩展非敏感肌人群" },
    { type: "皮肤科医生", method: "成分科普", rationale: "用专业信任补强转化" },
  ],
  // Tab 3 「找爆款达人」
  categoryBaseline: {
    basisLine: "TikTok × 美妆个护 × Micro 圈层",
    tiles: [
      { label: "中位播放", value: "20K" },
      { label: "爆款阈值", value: "100K" },
      { label: "中位 ER", value: "7.0%" },
      { label: "爆款 ER", value: "12.6%" },
    ],
  },
  trendLabels: [
    { label: "持续增长", count: 15 },
    { label: "单条爆款", count: 28 },
    { label: "数据攀升", count: 12 },
    { label: "高于圈层均值", count: 20 },
  ],

  rawBriefText: "",
  source: "fixture",
  sourceVariant: "demo",
};
