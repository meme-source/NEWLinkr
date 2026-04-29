// 项目（产品/品牌）管理
// GET  /api/projects     列出当前用户所有项目
// POST /api/projects     创建项目
import { ok, fail } from "@/lib/api/envelope";
import type { Project } from "@/types/api";

export async function GET() {
  // TODO Phase 1: 接 Supabase Auth 取 user_id，从 DB 查
  const stub: Project[] = [];
  return ok(stub);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.platform) {
    return fail("name 和 platform 必填");
  }
  // TODO Phase 1: 写入数据库
  return ok({ message: "TODO: 实现创建项目", received: body });
}
