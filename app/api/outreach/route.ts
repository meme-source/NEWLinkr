// 建联 —— 发送邮件 / 记录状态
// POST /api/outreach   发送
// GET  /api/outreach   列出当前项目所有建联记录
import { ok } from "@/lib/api/envelope";
import { BadRequestError } from "@/lib/api/errors";
import { withRoute } from "@/lib/api/handler";
import { OutreachSendRequestSchema } from "@/lib/api/schemas";
import { listOutreach, sendOutreach } from "@/lib/services/outreach";

export const GET = withRoute(async () => {
  return ok(await listOutreach());
});

export const POST = withRoute(async (req: Request) => {
  const json = await req.json().catch(() => null);
  if (json === null) throw new BadRequestError("Request body must be valid JSON");

  const input = OutreachSendRequestSchema.parse(json);
  return ok(await sendOutreach(input));
});
