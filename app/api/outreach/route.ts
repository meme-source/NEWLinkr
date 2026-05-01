// 建联 —— 发送邮件 / 记录状态
// POST /api/outreach   发送
// GET  /api/outreach   列出当前项目所有建联记录
import { ok, fail, failValidation } from "@/lib/api/envelope";
import { OutreachSendRequestSchema } from "@/lib/api/schemas";

export async function GET() {
  // TODO Phase 5: 从 outreach_emails 表查
  return ok([]);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (json === null) return fail("Request body must be valid JSON");

  const parsed = OutreachSendRequestSchema.safeParse(json);
  if (!parsed.success) return failValidation(parsed.error);

  // TODO Phase 5:
  // 1. 取达人邮箱
  // 2. 调 Resend 发送
  // 3. 写 outreach_emails 表
  //
  // Note: do NOT echo the request body in the response — earlier code
  // returned `received: body` which would leak any extra/unexpected
  // client-supplied fields. The response should describe the queued send
  // (id, status, queuedAt) once Phase 5 is implemented.
  return ok({ status: "queued" as const, message: "TODO: 实现发送" });
}
