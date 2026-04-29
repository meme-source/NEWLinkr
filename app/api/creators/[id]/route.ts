// 达人详情
// GET /api/creators/:id
import { ok, fail } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return fail("id 必填");
  // TODO Phase 1: 从 DB 取，没有则调 provider 拉取后存库
  return ok({ message: "TODO: 实现达人详情", id });
}
