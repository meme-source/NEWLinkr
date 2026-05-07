"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Tag as TagIcon } from "lucide-react";

import { chipToneFor } from "./chip-palette";
import { BORDER, SURFACE, TEXT } from "./tokens";

interface InfluencerCardTagInputProps {
  tags: string[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
  onEdit: (oldLabel: string, newLabel: string) => void;
  maxTags?: number;
}

export function InfluencerCardTagInput({
  tags,
  onAdd,
  onRemove,
  onEdit,
  maxTags = 3,
}: InfluencerCardTagInputProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const addRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) addRef.current?.focus();
  }, [adding]);

  useEffect(() => {
    if (editing !== null) editRef.current?.select();
  }, [editing]);

  const commitAdd = () => {
    const value = draft.trim();
    if (value) onAdd(value);
    setDraft("");
    setAdding(false);
  };

  const commitEdit = () => {
    if (editing === null) return;
    const next = editDraft.trim();
    if (next && next !== editing) {
      onEdit(editing, next);
    }
    setEditing(null);
  };

  const canAdd = tags.length < maxTags;
  const showPlaceholder = tags.length === 0 && !adding;

  return (
    <div
      className="flex h-[26px] items-center gap-2 rounded-[8px] px-[11px]"
      style={{
        background: SURFACE.subtle,
        border: `1px solid ${BORDER.input}`,
      }}
    >
      <TagIcon className="h-3.5 w-3.5 shrink-0" color={TEXT.muted} />

      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {showPlaceholder ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="truncate text-left"
            style={{
              color: TEXT.muted,
              fontSize: 12,
              lineHeight: "18px",
            }}
          >
            + 添加标签
          </button>
        ) : null}

        {tags.map((tag) => {
          const tone = chipToneFor(tag);
          const isEditing = editing === tag;
          if (isEditing) {
            return (
              <input
                key={tag}
                ref={editRef}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditing(null);
                }}
                className="rounded-full bg-transparent px-2 py-[1px] text-[11px] outline-none"
                style={{
                  background: tone.bg,
                  color: tone.text,
                  width: Math.max(editDraft.length, 3) * 8 + 16,
                }}
              />
            );
          }
          return (
            <span
              key={tag}
              className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-full px-2 py-[1px]"
              style={{
                background: tone.bg,
                color: tone.text,
                fontSize: 11,
                lineHeight: "16px",
              }}
            >
              <button
                type="button"
                className="max-w-[80px] truncate"
                onClick={() => {
                  setEditing(tag);
                  setEditDraft(tag);
                }}
              >
                {tag}
              </button>
              <button
                type="button"
                className="leading-none opacity-50 transition-opacity hover:opacity-100"
                onClick={() => onRemove(tag)}
                aria-label={`删除标签 ${tag}`}
              >
                ×
              </button>
            </span>
          );
        })}

        {adding ? (
          <input
            ref={addRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            placeholder="标签…"
            className="min-w-[48px] flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: TEXT.primary }}
          />
        ) : null}
      </div>

      {canAdd && !adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="shrink-0 transition-colors hover:opacity-80"
          aria-label="添加标签"
          style={{ color: TEXT.muted }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
