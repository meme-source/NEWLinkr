"use client";

import { useEffect } from "react";
import { FileText, Send, Users, X } from "lucide-react";

export function SearchResultPopup({
  total,
  modeLabel,
  onQuickScreen,
  onSequentialScreen,
  onDelete,
  onClose,
  closeButtonRef,
}: {
  total: string;
  modeLabel: string;
  onQuickScreen: () => void;
  onSequentialScreen: () => void;
  onDelete: () => void;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/18 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDelete();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="搜索结果弹窗"
        tabIndex={-1}
        className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-[#e8e6dc] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_55%,#f5f4ed_100%)] p-6 text-[#141413] shadow-[0_30px_120px_-40px_rgba(77,76,72,0.22)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,#c9644233,transparent_70%)]" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e6dc] bg-white px-3 py-1 text-xs text-[#c96442]">
              <Send className="h-3.5 w-3.5" />
              搜索完成，建议先确认下一步动作
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold">
                共找到 {total} 位相似博主
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5e5d59]">
              当前模式为&ldquo;{modeLabel}&rdquo;。你可以直接去后台批量筛选，也可以进入逐个筛选路径，逐位查看创作者主页。
            </p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onDelete}
            aria-label="关闭结果弹窗"
            className="relative z-10 rounded-full border border-[#e8e6dc] bg-white p-2 text-[#87867f] hover:bg-[#f5f4ed]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onQuickScreen}
            className="rounded-2xl border border-[#e8e6dc] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-[#f5f4ed]"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-[#87867f]" />
              快速筛选
            </div>
            <div className="mt-2 text-xs leading-5 text-[#5e5d59]">
              直接跳转后台，以列表方式查看全部相似博主并批量管理。
            </div>
          </button>
          <button
            type="button"
            onClick={onSequentialScreen}
            className="rounded-2xl border border-[#e8e6dc] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-[#f5f4ed]"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-[#87867f]" />
              逐个筛选
            </div>
            <div className="mt-2 text-xs leading-5 text-[#5e5d59]">
              逐一跳转博主主页，用悬浮助手完成找相似、收藏、No 和打标签。
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
