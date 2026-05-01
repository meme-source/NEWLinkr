// 博主发现 —— 找同行投过的
// POST /api/discovery/competitor
// 文档：博主发现页实现逻辑.md §3
import { ok, fail } from "@/lib/api/envelope";
import type { CompetitorDiscoveryRequest, CompetitorCreatorResult, SearchBasis } from "@/types/api";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CompetitorDiscoveryRequest | null;
  if (!body?.brandQuery || !body?.platform) {
    return fail("brandQuery 和 platform 必填");
  }

  // TODO Phase 3 实现步骤：
  // 1. 用品牌名扩展别名 / 官方账号 / 域名
  // 2. 在 posts 表中搜 mentions / hashtags / external_links
  // 3. 给每条匹配帖子打证据强度（高/中/低）
  // 4. 按 creator 聚合，过滤 No / 风险 / 不活跃
  // 5. 用 lib/scoring/competitor.ts 算分排序

  const basis: SearchBasis = {
    platform: body.platform,
    category: body.category,
    timeRangeDays: body.timeRangeDays,
    postsAnalyzed: 0,
    candidatesFound: 0,
  };
  const results: CompetitorCreatorResult[] = [];

  return ok({ basis, results });
}
