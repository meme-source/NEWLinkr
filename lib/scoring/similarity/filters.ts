// 硬门槛过滤（spec §4.1）。
//
// 7 项规则，不进评分公式——不满足直接踢出。default 值会让 95% 的查询零配置
// 通过，需要更激进/更宽松的用户再去展开"高级筛选"自己调。

import type { Creator, Platform, SimilarFilters } from "@/types/api";

export type HardFilterDefaults = {
  minFollowers: number;
  minMedianViews: number;
  maxDaysSinceActive: number;
};

export const DEFAULT_HARD_FILTERS: HardFilterDefaults = {
  minFollowers: 1000,
  minMedianViews: 1000,
  maxDaysSinceActive: 30,
};

export type ApplyFiltersInput = {
  seed: Creator;
  candidate: Creator;
  filters: SimilarFilters | undefined;
  platform: Platform;
  now?: Date;
};

export type ApplyFiltersResult = { passed: true } | { passed: false; reason: string };

function daysSince(dateStr: string | null | undefined, now: Date): number {
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

export function applyHardFilters(input: ApplyFiltersInput): ApplyFiltersResult {
  const { seed, candidate, filters, platform } = input;
  const now = input.now ?? new Date();

  if (candidate.id === seed.id) {
    return { passed: false, reason: "种子达人本人" };
  }

  if (candidate.platform !== platform) {
    return { passed: false, reason: "平台不一致" };
  }

  const minFollowers = filters?.minFollowers ?? DEFAULT_HARD_FILTERS.minFollowers;
  if ((candidate.followers ?? 0) < minFollowers) {
    return { passed: false, reason: `粉丝 < ${minFollowers}` };
  }

  const minMedianViews = filters?.minMedianViews ?? DEFAULT_HARD_FILTERS.minMedianViews;
  if ((candidate.medianViews ?? 0) < minMedianViews) {
    return { passed: false, reason: `中位播放 < ${minMedianViews}` };
  }

  if (filters?.activeRecently !== false) {
    const recencyDays = daysSince(candidate.recentActiveAt, now);
    if (recencyDays > DEFAULT_HARD_FILTERS.maxDaysSinceActive) {
      return { passed: false, reason: "30 天内无更新" };
    }
  }

  if (filters?.hasEmail === true && candidate.emailStatus === "missing") {
    return { passed: false, reason: "无邮箱" };
  }

  if (filters?.excludeRejected) {
    const hasRejected = candidate.collaborations.some((c) => c.status === "rejected");
    if (hasRejected) return { passed: false, reason: "已 No" };
  }

  if (filters?.excludeSaved) {
    const hasActiveProject = candidate.collaborations.length > 0;
    if (hasActiveProject) return { passed: false, reason: "已在项目里" };
  }

  if (filters?.country && candidate.region && !candidate.region.includes(filters.country)) {
    return { passed: false, reason: "国家不匹配" };
  }

  return { passed: true };
}
