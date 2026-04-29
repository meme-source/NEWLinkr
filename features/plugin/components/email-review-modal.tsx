"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Send, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { HighlightedEmailPreview } from "@/features/plugin/components/highlighted-email-preview";
import {
  getEmailSubjectSegments,
  getEmailTemplateSegments,
} from "@/features/plugin/lib/email";
import { formatScheduleLabel } from "@/features/plugin/lib/format";
import { getCreatorLocation } from "@/features/plugin/lib/creator-helpers";
import type {
  CreatorProfile,
  EmailSendOptions,
  EmailTemplateKey,
  ProjectSummary,
} from "@/features/plugin/types";

export function EmailReviewModal({
  templateKey,
  templateLabel,
  project,
  recipients,
  senderAddress,
  subject,
  attachmentCount,
  sendMode,
  scheduledAt,
  onClose,
  onConfirm,
}: {
  templateKey: EmailTemplateKey;
  templateLabel: string;
  project: ProjectSummary;
  recipients: CreatorProfile[];
  senderAddress: string;
  subject: string;
  attachmentCount: number;
  sendMode: EmailSendOptions["mode"];
  scheduledAt?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [activeRecipientId, setActiveRecipientId] = useState(recipients[0]?.id ?? "");
  const activeRecipient =
    recipients.find((item) => item.id === activeRecipientId) ?? recipients[0];
  const subjectSegments = activeRecipient
    ? getEmailSubjectSegments(templateKey, activeRecipient, project)
    : [{ text: subject }];
  const generatedSubject = subjectSegments.map((segment) => segment.text).join("");
  const displaySubjectSegments =
    subject.trim() && subject.trim() !== generatedSubject.trim()
      ? [{ text: subject }]
      : subjectSegments;
  const contentSegments = activeRecipient
    ? getEmailTemplateSegments(templateKey, activeRecipient, project)
    : [];
  const highlightCount = contentSegments.filter((segment) => segment.personalized).length;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#141413]/26 px-4 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] border border-[#e8e6dc] bg-[#faf9f5] shadow-[0_28px_80px_-42px_rgba(20,20,19,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#e8e6dc] bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff2b8] px-2.5 py-1 text-[11px] font-semibold text-[#765d14] ring-1 ring-[#f1d86f]">
              <Sparkles className="h-3.5 w-3.5" />
              黄色高亮为 AI 个性化内容
            </div>
            <h3 className="mt-2 text-lg font-semibold text-[#141413]">审核邮件建联</h3>
            <p className="mt-1 text-xs leading-5 text-[#87867f]">
              标准模板会保持一致，姓名、内容亮点、合作理由等黄色区域会按每位博主自动替换。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭审核窗口"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#87867f] transition-colors hover:bg-[#f5f4ed] hover:text-[#4d4c48]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-2.5 sm:grid-cols-4">
            <div className="rounded-[18px] border border-[#e8e6dc] bg-white px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#87867f]">模板</div>
              <div className="mt-1 truncate text-sm font-semibold text-[#141413]">{templateLabel}</div>
            </div>
            <div className="rounded-[18px] border border-[#e8e6dc] bg-white px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#87867f]">收件人</div>
              <div className="mt-1 text-sm font-semibold text-[#141413]">{recipients.length} 位</div>
            </div>
            <div className="rounded-[18px] border border-[#e8e6dc] bg-white px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#87867f]">发送方式</div>
              <div className="mt-1 truncate text-sm font-semibold text-[#141413]">
                {sendMode === "scheduled" && scheduledAt
                  ? formatScheduleLabel(scheduledAt)
                  : "立即发送"}
              </div>
            </div>
            <div className="rounded-[18px] border border-[#e8e6dc] bg-white px-3 py-2.5">
              <div className="text-[10.5px] font-medium text-[#87867f]">附件</div>
              <div className="mt-1 text-sm font-semibold text-[#141413]">{attachmentCount} 个</div>
            </div>
          </div>

          <div className="mt-3 rounded-[22px] border border-[#e8e6dc] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#141413]">按博主预览个性化版本</div>
              <div className="text-[11px] text-[#87867f]">发件：{senderAddress}</div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {recipients.map((recipient) => {
                const active = recipient.id === activeRecipient?.id;
                return (
                  <button
                    key={recipient.id}
                    type="button"
                    onClick={() => setActiveRecipientId(recipient.id)}
                    className={cn(
                      "flex min-w-[122px] items-center gap-2 rounded-[16px] border px-2 py-2 text-left transition-all",
                      active
                        ? "border-[#c96442]/40 bg-[#fff7f1]"
                        : "border-[#e8e6dc] bg-[#faf9f5] hover:bg-white"
                    )}
                  >
                    <CreatorAvatar creator={recipient} className="h-8 w-8 shrink-0 border border-white" labelClassName="text-[11px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#141413]">
                        {recipient.handle}
                      </span>
                      <span className="block truncate text-[10px] text-[#87867f]">
                        {getCreatorLocation(recipient).flag} {recipient.followers}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 rounded-[22px] border border-[#e8e6dc] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#141413]">邮件标题</div>
              <span className="rounded-full bg-[#fff2b8] px-2 py-0.5 text-[10px] font-semibold text-[#765d14] ring-1 ring-[#f1d86f]">
                标题也会替换姓名
              </span>
            </div>
            <HighlightedEmailPreview
              segments={displaySubjectSegments.length > 0 ? displaySubjectSegments : [{ text: subject }]}
              emptyLabel="暂无标题"
              compact
            />
          </div>

          <div className="mt-3 rounded-[22px] border border-[#e8e6dc] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#141413]">邮件正文</div>
              <span className="rounded-full bg-[#fff2b8] px-2 py-0.5 text-[10px] font-semibold text-[#765d14] ring-1 ring-[#f1d86f]">
                {highlightCount} 处个性化
              </span>
            </div>
            <HighlightedEmailPreview segments={contentSegments} emptyLabel="暂无正文" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#e8e6dc] bg-white px-5 py-4">
          <div className="min-w-0 text-[11px] leading-5 text-[#87867f]">
            确认后将按当前高亮规则为每位博主生成独立邮件。
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-full border border-[#e8e6dc] bg-white px-4 text-sm font-semibold text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]"
            >
              返回修改
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#c96442] px-4 text-sm font-semibold text-white transition-all hover:bg-[#b85a3b] active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              确认发送
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
