// 博主发现 —— 按营销场景找
// 两步：
//   POST /api/discovery/scenario   action=parse  → 产品解析+场景推荐
//   POST /api/discovery/scenario   action=match  → 按场景找达人
// 文档：博主发现页实现逻辑.md §4
import { ok, fail, failValidation } from "@/lib/api/envelope";
import { ScenarioRequestSchema } from "@/lib/api/schemas";
import type { ScenarioCreatorResult, ScenarioParseResponse } from "@/types/api";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (json === null) return fail("Request body must be valid JSON");

  const parsed = ScenarioRequestSchema.safeParse(json);
  if (!parsed.success) return failValidation(parsed.error);
  const input = parsed.data;

  if (input.action === "parse") {
    // TODO Phase 2:
    // 1. 如果给了 url，抓取页面拿标题/主图/描述
    // 2. 调 Claude 提取 category + sellingPoints
    // 3. 在 scene_library 中匹配 3-6 个场景
    // 4. 对每个场景统计 creator_count / avg_ER
    const stub: ScenarioParseResponse = {
      productSummary: { category: "", sellingPoints: [] },
      recommendedScenes: [],
    };
    return ok(stub);
  }

  // input.action === "match"
  // TODO Phase 2:
  // 1. 在 creator_scene_stats 找擅长该场景的达人
  // 2. 用 lib/scoring/scenario.ts 算分
  const results: ScenarioCreatorResult[] = [];
  return ok({ results });
}
