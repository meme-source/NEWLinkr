// 找相似 / 找平替统一入口
// POST /api/creator-search/find
// 文档：docs/找相似与找平替实现逻辑.md §8.2
//
// 路由职责仅限：解析 JSON → zod 校验 → 调 service → 包响应。
// 业务全部交给 lib/services/find-similar.ts，AI / Apify / 视觉接缝在 service
// 之下的 lib/scoring/similarity/* 里。
import { ok } from "@/lib/api/envelope";
import { BadRequestError } from "@/lib/api/errors";
import { withRoute } from "@/lib/api/handler";
import { FindSimilarRequestSchema } from "@/lib/api/schemas";
import { findSimilarCreators } from "@/lib/services/find-similar";

export const POST = withRoute(async (req: Request) => {
  const json = await req.json().catch(() => null);
  if (json === null) throw new BadRequestError("Request body must be valid JSON");

  const input = FindSimilarRequestSchema.parse(json);
  const result = await findSimilarCreators(input);
  return ok(result);
});
