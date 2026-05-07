"use client";

import { useEffect } from "react";

interface Props {
  message: string | null;
  // 可选的"次要操作"按钮（比如"查看追踪看板"），点击后由调用方决定是否清除 toast。
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

// 轻量级 toast：只用于行级动作的 inline 反馈。复杂场景建议改用全局通知系统。
export function LibraryToast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 2800,
}: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#201515] px-5 py-2.5 text-[13px] text-[#fffefb]">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-[12px] font-medium text-[#fff7f4] transition-colors hover:text-[#fffefb]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
