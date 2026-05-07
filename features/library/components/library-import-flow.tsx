"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (handles: string[]) => void;
}

// 简化版导入：粘贴 handle 列表，每行一个；上线时再扩展为 CSV / 平台粘贴。
export function LibraryImportFlow({ open, onClose, onImport }: Props) {
  const [text, setText] = useState("");
  if (!open) return null;
  const handles = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(20,20,19,0.32)] px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#c5c0b1] bg-[#fffefb]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#c5c0b1] px-4 py-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#201515]">
            <Upload className="h-4 w-4 text-[#ff4f00]" />
            导入名单
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#939084] hover:bg-[#fffdf9]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-3 px-4 py-4">
          <p className="text-[12px] text-[#36342e]">
            粘贴博主 handle 列表，每行一个。支持 @username 形式。
          </p>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            placeholder="@skincare_sam&#10;@fit_jenny&#10;@beautytipskaren"
            className="w-full rounded-xl border border-[#c5c0b1] bg-[#fffdf9] p-3 text-[13px] text-[#201515] outline-none placeholder:text-[#939084] focus:border-[#ff4f00]"
          />
          <div className="text-[11px] text-[#939084]">已识别 {handles.length} 位博主</div>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-[#c5c0b1] bg-[#fffdf9] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3.5 py-1.5 text-[12px] text-[#36342e] hover:bg-[#fffdf9]"
          >
            取消
          </button>
          <button
            type="button"
            disabled={handles.length === 0}
            onClick={() => {
              onImport(handles);
              setText("");
            }}
            className="rounded-full bg-[#ff4f00] px-3.5 py-1.5 text-[12px] font-medium text-[#fffefb] transition-colors hover:bg-[#ff4f00] disabled:cursor-not-allowed disabled:bg-[#c5c0b1]"
          >
            导入
          </button>
        </footer>
      </div>
    </div>
  );
}
