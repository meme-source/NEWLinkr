"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle, ArrowLeft, ArrowUp, Bookmark, Check, ChevronDown, Download,
  Globe2, Hand, Handshake, Heart, Link2, Plus, Share2, Sparkles,
  TrendingUp, Upload, Users, UsersRound, X, Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  formatProjectBudget,
  formatProjectTimeline,
  useWorkspaceProject,
} from "@/components/workspace/project-context";
import { cn } from "@/lib/utils";
import { useCreatorProfile } from "@/components/ui/creator-profile-context";
import type { CreatorProfileInput } from "@/components/ui/creator-profile-drawer";

function creatorToProfileInput(c: Creator): CreatorProfileInput {
  return {
    name: c.name,
    handle: c.handle,
    avatarUrl: `https://i.pravatar.cc/100?img=${c.avatarImg}`,
    region: c.region,
    verified: c.verified,
    followers: c.followers,
    er: c.er,
    tags: c.smartTags,
  };
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  ivory: "#faf9f5", parchment: "#f5f4ed", nearBlack: "#141413",
  charcoal: "#4d4c48", stone: "#87867f", terracotta: "#c96442",
  border: "#e8e6dc", borderLight: "#f0ece4",
};
const FIND_SIMILAR_REMINDER_STORAGE_KEY = "2linkr:discovery-find-similar-mode-switch-reminder-v2";
const EXIT_SCREEN_REMINDER_STORAGE_KEY = "2linkr:discovery-exit-screen-reminder-v1";

// ── Platform data ─────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "tiktok" as const, label: "TikTok" },
  { id: "instagram" as const, label: "Instagram" },
  { id: "youtube" as const, label: "YouTube" },
];
type PlatformId = "tiktok" | "instagram" | "youtube";

const MODES = [
  {
    id: "competitor" as const,
    title: "找同行投过的",
    desc: "同品类品牌都在用谁，直接找被验证过的达人",
    question: "哪些达人真的给同类品牌做过内容？",
    strategy: "找被市场验证过的人",
    inputLabel: "产品 / 品类 / 竞品线索",
    inputPlaceholder: "粘贴 1–2 个竞品官网或主页，或直接写品牌名（如 CeraVe、Rhode、Glow Recipe）…",
    evidenceTitle: "系统会验证",
    evidenceItems: ["品牌 @ / 官网链接", "#ad / sponsored", "折扣码与合作话术", "合作帖表现倍数"],
    resultPromise: "结果优先展示合作证据强、合作帖表现高、可联系的达人。",
    basis: { range: "近 90 天", posts: "12,430", candidates: "286", filtered: "已 No / 长期不活跃 / 高风险账号" },
    Icon: Users,
    iconBg: "bg-[#f5ede8]",
    iconColor: "text-[#c96442]",
    softBg: "#fbe5d3",
    accent: "#c96442",
  },
  {
    id: "scenario" as const,
    title: "按营销场景找",
    desc: "输入产品，AI 匹配最适合的内容场景和达人",
    question: "这个产品应该被拍成什么内容？",
    strategy: "找擅长表达产品卖点的人",
    inputLabel: "产品链接 / 产品描述",
    inputPlaceholder: "贴产品链接，或描述「敏感肌修复面霜，主打夜间舒缓、屏障修护」这类卖点…",
    evidenceTitle: "系统会拆解",
    evidenceItems: ["产品卖点", "内容可表达性", "同品类场景表现", "达人场景稳定性"],
    resultPromise: "先推荐 3-6 个内容场景，再给出适合这些场景的达人和 brief 方向。",
    basis: { range: "场景库 5 类", posts: "8,960", candidates: "342", filtered: "场景弱相关 / 商业不可用 / 数据不稳" },
    Icon: Zap,
    iconBg: "bg-[#eef1e7]",
    iconColor: "text-[#7a8a6a]",
    softBg: "#dde6d7",
    accent: "#7a8a6a",
  },
  {
    id: "viral" as const,
    title: "找爆款达人",
    desc: "找近期爆过、内容增长快且互动稳定的达人",
    question: "谁能把产品讲得可信、带动讨论？",
    strategy: "找适合做口碑种草的人",
    inputLabel: "品类 / 产品关键词",
    inputPlaceholder: "写品类或产品关键词，如「护肤测评」「露营装备」「无线耳机」「宠物清洁」…",
    evidenceTitle: "系统会计算",
    evidenceItems: ["真实评论密度", "种草内容稳定性", "受众匹配度", "商务可联系性"],
    resultPromise: "结果会优先给出评论质量好、种草稳定、适合做口碑扩散的达人。",
    basis: { range: "近 30 天", posts: "8,230", candidates: "194", filtered: "内容不相关 / 风险账号 / 异常数据" },
    Icon: TrendingUp,
    iconBg: "bg-[#efede7]",
    iconColor: "text-[#5e5d59]",
    softBg: "#e5e0d6",
    accent: "#5e5d59",
  },
];
type ModeId = "competitor" | "scenario" | "viral";

// ── Region / Language data ────────────────────────────────────────────────────
const REGIONS = [
  { label: "北美地区", countries: ["美国", "加拿大", "墨西哥", "格陵兰"] },
  { label: "南美地区", countries: ["智利", "巴西", "阿根廷", "哥伦比亚", "秘鲁"] },
  { label: "欧洲地区", countries: ["英国", "法国", "德国", "意大利", "西班牙", "荷兰", "瑞典", "挪威", "丹麦", "芬兰", "波兰"] },
  { label: "亚太地区", countries: ["中国", "日本", "韩国", "印度", "澳大利亚", "新西兰", "新加坡", "马来西亚", "印尼", "泰国", "越南", "菲律宾"] },
  { label: "中东&非洲", countries: ["沙特阿拉伯", "阿联酋", "以色列", "土耳其", "南非", "埃及", "尼日利亚"] },
];
const LANGUAGES = [
  "阿布哈兹语","阿姆哈拉语","阿拉伯语","亚美尼亚语","阿塞拜疆语",
  "巴斯克语","白俄罗斯语","孟加拉语","比哈里语","波斯尼亚语",
  "保加利亚语","粤语","中文（简体）","中文（繁体）","克罗地亚语",
  "捷克语","丹麦语","荷兰语","英语","爱沙尼亚语","芬兰语","法语",
  "格鲁吉亚语","德语","希腊语","希伯来语","印地语","匈牙利语",
  "印度尼西亚语","意大利语","日语","韩语","拉脱维亚语","立陶宛语",
  "马来语","挪威语","波斯语","波兰语","葡萄牙语","罗马尼亚语","俄语",
  "塞尔维亚语","西班牙语","瑞典语","塔加路语","泰米尔语","泰语",
  "土耳其语","乌克兰语","乌尔都语","越南语",
];
const FOLLOWER_STEPS: { label: string; value: string | null }[] = [
  { label: "不限",  value: null  },
  { label: "1万+",  value: "1万+" },
  { label: "5万+",  value: "5万+" },
  { label: "10万+", value: "10万+" },
  { label: "50万+", value: "50万+" },
  { label: "100万+",value: "100万+" },
  { label: "500万+",value: "500万+" },
];
const VIEW_STEPS: { label: string; value: string | null }[] = [
  { label: "不限",   value: null    },
  { label: "1千+",   value: "1千+"  },
  { label: "1万+",   value: "1万+"  },
  { label: "5万+",   value: "5万+"  },
  { label: "10万+",  value: "10万+" },
  { label: "100万+", value: "100万+"},
  { label: "1000万+",value: "1000万+"},
];

// ── Application conditions (cooperation gating) ──────────────────────────────
const APPLICATION_CONDITIONS: { id: string; label: string; hint: string }[] = [
  { id: "gifting",    label: "接受免费寄样",     hint: "Gifting only" },
  { id: "paid",       label: "接受付费合作",     hint: "Paid placement" },
  { id: "affiliate",  label: "可走折扣码 / 联盟", hint: "Affiliate / Code" },
  { id: "longterm",   label: "接受长期合作",     hint: "Long-term" },
  { id: "email",      label: "公开商务邮箱",     hint: "Has business email" },
];

// ── Category taxonomy (L1 → L2) ──────────────────────────────────────────────
const CATEGORIES: { l1: string; l2: string[] }[] = [
  { l1: "美妆护肤", l2: ["护肤", "彩妆", "香水", "个护"] },
  { l1: "服装穿搭", l2: ["街头", "商务", "运动", "复古"] },
  { l1: "食品饮料", l2: ["健康食品", "零食", "咖啡茶饮", "调味品"] },
  { l1: "家居生活", l2: ["家具", "家电", "装饰", "收纳"] },
  { l1: "数码 3C", l2: ["手机配件", "智能家居", "耳机音响", "相机"] },
  { l1: "运动健身", l2: ["跑步", "瑜伽", "力量训练", "户外"] },
];

// ── Marketing goals ─────────────────────────────────────────────────────────
const GOALS: { id: string; label: string }[] = [
  { id: "brand",    label: "品牌曝光" },
  { id: "promo",    label: "促销转化" },
  { id: "launch",   label: "新品推广" },
  { id: "seeding",  label: "口碑种草" },
];

// ── Scene cards (AI-inferred from product) ───────────────────────────────────
const MOCK_SCENES: { id: string; icon: string; name: string; type: string; reason: string; format: string; creatorCount: number; avgEngagement: string }[] = [
  { id: "routine",  icon: "🌙", name: "晚间护肤 routine", type: "修复 / 舒缓", reason: "适合展示连续使用、肤感变化和第二天状态", format: "真人出镜 + 步骤教程", creatorCount: 342, avgEngagement: "8.2%" },
  { id: "science",  icon: "🔬", name: "成分科普测评",    type: "信任建立", reason: "适合解释成分、功效机制和敏感肌顾虑", format: "成分讲解 + 近景质地", creatorCount: 156, avgEngagement: "6.7%" },
  { id: "unbox",    icon: "📦", name: "开箱 & 初体验",    type: "新品种草", reason: "适合快速讲清包装、质地、第一印象和购买理由", format: "短视频 + 购买钩子", creatorCount: 289, avgEngagement: "11.3%" },
  { id: "makeup",   icon: "💄", name: "GRWM 妆前护肤",    type: "生活方式", reason: "适合把产品自然嵌入妆前流程和日常场景", format: "GRWM + 使用前后", creatorCount: 201, avgEngagement: "9.8%" },
];

// ── AI mocks ─────────────────────────────────────────────────────────────────
const MOCK_OG_PREVIEW = {
  title: "防蓝光护眼面霜 · MyBrand 官网",
  image: "https://picsum.photos/seed/product-thumb/240/240",
  domain: "mybrand.com",
};
const MOCK_AI_CATEGORY = { l1: "美妆护肤", l2: "护肤" };

// ── Mock creators (with real photo URLs) ──────────────────────────────────────
type VideoClip = { age: string; er: string; plays: string; likes: string | number; seed: string };
type Creator = { id: string; name: string; handle: string; avatarImg: number; region: string; followers: string; er: string; verified: boolean; email: string; smartTags: string[]; videos: VideoClip[]; status: "pending" | "no" | "saved" };
type DiscoveryAnchor = { id: string; name: string; handle: string; avatarSeed: string };
type FindSimilarMode = "找相似" | "找平替" | "找种子达人";
type DiscoveryEntrySource = "quick-screen" | "seed-finder" | null;
type DiscoveryFilters = {
  region: string;
  language: string;
  followers: string;
  verified: string;
  email: string;
};

const FIND_SIMILAR_MODE_META: Record<FindSimilarMode, { icon: string; title: string; desc: string; accent: string; softBg: string; softBorder: string }> = {
  "找相似": {
    icon: "🪞",
    title: "找相似",
    desc: "风格、粉丝画像高度一致的博主",
    accent: "#c96442",
    softBg: "#fef3e8",
    softBorder: "#f5d0a9",
  },
  "找平替": {
    icon: "💰",
    title: "找平替",
    desc: "报价更低、效果相当的替代博主",
    accent: "#8a6622",
    softBg: "#fcf6e8",
    softBorder: "#e8d5a0",
  },
  "找种子达人": {
    icon: "🌱",
    title: "找种子达人",
    desc: "低重合、高潜力的种子达人",
    accent: "#3f7d35",
    softBg: "#eef6ef",
    softBorder: "#b8d9bb",
  },
};

const MOCK_CREATORS: Creator[] = [
  { id: "mc1", name: "Magicofbrands", handle: "@magicofbrands", avatarImg: 47, region: "🇮🇳", followers: "18.9K", er: "6.5%", verified: true, email: "corporate", smartTags: ["爆款达人","英语","印地语","美妆种草"],
    videos: [{ age: "5小时前", er: "9.5%", plays: "116", likes: 11, seed: "mc1v1" },{ age: "2天前", er: "6.4%", plays: "1.9K", likes: 50, seed: "mc1v2" },{ age: "3天前", er: "3.8%", plays: "1.3K", likes: 44, seed: "mc1v3" }], status: "pending" },
  { id: "mc2", name: "Vinit Choudhury", handle: "@vinit.choudhury", avatarImg: 12, region: "🇮🇳", followers: "3.2K", er: "7.9%", verified: false, email: "personal", smartTags: ["种草达人","印地语","健身生活"],
    videos: [{ age: "2天前", er: "7.9%", plays: "292", likes: 23, seed: "mc2v1" },{ age: "2天前", er: "3.8%", plays: "1.1K", likes: 41, seed: "mc2v2" },{ age: "24天前", er: "7.0%", plays: "781", likes: 54, seed: "mc2v3" }], status: "pending" },
  { id: "mc3", name: "Sarah K Beauty", handle: "@sarakhbeauty", avatarImg: 9, region: "🇺🇸", followers: "245K", er: "4.2%", verified: true, email: "corporate", smartTags: ["爆款达人","英语","护肤教程","成分党"],
    videos: [{ age: "1天前", er: "8.1%", plays: "52K", likes: "2.1K", seed: "mc3v1" },{ age: "3天前", er: "5.3%", plays: "28K", likes: "1.2K", seed: "mc3v2" },{ age: "5天前", er: "3.9%", plays: "19K", likes: 890, seed: "mc3v3" }], status: "pending" },
  { id: "mc4", name: "GlowWithSun", handle: "@glowwithsun", avatarImg: 21, region: "🇬🇧", followers: "89K", er: "5.8%", verified: true, email: "corporate", smartTags: ["同行验证","英语","光泽肌","GRWM"],
    videos: [{ age: "4小时前", er: "11.2%", plays: "7.8K", likes: 412, seed: "mc4v1" },{ age: "2天前", er: "6.7%", plays: "4.2K", likes: 198, seed: "mc4v2" },{ age: "7天前", er: "4.1%", plays: "2.9K", likes: 134, seed: "mc4v3" }], status: "pending" },
  { id: "mc5", name: "FitnessByMara", handle: "@fitnessbymara", avatarImg: 44, region: "🇧🇷", followers: "132K", er: "6.1%", verified: false, email: "personal", smartTags: ["种草达人","葡萄牙语","健身","运动恢复"],
    videos: [{ age: "6小时前", er: "7.4%", plays: "9.1K", likes: 678, seed: "mc5v1" },{ age: "3天前", er: "5.2%", plays: "5.6K", likes: 421, seed: "mc5v2" },{ age: "6天前", er: "4.8%", plays: "4.3K", likes: 312, seed: "mc5v3" }], status: "pending" },
  { id: "mc6", name: "TechLifeJapan", handle: "@techlifejapan", avatarImg: 16, region: "🇯🇵", followers: "67K", er: "8.3%", verified: true, email: "corporate", smartTags: ["同行验证","日语","英语","美妆科技"],
    videos: [{ age: "1天前", er: "12.1%", plays: "8.4K", likes: 921, seed: "mc6v1" },{ age: "4天前", er: "7.8%", plays: "5.2K", likes: 567, seed: "mc6v2" },{ age: "8天前", er: "5.9%", plays: "3.8K", likes: 389, seed: "mc6v3" }], status: "pending" },
  { id: "mc7", name: "BeautyBySelin", handle: "@beautybyselin", avatarImg: 48, region: "🇹🇷", followers: "54K", er: "9.1%", verified: false, email: "corporate", smartTags: ["爆款达人","土耳其语","英语","护肤日常"],
    videos: [{ age: "3小时前", er: "13.4%", plays: "6.2K", likes: 780, seed: "mc7v1" },{ age: "1天前", er: "8.7%", plays: "4.1K", likes: 498, seed: "mc7v2" },{ age: "5天前", er: "5.2%", plays: "2.6K", likes: 287, seed: "mc7v3" }], status: "pending" },
  { id: "mc8", name: "NaturalGlowKim", handle: "@naturalglowkim", avatarImg: 25, region: "🇰🇷", followers: "310K", er: "3.8%", verified: true, email: "corporate", smartTags: ["同行验证","韩语","英语","素颜护肤"],
    videos: [{ age: "2天前", er: "6.2%", plays: "32K", likes: "1.8K", seed: "mc8v1" },{ age: "4天前", er: "4.1%", plays: "18K", likes: 920, seed: "mc8v2" },{ age: "9天前", er: "2.9%", plays: "12K", likes: 614, seed: "mc8v3" }], status: "pending" },
];

const REGION_CODE_TO_FLAG: Record<string, string> = {
  us: "🇺🇸",
  gb: "🇬🇧",
  in: "🇮🇳",
  jp: "🇯🇵",
  kr: "🇰🇷",
  br: "🇧🇷",
  tr: "🇹🇷",
};

const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  region: "all",
  language: "all",
  followers: "all",
  verified: "all",
  email: "all",
};

function normalizeHandle(value: string) {
  if (!value.trim()) return "@creator";
  return value.startsWith("@") ? value : `@${value}`;
}

function buildAnchorNameFromHandle(handle: string) {
  const cleaned = handle.replace(/^@/, "").replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Creator";
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getAnchorAvatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=fdf0e8,efe4d5,e8d5c6&radius=50`;
}

function getCreatorAvatarUrl(creator: Creator) {
  return `https://i.pravatar.cc/100?img=${creator.avatarImg}`;
}

function buildAnchorFromCreator(creator: Creator): DiscoveryAnchor {
  return {
    id: creator.id,
    name: creator.name,
    handle: creator.handle,
    avatarSeed: creator.id,
  };
}

function parseFollowersInK(value: string) {
  const normalized = value.toUpperCase().replace(/,/g, "");
  if (normalized.endsWith("M")) {
    return Number.parseFloat(normalized) * 1000;
  }
  return Number.parseFloat(normalized.replace("K", ""));
}

function parsePercent(value: string) {
  return Number.parseFloat(value.replace("%", ""));
}

function scoreCreatorAgainstAnchor(candidate: Creator, anchor: Creator) {
  const sharedTags = candidate.smartTags.filter((tag) => anchor.smartTags.includes(tag)).length;
  const followerGap = Math.abs(parseFollowersInK(candidate.followers) - parseFollowersInK(anchor.followers));
  const sameRegion = candidate.region === anchor.region ? 18 : 0;
  const sameEmailType = candidate.email === anchor.email ? 8 : 0;
  const sameVerifiedState = candidate.verified === anchor.verified ? 6 : 0;
  const tagScore = sharedTags * 7;
  const proximityScore = Math.max(0, 26 - followerGap / 12);
  return sameRegion + sameEmailType + sameVerifiedState + tagScore + proximityScore;
}

function buildSimilarCreatorResults(anchor: Creator) {
  return MOCK_CREATORS
    .filter((creator) => creator.id !== anchor.id)
    .slice()
    .sort((left, right) => scoreCreatorAgainstAnchor(right, anchor) - scoreCreatorAgainstAnchor(left, anchor))
    .map((creator) => ({ ...creator, status: "pending" as const }));
}

function scoreBudgetCreator(candidate: Creator, anchor: Creator) {
  const sharedTags = candidate.smartTags.filter((tag) => anchor.smartTags.includes(tag)).length;
  const followerGap = parseFollowersInK(anchor.followers) - parseFollowersInK(candidate.followers);
  const sameRegion = candidate.region === anchor.region ? 10 : 0;
  const lowerBudgetBonus = followerGap >= 0 ? Math.min(28, 12 + followerGap / 8) : Math.max(0, 8 - Math.abs(followerGap) / 20);
  const styleFit = sharedTags * 7;
  const engagementBonus = parsePercent(candidate.er) * 1.8;
  const verificationPenalty = candidate.verified ? -2 : 4;
  return sameRegion + lowerBudgetBonus + styleFit + engagementBonus + verificationPenalty;
}

function buildBudgetCreatorResults(anchor: Creator) {
  return MOCK_CREATORS
    .filter((creator) => creator.id !== anchor.id)
    .slice()
    .sort((left, right) => scoreBudgetCreator(right, anchor) - scoreBudgetCreator(left, anchor))
    .map((creator) => ({ ...creator, status: "pending" as const }));
}

function scoreSeedCreator(candidate: Creator, anchor: Creator) {
  const sharedTags = candidate.smartTags.filter((tag) => anchor.smartTags.includes(tag)).length;
  const differentRegionBonus = candidate.region !== anchor.region ? 18 : 4;
  const lowOverlapBonus = Math.max(0, 22 - sharedTags * 5);
  const sizeProximity = Math.max(0, 18 - Math.abs(parseFollowersInK(candidate.followers) - parseFollowersInK(anchor.followers)) / 18);
  const engagementBonus = parsePercent(candidate.er) * 2.4;
  return differentRegionBonus + lowOverlapBonus + sizeProximity + engagementBonus;
}

function buildSeedCreatorResults(anchor: Creator) {
  return MOCK_CREATORS
    .filter((creator) => creator.id !== anchor.id)
    .slice()
    .sort((left, right) => scoreSeedCreator(right, anchor) - scoreSeedCreator(left, anchor))
    .map((creator) => ({ ...creator, status: "pending" as const }));
}

function buildCreatorResultsByMode(anchor: Creator, mode: FindSimilarMode) {
  switch (mode) {
    case "找平替":
      return buildBudgetCreatorResults(anchor);
    case "找种子达人":
      return buildSeedCreatorResults(anchor);
    default:
      return buildSimilarCreatorResults(anchor);
  }
}

function getModeMeta(mode: ModeId | null | undefined) {
  return MODES.find(m => m.id === mode) ?? MODES[1];
}

function getPlatformLabel(platform: PlatformId) {
  return PLATFORMS.find(p => p.id === platform)?.label ?? "TikTok";
}

function getCreatorRecommendation(creator: Creator, mode: ModeId | null | undefined) {
  const topVideo = creator.videos[0];
  const highAffinityTag = creator.smartTags.find(tag => ["同行验证", "爆款达人", "护肤教程", "成分党", "GRWM"].includes(tag)) ?? creator.smartTags[0];

  if (mode === "competitor") {
    return {
      badge: creator.smartTags.includes("同行验证") ? "同行合作证据：高" : "同行合作证据：中",
      score: creator.smartTags.includes("同行验证") ? 91 : 84,
      summary: "系统把合作证据放在排序第一位，而不是只看粉丝量。",
      reasons: [
        "近 90 天出现品牌 @ / #ad / 产品内容组合信号",
        `代表合作帖播放 ${topVideo?.plays ?? "42K"}，高于本人常规内容`,
        `${creator.email === "corporate" ? "公司邮箱已找到" : "可联系信息待复核"}，适合优先建联`,
      ],
      action: "查看证据帖",
    };
  }

  if (mode === "viral") {
    return {
      badge: creator.smartTags.includes("爆款达人") ? "口碑信号：强" : "口碑信号：中",
      score: creator.smartTags.includes("爆款达人") ? 92 : 86,
      summary: "系统优先看真实评论、种草稳定性和商务可用性，而不是只看播放量。",
      reasons: [
        `近 30 天代表内容播放 ${topVideo?.plays ?? "52K"}，ER ${topVideo?.er ?? creator.er}`,
        `账号整体 ER ${creator.er}，评论区产品问题密度较高`,
        "建议 brief：让达人以真实体验和问题回答切入，减少硬广感",
      ],
      action: "查看口碑证据",
    };
  }

  return {
    badge: "场景匹配度",
    score: creator.smartTags.includes("护肤教程") || creator.smartTags.includes("GRWM") ? 93 : 88,
    summary: "系统先判断产品适合怎么拍，再找擅长这些内容场景的达人。",
    reasons: [
      `擅长 ${highAffinityTag} / ${creator.smartTags.slice(1, 3).join(" / ") || "生活方式"} 内容`,
      `该场景内容中位表现约 ${topVideo?.plays ?? "42K"}，互动 ${topVideo?.er ?? creator.er}`,
      "推荐拍法：使用前后 + 场景化步骤教程",
    ],
    action: "生成场景 brief",
  };
}

// ── Platform SVG icons ────────────────────────────────────────────────────────
function TikTokIcon({ colored = false }: { colored?: boolean }) {
  if (colored) {
    return (
      <svg width={18} height={18} viewBox="0 0 32 32" fill="none" aria-hidden>
        <path transform="translate(-1,1)" fill="#25F4EE" d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z" />
        <path transform="translate(1,-1)" fill="#FE2C55" d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z" />
        <path fill="#0b0b0b" d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z" />
      </svg>
    );
  }
  return <svg width={18} height={18} viewBox="0 0 32 32" fill="currentColor" aria-hidden><path d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z"/></svg>;
}
function InstagramIcon({ colored = false }: { colored?: boolean }) {
  if (colored) {
    return (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id="discoveryInstagramGradient" x1="3" y1="22" x2="21" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FEDA75" />
            <stop offset=".35" stopColor="#FA7E1E" />
            <stop offset=".6" stopColor="#D62976" />
            <stop offset=".8" stopColor="#962FBF" />
            <stop offset="1" stopColor="#4F5BD5" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#discoveryInstagramGradient)" />
        <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="#fff" />
      </svg>
    );
  }
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
}
function YoutubeIcon({ colored = false }: { colored?: boolean }) {
  if (colored) {
    return (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="1.3" y="4" width="21.4" height="16" rx="4.5" fill="#FF0000" />
        <path d="m10 8.8 6 3.2-6 3.2V8.8Z" fill="#fff" />
      </svg>
    );
  }
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M23 7s-.3-2-1.2-2.7C20.7 3.1 19.4 3.1 18.8 3 16.2 3 12 3 12 3S7.8 3 5.2 3.2c-.6 0-1.9 0-3 1.3C1.3 5 1 7 1 7S.7 9.2.7 11.5v2.1c0 2.3.3 4.5.3 4.5s.3 2 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.7 22 12 22 12 22s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.7 1.2-2.7 1.2-2.7s.3-2.2.3-4.5v-2.1C23.3 9.2 23 7 23 7zm-13.3 8.5V8.4l8.1 3.6-8.1 3.5z"/></svg>;
}

function PlatformButton({ id, selected, onClick }: { id: PlatformId; selected: boolean; onClick: () => void }) {
  const cfg = { tiktok: { bg: "#000", color: "#fff" }, instagram: { bg: "linear-gradient(135deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)", color: "#fff" }, youtube: { bg: "#FF0000", color: "#fff" } }[id];
  return (
    <button type="button" onClick={onClick} className={cn("flex h-12 w-12 items-center justify-center rounded-[14px] transition-all duration-150", selected ? "ring-2 ring-[#c96442] ring-offset-2" : "hover:opacity-80 hover:scale-105")} style={{ background: cfg.bg, color: cfg.color }}>
      {id === "tiktok" && <TikTokIcon />}{id === "instagram" && <InstagramIcon />}{id === "youtube" && <YoutubeIcon />}
    </button>
  );
}

// ── Filter sub-panels ─────────────────────────────────────────────────────────
function RegionPanel({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (c: string) => onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]);
  const toggleAll = (r: (typeof REGIONS)[0]) => { const all = r.countries; const hasAll = all.every(c => selected.includes(c)); onChange(hasAll ? selected.filter(c => !all.includes(c)) : [...selected, ...all.filter(c => !selected.includes(c))]); };
  return (
    <div className="max-h-64 overflow-y-auto space-y-3 pr-0.5">
      {REGIONS.map(r => (
        <div key={r.label}>
          <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-semibold text-[#87867f]">{r.label}</span><button type="button" onClick={() => toggleAll(r)} className="text-[10px] text-[#c96442] hover:underline">全选</button></div>
          {r.countries.map(c => <label key={c} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-[#f5f4ed] cursor-pointer"><input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} className="h-3.5 w-3.5 rounded border-[#e8e6dc] accent-[#c96442]" /><span className="text-sm text-[#4d4c48]">{c}</span></label>)}
        </div>
      ))}
    </div>
  );
}
function LanguagePanel({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (l: string) => onChange(selected.includes(l) ? selected.filter(x => x !== l) : [...selected, l]);
  return <div className="max-h-64 overflow-y-auto pr-0.5">{LANGUAGES.map(l => <label key={l} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-[#f5f4ed] cursor-pointer"><input type="checkbox" checked={selected.includes(l)} onChange={() => toggle(l)} className="h-3.5 w-3.5 rounded border-[#e8e6dc] accent-[#c96442]" /><span className="text-sm text-[#4d4c48]">{l}</span></label>)}</div>;
}
function RangePanel({ presets, preset, from, to, onPreset, onFrom, onTo }: { presets: string[]; preset: string | null; from: string; to: string; onPreset: (v: string | null) => void; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  return (
    <div className="space-y-1">
      {presets.map(p => <label key={p} className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-[#f5f4ed] cursor-pointer"><input type="radio" checked={preset === p} onChange={() => onPreset(preset === p ? null : p)} className="h-3.5 w-3.5 accent-[#c96442]" /><span className="text-sm text-[#4d4c48]">{p}</span></label>)}
      <div className="flex gap-2 pt-2">
        <input type="text" placeholder="From" value={from} onChange={e => onFrom(e.target.value)} className="flex-1 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3 py-1.5 text-xs text-[#4d4c48] placeholder:text-[#b0aea6] outline-none focus:border-[#c96442]/50" />
        <input type="text" placeholder="To" value={to} onChange={e => onTo(e.target.value)} className="flex-1 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3 py-1.5 text-xs text-[#4d4c48] placeholder:text-[#b0aea6] outline-none focus:border-[#c96442]/50" />
      </div>
      <input type="range" min={0} max={100} className="w-full mt-1 accent-[#c96442]" />
    </div>
  );
}

// ── Step slider (followers / views filter) ────────────────────────────────────
function StepSlider({
  steps,
  value,
  onChange,
}: {
  steps: { label: string; value: string | null }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const rawIdx = value === null ? 0 : steps.findIndex(s => s.value === value);
  const idx = rawIdx < 0 ? 0 : rawIdx;
  const max = steps.length - 1;
  const pct = max === 0 ? 0 : (idx / max) * 100;

  return (
    <div className="select-none px-1 pb-1 pt-3">
      {/* Track */}
      <div className="relative h-5 cursor-pointer">
        {/* Track background */}
        <div className="absolute left-0 right-0 top-1/2 h-[5px] -translate-y-1/2 overflow-hidden rounded-full bg-[#ede8de]">
          <motion.div
            className="h-full rounded-full bg-[#c96442]"
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
        {/* Tick dots */}
        {steps.map((_, i) => {
          const tickPct = max === 0 ? 0 : (i / max) * 100;
          const isPast = i <= idx;
          return (
            <div
              key={i}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-150"
              style={{
                left: `${tickPct}%`,
                backgroundColor: isPast ? "#c96442" : "#e0dbd0",
                borderColor: isPast ? "#c96442" : "#d8d3c8",
              }}
            />
          );
        })}
        {/* Thumb */}
        <motion.div
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="pointer-events-none absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#c96442] bg-white shadow-[0_2px_8px_rgba(201,100,66,0.28)]"
        />
        {/* Invisible range input */}
        <input
          type="range"
          min={0}
          max={max}
          value={idx}
          onChange={e => onChange(steps[Number(e.target.value)].value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      {/* Step labels */}
      <div className="relative mt-3" style={{ height: 20 }}>
        {steps.map((step, i) => {
          const tickPct = max === 0 ? 0 : (i / max) * 100;
          const isActive = i === idx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(step.value)}
              style={{ left: `${tickPct}%` }}
              className={cn(
                "absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-medium transition-colors duration-150",
                isActive ? "text-[#c96442] font-semibold" : "text-[#a3a098] hover:text-[#4d4c48]"
              )}
            >
              {step.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FollowersPanel({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <StepSlider steps={FOLLOWER_STEPS} value={value} onChange={onChange} />
    </div>
  );
}

function ViewsPanel({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <StepSlider steps={VIEW_STEPS} value={value} onChange={onChange} />
    </div>
  );
}

// ── Sentence helpers ──────────────────────────────────────────────────────────
function B({ children }: { children: React.ReactNode }) { return <strong className="font-semibold text-[#141413]">{children}</strong>; }
function AutoSentence({ platform, mode, countries, languages, followersPreset, followersFrom, followersTo, viewsPreset, viewsFrom, viewsTo }: { platform: PlatformId; mode: ModeId | null; countries: string[]; languages: string[]; followersPreset: string | null; followersFrom: string; followersTo: string; viewsPreset: string | null; viewsFrom: string; viewsTo: string }) {
  const pLabel = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" }[platform];
  const mLabel = mode ? MODES.find(m => m.id === mode)?.title : null;
  const regionText = countries.length === 0 ? null : countries.length <= 3 ? countries.join("、") : `${countries.slice(0,2).join("、")} 等 ${countries.length} 个地区`;
  const langText = languages.length === 0 ? null : languages.length <= 3 ? languages.join("和") : `${languages.slice(0,2).join("和")} 等 ${languages.length} 种语言`;
  const fText = followersPreset ?? (followersFrom||followersTo ? `${followersFrom||"0"} – ${followersTo||"∞"}` : null);
  const vText = viewsPreset ?? (viewsFrom||viewsTo ? `${viewsFrom||"0"} – ${viewsTo||"∞"}` : null);
  if (!mLabel && !regionText && !langText && !fText && !vText) return <p className="text-[15px] leading-8 text-[#b0aea6]">在 <B>{pLabel}</B> 平台上选择搜索方式，并配置筛选条件，系统将根据你的输入精准匹配博主。</p>;
  return (
    <p className="text-[15px] leading-8 text-[#5e5d59]">
      {"我在 "}<B>{pLabel}</B>{" 平台"}
      {mLabel && (<>{", 正在寻找 "}<B>{mLabel}</B>{" 类博主"}</>)}
      {regionText && (<>{", 目标受众在 "}<B>{regionText}</B></>)}
      {langText && (<>{", 内容语言为 "}<B>{langText}</B></>)}
      {fText && (<>{", 粉丝量 "}<B>{fText}</B></>)}
      {vText && (<>{", 平均播放量 "}<B>{vText}</B></>)}
      {"。"}
    </p>
  );
}

// ── Creator card (2-col grid, portrait videos) ────────────────────────────────
function CreatorCard({
  creator,
  currentFindSimilarMode,
  discoveryMode,
  isQuickScreenContext,
  showFindSimilarReminder,
  dontRemindAgain,
  onNo,
  onSave,
  onFindSimilar,
  onConfirmFindSimilar,
  onCloseFindSimilarReminder,
  onDontRemindAgainChange,
  onOpenProfile,
}: {
  creator: Creator;
  currentFindSimilarMode: FindSimilarMode;
  discoveryMode?: ModeId | null;
  isQuickScreenContext: boolean;
  showFindSimilarReminder: boolean;
  dontRemindAgain: boolean;
  onNo: () => void;
  onSave: () => void;
  onFindSimilar: () => void;
  onConfirmFindSimilar: () => void;
  onCloseFindSimilarReminder: () => void;
  onDontRemindAgainChange: (checked: boolean) => void;
  onOpenProfile: () => void;
}) {
  const saved = creator.status === "saved";
  const dismissed = creator.status === "no";
  const recommendation = getCreatorRecommendation(creator, discoveryMode);
  const reminderRef = useRef<HTMLDivElement>(null);
  const reminderMeta = isQuickScreenContext
    ? {
        icon: "⚡",
        title: "快速筛选",
        accent: "#7a8a6a",
        softBg: "#f3f0e8",
        softBorder: "#ddd4c2",
      }
    : {
        icon: FIND_SIMILAR_MODE_META[currentFindSimilarMode].icon,
        title: currentFindSimilarMode,
        accent: FIND_SIMILAR_MODE_META[currentFindSimilarMode].accent,
        softBg: FIND_SIMILAR_MODE_META[currentFindSimilarMode].softBg,
        softBorder: FIND_SIMILAR_MODE_META[currentFindSimilarMode].softBorder,
      };

  useEffect(() => {
    if (!showFindSimilarReminder) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (reminderRef.current && !reminderRef.current.contains(event.target as Node)) {
        onCloseFindSimilarReminder();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCloseFindSimilarReminder, showFindSimilarReminder]);

  return (
    <div className={cn("flex flex-col rounded-2xl border bg-white overflow-hidden transition-all", dismissed ? "opacity-50" : "border-[#e8e6dc]")}>
      {/* Info row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button type="button" onClick={onOpenProfile} aria-label={`查看 ${creator.name} 的详细信息`} className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:ring-offset-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getCreatorAvatarUrl(creator)} alt={creator.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[#141413] text-sm leading-tight">{creator.name}</span>
            <span className="text-base">{creator.region}</span>
            {creator.verified && <span className="text-[10px] rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-blue-600">认证</span>}
          </div>
          <span className="text-xs text-[#87867f]">{creator.handle}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <span className="text-[#87867f]">👥 {creator.followers}</span>
          <span className="font-semibold text-[#c96442]">ER {creator.er}</span>
        </div>
      </div>

      {/* Smart tags */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {creator.smartTags.slice(0, 3).map(t => <span key={t} className="rounded-full bg-[#f5f4ed] px-2 py-0.5 text-[11px] text-[#4d4c48]">{t}</span>)}
      </div>

      <div className="mx-4 mb-3 rounded-[18px] border border-[#efe4d8] bg-[linear-gradient(180deg,#fffdf9_0%,#faf6ef_100%)] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c96442]">{recommendation.badge}</p>
            <p className="mt-1 text-xs leading-5 text-[#5e5d59]">{recommendation.summary}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f0d5c4] bg-white text-sm font-bold text-[#c96442]">
            {recommendation.score}
          </div>
        </div>
        <div className="mt-2 space-y-1.5">
          {recommendation.reasons.map(reason => (
            <div key={reason} className="flex gap-2 text-[11px] leading-5 text-[#4d4c48]">
              <Check className="mt-1 h-3 w-3 shrink-0 text-[#7a8a6a]" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 rounded-full border border-[#e8e6dc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#4d4c48] transition-colors hover:border-[#c96442]/35 hover:text-[#c96442]">
          {recommendation.action}
        </button>
      </div>

      {/* Portrait video thumbnails */}
      <div className="grid grid-cols-3 gap-1.5 px-4">
        {creator.videos.map((v, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "9/16" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://picsum.photos/seed/${v.seed}/300/533`}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            {/* ER badge top-right */}
            <div className="absolute right-1.5 top-1.5">
              <span className="rounded-md bg-emerald-500/85 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">ER {v.er}</span>
            </div>
            {/* Stats bottom */}
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[9px] text-white/75 leading-tight">{v.age}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] font-medium text-white">
                <span>▶ {v.plays}</span>
                <span>♥ {v.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons below videos */}
      <div className="grid grid-cols-3 gap-2 p-4">
        <button
          type="button"
          onClick={onNo}
          title="不感兴趣：后续推荐会降低这类相似特征权重"
          className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-[20px] border py-2.5 text-sm font-medium transition-all", dismissed ? "border-[#c96442]/25 bg-[#fdf5f0] text-[#c96442]" : "border-[#e8e6dc] bg-white text-[#87867f] hover:bg-[#f5f4ed] hover:text-[#4d4c48]")}
        >
          <Hand className="h-3.5 w-3.5" />No
        </button>
        <button
          type="button"
          onClick={onSave}
          title="感兴趣：后续推荐会强化这类相似特征权重"
          className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-[20px] border py-2.5 text-sm font-medium transition-all", saved ? "border-[#c96442]/30 bg-[#fdf5f0] text-[#c96442]" : "border-[#e8e6dc] bg-white text-[#87867f] hover:bg-[#fdf5f0] hover:text-[#c96442]")}
        >
          <Heart className={cn("h-3.5 w-3.5", saved && "fill-[#c96442]")} />收藏
        </button>
        <div className="relative" ref={reminderRef}>
          {showFindSimilarReminder ? (
            <div className="absolute bottom-[calc(100%+10px)] left-1/2 z-20 w-[280px] -translate-x-1/2 rounded-[18px] border border-[#e8e6dc] bg-[linear-gradient(180deg,#fffdf9_0%,#faf9f5_100%)] p-3 shadow-[0_22px_60px_-28px_rgba(20,20,19,0.32)]">
              <div className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold" style={{ color: reminderMeta.accent, background: reminderMeta.softBg, borderColor: reminderMeta.softBorder }}>
                <span>{reminderMeta.icon}</span>
                <span>当前状态：{reminderMeta.title}</span>
              </div>
              <p className="mt-2 text-[13px] font-semibold leading-5 text-[#141413]">
                点击带头像的“找相似”按钮后，将以该博主作为新的相似基准。
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[#87867f]">
                {isQuickScreenContext
                  ? `当前页面是快速筛选结果页，系统会基于 ${creator.handle} 重新进入“找相似”搜索流程。`
                  : `系统会基于 ${creator.handle} 重新生成相似达人结果，当前模式下的搜索逻辑将被替换。`}
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[11px] text-[#4d4c48]">
                <input
                  type="checkbox"
                  checked={dontRemindAgain}
                  onChange={(event) => onDontRemindAgainChange(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#d7d1c5] text-[#c96442] focus:ring-0"
                />
                <span>不再提醒</span>
              </label>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={onCloseFindSimilarReminder} className="rounded-xl border border-[#e8e6dc] bg-[#f5f4ed] px-3 py-2 text-[11px] font-medium text-[#87867f] transition-colors hover:bg-[#ece8dd] hover:text-[#4d4c48]">
                  取消
                </button>
                <button type="button" onClick={onConfirmFindSimilar} className="rounded-xl bg-[#c96442] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#d97757]">
                  确认切换
                </button>
              </div>
              <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#e8e6dc] bg-[#faf9f5]" />
            </div>
          ) : null}
          <button
            type="button"
            onClick={onFindSimilar}
            title={`根据 ${creator.handle} 重新寻找相似博主`}
            aria-label={`根据 ${creator.handle} 找相似`}
            className="flex w-full flex-1 items-center justify-center gap-1.5 rounded-[20px] border border-[#c96442] bg-[#c96442] py-2.5 text-sm font-semibold text-white transition-all hover:border-[#d97757] hover:bg-[#d97757]"
          >
            <span>根据</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getCreatorAvatarUrl(creator)}
              alt=""
              aria-hidden="true"
              className="h-5 w-5 shrink-0 rounded-full border border-white/75 object-cover shadow-[0_2px_7px_rgba(20,20,19,0.2)]"
            />
            <span>找相似</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function ExitConfirmModal({
  dontRemindAgain,
  onDontRemindAgainChange,
  onConfirm,
  onCancel,
}: {
  dontRemindAgain: boolean;
  onDontRemindAgainChange: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-[#e8e6dc] bg-white p-6 shadow-[0_24px_80px_-20px_rgba(20,20,19,0.22)]">
        <p className="text-center text-sm font-semibold text-[#141413]">确认结束当前筛选吗？</p>
        <p className="mt-2 text-center text-xs leading-6 text-[#87867f]">
          结束后，本次待筛选名单将不会保留。您确定结束吗？
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-[#4d4c48]">
          <input
            type="checkbox"
            checked={dontRemindAgain}
            onChange={(event) => onDontRemindAgainChange(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-[#d7d1c5] text-[#c96442] focus:ring-0"
          />
          <span>不再提醒</span>
        </label>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-[#e8e6dc] bg-[#f5f4ed] py-2.5 text-sm font-medium text-[#4d4c48] transition-colors hover:bg-[#e8e6dc]">取消</button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-[#c96442] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d97757]">结束</button>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ savedCount, totalCount, onClose }: { savedCount: number; totalCount: number; onClose: () => void }) {
  const unmarked = totalCount - savedCount;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-[#e8e6dc] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_55%,#f5f4ed_100%)] p-6 text-[#141413] shadow-[0_30px_120px_-40px_rgba(77,76,72,0.22)]">
        {/* Radial glow at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,#c9644233,transparent_70%)]" />
        {/* Close button */}
        <button type="button" onClick={onClose} className="absolute right-5 top-5 z-10 rounded-full border border-[#e8e6dc] bg-white p-2 text-[#87867f] transition-colors hover:bg-[#f5f4ed]">
          <X className="h-4 w-4" />
        </button>
        {/* Header */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e6dc] bg-white px-3 py-1 text-xs text-[#c96442]">
            <Download className="h-3.5 w-3.5" />
            导出博主表格
          </div>
          <div className="mt-3 text-2xl font-semibold">导出 {savedCount} 位已收藏博主</div>
          <p className="mt-2 text-sm leading-6 text-[#5e5d59]">
            表格包含博主名称、平台主页链接、粉丝量、互动率、平均播放量、报价区间及邮箱，格式为 .xlsx（Excel 兼容）。
          </p>
        </div>
        {/* Warning */}
        {unmarked > 0 && (
          <div className="relative mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">还有 {unmarked} 位博主未标记</p>
              <p className="mt-1 text-xs leading-5 text-amber-700">未打标记的博主不会出现在导出表格中。建议先完成所有博主的收藏/No 标记，再导出完整数据。</p>
            </div>
          </div>
        )}
        {/* Action buttons */}
        <div className="relative mt-5 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-[#e8e6dc] bg-white py-2.5 text-sm font-medium text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]">
            取消
          </button>
          <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#c96442] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d97757]">
            <Download className="h-3.5 w-3.5" />继续并下载
          </button>
        </div>
      </div>
    </div>
  );
}

function FindSimilarModeModal({
  creator,
  currentMode,
  onSelect,
  onClose,
}: {
  creator: Creator;
  currentMode: FindSimilarMode;
  onSelect: (mode: FindSimilarMode) => void;
  onClose: () => void;
}) {
  const { openCreatorProfile } = useCreatorProfile();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#141413]/18 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative w-full max-w-[360px] rounded-[24px] border border-[#e8e6dc] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_62%,#f5f4ed_100%)] p-4 shadow-[0_28px_80px_-30px_rgba(20,20,19,0.28)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-t-[24px] bg-[radial-gradient(circle_at_top,#c9644216,transparent_72%)]" />
        <div className="relative z-10 flex items-start gap-3">
          <button type="button" onClick={() => openCreatorProfile(creatorToProfileInput(creator))} className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:ring-offset-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getCreatorAvatarUrl(creator)} alt={creator.name} className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[#87867f]">根据此博主继续搜索</p>
            <p className="truncate text-[16px] font-semibold leading-tight text-[#141413]">{creator.handle}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#87867f]">
              请选择本次要切换到的搜索方式。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#87867f] transition-colors hover:bg-white/80 hover:text-[#141413]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-4 space-y-2">
          {(Object.keys(FIND_SIMILAR_MODE_META) as FindSimilarMode[]).map((mode) => {
            const meta = FIND_SIMILAR_MODE_META[mode];
            const isCurrent = currentMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onSelect(mode)}
                className="flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-all hover:-translate-y-0.5"
                style={{
                  background: isCurrent ? meta.softBg : "#ffffff",
                  borderColor: isCurrent ? meta.softBorder : "#e8e6dc",
                  boxShadow: isCurrent ? "0 10px 24px -22px rgba(201,100,66,0.4)" : "none",
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white text-[16px]"
                  style={{ borderColor: meta.softBorder }}
                >
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[13px] font-semibold" style={{ color: meta.accent }}>
                      {meta.title}
                    </span>
                    {isCurrent ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{ color: meta.accent, background: meta.softBorder }}
                      >
                        当前
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#87867f]">{meta.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Filter select (styled) ────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-[#4d4c48]">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-[#e8e6dc] bg-white py-2 pl-3 pr-8 text-sm text-[#4d4c48] outline-none transition-colors focus:border-[#c96442]/50 focus:ring-0"
        >
          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
      </div>
    </div>
  );
}

// ── Results view ──────────────────────────────────────────────────────────────
function ResultsView({
  onBack,
  initialAnchor,
  initialFindSimilarMode,
  initialRegionCode,
  initialDiscoveryMode,
  initialPlatform,
  entrySource,
}: {
  onBack: () => void;
  initialAnchor?: DiscoveryAnchor | null;
  initialFindSimilarMode?: FindSimilarMode;
  /** When opening results from plugin deep-link, sync first matched region to sidebar filters */
  initialRegionCode?: string | null;
  initialDiscoveryMode?: ModeId | null;
  initialPlatform?: PlatformId;
  entrySource?: DiscoveryEntrySource;
}) {
  const { currentProject, openEditProject } = useWorkspaceProject();
  const discoveryMode = initialDiscoveryMode ?? "scenario";
  const discoveryMeta = getModeMeta(discoveryMode);
  const platformLabel = getPlatformLabel(initialPlatform ?? "tiktok");
  const regionDefault =
    initialRegionCode && Object.keys(REGION_CODE_TO_FLAG).includes(initialRegionCode)
      ? initialRegionCode
      : "all";
  const [creators, setCreators] = useState<Creator[]>(MOCK_CREATORS);
  const [anchor, setAnchor] = useState<DiscoveryAnchor | null>(initialAnchor ?? null);
  const [activeTab, setActiveTab] = useState<"pending" | "no" | "saved">("pending");
  const [showExit, setShowExit] = useState(false);
  const [dontRemindExitAgain, setDontRemindExitAgain] = useState(false);
  const [skipExitReminder, setSkipExitReminder] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const [filterRegion, setFilterRegion] = useState(regionDefault);
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [filterFollowers, setFilterFollowers] = useState("all");
  const [filterVerified, setFilterVerified] = useState("all");
  const [filterEmail, setFilterEmail] = useState("all");
  const [findSimilarMode, setFindSimilarMode] = useState<FindSimilarMode>(initialFindSimilarMode ?? "找相似");
  const [pendingSimilarCreator, setPendingSimilarCreator] = useState<Creator | null>(null);
  const [dontRemindFindSimilarAgain, setDontRemindFindSimilarAgain] = useState(false);
  const [skipFindSimilarReminder, setSkipFindSimilarReminder] = useState(false);
  const [showFindSimilarReminder, setShowFindSimilarReminder] = useState(false);
  const [showFindSimilarModeModal, setShowFindSimilarModeModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    ...EMPTY_DISCOVERY_FILTERS,
    region: regionDefault,
  });
  const [resultsRefreshKey, setResultsRefreshKey] = useState(0);
  const { openCreatorProfile } = useCreatorProfile();
  const anchorCreator = anchor
    ? MOCK_CREATORS.find((creator) => creator.id === anchor.id || creator.handle === anchor.handle)
    : null;

  useEffect(() => {
    setCreators(MOCK_CREATORS);
    setAnchor(initialAnchor ?? null);
    setActiveTab("pending");
    setPendingSimilarCreator(null);
    setShowFindSimilarReminder(false);
    setShowFindSimilarModeModal(false);
  }, [initialAnchor]);

  useEffect(() => {
    setFindSimilarMode(initialFindSimilarMode ?? "找相似");
  }, [initialFindSimilarMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSkipFindSimilarReminder(
      window.localStorage.getItem(FIND_SIMILAR_REMINDER_STORAGE_KEY) === "true"
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSkipExitReminder(
      window.localStorage.getItem(EXIT_SCREEN_REMINDER_STORAGE_KEY) === "true"
    );
  }, []);

  useEffect(() => {
    setFilterRegion(regionDefault);
    setAppliedFilters({
      ...EMPTY_DISCOVERY_FILTERS,
      region: regionDefault,
    });
  }, [regionDefault]);

  useEffect(() => {
    if (!shareOpen) return;
    const h = (e: MouseEvent) => { if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [shareOpen]);

  const handleResetDiscoveryState = () => {
    setFilterRegion("all");
    setFilterLanguage("all");
    setFilterFollowers("all");
    setFilterVerified("all");
    setFilterEmail("all");
    setAppliedFilters({ ...EMPTY_DISCOVERY_FILTERS });
    setPendingSimilarCreator(null);
    setShowExit(false);
    setDontRemindExitAgain(false);
    setDontRemindFindSimilarAgain(false);
    setShowFindSimilarReminder(false);
    setShowFindSimilarModeModal(false);
    setAnchor(null);
    setFindSimilarMode("找相似");
    setCreators(MOCK_CREATORS);
    setActiveTab("pending");
    setShareOpen(false);
    setResultsRefreshKey((prev) => prev + 1);
  };

  const updateStatus = (id: string, status: Creator["status"]) =>
    setCreators(prev => prev.map(c => c.id === id ? { ...c, status: c.status === status ? "pending" : status } : c));

  const applyFindSimilar = (creator: Creator, mode: FindSimilarMode) => {
    setFindSimilarMode(mode);
    setAnchor(buildAnchorFromCreator(creator));
    setCreators(buildCreatorResultsByMode(creator, mode));
    setActiveTab("pending");
    setResultsRefreshKey((prev) => prev + 1);
    setPendingSimilarCreator(null);
    setShowFindSimilarReminder(false);
    setShowFindSimilarModeModal(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnchorFindSimilar = () => {
    if (!anchor) return;
    const sourceCreator = anchorCreator ?? creators.find((creator) => creator.status === "pending") ?? creators[0] ?? MOCK_CREATORS[0];
    setFindSimilarMode("找相似");
    setCreators(buildCreatorResultsByMode(sourceCreator, "找相似"));
    setActiveTab("pending");
    setPendingSimilarCreator(null);
    setShowFindSimilarReminder(false);
    setShowFindSimilarModeModal(false);
    setResultsRefreshKey((prev) => prev + 1);
  };

  const handleFindSimilar = (creator: Creator) => {
    applyFindSimilar(creator, "找相似");
  };

  const handleConfirmFindSimilar = () => {
    if (!pendingSimilarCreator) return;
    if (dontRemindFindSimilarAgain && typeof window !== "undefined") {
      window.localStorage.setItem(FIND_SIMILAR_REMINDER_STORAGE_KEY, "true");
      setSkipFindSimilarReminder(true);
    }
    setShowFindSimilarReminder(false);
    setShowFindSimilarModeModal(true);
    setDontRemindFindSimilarAgain(false);
  };

  const handleCloseFindSimilarReminder = () => {
    setShowFindSimilarReminder(false);
    setShowFindSimilarModeModal(false);
    setPendingSimilarCreator(null);
    setDontRemindFindSimilarAgain(false);
  };

  const handleCloseFindSimilarModeModal = () => {
    setShowFindSimilarModeModal(false);
    setPendingSimilarCreator(null);
  };

  const handleExitAttempt = () => {
    if (skipExitReminder) {
      onBack();
      return;
    }
    setShowExit(true);
  };

  const handleCancelExit = () => {
    setShowExit(false);
    setDontRemindExitAgain(false);
  };

  const handleConfirmExit = () => {
    if (dontRemindExitAgain && typeof window !== "undefined") {
      window.localStorage.setItem(EXIT_SCREEN_REMINDER_STORAGE_KEY, "true");
      setSkipExitReminder(true);
    }
    setShowExit(false);
    setDontRemindExitAgain(false);
    onBack();
  };

  const creatorMatchesAppliedFilters = (creator: Creator) => {
    if (appliedFilters.region !== "all") {
      if (creator.region !== REGION_CODE_TO_FLAG[appliedFilters.region]) {
        return false;
      }
    }

    if (appliedFilters.language !== "all" && !creator.smartTags.includes(appliedFilters.language === "en" ? "英语" : appliedFilters.language === "zh" ? "中文" : appliedFilters.language === "ja" ? "日语" : appliedFilters.language === "ko" ? "韩语" : appliedFilters.language === "hi" ? "印地语" : appliedFilters.language === "pt" ? "葡萄牙语" : appliedFilters.language === "tr" ? "土耳其语" : appliedFilters.language)) {
      return false;
    }

    if (appliedFilters.verified === "yes" && !creator.verified) {
      return false;
    }
    if (appliedFilters.verified === "no" && creator.verified) {
      return false;
    }

    if (appliedFilters.email !== "all" && creator.email !== appliedFilters.email) {
      return false;
    }

    if (appliedFilters.followers !== "all") {
      const count = Number.parseFloat(creator.followers.replace("K", ""));
      if (appliedFilters.followers === "1k-10k" && !(count >= 1 && count < 10)) return false;
      if (appliedFilters.followers === "10k-100k" && !(count >= 10 && count < 100)) return false;
      if (appliedFilters.followers === "100k-500k" && !(count >= 100 && count < 500)) return false;
      if (appliedFilters.followers === "500k+" && !(count >= 500)) return false;
    }

    return true;
  };

  const filteredCreators = creators.filter(creatorMatchesAppliedFilters);
  const pending = filteredCreators.filter(c => c.status === "pending");
  const noList = filteredCreators.filter(c => c.status === "no");
  const saved = filteredCreators.filter(c => c.status === "saved");
  const visible = activeTab === "pending" ? pending : activeTab === "no" ? noList : saved;

  return (
    <div className="flex flex-col -mx-6 -my-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#e8e6dc] bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleExitAttempt} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#87867f] transition-colors hover:bg-[#f5f4ed] hover:text-[#141413]">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-0.5 rounded-xl border border-[#e8e6dc] bg-[#f5f4ed] p-0.5">
            {([["pending","待收藏",pending.length],["no","NO",noList.length],["saved","已收藏",saved.length]] as const).map(([tab, label, count]) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all", activeTab === tab ? "bg-white text-[#141413] shadow-sm" : "text-[#87867f] hover:text-[#4d4c48]")}>
                {tab === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", activeTab === tab ? "bg-[#f5f4ed] text-[#4d4c48]" : "bg-[#e8e6dc] text-[#87867f]")}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {anchor ? (
          <div className="flex min-w-[280px] flex-1 justify-center">
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#e8e6dc] bg-[linear-gradient(180deg,#ffffff_0%,#f5f4ed_100%)] px-4 py-2.5 text-center shadow-[0_14px_34px_-26px_rgba(77,76,72,0.32)]">
              <span className="text-sm font-medium text-[#5e5d59]">根据</span>
              <button type="button" onClick={() => openCreatorProfile({ name: anchor.name, handle: anchor.handle, avatarUrl: getAnchorAvatarUrl(anchor.avatarSeed), region: "🌐", followers: "--", er: "--" })} className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:ring-offset-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getAnchorAvatarUrl(anchor.avatarSeed)} alt={anchor.name} className="h-9 w-9 rounded-full border border-white bg-white object-cover shadow-sm" />
              </button>
              <button
                type="button"
                onClick={handleAnchorFindSimilar}
                className="inline-flex items-center justify-center rounded-full border border-[#f5d0a9] bg-[#fef3e8] px-3 py-1.5 text-sm font-semibold text-[#c96442] transition-all hover:border-[#e8b985] hover:bg-[#fdf0e8] active:scale-[0.98]"
              >
                找相似
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={shareRef}>
            <button type="button" onClick={() => setShareOpen(v => !v)} className="flex items-center gap-1.5 rounded-xl border border-[#e8e6dc] bg-white px-3 py-1.5 text-xs font-medium text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]">
              <Share2 className="h-3.5 w-3.5" />分享
            </button>
            {shareOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-40 rounded-xl border border-[#e8e6dc] bg-white py-1 shadow-[0_12px_32px_-8px_rgba(20,20,19,0.16)]">
                <button type="button" onClick={() => { setShareOpen(false); setShowExport(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]"><Download className="h-3.5 w-3.5" />导出博主表格</button>
              </div>
            )}
          </div>
          <button type="button" className="flex items-center gap-1.5 rounded-xl border border-[#e8e6dc] bg-white px-3 py-1.5 text-xs font-medium text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]"><Bookmark className="h-3.5 w-3.5" />批量操作</button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1">
        {/* Left filter sidebar */}
        <div className="w-52 shrink-0 border-r border-[#e8e6dc] bg-[#faf9f5] px-4 py-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-[#e8e6dc] bg-white p-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#87867f]">当前项目</p>
            <div className="mt-2 text-sm font-semibold text-[#141413]">{currentProject.name}</div>
            <p className="mt-1 text-xs leading-5 text-[#5e5d59]">
              {currentProject.productName} · {currentProject.category}
            </p>
            <div className="mt-2 space-y-1 text-[11px] text-[#87867f]">
              <p>{formatProjectTimeline(currentProject)}</p>
              <p>{formatProjectBudget(currentProject)}</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#87867f]">
              当前页里的收藏、No 标记、相似达人搜索都会自动归属到这个项目。
            </p>
            <button
              type="button"
              onClick={() => openEditProject(currentProject.id)}
              className="mt-3 w-full rounded-xl border border-dashed border-[#e8e6dc] px-3 py-2 text-xs text-[#4d4c48] transition-colors hover:border-[#c96442]/35 hover:text-[#c96442]"
            >
              编辑项目资料
            </button>
          </div>
          <div className="h-px bg-[#e8e6dc]" />
          <FilterSelect label="地区" value={filterRegion} onChange={setFilterRegion} opts={[["all","请选择地区"],["us","🇺🇸 美国"],["gb","🇬🇧 英国"],["in","🇮🇳 印度"],["jp","🇯🇵 日本"],["kr","🇰🇷 韩国"],["br","🇧🇷 巴西"],["tr","🇹🇷 土耳其"]]} />
          <FilterSelect label="语言" value={filterLanguage} onChange={setFilterLanguage} opts={[["all","请选择语言"],["en","英语"],["zh","中文"],["ja","日语"],["ko","韩语"],["hi","印地语"],["pt","葡萄牙语"],["tr","土耳其语"]]} />
          <FilterSelect label="粉丝数" value={filterFollowers} onChange={setFilterFollowers} opts={[["all","请选择粉丝数"],["1k-10k","1K-10K"],["10k-100k","10K-100K"],["100k-500k","100K-500K"],["500k+","500K+"]]} />
          <FilterSelect label="是否认证用户" value={filterVerified} onChange={setFilterVerified} opts={[["all","请选择是否认证用户"],["yes","是"],["no","否"]]} />
          <FilterSelect label="是否有邮箱" value={filterEmail} onChange={setFilterEmail} opts={[["all","请选择是否有邮箱"],["corporate","公司邮箱"],["personal","个人邮箱"],["risk","风险邮箱"],["none","无邮箱"]]} />
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={handleResetDiscoveryState} className="flex-1 rounded-xl border border-[#e8e6dc] bg-white py-2 text-xs font-medium text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]">重置</button>
            <button type="button" onClick={() => { setAppliedFilters({ region: filterRegion, language: filterLanguage, followers: filterFollowers, verified: filterVerified, email: filterEmail }); setResultsRefreshKey(prev => prev + 1); }} className="flex-1 rounded-xl bg-[#c96442] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d97757]">应用</button>
          </div>
        </div>

        {/* 2-column creator grid */}
        <div className="flex-1 px-5 py-5">
          <div className="mb-5 overflow-hidden rounded-[28px] border border-[#e8e6dc] bg-[linear-gradient(135deg,#ffffff_0%,#fff9f2_48%,#f5f4ed_100%)] shadow-[0_18px_60px_-38px_rgba(77,76,72,0.35)]">
            <div className="grid gap-4 p-5 xl:grid-cols-[1.25fr_0.75fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-2xl", discoveryMeta.iconBg)}>
                    <discoveryMeta.Icon className={cn("h-4.5 w-4.5", discoveryMeta.iconColor)} />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#87867f]">本次搜索依据</p>
                    <h2 className="text-lg font-semibold text-[#141413]">{discoveryMeta.title}</h2>
                  </div>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5e5d59]">{discoveryMeta.resultPromise}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["平台", platformLabel],
                    ["时间范围", discoveryMeta.basis.range],
                    ["分析内容", `${discoveryMeta.basis.posts} 条帖子`],
                    ["找到候选", `${discoveryMeta.basis.candidates} 位达人`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-[#efe8dc] bg-white/75 px-3 py-2">
                      <p className="text-[10px] font-medium text-[#87867f]">{label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#141413]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#efe8dc] bg-white/70 p-4">
                <p className="text-xs font-semibold text-[#4d4c48]">已默认过滤</p>
                <p className="mt-1 text-xs leading-5 text-[#87867f]">{discoveryMeta.basis.filtered}</p>
                <div className="mt-3 space-y-2">
                  {discoveryMeta.evidenceItems.map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-[#4d4c48]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c96442]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-[#e8e6dc] bg-white text-sm text-[#87867f]">
              {activeTab === "no" ? "暂无 No 的博主" : activeTab === "saved" ? "还没有收藏博主" : "所有博主已标记完成 🎉"}
            </div>
          ) : (
            <div key={resultsRefreshKey} className="grid gap-4 lg:grid-cols-2">
              {visible.map(c => (
                <CreatorCard
                  key={c.id}
                  creator={c}
                  currentFindSimilarMode={findSimilarMode}
                  discoveryMode={discoveryMode}
                  isQuickScreenContext={entrySource === "quick-screen"}
                  showFindSimilarReminder={showFindSimilarReminder && pendingSimilarCreator?.id === c.id}
                  dontRemindAgain={dontRemindFindSimilarAgain}
                  onNo={() => updateStatus(c.id, "no")}
                  onSave={() => updateStatus(c.id, "saved")}
                  onFindSimilar={() => handleFindSimilar(c)}
                  onConfirmFindSimilar={handleConfirmFindSimilar}
                  onCloseFindSimilarReminder={handleCloseFindSimilarReminder}
                  onDontRemindAgainChange={setDontRemindFindSimilarAgain}
                  onOpenProfile={() => openCreatorProfile(creatorToProfileInput(c))}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showExit && (
        <ExitConfirmModal
          dontRemindAgain={dontRemindExitAgain}
          onDontRemindAgainChange={setDontRemindExitAgain}
          onConfirm={handleConfirmExit}
          onCancel={handleCancelExit}
        />
      )}
      {showExport && <ExportModal savedCount={saved.length} totalCount={creators.length} onClose={() => setShowExport(false)} />}
      {showFindSimilarModeModal && pendingSimilarCreator ? (
        <FindSimilarModeModal
          creator={pendingSimilarCreator}
          currentMode={findSimilarMode}
          onSelect={(mode) => applyFindSimilar(pendingSimilarCreator, mode)}
          onClose={handleCloseFindSimilarModeModal}
        />
      ) : null}
    </div>
  );
}

// ── Product info shared sub-form ─────────────────────────────────────────────
type ProductInfo = {
  link: string;
  ogPreview: typeof MOCK_OG_PREVIEW | null;
  imagePreview: string | null;
  categoryL1: string | null;
  categoryL2: string | null;
  aiInferred: boolean;
};

function ProductInfoForm({ value, onChange }: { value: ProductInfo; onChange: (v: ProductInfo) => void }) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fetching, setFetching] = useState(false);

  const hasLink = value.link.trim().length > 0;
  const hasPreview = !!value.ogPreview;

  // Auto-fetch OG + AI-infer category on link input (800ms debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const raw = value.link.trim();
    if (!raw || !/^https?:\/\//.test(raw)) {
      if (value.ogPreview || value.aiInferred) {
        onChange({ ...value, ogPreview: null, aiInferred: false, categoryL1: value.aiInferred ? null : value.categoryL1, categoryL2: value.aiInferred ? null : value.categoryL2 });
      }
      return;
    }
    setFetching(true);
    debounceRef.current = setTimeout(() => {
      setFetching(false);
      onChange({
        ...value,
        ogPreview: MOCK_OG_PREVIEW,
        imagePreview: MOCK_OG_PREVIEW.image,
        categoryL1: MOCK_AI_CATEGORY.l1,
        categoryL2: MOCK_AI_CATEGORY.l2,
        aiInferred: true,
      });
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.link]);

  const l2Options = value.categoryL1 ? CATEGORIES.find(c => c.l1 === value.categoryL1)?.l2 ?? [] : [];

  return (
    <div className="space-y-4">
      {/* Product link */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">产品链接 <span className="text-[#87867f]">（优先）</span></label>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#e8e6dc] bg-white px-3 py-2.5 focus-within:border-[#c96442]/40">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-[#87867f]" />
            <input type="url" value={value.link}
              onChange={e => onChange({ ...value, link: e.target.value })}
              placeholder="https://..."
              className="flex-1 bg-transparent text-sm text-[#141413] placeholder:text-[#c8c7c3] focus:outline-none" />
            {fetching && (
              <span className="flex items-center gap-1 text-[10px] text-[#87867f]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c96442]" />抓取中
              </span>
            )}
          </div>
        </div>
        {/* OG preview card */}
        {hasPreview && value.ogPreview && (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.ogPreview.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#141413]">{value.ogPreview.title}</p>
              <p className="text-[11px] text-[#87867f]">{value.ogPreview.domain}</p>
            </div>
            <Check className="h-4 w-4 text-[#7a8a6a]" />
          </div>
        )}
      </div>

      {/* Manual upload (mutually exclusive with link) */}
      {!hasLink && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">或手动上传产品图片</label>
          <label htmlFor="product-upload"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#e8e6dc] bg-[#faf9f5] px-4 py-6 text-sm text-[#87867f] transition-colors hover:border-[#c96442]/40 hover:bg-[#fbf5ed] hover:text-[#c96442]">
            <Upload className="h-4 w-4" />
            <span>点击或拖拽图片到此处</span>
          </label>
          <input id="product-upload" type="file" accept="image/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                onChange({ ...value, imagePreview: url });
              }
            }} />
          {value.imagePreview && !value.ogPreview && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value.imagePreview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              <span className="text-sm text-[#141413]">已上传</span>
            </div>
          )}
        </div>
      )}

      {/* Category L1 / L2 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#4d4c48]">
            品类
            {value.aiInferred && (
              <span className="flex items-center gap-0.5 rounded-full bg-[#fbf5ed] px-1.5 py-0.5 text-[9px] font-medium text-[#c96442]">
                <Sparkles className="h-2.5 w-2.5" />AI 推断
              </span>
            )}
          </label>
          <select value={value.categoryL1 ?? ""}
            onChange={e => onChange({ ...value, categoryL1: e.target.value || null, categoryL2: null, aiInferred: false })}
            className="w-full rounded-xl border border-[#e8e6dc] bg-white px-3 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none">
            <option value="">请选择</option>
            {CATEGORIES.map(c => <option key={c.l1} value={c.l1}>{c.l1}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">子品类</label>
          <select value={value.categoryL2 ?? ""}
            disabled={!value.categoryL1}
            onChange={e => onChange({ ...value, categoryL2: e.target.value || null, aiInferred: false })}
            className="w-full rounded-xl border border-[#e8e6dc] bg-white px-3 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#faf9f5] disabled:text-[#b0aea6]">
            <option value="">请选择</option>
            {l2Options.map(l2 => <option key={l2} value={l2}>{l2}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Scenario Modal (two-step) & Viral Modal (single-step) shared shell ───────
type ModalVariant = "scenario" | "viral";

function DiscoveryModal({
  variant, onClose, onSubmit,
}: {
  variant: ModalVariant;
  onClose: () => void;
  onSubmit: (payload: { scenes: string[]; primaryGoal: string | null }) => void;
}) {
  const [product, setProduct] = useState<ProductInfo>({
    link: "", ogPreview: null, imagePreview: null,
    categoryL1: null, categoryL2: null, aiInferred: false,
  });
  const [primaryGoal, setPrimaryGoal]     = useState<string | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<string | null>(null);
  const [step, setStep]                   = useState<1 | 2>(1);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);

  const isScenario = variant === "scenario";

  const hasProduct = (product.link.trim().length > 0 && product.ogPreview) || !!product.imagePreview;
  const hasCategory = !!product.categoryL1 && !!product.categoryL2;
  const step1Ready = hasProduct && hasCategory && (isScenario ? !!primaryGoal : true);

  const toggleScene = (id: string) =>
    setSelectedScenes(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handlePrimary = () => {
    if (!step1Ready) return;
    if (isScenario) {
      setStep(2);
    } else {
      onSubmit({ scenes: [], primaryGoal: null });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#e8e6dc] bg-[#faf9f5] shadow-[0_32px_80px_-16px_rgba(20,20,19,0.35)]">
        {/* Header */}
        <div className="border-b border-[#e8e6dc] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                isScenario ? "bg-[#fbf5ed] text-[#c96442]" : "bg-[#f0ebdc] text-[#7a8a6a]"
              )}>
                {isScenario ? <Zap className="h-4.5 w-4.5" /> : <TrendingUp className="h-4.5 w-4.5" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#141413]">
                  {isScenario ? "按营销场景找" : "找爆款达人"}
                </h2>
                <p className="mt-0.5 text-xs text-[#87867f]">
                  {isScenario
                    ? "告诉我你的产品，AI 推荐最适合的内容场景和达人"
                    : "告诉我你的品类，AI 找最近内容最火的达人"}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#87867f] hover:bg-[#f5f4ed] hover:text-[#141413]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress indicator — scenario only, step 2+ */}
          {isScenario && (
            <div className="mt-4 flex items-center gap-2 text-[11px]">
              {[
                { n: 1, label: "产品信息" },
                { n: 2, label: "场景确认" },
                { n: 3, label: "达人结果" },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                    step >= s.n ? "bg-[#c96442] text-white"
                                : "bg-[#f0ece4] text-[#87867f]"
                  )}>
                    {step > s.n ? <Check className="h-3 w-3" /> : s.n}
                  </span>
                  <span className={cn(step >= s.n ? "font-medium text-[#141413]" : "text-[#87867f]")}>{s.label}</span>
                  {i < 2 && <span className="mx-1 text-[#c8c7c3]">→</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 ? (
            <div className="space-y-5">
              <ProductInfoForm value={product} onChange={setProduct} />

              {/* Scenario-only: primary + secondary goal */}
              {isScenario && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#4d4c48]">
                      主营销目标 <span className="text-[#c96442]">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {GOALS.map(g => {
                        const active = primaryGoal === g.id;
                        return (
                          <button key={g.id} type="button"
                            onClick={() => {
                              setPrimaryGoal(active ? null : g.id);
                              if (secondaryGoal === g.id) setSecondaryGoal(null);
                            }}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                              active
                                ? "border-[#c96442]/30 bg-[#fdf5f0] text-[#c96442] ring-2 ring-[#c96442]/15"
                                : "border-[#e8e6dc] bg-white text-[#4d4c48] hover:border-[#c96442]/30"
                            )}>
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {primaryGoal && (
                    <div>
                      <label className="mb-2 block text-xs font-medium text-[#4d4c48]">
                        次要目标 <span className="text-[#87867f]">（可选，最多 1 个）</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {GOALS.map(g => {
                          const isPrimary = primaryGoal === g.id;
                          const active = secondaryGoal === g.id;
                          return (
                            <button key={g.id} type="button"
                              disabled={isPrimary}
                              onClick={() => setSecondaryGoal(active ? null : g.id)}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                                isPrimary
                                  ? "cursor-not-allowed border-[#f0ece4] bg-[#f5f4ed] text-[#c8c7c3]"
                                  : active
                                    ? "border-[#c96442]/30 bg-[#fdf5f0] text-[#c96442]"
                                    : "border-[#e8e6dc] bg-white text-[#4d4c48] hover:border-[#c96442]/30"
                              )}>
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            // Step 2 — scenario only
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl bg-[#fbf5ed] px-3.5 py-2.5">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c96442]" />
                <p className="text-xs leading-relaxed text-[#4d4c48]">
                  AI 为你识别了以下内容场景，请选择你希望投放的方向<span className="text-[#87867f]">（支持多选）</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_SCENES.map(s => {
                  const active = selectedScenes.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => toggleScene(s.id)}
                      className={cn(
                        "relative flex flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5",
                        active
                          ? "border-[#c96442]/40 bg-[#fdf5f0] shadow-[0_0_0_2px_rgba(201,100,66,0.12)]"
                          : "border-[#e8e6dc] hover:shadow-[0_8px_24px_-12px_rgba(77,76,72,0.14)]"
                      )}>
                      <div className="flex w-full items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{s.icon}</span>
                          <span className={cn("text-sm font-semibold",
                            active ? "text-[#c96442]" : "text-[#141413]")}>
                            {s.name}
                          </span>
                        </div>
                        {active && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#c96442] text-white">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#87867f]">{s.type}</p>
                      <div className="mt-1 flex items-center gap-3 text-[11px]">
                        <span className="text-[#4d4c48]">达人数 <span className="font-medium">{s.creatorCount}</span></span>
                        <span className="text-[#4d4c48]">互动 <span className="font-medium">{s.avgEngagement}</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e8e6dc] bg-white px-6 py-4">
          <button type="button"
            onClick={() => (step === 2 ? setStep(1) : onClose())}
            className="rounded-xl border border-[#e8e6dc] bg-white px-4 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]">
            {step === 2 ? "← 返回修改" : "取消"}
          </button>
          {step === 1 ? (
            <button type="button" onClick={handlePrimary} disabled={!step1Ready}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-all",
                step1Ready
                  ? "bg-[#c96442] text-white hover:bg-[#d97757] active:scale-[0.97]"
                  : "cursor-not-allowed bg-[#f0ece4] text-[#b0aea6]"
              )}>
              开始匹配 →
            </button>
          ) : (
            <button type="button"
              onClick={() => onSubmit({ scenes: selectedScenes, primaryGoal })}
              disabled={selectedScenes.length === 0}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-all",
                selectedScenes.length > 0
                  ? "bg-[#c96442] text-white hover:bg-[#d97757] active:scale-[0.97]"
                  : "cursor-not-allowed bg-[#f0ece4] text-[#b0aea6]"
              )}>
              查看匹配达人 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Progressive loading indicator (Strategy Architect) ──────────────────────
type LoadingState = {
  variant: ModalVariant;
  step: 0 | 1 | 2 | 3;   // 0 = not started, 3 = done
};

function ProgressiveLoader({ state }: { state: LoadingState }) {
  const lines = state.variant === "scenario"
    ? ["产品信息解析完成", "正在匹配内容场景", "筛选最佳达人"]
    : ["品类识别完成",       "正在分析近期爆款内容", "筛选高潜达人"];
  return (
    <div className="space-y-2.5">
      {lines.map((line, i) => {
        const done = state.step > i;
        const active = state.step === i;
        return (
          <div key={line} className="flex items-center gap-2.5 text-sm">
            <span className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full",
              done    ? "bg-[#7a8a6a] text-white"
              : active ? "bg-[#fbf5ed] text-[#c96442]"
                       : "bg-[#f0ece4] text-[#c8c7c3]"
            )}>
              {done ? <Check className="h-3 w-3" />
                    : active ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c96442]" />
                             : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <span className={cn(
              done   ? "text-[#141413]"
              : active ? "font-medium text-[#c96442]"
                       : "text-[#b0aea6]"
            )}>
              {line}{active ? "…" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Quick-screen navigation helpers ───────────────────────────────────────────
type QuickScreenHrefInput = {
  platform: PlatformId;
  mode: ModeId;
  countries: string[];
  languages: string[];
  followersPreset: string | null;
  followersFrom: string;
  followersTo: string;
  viewsPreset: string | null;
  viewsFrom: string;
  viewsTo: string;
  applicationConditions: string[];
};

function buildQuickScreenHref(input: QuickScreenHrefInput): string {
  const params = new URLSearchParams();
  params.set("entry", "quick-screen");
  params.set("results", "1");
  params.set("platform", input.platform);
  params.set("mode", input.mode);
  if (input.countries.length) params.set("countries", input.countries.join("|"));
  if (input.languages.length) params.set("languages", input.languages.join("|"));
  if (input.followersPreset) params.set("fp", input.followersPreset);
  if (input.followersFrom) params.set("ff", input.followersFrom);
  if (input.followersTo) params.set("ft", input.followersTo);
  if (input.viewsPreset) params.set("vp", input.viewsPreset);
  if (input.viewsFrom) params.set("vf", input.viewsFrom);
  if (input.viewsTo) params.set("vt", input.viewsTo);
  if (input.applicationConditions.length) params.set("ac", input.applicationConditions.join("|"));
  return `/workspace/discovery?${params.toString()}`;
}

// ── Dimension preview card (thumbnail → jumps to quick-screen page) ───────────
interface DimensionPreviewCardProps {
  mode: ModeId;
  platformLabel: string;
  regionSummary: string;
  onOpen: () => void;
}

function DimensionPreviewCard({ mode, platformLabel, regionSummary, onOpen }: DimensionPreviewCardProps) {
  const meta = MODES.find(m => m.id === mode)!;
  const previewCreators = MOCK_CREATORS.slice(0, 3);
  const totalCount = mode === "competitor" ? 86 : mode === "scenario" ? 124 : 57;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-2xl border border-[#e8e6dc] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#c96442]/30 hover:shadow-[0_12px_32px_-16px_rgba(77,76,72,0.2)]"
    >
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", meta.iconBg)}>
        <meta.Icon className={cn("h-5 w-5", meta.iconColor)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#141413]">{meta.title}</span>
          <span className="rounded-full bg-[#f5f4ed] px-2 py-0.5 text-[10px] font-medium text-[#87867f]">
            {platformLabel} · {regionSummary}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#87867f]">
          已为你预筛 <span className="font-semibold text-[#141413]">{totalCount}</span> 位达人 · 点击进入快速筛选
        </p>
      </div>

      <div className="hidden items-center -space-x-2 sm:flex">
        {previewCreators.map(c => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c.id}
            src={`https://i.pravatar.cc/80?img=${c.avatarImg}`}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
            loading="lazy"
          />
        ))}
        <span className="ml-3 flex h-8 items-center rounded-full bg-[#f5f4ed] px-2.5 text-[11px] font-medium text-[#4d4c48]">
          +{totalCount - previewCreators.length}
        </span>
      </div>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c96442] text-white transition-transform group-hover:translate-x-0.5">
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
          <path d="M5.5 3.5L10 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

// ── Mock follow-up data (would be API-driven in prod) ────────────────────────
const MOCK_COMPETITOR_BRANDS: { id: string; name: string; logo: string }[] = [
  { id: "b1", name: "The Ordinary",    logo: "🧪" },
  { id: "b2", name: "Paula's Choice",  logo: "✨" },
  { id: "b3", name: "Drunk Elephant",  logo: "🐘" },
  { id: "b4", name: "La Roche-Posay",  logo: "💧" },
  { id: "b5", name: "CeraVe",          logo: "🛡️" },
  { id: "b6", name: "SkinCeuticals",   logo: "🧬" },
];

type ViralCriterion = "plays" | "engagement" | "growth";
const VIRAL_CRITERIA: { id: ViralCriterion; label: string; desc: string }[] = [
  { id: "growth",     label: "长期种草型",     desc: "持续输出真实体验和复购内容" },
  { id: "plays",      label: "测评说服型",     desc: "擅长把卖点拆开讲清楚" },
  { id: "engagement", label: "评论高信任型",   desc: "评论区问题多、互动质量高" },
];

const DISCOVERY_CATEGORIES = [
  { id: "beauty", label: "美妆护肤", hint: "护肤、彩妆、个护、香水" },
  { id: "tech", label: "3C 数码", hint: "耳机、配件、智能硬件" },
  { id: "home", label: "家居生活", hint: "收纳、清洁、小家电" },
  { id: "outdoor", label: "运动户外", hint: "露营、健身、骑行" },
  { id: "food", label: "食品饮料", hint: "零食、咖啡、健康食品" },
  { id: "pet", label: "母婴宠物", hint: "宠物清洁、母婴用品" },
] as const;

type DiscoveryCategoryId = (typeof DISCOVERY_CATEGORIES)[number]["id"];

const AGENT_GUIDE_CARDS: Record<ModeId, Array<{ id: string; title: string; desc: string; meta: string }>> = {
  competitor: [
    { id: "brand-evidence", title: "按合作证据强度优先", desc: "优先找出现 #ad、品牌 @、官网链接、折扣码的达人。", meta: "更适合想快速验证同行投放的人" },
    { id: "repeat-collab", title: "按重复投放品牌优先", desc: "找多次给同类品牌做内容的人，降低试错成本。", meta: "更适合长期建联池" },
  ],
  scenario: [
    { id: "routine-brief", title: "先拆内容场景", desc: "把产品卖点拆成 routine、测评、开箱、对比等拍法。", meta: "更适合新品或卖点复杂产品" },
    { id: "creator-format", title: "按达人擅长形式匹配", desc: "优先匹配擅长真人出镜、步骤教程、测评解释的达人。", meta: "更适合明确内容 brief 的项目" },
  ],
  viral: [
    { id: "review-trust", title: "按真实评论质量优先", desc: "看评论区问题密度、真实反馈和达人回复质量。", meta: "更适合口碑种草" },
    { id: "stable-seeding", title: "按稳定种草能力优先", desc: "不追单条爆款，优先找稳定讲产品、互动不水的达人。", meta: "更适合长期铺量" },
  ],
};

const PREVIEW_CREATORS = [
  { id: "pc1", name: "Sarah K Beauty", handle: "@sarakhbeauty", avatarImg: 9, score: 92, reason: "测评解释强，评论区询问购买渠道较多", proof: "近 30 天 4 条护肤测评，平均 ER 6.8%" },
  { id: "pc2", name: "GlowWithSun", handle: "@glowwithsun", avatarImg: 21, score: 89, reason: "GRWM 和 routine 场景自然，适合软种草", proof: "同类内容中位播放 42K，高于本人基线 1.4x" },
  { id: "pc3", name: "TechLifeJapan", handle: "@techlifejapan", avatarImg: 16, score: 86, reason: "3C 使用体验讲解清楚，受众垂直", proof: "近期 3 条配件测评收藏率高于同量级均值" },
  { id: "pc4", name: "BeautyBySelin", handle: "@beautybyselin", avatarImg: 48, score: 84, reason: "小语种市场互动质量好，可做区域测试", proof: "评论回复率高，邮箱可联系" },
];

// ── Warm welcome logo (replaces blue gradient, keeps Claude palette) ─────────
function DiscoveryWelcomeLogo() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full opacity-80"
        style={{
          background:
            "radial-gradient(closest-side, #f5d0a9 0%, #f0b48a 40%, #c96442 80%, transparent 100%)",
          filter: "blur(6px)",
        }}
      />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#f0d5c4] bg-[#faf9f5]">
        <Sparkles className="h-5 w-5 text-[#c96442]" />
      </div>
    </div>
  );
}

const FOLDER_EASE = [0.32, 0.72, 0, 1] as const;
const FOLDER_DURATION = 0.24;
const FOLDER_CORNER = 12;
const TAB_FRAME_COLOR = "#e9e2d5";
const TAB_PANEL_COLOR = "#fffdf9";

function DiscoveryModeTabs({
  value,
  onChange,
}: {
  value: ModeId | null;
  onChange: (mode: ModeId) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Map<ModeId, HTMLLabelElement>>(new Map());
  const [folder, setFolder] = useState<{ x: number; w: number; h: number } | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const activeMode = MODES.find((m) => m.id === value) ?? null;
  const activeIndex = activeMode ? MODES.findIndex((m) => m.id === activeMode.id) : -1;
  const activeAtLeftEdge = activeIndex === 0;
  const activeAtRightEdge = activeIndex === MODES.length - 1;

  const measure = () => {
    if (!activeMode) {
      setFolder(null);
      return;
    }
    const labelEl = labelRefs.current.get(activeMode.id);
    const containerEl = containerRef.current;
    if (!labelEl || !containerEl) return;
    const cRect = containerEl.getBoundingClientRect();
    const lRect = labelEl.getBoundingClientRect();
    setFolder({
      x: lRect.left - cRect.left,
      w: lRect.width,
      h: lRect.height,
    });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode?.id]);

  useEffect(() => {
    const handler = () => measure();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode?.id]);

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="选择达人发现方式"
      className="relative z-10 flex h-[44px] items-stretch overflow-x-auto overflow-y-visible px-[3px] pt-1 hide-scrollbar"
    >
      {/* Active tab folder body — warm white, merges into the composer below */}
      {activeMode && folder ? (
        <motion.span
          aria-hidden
          initial={false}
          animate={{ x: folder.x, width: folder.w }}
          onAnimationStart={() => setHasAnimated(true)}
          transition={
            hasAnimated
              ? { ease: FOLDER_EASE, duration: FOLDER_DURATION }
              : { duration: 0 }
          }
          className="pointer-events-none absolute bottom-0 left-0 top-0 z-0 rounded-t-[16px]"
          style={{
            backgroundColor: TAB_PANEL_COLOR,
            boxShadow: "0 1px 0 rgba(255,255,255,0.92)",
          }}
        >
          {/* Left concave corner */}
          {!activeAtLeftEdge ? (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0"
              style={{
                left: -FOLDER_CORNER,
                width: FOLDER_CORNER,
                height: FOLDER_CORNER,
                backgroundColor: TAB_FRAME_COLOR,
                borderBottomRightRadius: 999,
                boxShadow: `3px 3px 0 3px ${TAB_PANEL_COLOR}`,
              }}
            />
          ) : null}
          {/* Right concave corner */}
          {!activeAtRightEdge ? (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0"
              style={{
                right: -FOLDER_CORNER,
                width: FOLDER_CORNER,
                height: FOLDER_CORNER,
                backgroundColor: TAB_FRAME_COLOR,
                borderBottomLeftRadius: 999,
                boxShadow: `-3px 3px 0 3px ${TAB_PANEL_COLOR}`,
              }}
            />
          ) : null}
        </motion.span>
      ) : null}

      {MODES.map((item) => {
        const selected = value === item.id;

        return (
          <label
            key={item.id}
            ref={(el) => {
              if (el) labelRefs.current.set(item.id, el);
              else labelRefs.current.delete(item.id);
            }}
            className={cn(
              "group/tab relative z-10 flex shrink-0 items-center outline-none",
              selected ? "cursor-default" : "cursor-pointer"
            )}
          >
            <input
              type="radio"
              name="discovery-mode"
              value={item.id}
              checked={selected}
              onChange={() => onChange(item.id)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "relative z-10 flex items-center whitespace-nowrap px-4 text-[14px] leading-none transition-colors duration-150 sm:text-[15px]",
                "peer-focus-visible:rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-[#c96442]/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#f5f4ed]",
                selected
                  ? "font-semibold"
                  : "font-medium text-[#87867f] group-hover/tab:text-[#4d4c48]"
              )}
              style={selected ? { color: item.accent } : undefined}
            >
              {item.title}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ── Platform pill (inside the composer) ──────────────────────────────────────
function PlatformPill({ id, selected, onClick }: { id: PlatformId; selected: boolean; onClick: () => void }) {
  const Icon = id === "tiktok" ? TikTokIcon : id === "instagram" ? InstagramIcon : YoutubeIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex h-8 w-9 items-center justify-center rounded-full transition-colors",
        selected ? "text-[#c96442]" : "text-[#87867f] hover:text-[#4d4c48]"
      )}
      aria-pressed={selected}
      aria-label={PLATFORMS.find(p => p.id === id)?.label ?? id}
      title={PLATFORMS.find(p => p.id === id)?.label ?? id}
    >
      {selected ? (
        <motion.span
          layoutId="platform-pill-active-bg"
          transition={{ type: "spring", stiffness: 560, damping: 36, mass: 0.6 }}
          className="absolute inset-0 rounded-full bg-[#fdf5f0]"
        />
      ) : null}
      <span className={cn("relative z-10 flex h-5 w-5 items-center justify-center", !selected && "text-[#87867f]")}>
        <Icon colored={selected} />
      </span>
    </button>
  );
}

// ── Filter chip (inside the composer) ────────────────────────────────────────
type ChipId = "geo" | "applications" | "followers" | "views";

function FilterChip({
  id,
  icon: Icon,
  prefix,
  label,
  active,
  open,
  count,
  onClick,
}: {
  id: ChipId;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  prefix: string;
  label: string;
  active: boolean;
  open: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      data-chip={id}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] transition-all duration-150 active:scale-[0.97]",
        open
          ? "border-[#c96442]/55 bg-[#fdf5f0] text-[#c96442] shadow-[0_0_0_3px_rgba(201,100,66,0.08)]"
          : active
            ? "border-[#f0d5c4] bg-[#fdf5f0] text-[#c96442] hover:border-[#c96442]/45"
            : "border-[#e8e6dc] bg-[#FFFFFF] text-[#4d4c48] hover:border-[#d1cfc5] hover:text-[#141413]"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", open || active ? "text-[#c96442]" : "text-[#87867f] group-hover:text-[#4d4c48]")} strokeWidth={2.2} />
      <span className="text-[11px] font-semibold tracking-wide text-[#87867f] group-hover:text-[#4d4c48]">{prefix}</span>
      <span className="font-medium">{label}</span>
      {typeof count === "number" && count > 0 ? (
        <span className={cn(
          "ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
          open || active ? "bg-[#c96442] text-white" : "bg-[#f0ece4] text-[#4d4c48]"
        )}>
          {count}
        </span>
      ) : null}
      <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
    </button>
  );
}

// ── Composite panels (matched to the 3 footer chips) ─────────────────────────
function GeoPanel({
  countries, languages, onCountriesChange, onLanguagesChange,
}: {
  countries: string[];
  languages: string[];
  onCountriesChange: (v: string[]) => void;
  onLanguagesChange: (v: string[]) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#87867f]">国家 / 地区</span>
          {countries.length > 0 ? (
            <button type="button" onClick={() => onCountriesChange([])} className="text-[10px] text-[#c96442] hover:underline">清空</button>
          ) : null}
        </div>
        <div className="rounded-2xl border border-[#efe8dc] bg-white p-2">
          <RegionPanel selected={countries} onChange={onCountriesChange} />
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#87867f]">内容语言</span>
          {languages.length > 0 ? (
            <button type="button" onClick={() => onLanguagesChange([])} className="text-[10px] text-[#c96442] hover:underline">清空</button>
          ) : null}
        </div>
        <div className="rounded-2xl border border-[#efe8dc] bg-white p-2">
          <LanguagePanel selected={languages} onChange={onLanguagesChange} />
        </div>
      </div>
    </div>
  );
}

function ApplicationsPanel({
  selected, onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-5 text-[#87867f]">
        勾选你能接受的合作形式，Agent 会过滤掉不匹配的达人，避免无效建联。
      </p>
      <div className="flex flex-wrap gap-2">
        {APPLICATION_CONDITIONS.map(cond => {
          const picked = selected.includes(cond.id);
          return (
            <button
              key={cond.id}
              type="button"
              onClick={() => toggle(cond.id)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all",
                picked
                  ? "border-[#c96442]/45 bg-[#fdf5f0] shadow-[0_0_0_2px_rgba(201,100,66,0.1)]"
                  : "border-[#e8e6dc] bg-white hover:border-[#d1cfc5] hover:bg-[#faf9f5]"
              )}
            >
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                picked ? "border-[#c96442] bg-[#c96442] text-white" : "border-[#d8d5cb] bg-white text-transparent"
              )}>
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <div className="flex flex-col leading-tight">
                <span className={cn("text-[13px] font-medium", picked ? "text-[#c96442]" : "text-[#141413]")}>{cond.label}</span>
                <span className="mt-0.5 text-[10px] text-[#87867f]">{cond.hint}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AudiencePanel({
  followersPreset, followersFrom, followersTo, onFollowersPreset, onFollowersFrom, onFollowersTo,
  viewsPreset, viewsFrom, viewsTo, onViewsPreset, onViewsFrom, onViewsTo,
}: {
  followersPreset: string | null;
  followersFrom: string;
  followersTo: string;
  onFollowersPreset: (v: string | null) => void;
  onFollowersFrom: (v: string) => void;
  onFollowersTo: (v: string) => void;
  viewsPreset: string | null;
  viewsFrom: string;
  viewsTo: string;
  onViewsPreset: (v: string | null) => void;
  onViewsFrom: (v: string) => void;
  onViewsTo: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <UsersRound className="h-3.5 w-3.5 text-[#87867f]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#87867f]">粉丝量</span>
        </div>
        <div className="rounded-2xl border border-[#efe8dc] bg-white p-3">
          <RangePanel presets={FOLLOWER_STEPS.slice(1).map(s => s.value as string)} preset={followersPreset} from={followersFrom} to={followersTo} onPreset={onFollowersPreset} onFrom={onFollowersFrom} onTo={onFollowersTo} />
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-[#87867f]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#87867f]">平均播放量</span>
        </div>
        <div className="rounded-2xl border border-[#efe8dc] bg-white p-3">
          <RangePanel presets={VIEW_STEPS.slice(1).map(s => s.value as string)} preset={viewsPreset} from={viewsFrom} to={viewsTo} onPreset={onViewsPreset} onFrom={onViewsFrom} onTo={onViewsTo} />
        </div>
      </div>
    </div>
  );
}

// ── Scenario card (single-select, replaces CommandButton pattern) ────────────
interface ScenarioCardProps {
  mode: (typeof MODES)[number];
  selected: boolean;
  onPick: () => void;
}

function ScenarioCard({ mode, selected, onPick }: ScenarioCardProps) {
  const Icon = mode.Icon;
  return (
    <motion.button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative min-h-[210px] overflow-hidden rounded-[26px] border p-5 text-left transition-all",
        selected
          ? "border-[#c96442]/45 bg-[#fff8f1] shadow-[0_16px_40px_-30px_rgba(201,100,66,0.5)]"
          : "border-[#e8e6dc] bg-white/88 hover:border-[#d8cfc0] hover:shadow-[0_16px_38px_-30px_rgba(77,76,72,0.34)]"
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#c96442]/[0.06] transition-transform group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", mode.iconBg)}>
          <Icon className={cn("h-5 w-5", mode.iconColor)} />
        </div>
        {selected ? (
          <span className="rounded-full bg-[#c96442] px-2.5 py-1 text-[10px] font-semibold text-white">已选择</span>
        ) : (
          <span className="rounded-full border border-[#e8e6dc] bg-white px-2.5 py-1 text-[10px] font-medium text-[#87867f]">入口</span>
        )}
      </div>
      <div className="relative mt-4">
        <p className={cn("text-[16px] font-semibold", selected ? "text-[#c96442]" : "text-[#141413]")}>{mode.title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#87867f]">{mode.desc}</p>
        <div className="mt-4 rounded-2xl border border-[#efe8dc] bg-white/72 p-3">
          <p className="text-[11px] font-semibold text-[#4d4c48]">{mode.question}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#87867f]">{mode.strategy}</p>
        </div>
      </div>
    </motion.button>
  );
}

// ── Follow-up panels — appear only after a scenario is picked ────────────────
function CompetitorFollowUp({
  query,
  value,
  onQueryChange,
  onChange,
}: {
  query: string;
  value: string[];
  onQueryChange: (v: string) => void;
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div className="rounded-[26px] border border-[#e8e6dc] bg-[#fffdf9] p-4">
      <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#87867f]">
            <Sparkles className="h-3 w-3 text-[#c96442]" />
            <span className="font-semibold uppercase tracking-wider">AI 推断 · 同品类竞品</span>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[#4d4c48]">
            输入竞品品牌 / 官网 / 社媒账号，或从推荐竞品中选择。系统会优先找「有合作证据」且合作帖表现好的达人。
          </p>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="例如：CeraVe、Rhode、Glow Recipe…"
            className="mt-3 w-full rounded-2xl border border-[#e8e6dc] bg-white px-3 py-2.5 text-sm text-[#141413] outline-none transition-colors placeholder:text-[#b0aea5] focus:border-[#c96442]/40"
          />
        </div>
        <div className="flex flex-wrap content-start gap-2">
        {MOCK_COMPETITOR_BRANDS.map(b => {
          const picked = value.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(b.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                picked
                  ? "border-[#c96442] bg-white text-[#c96442]"
                  : "border-[#e8e6dc] bg-white text-[#4d4c48] hover:border-[#d1cfc5]"
              )}
            >
              <span>{b.logo}</span>
              <span>{b.name}</span>
              {picked && <Check className="h-3 w-3" />}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}

function ScenarioFollowUp({ value, onToggle }: { value: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="rounded-[26px] border border-[#e8e6dc] bg-[#fffdf9] p-4">
      <div className="flex items-center gap-2 text-[11px] text-[#87867f]">
        <Sparkles className="h-3 w-3 text-[#c96442]" />
        <span className="font-semibold uppercase tracking-wider">AI 推断 · 内容场景</span>
      </div>
      <p className="mt-1 text-[13px] text-[#4d4c48]">先选 1-3 个场景。结果会按「场景匹配度 + 该场景内容表现」排序，而不是只按品类标签。</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {MOCK_SCENES.map(s => {
          const picked = value.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.id)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-3 text-left transition-all",
                picked
                  ? "border-[#c96442] bg-white shadow-[0_0_0_2px_rgba(201,100,66,0.08)]"
                  : "border-[#e8e6dc] bg-white hover:border-[#d1cfc5]"
              )}
            >
              <span className="text-xl">{s.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-[13px] font-semibold", picked ? "text-[#c96442]" : "text-[#141413]")}>{s.name}</p>
                <p className="text-[11px] text-[#87867f]">{s.type} · {s.format}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#5e5d59]">{s.reason}</p>
                <p className="mt-1 text-[11px] text-[#87867f]">
                  约 <span className="font-medium text-[#4d4c48]">{s.creatorCount}</span> 位达人 · 平均 ER{" "}
                  <span className="font-medium text-[#4d4c48]">{s.avgEngagement}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViralFollowUp({ value, onPick }: { value: ViralCriterion | null; onPick: (id: ViralCriterion) => void }) {
  return (
    <div className="rounded-[26px] border border-[#e8e6dc] bg-[#fffdf9] p-4">
      <div className="flex items-center gap-2 text-[11px] text-[#87867f]">
        <TrendingUp className="h-3 w-3 text-[#c96442]" />
        <span className="font-semibold uppercase tracking-wider">爆款口径</span>
      </div>
      <p className="mt-1 text-[13px] text-[#4d4c48]">先告诉我你想要的「爆」是哪一种。系统会同时看本人历史基线和同类账号基线。</p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {VIRAL_CRITERIA.map(c => {
          const picked = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                picked
                  ? "border-[#c96442] bg-white shadow-[0_0_0_2px_rgba(201,100,66,0.08)]"
                  : "border-[#e8e6dc] bg-white hover:border-[#d1cfc5]"
              )}
            >
              <p className={cn("text-[13px] font-semibold", picked ? "text-[#c96442]" : "text-[#141413]")}>{c.label}</p>
              <p className="text-[11px] text-[#87867f]">{c.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Conversation flow (after send) ───────────────────────────────────────────
type ConversationFlowProps = {
  productName: string;
  category: string | null;
  platformLabel: string;
  activeMode: (typeof MODES)[number];
  countries: string[];
  languages: string[];
  applicationConditions: string[];
  followersText: string;
  viewsText: string;
  agentChoices: Array<{ id: string; title: string; desc: string; meta: string }>;
  selectedAgentChoice: string | null;
  onPickChoice: (id: string) => void;
  onPreview: () => void;
};

function ConversationFlow({
  productName,
  category,
  platformLabel,
  activeMode,
  countries,
  languages,
  applicationConditions,
  followersText,
  viewsText,
  agentChoices,
  selectedAgentChoice,
  onPickChoice,
  onPreview,
}: ConversationFlowProps) {
  const ModeIcon = activeMode.Icon;
  const userChips: string[] = [
    `场景：${activeMode.title}`,
    `平台：${platformLabel}`,
  ];
  if (category) userChips.unshift(`品类：${category}`);
  if (countries.length > 0) {
    userChips.push(`国家：${countries.length > 2 ? `${countries[0]} +${countries.length - 1}` : countries.join("、")}`);
  }
  if (languages.length > 0) {
    userChips.push(`语言：${languages.length > 1 ? `${languages[0]} +${languages.length - 1}` : languages[0]}`);
  }
  if (applicationConditions.length > 0) {
    const labels = applicationConditions
      .map(id => APPLICATION_CONDITIONS.find(c => c.id === id)?.label)
      .filter(Boolean);
    if (labels.length > 0) userChips.push(`申请：${labels.length > 1 ? `${labels[0]} +${labels.length - 1}` : labels[0]}`);
  }
  if (followersText) userChips.push(`粉丝：${followersText}`);
  if (viewsText) userChips.push(`播放：${viewsText}`);

  return (
    <motion.div
      key="conversation"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
      className="mb-3 flex flex-col gap-4 pt-4"
    >
      {/* User message bubble */}
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[22px] rounded-tr-md border border-[#e8e6dc] bg-[#fffdf9] px-4 py-3 text-[15px] leading-7 text-[#141413] shadow-[0_10px_30px_-26px_rgba(77,76,72,0.45)]">
          <p className="whitespace-pre-wrap break-words">{productName.trim()}</p>
          {userChips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {userChips.map(chip => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-[#f0ece4] bg-[#faf9f5] px-2.5 py-0.5 text-[11px] font-medium text-[#5e5d59]"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* AI message */}
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#f0d5c4]"
          style={{ background: "radial-gradient(closest-side, #f5d0a9 0%, #f0b48a 60%, #c96442 110%)" }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="rounded-[22px] rounded-tl-md border border-[#eee8dc] bg-[#fffdf9] px-4 py-3 text-[15px] leading-7 text-[#141413] shadow-[0_10px_30px_-28px_rgba(77,76,72,0.4)]">
            <div className="mb-1.5 flex items-center gap-2">
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", activeMode.iconBg)}>
                <ModeIcon className={cn("h-3.5 w-3.5", activeMode.iconColor)} strokeWidth={2.4} />
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#87867f]">Linkr Agent</span>
            </div>
            <p>
              收到。我会按「<span className="font-semibold" style={{ color: activeMode.accent }}>{activeMode.title}</span>
              」的思路展开。先选一个排序偏好，我会按它生成第一批达人缩略卡。
            </p>
          </div>

          {/* Inline option cards (chat card element) */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {agentChoices.map(choice => {
              const selected = selectedAgentChoice === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => onPickChoice(choice.id)}
                  className={cn(
                    "group/choice relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200",
                    selected
                      ? "border-[#c96442] bg-[#fffaf3] shadow-[0_14px_34px_-26px_rgba(201,100,66,0.6)]"
                      : "border-[#eee8dc] bg-[#fffdf9] hover:-translate-y-0.5 hover:border-[#d8cfc0] hover:shadow-[0_14px_34px_-30px_rgba(77,76,72,0.4)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#141413]">{choice.title}</p>
                    {selected ? (
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: activeMode.accent }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#5e5d59]">{choice.desc}</p>
                  <p className="mt-2 text-[11px] font-medium" style={{ color: activeMode.accent }}>{choice.meta}</p>
                </button>
              );
            })}
          </div>

          <div>
            <button
              type="button"
              onClick={onPreview}
              disabled={!selectedAgentChoice}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                selectedAgentChoice
                  ? "bg-[#c96442] text-white shadow-[0_10px_24px_-14px_rgba(201,100,66,0.6)] hover:bg-[#d97757] active:scale-[0.98]"
                  : "cursor-not-allowed bg-[#f0ece4] text-[#b0aea5]"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              生成达人缩略卡片
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Discovery page (Agent composer) ──────────────────────────────────────────
function DiscoveryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Composer basics (filled before send)
  const [category, setCategory] = useState<DiscoveryCategoryId | null>("beauty");
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState<PlatformId>("tiktok");
  const [countries, setCountries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [followersPreset, setFollowersPreset] = useState<string | null>(null);
  const [followersFrom, setFollowersFrom] = useState("");
  const [followersTo, setFollowersTo] = useState("");
  const [viewsPreset, setViewsPreset] = useState<string | null>(null);
  const [viewsFrom, setViewsFrom] = useState("");
  const [viewsTo, setViewsTo] = useState("");
  const [applicationConditions, setApplicationConditions] = useState<string[]>([]);
  const [openChip, setOpenChip] = useState<ChipId | null>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  // Scenario selection + follow-up answers
  const [mode, setMode] = useState<ModeId | null>("competitor");
  const [competitorQuery, setCompetitorQuery] = useState("");
  const [competitorBrands, setCompetitorBrands] = useState<string[]>([]);
  const [scenePicks, setScenePicks] = useState<string[]>([]);
  const [viralCriterion, setViralCriterion] = useState<ViralCriterion | null>(null);
  const [agentStarted, setAgentStarted] = useState(false);
  const [selectedAgentChoice, setSelectedAgentChoice] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);

  // Deeplink / results-view short-circuit (unchanged)
  const [searched, setSearched] = useState(false);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [initialAnchor, setInitialAnchor] = useState<DiscoveryAnchor | null>(null);
  const [initialFindSimilarMode, setInitialFindSimilarMode] = useState<FindSimilarMode>("找相似");
  const [initialEntrySource, setInitialEntrySource] = useState<DiscoveryEntrySource>(null);

  useEffect(() => {
    if (hydratedFromUrl) return;
    const wantResults =
      searchParams.get("results") === "1" || searchParams.get("entry") === "seed-finder";
    if (!wantResults) {
      setHydratedFromUrl(true);
      return;
    }

    const platformParam = searchParams.get("platform");
    if (platformParam === "tiktok" || platformParam === "instagram" || platformParam === "youtube") {
      setPlatform(platformParam);
    }

    const modeParam = searchParams.get("mode");
    const entryParam = searchParams.get("entry");
    if (modeParam === "competitor" || modeParam === "scenario" || modeParam === "viral") {
      setMode(modeParam);
    } else if (entryParam === "seed-finder") {
      setMode("viral");
    }

    setInitialEntrySource(
      entryParam === "quick-screen" || entryParam === "seed-finder" ? entryParam : null
    );
    setInitialFindSimilarMode(entryParam === "seed-finder" ? "找种子达人" : "找相似");

    const countriesRaw = searchParams.get("countries");
    if (countriesRaw) setCountries(countriesRaw.split("|").map(s => s.trim()).filter(Boolean));
    const languagesRaw = searchParams.get("languages");
    if (languagesRaw) setLanguages(languagesRaw.split("|").map(s => s.trim()).filter(Boolean));

    const fp = searchParams.get("fp");
    if (fp) setFollowersPreset(fp);
    const ff = searchParams.get("ff");
    const ft = searchParams.get("ft");
    if (ff) setFollowersFrom(ff);
    if (ft) setFollowersTo(ft);
    const vp = searchParams.get("vp");
    if (vp) setViewsPreset(vp);
    const vf = searchParams.get("vf");
    const vt = searchParams.get("vt");
    if (vf) setViewsFrom(vf);
    if (vt) setViewsTo(vt);
    const acRaw = searchParams.get("ac");
    if (acRaw) setApplicationConditions(acRaw.split("|").map(s => s.trim()).filter(Boolean));

    const seedHandleRaw = searchParams.get("seedHandle");
    const seedName = searchParams.get("seedName");
    const seedId = searchParams.get("seedId") ?? searchParams.get("creator");
    const seedAvatarSeed = searchParams.get("seedAvatarSeed") ?? seedId ?? seedHandleRaw ?? seedName;
    if (seedHandleRaw || seedName) {
      const normalizedHandle = normalizeHandle(seedHandleRaw ?? seedName ?? "");
      setInitialAnchor({
        id: seedId ?? normalizedHandle.replace(/^@/, ""),
        handle: normalizedHandle,
        name: seedName ?? buildAnchorNameFromHandle(normalizedHandle),
        avatarSeed: seedAvatarSeed ?? normalizedHandle,
      });
    } else {
      setInitialAnchor(null);
    }

    setSearched(true);
    setHydratedFromUrl(true);
  }, [hydratedFromUrl, searchParams]);

  // Close composer expanders on outside click.
  const composerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openChip && !categoryMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) {
        setOpenChip(null);
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [categoryMenuOpen, openChip]);

  // Deeplink → ResultsView (unchanged)
  if (searched) {
    const countryToRegionCode: Record<string, string> = {
      美国: "us", 英国: "gb", 印度: "in", 日本: "jp", 韩国: "kr", 巴西: "br", 土耳其: "tr",
    };
    const initialRegionFromPlugin = countries.map(c => countryToRegionCode[c]).find(Boolean) ?? null;
    return (
      <ResultsView
        onBack={() => { setSearched(false); setInitialAnchor(null); }}
        initialAnchor={initialAnchor}
        initialFindSimilarMode={initialFindSimilarMode}
        initialRegionCode={initialRegionFromPlugin}
        initialDiscoveryMode={mode}
        initialPlatform={platform}
        entrySource={initialEntrySource}
      />
    );
  }

  // Single-select: always replace (no toggle-off). Reset the follow-up when switching.
  const handlePickMode = (m: ModeId) => {
    if (mode === m) return;
    setMode(m);
    setAgentStarted(false);
    setPreviewOpen(false);
    setSelectedAgentChoice(null);
    setCompetitorQuery("");
    setCompetitorBrands([]);
    setScenePicks([]);
    setViralCriterion(null);
  };

  const toggleScenePick = (id: string) => {
    setScenePicks(prev => prev.includes(id) ? prev.filter(sceneId => sceneId !== id) : [...prev, id]);
  };

  const basicsFilled = !!category && productName.trim().length > 0;
  const canSend = basicsFilled && mode !== null;
  const activeMode = mode ? getModeMeta(mode) : null;

  const missingHint =
    !category                       ? "先选品类"
    : productName.trim().length === 0 ? "填写具体产品信息"
    : mode === null                 ? "选择筛选思路"
    : "";

  const handleSend = () => {
    if (!canSend || !mode) return;
    setSelectedAgentChoice(AGENT_GUIDE_CARDS[mode][0]?.id ?? null);
    setAgentStarted(true);
  };

  // Derived chip labels — grouped to match the three footer chips
  const followersText = followersPreset ?? (followersFrom || followersTo ? `${followersFrom || "0"}–${followersTo || "∞"}` : "");
  const viewsText     = viewsPreset     ?? (viewsFrom     || viewsTo     ? `${viewsFrom     || "0"}–${viewsTo     || "∞"}` : "");

  const geoLabel = (() => {
    if (countries.length === 0 && languages.length === 0) return "全球 · 任意语言";
    const c = countries.length === 0 ? "全球" : countries.length > 2 ? `${countries[0]} +${countries.length - 1}` : countries.join("、");
    const l = languages.length === 0 ? "任意语言" : languages.length > 1 ? `${languages[0]} +${languages.length - 1}` : languages[0];
    return `${c} · ${l}`;
  })();
  const applicationsLabel = applicationConditions.length === 0
    ? "未限制"
    : applicationConditions.length === 1
      ? APPLICATION_CONDITIONS.find(c => c.id === applicationConditions[0])?.label ?? "已选 1"
      : `已选 ${applicationConditions.length} 项`;
  const followersLabel = followersPreset ?? "不限";
  const viewsLabel     = viewsPreset ?? "不限";

  const hasGeo = countries.length > 0 || languages.length > 0;
  const hasApplications = applicationConditions.length > 0;
  const hasFollowers = !!followersPreset;
  const hasViews     = !!viewsPreset;
  const geoCount = countries.length + languages.length;
  const applicationsCount = applicationConditions.length;
  const selectedCategory = DISCOVERY_CATEGORIES.find(item => item.id === category);
  const agentChoices = mode ? AGENT_GUIDE_CARDS[mode] : [];
  const ModeIcon = activeMode?.Icon;

  const openQuickScreen = () => {
    if (!mode) return;
    router.push(buildQuickScreenHref({
      platform, mode, countries, languages,
      followersPreset, followersFrom, followersTo,
      viewsPreset, viewsFrom, viewsTo,
      applicationConditions,
    }));
  };

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-80px)] overflow-hidden bg-[#f5f4ed] px-4 py-8 text-[#141413] sm:px-8">
      <div aria-hidden className="pointer-events-none absolute -left-36 top-16 h-72 w-72 rounded-full bg-[#f0b48a]/18 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-[-120px] top-24 h-80 w-80 rounded-full bg-[#d8cfc0]/35 blur-3xl" />
      <div
        className={cn(
          "relative mx-auto flex min-h-[calc(100vh-150px)] w-full max-w-3xl flex-col py-8",
          agentStarted ? "justify-end" : "justify-center"
        )}
      >
        <AnimatePresence initial={false}>
          {agentStarted && mode && activeMode ? (
            <ConversationFlow
              key="conversation"
              productName={productName}
              category={selectedCategory?.label ?? null}
              platformLabel={getPlatformLabel(platform)}
              activeMode={activeMode}
              countries={countries}
              languages={languages}
              applicationConditions={applicationConditions}
              followersText={followersText}
              viewsText={viewsText}
              agentChoices={agentChoices}
              selectedAgentChoice={selectedAgentChoice}
              onPickChoice={setSelectedAgentChoice}
              onPreview={() => setPreviewOpen(true)}
            />
          ) : null}
        </AnimatePresence>

        <motion.section
          layout
          transition={{ type: "spring", stiffness: 240, damping: 30, mass: 0.9 }}
          ref={composerRef}
          className={cn("relative w-full", agentStarted ? "mt-2" : "mt-10")}
        >
          <div
            className={cn(
              "group/composer relative z-10 overflow-hidden rounded-[30px] border border-[#e2dbcf] bg-[#e9e2d5] p-[3px] transition-all duration-300",
              "shadow-[0_1px_2px_rgba(20,20,19,0.04),0_18px_60px_-44px_rgba(77,76,72,0.48)]",
              "hover:shadow-[0_1px_2px_rgba(20,20,19,0.06),0_24px_80px_-44px_rgba(77,76,72,0.55)]",
              "focus-within:shadow-[0_0_0_3px_rgba(201,100,66,0.08),0_24px_80px_-40px_rgba(77,76,72,0.55)]"
            )}
          >
            <DiscoveryModeTabs value={mode} onChange={handlePickMode} />

            <div className={cn("relative rounded-[24px] bg-[#fffdf9]", activeMode && "-mt-px")}>
              {/* ── Input area ───────────────────────────────────────────── */}
              <div className="px-5 pb-1 pt-2">
                <textarea
                  value={productName}
                  onChange={(event) => {
                    setProductName(event.target.value);
                    setAgentStarted(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    activeMode?.inputPlaceholder
                    ?? "粘贴产品链接、写品类关键词，或直接说要找哪类博主…"
                  }
                  className="min-h-[68px] w-full resize-none bg-transparent text-[16px] leading-7 text-[#141413] outline-none placeholder:text-[#b0aea5] antialiased"
                />
              </div>

              {/* ── Toolbar row 1: context (品类 + platform) + send ──────── */}
              <div className="flex items-center justify-between gap-3 px-3 pb-1 pt-0.5">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-[#87867f]">
                  {/* 平台 segmented pills (preserved) */}
                  <div className="hidden items-center gap-0.5 rounded-full bg-[#f0ece4] p-0.5 sm:inline-flex">
                    {PLATFORMS.map(p => (
                      <PlatformPill key={p.id} id={p.id} selected={platform === p.id} onClick={() => setPlatform(p.id)} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FilterChip
                      id="geo"
                      icon={Globe2}
                      prefix="国/语"
                      label={geoLabel}
                      active={hasGeo}
                      open={openChip === "geo"}
                      count={geoCount}
                      onClick={() => { setCategoryMenuOpen(false); setOpenChip(prev => prev === "geo" ? null : "geo"); }}
                    />
                    <FilterChip
                      id="followers"
                      icon={UsersRound}
                      prefix="粉丝"
                      label={followersLabel}
                      active={hasFollowers}
                      open={openChip === "followers"}
                      onClick={() => { setCategoryMenuOpen(false); setOpenChip(prev => prev === "followers" ? null : "followers"); }}
                    />
                    <FilterChip
                      id="views"
                      icon={TrendingUp}
                      prefix="播放"
                      label={viewsLabel}
                      active={hasViews}
                      open={openChip === "views"}
                      onClick={() => { setCategoryMenuOpen(false); setOpenChip(prev => prev === "views" ? null : "views"); }}
                    />
                  </div>
                  {(hasGeo || hasApplications || hasFollowers || hasViews) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCountries([]); setLanguages([]);
                        setApplicationConditions([]);
                        setFollowersPreset(null); setFollowersFrom(""); setFollowersTo("");
                        setViewsPreset(null); setViewsFrom(""); setViewsTo("");
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-[#87867f] hover:bg-white hover:text-[#c96442]"
                    >
                      <X className="h-3 w-3" />
                      清空筛选
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  title={canSend ? "发送给 Agent" : missingHint}
                  className={cn(
                    "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition-all duration-300",
                    canSend
                      ? "scale-100 cursor-pointer bg-[#c96442] text-white shadow-[0_6px_18px_-6px_rgba(201,100,66,0.5)] hover:bg-[#d97757]"
                      : "scale-95 cursor-not-allowed bg-[#f0ece4] text-[#b0aea5]"
                  )}
                >
                  <ArrowUp className={cn("h-[20px] w-[20px] transition-transform duration-300", canSend ? "translate-y-0" : "translate-y-0.5")} strokeWidth={2.5} />
                </button>
              </div>

              {/* ── Expanded filter panel ───────────────────────────────── */}
              <AnimatePresence initial={false}>
                {openChip && (
                  <motion.div
                    key={openChip}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-2 mb-2 mt-2 rounded-2xl border border-[#f0ece4] bg-[#faf9f5] p-4">
                      {openChip === "geo" && (
                        <GeoPanel
                          countries={countries}
                          languages={languages}
                          onCountriesChange={setCountries}
                          onLanguagesChange={setLanguages}
                        />
                      )}
                      {openChip === "applications" && (
                        <ApplicationsPanel
                          selected={applicationConditions}
                          onChange={setApplicationConditions}
                        />
                      )}
                      {openChip === "followers" && (
                        <FollowersPanel
                          value={followersPreset}
                          onChange={v => { setFollowersPreset(v); setFollowersFrom(""); setFollowersTo(""); }}
                        />
                      )}
                      {openChip === "views" && (
                        <ViewsPanel
                          value={viewsPreset}
                          onChange={v => { setViewsPreset(v); setViewsFrom(""); setViewsTo(""); }}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!agentStarted ? (
            <div className="mt-5 text-center text-xs font-medium tracking-wide text-[#87867f]">
              选好品类、平台和申请门槛，Agent 会先按你的筛选拉一批被验证过的达人，再进入快速筛选。
            </div>
          ) : null}
        </motion.section>

        <AnimatePresence>
          {previewOpen && mode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/28 p-4 backdrop-blur-[3px]"
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="max-h-[86vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-[#e8e6dc] bg-[#fffdf9] p-5 shadow-[0_30px_120px_-42px_rgba(20,20,19,0.42)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#87867f]">Agent 预筛结果</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#141413]">先看这批达人缩略卡</h3>
                    <p className="mt-1 text-sm text-[#87867f]">点击卡片进入快速筛选；也可以先展开查看推荐依据。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8e6dc] bg-white text-[#87867f] transition-colors hover:text-[#141413]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {PREVIEW_CREATORS.map(creator => {
                    const expanded = expandedPreviewId === creator.id;
                    return (
                      <div
                        key={creator.id}
                        role="button"
                        tabIndex={0}
                        onClick={openQuickScreen}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") openQuickScreen();
                        }}
                        className="cursor-pointer rounded-2xl border border-[#e8e6dc] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#c96442]/40 hover:shadow-[0_18px_40px_-30px_rgba(77,76,72,0.35)]"
                      >
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://i.pravatar.cc/100?img=${creator.avatarImg}`} alt={creator.name} className="h-12 w-12 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#141413]">{creator.name}</p>
                            <p className="text-xs text-[#87867f]">{creator.handle}</p>
                          </div>
                          <div className="rounded-full bg-[#fff6ef] px-2.5 py-1 text-xs font-bold text-[#c96442]">{creator.score}</div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#4d4c48]">{creator.reason}</p>
                        {expanded ? (
                          <div className="mt-3 rounded-2xl border border-[#f0ece4] bg-[#faf9f5] p-3 text-xs leading-5 text-[#5e5d59]">
                            {creator.proof}
                          </div>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedPreviewId(expanded ? null : creator.id);
                            }}
                            className="rounded-full border border-[#e8e6dc] px-3 py-1.5 text-xs font-medium text-[#4d4c48] transition-colors hover:text-[#c96442]"
                          >
                            {expanded ? "收起" : "展开"}
                          </button>
                          <span className="text-xs font-semibold text-[#c96442]">进入快速筛选</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-[#e8e6dc] bg-white text-sm text-[#87867f]">
          加载博主发现…
        </div>
      }
    >
      <DiscoveryPageInner />
    </Suspense>
  );
}
