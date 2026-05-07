"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  // 不传 onChange 时为只读。"全部博主" 视图下没有单一项目可写入，使用只读。
  onChange?: (next: string) => void;
}

const PLACEHOLDER = "双击编辑";

export function LibraryNotesCell({ value, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const readonly = !onChange;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (readonly) {
    return (
      <div className="truncate text-[12px] text-[#939084]" title={value}>
        {value || "—"}
      </div>
    );
  }

  if (editing) {
    const commit = () => {
      const trimmed = draft.trim();
      setEditing(false);
      if (trimmed !== value) onChange(trimmed);
    };
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            setDraft(value);
            setEditing(false);
          }
        }}
        placeholder={PLACEHOLDER}
        className="w-full rounded-md border border-[#ff4f00] bg-[#fffefb] px-1.5 py-0.5 text-[12px] text-[#201515] outline-none placeholder:text-[#939084]"
      />
    );
  }

  return (
    <button
      type="button"
      onDoubleClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      onClick={(event) => event.stopPropagation()}
      title={value ? `${value}（双击编辑）` : "双击编辑"}
      className={cn(
        "group flex w-full items-center gap-1 truncate rounded-md border border-dashed px-1.5 py-0.5 text-left text-[12px] transition-colors",
        value
          ? "border-transparent text-[#36342e] hover:border-[#c5c0b1] hover:bg-[#fffdf9]"
          : "border-[#c5c0b1] text-[#939084] hover:border-[#ff4f00] hover:text-[#ff4f00]",
      )}
    >
      <Pencil
        className={cn(
          "h-3 w-3 shrink-0 transition-opacity",
          value ? "opacity-0 group-hover:opacity-60" : "opacity-70",
        )}
      />
      <span className="truncate">{value || PLACEHOLDER}</span>
    </button>
  );
}
