"use client";

import { Link as LinkIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { T } from "../../data/tokens";
import type { ProductChip } from "./types";
import { extractUrl, mockProductTitle, normalizeChipUrl } from "./url-extract";

interface ProductInputProps {
  chip: ProductChip | null;
  note: string;
  onChange: (next: { chip: ProductChip | null; note: string }) => void;
  onSubmit?: () => void;
  /** Submit-on-Enter is disabled while loading or other gates are open. */
  disabled?: boolean;
}

/**
 * Smart product input. Single contenteditable that handles two visual states:
 *  - No chip: full-width input with placeholder.
 *  - Chip + note: chip renders inline-left, contenteditable becomes the note
 *    continuation so the two read as one product entry (per spec §3.4 「描述区视觉」).
 *
 * Triggers extraction on paste / Enter / blur. Mid-typing input never converts —
 * users typing a description shouldn't get interrupted.
 */
export function ProductInput({ chip, note, onChange, onSubmit, disabled }: ProductInputProps) {
  const editableRef = useRef<HTMLSpanElement>(null);
  // Keep the contenteditable's textContent in sync with `note` only when
  // the source-of-truth changes externally (e.g. mode switch, chip drop).
  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    if (el.textContent === note) return;
    el.textContent = note;
  }, [note]);

  // Async metadata fetch — replaces the chip with the resolved title once done.
  const fetchTitle = useCallback(
    (url: string) => {
      const t = setTimeout(() => {
        onChange({
          chip: { url, title: mockProductTitle(url), loading: false },
          note: editableRef.current?.textContent ?? "",
        });
      }, 900);
      return () => clearTimeout(t);
    },
    [onChange],
  );

  const tryExtract = useCallback(() => {
    const text = editableRef.current?.textContent ?? "";
    if (!text.trim()) return;
    const extracted = extractUrl(text);
    if (!extracted) return;
    const url = normalizeChipUrl(extracted.url);
    onChange({
      chip: { url, title: "", loading: true },
      note: extracted.rest,
    });
    fetchTitle(url);
  }, [fetchTitle, onChange]);

  const handlePaste = useCallback(() => {
    // Wait for the browser to commit the pasted text into textContent.
    setTimeout(tryExtract, 0);
  }, [tryExtract]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (chip) {
          if (!disabled) onSubmit?.();
          return;
        }
        tryExtract();
        // If the text didn't contain a URL, treat Enter as submit.
        const updated = editableRef.current?.textContent ?? "";
        const hasUrl = extractUrl(updated) !== null;
        if (!hasUrl && !disabled) onSubmit?.();
      }
    },
    [chip, disabled, onSubmit, tryExtract],
  );

  const handleBlur = useCallback(() => {
    const text = editableRef.current?.textContent ?? "";
    if (chip) {
      // Chip already exists — just sync the note.
      onChange({ chip, note: text });
      return;
    }
    // No chip — convert if the blurred text contains one.
    const extracted = extractUrl(text);
    if (extracted) {
      tryExtract();
    } else {
      onChange({ chip: null, note: text });
    }
  }, [chip, onChange, tryExtract]);

  const handleInput = useCallback(() => {
    // Track raw text only — no auto-conversion mid-typing.
    const text = editableRef.current?.textContent ?? "";
    onChange({ chip, note: text });
  }, [chip, onChange]);

  const removeChip = useCallback(() => {
    onChange({ chip: null, note });
    // Defer focus so the contenteditable rerenders without the chip first.
    setTimeout(() => {
      const el = editableRef.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }, 0);
  }, [note, onChange]);

  return (
    <span className="inline-flex max-w-full flex-wrap items-baseline gap-y-1">
      {chip ? <ChipPill chip={chip} onRemove={removeChip} /> : null}
      <span
        ref={editableRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="false"
        spellCheck={false}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        data-placeholder={chip ? "可补充描述（选填）" : "粘贴产品链接，或写一句话描述"}
        className={chip ? "product-input-note" : "product-input-bare"}
        style={chip ? noteStyle : bareStyle}
      />
      <style jsx>{`
        .product-input-bare:empty:before,
        .product-input-note:empty:before {
          content: attr(data-placeholder);
          color: ${T.stone};
          pointer-events: none;
        }
        .product-input-note:empty:before {
          font-size: 13px;
          color: ${T.stone};
          opacity: 0.7;
        }
        .product-input-bare:hover {
          border-color: ${T.borderLight};
        }
        .product-input-bare:focus {
          border-color: ${T.border};
          background: white;
          border-style: solid;
        }
        .product-input-note:hover {
          background: rgba(32, 21, 21, 0.025);
        }
        .product-input-note:focus {
          background: rgba(32, 21, 21, 0.045);
        }
      `}</style>
    </span>
  );
}

const bareStyle: React.CSSProperties = {
  display: "inline-block",
  minWidth: 240,
  maxWidth: 520,
  padding: "3px 10px",
  borderRadius: 8,
  outline: "none",
  fontSize: 14.5,
  lineHeight: 1.5,
  color: T.nearBlack,
  border: "1px dashed transparent",
  cursor: "text",
  wordBreak: "break-all",
  transition: "all 140ms ease",
};

const noteStyle: React.CSSProperties = {
  display: "inline-block",
  minWidth: 140,
  maxWidth: 420,
  marginLeft: 6,
  padding: "3px 6px",
  borderRadius: 6,
  outline: "none",
  fontSize: 13.5,
  lineHeight: 1.5,
  color: T.charcoal,
  border: "1px solid transparent",
  background: "transparent",
  cursor: "text",
  wordBreak: "break-all",
  transition: "background 140ms ease",
};

function ChipPill({ chip, onRemove }: { chip: ProductChip; onRemove: () => void }) {
  return (
    <span
      className="inline-flex max-w-[420px] items-center gap-1.5 rounded-[8px] border bg-white px-[8px] py-[3px] align-baseline text-[13.5px] leading-[1.5]"
      style={{ borderColor: chip.loading ? T.terracotta : T.borderLight }}
    >
      <LinkIcon
        size={11}
        strokeWidth={2.4}
        style={{ color: chip.loading ? T.terracotta : T.stone }}
        aria-hidden
      />
      <span className="max-w-[200px] truncate" style={{ color: T.charcoal }} title={chip.url}>
        {chip.url}
      </span>
      <span
        className="text-[12.5px]"
        style={{
          color: chip.loading ? T.terracotta : T.stone,
          fontStyle: chip.loading ? "italic" : "normal",
        }}
      >
        · {chip.loading ? "解析中..." : chip.title || "已识别产品"}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="移除产品"
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded text-[--c] transition-colors hover:bg-[--bg]"
        style={{
          ["--c" as string]: T.stone,
          ["--bg" as string]: T.parchment,
        }}
      >
        <X size={11} strokeWidth={2.4} />
      </button>
    </span>
  );
}
