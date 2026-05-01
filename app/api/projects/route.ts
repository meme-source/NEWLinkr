// 项目（产品/品牌）管理
// GET  /api/projects     列出当前用户所有项目
// POST /api/projects     创建项目
import { ok, fail, failValidation } from "@/lib/api/envelope";
import { CreateProjectInputSchema } from "@/lib/api/schemas";
import type { Project } from "@/types/api";

export async function GET() {
  // TODO Phase 1: 接 Supabase Auth 取 user_id，从 DB 查
  const stub: Project[] = [];
  return ok(stub);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (json === null) return fail("Request body must be valid JSON");

  const parsed = CreateProjectInputSchema.safeParse(json);
  if (!parsed.success) return failValidation(parsed.error);

  // TODO Phase 1: 写入数据库并返回创建后的 Project。
  // Echoing the validated input is safe (it is the user's own data, not a
  // raw request body that could include extra fields), but the final
  // implementation should return a freshly-read Project row from the DB.
  return ok({ message: "TODO: 实现创建项目", input: parsed.data });
}
