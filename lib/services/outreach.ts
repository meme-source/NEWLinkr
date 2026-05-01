// 建联（达人邮件外联）服务层

import type { OutreachSendRequest } from "@/types/api";

export type OutreachRecord = {
  id: string;
  creatorId: string;
  subject: string;
  status: "queued" | "sent" | "delivered" | "bounced" | "failed";
  sentAt: string | null;
};

export async function listOutreach(): Promise<OutreachRecord[]> {
  // TODO Phase 5: 从 outreach_emails 表查
  return [];
}

export type OutreachSendResult = {
  status: "queued";
  message: string;
};

export async function sendOutreach(_input: OutreachSendRequest): Promise<OutreachSendResult> {
  // TODO Phase 5:
  // 1. 取达人邮箱
  // 2. 调 Resend 发送
  // 3. 写 outreach_emails 表
  //
  // 不要把请求体回显——可能泄露未声明的字段。Phase 5 实现时返回
  // { id, status, queuedAt } 这种 server-controlled 形状。
  return { status: "queued", message: "TODO: 实现发送" };
}
