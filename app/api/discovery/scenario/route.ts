// 博主发现 —— 按营销场景找
// 两步：
//   POST /api/discovery/scenario        action=parse  → 产品解析+场景推荐
//   POST /api/discovery/scenario        action=match  → 按场景找达人
// 文档：博主发现页实现逻辑.md §4
import { ok, fail } from "@/lib/api";
import type {
  ScenarioParseRequest,
  ScenarioParseResponse,
  ScenarioCreatorResult,
} from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.action) return fail("action 必填: parse | match");

  if (body.action === "parse") {
    const input = body as ScenarioParseRequest & { action: "parse" };
    if (!input.productUrl && !input.productDescription) {
      return fail("productUrl 或 productDescription 至少给一个");
    }
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

  if (body.action === "match") {
    if (!body.sceneIds?.length) return fail("sceneIds 必填");
    // TODO Phase 2:
    // 1. 在 creator_scene_stats 找擅长该场景的达人
    // 2. 用 lib/scoring/scenario.ts 算分
    const results: ScenarioCreatorResult[] = [];
    return ok({ results });
  }

  return fail(`未知 action: ${body.action}`);
}
