// 建联 —— 发送邮件 / 记录状态
// POST /api/outreach   发送
// GET  /api/outreach   列出当前项目所有建联记录
import { ok, fail } from "@/lib/api";

export async function GET() {
  // TODO Phase 5: 从 outreach_emails 表查
  return ok([]);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.creatorId || !body?.subject || !body?.content) {
    return fail("creatorId / subject / content 必填");
  }
  // TODO Phase 5:
  // 1. 取达人邮箱
  // 2. 调 Resend 发送
  // 3. 写 outreach_emails 表
  return ok({ message: "TODO: 实现发送", received: body });
}
