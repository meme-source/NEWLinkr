// 找同行投过的 —— 推荐分公式
// 来源：博主发现页实现逻辑.md §3.5
//
// 同行合作推荐分 =
//   合作证据强度 35%
// + 合作内容表现 25%
// + 品类相关性   20%
// + 近期活跃     10%
// + 可联系性     10%

export type CompetitorScoreInput = {
  evidenceStrength: number; // 0-100，强证据=100，中=60，弱=30
  collabPerformance: number; // 合作帖播放 / 本人中位播放，归一到 0-100
  categoryRelevance: number; // 0-100
  recentActivity: number; // 0-100，近 30 天有发帖=100
  contactability: number; // 0-100，邮箱已验证=100
};

export function competitorScore(input: CompetitorScoreInput): number {
  return Math.round(
    input.evidenceStrength * 0.35 +
      input.collabPerformance * 0.25 +
      input.categoryRelevance * 0.2 +
      input.recentActivity * 0.1 +
      input.contactability * 0.1,
  );
}
