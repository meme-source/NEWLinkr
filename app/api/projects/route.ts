// 项目（产品/品牌）管理
// GET  /api/projects     列出当前用户所有项目
// POST /api/projects     创建项目
import { ok } from "@/lib/api/envelope";
import { BadRequestError } from "@/lib/api/errors";
import { withRoute } from "@/lib/api/handler";
import { CreateProjectInputSchema } from "@/lib/api/schemas";
import { createProject, listProjects } from "@/lib/services/projects";

export const GET = withRoute(async () => {
  return ok(await listProjects());
});

export const POST = withRoute(async (req: Request) => {
  const json = await req.json().catch(() => null);
  if (json === null) throw new BadRequestError("Request body must be valid JSON");

  const input = CreateProjectInputSchema.parse(json);
  return ok(await createProject(input));
});
