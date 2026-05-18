"use client";

import { useRef } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Eye,
  FileText,
  Mail,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreatorProfile, EmailSendOptions, EmailTemplateKey } from "@/features/plugin/types";
import { emailTemplates } from "@/features/plugin/data/email-templates";
import type { EmailAccount, EmailTemplateGroup } from "@/features/email/types";
import { Button } from "@/components/ui/button";
import {
  EMAIL_PERSONALIZED_BADGE_CLASSES,
  SIDEBAR_CARD_RADIUS,
  formatScheduleLabel,
} from "../shared";
import { EmailBodyEditor } from "./EmailBodyEditor";

const EMAIL_COMPACT_CONTROL_CLASSES =
  "h-9 w-full appearance-none rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-3 pr-9 text-sm text-[#201515] outline-none transition-colors focus:border-[#ff4f00]/35";
const EMAIL_COMPACT_BUTTON_CLASSES =
  "inline-flex h-9 items-center justify-center rounded-[8px] px-3 text-sm font-semibold transition-all active:scale-[0.99]";

// 发送账号沿用共享层的 EmailAccount —— 与 Web 工作台「邮箱绑定」同一形状。
export type SenderEmail = EmailAccount;

export function EmailComposerCard({
  senderEmails,
  selectedSenderId,
  onChangeSelectedSenderId,
  selectedEmailTemplate,
  onSelectEmailTemplate,
  emailSubject,
  onChangeEmailSubject,
  emailAttachments,
  onChangeEmailAttachments,
  previewCreator,
  previewIndex,
  onPreviewPrev,
  onPreviewNext,
  unconfirmedRecipientCount,
  isPreviewConfirmed,
  onToggleConfirmPreview,
  bodyHtml,
  onChangeBody,
  personalizedSegmentCount,
  emailRecipientCount,
  canOpenEmailReview,
  onSendAction,
  sendMode,
  onChangeSendMode,
  sendMenuOpen,
  onToggleSendMenu,
  scheduledAt,
  onChangeScheduledAt,
}: {
  senderEmails: SenderEmail[];
  selectedSenderId: string;
  onChangeSelectedSenderId: (id: string) => void;
  selectedEmailTemplate: EmailTemplateKey;
  onSelectEmailTemplate: (key: EmailTemplateKey) => void;
  emailSubject: string;
  onChangeEmailSubject: (value: string) => void;
  emailAttachments: File[];
  onChangeEmailAttachments: (files: File[]) => void;
  previewCreator: CreatorProfile;
  previewIndex: number;
  onPreviewPrev: () => void;
  onPreviewNext: () => void;
  unconfirmedRecipientCount: number;
  isPreviewConfirmed: boolean;
  onToggleConfirmPreview: () => void;
  bodyHtml: string;
  onChangeBody: (html: string) => void;
  personalizedSegmentCount: number;
  emailRecipientCount: number;
  canOpenEmailReview: boolean;
  onSendAction: () => void;
  sendMode: EmailSendOptions["mode"];
  onChangeSendMode: (mode: EmailSendOptions["mode"]) => void;
  sendMenuOpen: boolean;
  onToggleSendMenu: () => void;
  scheduledAt: string;
  onChangeScheduledAt: (value: string) => void;
}) {
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const activeEmailTemplate =
    emailTemplates.find((template) => template.id === selectedEmailTemplate) ?? null;

  const handleAttachmentFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const existingKeys = new Set(
      emailAttachments.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
    );
    const next = [...emailAttachments];

    Array.from(files).forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!existingKeys.has(key)) {
        next.push(file);
        existingKeys.add(key);
      }
    });

    onChangeEmailAttachments(next);

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  return (
    <div className={`${SIDEBAR_CARD_RADIUS} border border-[#c5c0b1] bg-[#fffefb] p-3`}>
      <div className="relative mb-3 border-b border-[#eceae3] pb-2">
        <div className="inline-flex items-center gap-1.5 text-base font-semibold text-[#201515]">
          <Mail className="h-4 w-4 shrink-0 text-[#ff4f00]" />
          <span>邮件建联</span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="mb-1.5 text-xs font-medium text-zinc-500">发送账号</div>
          {senderEmails.length === 0 ? (
            <Button
              unstyled
              type="button"
              className={`${EMAIL_COMPACT_BUTTON_CLASSES} w-full border border-dashed border-[#c5c0b1] bg-[#fffdf9] text-left text-[#939084] hover:border-[#ff4f00]/40 hover:text-[#939084]`}
            >
              添加邮件
            </Button>
          ) : (
            <div className="relative">
              <select
                value={selectedSenderId}
                onChange={(e) => onChangeSelectedSenderId(e.target.value)}
                className={EMAIL_COMPACT_CONTROL_CLASSES}
              >
                {senderEmails.map((acct) => (
                  <option key={acct.id} value={acct.id} className="bg-[#fffefb] text-[#201515]">
                    {acct.address}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#36342e]" />
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 text-xs font-medium text-zinc-500">邮件模板</div>
          <div className="space-y-1">
            <div className="relative">
              <select
                value={selectedEmailTemplate}
                onChange={(e) => onSelectEmailTemplate(e.target.value as EmailTemplateKey)}
                className={EMAIL_COMPACT_CONTROL_CLASSES}
              >
                <option value="" className="bg-[#fffefb] text-[#939084]">
                  请选择模板
                </option>
                {(["系统模板", "我的模板"] as EmailTemplateGroup[]).map((group) => {
                  const items = emailTemplates.filter((template) => template.group === group);
                  if (items.length === 0) return null;
                  return (
                    <optgroup key={group} label={group}>
                      {items.map((template) => (
                        <option
                          key={template.id}
                          value={template.id}
                          className="bg-[#fffefb] text-[#201515]"
                        >
                          {template.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#36342e]" />
            </div>
            {activeEmailTemplate ? (
              <div className="px-1 text-[11px] leading-[1.45] text-[#939084]">
                {activeEmailTemplate.summary}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-medium text-zinc-500">邮件内容</div>

          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              {emailRecipientCount > 1 ? (
                <Button
                  unstyled
                  type="button"
                  aria-label="上一位博主"
                  title="上一位博主"
                  onClick={onPreviewPrev}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#36342e] transition-colors hover:border-[#ff4f00]/45 hover:bg-[#fff7f4] hover:text-[#ff4f00]"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              ) : null}
              <span className="min-w-0 truncate text-[11px] font-semibold text-[#36342e]">
                {previewCreator.handle}
              </span>
              {emailRecipientCount > 1 ? (
                <>
                  <span className="shrink-0 rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[10px] font-semibold text-[#36342e] tabular-nums">
                    {previewIndex >= 0 ? previewIndex + 1 : "–"}/{emailRecipientCount}
                  </span>
                  <Button
                    unstyled
                    type="button"
                    aria-label="下一位博主"
                    title="下一位博主"
                    onClick={onPreviewNext}
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#36342e] transition-colors hover:border-[#ff4f00]/45 hover:bg-[#fff7f4] hover:text-[#ff4f00]"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </>
              ) : null}
            </div>
            <span className="group/highlight relative shrink-0">
              <span
                aria-label={`${personalizedSegmentCount} 处高亮。高亮内容仅用于标识 AI 为该博主生成的个性化替换内容，不会显示在最终邮件正文中。`}
                className={`${EMAIL_PERSONALIZED_BADGE_CLASSES} cursor-default px-2 py-0.5 text-[10px] font-semibold`}
              >
                {personalizedSegmentCount} 处高亮
              </span>
              <span
                role="tooltip"
                className="pointer-events-none absolute top-full right-0 z-40 mt-1.5 w-56 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-2 text-[11px] leading-[1.55] text-[#36342e] opacity-0 transition-opacity group-hover/highlight:opacity-100"
              >
                高亮内容仅用于标识 AI 为该博主生成的个性化替换内容，不会显示在最终邮件正文中。
              </span>
            </span>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] transition-colors focus-within:border-[#ff4f00]/35">
            {selectedEmailTemplate ? (
              <div className="flex items-center gap-2 border-b border-[#c5c0b1] bg-[#fffefb] px-3 py-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-[#ff4f00]" />
                <input
                  value={emailSubject}
                  onChange={(event) => onChangeEmailSubject(event.target.value)}
                  className="h-7 min-w-0 flex-1 bg-transparent text-sm font-medium text-[#201515] outline-none placeholder:text-[#939084]"
                  placeholder="输入邮件标题"
                />
              </div>
            ) : null}

            {selectedEmailTemplate ? (
              <EmailBodyEditor
                key={`${previewCreator.id}::${selectedEmailTemplate}`}
                valueHtml={bodyHtml}
                onChange={onChangeBody}
              />
            ) : (
              <div className="bg-[#fffdf9] px-3 py-3">
                <div className="rounded-[8px] border border-dashed border-[#b5b2aa] bg-[#fffefb] px-3 py-5 text-center text-sm text-[#939084]">
                  选择模板后生成邮件内容
                </div>
              </div>
            )}

            {selectedEmailTemplate ? (
              <div className="flex items-center justify-between gap-2 border-t border-[#c5c0b1] bg-[#fffefb] px-3 py-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => handleAttachmentFiles(event.currentTarget.files)}
                  />
                  {emailAttachments.map((file) => (
                    <span
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#eceae3] bg-[#fffdf9] px-2 py-0.5 text-[10px] text-[#36342e]"
                    >
                      <Paperclip className="h-2.5 w-2.5 shrink-0 text-[#939084]" />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <Button
                        unstyled
                        type="button"
                        aria-label={`移除附件 ${file.name}`}
                        onClick={() =>
                          onChangeEmailAttachments(emailAttachments.filter((item) => item !== file))
                        }
                        className="text-[#939084] transition-colors hover:text-[#36342e]"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </span>
                  ))}
                  <Button
                    unstyled
                    type="button"
                    title="添加附件（brief、报价单等）"
                    onClick={() => attachmentInputRef.current?.click()}
                    className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffdf9] px-2 text-[10px] font-semibold text-[#939084] transition-all hover:border-[#ff4f00]/45 hover:bg-[#fff7f4] hover:text-[#ff4f00] active:scale-[0.99]"
                  >
                    <Paperclip className="h-3 w-3" />
                    {emailAttachments.length > 0 ? `${emailAttachments.length} 个附件` : "附件"}
                  </Button>
                </div>
                {isPreviewConfirmed ? (
                  <Button
                    unstyled
                    type="button"
                    title="点击撤销确认"
                    onClick={onToggleConfirmPreview}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[8px] border border-[#ff4f00]/40 bg-[#fff1ea] px-3 text-[11px] font-semibold text-[#ff4f00] transition-colors hover:bg-[#ffe7db] active:scale-[0.99]"
                  >
                    <CircleCheck className="h-3 w-3" />
                    已确认
                  </Button>
                ) : (
                  <Button
                    unstyled
                    type="button"
                    onClick={onToggleConfirmPreview}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[8px] bg-[#ff4f00] px-3 text-[11px] font-semibold text-[#fffdf9] transition-colors hover:bg-[#ff4f00]/90 active:scale-[0.99]"
                  >
                    <Check className="h-3 w-3" />
                    确认内容
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {unconfirmedRecipientCount > 0 ? (
        <div className="mt-2.5 flex items-start gap-1.5 rounded-[8px] border border-[#ff4f00]/30 bg-[#fff7f4] px-2.5 py-1.5 text-[11px] leading-[1.5] text-[#36342e]">
          <Eye className="mt-0.5 h-3 w-3 shrink-0 text-[#ff4f00]" />
          <span>
            还有 <span className="font-semibold text-[#ff4f00]">{unconfirmedRecipientCount}</span>{" "}
            位未确认，逐位查看后点「确认这封内容」
          </span>
        </div>
      ) : null}

      <div className="relative mt-3">
        <div className="flex overflow-hidden rounded-[8px] bg-[#ff4f00] text-[#fffdf9]">
          <Button
            unstyled
            type="button"
            disabled={!canOpenEmailReview}
            onClick={onSendAction}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors hover:bg-[#ff4f00] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#b5b2aa] disabled:text-[#fffefb]/70"
          >
            {sendMode === "scheduled" ? (
              <CalendarClock className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sendMode === "scheduled"
              ? emailRecipientCount > 1
                ? `定时 ${emailRecipientCount} 人`
                : "确认定时"
              : emailRecipientCount > 1
                ? `一键建联 ${emailRecipientCount} 人`
                : "一键建联"}
          </Button>
          <Button
            unstyled
            type="button"
            aria-label="选择发送方式"
            aria-haspopup="menu"
            aria-expanded={sendMenuOpen}
            onClick={onToggleSendMenu}
            className="inline-flex h-10 w-10 items-center justify-center border-l border-[#fffefb]/18 transition-colors hover:bg-[#ff4f00] active:scale-[0.99]"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", sendMenuOpen && "rotate-180")}
            />
          </Button>
        </div>

        {sendMenuOpen ? (
          <div className="absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb]">
            <Button
              unstyled
              type="button"
              role="menuitem"
              onClick={() => onChangeSendMode("now")}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#fffdf9]",
                sendMode === "now" ? "font-semibold text-[#ff4f00]" : "text-[#36342e]",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Send className="h-4 w-4" />
                立即发送
              </span>
              {sendMode === "now" ? <Check className="h-4 w-4" /> : null}
            </Button>
            <Button
              unstyled
              type="button"
              role="menuitem"
              onClick={() => onChangeSendMode("scheduled")}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#fffdf9]",
                sendMode === "scheduled" ? "font-semibold text-[#ff4f00]" : "text-[#36342e]",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                定时发送
              </span>
              {sendMode === "scheduled" ? <Check className="h-4 w-4" /> : null}
            </Button>
          </div>
        ) : null}
      </div>

      {sendMode === "scheduled" ? (
        <div className="mt-2.5 rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <CalendarClock className="h-3.5 w-3.5 text-[#ff4f00]" />
            定时发送
          </div>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => onChangeScheduledAt(event.target.value)}
            className="h-9 w-full rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-3 text-sm text-[#201515] transition-colors outline-none focus:border-[#ff4f00]/35"
          />
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#939084]">
            <Clock3 className="h-3 w-3" />
            {scheduledAt ? `将在 ${formatScheduleLabel(scheduledAt)} 发送` : "选择一个发送时间"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
