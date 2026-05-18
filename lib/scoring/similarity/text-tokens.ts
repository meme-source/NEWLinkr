// Token / 集合工具：Phase 0 启发式相似度的最小依赖。
//
// 这里的 jaccard / dice 不能替代真正的 embedding 余弦相似度；它们的角色是
// 占位实现，能让评分流水线在没有 OpenAI key 的情况下跑通并给出可解释的
// 分数。当 lib/ai/embedding.ts 接入真实嵌入时，topic 子模块会优先用
// embedding 余弦，再退到这里的 jaccard。

// 简单中英文 token 化：按非字母数字切分 + 小写 + 去停用词。
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "for",
  "to",
  "in",
  "on",
  "at",
  "with",
  "is",
  "are",
  "was",
  "i",
  "we",
  "you",
  "my",
  "your",
  "this",
  "that",
  "对",
  "和",
  "的",
  "我",
  "你",
  "在",
  "了",
  "也",
  "是",
]);

export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}#]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

export function toSet(tokens: readonly string[]): Set<string> {
  return new Set(tokens.map((t) => t.toLowerCase()));
}

// Jaccard ∈ [0, 1]。两集合都为空时返回 0（语义上是"没有可比信号"）。
export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const item of a) {
    if (b.has(item)) intersect += 1;
  }
  const union = a.size + b.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

// Overlap coefficient ∈ [0, 1]：|A ∩ B| / min(|A|, |B|)。
// 用于"小集合命中大集合"的情况（例如 seed 的话题词只有 3 个，候选有 20 个，
// jaccard 会被分母拉低，overlap 更贴近"种子覆盖度"语义）。
export function overlap(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const item of a) {
    if (b.has(item)) intersect += 1;
  }
  return intersect / Math.min(a.size, b.size);
}

// 命中的 token 列表（用于 evidence 显示）。
export function intersectionList(a: ReadonlySet<string>, b: ReadonlySet<string>): string[] {
  const result: string[] = [];
  for (const item of a) {
    if (b.has(item)) result.push(item);
  }
  return result;
}
