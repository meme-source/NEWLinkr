"use client";

import { ArrowUp, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ChatChips, ChatIntent } from "../chat-types";
import { T } from "../data/tokens";
import { getDimension, isAnchorSatisfied } from "../v2/dimensions";
import { ChipBar } from "./chip-bar";
import { StructuredEditor } from "./structured-editor/structured-editor";
import type { StructuredEditorState } from "./structured-editor/types";

interface InputAreaProps {
  intent: ChatIntent;
  editorState: StructuredEditorState;
  onEditorChange: (next: StructuredEditorState) => void;
  chips: ChatChips;
  onChipsChange: (next: ChatChips) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function InputArea({
  intent,
  editorState,
  onEditorChange,
  chips,
  onChipsChange,
  onSubmit,
  disabled,
}: InputAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [focused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setAttachments((prev) => [...prev, ...Array.from(files)]);
    event.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // 提交门禁按维度锚点判定 —— 竞品要竞品/产品、场景要产品、爆款/低粉要品类/产品。
  const canSubmit = isAnchorSatisfied(intent, editorState) && !disabled;

  return (
    <div className="w-full">
      <div
        className="bg-background rounded-lg border shadow-[0_24px_60px_-32px_rgba(20,20,19,0.18)] transition-colors"
        style={{
          borderColor: focused ? T.terracotta : T.border,
        }}
      >
        {/* Attachments */}
        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-4 pt-3">
            {attachments.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px]"
                style={{
                  backgroundColor: T.parchment,
                  borderColor: T.borderLight,
                  color: T.charcoal,
                }}
              >
                <Paperclip size={11} style={{ color: T.stone }} aria-hidden />
                <span className="truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="shrink-0 text-[10.5px]" style={{ color: T.stone }}>
                  {formatFileSize(file.size)}
                </span>
                <Button
                  unstyled
                  type="button"
                  onClick={() => removeAttachment(index)}
                  aria-label={`移除 ${file.name}`}
                  className="hover:bg-background ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors"
                  style={{ color: T.stone }}
                >
                  <X size={11} />
                </Button>
              </span>
            ))}
          </div>
        ) : null}

        {/* Structured editor — replaces the legacy textarea per v2 mock §2/§3 */}
        <div className="px-4 pt-3 pb-1">
          <StructuredEditor
            intent={intent}
            state={editorState}
            onChange={onEditorChange}
            onSubmit={onSubmit}
            disabled={disabled}
          />
        </div>

        {/* 锚点缺失时的对话式追问 —— 缺必填锚点是硬阻断,但用一句温和的提示
            代替表单红字报错(产品决策:2a 补全用对话,不用 form error)。 */}
        {!canSubmit && !disabled ? (
          <div className="px-4 pt-1 pb-1 text-[12px] leading-relaxed" style={{ color: T.stone }}>
            {getDimension(intent).anchorMissingPrompt}
          </div>
        ) : null}

        {/* Chip + submit row */}
        <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilesSelected} />
            <Button
              unstyled
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="添加文件"
              title="添加文件"
              className="hover:bg-background inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors"
              style={{
                backgroundColor: "white",
                borderColor: T.border,
                color: T.stone,
              }}
            >
              <Paperclip size={14} />
            </Button>
            <ChipBar chips={chips} onChange={onChipsChange} />
          </div>
          <Button
            unstyled
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-label="提交"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSubmit ? T.terracotta : T.borderLight,
              color: canSubmit ? "white" : T.stone,
            }}
          >
            <ArrowUp size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
