"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Tag as TagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

// Unified tag-chip surface (matches the web library's userTag style in
// features/library/components/library-row.tsx → keeps "我打的标签" visually
// consistent between the plugin and the workspace).
const CHIP_CLASSES = "border border-[#c5c0b1] bg-[#fff7f4] text-[#ff4f00]";

export function SidebarTagRow({
  tags,
  onAdd,
  onEdit,
  onRemove,
}: {
  tags: string[];
  onAdd: (label: string) => void;
  onEdit: (oldLabel: string, newLabel: string) => void;
  onRemove: (label: string) => void;
}) {
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [addValue, setAddValue] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Tags overflow the single-row strip when they don't all fit; the row clips
  // them (`overflow-hidden`). On hover we surface a portaled tooltip listing
  // every tag (wrapped) so nothing stays hidden. Portal escapes the sidebar
  // card's own `overflow-hidden`.
  const rowRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const handleRowEnter = () => {
    const row = rowRef.current;
    const chips = chipsRef.current;
    if (!row || !chips) return;
    // Only show the tooltip when the chip strip is actually clipped, and not
    // while an inline input is open (the input, not chips, owns the space).
    const overflowing = chips.scrollWidth > chips.clientWidth + 1;
    if (!overflowing || adding || editingLabel !== null || tags.length === 0) return;
    const rect = row.getBoundingClientRect();
    setTipPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);
  useEffect(() => {
    if (editingLabel !== null) editInputRef.current?.select();
  }, [editingLabel]);

  const commitEdit = () => {
    if (editingLabel !== null) {
      onEdit(editingLabel, editValue);
      setEditingLabel(null);
    }
  };
  const commitAdd = () => {
    const v = addValue.trim();
    if (v) onAdd(v);
    setAddValue("");
    setAdding(false);
  };

  // No fixed tag cap — tags overflow into the hover tooltip rather than being
  // blocked. The "+" affordance stays available as long as no input is open.
  const canAdd = true;

  // Layout: single rectangular row, icon inside on the left, chips/input in
  // the middle, "+" affordance pinned to the right. Mirrors the floating-card
  // reference image and pairs visually with `SidebarEmailCopy` (same h-7,
  // rounded-[8px], sand border) so the email row and tag row read as two
  // sibling strips.
  return (
    <div
      ref={rowRef}
      onMouseEnter={handleRowEnter}
      onMouseLeave={() => setTipPos(null)}
      className="flex h-7 min-w-0 items-center gap-1.5 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2"
    >
      <TagIcon className="h-3.5 w-3.5 shrink-0 text-[#939084]" aria-hidden />

      <div ref={chipsRef} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {tags.length === 0 && !adding ? (
          <Button
            unstyled
            type="button"
            onClick={() => setAdding(true)}
            className="truncate text-left text-[11px] text-[#939084] transition-colors hover:text-[#ff4f00]"
          >
            + 打标签
          </Button>
        ) : null}

        {tags.map((tag) => {
          const isEditing = editingLabel === tag;
          return (
            <span
              key={tag}
              className={`inline-flex max-w-full shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] leading-none ${CHIP_CLASSES}`}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingLabel(null);
                  }}
                  style={{ width: Math.max(editValue.length, 3) * 7 + 4 }}
                  className="min-w-[24px] bg-transparent text-[11px] outline-none"
                />
              ) : (
                <>
                  <Button
                    unstyled
                    type="button"
                    onClick={() => {
                      setEditingLabel(tag);
                      setEditValue(tag);
                    }}
                    className="max-w-[80px] truncate"
                  >
                    {tag}
                  </Button>
                  <Button
                    unstyled
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(tag);
                    }}
                    aria-label={`删除标签 ${tag}`}
                    className="ml-0.5 leading-none opacity-60 transition-opacity hover:opacity-100"
                  >
                    ×
                  </Button>
                </>
              )}
            </span>
          );
        })}

        {adding ? (
          <input
            ref={addInputRef}
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setAddValue("");
              }
            }}
            placeholder="标签…"
            style={{ width: Math.max(addValue.length, 4) * 7 + 20 }}
            className="min-w-[48px] bg-transparent text-[11px] text-[#201515] outline-none placeholder:text-[#939084]"
          />
        ) : null}
      </div>

      {canAdd && !adding ? (
        <Button
          unstyled
          type="button"
          onClick={() => setAdding(true)}
          aria-label="打标签"
          className="shrink-0 text-[#939084] transition-colors hover:text-[#ff4f00]"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      ) : null}

      {tipPos && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              style={{ top: tipPos.top, left: tipPos.left, minWidth: tipPos.width }}
              className="fixed z-[1001] max-w-[260px] rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] p-2 shadow-lg shadow-[rgba(20,20,19,0.12)]"
            >
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-none ${CHIP_CLASSES}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
