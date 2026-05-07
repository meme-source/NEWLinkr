"use client";

import { ArrowUp, Info, Paperclip, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import type { ChatChips, ChatIntent } from "../chat-types";
import { INTENT_HERO, INTENT_ORDER } from "../data/intent-hero";
import { T } from "../data/tokens";
import { ChipBar } from "./chip-bar";
import { isEditorEmpty, StructuredEditor } from "./structured-editor/structured-editor";
import type { StructuredEditorState } from "./structured-editor/types";

interface InputAreaProps {
  intent: ChatIntent;
  onIntentChange: (next: ChatIntent) => void;
  editorState: StructuredEditorState;
  onEditorChange: (next: StructuredEditorState) => void;
  chips: ChatChips;
  onChipsChange: (next: ChatChips) => void;
  onSubmit: () => void;
  disabled: boolean;
  /** When true, surfaces a permanent ⓘ tooltip near the active tab. */
  showInfoTooltip: boolean;
  /**
   * Optional content rendered as the topmost row of the input card. Used to
   * pin the project context (project switcher) to the same visual unit as
   * the product input — see discovery-split-view §A.
   */
  contextSlot?: ReactNode;
}

function IntentTooltip({ intent }: { intent: ChatIntent }) {
  const spec = INTENT_HERO[intent];
  return (
    <span className="group relative inline-flex">
      <span
        role="img"
        aria-label="查看说明"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors"
        style={{ color: T.stone }}
      >
        <Info size={13} />
      </span>
      <span
        role="tooltip"
        className="bg-background pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-[260px] -translate-x-1/2 rounded-[12px] border px-3 py-2.5 text-left opacity-0 shadow-[0_18px_44px_-26px_rgba(20,20,19,0.32)] transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
        style={{ borderColor: T.border }}
      >
        <span
          className="block text-[12.5px] leading-[1.4] font-semibold"
          style={{ color: T.nearBlack }}
        >
          {spec.question}
        </span>
        <span className="mt-1 block text-[11.5px] leading-[1.55]" style={{ color: T.charcoal }}>
          {spec.oneLiner}
        </span>
      </span>
    </span>
  );
}

export function InputArea({
  intent,
  onIntentChange,
  editorState,
  onEditorChange,
  chips,
  onChipsChange,
  onSubmit,
  disabled,
  showInfoTooltip,
  contextSlot,
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

  const canSubmit = !isEditorEmpty(editorState) && !disabled;

  return (
    <div className="w-full">
      <div
        className="bg-background rounded-[22px] border shadow-[0_24px_60px_-32px_rgba(20,20,19,0.18)] transition-colors"
        style={{
          borderColor: focused ? T.terracotta : T.border,
        }}
      >
        {/* Tabs + context row — Tab nav (left) and project switcher (right)
            share a single border-bottom that runs the full width. The
            context slot renders at the right edge as a ghost-style button
            so it never competes with the active-tab orange. */}
        <div
          className="flex items-center justify-between gap-2 border-b pt-2 pr-3 pl-3"
          style={{ borderColor: T.borderLight }}
        >
          <div className="flex items-center gap-1">
            {INTENT_ORDER.map((id) => {
              const active = id === intent;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onIntentChange(id)}
                  className="relative inline-flex items-center gap-1.5 px-3 pt-2 pb-2.5 text-[13px] font-medium transition-colors"
                  style={{
                    color: active ? T.terracotta : T.stone,
                  }}
                >
                  {INTENT_HERO[id].tabLabel}
                  {active && showInfoTooltip ? <IntentTooltip intent={id} /> : null}
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute right-3 bottom-[-1px] left-3 h-[2px] rounded-full"
                      style={{ backgroundColor: T.terracotta }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          {contextSlot ? <div className="flex items-center pb-1.5">{contextSlot}</div> : null}
        </div>

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
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  aria-label={`移除 ${file.name}`}
                  className="hover:bg-background ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors"
                  style={{ color: T.stone }}
                >
                  <X size={11} />
                </button>
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

        {/* Chip + submit row */}
        <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilesSelected} />
            <button
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
            </button>
            <ChipBar chips={chips} onChange={onChipsChange} />
          </div>
          <button
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
          </button>
        </div>
      </div>
    </div>
  );
}
