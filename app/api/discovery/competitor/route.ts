// 博主发现 —— 找同行投过的
// POST /api/discovery/competitor
// 文档：博主发现页实现逻辑.md §3
import { ok } from "@/lib/api/envelope";
import { BadRequestError } from "@/lib/api/errors";
import { withRoute } from "@/lib/api/handler";
import { CompetitorDiscoveryRequestSchema } from "@/lib/api/schemas";
import { discoverByCompetitor } from "@/lib/services/discovery";

export const POST = withRoute(async (req: Request) => {
  const json = await req.json().catch(() => null);
  if (json === null) throw new BadRequestError("Request body must be valid JSON");

  const input = CompetitorDiscoveryRequestSchema.parse(json);
  const result = await discoverByCompetitor(input);
  return ok(result);
});
