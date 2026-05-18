"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { Button } from "@/components/ui/button";
import type { CreatorProfile, EmailSendOptions } from "@/features/plugin/types";
import {
  EMAIL_PERSONALIZED_BADGE_CLASSES,
  formatScheduleLabel,
  getCreatorLocation,
} from "./shared";
import { EmailBodyEditor } from "./tabs/EmailBodyEditor";

export function EmailReviewModal({
  templateLabel,
  recipients,
  recipientDrafts,
  senderAddress,
  attachmentCount,
  sendMode,
  scheduledAt,
  onClose,
  onConfirm,
}: {
  templateLabel: string;
  recipients: CreatorProfile[];
  recipientDrafts: Array<{ creatorId: string; subject: string; body: string }>;
  senderAddress: string;
  attachmentCount: number;
  sendMode: EmailSendOptions["mode"];
  scheduledAt?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [activeRecipientId, setActiveRecipientId] = useState(recipients[0]?.id ?? "");
  const activeRecipient = recipients.find((item) => item.id === activeRecipientId) ?? recipients[0];
  const activeDraft =
    recipientDrafts.find((item) => item.creatorId === activeRecipientId) ?? recipientDrafts[0];

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#201515]/26 px-4 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9]">
        <div className="flex items-start justify-between gap-4 border-b border-[#c5c0b1] bg-[#fffefb] px-5 py-4">
          <div className="min-w-0">
            <div
              className={`${EMAIL_PERSONALIZED_BADGE_CLASSES} inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              黄色高亮为 AI 个性化内容
            </div>
            <h3 className="mt-2 text-lg font-semibold text-[#201515]">审核邮件建联</h3>
            <p className="mt-1 text-xs leading-5 text-[#939084]">
              标准模板会保持一致，姓名、内容亮点、合作理由等黄色区域会按每位博主自动替换。
            </p>
          </div>
          <Button
            unstyled
            type="button"
            onClick={onClose}
            aria-label="关闭审核窗口"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#36342e]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-2.5 sm:grid-cols-4">
            <div className="rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#939084]">模板</div>
              <div className="mt-1 truncate text-sm font-semibold text-[#201515]">
                {templateLabel}
              </div>
            </div>
            <div className="rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#939084]">收件人</div>
              <div className="mt-1 text-sm font-semibold text-[#201515]">
                {recipients.length} 位
              </div>
            </div>
            <div className="rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#939084]">发送方式</div>
              <div className="mt-1 truncate text-sm font-semibold text-[#201515]">
                {sendMode === "scheduled" && scheduledAt
                  ? formatScheduleLabel(scheduledAt)
                  : "立即发送"}
              </div>
            </div>
            <div className="rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#939084]">附件</div>
              <div className="mt-1 text-sm font-semibold text-[#201515]">{attachmentCount} 个</div>
            </div>
          </div>

          <div className="mt-3 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#201515]">按博主预览个性化版本</div>
              <div className="text-[11px] text-[#939084]">发件：{senderAddress}</div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {recipients.map((recipient) => {
                const active = recipient.id === activeRecipient?.id;
                return (
                  <Button
                    unstyled
                    key={recipient.id}
                    type="button"
                    onClick={() => setActiveRecipientId(recipient.id)}
                    className={cn(
                      "flex min-w-[122px] items-center gap-2 rounded-[8px] border px-2 py-2 text-left transition-all",
                      active
                        ? "border-[#ff4f00]/40 bg-[#fff7f4]"
                        : "border-[#c5c0b1] bg-[#fffdf9] hover:bg-[#fffefb]",
                    )}
                  >
                    <CreatorAvatar
                      creator={recipient}
                      className="h-8 w-8 shrink-0 border border-[#fffefb]"
                      labelClassName="text-[11px]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#201515]">
                        {recipient.handle}
                      </span>
                      <span className="block truncate text-[10px] text-[#939084]">
                        {getCreatorLocation(recipient).flag} {recipient.followers}
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] p-3">
            <div className="mb-2 text-xs font-semibold text-[#201515]">邮件标题</div>
            <div className="rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-2.5 text-[12px] leading-5 text-[#201515]">
              {activeDraft?.subject || "暂无标题"}
            </div>
          </div>

          <div className="mt-3 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] p-3">
            <div className="mb-2 text-xs font-semibold text-[#201515]">邮件正文</div>
            <div className="overflow-hidden rounded-[8px] border border-[#eceae3] bg-[#fffefb]">
              <EmailBodyEditor
                key={activeRecipientId}
                valueHtml={activeDraft?.body ?? ""}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#c5c0b1] bg-[#fffefb] px-5 py-4">
          <div className="min-w-0 text-[11px] leading-5 text-[#939084]">
            确认后将按上方逐位草稿分别发送。
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              unstyled
              type="button"
              onClick={onClose}
              className="h-9 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-4 text-sm font-semibold text-[#36342e] transition-colors hover:bg-[#eceae3]"
            >
              返回修改
            </Button>
            <Button
              unstyled
              type="button"
              onClick={onConfirm}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#ff4f00] px-4 text-sm font-semibold text-[#fffefb] transition-all hover:bg-[#ff4f00] active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              确认发送
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
