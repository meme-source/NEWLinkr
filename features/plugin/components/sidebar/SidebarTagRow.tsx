"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SIDEBAR_CONTROL_RADIUS, getTagChipClasses, getTagTone } from "./shared";

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
  const MAX_TAGS = 3;

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

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#939084"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 self-center"
      >
        <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.71-7.71a1 1 0 0 0 0-1.41z" />
        <circle cx="7" cy="7" r="1" fill="#939084" stroke="none" />
      </svg>

      <div
        className={`flex min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-hidden ${SIDEBAR_CONTROL_RADIUS} border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1.5`}
      >
        {tags.length === 0 && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#c5c0b1] px-2 py-0.5 text-xs text-[#939084] transition-colors hover:border-[#ff4f00]/40 hover:text-[#ff4f00]"
          >
            <span>+ 添加标签</span>
          </button>
        )}

        {tags.map((tag) => {
          const tone = getTagTone(tag);
          const isEditing = editingLabel === tag;
          return (
            <span
              key={tag}
              onClick={() => {
                if (!isEditing) {
                  setEditingLabel(tag);
                  setEditValue(tag);
                }
              }}
              className={cn(
                "inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-all",
                getTagChipClasses(tone),
              )}
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
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: Math.max(editValue.length, 3) * 7 + 4 }}
                  className="min-w-[24px] bg-transparent text-xs outline-none"
                />
              ) : (
                <>
                  <span className="max-w-full truncate">{tag}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(tag);
                    }}
                    className="ml-0.5 flex-shrink-0 leading-none opacity-50 transition-opacity hover:opacity-100"
                  >
                    ×
                  </button>
                </>
              )}
            </span>
          );
        })}

        {adding && (
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
            className="min-w-[48px] bg-transparent text-xs text-[#201515] outline-none placeholder:text-[#939084]"
          />
        )}

        {tags.length < MAX_TAGS && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-auto flex-shrink-0 self-center text-sm leading-none text-[#939084] transition-colors hover:text-[#ff4f00]"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
