// 博主发现 —— 按营销场景找
// 两步：
//   POST /api/discovery/scenario   action=parse  → 产品解析+场景推荐
//   POST /api/discovery/scenario   action=match  → 按场景找达人
// 文档：博主发现页实现逻辑.md §4
import { ok } from "@/lib/api/envelope";
import { BadRequestError } from "@/lib/api/errors";
import { withRoute } from "@/lib/api/handler";
import { ScenarioRequestSchema } from "@/lib/api/schemas";
import { matchCreatorsByScenarios, parseProductForScenarios } from "@/lib/services/discovery";

export const POST = withRoute(async (req: Request) => {
  const json = await req.json().catch(() => null);
  if (json === null) throw new BadRequestError("Request body must be valid JSON");

  const input = ScenarioRequestSchema.parse(json);

  if (input.action === "parse") {
    return ok(await parseProductForScenarios(input));
  }
  return ok(await matchCreatorsByScenarios(input));
});
