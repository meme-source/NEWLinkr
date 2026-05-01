// 博主发现 —— 找爆款达人
// POST /api/discovery/trending
// 文档：博主发现页实现逻辑.md §5
import { ok } from "@/lib/api/envelope";
import { BadRequestError } from "@/lib/api/errors";
import { withRoute } from "@/lib/api/handler";
import { TrendingDiscoveryRequestSchema } from "@/lib/api/schemas";
import { discoverByTrending } from "@/lib/services/discovery";

export const POST = withRoute(async (req: Request) => {
  const json = await req.json().catch(() => null);
  if (json === null) throw new BadRequestError("Request body must be valid JSON");

  const input = TrendingDiscoveryRequestSchema.parse(json);
  const result = await discoverByTrending(input);
  return ok(result);
});
