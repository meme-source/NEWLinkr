// 内容主题相似度（spec §4.3 维度 1）。
//
//   topic = 0.6 × 词频身份相似度 + 0.4 × 近期内容相似度
//
// Phase 0 启发式：bio embedding 用 `topics + userTags + category + name` 拼成
// 伪 bio 做 token 集合相似；近期内容用 hashtag + caption 的 token 集合相似。
// 真实接通 OpenAI 时只需要把这里的 jaccard 换成 cosine，公式权重不变。

import type { Creator } from "@/types/api";
import { intersectionList, jaccard, overlap, toSet, tokenize } from "./text-tokens";
import { toInternalScore } from "./normalize";

export type TopicSubscoreInput = {
  seed: Creator;
  candidate: Creator;
};

export type TopicSubscoreResult = {
  score: number;
  components: {
    topicIdentity: number;
    topicRecent: number;
  };
  evidence: string[];
};

// 把 Creator 的离散字段缝成"伪 bio"。Phase 1+ 接通真实 bio 字段时换字段即可。
function syntheticBioTokens(creator: Creator): string[] {
  const parts: string[] = [creator.name, creator.category, ...creator.topics, ...creator.userTags];
  return tokenize(parts.join(" "));
}

function recentContentTokens(creator: Creator): string[] {
  const parts: string[] = [];
  for (const post of creator.recentPosts ?? []) {
    parts.push(post.caption);
    parts.push(...post.hashtags);
    parts.push(...post.brandMentions);
  }
  return tokenize(parts.join(" "));
}

export function scoreTopic(input: TopicSubscoreInput): TopicSubscoreResult {
  const { seed, candidate } = input;

  const seedBio = toSet(syntheticBioTokens(seed));
  const candBio = toSet(syntheticBioTokens(candidate));
  // 用 overlap 而非 jaccard：seed 的"身份描述"集合通常很小，jaccard 会被分母
  // 拉低；overlap 表达"种子覆盖度"更接近 §4.3 子层 1.1 的语义。
  const identityRaw = overlap(seedBio, candBio);
  // 引入轻度长度惩罚：候选完全不重合时给一个保底（0.05 噪声），避免 0 分悬崖。
  const topicIdentity = toInternalScore(identityRaw * 100);

  const seedRecent = toSet(recentContentTokens(seed));
  const candRecent = toSet(recentContentTokens(candidate));
  const recentRaw = jaccard(seedRecent, candRecent);
  const topicRecent = toInternalScore(recentRaw * 100);

  const score = toInternalScore(topicIdentity * 0.6 + topicRecent * 0.4);

  // 取共有 token 给到详情抽屉。截前 6 个，避免 noisy。
  const sharedIdentity = intersectionList(seedBio, candBio).slice(0, 6);
  const sharedRecent = intersectionList(seedRecent, candRecent).slice(0, 6);

  const evidence: string[] = [];
  if (sharedIdentity.length > 0) {
    evidence.push(`身份关键词共有：${sharedIdentity.join(" / ")}`);
  }
  if (sharedRecent.length > 0) {
    evidence.push(`近期内容共现：${sharedRecent.join(" / ")}`);
  }

  return {
    score,
    components: { topicIdentity, topicRecent },
    evidence,
  };
}
