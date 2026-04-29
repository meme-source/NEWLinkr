"use client";

import { useEffect } from "react";
import { Trash2 } from "lucide-react";

export function DeleteProjectConfirm({
  projectName,
  onCancel,
  onConfirm,
}: {
  projectName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#141413]/22 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="确认删除项目"
        className="relative w-full max-w-sm overflow-hidden rounded-[24px] border border-[#e8e6dc] bg-white p-6 text-[#141413] shadow-[0_30px_120px_-40px_rgba(77,76,72,0.28)]"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbeae6] text-[#9c403a]">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold">确认删除项目？</div>
            <p className="mt-1.5 text-[13px] leading-5 text-[#5e5d59]">
              即将删除项目
              <span className="mx-1 font-medium text-[#141413]">
                「{projectName}」
              </span>
              ，该项目的收藏、No、标签等数据将一并清除，且无法恢复。
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#e8e6dc] bg-white px-4 py-1.5 text-[13px] font-medium text-[#4d4c48] transition-colors hover:border-[#d1cfc5] hover:bg-[#f5f4ed]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#9c403a] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#823531]"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
