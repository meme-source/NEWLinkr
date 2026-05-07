"use client";

import { useRef } from "react";
import { Eye, EyeOff, Paperclip, X } from "lucide-react";
import type { Creator } from "@/types/api";
import { VARIABLE_TOKENS } from "@/features/library/data/outreach";
import { formatFileSize, interpolate } from "./bulk-outreach-utils";

interface Props {
  body: string;
  onBodyChange: (next: string) => void;
  attachments: File[];
  onAttach: (files: FileList | null) => void;
  onRemoveAttachment: (file: File) => void;
  previewOn: boolean;
  onTogglePreview: () => void;
  previewCreator: Creator | null;
}

export function BulkOutreachBodyEditor({
  body,
  onBodyChange,
  attachments,
  onAttach,
  onRemoveAttachment,
  previewOn,
  onTogglePreview,
  previewCreator,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const previewBody = previewOn && previewCreator ? interpolate(body, previewCreator) : body;

  const handleInsertVariable = (token: string) => {
    const el = bodyRef.current;
    if (!el) {
      onBodyChange(body + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    onBodyChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + token.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-[11px] font-medium text-[#939084]">邮件正文</label>
          <button
            type="button"
            onClick={onTogglePreview}
            disabled={!previewCreator || body.trim().length === 0}
            className="inline-flex items-center gap-1 text-[11px] text-[#939084] hover:text-[#ff4f00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewOn ? (
              <>
                <EyeOff className="h-3 w-3" />
                返回编辑
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                预览首位收件人
              </>
            )}
          </button>
        </div>

        {!previewOn && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {VARIABLE_TOKENS.map((v) => (
              <button
                key={v.token}
                type="button"
                onClick={() => handleInsertVariable(v.token)}
                className="inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2 py-0.5 text-[11px] text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
                title={`插入 ${v.label}`}
              >
                <code className="font-mono text-[10.5px]">{v.token}</code>
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={bodyRef}
          value={previewOn ? previewBody : body}
          onChange={(event) => onBodyChange(event.target.value)}
          disabled={previewOn}
          rows={10}
          placeholder={"Hi {{handle}},\n\n我注意到你最近的内容..."}
          className="w-full rounded-xl border border-[#c5c0b1] bg-[#fffdf9] p-3 text-[13px] leading-[1.6] outline-none focus:border-[#ff4f00] disabled:cursor-not-allowed disabled:bg-[#eceae3]"
        />
        <div className="mt-1 flex items-center justify-between text-[10.5px] text-[#939084]">
          <span>
            {previewOn && previewCreator
              ? `预览：${previewCreator.handle}`
              : "占位符在发送时按收件人替换"}
          </span>
          <span>{body.length} 字</span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-[#939084]">附件</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            onAttach(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2.5 text-[11px] text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
          >
            <Paperclip className="h-3 w-3" />
            添加附件
          </button>
          {attachments.map((file) => (
            <span
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffdf9] pr-1 pl-2.5 text-[11px] text-[#36342e]"
            >
              <span className="max-w-[160px] truncate">{file.name}</span>
              <span className="text-[#b5b2aa]">{formatFileSize(file.size)}</span>
              <button
                type="button"
                aria-label={`移除 ${file.name}`}
                onClick={() => onRemoveAttachment(file)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#939084] hover:bg-[#eceae3] hover:text-[#36342e]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
