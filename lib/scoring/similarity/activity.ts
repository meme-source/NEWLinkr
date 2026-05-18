// 近期活跃度（spec §4.3 维度 5）。
//
// 阶梯函数：
//   d ≤ 7  → 100
//   7  < d ≤ 14 → 70
//   14 < d ≤ 30 → 40
//   d  > 30 → 由 §4.1 硬门槛踢出，不会走到这里
//
// 软规则：硬门槛已经卡了 30 天活跃，这里只在余下范围内做"越新越好"的偏好。

import type { Creator } from "@/types/api";
import { toInternalScore } from "./normalize";

const REFERENCE_DATE_FALLBACK = "2026-05-01"; // 与 mock recentPosts 的时间窗对齐

export type ActivitySubscoreResult = {
  score: number;
  components: {
    daysSinceActive: number;
  };
  evidence: string[];
};

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function latestPostDate(creator: Creator): Date | null {
  let best: Date | null = parseDate(creator.recentActiveAt);
  for (const post of creator.recentPosts ?? []) {
    const d = parseDate(post.postedAt);
    if (d && (!best || d.getTime() > best.getTime())) {
      best = d;
    }
  }
  return best;
}

export function scoreActivity(creator: Creator, now: Date = new Date()): ActivitySubscoreResult {
  const latest = latestPostDate(creator) ?? parseDate(REFERENCE_DATE_FALLBACK);
  if (!latest) {
    return {
      score: 0,
      components: { daysSinceActive: Number.POSITIVE_INFINITY },
      evidence: ["无近期发布记录"],
    };
  }
  const days = Math.max(0, Math.floor((now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)));

  let score: number;
  if (days <= 7) score = 100;
  else if (days <= 14) score = 70;
  else if (days <= 30) score = 40;
  else score = 20; // 硬门槛通常已踢出，留 20 作为软退路（避免硬门槛被关掉时直接 0）

  return {
    score: toInternalScore(score),
    components: { daysSinceActive: days },
    evidence: [`距最近一条 ${days} 天`],
  };
}
