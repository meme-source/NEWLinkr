"use client";

import { useState } from "react";
import { Plus, Tag, Trash2, X } from "lucide-react";
import type { Creator } from "@/types/api";

interface Props {
  creator: Creator;
}

type Note = {
  id: string;
  createdAt: string;
  body: string;
  tags: string[];
};

// Phase 1: 仅本地内存。Phase 2 接入服务时把 setState 替换为 mutation。
// 每条笔记带时间戳 + 多个 tag chip。
export function TabNotes({ creator }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleAdd = () => {
    const body = draft.trim();
    if (!body) return;
    setNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        createdAt: new Date().toISOString(),
        body,
        tags: draftTags,
      },
      ...prev,
    ]);
    setDraft("");
    setDraftTags([]);
    setTagInput("");
  };

  const addDraftTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (!draftTags.includes(v)) setDraftTags((prev) => [...prev, v]);
    setTagInput("");
  };

  const removeDraftTag = (tag: string) => {
    setDraftTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder={`记录关于 ${creator.handle} 的内部备注...`}
          className="w-full resize-none border-0 text-[13px] text-[#201515] outline-none placeholder:text-[#939084]"
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#eceae3] pt-2">
          <Tag className="h-3 w-3 text-[#939084]" />
          {draftTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-[#fff7f4] bg-[#fff7f4] px-2 py-0.5 text-[11px] text-[#ff4f00]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeDraftTag(tag)}
                aria-label={`移除标签 ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addDraftTag();
              }
            }}
            onBlur={addDraftTag}
            placeholder="加标签 (回车确认)"
            className="h-5 min-w-[100px] flex-1 bg-transparent text-[11px] text-[#201515] outline-none placeholder:text-[#b5b2aa]"
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={draft.trim().length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4f00] px-3 py-1 text-[11px] font-medium text-[#fffefb] transition-colors hover:bg-[#ff4f00] disabled:cursor-not-allowed disabled:bg-[#c5c0b1]"
          >
            <Plus className="h-3 w-3" /> 添加
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#c5c0b1] py-8 text-center text-[12px] text-[#939084]">
          暂无备注
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-3 text-[13px]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap text-[#201515]">{note.body}</p>
                <button
                  type="button"
                  onClick={() => setNotes((prev) => prev.filter((n) => n.id !== note.id))}
                  className="rounded-full p-1 text-[#939084] hover:bg-[#fdf2f2] hover:text-[#b00020]"
                  aria-label="删除"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[10px] text-[#36342e]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[10px] text-[#939084]">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
