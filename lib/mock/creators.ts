// 假数据 —— 后端没做完前给前端用，前端可以直接 import 这里
// 真实 API 上线后，把 import 替换成 fetch('/api/...')
import type { Creator, CompetitorCreatorResult } from "../types";

export const mockCreators: Creator[] = [
  {
    id: "creator_1",
    handle: "@skincare_sam",
    platform: "tiktok",
    avatar: null,
    followers: 320_000,
    medianViews: 45_000,
    engagementRate: 0.054,
    estimatedPrice: "$500-800",
    emailStatus: "found",
    recentActiveAt: "2026-04-20",
  },
  {
    id: "creator_2",
    handle: "@glowwithsun",
    platform: "tiktok",
    avatar: null,
    followers: 89_000,
    medianViews: 42_000,
    engagementRate: 0.061,
    estimatedPrice: "$300-500",
    emailStatus: "found",
    recentActiveAt: "2026-04-25",
  },
];

export const mockCompetitorResults: CompetitorCreatorResult[] = [
  {
    creator: mockCreators[0],
    evidenceStrength: "high",
    score: 89,
    reasons: [
      "近 60 天发布过 CeraVe 相关合作内容",
      "帖子含 #ad 和品牌 @cerave",
      "合作帖播放高于本人中位播放 1.8x",
    ],
    evidencePost: {
      url: "https://tiktok.com/@skincare_sam/video/xxx",
      brand: "CeraVe",
      publishedAt: "2026-04-12",
      views: 86_000,
    },
  },
];
