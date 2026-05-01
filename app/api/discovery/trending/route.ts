// 博主发现 —— 找爆款达人
// POST /api/discovery/trending
// 文档：博主发现页实现逻辑.md §5
import { ok, fail, failValidation } from "@/lib/api/envelope";
import { TrendingDiscoveryRequestSchema } from "@/lib/api/schemas";
import type { SearchBasis, TrendingCreatorResult } from "@/types/api";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (json === null) return fail("Request body must be valid JSON");

  const parsed = TrendingDiscoveryRequestSchema.safeParse(json);
  if (!parsed.success) return failValidation(parsed.error);
  const input = parsed.data;

  // TODO Phase 4 实现步骤：
  // 1. 拉时间范围内品类相关 posts
  // 2. 算每条相对本人 median_views 的倍数
  // 3. 算相对品类基线的倍数
  // 4. 聚合到 creator，用 classifyTrendType 打标签
  // 5. 用 lib/scoring/trending.ts 算分

  const basis: SearchBasis = {
    platform: input.platform,
    category: input.category,
    timeRangeDays: input.timeRangeDays,
    postsAnalyzed: 0,
    candidatesFound: 0,
  };
  const results: TrendingCreatorResult[] = [];

  return ok({ basis, results });
}
