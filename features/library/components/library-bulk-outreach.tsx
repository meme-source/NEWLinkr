"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ChevronDown, Clock3, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Creator } from "@/types/api";
import {
  MOCK_SENDER_ACCOUNTS,
  OUTREACH_TEMPLATES,
  type OutreachTemplate,
} from "@/features/library/data/outreach";
import { BulkOutreachBodyEditor } from "./bulk-outreach-body-editor";
import { BulkOutreachSendButton, type BulkOutreachSendMode } from "./bulk-outreach-send-button";
import { formatScheduleLabel, getDefaultScheduleAt, interpolate } from "./bulk-outreach-utils";

export interface BulkOutreachPayload {
  subject: string;
  body: string;
  senderId: string | null;
  senderAddress: string | null;
  templateKey: string | null;
  attachmentNames: string[];
  sendMode: BulkOutreachSendMode;
  scheduledAt: string | null;
  recipientIds: string[];
}

interface Props {
  open: boolean;
  creators: Creator[];
  onClose: () => void;
  onSend: (payload: BulkOutreachPayload) => void;
}

export function LibraryBulkOutreach({ open, creators, onClose, onSend }: Props) {
  const [senderId, setSenderId] = useState<string>(MOCK_SENDER_ACCOUNTS[0]?.id ?? "");
  const [templateKey, setTemplateKey] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendMode, setSendMode] = useState<BulkOutreachSendMode>("now");
  const [scheduledAt, setScheduledAt] = useState(getDefaultScheduleAt);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [previewOn, setPreviewOn] = useState(false);

  const sender = useMemo(
    () => MOCK_SENDER_ACCOUNTS.find((a) => a.id === senderId) ?? null,
    [senderId],
  );
  const template: OutreachTemplate | null = useMemo(
    () => OUTREACH_TEMPLATES.find((t) => t.key === templateKey) ?? null,
    [templateKey],
  );

  if (!open) return null;

  const ready =
    sender !== null &&
    creators.length > 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    (sendMode === "now" || (sendMode === "scheduled" && scheduledAt.length > 0));

  const previewCreator = creators[0] ?? null;
  const previewSubject =
    previewOn && previewCreator ? interpolate(subject, previewCreator) : subject;

  const handleSelectTemplate = (key: string) => {
    setTemplateKey(key);
    const next = OUTREACH_TEMPLATES.find((t) => t.key === key);
    // 切换到具体模板：填入预设 subject/body，用户仍可手动改写。
    // 切回 "请选择模板" 时不清空当前编辑——避免误清。
    if (next) {
      setSubject(next.subject);
      setBody(next.body);
    }
  };

  const reset = () => {
    setSubject("");
    setBody("");
    setAttachments([]);
    setTemplateKey("");
    setSendMode("now");
    setSendMenuOpen(false);
    setPreviewOn(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSend = () => {
    if (!ready) return;
    onSend({
      subject: subject.trim(),
      body: body.trim(),
      senderId: sender?.id ?? null,
      senderAddress: sender?.address ?? null,
      templateKey: template?.key ?? null,
      attachmentNames: attachments.map((f) => f.name),
      sendMode,
      scheduledAt: sendMode === "scheduled" ? scheduledAt : null,
      recipientIds: creators.map((c) => c.id),
    });
    reset();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(20,20,19,0.32)] px-4 py-6"
      onClick={handleClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#c5c0b1] px-4 py-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#201515]">
            <Mail className="h-4 w-4 text-[#ff4f00]" />
            一键建联
            <span className="rounded-full bg-[#fff7f4] px-2 py-0.5 text-[11px] font-medium text-[#ff4f00]">
              {creators.length} 位博主
            </span>
          </div>
          <Button
            unstyled
            type="button"
            onClick={handleClose}
            aria-label="关闭"
            className="rounded-full p-1 text-[#939084] hover:bg-[#fffdf9]"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* Recipients chips */}
          <div className="flex flex-wrap gap-1">
            {creators.slice(0, 12).map((creator) => (
              <span
                key={creator.id}
                className="rounded-full border border-[#c5c0b1] bg-[#fffdf9] px-2 py-0.5 text-[11px] text-[#36342e]"
              >
                {creator.handle}
              </span>
            ))}
            {creators.length > 12 && (
              <span className="rounded-full px-2 py-0.5 text-[11px] text-[#939084]">
                +{creators.length - 12}
              </span>
            )}
          </div>

          {/* Sender + Template */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="发送账号">
              <Select
                value={senderId}
                onChange={setSenderId}
                placeholder="未配置发件账户"
                options={MOCK_SENDER_ACCOUNTS.map((a) => ({
                  value: a.id,
                  label: a.address,
                  hint: a.label,
                }))}
              />
            </Field>
            <Field label="邮件模板">
              <Select
                value={templateKey}
                onChange={handleSelectTemplate}
                placeholder="请选择模板（可选）"
                options={OUTREACH_TEMPLATES.map((t) => ({ value: t.key, label: t.label }))}
              />
              {template && (
                <div className="mt-1 px-1 text-[11px] leading-[1.45] text-[#939084]">
                  {template.summary}
                </div>
              )}
            </Field>
          </div>

          {/* Subject */}
          <Field label="邮件标题">
            <input
              value={previewOn ? previewSubject : subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={previewOn}
              placeholder="Hi {{handle}}，关于一次合作..."
              className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-[13px] outline-none focus:border-[#ff4f00] disabled:cursor-not-allowed disabled:bg-[#eceae3]"
            />
          </Field>

          <BulkOutreachBodyEditor
            body={body}
            onBodyChange={setBody}
            attachments={attachments}
            onAttach={(files) => {
              if (!files || files.length === 0) return;
              setAttachments((prev) => [...prev, ...Array.from(files)]);
            }}
            onRemoveAttachment={(file) => setAttachments((prev) => prev.filter((f) => f !== file))}
            previewOn={previewOn}
            onTogglePreview={() => setPreviewOn((v) => !v)}
            previewCreator={previewCreator}
          />

          {/* Schedule (only when scheduled mode) */}
          {sendMode === "scheduled" && (
            <div className="rounded-lg border border-[#c5c0b1] bg-[#fffdf9] p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#939084]">
                <CalendarClock className="h-3.5 w-3.5 text-[#ff4f00]" />
                定时发送
              </div>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="h-9 w-full rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 text-[13px] text-[#201515] outline-none focus:border-[#ff4f00]"
              />
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#939084]">
                <Clock3 className="h-3 w-3" />
                {scheduledAt ? `将在 ${formatScheduleLabel(scheduledAt)} 发送` : "请选择发送时间"}
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#c5c0b1] bg-[#fffdf9] px-4 py-3">
          <div className="text-[11px] text-[#939084]">
            {creators.length} 位博主 · {attachments.length} 个附件
            {sender ? ` · 发件 ${sender.address}` : ""}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              unstyled
              type="button"
              onClick={handleClose}
              className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3.5 py-1.5 text-[12px] text-[#36342e] hover:bg-[#fffdf9]"
            >
              取消
            </Button>
            <BulkOutreachSendButton
              ready={ready}
              sendMode={sendMode}
              menuOpen={sendMenuOpen}
              recipientCount={creators.length}
              onToggleMenu={() => setSendMenuOpen((v) => !v)}
              onSelectMode={(mode) => {
                setSendMode(mode);
                setSendMenuOpen(false);
              }}
              onSend={handleSend}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[#939084]">{label}</label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string; hint?: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-full border border-[#c5c0b1] bg-[#fffdf9] px-3 pr-9 text-[13px] text-[#201515] transition-colors outline-none focus:border-[#ff4f00]"
      >
        <option value="" className="bg-[#fffefb] text-[#939084]">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#fffefb] text-[#201515]">
            {o.label}
            {o.hint ? `（${o.hint}）` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#36342e]" />
    </div>
  );
}
