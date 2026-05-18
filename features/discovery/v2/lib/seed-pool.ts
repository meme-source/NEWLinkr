// 找相似「相似来源」叠加：种子池模型 + 纯函数操作。
//
// 语义（与产品对齐）：用户每点一次「根据此博主找相似」就把这位博主追加到种子池。
// 推荐器把池里所有种子的特征做"交集"再过一遍候选 —— 每位候选必须命中全部种子
// 的特征签名。结果的"待筛选"数量可能比上一轮大、也可能小，取决于新种子的特征
// 与现有池的重合程度（用户经验里"通常更大"，因为新种子拓宽了可匹配的特征维度）。
//
// 这里的 rerank / count 都是 mock-only：用 seed handle 的哈希做确定性桶分，
// 同一组种子永远得到同一个结果。接通真实后端后整体替换为服务端调用。

import type { Creator } from "../mock-data";

export interface SeedDescriptor {
  /** Creator id (与 Creator.id / OutputCreatorView.creatorId 同字段域)。*/
  readonly id: string;
  /** Stable handle 形如 "@handle"，UI tooltip 用。*/
  readonly handle: string;
  /** Display name，stack popover 与 toast 文案用。*/
  readonly name: string;
  /** Avatar URL（可缺省，缺省时由 UI 渲染 initials）。*/
  readonly avatarUrl?: string;
}

export function addSeed(seeds: readonly SeedDescriptor[], next: SeedDescriptor): SeedDescriptor[] {
  if (seeds.some((s) => s.id === next.id)) return seeds.slice();
  return [...seeds, next];
}

export function removeSeed(seeds: readonly SeedDescriptor[], id: string): SeedDescriptor[] {
  return seeds.filter((s) => s.id !== id);
}

export function hasSeed(seeds: readonly SeedDescriptor[], id: string): boolean {
  return seeds.some((s) => s.id === id);
}

// 把 Creator 抽成一个 SeedDescriptor。卡片回调 `onFindSimilar(creator)`
// 直接走这里，避免每个 caller 各写一遍字段映射。
export function toSeedFromCreator(c: Creator): SeedDescriptor {
  return {
    id: c.id,
    handle: c.handle,
    name: c.displayName,
    avatarUrl: `https://i.pravatar.cc/96?img=${c.avatarSeed}`,
  };
}

// 候选 rerank：基于种子签名的交集排序。
// 评分 = sum(popcount(cardHash & seedHash))，即候选与种子在哈希位上的重叠度，
// 用作"特征命中"的代理。重叠越多的候选越靠前。getKey 取候选的稳定标识（web 端
// 用 handle，插件用 name / id），让函数对不同候选形态可复用。
export function rerankBySeeds<T>(
  pool: readonly T[],
  seeds: readonly SeedDescriptor[],
  getKey: (item: T) => string,
): T[] {
  if (seeds.length <= 1) return pool.slice();
  const seedHashes = seeds.map((s) => hashHandle(s.handle));
  const scored = pool.map((item, i) => {
    const itemHash = hashHandle(getKey(item));
    let score = 0;
    for (const sh of seedHashes) score += popcount32(itemHash & sh);
    return { item, score, i };
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.map((s) => s.item);
}

// 待筛选数投影：累加式增长，匹配"在两人的交集部分又多添加了几个"的语义。
//
// 单种子 → 返回 base（首轮，未叠加）。
// 每多一颗种子 → 给当前总数加一个 [2, 8] 范围内的 delta，delta 由该种子的
// handle 哈希确定 —— 同一颗种子永远贡献同一个数字。因此池只会涨不会缩，
// 形如 "14 →（+3）17 →（+5）22"。最低增量 2 保证用户每次添加种子都能在
// 视觉上看到"待筛选"数字明显跳动，避免出现"加了但好像没动"的歧义。
export function projectPendingCount(baseCount: number, seeds: readonly SeedDescriptor[]): number {
  if (seeds.length <= 1) return baseCount;
  let total = baseCount;
  for (let i = 1; i < seeds.length; i++) {
    const delta = (hashHandle(seeds[i].handle) % 7) + 2; // 2..8
    total += delta;
  }
  return total;
}

function hashHandle(handle: string): number {
  let h = 2166136261;
  for (let i = 0; i < handle.length; i++) {
    h ^= handle.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 32-bit popcount —— rerank 用作候选/种子哈希位重叠度的代理。
function popcount32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return (Math.imul(x, 0x01010101) >>> 24) & 0xff;
}
