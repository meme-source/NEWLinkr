import type { ParsedBrief, ParsedProduct } from "../lib/parsed-brief-types";

// Tabbit · AI 浏览器 — derived from the real brief screenshot dated 2026-05-08.
// Source of truth: docs/REAL-BRIEF-TESTS/tabbit.md.

export const TABBIT_PRODUCT: ParsedProduct = {
  name: "Tabbit",
  category: "AI 工具 / 生产力 / 浏览器扩展",
  market: "美/加/英 等发达国家",
  url: "https://www.tabbit-ai.com/?lang=zh",
  sellingPoints: ["AI 浏览器扩展", "标签整理", "AI 辅助阅读 / 写作"],
  audience: "AI 重度用户 · 生产力工具爱好者 · 学生与研究者",
};

export const TABBIT_BRIEF: ParsedBrief = {
  product: TABBIT_PRODUCT,

  platformsPrimary: ["youtube", "x"],
  platformsSecondary: ["tiktok"],
  countries: ["us", "ca", "gb"],
  language: "en",

  creatorCount: 30,
  followerMix: { head: 50, mid: 40, tail: 10 },
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

  audienceProfilesMust: [
    "AI 教程类",
    "AI 产品类 / AI 测评类",
    "AI & 科技工具类（工具横评 / AI 应用测评）",
    "职场 / 生产力类（Personal Productivity · Notion · 工作流 · Second Brain）",
    "学生 / 学术圈（研究生 / 博士生 · 文献整理 + AI 辅助写作）",
  ],
  audienceProfilesMustNot: [
    "AI 主播（要真人出镜）",
    "最近纯广告无互动 / 无内容生产力",
    "带的产品偏 APP 居多的优先级降低",
  ],

  deliverables: {
    youtube: "1 支整合视频（5-15 分钟，最长 20 分钟）",
    x: "1 条主 Thread（5-8 推文）+ 1 条 Follow-up（48-72 小时内）",
    tiktok_or_yt_shorts: "1 条短视频（60-120s）",
  },
  budgetSummary: "以 CPM 为准，兼职费 400 RMB；权益：60 天广告投流，TT/INS/YTB 分发",
  contentRetention: "三个月内不允许删除相关内容",
  mustVoiceover: true,

  // Tab 2 「按营销场景找」 — derived from audienceProfilesMust + deliverables
  cooperationMethods: [
    { type: "AI 教程类", methods: ["上手实操", "一周对比", "工作流串讲"] },
    { type: "AI 测评 / 工具横评", methods: ["逐项测评", "竞品对比", "深度评测"] },
    { type: "生产力 / 学术圈", methods: ["真实工作流", "GTD / Second Brain 串讲"] },
  ],
  sceneCombos: [
    {
      type: "AI 教程类",
      method: "上手实操",
      rationale: "Tabbit 的真实使用场景最容易展开，转化路径直观",
    },
    {
      type: "AI 测评 / 工具横评",
      method: "竞品对比",
      rationale: "AI 浏览器赛道吃横评，专业对比建立信任",
    },
    {
      type: "生产力 / 学术圈",
      method: "真实工作流",
      rationale: "学术 / 文献整理痛点正中产品定位",
    },
    {
      type: "AI 产品类",
      method: "深度评测",
      rationale: "面向已有 AI 重度用户的二次决策",
    },
  ],

  rawBriefText: "",
  source: "fixture",
  sourceVariant: "tabbit",
};
