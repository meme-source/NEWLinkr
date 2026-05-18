// 视觉调性相似度（spec §4.3 维度 3）。
//
// Phase 0：没有封面图、没有 MobileNet 推理、没有传统 CV 特征——能直接读到的
// 只有"美学/人设标签"维度。规则：用 hashtag + topics + userTags 在一个固定
// 字典里做命中，得到 aesthetic_tags 集合，再算 Jaccard。
//
// 这个维度的"50% CNN + 25% 传统 CV + 25% 美学字典"在没有图片信号时，前两
// 部分给中性 50 分，第三部分走真实命中——避免视觉维度把强视觉类目的分数砸穿。
// Phase 2 接 MobileNet 时，把 cnnScore / cvScore 替换成真实推理结果即可。

import type { Creator } from "@/types/api";
import { intersectionList, jaccard, toSet } from "./text-tokens";
import { toInternalScore } from "./normalize";

export type VisualSubscoreInput = {
  seed: Creator;
  candidate: Creator;
};

export type VisualSubscoreResult = {
  score: number;
  components: {
    cnnVisual: number;
    cvSignature: number;
    aestheticTags: number;
  };
  evidence: string[];
  seedAestheticTags: string[];
  candidateAestheticTags: string[];
};

// 美学/人设字典（精简版）。Phase 1 应该走 spec §4.3 子层 3.3 的完整字典 +
// 语义兜底；这里覆盖最高频的 5 类，足够让演示有可读 chip。
const AESTHETIC_DICTIONARY: Array<{ tag: string; keywords: string[] }> = [
  { tag: "韩系干净", keywords: ["clean", "korean", "glossy", "dewy", "glassy", "干净", "净透"] },
  { tag: "Y2K 辣妹", keywords: ["y2k", "2000s", "辣妹", "性感"] },
  { tag: "法式慵懒", keywords: ["french", "parisian", "effortless", "法式", "慵懒"] },
  { tag: "Old Money", keywords: ["oldmoney", "quiet luxury", "stealth", "低调奢华", "老钱"] },
  { tag: "甜美少女", keywords: ["soft", "cute", "kawaii", "甜美", "少女", "粉嫩"] },
];

function collectSignalText(creator: Creator): string {
  const parts: string[] = [creator.name, creator.category, ...creator.topics, ...creator.userTags];
  for (const post of creator.recentPosts ?? []) {
    parts.push(post.caption);
    parts.push(...post.hashtags);
  }
  return parts.join(" ").toLowerCase();
}

function extractAestheticTags(creator: Creator): string[] {
  const text = collectSignalText(creator);
  const hits: string[] = [];
  for (const entry of AESTHETIC_DICTIONARY) {
    const hitCount = entry.keywords.filter((kw) => text.includes(kw)).length;
    if (hitCount >= 1) hits.push(entry.tag);
  }
  return hits;
}

export function scoreVisual(input: VisualSubscoreInput): VisualSubscoreResult {
  const { seed, candidate } = input;
  const seedTags = extractAestheticTags(seed);
  const candTags = extractAestheticTags(candidate);

  const aestheticRaw = jaccard(toSet(seedTags), toSet(candTags));
  const aestheticTags = toInternalScore(aestheticRaw * 100);

  // 同 category 视为有共同"画面感"基线（CNN 维度的占位）：相同 50，不同 25。
  // Phase 2 接 ONNX MobileNet 后这两个数字会被真实余弦相似度替换。
  const cnnVisual = seed.category === candidate.category ? 50 : 25;
  const cvSignature = cnnVisual;

  // §4.3 公式：50% CNN + 25% CV + 25% 美学。
  const raw = cnnVisual * 0.5 + cvSignature * 0.25 + aestheticTags * 0.25;
  const score = toInternalScore(raw);

  const shared = intersectionList(toSet(seedTags), toSet(candTags));
  const evidence: string[] = [];
  if (shared.length > 0) {
    evidence.push(`美学标签共享：${shared.join(" / ")}`);
  }
  if (seed.category === candidate.category) {
    evidence.push(`同分类：${seed.category}`);
  }

  return {
    score,
    components: { cnnVisual, cvSignature, aestheticTags },
    evidence,
    seedAestheticTags: seedTags,
    candidateAestheticTags: candTags,
  };
}
