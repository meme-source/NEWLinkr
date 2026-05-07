// 建联（达人邮件外联）服务层

import { BadRequestError } from "@/lib/api/errors";
import type {
  OutreachPersonalizedSegment,
  OutreachSendMessage,
  OutreachSendRequest,
} from "@/types/api";

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
  queuedCount: number;
  personalizedSegmentCount: number;
};

function materializeSegments(segments?: OutreachPersonalizedSegment[]) {
  return segments?.map((segment) => segment.text).join("");
}

function getRequestedMessages(input: OutreachSendRequest): OutreachSendMessage[] {
  if (input.messages?.length) {
    return input.messages;
  }

  if (input.creatorId && input.subject && input.content) {
    return [
      {
        creatorId: input.creatorId,
        subject: input.subject,
        content: input.content,
      },
    ];
  }

  throw new BadRequestError("messages 或 creatorId/subject/content 至少提供一组");
}

function validateMessageSegments(message: OutreachSendMessage) {
  const subjectFromSegments = materializeSegments(message.subjectSegments);
  const contentFromSegments = materializeSegments(message.contentSegments);

  if (subjectFromSegments !== undefined && subjectFromSegments !== message.subject) {
    throw new BadRequestError("subjectSegments 与 subject 内容不一致");
  }

  if (contentFromSegments !== undefined && contentFromSegments !== message.content) {
    throw new BadRequestError("contentSegments 与 content 内容不一致");
  }
}

function countPersonalizedContentSegments(message: OutreachSendMessage) {
  if (message.contentSegments) {
    return message.contentSegments.filter((segment) => segment.personalized).length;
  }

  return message.personalizedSegmentCount ?? 0;
}

export async function sendOutreach(input: OutreachSendRequest): Promise<OutreachSendResult> {
  const messages = getRequestedMessages(input);
  messages.forEach(validateMessageSegments);
  const personalizedSegmentCount = messages.reduce(
    (total, message) => total + countPersonalizedContentSegments(message),
    0,
  );

  // TODO Phase 5:
  // 1. 取达人邮箱
  // 2. 调 Resend 发送
  // 3. 写 outreach_emails 表
  // 4. 写入 contentSegments 的 personalized 标记，后续发送审计与打开记录都能
  //    复现当时的个性化替换位置，而不是只保存一段已经拍平的正文。
  //
  // 不要把请求体回显——可能泄露未声明的字段。Phase 5 实现时返回
  // { id, status, queuedAt } 这种 server-controlled 形状。
  return {
    status: "queued",
    message: "TODO: 实现发送",
    queuedCount: messages.length,
    personalizedSegmentCount,
  };
}
