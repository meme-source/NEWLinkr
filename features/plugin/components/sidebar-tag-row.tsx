"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { getTagChipClasses, getTagTone } from "@/features/plugin/lib/tags";
import { SIDEBAR_CONTROL_RADIUS } from "@/features/plugin/lib/style-constants";

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

  useEffect(() => { if (adding) addInputRef.current?.focus(); }, [adding]);
  useEffect(() => { if (editingLabel !== null) editInputRef.current?.select(); }, [editingLabel]);

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
      {/* Tag icon — outside the container */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b0aea6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="self-center flex-shrink-0">
        <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.71-7.71a1 1 0 0 0 0-1.41z"/>
        <circle cx="7" cy="7" r="1" fill="#b0aea6" stroke="none"/>
      </svg>

      {/* Unified container */}
      <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-hidden ${SIDEBAR_CONTROL_RADIUS} border border-[#e8e6dc] bg-white px-2.5 py-1.5`}>
        {/* Empty placeholder */}
        {tags.length === 0 && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#d1cfc5] px-2 py-0.5 text-xs text-[#b0aea6] transition-colors hover:border-[#c96442]/40 hover:text-[#c96442]"
          >
            <span>+ 添加标签</span>
          </button>
        )}

        {/* Tags */}
        {tags.map((tag) => {
          const tone = getTagTone(tag);
          const isEditing = editingLabel === tag;
          return (
            <span
              key={tag}
              onClick={() => { if (!isEditing) { setEditingLabel(tag); setEditValue(tag); } }}
              className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium cursor-pointer transition-all",
                getTagChipClasses(tone)
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
                  className="bg-transparent outline-none text-xs min-w-[24px]"
                />
              ) : (
                <>
                  <span className="max-w-full truncate">{tag}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
                    className="ml-0.5 flex-shrink-0 leading-none opacity-50 hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </>
              )}
            </span>
          );
        })}

        {/* Add input */}
        {adding && (
          <input
            ref={addInputRef}
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") { setAdding(false); setAddValue(""); }
            }}
            placeholder="标签…"
            style={{ width: Math.max(addValue.length, 4) * 7 + 20 }}
            className="min-w-[48px] bg-transparent text-xs text-[#141413] outline-none placeholder:text-[#b0aea6]"
          />
        )}

        {/* + button — pushed to right */}
        {tags.length < MAX_TAGS && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-auto flex-shrink-0 self-center text-[#b0aea6] text-sm leading-none transition-colors hover:text-[#c96442]"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
