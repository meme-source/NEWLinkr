// 内容形式相似度（spec §4.3 维度 2）。
//
//   format = 形式标签分布的余弦相似度 × 100
//
// Phase 0：用规则把每条近期内容打上一组 format tag（vlog / 教程 / 开箱 /
// 测试 / 图文 / 短视频...），统计 seed 与候选的标签频率分布，做余弦相似度。
// duration / post_type 字段在当前 Creator 数据里不存在，所以"短/长视频"
// 暂时无法判定——这部分给中性值，不影响其他规则。

import type { Creator, CreatorRecentPost } from "@/types/api";
import { toInternalScore } from "./normalize";

export type FormatSubscoreInput = {
  seed: Creator;
  candidate: Creator;
};

export type FormatSubscoreResult = {
  score: number;
  components: Record<string, number>;
  evidence: string[];
  seedFormatTags: ReadonlyMap<string, number>;
  candidateFormatTags: ReadonlyMap<string, number>;
};

// Tag 词典 → 命中规则。所有规则只读 Tier 1 数据，不调 AI。
type FormatTag =
  | "vlog"
  | "tutorial"
  | "unboxing"
  | "review"
  | "lifestyle"
  | "promo"
  | "comedy"
  | "shopping";

const TAG_RULES: Array<{ tag: FormatTag; keywords: string[] }> = [
  { tag: "vlog", keywords: ["vlog", "daily", "routine", "日常", "vlog"] },
  { tag: "tutorial", keywords: ["how to", "tutorial", "教程", "步骤", "step", "教你"] },
  { tag: "unboxing", keywords: ["unboxing", "haul", "开箱", "购物"] },
  { tag: "review", keywords: ["review", "测评", "对比", "comparison", "vs", "试用"] },
  { tag: "lifestyle", keywords: ["lifestyle", "生活", "家居", "vibes"] },
  { tag: "promo", keywords: ["sale", "discount", "code", "折扣", "优惠"] },
  { tag: "comedy", keywords: ["comedy", "funny", "搞笑", "段子"] },
  { tag: "shopping", keywords: ["shop", "购物", "haul"] },
];

function classifyPost(post: CreatorRecentPost): FormatTag[] {
  const text = `${post.caption} ${post.hashtags.join(" ")}`.toLowerCase();
  const hits: FormatTag[] = [];
  for (const rule of TAG_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      hits.push(rule.tag);
    }
  }
  return hits;
}

function buildDistribution(creator: Creator): Map<string, number> {
  const counts = new Map<string, number>();
  for (const post of creator.recentPosts ?? []) {
    for (const tag of classifyPost(post)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

function cosine(a: ReadonlyMap<string, number>, b: ReadonlyMap<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const keys = new Set<string>([...a.keys(), ...b.keys()]);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const k of keys) {
    const va = a.get(k) ?? 0;
    const vb = b.get(k) ?? 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function scoreFormat(input: FormatSubscoreInput): FormatSubscoreResult {
  const { seed, candidate } = input;
  const seedDist = buildDistribution(seed);
  const candDist = buildDistribution(candidate);
  // 候选两端都"无明显形式信号"时给中性 50 分而不是 0，避免空内容把分数砸穿。
  const cosineSim = seedDist.size === 0 && candDist.size === 0 ? 0.5 : cosine(seedDist, candDist);
  const score = toInternalScore(cosineSim * 100);

  const shared = [...seedDist.keys()].filter((k) => candDist.has(k));
  const evidence: string[] = [];
  if (shared.length > 0) {
    evidence.push(`形式标签共享：${shared.join(" / ")}`);
  }

  return {
    score,
    components: Object.fromEntries(seedDist),
    evidence,
    seedFormatTags: seedDist,
    candidateFormatTags: candDist,
  };
}
