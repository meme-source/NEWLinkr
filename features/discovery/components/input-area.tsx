"use client";

import { ArrowUp, Info, Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatChips, ChatIntent } from "../chat-types";
import { INTENT_HERO, INTENT_ORDER, TEMPLATE_PLACEHOLDER } from "../data/intent-hero";
import { T } from "../data/tokens";
import { ChipBar } from "./chip-bar";

interface InputAreaProps {
  intent: ChatIntent;
  onIntentChange: (next: ChatIntent) => void;
  value: string;
  onChange: (next: string) => void;
  chips: ChatChips;
  onChipsChange: (next: ChatChips) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  /** When true, surfaces a permanent ⓘ tooltip near the active tab. */
  showInfoTooltip: boolean;
}

const TEXTAREA_MAX_HEIGHT = 168;

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
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-[260px] -translate-x-1/2 rounded-[12px] border bg-[#fffefb] px-3 py-2.5 text-left opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
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

/**
 * Returns [start, end] of the placeholder occurrence that contains `cursor`,
 * or null if `cursor` does not fall inside any placeholder range.
 */
function findPlaceholderRangeAt(value: string, cursor: number): [number, number] | null {
  let from = 0;
  while (from <= value.length) {
    const idx = value.indexOf(TEMPLATE_PLACEHOLDER, from);
    if (idx < 0) return null;
    const end = idx + TEMPLATE_PLACEHOLDER.length;
    if (cursor >= idx && cursor <= end) return [idx, end];
    from = end;
  }
  return null;
}

type OverlayPart = { kind: "text"; text: string } | { kind: "chip" };

function buildOverlayParts(value: string): OverlayPart[] {
  const parts: OverlayPart[] = [];
  let cursor = 0;
  while (cursor <= value.length) {
    const idx = value.indexOf(TEMPLATE_PLACEHOLDER, cursor);
    if (idx < 0) {
      if (cursor < value.length) parts.push({ kind: "text", text: value.slice(cursor) });
      break;
    }
    if (idx > cursor) parts.push({ kind: "text", text: value.slice(cursor, idx) });
    parts.push({ kind: "chip" });
    cursor = idx + TEMPLATE_PLACEHOLDER.length;
  }
  return parts;
}

interface PromptOverlayProps {
  value: string;
  scrollTop: number;
}

/**
 * Visual mirror of the textarea content. Renders identical text metrics so
 * the textarea (with `color: transparent`) appears to have inline pill
 * decorations around `TEMPLATE_PLACEHOLDER`. The textarea remains the source
 * of truth — this layer is purely decorative and ignores pointer events.
 */
function PromptOverlay({ value, scrollTop }: PromptOverlayProps) {
  const parts = buildOverlayParts(value);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-3 text-[14.5px] leading-[1.6] break-words whitespace-pre-wrap"
      style={{
        color: T.nearBlack,
        transform: `translateY(${-scrollTop}px)`,
        fontFamily: "inherit",
      }}
    >
      {parts.map((part, index) =>
        part.kind === "text" ? (
          <span key={index}>{part.text}</span>
        ) : (
          <span
            key={index}
            className="rounded-[6px] font-medium"
            style={{
              color: T.terracotta,
              backgroundColor: "rgba(201, 100, 66, 0.10)",
              boxShadow: "inset 0 0 0 1px rgba(201, 100, 66, 0.32)",
              padding: "1px 4px",
              margin: "0 -4px",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {TEMPLATE_PLACEHOLDER}
          </span>
        ),
      )}
      {/* Match the textarea's reserved trailing line when value ends with newline */}
      {value.endsWith("\n") ? "​" : ""}
    </div>
  );
}

export function InputArea({
  intent,
  onIntentChange,
  value,
  onChange,
  chips,
  onChipsChange,
  onSubmit,
  disabled,
  placeholder,
  showInfoTooltip,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
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

  function selectPlaceholderAtCursor() {
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart ?? 0;
    const range = findPlaceholderRangeAt(el.value, cursor);
    if (range) el.setSelectionRange(range[0], range[1]);
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
    setScrollTop(el.scrollTop);
  }, [value]);

  const canSubmit = value.trim().length > 0 && !value.includes(TEMPLATE_PLACEHOLDER) && !disabled;

  return (
    <div className="w-full">
      <div
        className="rounded-[22px] border bg-[#fffefb] transition-colors"
        style={{
          borderColor: focused ? T.terracotta : T.border,
        }}
      >
        {/* Tabs row */}
        <div
          className="flex items-center gap-1 border-b px-3 pt-2"
          style={{ borderColor: T.borderLight }}
        >
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
                  className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[#fffefb]"
                  style={{ color: T.stone }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {/* Editor: textarea + decorative slot-pill overlay */}
        <div className="relative px-4 pt-3">
          <PromptOverlay value={value} scrollTop={scrollTop} />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onClick={selectPlaceholderAtCursor}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            placeholder={placeholder}
            rows={1}
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            className="relative min-h-[28px] w-full resize-none bg-transparent text-[14.5px] leading-[1.6] outline-none placeholder:text-[#939084] [&::-webkit-scrollbar]:hidden"
            style={{
              color: "transparent",
              caretColor: T.nearBlack,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
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
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-[#fffefb]"
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
