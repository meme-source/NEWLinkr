// 候选达人池适配器。
//
// Phase 0：直接读 features/creator/data 的 mock 库（受 NEXT_PUBLIC_USE_MOCK
// 控制）。Phase 1+ 这里换成对 DB / Apify 缓存的 repository 调用，service 层
// 不动。
//
// 设计原则：service 层只依赖 listAllCandidates / findSeedByHandle /
// findSeedById 三个出口；不允许直接 import @/features/creator/data。这样
// 当数据源迁移到真实后端时，整个 lib/services/find-similar.ts 不需要改。

import type { Creator } from "@/types/api";
import { getCreators } from "@/features/creator/data";
import { resolveCreator } from "@/features/creator/data/registry";

export function listAllCandidates(): Creator[] {
  return getCreators();
}

export function findSeedByHandle(handle: string): Creator | null {
  return resolveCreator({ handle });
}

export function findSeedById(id: string): Creator | null {
  return resolveCreator({ id });
}

// 用于在 service 层做"种子+候选"的成对计算。候选池排除种子自身、不同平台
// 由硬门槛处理；这里只做"全量返回"。
export function findCandidatesForSeed(seed: Creator): Creator[] {
  return listAllCandidates().filter((c) => c.id !== seed.id);
}
